#!/usr/bin/env node
import { StocksServer } from './stocks-server.js';

async function main() {
  const server = new StocksServer();
  await server.start();
}

main().catch((error) => {
  console.error('Failed to start Stocks server:', error);
  process.exit(1);
});