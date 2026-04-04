import { useState } from 'react';
import { useWebRTC } from './useWebRTC';
import { RemoteAudio } from './RemoteAudio';
import CommandCenter from './CommandCenter';
import styles from './App.module.css';

const DEFAULT_ROOM = 'demo-room';

// ─── Tab bar ─────────────────────────────────────────────────────────────────

type View = 'demo' | 'command-center';

function TabBar({ active, onChange }: { active: View; onChange: (v: View) => void }) {
  return (
    <nav className={styles.tabBar}>
      <button
        className={active === 'demo' ? styles.tabActive : styles.tab}
        onClick={() => onChange('demo')}
      >
        Demo
      </button>
      <button
        className={active === 'command-center' ? styles.tabActive : styles.tab}
        onClick={() => onChange('command-center')}
      >
        Command Center
      </button>
    </nav>
  );
}

// ─── Demo view ────────────────────────────────────────────────────────────────

function DemoView() {
  const [roomId, setRoomId] = useState(DEFAULT_ROOM);
  const [withVideo, setWithVideo] = useState(false);

  const { state, error, isPublishing, remoteStreams, connect, disconnect, publish, stopPublishing } =
    useWebRTC(roomId);

  const connected = state === 'connected';

  return (
    <main className={styles.main}>
      <section className={styles.card}>
        <h2>Room</h2>
        <div className={styles.row}>
          <label htmlFor="room-id">Room ID</label>
          <input
            id="room-id"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            disabled={connected}
            className={styles.input}
          />
        </div>

        <div className={styles.row}>
          <label>
            <input
              type="checkbox"
              checked={withVideo}
              onChange={(e) => setWithVideo(e.target.checked)}
              disabled={isPublishing}
            />
            {' '}Include video
          </label>
        </div>

        <div className={styles.actions}>
          {!connected ? (
            <button
              className={styles.btnPrimary}
              onClick={() => void connect()}
              disabled={state === 'connecting'}
            >
              {state === 'connecting' ? 'Connecting…' : 'Join Room'}
            </button>
          ) : (
            <button className={styles.btnDanger} onClick={disconnect}>
              Leave Room
            </button>
          )}

          {connected && !isPublishing && (
            <button className={styles.btnSuccess} onClick={() => void publish(withVideo)}>
              Publish {withVideo ? 'Audio + Video' : 'Audio'}
            </button>
          )}

          {isPublishing && (
            <button className={styles.btnWarning} onClick={() => void stopPublishing()}>
              Stop Publishing
            </button>
          )}
        </div>

        {error && <p className={styles.error}>⚠ {error}</p>}
      </section>

      <section className={styles.card}>
        <h2>Status</h2>
        <dl className={styles.dl}>
          <dt>Connection</dt>
          <dd className={styles[`status_${state}`]}>{state}</dd>
          <dt>Publishing</dt>
          <dd>{isPublishing ? '🔴 live' : '—'}</dd>
          <dt>Remote streams</dt>
          <dd>{remoteStreams.length}</dd>
        </dl>

        {remoteStreams.length > 0 && (
          <ul className={styles.streams}>
            {remoteStreams.map((rs) => (
              <li key={rs.producerId}>
                <span className={styles.badge}>{rs.kind}</span> peer: {rs.peerId.slice(0, 12)}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Invisible audio players for remote peers */}
      <RemoteAudio remoteStreams={remoteStreams.filter((s) => s.kind === 'audio')} />
    </main>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [view, setView] = useState<View>('demo');

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h1>LeeWay Edge RTC</h1>
        <p className={styles.sub}>Self-hosted WebRTC SFU Demo</p>
      </header>

      <TabBar active={view} onChange={setView} />

      {view === 'demo' ? <DemoView /> : <CommandCenter />}
    </div>
  );
}
