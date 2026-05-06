#!/usr/bin/env node
import { DigiLockerServer } from './digilocker-server.js';

async function main() {
  const server = new DigiLockerServer();
  await server.start();
}

main().catch((error) => {
  console.error('Failed to start DigiLocker server:', error);
  process.exit(1);
});