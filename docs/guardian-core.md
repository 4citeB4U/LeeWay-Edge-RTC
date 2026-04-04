# LeeWay Guardian Core — Full System Blueprint

**LeeWay Industries | LeeWay Innovation — Created by Leonard Lee**

> One binary. Three modes. Raspberry Pi 5 to bare-metal VPS. Zero vendor AI. Self-healing. Self-scaling. Always listening.

---

## Table of Contents

1. [Full Stack Layer Model](#1-full-stack-layer-model)
2. [Two-Lane Architecture](#2-two-lane-architecture)
3. [Fast Lane — Real-Time Voice Control](#3-fast-lane--real-time-voice-control)
4. [Slow Lane — Intelligence Pipeline](#4-slow-lane--intelligence-pipeline)
5. [Runtime Mode System (A / B / C)](#5-runtime-mode-system)
6. [WebRTC Layer Model](#6-webrtc-layer-model)
7. [Agent Fleet — Tools, Purpose, Workflow](#7-agent-fleet)
8. [Guardian Core Module Map](#8-guardian-core-module-map)
9. [Message Interfaces Between Lanes](#9-message-interfaces)
10. [Failover and Degradation](#10-failover-and-degradation)
11. [Voice Enhancement System](#11-voice-enhancement-system)
12. [Repository Layout](#12-repository-layout)

---

## 1. Full Stack Layer Model

```mermaid
graph TB
  subgraph HW["Hardware Layer"]
    direction LR
    PI5["Raspberry Pi 5\n8 GB RAM"]
    VPS["Linux VPS / Fly.io\nx86-64"]
    MIC["Microphone\nInput Device"]
    NET["Network Interface\nEthernet / Wi-Fi"]
  end

  subgraph OS["Operating System"]
    direction LR
    NODE["Node.js 20 LTS\nRuntime"]
    KERNEL["Linux Kernel\nICE / UDP / TCP"]
    PROC["Process Manager\nsystemd / PM2"]
  end

  subgraph SFU["LeeWay SFU — services/sfu/"]
    direction TB
    EXPRESS["Express HTTP\n:3000 / REST API"]
    WS["WebSocket Server\nSignaling"]
    MS["mediasoup 3.15\nSFU Core"]
    subgraph GUARDIAN["Guardian Core — src/guardian/"]
      RM["runtime-mode.ts\nMode A | B | C"]
      IR["intent-router.ts\nFast Lane Classifier"]
      SW["stats-worker.ts\nPeer Health Scorer"]
      SUM["summary-worker.ts\nOptional LLM Bridge"]
    end
    subgraph AGENTS["Agent Fleet — src/agents/"]
      ARIA["ARIA AGT-001\nVoice + Status"]
      VECTOR["VECTOR AGT-002\nNetwork Analytics"]
      WARD["WARD AGT-003\nRoom Manager"]
      SENTINEL["SENTINEL AGT-004\nAnomaly Detection"]
      NEXUS["NEXUS AGT-005\nOrchestration"]
      REPAIR["REPAIR AGT-006\nSelf-Healing"]
      GOVERNOR["GOVERNOR AGT-007\nPolicy Engine"]
      SCALER["SCALER AGT-008\nAuto-Scaling"]
    end
    subgraph GOV["Governance — src/governance.ts"]
      RULES["Policy Rules"]
      RATELIM["Rate Limiter"]
      GOVLOG["governance.log"]
    end
    RT["runtime.ts\nAgentRuntime Singleton"]
    LOGGER["logger.ts\nPino Multistream\n+ per-agent logs"]
  end

  subgraph CLIENT["Browser Client — src/"]
    direction TB
    REACT["React 19 + Vite\nCommandCenter.tsx"]
    subgraph VOICE["Voice Pipeline — src/voice/"]
      VAI["voice-loop.ts\nuseVoiceLoop Hook"]
      VRG["voice-registry.ts\nRuntime Discovery"]
      VPR["voice-presets.ts\n6 TTS Profiles"]
      EMO["emotion-engine.ts\nText → TTS Params"]
      SPQ["speech-queue.ts\nPriority Queue"]
      PRS["persona.ts\nRule Brain"]
    end
    WEBRTC["useWebRTC.ts\nMediasoup Client SDK"]
    STORE["store.ts\nWebSocket + State"]
  end

  subgraph INFRA["Infrastructure"]
    COTURN["coturn TURN\n:3478 TCP/UDP\n:5349 TLS"]
    LOGS["logs/\ncombined.log\nper-agent + governance.log"]
    METRICS["metrics.ts\nExpress /metrics"]
  end

  MIC --> CLIENT
  NET --> SFU
  HW --> OS
  OS --> SFU
  OS --> CLIENT
  SFU --> GUARDIAN
  SFU --> AGENTS
  SFU --> GOV
  SFU --> RT
  SFU --> LOGGER
  LOGGER --> LOGS
  SFU --> METRICS
  CLIENT --> VOICE
  CLIENT --> WEBRTC
  CLIENT <-->|"WebSocket\nSignaling"| WS
  WEBRTC <-->|"DTLS-SRTP\nRTP"| MS
  MS <-->|"TURN relay\nwhen direct ICE fails"| COTURN
```

---

## 2. Two-Lane Architecture

```mermaid
flowchart LR
  subgraph FAST["FAST LANE — Deterministic, Always-On, &lt;10 ms"]
    direction TB
    MIC2["Microphone\nInput"]
    STT["SpeechRecognition\nbrowser STT"]
    IR2["intent-router.ts\nclassifyIntent()"]
    RA["Rule Agents\nARIA / WARD / REPAIR"]
    TTS2["speechQueue.ts\nenqueue() + emotion-engine"]
    OUT["Audio Output"]
    MIC2 --> STT --> IR2 --> RA --> TTS2 --> OUT
  end

  subgraph SLOW["SLOW LANE — Async, Optional LLM, &lt;10 s"]
    direction TB
    STATS["RTC Stats\ngetStats()"]
    SW2["stats-worker.ts\nPeerHealthScore"]
    BUF["StatsBuffer\nRolling Window"]
    SUM2["summary-worker.ts\nSystemBriefing"]
    LLM["Local LLM\n(Ollama / llama.cpp)\nOptional — Mode B/C only"]
    ADV["Advice / Reports\n→ Dashboard / NEXUS"]
    STATS --> SW2 --> BUF --> SUM2
    SUM2 -->|"Mode B/C"| LLM
    SUM2 --> ADV
    LLM --> ADV
  end

  subgraph MODE["Runtime Mode"]
    MA["Mode A\nultra-light\nFast lane only"]
    MB["Mode B\nbalanced\nBoth lanes"]
    MC["Mode C\nfull\nDeep diagnostics"]
  end

  FAST <-->|"IntentMatch events\nfor slow-lane agents"| SLOW
  MA -->|"disables"| SLOW
  MB -->|"enables"| SLOW
  MC -->|"enables"| SLOW
```

---

## 3. Fast Lane — Real-Time Voice Control

```mermaid
sequenceDiagram
  actor User
  participant STT as SpeechRecognition<br/>(browser)
  participant VL as voice-loop.ts<br/>useVoiceLoop()
  participant IR as intent-router.ts<br/>classifyIntent()
  participant PRS as persona.ts<br/>respondToInput()
  participant EMO as emotion-engine.ts<br/>detectEmotion()
  participant SPQ as speech-queue.ts<br/>enqueue()
  participant TTS as SpeechSynthesis<br/>(browser)

  User->>STT: speaks voice command
  STT->>VL: onresult (final transcript)
  VL->>VL: barge-in check<br/>speechQueue.clear() if speaking
  VL->>VL: setVoiceState('thinking')
  VL->>PRS: respondToInput(transcript, history, mode, rtcCtx)
  PRS->>IR: (internal) classifyIntent() for RTC commands
  PRS-->>VL: response text
  VL->>EMO: detectEmotion(responseText)
  EMO-->>VL: Emotion ('alert' | 'calm' | 'urgent' | …)
  VL->>EMO: applyEmotion(emotion, preset.rate, preset.pitch, preset.volume)
  EMO-->>VL: AppliedVoiceParams {rate, pitch, volume, pauseBeforeMs, pauseAfterMs}
  VL->>SPQ: enqueue(SpeechItem { priority: 'normal', …params })
  SPQ->>TTS: SpeechSynthesisUtterance
  TTS-->>User: audio output
  TTS->>VL: onEnd → setVoiceState('listening')
```

### Fast Lane Intent Classifications

| Intent | Trigger phrases | Action |
|--------|----------------|--------|
| `query.health` | "status check", "how's the system" | ARIA responds with health summary |
| `query.peers` | "how many peers", "who's connected" | WARD returns peer count |
| `query.latency` | "latency", "round-trip", "ping" | VECTOR reads RTT stats |
| `query.packet-loss` | "packet loss", "dropped packets" | SENTINEL reads loss metrics |
| `control.mute` | "mute [peer]" | WARD issues mute |
| `control.kick` | "disconnect [peer]" | WARD removes peer |
| `control.reconnect` | "reconnect" | REPAIR triggers reconnect |
| `control.reset` | "reset the room" | WARD resets room state |
| `repair.request` | "fix it", "heal", "repair" | REPAIR runs SFU reconciliation |
| `mode.ultra-light` | "minimal mode", "lite mode" | GOVERNOR calls setMode('ultra-light') |
| `mode.full` | "full mode", "everything on" | GOVERNOR calls setMode('full') |
| `agent.suspend` | "suspend [CODENAME]" | GOVERNOR suspends named agent |
| `agent.list` | "list agents", "show agents" | NEXUS returns agent snapshot |

---

## 4. Slow Lane — Intelligence Pipeline

```mermaid
flowchart TD
  RTCSTATS["mediasoup getStats()\nper Producer/Consumer"]
  RAWSTAT["RawRtcStats\n{ peerId, stats[], capturedAt }"]
  SCOREPEER["stats-worker.ts\nscorePeer()"]
  PHS["PeerHealthScore\n{ score 0-100, flags[], summary }"]
  BUFFER["StatsBuffer\nRolling window\n(configurable size)"]
  BRIEFING["summary-worker.ts\nSystemBriefing\n{ avgHealth, criticalPeers, bullets[] }"]
  COMPACT["toCompactJSON()\nCompressed for LLM token budget"]

  subgraph LLM_PATH["LLM Path — Mode B / C only"]
    ENDPOINT["Local HTTP endpoint\nOllama / llama.cpp"]
    MODEL["phi3:mini or similar\nsmall local model"]
    ADVICE["30-word recommendation\nstored in lastLLMResponse"]
  end

  AGENTS2["NEXUS / REPAIR / GOVERNOR\nreact to briefing"]

  RTCSTATS --> RAWSTAT --> SCOREPEER --> PHS --> BUFFER
  BUFFER --> COMPACT --> BRIEFING
  BRIEFING --> LLM_PATH
  BRIEFING --> AGENTS2
  LLM_PATH --> MODEL --> ADVICE --> AGENTS2
```

### Peer Health Score Thresholds

| Metric | Warning | Critical | Penalty |
|--------|---------|----------|---------|
| Packet loss | ≥ 3% | ≥ 8% | 18 / 40 pts |
| Jitter | ≥ 40 ms | ≥ 100 ms | 10 / 25 pts |
| Bitrate | < 40 kbps | < 5 kbps (stalled) | 12 / 30 pts |
| RTT | ≥ 200 ms | ≥ 500 ms | 8 / 20 pts |

**Score bands:** 90–100 = Nominal | 70–89 = Degraded | 40–69 = Warning | 0–39 = Critical

---

## 5. Runtime Mode System

```mermaid
stateDiagram-v2
  [*] --> balanced: LEEWAY_MODE env var default
  ultra-light --> balanced: GOVERNOR.setMode('balanced')
  balanced --> ultra-light: SCALER detects high CPU / user says "lite mode"
  balanced --> full: user says "full mode" / GOVERNOR policy
  full --> balanced: SCALER detects sustained normal load
  full --> ultra-light: SCALER detects critical resource pressure

  state ultra-light {
    LLM: disabled
    Dashboard: disabled
    TickMultiplier: 3x (slower ticks)
    Workers: 1
    StatsBuffer: 20 entries
    SummaryInterval: disabled
    LogLevel: warn
  }

  state balanced {
    LLM2: enabled (local endpoint)
    Dashboard2: enabled
    TickMultiplier2: 1x
    Workers2: 2
    StatsBuffer2: 100 entries
    SummaryInterval2: 30s
    LogLevel2: info
  }

  state full {
    LLM3: enabled
    Dashboard3: enabled
    TickMultiplier3: 1x
    Workers3: CPU count
    StatsBuffer3: 500 entries
    SummaryInterval3: 10s
    LogLevel3: debug
  }
```

### Mode Capability Table

| Capability | Mode A ultra-light | Mode B balanced | Mode C full |
|-----------|--------------------|--------------------|------------|
| Fast lane voice control | ✅ | ✅ | ✅ |
| Rule-based intent routing | ✅ | ✅ | ✅ |
| Peer health scoring | ✅ | ✅ | ✅ |
| Slow lane stats buffering | ✅ | ✅ | ✅ |
| LLM summary path | ❌ | ✅ | ✅ |
| Metrics dashboard | ❌ | ✅ | ✅ |
| Deep diagnostic history | ❌ | ❌ | ✅ |
| Raspberry Pi 5 safe | ✅ | ⚠️ light load | ❌ |

---

## 6. WebRTC Layer Model

```mermaid
graph TB
  subgraph APPLICATION["Application Layer"]
    direction LR
    REACT2["React UI\nCommandCenter.tsx"]
    VOICEHOOK["useVoiceLoop()\nVoice Control"]
    WEBRTCHOOK["useWebRTC()\nMedia Management"]
    STORE2["store.ts\nSignaling State"]
  end

  subgraph SIGNALING["Signaling Layer — WebSocket"]
    SIG_CLIENT["Signaling Client\n(WS messages)"]
    SIG_SERVER["Signaling Server\nhandler.ts"]
    PROTO["Protocol\njoin / produce / consume\noffer / answer / ICE candidates"]
    SIG_CLIENT <-->|"JSON messages"| SIG_SERVER
    SIG_SERVER --> PROTO
  end

  subgraph MEDIASOUP["mediasoup SFU Layer"]
    direction LR
    WORKER["Worker\n(OS process, mediasoup-worker)"]
    ROUTER["Router\n(per room, RTP capabilities)"]
    WEBRTCTRANS["WebRtcTransport\n(per peer, ICE + DTLS)"]
    PRODUCER["Producer\n(sends media)"]
    CONSUMER["Consumer\n(receives media)"]
    WORKER --> ROUTER
    ROUTER --> WEBRTCTRANS
    WEBRTCTRANS --> PRODUCER
    WEBRTCTRANS --> CONSUMER
  end

  subgraph NETWORK["Network Layer"]
    ICE["ICE\nSTUN / TURN\ncoturn :3478"]
    DTLS["DTLS 1.3\nKey Exchange\nFingerprint verification"]
    SRTP["SRTP\nEncrypted media"]
    ICE --> DTLS --> SRTP
  end

  subgraph MEDIA["Media Layer"]
    VP8["Video\nVP8 / H.264"]
    OPUS["Audio\nOpus 48kHz"]
  end

  APPLICATION --> SIGNALING
  SIGNALING --> MEDIASOUP
  MEDIASOUP --> NETWORK
  NETWORK --> MEDIA
```

### ICE Candidate Priority Order

```
1. host          — same LAN, no STUN needed
2. srflx         — NAT mapped via STUN (coturn :3478)
3. relay         — TURN relay via coturn TCP/TLS (:5349)
```

### DTLS Role Assignment

| Side | Role |
|------|------|
| SFU (mediasoup) | `server` — holds certificate, drives handshake |
| Browser | `client` — validates fingerprint from SDP |

---

## 7. Agent Fleet

### Agent Overview

```mermaid
graph LR
  subgraph CORE["Core Tier"]
    ARIA2["ARIA\nAGT-001\nVoice + Status Coordination"]
    VECTOR2["VECTOR\nAGT-002\nNetwork Analytics + RTC Metrics"]
    WARD2["WARD\nAGT-003\nRoom Lifecycle + Peer Management"]
    SENTINEL2["SENTINEL\nAGT-004\nAnomaly Detection + Alerting"]
    NEXUS2["NEXUS\nAGT-005\nOrchestration + Event Bus"]
  end

  subgraph OVERSIGHT["Oversight Tier"]
    GOVERNOR2["GOVERNOR\nAGT-007\nPolicy Engine + Rule Enforcement"]
  end

  subgraph INFRA2["Infrastructure Tier"]
    REPAIR2["REPAIR\nAGT-006\nSelf-Healing + SFU Reconciliation"]
    SCALER2["SCALER\nAGT-008\nAuto-Scaling + Mode Control"]
  end

  NEXUS2 <-->|"broadcast"| ARIA2
  NEXUS2 <-->|"broadcast"| VECTOR2
  NEXUS2 <-->|"broadcast"| WARD2
  NEXUS2 <-->|"broadcast"| SENTINEL2
  GOVERNOR2 -->|"enforce policy"| CORE
  GOVERNOR2 -->|"enforce policy"| INFRA2
  SENTINEL2 -->|"trigger"| REPAIR2
  SCALER2 -->|"setMode()"| GOVERNOR2
  REPAIR2 -->|"report"| NEXUS2
```

### Agent Detail Table

| Agent | ID | Tier | Tick | Tools | Can Suspend |
|-------|----|------|------|-------|-------------|
| ARIA | AGT-001 | core | var | voice, status, greet | no |
| VECTOR | AGT-002 | core | 5s | getRTCStats, analyzeTrend | no |
| WARD | AGT-003 | core | 10s | listPeers, muteP, kickPeer | no |
| SENTINEL | AGT-004 | core | 3s | detectAnomaly, raisAlert | yes |
| NEXUS | AGT-005 | core | 15s | broadcast, orchestrate | no |
| REPAIR | AGT-006 | infra | trigger | reconnectPeer, restartWorker | yes |
| GOVERNOR | AGT-007 | oversight | 30s | enforcePolicy, suspend/resume | no |
| SCALER | AGT-008 | infra | 60s | setMode, addWorker, scaleRoom | yes |

### Agent Lifecycle

```mermaid
stateDiagram-v2
  [*] --> running: start()
  running --> suspended: governor.suspend() / GOVERNOR policy
  suspended --> running: governor.resume()
  running --> stopped: runtime.stop()
  suspended --> stopped: runtime.stop()
  stopped --> [*]

  state running {
    tick: periodic tick at interval * agentTickMultiplier
    react: event handlers active
    log: per-agent log stream active
  }

  state suspended {
    tick_off: tick paused
    react_off: no event handling
    violations: violationsTotal counter preserved
  }
```

### Agent Control API

```typescript
// Get all agent snapshots
const snapshots = runtime.getSnapshots();
// { codename, agentId, tier, state, violationsTotal, tools }

// Suspend a specific agent (GOVERNOR only)
await governor.suspendAgent('SENTINEL');

// Resume
await governor.resumeAgent('SENTINEL');

// Broadcast to all agents via NEXUS
nexus.broadcast({ type: 'alert', level: 'critical', peerId, flags });

// Mode switch (affects all agent tick rates)
setMode('ultra-light'); // → agentTickMultiplier = 3
```

---

## 8. Guardian Core Module Map

```mermaid
graph LR
  subgraph GUARDIAN_CORE["services/sfu/src/guardian/"]
    RM2["runtime-mode.ts\ngetMode() setMode()\nonModeChange() listener"]
    IR3["intent-router.ts\nclassifyIntent()\nisFastLane()"]
    SW3["stats-worker.ts\nscorePeer() processStats()\nStatsBuffer class"]
    SUM3["summary-worker.ts\nSummaryWorker class\nstart() stop()\nlastBriefing lastLLMResponse"]
  end

  subgraph CONSUMERS["Consumers"]
    HANDLER["signaling/handler.ts\nuses classifyIntent() on\ntranscript WebSocket messages"]
    AGENTS3["agents/*.ts\nreact to briefings\ncheck getModeConfig()"]
    METRICS3["metrics.ts\nexposes lastBriefing\nto /metrics endpoint"]
  end

  RM2 -->|"getModeConfig()"| SW3
  RM2 -->|"getModeConfig()"| SUM3
  RM2 -->|"getModeConfig()"| AGENTS3
  IR3 --> HANDLER
  SW3 --> SUM3
  SUM3 --> AGENTS3
  SUM3 --> METRICS3
```

### Module Responsibilities

| Module | Exports | Depends on |
|--------|---------|------------|
| `runtime-mode.ts` | `getMode`, `setMode`, `getModeConfig`, `onModeChange` | `node:os` |
| `intent-router.ts` | `classifyIntent`, `isFastLane`, `Intent`, `IntentMatch` | nothing |
| `stats-worker.ts` | `scorePeer`, `processStats`, `StatsBuffer` | nothing |
| `summary-worker.ts` | `SummaryWorker`, `SystemBriefing`, `LLMResponse` | `stats-worker`, `runtime-mode` |

---

## 9. Message Interfaces

### Fast Lane → Slow Lane

```typescript
// When fast lane handles a control intent, it emits this to slow-lane agents
interface FastLaneEvent {
  type: 'fast-lane-action';
  intent: Intent;          // 'control.mute' | 'repair.request' | etc.
  target?: string;         // peer ID or agent codename
  transcript: string;      // raw user speech
  confidence: 'high' | 'low';
  ts: number;
}
```

### Slow Lane → Agents

```typescript
// SystemBriefing emitted by SummaryWorker every summaryIntervalMs
interface SystemBriefing {
  ts: string;              // ISO timestamp
  avgHealth: number;       // 0-100 averaged across all peers
  criticalPeers: number;   // how many peers scored below 40
  totalPeers: number;      // connected peer count
  mode: string;            // current runtime mode label
  bullets: string[];       // concise human-readable summary lines
  rawContext?: object;     // compact JSON for LLM (never raw stat arrays)
}
```

### Agent Snapshot (NEXUS broadcast shape)

```typescript
interface AgentSnapshot {
  codename: string;           // 'ARIA' | 'VECTOR' | etc.
  agentId: string;            // 'AGT-001' | etc.
  tier: 'core' | 'oversight' | 'infrastructure';
  state: 'running' | 'suspended' | 'stopped';
  violationsTotal: number;    // governance violation counter
  tools: string[];            // tool names this agent is allowed to call
}
```

---

## 10. Failover and Degradation

```mermaid
flowchart TD
  OK["All systems nominal"]
  HIGH_CPU["CPU spike detected\n(SCALER monitors)"]
  MODE_DOWN["setMode('ultra-light')\nLLM disabled\nticksSlowed×3"]
  LLM_FAIL["LLM endpoint\ntimeout / error"]
  RULE_ONLY["Fast lane rules only\n(always available)"]
  ICE_FAIL["ICE failure\npeer disconnected"]
  REPAIR_TRIG["REPAIR triggered\nreconnectPeer()"]
  WORKER_CRASH["mediasoup worker\ncrash"]
  WORKER_RESTART["worker.ts\nautoRestart()"]
  SENTINEL_ALERT["SENTINEL raises\ncritical alert"]
  NEXUS_BROADCAST["NEXUS broadcasts\nto all agents"]

  OK -->|"load exceeds threshold"| HIGH_CPU
  HIGH_CPU --> MODE_DOWN
  MODE_DOWN -->|"load normalises"| OK
  LLM_FAIL --> RULE_ONLY
  RULE_ONLY -->|"LLM recovers"| OK
  ICE_FAIL --> REPAIR_TRIG
  REPAIR_TRIG -->|"success"| OK
  REPAIR_TRIG -->|"failure"| SENTINEL_ALERT
  WORKER_CRASH --> WORKER_RESTART
  WORKER_RESTART --> OK
  SENTINEL_ALERT --> NEXUS_BROADCAST
```

### Degradation Guarantees

| Failure | System behaviour | Recovery |
|---------|-----------------|----------|
| LLM endpoint down | Slow lane continues without advice; fast lane unaffected | Automatic retry next interval |
| mediasoup worker crash | `worker.ts` detects death and restarts new worker | ~2 s downtime per room |
| TURN server down | Direct ICE candidates still tried; RELAY candidates fail gracefully | Manual coturn restart |
| SENTINEL suspended | Health scores still computed; no alerts raised | GOVERNOR resumes on next policy check |
| Mode A forced | LLM + dashboard off; all voice commands still handled in < 10 ms | SCALER promotes mode when resources free |
| SFU restart | All WS clients auto-reconnect via useWebRTC exponential backoff | < 5 s reconnect |

---

## 11. Voice Enhancement System

### Voice Pipeline

```mermaid
flowchart LR
  subgraph REGISTRY["voice-registry.ts"]
    DISCO["speechSynthesis.getVoices()\nvoiceschanged listener"]
    CLASSIFY["Gender + quality\nheuristic classifier"]
    CACHE["VoiceEntry[]\nEnglish voices only"]
    DISCO --> CLASSIFY --> CACHE
  end

  subgraph PRESETS["voice-presets.ts"]
    TABLE["6 Presets\nM1 M2 M3 F1 F2 F3"]
    HINTS["voiceNameHints[]\nordered preference list"]
    BASE["base rate / pitch / volume"]
    TABLE --> HINTS
    TABLE --> BASE
  end

  subgraph EMOTION["emotion-engine.ts"]
    DETECT["detectEmotion(text, ctx)\nkeyword + context rules"]
    APPLY["applyEmotion(emotion, base…)\nrateFactor × pitchFactor × volumeFactor"]
    PARAMS["AppliedVoiceParams\n{rate, pitch, volume, pauseBeforeMs, pauseAfterMs}"]
    DETECT --> APPLY --> PARAMS
  end

  subgraph QUEUE["speech-queue.ts"]
    PRIORITY["Priority Queue\nHIGH = barge-in\nNORMAL = standard\nLOW = ambient"]
    UTT["SpeechSynthesisUtterance\nwith resolved params"]
    ONIDLE["onIdle callback"]
    PRIORITY --> UTT --> ONIDLE
  end

  CACHE -->|"findByHints(hints[])"| UTT
  HINTS -->|"resolve voice"| CACHE
  BASE -->|"base params"| APPLY
  PARAMS -->|"clamped TTS values"| PRIORITY
```

### Voice Preset Table

| ID | Label | Gender | Base Rate | Base Pitch | Personality |
|----|-------|--------|-----------|------------|-------------|
| M1 | Agent Lee — Command | Male | 1.00 | 0.95 | Authoritative, clear — default RTC ops |
| M2 | Agent Lee — Calm | Male | 0.88 | 0.90 | Measured, reassuring — low-urgency reports |
| M3 | Agent Lee — Alert | Male | 1.15 | 1.05 | Fast, high-energy — SENTINEL alerts |
| F1 | Agent ARIA — Neutral | Female | 1.00 | 1.00 | Professional — health monitoring |
| F2 | Agent ARIA — Warm | Female | 0.92 | 0.97 | Soft, warm — advisory output |
| F3 | Agent ARIA — Precise | Female | 1.08 | 1.02 | Crisp, technical — diagnostics |

### Emotion → TTS Mapping

| Emotion | Rate × | Pitch × | Volume × | Pause Before | Pause After |
|---------|--------|---------|---------|-------------|------------|
| neutral | 1.00 | 1.00 | 1.00 | 0 ms | 200 ms |
| calm | 0.88 | 0.96 | 0.88 | 120 ms | 350 ms |
| alert | 1.10 | 1.04 | 1.00 | 0 ms | 120 ms |
| urgent | 1.22 | 1.08 | 1.00 | 0 ms | 0 ms |
| warm | 0.92 | 0.97 | 0.88 | 160 ms | 420 ms |
| concerned | 0.86 | 0.94 | 0.84 | 200 ms | 450 ms |
| satisfied | 0.94 | 1.02 | 0.90 | 0 ms | 320 ms |
| analytical | 0.94 | 0.97 | 0.90 | 60 ms | 260 ms |

### Emotion Detection Keywords

```
URGENT    → CRITICAL, EMERGENCY, FAILED, DOWN, OFFLINE, BREACH, THREAT
ALERT     → WARNING, ALERT, DEGRADED, HIGH PACKET, ANOMALY, SPIKE
SATISFIED → NOMINAL, STABLE, HEALTHY, CONNECTED, ONLINE, OK, CLEAN
ANALYTICAL→ ANALYZING, SCANNING, PROCESSING, CHECKING, INSPECTING
WARM      → RECOMMEND, SUGGEST, CONSIDER, ADVISE, HELP, ASSIST
CALM      → MONITORING, WATCHING, OBSERVING, IDLE, QUIET, STANDBY
```

---

## 12. Repository Layout

```
LeeWay-Edge-RTC-main/
├── README.md
├── tsconfig.json                    ← root TS config (DOM lib, ESNext, bundler)
│
├── src/                             ← browser client source
│   ├── App.tsx                      ← top-level component
│   ├── CommandCenter.tsx            ← main UI
│   ├── main.tsx                     ← entry point
│   ├── RemoteAudio.tsx              ← remote peer audio element
│   ├── useWebRTC.ts                 ← mediasoup-client React hook
│   └── voice/
│       ├── audio.ts                 ← PCM worklet (optional WS voice path)
│       ├── emotion-engine.ts        ← text → TTS param deltas  ←NEW
│       ├── persona.ts               ← rule-based AI brain
│       ├── poetry.ts                ← ambient phrase library
│       ├── speech-queue.ts          ← priority TTS queue          ←NEW
│       ├── types.ts                 ← shared types
│       ├── voice-loop.ts            ← useVoiceLoop() React hook (UPDATED)
│       ├── voice-presets.ts         ← 6 voice profiles            ←NEW
│       ├── voice-registry.ts        ← runtime voice discovery      ←NEW
│       └── voice-loop.ts
│
├── services/sfu/                    ← Node.js SFU backend
│   ├── package.json
│   ├── tsconfig.json                ← SFU TS config (CommonJS, ES2022)
│   └── src/
│       ├── index.ts                 ← entry point
│       ├── server.ts                ← Express + WS setup
│       ├── auth.ts                  ← JWT validation
│       ├── config.ts                ← typed config loader
│       ├── logger.ts                ← pino multistream
│       ├── metrics.ts               ← /metrics endpoint
│       ├── agents/
│       │   ├── aria.ts              ← AGT-001
│       │   ├── vector.ts            ← AGT-002
│       │   ├── ward.ts              ← AGT-003
│       │   ├── sentinel.ts          ← AGT-004
│       │   ├── nexus.ts             ← AGT-005
│       │   ├── repair.ts            ← AGT-006
│       │   ├── governor.ts          ← AGT-007
│       │   └── scaler.ts            ← AGT-008
│       ├── governance.ts            ← policy engine + rate limiter
│       ├── runtime.ts               ← AgentRuntime singleton
│       ├── guardian/                ← Guardian Core              ←NEW
│       │   ├── runtime-mode.ts      ← Mode A / B / C
│       │   ├── intent-router.ts     ← fast lane classifier
│       │   ├── stats-worker.ts      ← RTC health scorer
│       │   └── summary-worker.ts    ← LLM bridge (optional)
│       ├── mediasoup/
│       │   ├── room.ts              ← Room class
│       │   └── worker.ts            ← Worker lifecycle
│       └── signaling/
│           └── handler.ts           ← WS message handler
│
├── clients/web-demo/                ← legacy demo (reference)
├── configs/                         ← example configs
├── deploy/                          ← docker-compose + systemd
│   └── coturn/turnserver.conf
├── docs/
│   ├── architecture.md              ← system architecture
│   ├── agents.md                    ← agent fleet reference
│   ├── guardian-core.md             ← THIS FILE — full blueprint
│   ├── voice-pipeline.md            ← voice system
│   ├── deployment.md                ← deployment guide
│   └── integration.md               ← integration guide
└── logs/                            ← runtime log output (git-ignored)
    ├── combined.log
    ├── ARIA.log
    ├── VECTOR.log
    └── governance.log
```

---

*LeeWay Industries | LeeWay Innovation — Created by Leonard Lee*  
*Self-hosted. Vendor-free. Built for the edge.*
