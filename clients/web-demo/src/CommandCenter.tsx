import { useCallback, useEffect, useRef, useState } from 'react';
import { useWebRTC } from './useWebRTC';
import type { RemoteStream, EventEntry } from './useWebRTC';
import { RemoteAudio } from './RemoteAudio';
import styles from './CommandCenter.module.css';

// ─── helpers ─────────────────────────────────────────────────────────────────

function formatTimestamp(ts: number): string {
  return new Date(ts).toLocaleTimeString('en-US', { hour12: false });
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1048576) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1048576).toFixed(2)} MB`;
}
// ─── MediaTile ───────────────────────────────────────────────────────────────

interface TileProps {
  stream: MediaStream;
  label: string;
  kind: 'audio' | 'video';
  muted?: boolean;
  isLocal?: boolean;
}

function MediaTile({ stream, label, kind, muted = false, isLocal = false }: TileProps) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className={styles.tile}>
      <div className={styles.tileHeader}>
        <span className={styles.tileKindBadge}>{kind}</span>
        <span className={isLocal ? styles.tileLocalLabel : undefined}>{label}</span>
      </div>
      {kind === 'video' ? (
        <video
          ref={ref}
          autoPlay
          playsInline
          muted={muted}
          className={styles.tileVideo}
        />
      ) : (
        <div className={styles.tileAudioBody}>🎤</div>
      )}
    </div>
  );
}

// ─── StatsRow ────────────────────────────────────────────────────────────────

interface StatsRow { key: string; value: string }

function parseStats(report: RTCStatsReport | null, prefix: string): StatsRow[] {
  if (!report) return [];
  const rows: StatsRow[] = [];
  for (const stat of report.values()) {
    const s = stat as Record<string, unknown>;
    if (s['type'] === 'outbound-rtp') {
      const kind = String(s['kind'] ?? '?');
      if (typeof s['bytesSent'] === 'number')
        rows.push({ key: `${prefix}.${kind}.sent`, value: formatBytes(s['bytesSent']) });
      if (typeof s['packetsSent'] === 'number')
        rows.push({ key: `${prefix}.${kind}.pkts`, value: String(s['packetsSent']) });
      if (typeof s['framesEncoded'] === 'number')
        rows.push({ key: `${prefix}.video.frames`, value: String(s['framesEncoded']) });
    }
    if (s['type'] === 'inbound-rtp') {
      const kind = String(s['kind'] ?? '?');
      if (typeof s['bytesReceived'] === 'number')
        rows.push({ key: `${prefix}.${kind}.recv`, value: formatBytes(s['bytesReceived']) });
      if (typeof s['packetsReceived'] === 'number')
        rows.push({ key: `${prefix}.${kind}.pkts`, value: String(s['packetsReceived']) });
      if (typeof s['jitter'] === 'number')
        rows.push({ key: `${prefix}.${kind}.jitter`, value: `${(s['jitter'] as number * 1000).toFixed(1)}ms` });
    }
    if (s['type'] === 'candidate-pair' && s['state'] === 'succeeded') {
      if (typeof s['currentRoundTripTime'] === 'number')
        rows.push({ key: `${prefix}.rtt`, value: `${((s['currentRoundTripTime'] as number) * 1000).toFixed(0)}ms` });
      if (typeof s['availableOutgoingBitrate'] === 'number')
        rows.push({ key: `${prefix}.avail`, value: `${Math.round((s['availableOutgoingBitrate'] as number) / 1000)}kbps` });
    }
  }
  return rows;
}

// ─── CommandCenter ────────────────────────────────────────────────────────────

const DEFAULT_ROOM = 'demo-room';

export default function CommandCenter() {
  const [roomId, setRoomId] = useState(DEFAULT_ROOM);
  const [withVideo, setWithVideo] = useState(false);

  const {
    state,
    error,
    isPublishing,
    remoteStreams,
    connect,
    disconnect,
    publish,
    stopPublishing,
    events,
    localStream,
    recvStates,
    sendStates,
    getStats,
  } = useWebRTC(roomId);

  const [statsRows, setStatsRows] = useState<StatsRow[]>([]);
  const consoleEndRef = useRef<HTMLLIElement>(null);
  const connected = state === 'connected';

  // ── stats polling ──────────────────────────────────────────────────────────
  const pollStats = useCallback(async () => {
    const { send, recv } = await getStats();
    setStatsRows([...parseStats(send, 'send'), ...parseStats(recv, 'recv')]);
  }, [getStats]);

  useEffect(() => {
    if (!connected) { setStatsRows([]); return; }
    void pollStats();
    const id = setInterval(() => { void pollStats(); }, 2000);
    return () => clearInterval(id);
  }, [connected, pollStats]);

  // ── auto-scroll event console ──────────────────────────────────────────────
  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [events]);

  // ── group remote streams by peer ──────────────────────────────────────────
  const peerMap = new Map<string, RemoteStream[]>();
  for (const rs of remoteStreams) {
    if (!peerMap.has(rs.peerId)) peerMap.set(rs.peerId, []);
    peerMap.get(rs.peerId)!.push(rs);
  }

  const videoStreams = remoteStreams.filter((s) => s.kind === 'video');
  const audioStreams = remoteStreams.filter((s) => s.kind === 'audio');

  // ── ice/dtls state CSS class ───────────────────────────────────────────────
  function iceGatheringClass(state: RTCIceGatheringState | null): string {
    if (!state) return styles.st_null_state;
    if (state === 'complete') return styles.st_connected_ice;
    if (state === 'gathering') return styles.st_checking_ice;
    return styles.st_null_state;
  }

  function connStateClass(state: RTCPeerConnectionState | null): string {
    if (!state) return styles.st_null_state;
    if (state === 'connected') return styles.st_connected_ice;
    if (state === 'connecting') return styles.st_checking_ice;
    if (state === 'disconnected' || state === 'failed' || state === 'closed') return styles.st_disconnected_ice;
    return styles.st_null_state;
  }

  function eventClass(e: EventEntry): string {
    return `${styles.consoleEntry} ${styles[`consoleEntry_${e.kind}`] ?? ''}`;
  }

  return (
    <div className={styles.commandCenter}>
      {/* ── Header / Controls ──────────────────────────────────────────────── */}
      <header className={styles.header}>
        <h1>Command Center</h1>
        <div className={styles.headerControls}>
          <span className={styles.roomLabel}>Room</span>
          <input
            className={styles.roomInput}
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            disabled={connected}
            placeholder="room-id"
          />

          {!connected ? (
            <button
              className={styles.btnPrimary}
              onClick={() => void connect()}
              disabled={state === 'connecting'}
            >
              {state === 'connecting' ? 'Connecting…' : 'Join'}
            </button>
          ) : (
            <button className={styles.btnDanger} onClick={disconnect}>
              Leave
            </button>
          )}

          {connected && !isPublishing && (
            <button className={styles.btnSuccess} onClick={() => void publish(withVideo)}>
              Publish {withVideo ? 'A+V' : 'Audio'}
            </button>
          )}

          {isPublishing && (
            <button className={styles.btnWarning} onClick={() => void stopPublishing()}>
              Stop
            </button>
          )}

          {connected && (
            <label className={styles.videoLabel}>
              <input
                type="checkbox"
                checked={withVideo}
                onChange={(e) => setWithVideo(e.target.checked)}
                disabled={isPublishing}
              />
              Video
            </label>
          )}

          {error && (
            <span className={styles.headerError}>⚠ {error}</span>
          )}
        </div>
      </header>

      {/* ── Main body grid ────────────────────────────────────────────────── */}
      <div className={styles.body}>

        {/* ── Media tiles ───────────────────────────────────────────────── */}
        <div className={styles.mediaGrid}>
          {/* Local tile */}
          {localStream ? (
            <MediaTile
              stream={localStream}
              label="Local"
              kind={withVideo ? 'video' : 'audio'}
              muted
              isLocal
            />
          ) : (
            <div className={styles.tilePlaceholder}>
              {connected ? 'No local media' : 'Not connected'}
            </div>
          )}

          {/* Remote video tiles */}
          {videoStreams.map((rs) => (
            <MediaTile
              key={rs.producerId}
              stream={rs.stream}
              label={`peer: ${rs.peerId.slice(0, 8)}`}
              kind="video"
            />
          ))}

          {/* Remote audio-only tiles (show avatar) */}
          {audioStreams.map((rs) => (
            <MediaTile
              key={rs.producerId}
              stream={rs.stream}
              label={`peer: ${rs.peerId.slice(0, 8)}`}
              kind="audio"
            />
          ))}
        </div>

        {/* ── Connection state panel ────────────────────────────────────── */}
        <aside className={`${styles.panel} ${styles.statePanel}`}>
          <div className={styles.panelTitle}>Connection State</div>
          <dl className={styles.stateTable}>
            <dt>Signaling</dt>
            <dd className={styles[`st_${state}`] ?? ''}>{state}</dd>

            <dt>Recv ICE</dt>
            <dd className={iceGatheringClass(recvStates.iceGathering)}>{recvStates.iceGathering ?? '—'}</dd>

            <dt>Recv conn</dt>
            <dd className={connStateClass(recvStates.connection)}>{recvStates.connection ?? '—'}</dd>

            <dt>Send ICE</dt>
            <dd className={iceGatheringClass(sendStates.iceGathering)}>{sendStates.iceGathering ?? '—'}</dd>

            <dt>Send conn</dt>
            <dd className={connStateClass(sendStates.connection)}>{sendStates.connection ?? '—'}</dd>

            <dt>Peers</dt>
            <dd>{peerMap.size}</dd>

            <dt>Streams</dt>
            <dd>{remoteStreams.length}</dd>
          </dl>
        </aside>

        {/* ── Peer inspector ────────────────────────────────────────────── */}
        <div className={`${styles.panel} ${styles.peerPanel}`}>
          <div className={styles.panelTitle}>Peer Inspector</div>
          {peerMap.size === 0 ? (
            <span className={styles.peerEmpty}>No remote peers</span>
          ) : (
            <ul className={styles.peerList}>
              {[...peerMap.entries()].map(([peerId, streams]) => (
                <li key={peerId} className={styles.peerItem}>
                  <span>{peerId.slice(0, 12)}</span>
                  {streams.map((s) => (
                    <span key={s.producerId} className={styles.peerBadge}>{s.kind}</span>
                  ))}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ── Stats ─────────────────────────────────────────────────────── */}
        <div className={`${styles.panel} ${styles.statsPanel}`}>
          <div className={styles.panelTitle}>Stats</div>
          {statsRows.length === 0 ? (
            <span className={styles.statsEmpty}>
              {connected ? 'Polling…' : 'Connect to see stats'}
            </span>
          ) : (
            <ul className={styles.statsList}>
              {statsRows.map((row) => (
                <li key={row.key} className={styles.statRow}>
                  <span className={styles.statKey}>{row.key}</span>
                  <span className={styles.statVal}>{row.value}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ── Event console ─────────────────────────────────────────────── */}
        <div className={`${styles.panel} ${styles.consolePanel}`}>
          <div className={styles.panelTitle}>Event Console</div>
          {events.length === 0 ? (
            <span className={styles.consoleEmpty}>No events yet</span>
          ) : (
            <ul className={styles.consoleLog}>
              {events.map((e, i) => (
                <li key={i} className={eventClass(e)}>
                  <span className={styles.consoleTs}>{formatTimestamp(e.ts)}</span>
                  <span className={styles.consoleMsg}>[{e.kind}] {e.msg}</span>
                </li>
              ))}
              <li ref={consoleEndRef} />
            </ul>
          )}
        </div>
      </div>

      {/* Invisible audio players for remote audio streams */}
      <RemoteAudio remoteStreams={audioStreams} />
    </div>
  );
}
