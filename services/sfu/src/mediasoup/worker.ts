import * as mediasoup from 'mediasoup';
import type { Worker } from 'mediasoup/node/lib/WorkerTypes.js';
import { config } from '../config.js';
import { logger } from '../logger.js';

const workers: Worker[] = [];
let nextWorkerIndex = 0;

/**
 * Spawn mediasoup workers (one per CPU core by default).
 */
export async function createWorkers(): Promise<void> {
  const { numWorkers, rtcMinPort, rtcMaxPort } = config.mediasoup;
  logger.info({ numWorkers }, 'Creating mediasoup workers');

  for (let i = 0; i < numWorkers; i++) {
    const worker = await mediasoup.createWorker({
      logLevel: 'warn',
      logTags: ['info', 'ice', 'dtls', 'rtp', 'srtp', 'rtcp'],
      rtcMinPort,
      rtcMaxPort,
    });

    worker.on('died', (error) => {
      logger.error({ pid: worker.pid, error }, 'mediasoup worker died – exiting');
      process.exit(1);
    });

    workers.push(worker);
    logger.info({ pid: worker.pid, index: i }, 'mediasoup worker created');
  }
}

/**
 * Round-robin worker selection.
 */
export function getNextWorker(): Worker {
  if (workers.length === 0) throw new Error('No mediasoup workers available');
  const worker = workers[nextWorkerIndex % workers.length];
  nextWorkerIndex = (nextWorkerIndex + 1) % workers.length;
  return worker;
}

/**
 * Gracefully close all workers.
 */
export async function closeWorkers(): Promise<void> {
  for (const worker of workers) {
    worker.close();
  }
  workers.length = 0;
}
