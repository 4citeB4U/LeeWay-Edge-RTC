import http from 'http';
import express from 'express';
import { WebSocketServer } from 'ws';
import { registry } from './metrics.js';
import { attachSignalingServer } from './signaling/handler.js';
import { issueToken } from './auth.js';
import { logger } from './logger.js';
import { config } from './config.js';

export async function createServer(): Promise<http.Server> {
  const app = express();
  app.use(express.json());

  // ─── Health ────────────────────────────────────────────────────────────────
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', ts: new Date().toISOString() });
  });

  // ─── Metrics (Prometheus) ──────────────────────────────────────────────────
  app.get('/metrics', async (_req, res) => {
    res.set('Content-Type', registry.contentType);
    res.end(await registry.metrics());
  });

  // ─── Dev-only: issue a token ────────────────────────────────────────────────
  // In production, token issuance should live in a separate auth service.
  // This endpoint is gated by NODE_ENV so it's not accidentally exposed.
  if (process.env['NODE_ENV'] !== 'production') {
    app.post('/dev/token', (req, res) => {
      const sub = (req.body as { sub?: string }).sub ?? 'anonymous';
      const token = issueToken({ sub });
      res.json({ token });
    });
  }

  const server = http.createServer(app);

  // ─── WebSocket ─────────────────────────────────────────────────────────────
  const wss = new WebSocketServer({ server, path: '/ws' });
  attachSignalingServer(wss);

  server.listen(config.httpPort, () => {
    logger.info({ port: config.httpPort }, 'LeeWay SFU server listening');
  });

  return server;
}
