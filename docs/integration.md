# Integration Guide

## Overview

LeeWay provides a WebSocket-based signaling API backed by a mediasoup SFU.
You can integrate it into any web or mobile app that can:
- Open a WebSocket connection.
- Use a WebRTC library that supports custom signaling (mediasoup-client, Pion, etc.).

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

- Use [GoogleWebRTC](https://cocoapods.org/pods/GoogleWebRTC) or WebRTC.framework.
- Implement the signaling protocol over `URLSessionWebSocketTask`.

### Native Android (Kotlin)

- Use the [WebRTC Android SDK](https://webrtc.googlesource.com/src/+/refs/heads/main/sdk/android).
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
