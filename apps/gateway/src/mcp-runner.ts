import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface ServerInstance {
  client: Client;
  transport: StdioClientTransport;
  lastUsed: number;
}

export class MCPProcessManager {
  private instances: Map<string, ServerInstance> = new Map();
  // Connection pool timeout: close servers unused for 10 minutes
  private readonly IDLE_TIMEOUT_MS = 10 * 60 * 1000;

  constructor() {
    // Periodically clean up idle processes
    setInterval(() => this.cleanupIdleServers(), 60000).unref();
  }

  private getServerEntryPath(serverName: string): string {
    // Assumes gateway is in apps/gateway/dist/ and servers are in dist/servers/
    return resolve(__dirname, '../../../dist/servers', `${serverName}-server-entry.js`);
  }

  async getClient(serverName: string): Promise<Client> {
    const existing = this.instances.get(serverName);
    if (existing) {
      existing.lastUsed = Date.now();
      return existing.client;
    }

    console.log(`[Manager] Spawning new process for server: ${serverName}`);
    const entryPath = this.getServerEntryPath(serverName);
    
    const envDict: Record<string, string> = {};
    for (const [key, value] of Object.entries(process.env)) {
      if (value !== undefined) {
        envDict[key] = value;
      }
    }

    // Create transport to spawn the server process
    const transport = new StdioClientTransport({
      command: process.execPath, // e.g., 'node'
      args: [entryPath],
      env: envDict // Pass down ENV safely
    });

    const client = new Client(
      { name: 'india-mcp-gateway', version: '1.0.0' },
      { capabilities: {} }
    );

    await client.connect(transport);
    console.log(`[Manager] Connected to ${serverName} successfully`);

    this.instances.set(serverName, {
      client,
      transport,
      lastUsed: Date.now()
    });

    // Handle process crash/exit
    transport.onclose = () => {
      console.log(`[Manager] Transport closed for ${serverName}`);
      this.instances.delete(serverName);
    };

    return client;
  }

  async executeTool(serverName: string, toolName: string, args: any): Promise<any> {
    const client = await this.getClient(serverName);
    return await client.callTool({
      name: toolName,
      arguments: args
    });
  }

  private cleanupIdleServers() {
    const now = Date.now();
    for (const [name, instance] of this.instances.entries()) {
      if (now - instance.lastUsed > this.IDLE_TIMEOUT_MS) {
        console.log(`[Manager] Closing idle server: ${name}`);
        instance.client.close().catch(console.error);
        this.instances.delete(name);
      }
    }
  }

  async shutdownAll() {
    console.log('[Manager] Shutting down all MCP server processes...');
    const closePromises = Array.from(this.instances.values()).map(i => i.client.close());
    await Promise.allSettled(closePromises);
    this.instances.clear();
  }

  getActiveServerCount(): number {
    return this.instances.size;
  }
}

export const processManager = new MCPProcessManager();