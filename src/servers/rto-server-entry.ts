#!/usr/bin/env node
import { RTOServer } from './rto-server.js';

async function main() {
  const server = new RTOServer();
  await server.start();
}

main().catch((error) => {
  console.error('Failed to start RTO server:', error);
  process.exit(1);
});