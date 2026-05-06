/**
 * Unified metadata barrel for the India-MCP ecosystem.
 * Import everything from here for discovery, docs generation, and dashboards.
 *
 * @example
 * import { TOOL_METADATA, SERVER_METADATA, WORKFLOW_METADATA, CATEGORIES } from './metadata/index.js';
 */

export * from './categories.js';
export * from './tool-metadata.js';
export * from './server-metadata.js';
export * from './workflow-metadata.js';

// --- Convenience aggregates ---

import { TOOL_METADATA } from './tool-metadata.js';
import { SERVER_METADATA } from './server-metadata.js';
import { WORKFLOW_METADATA } from './workflow-metadata.js';
import { CATEGORIES, CATEGORY_LIST } from './categories.js';

export const INDIA_MCP_METADATA = {
  totalTools: TOOL_METADATA.length,
  totalServers: SERVER_METADATA.length,
  totalWorkflows: WORKFLOW_METADATA.length,
  totalCategories: CATEGORY_LIST.length,
  servers: SERVER_METADATA,
  tools: TOOL_METADATA,
  workflows: WORKFLOW_METADATA,
  categories: CATEGORIES,
};
