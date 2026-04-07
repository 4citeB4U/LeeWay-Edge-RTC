/*
LEEWAY HEADER — DO NOT REMOVE
REGION: SERVER.GUARDIAN.STATS
TAG: GUARDIAN.SLOW-LANE.STATS-WORKER
COLOR_ONION_HEX: NEON=#00FFD1 FLUO=#00B4FF PASTEL=#C7F0FF
ICON_ASCII: family=lucide glyph=activity
5WH:
  WHAT = LeeWay Stats Worker — slow-lane RTC peer health scorer
  WHY  = Raw mediasoup stats are verbose and unstructured; this worker
         converts them into compact PeerHealthScore objects that can be
         stored in a rolling buffer without overwhelming memory on a Pi 5,
         and can be fed to the LLM summary path without token bloat
  WHO  = LEEWAY INNOVATIONS A LEEWAY INDUSTY CREATION
  WHERE = services/sfu/src/guardian/stats-worker.ts
  WHEN = 2026
  HOW  = Processes mediasoup ProducerStat or ConsumerStat arrays into
         numeric health scores (0-100). Threshold tables drive flag
         generation so callers get actionable strings not raw numbers.
         Designed to run inside setInterval at summaryIntervalMs.
AGENTS: VECTOR SENTINEL REPAIR
LICENSE: PROPRIETARY
*/

// ─── Types ─────────────────────────────────────────────────────────────────────
export interface RawRtcStats {
  peerId: string;
  /** mediasoup getRtpObserverStats or getStats() output — array of stat objects. */
  stats: Record<string, unknown>[];
  capturedAt: number; // Date.now()
}

export interface PeerHealthScore {
  peerId: string;
  /** 0 = dead, 100 = perfect. */
  score: number;
  /** Human-readable issue flags, e.g. 'HIGH_PACKET_LOSS', 'LOW_BITRATE'. */
  flags: string[];
  /** Single sentence suitable for LLM context or dashboard display. */
  summary: string;
  capturedAt: number;
}

export interface StatsSnapshot {
  peers: PeerHealthScore[];
  avgScore: number;
  criticalCount: number;
  timestamp: number;
}

// ─── Thresholds ───────────────────────────────────────────────────────────────
const PACKET_LOSS_WARN  = 0.03;  // 3%
const PACKET_LOSS_CRIT  = 0.08;  // 8%
const JITTER_WARN_MS    = 40;
const JITTER_CRIT_MS    = 100;
const BITRATE_LOW_BPS   = 40_000;   // 40 kbps
const BITRATE_DEAD_BPS  = 5_000;    // 5 kbps = likely stalled
const RTT_WARN_MS       = 200;
const RTT_CRIT_MS       = 500;

// ─── Score computation ────────────────────────────────────────────────────────
/**
 * Compute a health score for a single peer from its raw stat array.
 * Returns a PeerHealthScore ready for the rolling buffer.
 */
export function scorePeer(raw: RawRtcStats): PeerHealthScore {
  const flags: string[] = [];
  let penalty = 0;

  for (const s of raw.stats) {
    const packetLoss = _num(s['packetLoss'] ?? s['fractionLost']) ;
    const jitter     = _num(s['jitter']) * 1000; // mediasoup jitter is in seconds
    const bitrate    = _num(s['bitrate'] ?? s['availableBitrate']);
    const rtt        = _num(s['roundTripTime']) * 1000; // seconds -> ms

    if (packetLoss >= PACKET_LOSS_CRIT) {
      flags.push('CRITICAL_PACKET_LOSS');
      penalty += 40;
    } else if (packetLoss >= PACKET_LOSS_WARN) {
      flags.push('HIGH_PACKET_LOSS');
      penalty += 18;
    }

    if (jitter >= JITTER_CRIT_MS) {
      flags.push('CRITICAL_JITTER');
      penalty += 25;
    } else if (jitter >= JITTER_WARN_MS) {
      flags.push('HIGH_JITTER');
      penalty += 10;
    }

    if (bitrate > 0 && bitrate <= BITRATE_DEAD_BPS) {
      flags.push('STALLED_BITRATE');
      penalty += 30;
    } else if (bitrate > 0 && bitrate < BITRATE_LOW_BPS) {
      flags.push('LOW_BITRATE');
      penalty += 12;
    }

    if (rtt >= RTT_CRIT_MS) {
      flags.push('CRITICAL_LATENCY');
      penalty += 20;
    } else if (rtt >= RTT_WARN_MS) {
      flags.push('HIGH_LATENCY');
      penalty += 8;
    }
  }

  const score = Math.max(0, Math.min(100, 100 - penalty));
  const summary = _buildSummary(raw.peerId, score, flags);

  return { peerId: raw.peerId, score, flags, summary, capturedAt: raw.capturedAt };
}

/**
 * Process a batch of raw stats into a StatsSnapshot.
 */
export function processStats(batch: RawRtcStats[]): StatsSnapshot {
  const peers = batch.map(scorePeer);
  const avgScore = peers.length > 0
    ? peers.reduce((acc, p) => acc + p.score, 0) / peers.length
    : 100;
  const criticalCount = peers.filter(p => p.score < 40).length;

  return { peers, avgScore, criticalCount, timestamp: Date.now() };
}

// ─── Rolling buffer ───────────────────────────────────────────────────────────
export class StatsBuffer {
  private _snapshots: StatsSnapshot[] = [];
  private readonly _maxSize: number;

  constructor(maxSize: number) {
    this._maxSize = maxSize;
  }

  push(snapshot: StatsSnapshot): void {
    this._snapshots.push(snapshot);
    if (this._snapshots.length > this._maxSize) {
      this._snapshots.shift();
    }
  }

  latest(): StatsSnapshot | undefined {
    return this._snapshots[this._snapshots.length - 1];
  }

  all(): StatsSnapshot[] {
    return [...this._snapshots];
  }

  /** Compact representation for LLM context window — avoids flooding with raw numbers. */
  toCompactJSON(): object {
    const last = this.latest();
    if (!last) return {};
    return {
      ts: last.timestamp,
      avg: Math.round(last.avgScore),
      critical: last.criticalCount,
      peers: last.peers.map(p => ({
        id: p.peerId.slice(0, 8),
        score: p.score,
        flags: p.flags,
      })),
    };
  }

  clear(): void {
    this._snapshots = [];
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function _num(v: unknown): number {
  const n = Number(v);
  return isFinite(n) ? n : 0;
}

function _buildSummary(peerId: string, score: number, flags: string[]): string {
  if (score >= 90) return `Peer ${peerId.slice(0, 8)} — NOMINAL (score ${score})`;
  if (score >= 70) return `Peer ${peerId.slice(0, 8)} — DEGRADED: ${flags.join(', ')} (score ${score})`;
  if (score >= 40) return `Peer ${peerId.slice(0, 8)} — WARNING: ${flags.join(', ')} (score ${score})`;
  return `Peer ${peerId.slice(0, 8)} — CRITICAL: ${flags.join(', ')} (score ${score}) — immediate action required`;
}
