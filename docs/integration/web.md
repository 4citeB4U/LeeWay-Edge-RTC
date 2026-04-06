# Web & App Integration Guide

## Overview

LeeWay provides a WebSocket-based signaling API backed by a mediasoup SFU. Integrate with any web or mobile app that can:
- Open a WebSocket connection
- Use a WebRTC library that supports custom signaling (mediasoup-client, Pion, etc.)

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
// ...see full docs for details
```
