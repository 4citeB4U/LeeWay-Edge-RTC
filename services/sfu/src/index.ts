import 'dotenv/config';
import { createWorkers, closeWorkers } from './mediasoup/worker.js';
import { createServer } from './server.js';
import { logger } from './logger.js';

async function main(): Promise<void> {
  await createWorkers();
  await createServer();
}

main().catch((err) => {
  logger.error({ err }, 'Fatal startup error');
  process.exit(1);
});

// Graceful shutdown
const shutdown = async (signal: string): Promise<void> => {
  logger.info({ signal }, 'Shutting down');
  await closeWorkers();
  process.exit(0);
};

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
