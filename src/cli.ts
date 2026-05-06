#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// --- Server Registry ---

interface ServerEntry {
  name: string;
  description: string;
  entryFile: string;
}

const SERVERS: Record<string, ServerEntry> = {
  gst: {
    name: 'GST',
    description: 'Validate GSTINs, search HSN codes, and calculate taxes.',
    entryFile: 'gst-server-entry.js'
  },
  railways: {
    name: 'Railways',
    description: 'Live train status, PNR enquiry, and schedules.',
    entryFile: 'railways-server-entry.js'
  },
  rto: {
    name: 'RTO',
    description: 'Vehicle registration details and road tax calculator.',
    entryFile: 'rto-server-entry.js'
  },
  banking: {
    name: 'Banking',
    description: 'IFSC lookups, UPI VPA validation, and bank status.',
    entryFile: 'banking-server-entry.js'
  },
  stocks: {
    name: 'Stocks',
    description: 'Real-time NSE/BSE quotes, market indices, and history.',
    entryFile: 'stocks-server-entry.js'
  },
  ecourts: {
    name: 'eCourts',
    description: 'Court cases, orders, and cause list retrieval.',
    entryFile: 'ecourts-server-entry.js'
  },
  fssai: {
    name: 'FSSAI',
    description: 'Food business license verification and category lookup.',
    entryFile: 'fssai-server-entry.js'
  },
  delhivery: {
    name: 'Delhivery',
    description: 'Shipment tracking and serviceability checks.',
    entryFile: 'delhivery-server-entry.js'
  },
  digilocker: {
    name: 'DigiLocker',
    description: 'Access and verify government documents via DigiLocker.',
    entryFile: 'digilocker-server-entry.js'
  }
};

// --- Version ---

const require = createRequire(import.meta.url);
const pkg = require('../package.json') as { version: string };
const VERSION = pkg.version;

// --- Helpers ---

function printHelp(): void {
  const lines = [
    '',
    `  India-MCP CLI v${VERSION}`,
    '  Collection of MCP servers for Indian APIs.',
    '',
    '  Usage:',
    '    npx @samarth-23-eng/india-mcp <server>',
    '    npx @samarth-23-eng/india-mcp list',
    '    npx @samarth-23-eng/india-mcp --help',
    '    npx @samarth-23-eng/india-mcp --version',
    '',
    '  Available Servers:',
  ];

  for (const [key, entry] of Object.entries(SERVERS)) {
    lines.push(`    ${key.padEnd(12)}  ${entry.description}`);
  }

  lines.push('');
  lines.push('  Examples:');
  lines.push('    npx @samarth-23-eng/india-mcp stocks');
  lines.push('    npx @samarth-23-eng/india-mcp gst');
  lines.push('    npx @samarth-23-eng/india-mcp ecourts');
  lines.push('');

  console.error(lines.join('\n'));
}

function printList(): void {
  const lines = ['', '  Available India-MCP Servers:', ''];
  for (const [key, entry] of Object.entries(SERVERS)) {
    lines.push(`  • ${key.padEnd(12)}  ${entry.description}`);
  }
  lines.push('');
  console.error(lines.join('\n'));
}

function printUnknown(cmd: string): void {
  console.error(`\n  Error: Unknown server "${cmd}"`);
  console.error(`  Run "india-mcp list" to see all available servers.\n`);
}

function launchServer(serverKey: string): void {
  const entry = SERVERS[serverKey];
  if (!entry) {
    printUnknown(serverKey);
    process.exit(1);
  }

  const serverPath = resolve(__dirname, 'servers', entry.entryFile);

  const child = spawn(process.execPath, [serverPath], {
    stdio: 'inherit',
    env: process.env
  });

  child.on('error', (err) => {
    console.error(`\n  Failed to start ${entry.name} server: ${err.message}\n`);
    process.exit(1);
  });

  child.on('exit', (code) => {
    process.exit(code ?? 0);
  });
}

// --- Main ---

const args = process.argv.slice(2);
const cmd = args[0];

if (!cmd || cmd === '--help' || cmd === '-h' || cmd === 'help') {
  printHelp();
} else if (cmd === '--version' || cmd === '-v') {
  console.error(VERSION);
} else if (cmd === 'list') {
  printList();
} else {
  launchServer(cmd);
}
