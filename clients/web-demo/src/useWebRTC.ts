import { useCallback, useEffect, useRef, useState } from 'react';
import * as mediasoupClient from 'mediasoup-client';
import type { Device } from 'mediasoup-client';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ConnectionState = 'idle' | 'connecting' | 'connected' | 'error';

export interface RemoteStream {
  peerId: string;
  producerId: string;
  kind: 'audio' | 'video';
  stream: MediaStream;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const WS_URL = import.meta.env['VITE_SFU_WS_URL'] ?? `ws://${window.location.host}/ws`;
const TOKEN_URL = import.meta.env['VITE_TOKEN_URL'] ?? `/dev/token`;

let _msgId = 0;
function nextId(): number {
  return ++_msgId;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useWebRTC(roomId: string) {
  const [state, setState] = useState<ConnectionState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [remoteStreams, setRemoteStreams] = useState<RemoteStream[]>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const deviceRef = useRef<Device | null>(null);
  const sendTransportRef = useRef<mediasoupClient.types.Transport | null>(null);
  const recvTransportRef = useRef<mediasoupClient.types.Transport | null>(null);
  const producerRef = useRef<mediasoupClient.types.Producer | null>(null);
  const pendingRef = useRef<Map<number, { resolve: (d: unknown) => void; reject: (e: Error) => void }>>(new Map());
  const consumersRef = useRef<Map<string, mediasoupClient.types.Consumer>>(new Map());
  const recvTransportIdRef = useRef<string | null>(null);

  // ── send a request and await its response ──────────────────────────────────
  const request = useCallback(<T = unknown>(type: string, data: object = {}): Promise<T> => {
    return new Promise<T>((resolve, reject) => {
      const ws = wsRef.current;
      if (!ws || ws.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket not open'));
        return;
      }
      const id = nextId();
      pendingRef.current.set(id, {
        resolve: resolve as (d: unknown) => void,
        reject,
      });
      ws.send(JSON.stringify({ id, type, ...data }));
    });
  }, []);

  // ── consume a remote producer ──────────────────────────────────────────────
  const consumeProducer = useCallback(
    async (
      producerId: string,
      peerId: string,
      kind: 'audio' | 'video',
      device: Device,
      recvTransportId: string,
    ) => {
      const resp = await request<{
        consumerId: string;
        kind: 'audio' | 'video';
        rtpParameters: mediasoupClient.types.RtpParameters;
      }>('consume', {
        transportId: recvTransportId,
        producerId,
        rtpCapabilities: device.rtpCapabilities,
      });

      const transport = recvTransportRef.current;
      if (!transport) return;

      const consumer = await transport.consume({
        id: resp.consumerId,
        producerId,
        kind: resp.kind,
        rtpParameters: resp.rtpParameters,
      });

      consumersRef.current.set(consumer.id, consumer);
      await request('resumeConsumer', { consumerId: consumer.id });

      const stream = new MediaStream([consumer.track]);
      setRemoteStreams((prev) => [
        ...prev,
        { peerId, producerId, kind, stream },
      ]);

      consumer.on('transportclose', () => {
        consumersRef.current.delete(consumer.id);
        setRemoteStreams((prev) => prev.filter((s) => s.producerId !== producerId));
      });
    },
    [request],
  );

  // ── connect ────────────────────────────────────────────────────────────────
  const connect = useCallback(async () => {
    setState('connecting');
    setError(null);

    try {
      // 1. Get a dev token
      const tokenResp = await fetch(TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sub: `peer-${Math.random().toString(36).slice(2, 7)}` }),
      });
      const { token } = (await tokenResp.json()) as { token: string };

      // 2. Open WebSocket
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      await new Promise<void>((res, rej) => {
        ws.onopen = () => res();
        ws.onerror = () => rej(new Error('WebSocket open failed'));
      });

      // 3. Route incoming messages
      ws.onmessage = (evt) => {
        const msg = JSON.parse(evt.data as string) as {
          id?: number;
          ok?: boolean;
          error?: string;
          type?: string;
          [k: string]: unknown;
        };

        if (msg.id !== undefined) {
          const pending = pendingRef.current.get(msg.id);
          if (pending) {
            pendingRef.current.delete(msg.id);
            if (msg.ok === false) {
              pending.reject(new Error(msg.error ?? 'Unknown error'));
            } else {
              pending.resolve(msg);
            }
          }
          return;
        }

        // Server-push events
        if (msg.type === 'newProducer') {
          const { producerId, peerId, kind } = msg as {
            producerId: string;
            peerId: string;
            kind: 'audio' | 'video';
          };
          if (deviceRef.current && recvTransportIdRef.current) {
            void consumeProducer(
              producerId,
              peerId,
              kind,
              deviceRef.current,
              recvTransportIdRef.current,
            );
          }
        }

        if (msg.type === 'producerClosed') {
          const { producerId } = msg as { producerId: string };
          setRemoteStreams((prev) => prev.filter((s) => s.producerId !== producerId));
        }

        if (msg.type === 'peerLeft') {
          const { peerId } = msg as { peerId: string };
          setRemoteStreams((prev) => prev.filter((s) => s.peerId !== peerId));
        }
      };

      ws.onclose = () => {
        setState('idle');
        setIsPublishing(false);
      };

      // 4. Auth
      await request('auth', { token });

      // 5. Create mediasoup device
      const device = new mediasoupClient.Device();
      deviceRef.current = device;

      // 6. Join room → get routerRtpCapabilities + existing producers
      const joinResp = await request<{
        routerRtpCapabilities: mediasoupClient.types.RtpCapabilities;
        existingProducers: Array<{ producerId: string; peerId: string; kind: 'audio' | 'video' }>;
      }>('joinRoom', { roomId, rtpCapabilities: {} });

      await device.load({ routerRtpCapabilities: joinResp.routerRtpCapabilities });

      // 7. Create recv transport
      const recvTransportInfo = await request<{
        transportId: string;
        iceParameters: mediasoupClient.types.IceParameters;
        iceCandidates: mediasoupClient.types.IceCandidate[];
        dtlsParameters: mediasoupClient.types.DtlsParameters;
      }>('createTransport', { direction: 'recv' });

      recvTransportIdRef.current = recvTransportInfo.transportId;

      const recvTransport = device.createRecvTransport({
        id: recvTransportInfo.transportId,
        iceParameters: recvTransportInfo.iceParameters,
        iceCandidates: recvTransportInfo.iceCandidates,
        dtlsParameters: recvTransportInfo.dtlsParameters,
      });
      recvTransportRef.current = recvTransport;

      recvTransport.on('connect', ({ dtlsParameters }, cb, eb) => {
        request('connectTransport', {
          transportId: recvTransport.id,
          dtlsParameters,
        })
          .then(() => cb())
          .catch(eb);
      });

      // 8. Consume existing producers
      for (const ep of joinResp.existingProducers) {
        await consumeProducer(
          ep.producerId,
          ep.peerId,
          ep.kind,
          device,
          recvTransportInfo.transportId,
        );
      }

      setState('connected');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      setState('error');
    }
  }, [roomId, request, consumeProducer]);

  // ── publish audio (and optionally video) ──────────────────────────────────
  const publish = useCallback(
    async (video = false) => {
      const device = deviceRef.current;
      if (!device) throw new Error('Not connected');

      // Create send transport if not already done
      if (!sendTransportRef.current) {
        const info = await request<{
          transportId: string;
          iceParameters: mediasoupClient.types.IceParameters;
          iceCandidates: mediasoupClient.types.IceCandidate[];
          dtlsParameters: mediasoupClient.types.DtlsParameters;
        }>('createTransport', { direction: 'send' });

        const sendTransport = device.createSendTransport({
          id: info.transportId,
          iceParameters: info.iceParameters,
          iceCandidates: info.iceCandidates,
          dtlsParameters: info.dtlsParameters,
        });

        sendTransport.on('connect', ({ dtlsParameters }, cb, eb) => {
          request('connectTransport', {
            transportId: sendTransport.id,
            dtlsParameters,
          })
            .then(() => cb())
            .catch(eb);
        });

        sendTransport.on('produce', ({ kind, rtpParameters }, cb, eb) => {
          request<{ producerId: string }>('produce', {
            transportId: sendTransport.id,
            kind,
            rtpParameters,
          })
            .then(({ producerId }) => cb({ id: producerId }))
            .catch(eb);
        });

        sendTransportRef.current = sendTransport;
      }

      const constraints: MediaStreamConstraints = {
        audio: true,
        video: video
          ? { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } }
          : false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      for (const track of stream.getTracks()) {
        const encodings: mediasoupClient.types.RtpEncodingParameters[] =
          track.kind === 'video'
            ? [
                { rid: 'r0', maxBitrate: 100000 },
                { rid: 'r1', maxBitrate: 300000 },
                { rid: 'r2', maxBitrate: 900000 },
              ]
            : [];

        const producer = await sendTransportRef.current!.produce({
          track,
          encodings: encodings.length ? encodings : undefined,
          codecOptions: track.kind === 'audio' ? { opusStereo: true, opusDtx: true } : undefined,
        });

        producerRef.current = producer;
        setIsPublishing(true);

        producer.on('trackended', () => {
          void stopPublishing();
        });
      }
    },
    [request],
  );

  const stopPublishing = useCallback(async () => {
    const producer = producerRef.current;
    if (!producer) return;
    await request('closeProducer', { producerId: producer.id }).catch(() => null);
    producer.close();
    producerRef.current = null;
    setIsPublishing(false);
  }, [request]);

  const disconnect = useCallback(() => {
    wsRef.current?.close();
    deviceRef.current = null;
    sendTransportRef.current = null;
    recvTransportRef.current = null;
    producerRef.current = null;
    setRemoteStreams([]);
    setState('idle');
  }, []);

  useEffect(() => {
    return () => {
      wsRef.current?.close();
    };
  }, []);

  return {
    state,
    error,
    isPublishing,
    remoteStreams,
    connect,
    disconnect,
    publish,
    stopPublishing,
  };
}
