# LeeWay Edge RTC — System Overview

This document provides a high-level overview of the LeeWay Edge RTC system, including architecture, workflow, agent structure, local models, and operational tools. All diagrams are generated with Mermaid for easy maintenance.

---

## 1. System Architecture

```mermaid
graph TB
  subgraph Edge["Edge Device / Server (Fly.io)"]
    SFU["LeeWay SFU\nNode 20 + mediasoup\nPort 3000"]
    COTURN["coturn TURN\nPort 3478 / 5349"]
    subgraph RUNTIME["Single Node.js Runtime"]
      AGENTS["9 Agent Fleet\n(AGT-001 to AGT-009)"]
      LOGS["logs/ directory\ncombined.log + per-agent"]
    end
    SFU --- AGENTS
    SFU --- COTURN
    AGENTS --> LOGS
  end
  subgraph Static["Static Hosting (GitHub Pages)"]
    UI["LeeWay Edge RTC\nReact 19 + Vite + Tailwind v4\nVoice Pipeline (Web Speech API)"]
  end
  subgraph Clients["Client Devices (1000s of apps)"]
    BROWSER["Browser / PWA"]
    MOBILE["React Native"]
    IOT["IoT / Edge Client"]
  end
  Clients -->|WebSocket JWT| SFU
  Clients -->|ICE/DTLS/SRTP UDP| SFU
  Clients -->|UDP relay NAT| COTURN
  BROWSER --> UI
  UI -->|wss:// signaling| SFU
```

---

## 2. Workflow: Publish/Subscribe

### Publish Path
```mermaid
sequenceDiagram
  participant C as Client
  participant SFU as LeeWay SFU
  participant MS as mediasoup Worker
  C->>SFU: WS auth { token }
  SFU->>SFU: JWT verify (HS256)
  C->>SFU: joinRoom { roomId, rtpCapabilities }
  SFU->>MS: getRouter(roomId)
  SFU-->>C: routerRtpCapabilities + producers[]
  C->>SFU: createTransport { direction: "send" }
  SFU->>MS: createWebRtcTransport()
  SFU-->>C: iceParameters, dtlsParameters, iceCandidates
  C->>SFU: connectTransport { dtlsParameters }
  C->>SFU: produce { kind, rtpParameters }
  SFU->>MS: transport.produce()
  SFU-->>C: producerId
  SFU--)Peers: newProducer { producerId }
```

### Subscribe Path
```mermaid
sequenceDiagram
  participant S as Subscriber
  participant SFU as LeeWay SFU
  participant MS as mediasoup Worker
  S->>SFU: createTransport { direction: "recv" }
  SFU->>MS: createWebRtcTransport()
  SFU-->>S: iceParameters, dtlsParameters, iceCandidates
  S->>SFU: connectTransport { dtlsParameters }
  S->>SFU: consume { transportId, producerId, rtpCapabilities }
  SFU->>MS: transport.consume()
  SFU-->>S: consumerId, rtpParameters
  S->>SFU: resumeConsumer { consumerId }
  SFU->>MS: consumer.resume()
  SFU-->>S: ok
```

---

## 3. Agent Fleet & Governance

```mermaid
graph TD
  OPERATOR([👨‍💻 OPERATOR]):::op
  GOVERNOR([AGT-007 GOVERNOR]):::oversight
  ARIA([AGT-001 ARIA]):::core
  VECTOR([AGT-002 VECTOR]):::core
  WARD([AGT-003 WARD]):::core
  SENTINEL([AGT-004 SENTINEL]):::core
  NEXUS([AGT-005 NEXUS]):::core
  REPAIR([AGT-006 REPAIR]):::infra
  SCALER([AGT-008 SCALER]):::infra
  OBSERVER([AGT-009 OBSERVER]):::core
  OPERATOR -->|owns| GOVERNOR
  GOVERNOR -->|audits| ARIA
  GOVERNOR -->|audits| VECTOR
  GOVERNOR -->|audits| WARD
  GOVERNOR -->|audits| SENTINEL
  GOVERNOR -->|audits| NEXUS
  GOVERNOR -->|audits| REPAIR
  GOVERNOR -->|audits| SCALER
  GOVERNOR -->|audits| OBSERVER
  REPAIR -->|auto-heals| ARIA
  REPAIR -->|auto-heals| VECTOR
  REPAIR -->|auto-heals| WARD
  REPAIR -->|auto-heals| SENTINEL
  REPAIR -->|auto-heals| NEXUS
  REPAIR -->|auto-heals| SCALER
  REPAIR -->|auto-heals| OBSERVER
  classDef op fill:#f59e0b,color:#000;
  classDef oversight fill:#ef4444,color:#fff;
  classDef core fill:#3b82f6,color:#fff;
  classDef infra fill:#8b5cf6,color:#fff;
```

---

## 4. Local Model & Tools

- **Local LLM (optional):** Can be integrated via the slow lane for advanced reasoning.
- **Voice Pipeline:** 100% browser-native, no vendor APIs. See `docs/voice-pipeline.md` for details.
- **Call Mode Runtime:** Real-time voice session orchestration with SpeechRecognition API + saved voice config. See `docs/integration.md#call-mode-runtime` for details.
- **Monitoring:** Prometheus metrics at `/metrics`, connection/session APIs at `/connections` and `/rooms`.

---

## 5. Operations & Monitoring

- **Health:** `GET /health` — returns status and timestamp.
- **Metrics:** `GET /metrics` — Prometheus/Grafana ready.
- **Agents:** `GET /agents` — all agent snapshots.
- **Connections:** `GET /connections` — all active peer connections.
- **Rooms:** `GET /rooms` — all active rooms and peer details.

---

## 6. Setup & Integration

- See `docs/deployment.md` for deployment instructions (Docker, bare-metal, cloud).
- See `docs/integration.md` for client and app integration, including Call Mode runtime.
- See `docs/CALL_MODE_INTEGRATION.md` for Call Mode advanced setup and governance integration.
- See `docs/agents.md` for agent details and governance.
- See `docs/voice-pipeline.md` for voice and TTS/STT pipeline details.

---

## 7. Contact & Support

For questions, open an issue or contact LeeWay Industries.
