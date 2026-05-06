/**
 * Docs generator — produces markdown files from metadata at runtime.
 * Run: npx ts-node --esm scripts/generate-docs.ts
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  TOOL_METADATA,
  SERVER_METADATA,
  WORKFLOW_METADATA,
  CATEGORIES,
  INDIA_MCP_METADATA,
} from '../src/metadata/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DOCS = resolve(__dirname, '../docs');

function save(filename: string, content: string): void {
  writeFileSync(resolve(DOCS, filename), content, 'utf8');
  console.error(`Generated docs/${filename}`);
}

// --- SERVERS.md ---

function generateServers(): string {
  const rows = SERVER_METADATA.map((s) =>
    `| **${s.name}** | ${s.categories.join(', ')} | ${s.toolCount} | ${s.stability === 'stable' ? '✅ Live' : '🧪 Beta'} | ${s.description} |`
  ).join('\n');

  const details = SERVER_METADATA.map((s) => {
    const tools = TOOL_METADATA
      .filter((t) => t.server === s.key)
      .map((t) => `- **\`${t.name}\`** — ${t.description}`)
      .join('\n');

    return `### ${s.name} \`india-mcp-${s.key}\`\n\n${s.longDescription}\n\n**Tools:**\n${tools}\n\n**Sources:** ${s.sources.join(', ')} | **Auth required:** ${s.requiresAuth ? 'Yes' : 'No'} | **Max risk:** ${s.maxRiskLevel}`;
  }).join('\n\n---\n\n');

  return `# India-MCP Server Catalog\n\n**${INDIA_MCP_METADATA.totalServers} servers · ${INDIA_MCP_METADATA.totalTools} tools**\n\n| Server | Categories | Tools | Status | Description |\n| :--- | :--- | :---: | :--- | :--- |\n${rows}\n\n---\n\n${details}\n`;
}

// --- TOOLS.md ---

function generateTools(): string {
  const byServer = SERVER_METADATA.map((server) => {
    const tools = TOOL_METADATA.filter((t) => t.server === server.key);
    const toolDocs = tools.map((t) => {
      const example = t.examples[0];
      const exampleBlock = example
        ? `\`\`\`json\n${JSON.stringify(example.args, null, 2)}\n\`\`\``
        : '';
      return `#### \`${t.name}\`\n${t.description}\n\n- **Tags:** ${t.tags.join(', ')}\n- **Risk:** ${t.riskLevel} | **Cache:** ${t.cacheTTLSeconds ? `${t.cacheTTLSeconds}s` : 'None'} | **Auth:** ${t.requiresAuth ? 'Required' : 'None'}\n- **Sources:** ${t.sources.join(', ')}\n\n${exampleBlock}`;
    }).join('\n\n');
    return `## ${server.name}\n\n${toolDocs}`;
  }).join('\n\n---\n\n');

  return `# India-MCP Tool Index\n\n**${INDIA_MCP_METADATA.totalTools} tools across ${INDIA_MCP_METADATA.totalServers} servers**\n\n${byServer}\n`;
}

// --- WORKFLOWS.md ---

function generateWorkflows(): string {
  const docs = WORKFLOW_METADATA.map((w) => {
    const steps = w.steps.map((s, i) =>
      `${i + 1}. **\`${s.tool}\`** (${s.server}) — ${s.description}${s.required ? '' : ' _(optional)_'}`
    ).join('\n');

    return `## ${w.name}\n\n${w.description}\n\n**Estimated time:** ${w.estimatedTime}\n\n**Use cases:** ${w.useCases.join(', ')}\n\n**Steps:**\n${steps}\n\n**Example prompt:**\n> ${w.examplePrompt}`;
  }).join('\n\n---\n\n');

  return `# India-MCP Workflow Packs\n\n${INDIA_MCP_METADATA.totalWorkflows} pre-built multi-server workflows for common AI agent tasks.\n\n${docs}\n`;
}

// --- run ---

mkdirSync(DOCS, { recursive: true });
save('SERVERS.md', generateServers());
save('TOOLS.md', generateTools());
save('WORKFLOWS.md', generateWorkflows());

console.error(`\nDone. ${INDIA_MCP_METADATA.totalTools} tools · ${INDIA_MCP_METADATA.totalServers} servers · ${INDIA_MCP_METADATA.totalWorkflows} workflows documented.`);
