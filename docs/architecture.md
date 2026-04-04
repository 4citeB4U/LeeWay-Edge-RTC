# Architecture Overview

## Components

```
┌─────────────────────────────────────────────────────┐
│                  Client (browser / mobile)          │
│  mediasoup-client / WebRTC SDK                      │
└──────────────┬─────────────────┬───────────────────┘
               │ WebSocket (WS)  │ ICE/DTLS/SRTP (UDP)
               ▼                 ▼
┌─────────────────────────┐   ┌────────────────────────┐
│   LeeWay SFU Service    │   │   coturn TURN server   │
│                         │   │                        │
│  ┌───────────────────┐  │   │  Relays UDP for NAT    │
│  │  Express HTTP     │  │   │  traversal using       │
│  │  /health /metrics │  │   │  shared-secret HMAC    │
│  └───────────────────┘  │   │  credentials           │
│  ┌───────────────────┐  │   └────────────────────────┘
│  │  WS Signaling     │  │
│  │  JWT auth         │  │
│  │  rate limiting    │  │
│  └────────┬──────────┘  │
│           │              │
│  ┌────────▼──────────┐  │
│  │  mediasoup        │  │
│  │  Workers (C++)    │  │
│  │  Routers / Rooms  │  │
│  │  Transports       │  │
│  │  Producers        │  │
│  │  Consumers        │  │
│  └───────────────────┘  │
└─────────────────────────┘
               │
               ▼
┌─────────────────────────┐
│  Prometheus / Grafana   │
│  (scrapes /metrics)     │
└─────────────────────────┘
```

## Data Flow

### Publish (send) path
1. Client obtains a JWT token (from your auth service, or `/dev/token` in dev mode).
2. Client opens a WebSocket to `/ws`.
3. Client sends `auth { token }`.
4. Client sends `joinRoom { roomId, rtpCapabilities }`.
5. SFU returns `routerRtpCapabilities` + list of existing producers.
6. Client sends `createTransport { direction: "send" }`.
7. SFU creates a mediasoup `WebRtcTransport` and returns ICE/DTLS parameters.
8. Client (mediasoup-client) creates a `SendTransport`, performs ICE/DTLS handshake.
9. Client calls `transport.produce({ track })` → signaling message `produce { kind, rtpParameters }`.
10. SFU creates a mediasoup `Producer`; broadcasts `newProducer` to other room members.

### Subscribe (recv) path
1. Subscriber joins the room (steps 1-5 above, or already joined).
2. Subscriber sends `createTransport { direction: "recv" }` → gets recv transport params.
3. For each producer it wants to receive, subscriber sends `consume { transportId, producerId, rtpCapabilities }`.
4. SFU creates a mediasoup `Consumer`, returns `consumerId + rtpParameters`.
5. Subscriber resumes the consumer via `resumeConsumer`.
6. Audio/video frames flow via SRTP over UDP.

## Simulcast and TWCC

- Publishers can send multiple simulcast layers (r0/r1/r2) using standard WebRTC simulcast.
- mediasoup collects **Transport-CC (TWCC)** feedback and generates RTCP feedback packets automatically.
- Layer selection policy hooks are available in `services/sfu/src/mediasoup/room.ts` (see `consume` method; extend to implement custom preferred-layer selection).

## Security

| Layer | Mechanism |
|---|---|
| Signaling auth | JWT (HS256); token verified before any room action |
| Media encryption | DTLS-SRTP (mandatory; enforced by mediasoup) |
| TURN credentials | Time-limited HMAC-SHA1 shared-secret |
| WebSocket rate limiting | Per-IP connection limit + max message size |

## Ports and Firewall

| Port | Protocol | Purpose |
|---|---|---|
| 3000 | TCP | SFU HTTP (health, metrics, signaling WS) |
| 3478 | UDP + TCP | STUN / TURN |
| 5349 | UDP + TCP | TURN TLS |
| 40000–49999 | UDP | RTP / RTCP media (configurable) |

> **NATed deployment:** set `ANNOUNCED_IP` to your public IP in the SFU env so mediasoup ICE candidates are reachable.
