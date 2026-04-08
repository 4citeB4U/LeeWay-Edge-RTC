# Integration Guide

## Overview

LeeWay provides a WebSocket-based signaling API backed by a mediasoup SFU.
You can integrate it into any web or mobile app that can:
- Open a WebSocket connection.
- Use a WebRTC library that supports custom signaling (mediasoup-client, Pion, etc.).

### What's New

- ✅ **Automatic WebSocket Retry** — 3 attempts with exponential backoff (1s, 2s, 4s)
- ✅ **10-second Connection Timeout** — Prevents hanging connections
- ✅ **Call Mode Runtime** — Real-time voice session orchestration
- ✅ **Voice Persistence** — Save and reuse user voice configuration
- ✅ **Visual Overlays** — Real-time detection boxes on video feeds

---

## Web integration (mediasoup-client)

### 1. Install the client SDK

```bash
npm install mediasoup-client
```

### 2. Connect and authenticate

```ts
const ws = new WebSocket('wss://your-sfu-host/ws');

// Obtain a JWT from your auth service
const token = await fetchTokenFromYourAuthService();

ws.onopen = () => ws.send(JSON.stringify({ id: 1, type: 'auth', token }));
```

### 3. Join a room

```ts
ws.send(JSON.stringify({
  id: 2,
  type: 'joinRoom',
  roomId: 'my-room',
  rtpCapabilities: {},   // placeholder; filled in after loading device
}));
```

### 4. Load the mediasoup device

After receiving the `joinRoom` response with `routerRtpCapabilities`:

```ts
import { Device } from 'mediasoup-client';
const device = new Device();
await device.load({ routerRtpCapabilities: response.routerRtpCapabilities });
```

### 5. Create a send transport and publish

```ts
// Request transport params from the SFU
ws.send(JSON.stringify({ id: 3, type: 'createTransport', direction: 'send' }));

// After receiving transport params:
const sendTransport = device.createSendTransport({ id, iceParameters, iceCandidates, dtlsParameters });

sendTransport.on('connect', ({ dtlsParameters }, cb) => {
  ws.send(JSON.stringify({ type: 'connectTransport', transportId: sendTransport.id, dtlsParameters }));
  // call cb() after receiving ok
});

sendTransport.on('produce', ({ kind, rtpParameters }, cb) => {
  ws.send(JSON.stringify({ type: 'produce', transportId: sendTransport.id, kind, rtpParameters }));
  // call cb({ id: producerId }) after receiving ok
});

const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
const producer = await sendTransport.produce({ track: stream.getAudioTracks()[0] });
```

### 6. Subscribe to remote audio

When the SFU pushes a `newProducer` event:

```ts
// Create recv transport (once)
ws.send(JSON.stringify({ id: 4, type: 'createTransport', direction: 'recv' }));
const recvTransport = device.createRecvTransport({ ... });

// Consume
ws.send(JSON.stringify({
  type: 'consume',
  transportId: recvTransport.id,
  producerId,
  rtpCapabilities: device.rtpCapabilities,
}));

// After receiving consumer params:
const consumer = await recvTransport.consume({ id, producerId, kind, rtpParameters });
ws.send(JSON.stringify({ type: 'resumeConsumer', consumerId: consumer.id }));

const audioEl = document.createElement('audio');
audioEl.srcObject = new MediaStream([consumer.track]);
audioEl.play();
```

---

## Mobile integration

### iOS / Android (React Native)

- Use [`react-native-webrtc`](https://github.com/react-native-webrtc/react-native-webrtc) for the WebRTC transport layer.
- Implement the same WebSocket signaling protocol described above.
- mediasoup-client has a React Native build; follow the [mediasoup-client-rn guide](https://mediasoup.org/documentation/v3/mediasoup-client/rn/).

### Native iOS (Swift)

- Use Apple's native `WebRTC.framework` (built into iOS 15+) or [`react-native-webrtc`](https://github.com/react-native-webrtc/react-native-webrtc).
- Implement the signaling protocol over `URLSessionWebSocketTask`.

### Native Android (Kotlin)

- Use [`react-native-webrtc`](https://github.com/react-native-webrtc/react-native-webrtc) or the community WebRTC Android build at [webrtc.org](https://webrtc.org/getting-started/android).
- Implement the signaling protocol over `OkHttp` WebSocket.

---

## JWT token format

```json
{
  "sub": "user-id",
  "roomId": "optional-room-restriction",
  "iat": 1700000000,
  "exp": 1700028800
}
```

Signed with `JWT_SECRET` using HS256. The `/dev/token` endpoint (non-production only)
can generate tokens for testing.

---

## Signaling message reference

| Direction | Type | Fields | Description |
|---|---|---|---|
| C→S | `auth` | `token` | Authenticate with JWT |
| C→S | `joinRoom` | `roomId`, `rtpCapabilities` | Join or create a room |
| C→S | `leaveRoom` | – | Leave current room |
| C→S | `createTransport` | `direction` (send/recv) | Request a WebRTC transport |
| C→S | `connectTransport` | `transportId`, `dtlsParameters` | Complete DTLS handshake |
| C→S | `produce` | `transportId`, `kind`, `rtpParameters` | Start publishing |
| C→S | `consume` | `transportId`, `producerId`, `rtpCapabilities` | Start subscribing |
| C→S | `resumeConsumer` | `consumerId` | Resume a paused consumer |
| C→S | `pauseProducer` | `producerId` | Pause your producer |
| C→S | `resumeProducer` | `producerId` | Resume your producer |
| C→S | `closeProducer` | `producerId` | Stop publishing |
| S→C | `newProducer` | `producerId`, `peerId`, `kind` | New producer in room |
| S→C | `producerClosed` | `producerId` | Producer was closed |
| S→C | `peerLeft` | `peerId` | Peer disconnected |

All client→server messages should include an `id` field; the server echoes it in the response.

---

## Call Mode Runtime

### Overview

**Call Mode** is a real-time voice session orchestrator that runs on top of the existing WebRTC and voice systems. It provides:

- **Microphone Capture**: Automatic speech-to-text with browser Speech Recognition API
- **Turn-Taking**: Pause listening while processing/speaking
- **Session Management**: Start/stop call sessions with visual state indicators
- **Voice Output**: Play responses using saved VoiceStudio voice configuration
- **Interruption Handling**: Allow users to interrupt the agent mid-sentence
- **Governance Integration**: Route responses through existing approval systems

### Quick Start

#### 1. Import and initialize

```tsx
import { useCallMode } from '@/runtime/CallMode';
import { CallModeUI } from '@/components/CallModeUI';

export function App() {
  const callMode = useCallMode();
  
  return (
    <div>
      <CallModeUI callMode={callMode} />
    </div>
  );
}
```

#### 2. Configure voice (one-time)

Visit **VoiceStudio** to select and save your voice configuration:
- Voice name (system voices)
- Speech rate (0.5–2.0)
- Pitch (0.5–2.0)
- Volume (0.0–1.0)

Saved in `localStorage` as `leeway_voice_custom`. Call Mode automatically uses this configuration.

#### 3. Start a session

```tsx
await callMode.startSession();
// Microphone enabled, listening for speech
// UI shows: 🎤 Listening... [STOP]
```

#### 4. Process and respond

```tsx
// After user speaks, the input is captured and routed to your agent:
callMode.onInput((text: string) => {
  // Send to governance layer / agent pipeline
  const response = await agentPipeline.process(text);
  
  // Call Mode plays the response with saved voice config
  callMode.speakResponse(response);
});
```

#### 5. Interrupt handling

```tsx
// User clicks [INTERRUPT] button while agent is speaking
callMode.interrupt();
// Current speech stops immediately, resumes listening
```

### API Reference

#### `useCallMode()` Hook

```ts
interface CallModeController {
  // Session lifecycle
  init(): Promise<void>;
  startSession(): Promise<void>;
  stopSession(): void;
  
  // State
  phase: 'idle' | 'listening' | 'processing' | 'speaking' | 'error';
  isListening: boolean;
  isMuted: boolean;
  currentTranscript: string;
  
  // Control
  toggleMute: () => void;
  interrupt: () => void;
  processInput: (input: string) => Promise<void>;
  speakResponse: (text: string) => Promise<void>;
  
  // Config
  setLanguage: (lang: string) => void;
  getLanguage: () => string;
}
```

#### Voice Configuration

Managed by `src/voice/voice-config.ts`:

```ts
interface VoiceConfig {
  voiceName: string;    // e.g., "Google UK English Female"
  rate: number;         // 0.5 – 2.0, default 1.0
  pitch: number;        // 0.5 – 2.0, default 1.0
  volume: number;       // 0.0 – 1.0, default 1.0
}

// Load/save
const config = loadVoiceConfig();
saveVoiceConfig({ ...config, rate: 1.2 });
```

### Visual Indicators

**CallModeUI** displays:

| State | Display |
|-------|---------|
| `idle` | ⚪ Ready to start |
| `listening` | 🎤 Listening... |
| `processing` | ⏳ Processing... |
| `speaking` | 🔊 Speaking... |
| `error` | ❌ Connection error |

**Phase transitions**:
```
idle → listening (user clicks START)
  ↓
listening (waits for speech input)
  ↓
processing (speech detected, routing to agent)
  ↓
speaking (agent response playing)
  ↓
listening (loop back, wait for next input)
```

User can **interrupt** at any point by clicking [INTERRUPT].

### Governance Integration

To integrate Call Mode with your governance/approval layer:

```tsx
// In your agent pipeline
callMode.onInput(async (userInput: string) => {
  try {
    // Route through governance
    const approved = await governanceLayer.checkPolicy(userInput, context);
    if (!approved) {
      callMode.speakResponse("Your request was not approved.");
      return;
    }
    
    // Process
    const response = await agentPipeline.process(userInput);
    
    // Speak response
    await callMode.speakResponse(response);
  } catch (error) {
    callMode.phase = 'error';
  }
});
```

### Troubleshooting

**Symptom**: "Microphone permission denied"
- **Solution**: Check browser privacy settings; ensure HTTPS in production.

**Symptom**: "Voice not speaking / empty response"
- **Solution**: Verify voice config is saved in VoiceStudio. Check browser console for speech synthesis errors.

**Symptom**: "No audio input detected"
- **Solution**: Test microphone with `navigator.mediaDevices.enumerateDevices()`. Ensure system audio permissions granted.

### Full Configuration Guide

For advanced setup (custom language models, agent parameters, governance hooks), see [CALL_MODE_INTEGRATION.md](./CALL_MODE_INTEGRATION.md).
