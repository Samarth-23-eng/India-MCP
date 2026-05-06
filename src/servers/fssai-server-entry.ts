#!/usr/bin/env node
import { FSSAIServer } from './fssai-server.js';

async function main() {
  const server = new FSSAIServer();
  await server.start();
}

main().catch((error) => {
  console.error('Failed to start FSSAI server:', error);
  process.exit(1);
});