import { spawn, ChildProcess } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { TimelineEvent } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ExecutionMetrics {
  requestCount: number;
  errorCount: number;
  totalLatencyMs: number;
  latenciesMs: number[];
  lastUsed: number;
}

interface ServerInstance {
  child: ChildProcess;
  lastUsed: number;
  executionCount: number;
  spawnedAt: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const MAX_CONCURRENT_PER_SERVER = 3;
const IDLE_TIMEOUT_MS           = 5 * 60 * 1000;      // 5 min idle → kill
const STALE_TIMEOUT_MS          = 90 * 1000;           // 90 s no activity → stale check
const GRACEFUL_KILL_TIMEOUT_MS  = 5000;                // SIGTERM grace period
const EXECUTION_TIMEOUT_MS      = 30 * 1000;           // Max per tool call

// ─── Process Manager ─────────────────────────────────────────────────────────

export class MCPProcessManager {
  private instances         = new Map<string, ServerInstance>();
  private activeExecutions = new Map<string, number>();

  // Metrics per server for /metrics
  readonly metrics = new Map<string, ExecutionMetrics>();

  private idleCleanupInterval: ReturnType<typeof setInterval> | null = null;
  private staleCheckInterval : ReturnType<typeof setInterval> | null = null;
  private activeServersDir: string;

  constructor(serversDir?: string) {
    this.activeServersDir = serversDir ?? resolve(__dirname, '../../../dist/servers');
    this.idleCleanupInterval = setInterval(() => this.cleanupIdleServers(), 30_000).unref();
    this.staleCheckInterval  = setInterval(() => this.checkStaleProcesses(), 15_000).unref();
  }

  private serverPath(name: string): string {
    return resolve(this.activeServersDir, `${name}-server-entry.js`);
  }

  private initMetrics(name: string): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, {
        requestCount: 0, errorCount: 0,
        totalLatencyMs: 0, latenciesMs: [], lastUsed: Date.now()
      });
    }
  }

  private recordLatency(name: string, ms: number, success: boolean): void {
    const m = this.metrics.get(name);
    if (!m) return;
    m.requestCount++;
    if (!success) m.errorCount++;
    m.totalLatencyMs += ms;
    m.latenciesMs.push(ms);
    if (m.latenciesMs.length > 1000) m.latenciesMs.shift();
    m.lastUsed = Date.now();
  }

  // ── Public executeTool ──────────────────────────────────────────────────────

  async executeTool(
    server: string,
    tool: string,
    args: Record<string, unknown>,
    requestId?: string
  ): Promise<{ result: unknown; timeline: TimelineEvent[]; source?: string }> {
    const timeline: TimelineEvent[] = [];
    const start = Date.now();
    const execKey = `${server}:${requestId ?? start}`;

    timeline.push({ phase: 'request_received', timestamp: start, elapsed: 0 });
    this.initMetrics(server);

    // Acquire slot
    const slot = this.acquireSlot(server);
    if (!slot) {
      this.recordLatency(server, Date.now() - start, false);
      throw new Error(`Server "${server}" is at maximum capacity (${MAX_CONCURRENT_PER_SERVER} concurrent). Please wait and retry.`);
    }

    try {
      const instance = await this.getOrSpawn(server);
      timeline.push({ phase: 'process_spawned', timestamp: Date.now(), elapsed: Date.now() - start });

      instance.lastUsed = Date.now();
      instance.executionCount++;

      const rpcReq = {
        jsonrpc: '2.0',
        id: start,
        method: 'tools/call',
        params: { name: tool, arguments: args }
      };

      timeline.push({ phase: 'executing', timestamp: Date.now(), elapsed: Date.now() - start });

      let result: unknown;
      try {
        result = await Promise.race([
          this.sendJsonRpc(instance.child, rpcReq, start),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(`Tool "${tool}" timed out after ${EXECUTION_TIMEOUT_MS}ms`)), EXECUTION_TIMEOUT_MS).unref()
          )
        ]);
      } catch (err) {
        // If child died, remove instance so next call re-spawns cleanly
        if (instance.child.exitCode !== null) {
          this.instances.delete(server);
        }
        throw err;
      }

      const elapsed = Date.now() - start;
      this.recordLatency(server, elapsed, true);
      timeline.push({ phase: 'completed', timestamp: Date.now(), elapsed });

      // Parse MCP content wrapper
      let data: unknown = result;
      let source = 'mcp';
      if (result && typeof result === 'object' && 'content' in (result as object)) {
        const content = ((result as Record<string, unknown>).content) as Array<{ type: string; text: string }>;
        if (content?.[0]?.type === 'text') {
          try {
            const parsed = JSON.parse(content[0].text);
            data = (parsed as { data?: unknown }).data ?? parsed;
            source = (parsed as { source?: string }).source ?? 'mcp';
          } catch { data = content[0].text; }
        }
      }

      return { result: data, timeline, source };

    } catch (err) {
      const elapsed = Date.now() - start;
      this.recordLatency(server, elapsed, false);
      timeline.push({ phase: 'error', timestamp: Date.now(), elapsed, error: String((err as Error).message) });
      throw err;
    } finally {
      this.releaseSlot(server);
      const inst = this.instances.get(server);
      if (inst) inst.lastUsed = Date.now();
    }
  }

  // ── Slot management ─────────────────────────────────────────────────────────

  private acquireSlot(server: string): boolean {
    const current = this.activeExecutions.get(server) ?? 0;
    if (current >= MAX_CONCURRENT_PER_SERVER) return false;
    this.activeExecutions.set(server, current + 1);
    return true;
  }

  private releaseSlot(server: string): void {
    const count = (this.activeExecutions.get(server) ?? 1) - 1;
    if (count <= 0) this.activeExecutions.delete(server);
    else this.activeExecutions.set(server, count);
  }

  // ── JSON-RPC over stdio ─────────────────────────────────────────────────────

  private sendJsonRpc(child: ChildProcess, req: unknown, reqId: number): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const id = (req as { id: unknown }).id;

      const onData = (chunk: Buffer) => {
        for (const raw of chunk.toString().split('\n')) {
          if (!raw.trim()) continue;
          try {
            const msg = JSON.parse(raw) as Record<string, unknown>;
            if (msg['id'] === id && msg['result'] !== undefined) {
              cleanup();
              resolve(msg['result']);
              return;
            }
            if (msg['id'] === id && msg['error']) {
              cleanup();
              reject(new Error((msg['error'] as { message?: string }).message ?? 'MCP error'));
              return;
            }
          } catch {}
        }
      };

      // MCP servers write logs to stderr — NOT errors. We fail only on
      // protocol-level errors detected on stdout, handled by onData.
      const onErr = (_chunk: Buffer) => {};

      const onExit = (code: number | null) => {
        if (code !== 0 && code !== null) {
          cleanup();
          reject(new Error(`MCP process exited unexpectedly (code ${code})`));
        }
      };

      function cleanup() {
        child.stdout?.removeListener('data', onData);
        child.stderr?.removeListener('data', onErr);
        child.removeListener('exit', onExit);
      }

      child.stdout?.on('data', onData);
      child.stderr?.on('data', onErr);
      child.once('exit', onExit);

      if (child.stdin?.writableEnded) {
        cleanup();
        reject(new Error('MCP stdin closed unexpectedly'));
        return;
      }

      child.stdin?.write(JSON.stringify(req) + '\n');

      // Safety timeout
      setTimeout(() => {
        cleanup();
        reject(new Error('MCP response timeout'));
      }, EXECUTION_TIMEOUT_MS + 1000).unref();
    });
  }

  // ── Server lifecycle ─────────────────────────────────────────────────────────

  private async getOrSpawn(name: string): Promise<ServerInstance> {
    const existing = this.instances.get(name);
    if (existing && !existing.child.killed && existing.child.exitCode === null) {
      return existing;
    }
    if (existing) this.instances.delete(name);
    return this.spawn(name);
  }

  private spawn(name: string): ServerInstance {
    const entry = this.serverPath(name);

    // Strip sensitive env vars before passing to child
    const blocked = ['API_KEY', 'SECRET', 'PASSWORD', 'TOKEN', 'PRIVATE_KEY', 'AUTH'];
    const safeEnv: Record<string, string> = {};
    for (const [k, v] of Object.entries(process.env)) {
      if (v === undefined) continue;
      if (blocked.some(b => k.toUpperCase().includes(b))) continue;
      safeEnv[k] = v;
    }

    const child = spawn(process.execPath, [entry], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...safeEnv, NODE_ENV: process.env.NODE_ENV ?? 'production' },
      detached: false,
    });

    const inst: ServerInstance = {
      child,
      lastUsed: Date.now(),
      executionCount: 0,
      spawnedAt: Date.now()
    };

    child.on('exit', (code, sig) => {
      console.log(`[Manager] "${name}" exited (code=${code} signal=${sig}). Removed from pool.`);
      this.instances.delete(name);
    });
    child.on('error', (e: Error) => {
      console.error(`[Manager] "${name}" error: ${e.message}`);
      this.instances.delete(name);
    });

    // Protect against stdin close
    child.stdin?.on('error', (e: NodeJS.ErrnoException) => {
      if (e.code !== 'EPIPE' && e.code !== 'ERR_STREAM_PIPE_DESTROYED') {
        console.error(`[Manager] stdin error for "${name}": ${e.message}`);
      }
    });

    console.log(`[Manager] Spawned "${name}" (pid=${child.pid})`);
    this.instances.set(name, inst);
    return inst;
  }

  private killServer(name: string): void {
    const inst = this.instances.get(name);
    if (!inst) return;
    const { child } = inst;

    if (child.killed || child.exitCode !== null) {
      this.instances.delete(name);
      return;
    }

    child.once('exit', () => this.instances.delete(name));
    child.kill('SIGTERM');

    setTimeout(() => {
      if (!child.killed) {
        console.warn(`[Manager] Force-killing "${name}" (pid=${child.pid})`);
        child.kill('SIGKILL');
      }
      this.instances.delete(name);
    }, GRACEFUL_KILL_TIMEOUT_MS).unref();
  }

  private cleanupIdleServers(): void {
    const now = Date.now();
    let n = 0;
    for (const [name, inst] of this.instances.entries()) {
      if (now - inst.lastUsed > IDLE_TIMEOUT_MS && !this.activeExecutions.has(name)) {
        console.log(`[Manager] Idle cleanup: killing "${name}" (idle ${Math.round((now - inst.lastUsed) / 1000)}s)`);
        this.killServer(name);
        n++;
      }
    }
    if (n > 0) console.log(`[Manager] Idle cleanup done. ${this.instances.size} servers remaining.`);
  }

  private checkStaleProcesses(): void {
    const now = Date.now();
    for (const [name, inst] of this.instances.entries()) {
      if (!this.activeExecutions.has(name) && now - inst.lastUsed > STALE_TIMEOUT_MS) {
        console.warn(`[Manager] Stale server: "${name}" (no activity ${Math.round((now - inst.lastUsed) / 1000)}s). Removing.`);
        this.killServer(name);
      }
    }
  }

  // ── Shutdown ────────────────────────────────────────────────────────────────

  async shutdownAll(): Promise<void> {
    console.log(`[Manager] Shutting down ${this.instances.size} server(s)...`);
    if (this.idleCleanupInterval) clearInterval(this.idleCleanupInterval);
    if (this.staleCheckInterval)  clearInterval(this.staleCheckInterval);

    const names = Array.from(this.instances.keys());
    await Promise.allSettled(names.map(async (name) => {
      this.killServer(name);
      await new Promise(r => setTimeout(r, GRACEFUL_KILL_TIMEOUT_MS));
    }));

    this.instances.clear();
    this.activeExecutions.clear();
    console.log('[Manager] All servers shut down.');
  }

  getActiveServerCount(): number {
    return this.instances.size;
  }

  getMetricsSnapshot(): Record<string, unknown> {
    const serverMetrics: Record<string, unknown> = {};
    for (const [name, m] of this.metrics.entries()) {
      const sorted = [...m.latenciesMs].sort((a, b) => a - b);
      const pct = (p: number) => sorted[Math.floor(sorted.length * p)] ?? 0;
      serverMetrics[name] = {
        requestCount: m.requestCount,
        errorCount: m.errorCount,
        successRate: m.requestCount > 0
          ? ((m.requestCount - m.errorCount) / m.requestCount * 100).toFixed(2) + '%'
          : '100%',
        avgLatencyMs: m.requestCount > 0 ? Math.round(m.totalLatencyMs / m.requestCount) : 0,
        p50LatencyMs: pct(0.50),
        p95LatencyMs: pct(0.95),
        p99LatencyMs: pct(0.99),
        lastUsed: new Date(m.lastUsed).toISOString()
      };
    }
    return {
      activeServers: this.instances.size,
      activeExecutions: Object.fromEntries(this.activeExecutions),
      uptime: process.uptime(),
      memoryUsageMB: Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100,
      servers: serverMetrics
    };
  }
}

export const processManager = new MCPProcessManager();
