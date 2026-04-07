/*
LEEWAY HEADER — DO NOT REMOVE
REGION: SERVER.GUARDIAN.INTENT
TAG: GUARDIAN.FAST-LANE.INTENT-ROUTER
COLOR_ONION_HEX: NEON=#00FFD1 FLUO=#00B4FF PASTEL=#C7F0FF
ICON_ASCII: family=lucide glyph=git-branch
5WH:
  WHAT = LeeWay Intent Router — deterministic fast-lane voice command classifier
  WHY  = The fast lane MUST never block on an LLM; all intent classification is
         pure regex in under 1 ms so the system remains responsive at 0 CPU cost
         on Mode A (no LLM at all)
  WHO  = LEEWAY INNOVATIONS A LEEWAY INDUSTY CREATION
  WHERE = services/sfu/src/guardian/intent-router.ts
  WHEN = 2026
  HOW  = Ordered rule table: each entry is a regex + IntentMatch.
         First match wins.  Unknown transcript → intent 'unknown'.
         Callers (signaling handler) receive a typed IntentMatch they act on
         immediately — no await, no network round-trip.
AGENTS: ASSESS ALIGN AUDIT
LICENSE: PROPRIETARY
*/

// ─── Intent types ─────────────────────────────────────────────────────────────
export type Intent =
  // ── Status / health queries ──────────────────────────────────────────────
  | 'query.health'       // "how is the system" / "status check"
  | 'query.peers'        // "how many peers / who is connected"
  | 'query.ice'          // "what is the ICE state"
  | 'query.relay'        // "are we relaying / TURN status"
  | 'query.latency'      // "what is the latency / round-trip"
  | 'query.packet-loss'  // "packet loss"
  | 'query.bitrate'      // "bitrate / bandwidth"
  // ── Room controls ────────────────────────────────────────────────────────
  | 'control.mute'       // "mute [peer]"
  | 'control.unmute'     // "unmute [peer]"
  | 'control.kick'       // "disconnect / remove peer"
  | 'control.reconnect'  // "reconnect"
  | 'control.reset'      // "reset the room"
  // ── Repair / escalation ──────────────────────────────────────────────────
  | 'repair.request'     // "fix it / run repair / heal"
  | 'repair.cancel'      // "stop repair / abort"
  // ── Mode switching ───────────────────────────────────────────────────────
  | 'mode.ultra-light'   // "switch to lightweight / minimal mode"
  | 'mode.balanced'      // "balanced mode"
  | 'mode.full'          // "full mode / everything on"
  // ── Agent controls ───────────────────────────────────────────────────────
  | 'agent.suspend'      // "suspend [agent]"
  | 'agent.resume'       // "resume [agent]"
  | 'agent.list'         // "list agents / show agents"
  // ── Catch-all ────────────────────────────────────────────────────────────
  | 'unknown';

export interface IntentMatch {
  intent: Intent;
  /** Raw matched text for the optional target peer/agent (may be empty). */
  target?: string;
  /** Confidence: 'high' = explicit keyword; 'low' = fuzzy heuristic. */
  confidence: 'high' | 'low';
  /** Original normalised transcript. */
  transcript: string;
}

// ─── Rule table ───────────────────────────────────────────────────────────────
interface Rule {
  pattern: RegExp;
  intent: Intent;
  confidence: 'high' | 'low';
  /** 1-based capture group index that holds the optional target name. */
  targetGroup?: number;
}

const RULES: Rule[] = [
  // ── Status / health ─────────────────────────────────────────────────────
  { pattern: /\b(health|status|how.*(system|things|going)|everything.*ok|system.*check|check.*system)\b/i,
    intent: 'query.health',      confidence: 'high' },
  { pattern: /\b(how many|list|show).*(peer|user|participant|connected)\b/i,
    intent: 'query.peers',       confidence: 'high' },
  { pattern: /\bice\b.*(state|status|check|connection)/i,
    intent: 'query.ice',         confidence: 'high' },
  { pattern: /\b(relay|relaying|turn server|stun)\b/i,
    intent: 'query.relay',       confidence: 'high' },
  { pattern: /\b(latency|rtt|round.?trip|ping|delay)\b/i,
    intent: 'query.latency',     confidence: 'high' },
  { pattern: /\bpacket.?loss\b/i,
    intent: 'query.packet-loss', confidence: 'high' },
  { pattern: /\b(bitrate|bandwidth|throughput)\b/i,
    intent: 'query.bitrate',     confidence: 'high' },
  // ── Controls ─────────────────────────────────────────────────────────────
  { pattern: /\bunmute\b(?:\s+([a-z0-9_-]+))?/i,
    intent: 'control.unmute',    confidence: 'high', targetGroup: 1 },
  { pattern: /\bmute\b(?:\s+([a-z0-9_-]+))?/i,
    intent: 'control.mute',      confidence: 'high', targetGroup: 1 },
  { pattern: /\b(kick|remove|disconnect|drop)\b(?:\s+(?:peer|user)?)?\s*([a-z0-9_-]+)?/i,
    intent: 'control.kick',      confidence: 'high', targetGroup: 2 },
  { pattern: /\breconnect\b/i,
    intent: 'control.reconnect', confidence: 'high' },
  { pattern: /\breset\b.*(room|session|all|everything)?\b/i,
    intent: 'control.reset',     confidence: 'high' },
  // ── Repair ───────────────────────────────────────────────────────────────
  { pattern: /\b(cancel|abort|stop).*(repair|fix|heal)\b/i,
    intent: 'repair.cancel',  confidence: 'high' },
  { pattern: /\b(fix|repair|heal|patch|restore)\b/i,
    intent: 'repair.request', confidence: 'high' },
  // ── Mode ─────────────────────────────────────────────────────────────────
  { pattern: /\b(ultra.?light|minimal|lightweight|lite|low.?power)\b/i,
    intent: 'mode.ultra-light', confidence: 'high' },
  { pattern: /\bbalanced\b.*(mode)?/i,
    intent: 'mode.balanced',    confidence: 'high' },
  { pattern: /\b(full|everything|maximum|max)\b.*(mode|on)?\b/i,
    intent: 'mode.full',        confidence: 'high' },
  // ── Agents ───────────────────────────────────────────────────────────────
  { pattern: /\bsuspend\b(?:\s+(?:agent)?)?\s*([A-Za-z]{3,10})?/i,
    intent: 'agent.suspend', confidence: 'high', targetGroup: 1 },
  { pattern: /\bresume\b(?:\s+(?:agent)?)?\s*([A-Za-z]{3,10})?/i,
    intent: 'agent.resume',  confidence: 'high', targetGroup: 1 },
  { pattern: /\b(list|show|what).*(agent|bot|service)\b/i,
    intent: 'agent.list',    confidence: 'high' },
  // ── Fuzzy fallback ───────────────────────────────────────────────────────
  { pattern: /\b(ok|fine|good|bad|problem|issue|error)\b/i,
    intent: 'query.health', confidence: 'low' },
];

// ─── Public API ───────────────────────────────────────────────────────────────
/**
 * Classify a voice transcript into a typed IntentMatch.
 * Synchronous, deterministic, no network, no LLM.
 *
 * @param raw - Raw transcript string from STT.
 */
export function classifyIntent(raw: string): IntentMatch {
  const transcript = raw.trim();

  for (const rule of RULES) {
    const m = rule.pattern.exec(transcript);
    if (m) {
      const target =
        rule.targetGroup !== undefined
          ? (m[rule.targetGroup] ?? undefined)
          : undefined;
      return {
        intent: rule.intent,
        target: target || undefined,
        confidence: rule.confidence,
        transcript,
      };
    }
  }

  return { intent: 'unknown', confidence: 'low', transcript };
}

/**
 * Quick predicate — true when the intent should be acted on immediately
 * (fast lane) rather than queued for the slow lane.
 */
export function isFastLane(intent: Intent): boolean {
  return (
    intent.startsWith('control.') ||
    intent.startsWith('repair.')  ||
    intent.startsWith('mode.')    ||
    intent.startsWith('agent.')
  );
}
