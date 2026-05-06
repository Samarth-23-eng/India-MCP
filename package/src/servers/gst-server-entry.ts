import { GSTServer } from './gst-server.js';

async function main() {
  const server = new GSTServer();
  await server.start();
}

main().catch((error) => {
  console.error('Failed to start GST server:', error);
  process.exit(1);
});