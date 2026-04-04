/*
LEEWAY HEADER — DO NOT REMOVE
REGION: CLIENT.WEB-DEMO
TAG: CLIENT.COMPONENT.COMMAND-CENTER
COLOR_ONION_HEX: NEON=#00FFD1 FLUO=#00B4FF PASTEL=#C7F0FF
5WH:
  WHAT = CommandCenter UI — main dashboard for LeeWay Edge RTC web demo
  WHY  = Provides real-time view of room state, peer stats, publish controls, event log
  WHO  = LeeWay Industries | LeeWay Innovation | Creator: Leonard Lee
  WHERE = clients/web-demo/src/CommandCenter.tsx
  WHEN = 2026
  HOW  = useWebRTC hook drives all state; RemoteAudio renders remote tracks
AGENTS: ASSESS ALIGN AUDIT
LICENSE: PROPRIETARY
*/
import { useState, useCallback } from 'react';
import styles from './CommandCenter.module.css';
import { useWebRTC } from './useWebRTC';
import { RemoteAudio } from './RemoteAudio';

// ─── Event log ────────────────────────────────────────────────────────────────

interface LogEvent {
  id: number;
  time: string;
  level: 'info' | 'success' | 'warn' | 'error';
  msg: string;
}

let _evId = 0;
function makeEvent(level: LogEvent['level'], msg: string): LogEvent {
  return {
    id: ++_evId,
    time: new Date().toLocaleTimeString('en-US', { hour12: false }),
    level,
    msg,
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CommandCenter() {
  const rtc = useWebRTC();
  const [roomInput, setRoomInput] = useState('leeway-main');
  const [events, setEvents] = useState<LogEvent[]>([
    makeEvent('info', 'LeeWay Edge RTC — Web Demo ready.'),
  ]);

  function log(level: LogEvent['level'], msg: string) {
    setEvents(prev => [makeEvent(level, msg), ...prev].slice(0, 200));
  }

  const handleConnect = useCallback(async () => {
    log('info', `Connecting to room "${roomInput}"…`);
    try {
      await rtc.connect(roomInput);
      log('success', `Connected as ${rtc.state.peerId}`);
    } catch (e) {
      log('error', `Connect failed: ${String(e)}`);
    }
  }, [rtc, roomInput]);

  const handleDisconnect = useCallback(() => {
    rtc.disconnect();
    log('info', 'Disconnected.');
  }, [rtc]);

  const handlePublishAudio = useCallback(async () => {
    log('info', 'Starting microphone…');
    await rtc.publishAudio();
    log('success', 'Microphone publishing.');
  }, [rtc]);

  const handleStopAudio = useCallback(() => {
    rtc.stopAudio();
    log('info', 'Microphone stopped.');
  }, [rtc]);

  const handlePublishVideo = useCallback(async () => {
    log('info', 'Starting camera…');
    await rtc.publishVideo();
    log('success', 'Camera publishing.');
  }, [rtc]);

  const handleStopVideo = useCallback(() => {
    rtc.stopVideo();
    log('info', 'Camera stopped.');
  }, [rtc]);

  const { state } = rtc;
  const connected = state.connectionState === 'connected';

  return (
    <div className={styles.panel}>

      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <div className={styles.toolbar}>
        <span className={styles.statusDot} data-state={state.connectionState} />
        <span className={styles.statusLabel}>{state.connectionState}</span>

        <input
          className={styles.roomInput}
          value={roomInput}
          onChange={e => setRoomInput(e.target.value)}
          placeholder="room-id"
          disabled={connected}
        />

        {!connected ? (
          <button
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={handleConnect}
            disabled={state.connectionState === 'connecting'}
          >
            Connect
          </button>
        ) : (
          <button
            className={`${styles.btn} ${styles.btnDanger}`}
            onClick={handleDisconnect}
          >
            Disconnect
          </button>
        )}

        <span className={styles.spacer} />

        {connected && (
          <>
            <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>
              Room: <span style={{ color: 'var(--fluo)' }}>{state.roomId}</span>
            </span>
            <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>
              Peers: <span style={{ color: 'var(--neon)' }}>{state.peers.length}</span>
            </span>
          </>
        )}
      </div>

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <div className={styles.sidebar}>

        <div>
          <div className={styles.sectionTitle}>RTC Stats</div>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Bitrate</div>
              <div className={styles.statValue}>
                {Math.round(state.stats.bitrate / 1000)}
                <span className={styles.statUnit}> kbps</span>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>RTT</div>
              <div className={styles.statValue}>
                {Math.round(state.stats.rtt)}
                <span className={styles.statUnit}> ms</span>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Loss</div>
              <div className={styles.statValue}>
                {(state.stats.packetLoss * 100).toFixed(1)}
                <span className={styles.statUnit}> %</span>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Jitter</div>
              <div className={styles.statValue}>
                {Math.round(state.stats.jitter)}
                <span className={styles.statUnit}> ms</span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className={styles.sectionTitle}>Remote Peers ({state.peers.length})</div>
          <div className={styles.peerList}>
            {state.peers.length === 0 && (
              <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                No remote peers
              </span>
            )}
            {state.peers.map(p => (
              <div key={p.producerId} className={styles.peerItem}>
                <span className={styles.peerKind}>{p.kind}</span>
                <span className={styles.peerIdText}>{p.peerId.slice(0, 12)}…</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className={styles.sectionTitle}>Peer ID</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 10, wordBreak: 'break-all' }}>
            {state.peerId || '—'}
          </div>
        </div>
      </div>

      {/* ── Main canvas ─────────────────────────────────────────────────── */}
      <div className={styles.canvasArea}>
        {state.error && (
          <div className={styles.errorBanner}>{state.error}</div>
        )}

        {!connected && (
          <div className={styles.idleMessage}>
            Enter a room ID and press <strong>Connect</strong><br />
            to join the LeeWay Edge RTC session.
          </div>
        )}

        {/* Hidden audio elements for remote peers */}
        {Array.from(rtc.remoteStreams.entries()).map(([peerId, stream]) => (
          <RemoteAudio key={peerId} peerId={peerId} stream={stream} />
        ))}

        {connected && (
          <div className={styles.publishControls}>
            {!state.isPublishingAudio ? (
              <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={handlePublishAudio}>
                🎙 Mic On
              </button>
            ) : (
              <button className={`${styles.btn} ${styles.btnDanger}`} onClick={handleStopAudio}>
                🎙 Mic Off
              </button>
            )}
            {!state.isPublishingVideo ? (
              <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={handlePublishVideo}>
                📷 Cam On
              </button>
            ) : (
              <button className={`${styles.btn} ${styles.btnDanger}`} onClick={handleStopVideo}>
                📷 Cam Off
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Events log ──────────────────────────────────────────────────── */}
      <div className={styles.eventsPanel}>
        <div className={styles.sectionTitle} style={{ padding: '0 4px' }}>Event Log</div>
        {events.map(ev => (
          <div key={ev.id} className={styles.eventItem} data-level={ev.level}>
            <span className={styles.eventTime}>{ev.time} </span>
            <span className={styles.eventMsg}>{ev.msg}</span>
          </div>
        ))}
      </div>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <div className={styles.footer}>
        <span>LeeWay Edge RTC — Web Demo</span>
        <span>mediasoup SFU</span>
        <span style={{ marginLeft: 'auto' }}>
          LeeWay Industries | LeeWay Innovation — Leonard Lee
        </span>
      </div>
    </div>
  );
}
