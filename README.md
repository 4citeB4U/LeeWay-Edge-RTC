# LeeWay Edge RTC SDK

**LeeWay Industries | Sovereign Communication Hybrid**

> Real-time WebRTC backbone for voice-enabled AI applications. Enterprise-grade, self-hosted, vendor-agnostic.

---

## What You Get

- ✅ **Headless RTC logic** – Mediasoup SFU for audio/video routing
- ✅ **Voice orchestration** – Speech-to-text, emotion engine, preset voices
- ✅ **React components** – Pre-built UI for diagnostics, voice tuning, and vision
- ✅ **Zero vendor AI** – Run entirely offline; no cloud TTS or AI dependencies
- ✅ **Enterprise ready** – Docker, multi-tenant rooms, JWT auth, Prometheus metrics

---

## Quick Start with SDK

### 1. Install the Package

```bash
npm install leeway-edge-rtc
```

### 2. Use the SDK in Your React App

```typescript
import {
  LeewaySDK,
  useRTCStore,
  DiagnosticSpectrum,
  VoiceTuner,
  AgentHub,
  FederationRouter,
} from 'leeway-edge-rtc';

// Initialize SDK
const sdk = new LeewaySDK('your-api-key');

// Get authentication params
const authParams = sdk.getAuthParams();

// In your component
function VoiceApp() {
  const rtcState = useRTCStore();

  return (
    <div>
      <DiagnosticSpectrum />
      <VoiceTuner />
      <AgentHub />
    </div>
  );
}
```

### 3. Connect to SFU Backend

Set your environment variables:

```bash
VITE_SIGNALING_URL=wss://your-sfu-host/ws
VITE_HTTP_BASE_URL=https://your-sfu-host
```

### 4. Deploy Your App

```bash
npm run build
```

---

## API Reference

### LeewaySDK Class

```typescript
new LeewaySDK(apiKey: string)
  .getAuthParams() → { key: string, timestamp: number }
```

### Hooks & Components

| Export | Type | Purpose |
|--------|------|---------|
| `useRTCStore()` | Hook | Access RTC state, peer stats, connection events |
| `useFederationRouter()` | Hook | Route connections across federated nodes |
| `DiagnosticSpectrum` | Component | Real-time peer health visualization |
| `VoiceTuner` | Component | Voice preset selector and emotion controls |
| `VisionLab` | Component | Video feed diagnostics |
| `AgentHub` | Component | Agent status and control panel |
| `EconomicMoat` | Component | Network security & metrics dashboard |
| `GalaxyBackground` | Component | Animated background for voice UIs |

---

## Environment Variables

Create a `.env.local` file in your project:

```env
# ─── Frontend (Vite) ─────────────────────────────────────────
VITE_BASE_URL=/
VITE_SIGNALING_URL=wss://localhost:3000/ws
VITE_HTTP_BASE_URL=http://localhost:3000

# ─── TTS Configuration ────────────────────────────────────────
TTS_ENABLED=true
TTS_PROVIDER=edge
TTS_VOICE=en-US-ChristopherNeural
TTS_RATE=+0%

# ─── WebRTC ───────────────────────────────────────────────────
RTC_MIN_PORT=40000
RTC_MAX_PORT=40099

# ─── Logging ───────────────────────────────────────────────────
LOG_LEVEL=info
```

---

## Running the Backend

The backend SFU must be running for the SDK to connect.

### Docker

```bash
docker compose -f deploy/docker-compose.yml up --build
```

This starts:
- **SFU** on port 3000 (HTTP + WebSocket)
- **TURN server** on ports 3478/5349

### Local Development

```bash
# Install dependencies
cd services/sfu
npm install

# Build TypeScript
npm run build

# Start server
node dist/index.js
```

The SFU will run on `http://localhost:3000`

---

## Deployment

### To Fly.io

```bash
fly auth login
fly deploy --config services/sfu/fly.toml
```

Set required secrets:
```bash
fly secrets set JWT_SECRET=<your-secret> --app your-app-name
fly secrets set LEEWAY_MODE=balanced --app your-app-name
```

### To Docker Registry

```bash
docker build -t your-registry/leeway-sfu:latest services/sfu/
docker push your-registry/leeway-sfu:latest
```

---

## Monitoring & Health

Once running, check:

| Endpoint | Purpose |
|----------|---------|
| `GET /health` | System health status |
| `GET /metrics` | Prometheus metrics |
| `GET /agents` | Agent registry |
| `WebSocket /ws` | Real-time signaling |

---

## Troubleshooting

**Q: "Cannot connect to SFU"**  
A: Ensure `VITE_SIGNALING_URL` points to your running SFU and CORS is enabled.

**Q: "WebRTC connection drops"**  
A: Check firewall rules for ports 3000, 3478, 5349, and RTP range (40000–40099).

**Q: "Voice not working"**  
A: Enable TTS in `.env` and ensure `TTS_VOICE` matches your system locale.

---

## License

PROPRIETARY — LeeWay Industries. All rights reserved.

For licensing inquiries, contact: **414-303-8580**

---

## Support

- **Documentation:** See [docs/](./docs/) directory
- **Issues:** GitHub Issues
- **Community:** Join our development community
