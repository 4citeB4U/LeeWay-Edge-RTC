/*
LEEWAY HEADER — DO NOT REMOVE
REGION: CLIENT.WEB-DEMO
TAG: CLIENT.RTC.HOOK
COLOR_ONION_HEX: NEON=#00FFD1 FLUO=#00B4FF PASTEL=#C7F0FF
5WH:
  WHAT = useWebRTC hook — connects to LeeWay SFU via WebSocket + mediasoup-client
  WHY  = Manages WebRTC peer lifecycle: auth, room join, transport, produce, consume
  WHO  = LeeWay Industries | LeeWay Innovation | Creator: Leonard Lee
  WHERE = clients/web-demo/src/useWebRTC.ts
  WHEN = 2026
  HOW  = Fetch JWT → WS handshake → mediasoup Device → bidirectional transports
AGENTS: ASSESS ALIGN AUDIT
LICENSE: PROPRIETARY
*/
import { useCallback, useEffect, useRef, useState } from 'react';
import * as mediasoupClient from 'mediasoup-client';

// ── Types ─────────────────────────────────────────────────────────────────────

export type ConnectionState =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'failed';

export interface PeerInfo {
  peerId: string;
  kind: 'audio' | 'video';
  producerId: string;
}

export interface RTCStats {
  bitrate: number;
  packetLoss: number;
  rtt: number;
  jitter: number;
}

export interface WebRTCState {
  connectionState: ConnectionState;
  peerId: string;
  roomId: string;
  peers: PeerInfo[];
  stats: RTCStats;
  isPublishingAudio: boolean;
  isPublishingVideo: boolean;
  error: string | null;
}

export interface WebRTCApi {
  state: WebRTCState;
  connect: (roomId?: string) => Promise<void>;
  disconnect: () => void;
  publishAudio: () => Promise<void>;
  publishVideo: () => Promise<void>;
  stopAudio: () => void;
  stopVideo: () => void;
  remoteStreams: Map<string, MediaStream>;
}

// ── Config ────────────────────────────────────────────────────────────────────

const DEFAULT_ROOM = 'leeway-main';
const WS_URL = import.meta.env.VITE_SIGNALING_URL ?? `ws://${window.location.host}/ws`;
const HTTP_BASE = import.meta.env.VITE_HTTP_BASE_URL ?? '';

const INITIAL_STATE: WebRTCState = {
  connectionState: 'idle',
  peerId: '',
  roomId: DEFAULT_ROOM,
  peers: [],
  stats: { bitrate: 0, packetLoss: 0, rtt: 0, jitter: 0 },
  isPublishingAudio: false,
  isPublishingVideo: false,
  error: null,
};

// ── Internal helpers ──────────────────────────────────────────────────────────

let _id = 0;
function nextId() { return ++_id; }

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useWebRTC(): WebRTCApi {
  const [state, setState] = useState<WebRTCState>(INITIAL_STATE);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());

  const wsRef          = useRef<WebSocket | null>(null);
  const deviceRef      = useRef<mediasoupClient.Device | null>(null);
  const sendTrans      = useRef<mediasoupClient.types.Transport | null>(null);
  const recvTrans      = useRef<mediasoupClient.types.Transport | null>(null);
  const audioProducer  = useRef<mediasoupClient.types.Producer | null>(null);
  const videoProducer  = useRef<mediasoupClient.types.Producer | null>(null);
  const localStream    = useRef<MediaStream | null>(null);
  const statsTimer     = useRef<ReturnType<typeof setInterval> | null>(null);
  const pending        = useRef<Map<number, { resolve: (d: unknown) => void; reject: (e: Error) => void }>>(new Map());

  // ── WS send/request ──────────────────────────────────────────────────────

  function wsSend(msg: object) {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }

  function wsRequest<T = unknown>(msg: object): Promise<T> {
    const id = nextId();
    return new Promise<T>((resolve, reject) => {
      pending.current.set(id, {
        resolve: resolve as (d: unknown) => void,
        reject,
      });
      wsSend({ ...msg, id });
      setTimeout(() => {
        if (pending.current.has(id)) {
          pending.current.delete(id);
          reject(new Error(`WS request timeout: ${JSON.stringify(msg)}`));
        }
      }, 15_000);
    });
  }

  // ── Consume a producer from a remote peer ────────────────────────────────

  async function consumeProducer(producerId: string, peerId: string, _kind: 'audio' | 'video') {
    if (!recvTrans.current || !deviceRef.current) return;
    try {
      const data = await wsRequest<{
        consumerId: string;
        producerId: string;
        kind: string;
        rtpParameters: mediasoupClient.types.RtpParameters;
      }>({
        type: 'consume',
        transportId: recvTrans.current.id,
        producerId,
        rtpCapabilities: deviceRef.current.rtpCapabilities,
      });

      const consumer = await recvTrans.current.consume({
        id: data.consumerId,
        producerId: data.producerId,
        kind: data.kind as 'audio' | 'video',
        rtpParameters: data.rtpParameters,
      });

      await wsRequest({ type: 'resumeConsumer', consumerId: consumer.id });

      // Attach to MediaStream
      setRemoteStreams(prev => {
        const next = new Map(prev);
        let stream = next.get(peerId);
        if (!stream) {
          stream = new MediaStream();
          next.set(peerId, stream);
        }
        stream.addTrack(consumer.track);
        return next;
      });

      consumer.on('transportclose', () => {
        setRemoteStreams(prev => {
          const next = new Map(prev);
          next.delete(peerId);
          return next;
        });
      });
    } catch (err) {
      console.error('[useWebRTC] consumeProducer failed', err);
    }
  }

  // ── Connect ───────────────────────────────────────────────────────────────

  const connect = useCallback(async (roomId = DEFAULT_ROOM) => {
    setState(prev => ({ ...prev, connectionState: 'connecting', error: null }));
    try {
      // Fetch dev JWT
      const tokenRes = await fetch(`${HTTP_BASE}/dev/token`);
      const { token } = await tokenRes.json() as { token: string };

      // Open WebSocket
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      await new Promise<void>((res, rej) => {
        ws.onopen  = () => res();
        ws.onerror = () => rej(new Error('WebSocket connection failed'));
      });

      // Handle incoming messages
      ws.onmessage = async (evt) => {
        const msg = JSON.parse(evt.data as string) as Record<string, unknown>;

        // Resolve pending requests
        if (typeof msg.id === 'number') {
          const p = pending.current.get(msg.id);
          if (p) {
            pending.current.delete(msg.id);
            if (msg.ok) p.resolve(msg);
            else p.reject(new Error(String(msg.error ?? 'Unknown SFU error')));
          }
        }

        // New producer in room → consume it
        if (msg.type === 'newProducer') {
          await consumeProducer(
            msg.producerId as string,
            msg.peerId as string,
            msg.kind as 'audio' | 'video',
          );
          setState(prev => ({
            ...prev,
            peers: [...prev.peers.filter(p => p.producerId !== msg.producerId), {
              peerId: msg.peerId as string,
              producerId: msg.producerId as string,
              kind: msg.kind as 'audio' | 'video',
            }],
          }));
        }

        // Peer left
        if (msg.type === 'peerLeft') {
          const leftId = msg.peerId as string;
          setState(prev => ({
            ...prev,
            peers: prev.peers.filter(p => p.peerId !== leftId),
          }));
          setRemoteStreams(prev => {
            const next = new Map(prev);
            next.delete(leftId);
            return next;
          });
        }
      };

      ws.onclose = () => {
        setState(prev => ({ ...prev, connectionState: 'disconnected' }));
        if (statsTimer.current) clearInterval(statsTimer.current);
      };

      // Authenticate
      const authData = await wsRequest<{ peerId: string }>({ type: 'auth', token });

      // Load mediasoup Device
      const device = new mediasoupClient.Device();
      deviceRef.current = device;

      // Join room — get routerRtpCapabilities + existing producers
      const joinData = await wsRequest<{
        routerRtpCapabilities: mediasoupClient.types.RtpCapabilities;
        existingProducers: Array<{ producerId: string; peerId: string; kind: string }>;
      }>({
        type: 'joinRoom',
        roomId,
        rtpCapabilities: {} as mediasoupClient.types.RtpCapabilities,
      });

      await device.load({ routerRtpCapabilities: joinData.routerRtpCapabilities });

      // Re-join with real rtp capabilities
      await wsRequest({
        type: 'joinRoom',
        roomId,
        rtpCapabilities: device.rtpCapabilities,
      });

      // Create send transport
      const sendTransData = await wsRequest<{
        id: string;
        iceParameters: mediasoupClient.types.IceParameters;
        iceCandidates: mediasoupClient.types.IceCandidate[];
        dtlsParameters: mediasoupClient.types.DtlsParameters;
      }>({ type: 'createTransport', direction: 'send' });

      const sTrans = device.createSendTransport(sendTransData);
      sendTrans.current = sTrans;

      sTrans.on('connect', async ({ dtlsParameters }, callback, errback) => {
        try {
          await wsRequest({ type: 'connectTransport', transportId: sTrans.id, dtlsParameters });
          callback();
        } catch (e) { errback(e as Error); }
      });

      sTrans.on('produce', async ({ kind, rtpParameters }, callback, errback) => {
        try {
          const { id } = await wsRequest<{ id: string }>({
            type: 'produce',
            transportId: sTrans.id,
            kind,
            rtpParameters,
          });
          callback({ id });
        } catch (e) { errback(e as Error); }
      });

      // Create recv transport
      const recvTransData = await wsRequest<{
        id: string;
        iceParameters: mediasoupClient.types.IceParameters;
        iceCandidates: mediasoupClient.types.IceCandidate[];
        dtlsParameters: mediasoupClient.types.DtlsParameters;
      }>({ type: 'createTransport', direction: 'recv' });

      const rTrans = device.createRecvTransport(recvTransData);
      recvTrans.current = rTrans;

      rTrans.on('connect', async ({ dtlsParameters }, callback, errback) => {
        try {
          await wsRequest({ type: 'connectTransport', transportId: rTrans.id, dtlsParameters });
          callback();
        } catch (e) { errback(e as Error); }
      });

      // Consume existing producers
      for (const ep of joinData.existingProducers) {
        await consumeProducer(ep.producerId, ep.peerId, ep.kind as 'audio' | 'video');
      }
      setState(prev => ({
        ...prev,
        peers: joinData.existingProducers.map(ep => ({
          peerId: ep.peerId,
          producerId: ep.producerId,
          kind: ep.kind as 'audio' | 'video',
        })),
      }));

      setState(prev => ({
        ...prev,
        connectionState: 'connected',
        peerId: authData.peerId,
        roomId,
      }));

      // Stats polling
      statsTimer.current = setInterval(async () => {
        if (!sTrans.connectionState || !recvTrans.current) return;
        try {
          const s = await sTrans.getStats();
          let bitrate = 0, packetLoss = 0, rtt = 0, jitter = 0;
          s.forEach((r) => {
            if (r.type === 'outbound-rtp') bitrate += (r as Record<string, unknown>).bytesSent as number ?? 0;
            if (r.type === 'remote-inbound-rtp') {
              packetLoss = (r as Record<string, unknown>).fractionLost as number ?? 0;
              rtt = ((r as Record<string, unknown>).roundTripTime as number ?? 0) * 1000;
              jitter = ((r as Record<string, unknown>).jitter as number ?? 0) * 1000;
            }
          });
          setState(prev => ({ ...prev, stats: { bitrate, packetLoss, rtt, jitter } }));
        } catch { /* stats not yet available */ }
      }, 2000);

    } catch (err) {
      setState(prev => ({
        ...prev,
        connectionState: 'failed',
        error: err instanceof Error ? err.message : String(err),
      }));
    }
  }, []);

  // ── Publish audio ─────────────────────────────────────────────────────────

  const publishAudio = useCallback(async () => {
    if (!sendTrans.current) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStream.current = stream;
      const track = stream.getAudioTracks()[0];
      audioProducer.current = await sendTrans.current.produce({ track });
      setState(prev => ({ ...prev, isPublishingAudio: true }));
    } catch (err) {
      setState(prev => ({ ...prev, error: `Audio error: ${String(err)}` }));
    }
  }, []);

  // ── Publish video ─────────────────────────────────────────────────────────

  const publishVideo = useCallback(async () => {
    if (!sendTrans.current) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (!localStream.current) localStream.current = stream;
      const track = stream.getVideoTracks()[0];
      videoProducer.current = await sendTrans.current.produce({ track });
      setState(prev => ({ ...prev, isPublishingVideo: true }));
    } catch (err) {
      setState(prev => ({ ...prev, error: `Video error: ${String(err)}` }));
    }
  }, []);

  // ── Stop audio / video ────────────────────────────────────────────────────

  const stopAudio = useCallback(() => {
    audioProducer.current?.close();
    audioProducer.current = null;
    setState(prev => ({ ...prev, isPublishingAudio: false }));
  }, []);

  const stopVideo = useCallback(() => {
    videoProducer.current?.close();
    videoProducer.current = null;
    setState(prev => ({ ...prev, isPublishingVideo: false }));
  }, []);

  // ── Disconnect ────────────────────────────────────────────────────────────

  const disconnect = useCallback(() => {
    if (statsTimer.current) clearInterval(statsTimer.current);
    wsRef.current?.close();
    sendTrans.current?.close();
    recvTrans.current?.close();
    localStream.current?.getTracks().forEach(t => t.stop());
    localStream.current = null;
    deviceRef.current = null;
    sendTrans.current = null;
    recvTrans.current = null;
    audioProducer.current = null;
    videoProducer.current = null;
    setRemoteStreams(new Map());
    setState(INITIAL_STATE);
  }, []);

  useEffect(() => {
    return () => disconnect();
  }, [disconnect]);

  return { state, connect, disconnect, publishAudio, publishVideo, stopAudio, stopVideo, remoteStreams };
}
