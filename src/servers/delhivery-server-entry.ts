#!/usr/bin/env node
import { DelhiveryServer } from './delhivery-server.js';

async function main() {
  const server = new DelhiveryServer();
  await server.start();
}

main().catch((error) => {
  console.error('Failed to start Delhivery server:', error);
  process.exit(1);
});