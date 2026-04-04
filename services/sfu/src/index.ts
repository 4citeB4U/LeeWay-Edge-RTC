/*
LEEWAY HEADER — DO NOT REMOVE
REGION: SFU.BOOTSTRAP
TAG: SFU.ENTRY.MAIN
COLOR_ONION_HEX: NEON=#00FFD1 FLUO=#00B4FF PASTEL=#C7F0FF
ICON_ASCII: family=lucide glyph=server
5WH:
  WHAT = LeeWay SFU entry point — initialises mediasoup workers and HTTP/WS server
  WHY  = Bootstraps the production-grade, self-hosted WebRTC Selective Forwarding Unit
  WHO  = LeeWay Industries | LeeWay Innovation | Creator: Leonard Lee
  WHERE = services/sfu/src/index.ts
  WHEN = 2026
  HOW  = dotenv config load → createWorkers() → createServer() → agentRegistry.startAll()
AGENTS: ASSESS ALIGN AUDIT
LICENSE: PROPRIETARY
*/
import 'dotenv/config';
import { createWorkers, closeWorkers } from './mediasoup/worker.js';
import { createServer } from './server.js';
import { agentRuntime } from './agents/registry.js';
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
  agentRuntime.stopAll();
  await closeWorkers();
  process.exit(0);
};

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
