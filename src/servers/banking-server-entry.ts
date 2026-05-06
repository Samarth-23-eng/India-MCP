#!/usr/bin/env node
import { BankingServer } from './banking-server.js';

async function main() {
  const server = new BankingServer();
  await server.start();
}

main().catch((error) => {
  console.error('Failed to start Banking server:', error);
  process.exit(1);
});