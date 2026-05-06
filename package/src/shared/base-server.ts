import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { z, ZodSchema } from 'zod';

export abstract class BaseMCPServer {
  protected server: Server;
  protected abstract tools: Array<{
    name: string;
    description: string;
    inputSchema: ZodSchema;
    handler: (args: Record<string, unknown>) => Promise<unknown>;
  }>;

  constructor(
    public name: string,
    public version: string
  ) {
    this.server = new Server(
      { name: this.name, version: this.version },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: this.tools.map((tool) => ({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema,
        })),
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const tool = this.tools.find((t) => t.name === request.params.name);
      if (!tool) {
        throw new Error(`Tool not found: ${request.params.name}`);
      }
      const args = request.params.arguments as Record<string, unknown>;
      const result = await tool.handler(args);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    });
  }

  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error(`${this.name} v${this.version} started`);
  }
}

export { z };
export type RequestSchema = ZodSchema;