/*
LEEWAY HEADER — DO NOT REMOVE
REGION: SFU.SERVER
TAG: SFU.HTTP.WEBSOCKET.SERVER
COLOR_ONION_HEX: NEON=#00FFD1 FLUO=#00B4FF PASTEL=#C7F0FF
ICON_ASCII: family=lucide glyph=network
5WH:
  WHAT = LeeWay SFU HTTP + WebSocket server with agent REST endpoints
  WHY  = Exposes /health, /metrics, /agents, /dev/token and WS signaling
  WHO  = LeeWay Industries | LeeWay Innovation | Creator: Leonard Lee
  WHERE = services/sfu/src/server.ts
  WHEN = 2026
  HOW  = Express HTTP + ws.WebSocketServer + agentRegistry REST layer
AGENTS: ASSESS ALIGN AUDIT
LICENSE: PROPRIETARY
*/
import http from 'http';
import express from 'express';
import { WebSocketServer } from 'ws';
import { registry } from './metrics.js';
import { attachSignalingServer } from './signaling/handler.js';
import { issueToken } from './auth.js';
import { logger } from './logger.js';
import { config } from './config.js';
import { agentRegistry, agentRuntime, agentBus } from './agents/registry.js';

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

  // ─── Agents REST ────────────────────────────────────────────────────────────
  app.get('/agents', (_req, res) => {
    res.json(agentRegistry.getAllSnapshots());
  });

  app.get('/agents/:codename', (req, res) => {
    const snap = agentRegistry.getSnapshot(req.params['codename'] ?? '');
    if (!snap) { res.status(404).json({ error: 'Agent not found' }); return; }
    res.json(snap);
  });

  // Agent runtime status summary
  app.get('/agents/runtime/status', (_req, res) => {
    res.json(agentRuntime.getStatus());
  });

  // Suspend / resume directives (operator only — no public exposure)
  if (process.env['NODE_ENV'] !== 'production') {
    app.post('/agents/:codename/suspend', (req, res) => {
      const { codename } = req.params as { codename: string };
      const reason = (req.body as { reason?: string }).reason ?? 'operator request';
      const ok = agentRuntime.suspend(codename, reason);
      res.json({ ok, codename, reason });
    });
    app.post('/agents/:codename/resume', (req, res) => {
      const { codename } = req.params as { codename: string };
      const reason = (req.body as { reason?: string }).reason ?? 'operator request';
      const ok = agentRuntime.resume(codename, reason);
      res.json({ ok, codename, reason });
    });
  }

  const server = http.createServer(app);

  // ─── WebSocket ─────────────────────────────────────────────────────────────
  const wss = new WebSocketServer({ server, path: '/ws' });
  attachSignalingServer(wss);

  server.listen(config.httpPort, () => {
    logger.info({ port: config.httpPort }, 'LeeWay SFU server listening');
    // Wire the bus broadcast to the runtime before starting agents
    agentRuntime.setBroadcast((event) => agentBus.broadcast(event));
    agentRegistry.startAll();
  });

  return server;
}
