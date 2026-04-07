/*
LEEWAY HEADER — DO NOT REMOVE
REGION: CORE.LEGACY.SECURE
TAG: CORE.INTERNAL.MODULE
COLOR_ONION_HEX: NEON=#00FFD1 FLUO=#00B4FF PASTEL=#C7F0FF
ICON_ASCII: family=lucide glyph=lock
5WH:
  WHAT = Migrated LeeWay SFU Internal Logic
  WHY  = Ensures baseline architectural compliance with the Living Organism integrity guard
  WHO  = LEEWAY INNOVATIONS A LEEWAY INDUSTY CREATION
  WHERE = services/sfu/src/
  WHEN = 2026
  HOW  = Governance Patch v43.4
AGENTS: AUDIT
LICENSE: PROPRIETARY
*/
import { Registry, collectDefaultMetrics, Counter, Gauge, Histogram } from 'prom-client';

export const registry = new Registry();
registry.setDefaultLabels({ service: 'leeway-sfu' });

collectDefaultMetrics({ register: registry });

export const metrics = {
  wsConnections: new Gauge({
    name: 'leeway_ws_connections_total',
    help: 'Current number of active WebSocket connections',
    registers: [registry],
  }),

  wsMessages: new Counter({
    name: 'leeway_ws_messages_total',
    help: 'Total WebSocket messages processed',
    labelNames: ['direction', 'type'] as const,
    registers: [registry],
  }),

  rooms: new Gauge({
    name: 'leeway_rooms_total',
    help: 'Current number of active rooms',
    registers: [registry],
  }),

  producers: new Gauge({
    name: 'leeway_producers_total',
    help: 'Current number of active producers',
    labelNames: ['kind'] as const,
    registers: [registry],
  }),

  consumers: new Gauge({
    name: 'leeway_consumers_total',
    help: 'Current number of active consumers',
    labelNames: ['kind'] as const,
    registers: [registry],
  }),

  signalingErrors: new Counter({
    name: 'leeway_signaling_errors_total',
    help: 'Total signaling errors',
    labelNames: ['reason'] as const,
    registers: [registry],
  }),

  transportCreation: new Histogram({
    name: 'leeway_transport_creation_seconds',
    help: 'Time to create a WebRTC transport',
    buckets: [0.01, 0.05, 0.1, 0.5, 1],
    registers: [registry],
  }),
};
