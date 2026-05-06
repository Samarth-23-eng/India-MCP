import express from 'express';
import cors from 'cors';
import { z } from 'zod';
import { processManager } from './mcp-runner.js';
import { authenticate, AuthRequest } from './middleware.js';
import { prisma } from './db.js';
import { generateApiKey, hashKey, getPrefix } from './auth-utils.js';

const app = express();
app.use(cors());
app.use(express.json());

// --- Types ---
const ExecuteRequestSchema = z.object({
  server: z.string(),
  tool: z.string(),
  arguments: z.record(z.string(), z.any()).default({})
});

// --- Public Endpoints ---

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    activeServers: processManager.getActiveServerCount(),
    timestamp: new Date().toISOString()
  });
});

/**
 * Temporary Registration Endpoint
 * In a real app, this would be behind proper login (GitHub/Google)
 */
app.post('/auth/register', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  try {
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: { email, plan: 'free' }
    });

    const rawKey = generateApiKey();
    const hashed = hashKey(rawKey);

    const apiKey = await prisma.apiKey.create({
      data: {
        userId: user.id,
        keyHash: hashed,
        prefix: getPrefix(rawKey),
        name: 'Initial Key'
      }
    });

    res.json({
      success: true,
      apiKey: rawKey, // ONLY SHOWN ONCE
      user
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// --- Protected Endpoints ---

app.post('/execute', authenticate, async (req: AuthRequest, res) => {
  const start = Date.now();
  const parsed = ExecuteRequestSchema.parse(req.body);
  
  try {
    const result = await processManager.executeTool(parsed.server, parsed.tool, parsed.arguments);
    
    let responseData = result;
    let source = 'unknown';

    if (result && result.content && result.content.length > 0 && result.content[0].type === 'text') {
      try {
        const json = JSON.parse(result.content[0].text);
        responseData = json.data || json;
        source = json.source || 'stdio';
      } catch (e) {
        responseData = result.content[0].text;
      }
    }

    const latency = Date.now() - start;

    // Log Usage
    prisma.usageLog.create({
      data: {
        userId: req.user!.id,
        server: parsed.server,
        tool: parsed.tool,
        latency,
        success: true,
        source
      }
    }).catch(console.error);

    res.json({
      success: true,
      latency,
      source,
      data: responseData
    });

  } catch (error: any) {
    const latency = Date.now() - start;
    
    prisma.usageLog.create({
      data: {
        userId: req.user!.id,
        server: parsed.server,
        tool: parsed.tool,
        latency,
        success: false,
        error: error.message
      }
    }).catch(console.error);

    res.status(500).json({
      success: false,
      latency,
      error: error.message || 'Tool execution failed'
    });
  }
});

app.get('/dashboard/stats', authenticate, async (req: AuthRequest, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    const usageCount = await prisma.usageLog.count({
      where: {
        userId: req.user!.id,
        timestamp: { gte: today }
      }
    });

    const topTools = await prisma.usageLog.groupBy({
      by: ['server', 'tool'],
      where: { userId: req.user!.id },
      _count: { _all: true },
      orderBy: { _count: { _all: 'desc' } },
      take: 5
    });

    res.json({
      plan: req.user!.plan,
      usageToday: usageCount,
      topTools
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// --- Server Startup ---

const PORT = process.env.PORT || 3001;
const server = app.listen(PORT, () => {
  console.log(`🚀 India-MCP Gateway + Auth running at http://localhost:${PORT}`);
});

process.on('SIGTERM', async () => {
  await processManager.shutdownAll();
  server.close();
});
