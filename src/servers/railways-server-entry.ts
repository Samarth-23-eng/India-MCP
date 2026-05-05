import { RailwaysServer } from './railways-server.js';

async function main() {
  const server = new RailwaysServer();
  await server.start();
}

main().catch((error) => {
  console.error('Failed to start Railways server:', error);
  process.exit(1);
});