import { IFSCAggregatorServer } from './server.js';

async function main() {
  const server = new IFSCAggregatorServer();
  await server.start();
}

main().catch((error) => {
  console.error('Failed to start IFSC/UPI server:', error);
  process.exit(1);
});