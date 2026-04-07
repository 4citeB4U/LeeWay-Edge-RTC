/*
LEEWAY HEADER — DO NOT REMOVE
REGION: SERVER.GUARDIAN.RUNTIME
TAG: GUARDIAN.RUNTIME.MODE
COLOR_ONION_HEX: NEON=#00FFD1 FLUO=#00B4FF PASTEL=#C7F0FF
ICON_ASCII: family=lucide glyph=cpu
5WH:
  WHAT = LeeWay Guardian Runtime Mode — three-tier performance/intelligence toggles
  WHY  = Single binary must survive on a Raspberry Pi 5 (Mode A), a beefy VPS
         (Mode C), and everything in between — without code changes; mode is set
         at startup or flipped at runtime via environment var or GOVERNOR agent
  WHO  = LEEWAY INNOVATIONS A LEEWAY INDUSTY CREATION
  WHERE = services/sfu/src/guardian/runtime-mode.ts
  WHEN = 2026
  HOW  = Singleton mutable state + typed config table.
         Guardian modules read getMode() / getModeConfig() at tick time so they
         automatically adapt without restart.
AGENTS: ASSESS ALIGN AUDIT GOVERNOR SCALER
LICENSE: PROPRIETARY
*/

import os from 'node:os';

// ─── Types ─────────────────────────────────────────────────────────────────────
/**
 * Mode A  ultra-light — rule-only agents, no LLM, minimal logging.  Raspberry Pi 5 safe.
 * Mode B  balanced    — one small optional LLM, watchers active, periodic summaries.
 * Mode C  full        — all agents active, richer diagnostics, deepest history.
 */
export type RuntimeMode = 'ultra-light' | 'balanced' | 'full';

export interface ModeConfig {
  /** Whether the optional LLM summary path is enabled. */
  enableLLM: boolean;
  /** Whether the metrics dashboard endpoint is active. */
  enableDashboard: boolean;
  /**
   * All agent periodic tick intervals are multiplied by this.
   * >1 = slower ticks = less CPU.  Ultra-light uses 3× to save Pi resources.
   */
  agentTickMultiplier: number;
  /** Maximum parallel guardian worker coroutines. */
  maxWorkers: number;
  /** Number of RTC stat snapshots kept in the rolling buffer. */
  statsBufferSize: number;
  /**
   * How often the SummaryWorker aggregates buffered stats and optionally
   * feeds the LLM.  0 = disabled.
   */
  summaryIntervalMs: number;
  /** Maximum log level emitted (pino level names). */
  logLevel: 'silent' | 'warn' | 'info' | 'debug' | 'trace';
}

// ─── Config table ─────────────────────────────────────────────────────────────
export const MODE_CONFIGS: Record<RuntimeMode, ModeConfig> = {
  'ultra-light': {
    enableLLM:            false,
    enableDashboard:      false,
    agentTickMultiplier:  3,
    maxWorkers:           1,
    statsBufferSize:      20,
    summaryIntervalMs:    0,
    logLevel:             'warn',
  },
  'balanced': {
    enableLLM:            true,
    enableDashboard:      true,
    agentTickMultiplier:  1,
    maxWorkers:           2,
    statsBufferSize:      100,
    summaryIntervalMs:    30_000,
    logLevel:             'info',
  },
  'full': {
    enableLLM:            true,
    enableDashboard:      true,
    agentTickMultiplier:  1,
    maxWorkers:           Math.max(2, os.cpus().length),
    statsBufferSize:      500,
    summaryIntervalMs:    10_000,
    logLevel:             'debug',
  },
};

// ─── Singleton state ──────────────────────────────────────────────────────────
let _current: RuntimeMode = _parseEnv();
const _listeners = new Set<(mode: RuntimeMode) => void>();

function _parseEnv(): RuntimeMode {
  const val = (process.env['LEEWAY_MODE'] ?? '').toLowerCase();
  if (val === 'ultra-light') return 'ultra-light';
  if (val === 'balanced')    return 'balanced';
  if (val === 'full')        return 'full';
  return 'balanced'; // safe default
}

// ─── Public API ───────────────────────────────────────────────────────────────
export function getMode(): RuntimeMode {
  return _current;
}

export function getModeConfig(): ModeConfig {
  return MODE_CONFIGS[_current];
}

/**
 * Switch modes at runtime (called by GOVERNOR / SCALER agents).
 * Fires all registered listeners synchronously.
 */
export function setMode(mode: RuntimeMode): void {
  if (mode === _current) return;
  _current = mode;
  for (const fn of _listeners) fn(mode);
}

/** Subscribe to mode changes.  Returns an unsubscribe function. */
export function onModeChange(fn: (mode: RuntimeMode) => void): () => void {
  _listeners.add(fn);
  return () => _listeners.delete(fn);
}
