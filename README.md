# LeeWay Edge RTC

> **Production-oriented, self-hosted WebRTC edge service – no SaaS fees, no vendor lock-in.**

[![CI](https://github.com/4citeB4U/LeeWay-Edhe-RTC/actions/workflows/ci.yml/badge.svg)](https://github.com/4citeB4U/LeeWay-Edhe-RTC/actions/workflows/ci.yml)

## What it is

LeeWay Edge RTC is a complete, self-hosted WebRTC media stack:

| Component | Technology | Role |
|---|---|---|
| **SFU** | [mediasoup](https://mediasoup.org/) (Node.js + C++ worker) | Selective Forwarding Unit – routes audio/video between peers |
| **Signaling** | WebSocket + JWT auth | Room lifecycle, transport/producer/consumer negotiation |
| **TURN** | [coturn](https://github.com/coturn/coturn) | NAT traversal for restrictive networks |
| **Web demo** | React + mediasoup-client + Vite | End-to-end validation; open two tabs to test |

## Quick start (local docker compose)

```bash
git clone https://github.com/4citeB4U/LeeWay-Edhe-RTC.git
cd LeeWay-Edhe-RTC

# Copy default env (review before using in production)
cp services/sfu/.env.example services/sfu/.env

# Build and start all services
docker compose -f deploy/docker-compose.yml up --build

# Open the web demo
open http://localhost:8080
```

Open a **second browser tab** to the same URL → both tabs join the same room → publish audio → hear each other.

## Repository layout

```
.
├── services/sfu/          # mediasoup SFU + WebSocket signaling (TypeScript)
├── clients/web-demo/      # React web client demo (TypeScript + Vite)
├── deploy/
│   ├── docker-compose.yml         # local development
│   ├── docker-compose.prod.yml    # production override
│   ├── coturn/turnserver.conf     # TURN config template
│   └── systemd/                   # bare-metal edge systemd units
├── configs/               # .env.example and production config stubs
├── docs/                  # architecture, deployment, integration guides
└── .github/workflows/     # CI: typecheck + Docker image builds
```

## Features

- **SFU routing** via mediasoup workers (round-robin, multi-core)
- **Simulcast** (VP8/VP9 r0/r1/r2 encodings) and **TWCC** transport-cc feedback
- **JWT-based auth** on every signaling connection
- **Per-IP rate limiting** and max message size enforcement
- **Structured JSON logs** (pino) and **Prometheus metrics** at `/metrics`
- **coturn TURN** with time-limited shared-secret credentials
- **docker compose** one-command local dev + production compose override
- **systemd units** for bare-metal edge deployment

## Firewall / Ports

| Port | Protocol | Purpose |
|---|---|---|
| 3000 | TCP | SFU: health, metrics, WebSocket signaling |
| 8080 | TCP | Web demo (docker compose only) |
| 3478 | UDP + TCP | STUN / TURN |
| 5349 | UDP + TCP | TURN TLS |
| 40000–49999 | UDP | RTP / RTCP media |

## NATed / cloud deployment

Set `ANNOUNCED_IP` to your server's **public IP** in `services/sfu/.env`:

```env
ANNOUNCED_IP=203.0.113.42
```

Without this, ICE candidates won't be reachable from the internet.

## Documentation

- [Architecture overview](docs/architecture.md)
- [Deployment guide](docs/deployment.md) (docker compose, bare-metal)
- [Integration guide](docs/integration.md) (web, iOS, Android)

## License

MIT
