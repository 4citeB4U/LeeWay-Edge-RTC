/*
LEEWAY HEADER — DO NOT REMOVE
REGION: SFU.AGENTS.TYPES
TAG: SFU.AGENT.CONTRACTS
COLOR_ONION_HEX: NEON=#00FFD1 FLUO=#00B4FF PASTEL=#C7F0FF
ICON_ASCII: family=lucide glyph=layers
5WH:
  WHAT = Shared TypeScript contracts for every LeeWay agent in the system
  WHY  = Single source of truth ensures all agents follow the same governance protocol
  WHO  = LeeWay Industries | LeeWay Innovation | Creator: Leonard Lee
  WHERE = services/sfu/src/agents/types.ts
  WHEN = 2026
  HOW  = Pure types — imported by every agent, registry, governance engine, and runtime
AGENTS: ASSESS ALIGN AUDIT
LICENSE: PROPRIETARY
*/

// ─── Status / Level ────────────────────────────────────────────────────────────
export type AgentStatus   = 'active' | 'idle' | 'suspended' | 'alert' | 'offline';
export type AgentLevel    = 'info' | 'warn' | 'alert';
export type AgentTier     = 'core' | 'oversight' | 'infrastructure';

// ─── Directive / Governance ────────────────────────────────────────────────────
export interface AgentDirective {
  primary: string;
  constraints: string[];
}

export interface AgentGovernance {
  agentId: string;             // canonical AGT-NNN identifier
  reportsTo: string;           // agent codename or 'OPERATOR'
  tier: AgentTier;             // core | oversight | infrastructure
  canTerminate: boolean;       // may this agent close rooms / transports?
  canAlert: boolean;           // may this agent push alerts to connected clients?
  canSuspendAgents: boolean;   // may this agent suspend other agents?
  maxActionsPerMinute: number;
  maxIdleMs: number;           // 0 = never auto-suspend
  tools: string[];             // named capabilities the agent is authorised to use
}

// ─── Log / Snapshot ───────────────────────────────────────────────────────────
export interface AgentLogEntry {
  ts: number;
  level: AgentLevel;
  msg: string;
}

export interface AgentSnapshot {
  agentId: string;             // AGT-NNN canonical identifier
  name: string;                // full descriptive name
  codename: string;            // short ALL-CAPS identifier
  role: string;
  status: AgentStatus;
  directive: AgentDirective;
  governance: AgentGovernance;
  lastAction: string | null;
  lastActionTs: number | null;
  log: AgentLogEntry[];
  metrics: Record<string, number | string>;
  startedAt: number;
  actionsTotal: number;
  violationsTotal: number;     // governance rule violations caught
}

// ─── Agent interface ─────────────────────────────────────────────────────────-
export interface IAgent {
  readonly codename: string;
  readonly agentId: string;
  start(broadcast: BroadcastFn): void;
  stop(): void;
  suspend(): void;
  resume(broadcast: BroadcastFn): void;
  getSnapshot(): AgentSnapshot;
}

export type BroadcastFn = (event: AgentEvent) => void;

// ─── Bus events ────────────────────────────────────────────────────────────────
/** Pushed to all WebSocket clients and intra-process bus listeners */
export interface AgentEvent {
  type: 'agentEvent';
  agentId: string;
  codename: string;
  level: AgentLevel;
  msg: string;
  ts: number;
  status: AgentStatus;
  metrics?: Record<string, number | string>;
}

/** GOVERNOR → Runtime directives */
export interface GovernanceDirective {
  type: 'governanceDirective';
  action: 'suspend' | 'resume' | 'warn' | 'audit';
  targetCodename: string;
  reason: string;
  ts: number;
}

/** REPAIR agent → Runtime repair request */
export interface RepairRequest {
  type: 'repairRequest';
  targetCodename: string;
  issue: string;
  ts: number;
}

/** SCALER → Runtime scaling order */
export interface ScalingOrder {
  type: 'scalingOrder';
  action: 'expand' | 'shrink' | 'steady';
  workerDelta: number;
  reason: string;
  ts: number;
}
