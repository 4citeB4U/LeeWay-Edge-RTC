/*
LEEWAY HEADER — DO NOT REMOVE
REGION: SERVER.GUARDIAN.SUMMARY
TAG: GUARDIAN.SLOW-LANE.SUMMARY-WORKER
COLOR_ONION_HEX: NEON=#00FFD1 FLUO=#00B4FF PASTEL=#C7F0FF
ICON_ASCII: family=lucide glyph=file-text
5WH:
  WHAT = LeeWay Summary Worker — slow-lane aggregator and optional LLM bridge
  WHY  = Keeps 10-30 second rolling summaries of system state without ever sending
         raw stat arrays to an LLM; in Mode A the LLM path is completely disabled
         and summarisation still runs for the dashboard log; in Mode B/C it emits
         compact JSON briefings to whichever local model endpoint is configured
  WHO  = LeeWay Industries | LeeWay Innovation | Creator: Leonard Lee
  WHERE = services/sfu/src/guardian/summary-worker.ts
  WHEN = 2026
  HOW  = Consumes StatsBuffer.toCompactJSON() at summaryIntervalMs cadence.
         Builds a SystemBriefing plain object. In LLM-enabled modes, POSTs the
         briefing to a configurable local HTTP endpoint (e.g. llama.cpp server,
         Ollama) using the native fetch API. No vendor SDK, no cloud calls.
         Retry is suppressed -- stale briefings are fine; we never queue backpressure.
AGENTS: NEXUS ARIA GOVERNOR
LICENSE: PROPRIETARY
*/

import type { StatsBuffer, StatsSnapshot } from './stats-worker';
import { getModeConfig } from './runtime-mode';

// ─── Types ─────────────────────────────────────────────────────────────────────
export interface SystemBriefing {
  /** ISO timestamp. */
  ts: string;
  /** Average peer health score 0-100. */
  avgHealth: number;
  /** Number of peers with score below threshold. */
  criticalPeers: number;
  /** Total connected peers. */
  totalPeers: number;
  /** Active runtime mode at time of summary. */
  mode: string;
  /** Concise bullet-point summary lines. */
  bullets: string[];
  /** Raw compact JSON from StatsBuffer for LLM context. */
  rawContext?: object;
}

export interface LLMResponse {
  text: string;
  model: string;
  latencyMs: number;
}

// ─── SummaryWorker ────────────────────────────────────────────────────────────
export class SummaryWorker {
  private _timer: ReturnType<typeof setInterval> | null = null;
  private _lastBriefing: SystemBriefing | null = null;
  private _lastLLMResponse: LLMResponse | null = null;

  constructor(
    private readonly _buffer: StatsBuffer,
    private readonly _llmEndpoint?: string, // e.g. "http://localhost:11434/api/generate"
    private readonly _llmModel?: string,    // e.g. "phi3:mini"
  ) {}

  start(): void {
    const cfg = getModeConfig();
    if (cfg.summaryIntervalMs <= 0) return; // Mode A — disabled
    this._timer = setInterval(() => void this._tick(), cfg.summaryIntervalMs);
  }

  stop(): void {
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
  }

  get lastBriefing(): SystemBriefing | null { return this._lastBriefing; }
  get lastLLMResponse(): LLMResponse | null { return this._lastLLMResponse; }

  // ─── Tick ─────────────────────────────────────────────────────────────────
  private async _tick(): Promise<void> {
    const latest = this._buffer.latest();
    if (!latest) return;

    const briefing = this._buildBriefing(latest);
    this._lastBriefing = briefing;

    const cfg = getModeConfig();
    if (cfg.enableLLM && this._llmEndpoint) {
      await this._queryLLM(briefing);
    }
  }

  // ─── Build briefing ───────────────────────────────────────────────────────
  private _buildBriefing(snapshot: StatsSnapshot): SystemBriefing {
    const cfg = getModeConfig();
    const bullets: string[] = [];

    if (snapshot.avgScore >= 90) {
      bullets.push('All peers nominal — no action required');
    } else if (snapshot.avgScore >= 70) {
      bullets.push(`Degraded quality detected — avg health ${Math.round(snapshot.avgScore)}`);
    } else {
      bullets.push(`SYSTEM DEGRADED — avg health ${Math.round(snapshot.avgScore)}, ${snapshot.criticalCount} critical peers`);
    }

    for (const peer of snapshot.peers) {
      if (peer.score < 70 && peer.flags.length > 0) {
        bullets.push(`${peer.peerId.slice(0, 8)}: ${peer.flags.slice(0, 2).join(', ')}`);
      }
    }

    return {
      ts:           new Date(snapshot.timestamp).toISOString(),
      avgHealth:    Math.round(snapshot.avgScore),
      criticalPeers: snapshot.criticalCount,
      totalPeers:   snapshot.peers.length,
      mode:         cfg.enableLLM ? 'balanced/full' : 'ultra-light',
      bullets,
      rawContext:   this._buffer.toCompactJSON(),
    };
  }

  // ─── Optional LLM call ───────────────────────────────────────────────────
  private async _queryLLM(briefing: SystemBriefing): Promise<void> {
    if (!this._llmEndpoint) return;

    const prompt = [
      'You are LeeWay NEXUS, a WebRTC network health assistant.',
      'Given this system briefing, provide one concise actionable recommendation.',
      'Keep it under 30 words. No markdown.',
      '',
      'Briefing:',
      briefing.bullets.join('\n'),
    ].join('\n');

    const start = Date.now();
    try {
      const res = await fetch(this._llmEndpoint, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model:  this._llmModel ?? 'phi3:mini',
          prompt,
          stream: false,
        }),
        signal: AbortSignal.timeout ? AbortSignal.timeout(8_000) : undefined,
      });

      if (!res.ok) return;

      const json = await res.json() as { response?: string };
      const text = (json.response ?? '').trim();
      if (text) {
        this._lastLLMResponse = {
          text,
          model:     this._llmModel ?? 'unknown',
          latencyMs: Date.now() - start,
        };
      }
    } catch {
      // Suppress — LLM failures are non-fatal; system continues on rules alone
    }
  }
}
