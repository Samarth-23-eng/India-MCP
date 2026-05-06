#!/usr/bin/env node
import { ECourtsServer } from './ecourts-server.js';

async function main() {
  const server = new ECourtsServer();
  await server.start();
}

main().catch((error) => {
  console.error('Failed to start eCourts server:', error);
  process.exit(1);
});