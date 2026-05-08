import 'dotenv/config';
import express, { Request, Response } from 'express';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { processManager } from './mcp-runner.js';
import type { TimelineEvent } from './types.js';
import { authenticate, AuthRequest } from './middleware.js';
import { prisma } from './db.js';
import { generateApiKey, hashKey, getPrefix } from './auth-utils.js';
import { createRateLimiter } from './rate-limiter.js';
import { createAbuseDetector } from './abuse-detector.js';
import type { RateLimiterStore } from './rate-limiter.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const app = express();

app.use(express.json({ limit: '1mb' }));
app.use(corsMiddleware());

// ─── CORS ────────────────────────────────────────────────────────────────────

// CORS configuration - allowed origins from environment variable
// Format: comma-separated list of allowed origins
// Example: ALLOWED_ORIGINS=http://localhost:3000,https://example.com
const allowedOriginsEnv = process.env.ALLOWED_ORIGINS ?? ''
const defaultAllowedOrigins = [
  'http://localhost:3000',
  'https://india-mcp.vercel.app',
  'https://india-mcp-playground.vercel.app',
  // Add your Railway deployment domain here or via ALLOWED_ORIGINS env var
]
const allAllowedOrigins = allowedOriginsEnv
  ? [...defaultAllowedOrigins, ...allowedOriginsEnv.split(',').map(s => s.trim())]
  : defaultAllowedOrigins

function corsMiddleware() {
  return (req: Request, res: Response, next: () => void) => {
    const origin = req.headers.origin;
    const allowed = !origin || allAllowedOrigins.includes(origin)
    res.setHeader('Access-Control-Allow-Origin', allowed ? (origin ?? '*') : '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Request-ID');
    res.setHeader('Access-Control-Max-Age', '86400');
    if (req.method === 'OPTIONS') { res.status(204).end(); return; }
    next();
  };
}

// ─── Startup Verification ────────────────────────────────────────────────────

async function verifyStartup(): Promise<void> {
  const checks: Array<{ name: string; pass: boolean; detail: string }> = [];

  // 1. MCP servers compiled
  try {
    const { readdirSync } = await import('fs');
    const servers = readdirSync(resolve(__dirname, '../../../dist/servers'))
      .filter(f => f.endsWith('-server-entry.js'))
      .map(f => f.replace('-server-entry.js', ''));
    checks.push({ name: 'MCP servers', pass: servers.length > 0, detail: `${servers.length} found: ${servers.join(', ')}` });
  } catch {
    checks.push({ name: 'MCP servers', pass: false, detail: 'dist/servers/ not found' });
  }

  // 2. Prisma client + DB
  try {
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
    checks.push({ name: 'Database', pass: true, detail: 'SQLite connected' });
  } catch (e: any) {
    checks.push({ name: 'Database', pass: false, detail: e.message });
  }

  // 3. Required env vars
  const requiredEnv = ['DATABASE_URL'];
  for (const env of requiredEnv) {
    const val = process.env[env];
    checks.push({ name: `ENV: ${env}`, pass: !!val, detail: val ? `✓ set` : 'MISSING' });
  }

  const failures = checks.filter(c => !c.pass);
  console.log('\n[Startup] Verification:');
  checks.forEach(c => console.log(`  ${c.pass ? '✓' : '✗'} ${c.name}: ${c.detail}`));

  if (failures.length > 0) {
    throw new Error(`Startup failed: ${failures.map(f => f.name).join(', ')}`);
  }
  console.log('[Startup] All checks passed.\n');
}

// ─── Rate Limiter ────────────────────────────────────────────────────────────

const rateLimiter: RateLimiterStore = createRateLimiter();

// ─── Abuse Detector ──────────────────────────────────────────────────────────

const abuseDetector = createAbuseDetector();

function checkAbuse(ip: string, apiKeyId?: string): { blocked: boolean; reason: string } | null {
  const report = abuseDetector.check(undefined, apiKeyId, ip);
  if (report?.blocked) return { blocked: true, reason: report.reason };
  return null;
}

// ─── Schemas ─────────────────────────────────────────────────────────────────

import { z } from 'zod';

const ExecuteSchema = z.object({
  server: z.string().min(1).max(64).describe('MCP server name (e.g. stocks, gst)'),
  tool:   z.string().min(1).max(128).describe('Tool name to execute'),
  arguments: z.record(z.string(), z.any()).default({}).describe('Tool arguments as key-value pairs')
});

const RegisterSchema = z.object({
  email: z.string().email().max(254).describe('Email address for the account')
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function clientIp(req: Request): string {
  return (req.headers['x-forwarded-for'] as string | undefined
    ?? req.ip
    ?? req.socket.remoteAddress
    ?? 'unknown').split(',')[0].trim().replace(/^::ffff:/, '');
}

function json(res: Response, status: number, data: unknown) {
  res.status(status).json(data);
}

// ─── Rate Limit Middleware ───────────────────────────────────────────────────

app.use((req: Request, res: Response, next: () => void) => {
  const ip = clientIp(req);

  // 200 req/min per IP (unauthenticated)
  const ipResult = rateLimiter.check(ip, 'ip', 200, 60_000);
  if (!ipResult.allowed) {
    res.set('Retry-After', String(Math.ceil(ipResult.retryAfterMs / 1000)));
    res.set('X-RateLimit-Limit', '200');
    res.set('X-RateLimit-Remaining', '0');
    res.set('X-RateLimit-Reset', String(Math.ceil(ipResult.resetInMs / 1000)));
    return res.status(429).json({ success: false, error: 'IP rate limit exceeded.', retryAfterMs: ipResult.retryAfterMs });
  }

  // 100 req/min per API key (authenticated)
  if (req.headers.authorization?.startsWith('Bearer ')) {
    const key = req.headers.authorization.slice(7);
    const keyResult = rateLimiter.check(hashKey(key), 'key', 100, 60_000);
    if (!keyResult.allowed) {
      res.set('Retry-After', String(Math.ceil(keyResult.retryAfterMs / 1000)));
      return res.status(429).json({ success: false, error: 'API key rate limit exceeded.', retryAfterMs: keyResult.retryAfterMs });
    }
  }

  next();
});

// ─── Public Endpoints ────────────────────────────────────────────────────────

app.get('/health', (_req, res) => {
  const m = processManager.getMetricsSnapshot() as Record<string, unknown>;
  res.json({
    status: 'ok',
    uptime: Math.round(process.uptime()),
    activeServers: m['activeServers'],
    timestamp: new Date().toISOString()
  });
});

app.get('/health/deep', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'ok', db: 'connected',
      servers: processManager.getActiveServerCount(),
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString()
    });
  } catch (e: any) {
    res.status(503).json({ status: 'degraded', db: 'disconnected', error: e.message });
  }
});

app.get('/metrics', (_req, res) => {
  const m = processManager.getMetricsSnapshot();
  res.json({ ...m, rateLimiting: rateLimiter.getStats(), timestamp: new Date().toISOString() });
});

app.get('/servers', (_req, res) => {
  const m = processManager.getMetricsSnapshot() as { activeServers: number; servers: Record<string, unknown> };
  const active = Object.keys(m.servers ?? {});
  res.json({ total: active.length, active: active.length, servers: active });
});

app.post('/auth/register', async (req: Request, res: Response) => {
  const ip = clientIp(req);

  // Abuse gate
  const abuse = checkAbuse(ip);
  if (abuse) return json(res, 429, { success: false, error: abuse.reason });

  // Validate
  const parsed = RegisterSchema.safeParse(req.body);
  if (!parsed.success) {
    return json(res, 400, { success: false, error: `Invalid email: ${parsed.error.issues.map(i => i.message).join('; ')}` });
  }
  const { email } = parsed.data;

  try {
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: { email, plan: 'free' }
    });

    const rawKey = generateApiKey();
    const hashed = hashKey(rawKey);

    await prisma.apiKey.create({
      data: { userId: user.id, keyHash: hashed, prefix: getPrefix(rawKey), name: 'Initial Key' }
    });

    abuseDetector.recordRegistration(ip);

    res.status(201).json({ success: true, apiKey: rawKey, user: { id: user.id, email: user.email, plan: user.plan } });
  } catch (err: any) {
    if (err.code === 'P2002') {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        return res.json({ success: true, apiKey: null, user: { id: existing.id, email: existing.email, plan: existing.plan }, note: 'User already exists.' });
      }
    }
    console.error('[Auth] Registration error:', err.message);
    json(res, 500, { success: false, error: 'Registration failed. Please try again.' });
  }
});

// ─── Protected Endpoints ─────────────────────────────────────────────────────

app.post('/execute', authenticate, async (req: AuthRequest, res: Response) => {
  const reqId = `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const start = Date.now();
  const ip = clientIp(req);

  // Abuse gate
  const abuse = checkAbuse(ip, req.apiKeyId);
  if (abuse) return json(res, 429, { success: false, error: abuse.reason, blocked: true });

  // Input validation
  const parsed = ExecuteSchema.safeParse(req.body);
  if (!parsed.success) {
    return json(res, 400, {
      success: false,
      error: `Invalid request: ${parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ')}`
    });
  }

  const { server, tool, arguments: args } = parsed.data;
  const timeline: TimelineEvent[] = [{ phase: 'request_received', timestamp: start, elapsed: 0 }];

  try {
    timeline.push({ phase: 'auth_validated', timestamp: Date.now(), elapsed: Date.now() - start });

    const execResult = await processManager.executeTool(server, tool, args, reqId);
    timeline.push(...execResult.timeline);

    const latency = Date.now() - start;

    // Fire-and-forget DB log
    prisma.usageLog.create({ data: {
      userId: req.user!.id, server, tool, latency,
      success: true, source: execResult.source ?? 'mcp'
    }}).catch(console.error);

    abuseDetector.recordExecution(undefined, req.apiKeyId, ip, latency);

    res.json({
      success: true, requestId: reqId, latency,
      source: execResult.source ?? 'mcp', timeline, data: execResult.result
    });

  } catch (err: any) {
    const latency = Date.now() - start;
    timeline.push({ phase: 'error', timestamp: Date.now(), elapsed: latency, error: err.message });

    const status = err.message.includes('capacity') || err.message.includes('timeout') || err.message.includes('maximum') ? 503 : 500;

    prisma.usageLog.create({ data: {
      userId: req.user!.id, server, tool, latency,
      success: false, error: err.message
    }}).catch(console.error);

    json(res, status, { success: false, requestId: reqId, latency, timeline, error: err.message });
  }
});

app.get('/dashboard/stats', authenticate, async (req: AuthRequest, res: Response) => {
  const today = new Date(); today.setHours(0, 0, 0, 0);

  try {
    const [usageCount, recentLogs, topTools] = await Promise.all([
      prisma.usageLog.count({ where: { userId: req.user!.id, timestamp: { gte: today } } }),
      prisma.usageLog.findMany({
        where: { userId: req.user!.id, timestamp: { gte: today } },
        select: { server: true, tool: true, latency: true, success: true, timestamp: true },
        orderBy: { timestamp: 'desc' }, take: 20
      }),
      prisma.usageLog.groupBy({
        by: ['server', 'tool'], where: { userId: req.user!.id },
        _count: { id: true }, orderBy: { _count: { id: 'desc' } }, take: 5
      })
    ]);

    res.json({
      plan: req.user!.plan,
      usageToday: usageCount,
      recentLogs: recentLogs.map(l => ({
        server: l.server, tool: l.tool, latency: l.latency,
        success: l.success, time: l.timestamp
      })),
      topTools: topTools.map(t => ({ server: t.server, tool: t.tool, count: t._count.id }))
    });
  } catch {
    json(res, 500, { error: 'Failed to load dashboard stats.' });
  }
});

// ─── 404 Handler ─────────────────────────────────────────────────────────────

app.use((_req: Request, res: Response) => {
  json(res, 404, { error: 'Not found. Available routes: GET /health, /health/deep, /metrics, /servers, POST /auth/register, POST /execute' });
});

// ─── Graceful Shutdown ───────────────────────────────────────────────────────

const PORT = parseInt(process.env.PORT ?? '3001', 10);
let httpServer: ReturnType<typeof app.listen> | null = null;

async function start(): Promise<void> {
  await verifyStartup();
  httpServer = app.listen(PORT, () => {
    console.log(`\\n🚀 India-MCP Gateway  |  http://localhost:${PORT}`);
    console.log(`   Health      GET  /health`);
    console.log(`   Deep Health GET  /health/deep`);
    console.log(`   Metrics     GET  /metrics`);
    console.log(`   Servers     GET  /servers`);
    console.log(`   Register    POST /auth/register`);
    console.log(`   Execute     POST /execute  (Bearer auth)\\n`);
  });
}

async function shutdown(signal: string): Promise<void> {
  console.log(`\\n[Shutdown] ${signal} — starting graceful shutdown...`);
  if (httpServer) httpServer.close(() => console.log('[Shutdown] HTTP server closed.'));
  await processManager.shutdownAll();
  try { await prisma.$disconnect(); console.log('[Shutdown] Prisma disconnected.'); } catch {}
  console.log('[Shutdown] Complete.');
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));
process.on('SIGHUP',  () => shutdown('SIGHUP'));
process.on('uncaughtException', (e: Error) => {
  console.error('[Fatal] Uncaught exception:', e.message);
  shutdown('uncaughtException').catch(() => process.exit(1));
});
process.on('unhandledRejection', (r: unknown) => {
  console.error('[Fatal] Unhandled rejection:', r);
});

start().catch((e: Error) => { console.error('[Startup] Fatal:', e.message); process.exit(1); });
