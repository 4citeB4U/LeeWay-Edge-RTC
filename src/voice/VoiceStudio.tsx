/*
LEEWAY HEADER — DO NOT REMOVE
REGION: CLIENT.VOICE.STUDIO
TAG: VOICE.STUDIO.UI
COLOR_ONION_HEX: NEON=#00FFD1 FLUO=#00B4FF PASTEL=#C7F0FF
5WH:
  WHAT = VoiceStudio — full voice picker, preview, and param editor panel
  WHY  = Lets users select Microsoft Natural Neural voices, adjust rate/pitch/volume,
         preview live, and save their preference to localStorage
  WHO  = LEEWAY INNOVATIONS A LEEWAY INDUSTY CREATION
  WHERE = src/voice/VoiceStudio.tsx
  WHEN = 2026
  HOW  = Uses browser speechSynthesis.getVoices() — Microsoft Neural voices are
         FREE and built into Edge/Chrome with no API key required.
         Saves to localStorage key "leeway_voice_custom".
AGENTS: ASSESS ALIGN AUDIT
LICENSE: PROPRIETARY
*/

import React, { useCallback, useEffect, useRef, useState } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CustomVoiceConfig {
  voiceName: string;
  rate: number;
  pitch: number;
  volume: number;
}

const STORAGE_KEY = 'leeway_voice_custom';
const DEFAULT_CONFIG: CustomVoiceConfig = {
  voiceName: '',
  rate: 1.0,
  pitch: 1.0,
  volume: 1.0,
};

// ─── Voice group classification ───────────────────────────────────────────────

type VoiceGroup = 'ms-natural' | 'ms-standard' | 'google' | 'other';

function classifyVoice(v: SpeechSynthesisVoice): VoiceGroup {
  const n = v.name.toLowerCase();
  if (n.includes('microsoft') && n.includes('natural')) return 'ms-natural';
  if (n.includes('microsoft')) return 'ms-standard';
  if (n.includes('google')) return 'google';
  return 'other';
}

const GROUP_LABELS: Record<VoiceGroup, string> = {
  'ms-natural': '⭐ Microsoft Natural (Neural) — Recommended',
  'ms-standard': 'Microsoft Standard',
  'google': 'Google',
  'other': 'System / Other',
};

const GROUP_ORDER: VoiceGroup[] = ['ms-natural', 'ms-standard', 'google', 'other'];

// ─── Persistence helpers ──────────────────────────────────────────────────────

export function loadCustomVoice(): CustomVoiceConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CONFIG;
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) } as CustomVoiceConfig;
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function saveCustomVoice(cfg: CustomVoiceConfig): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg)); } catch { /* ignore */ }
}

// ─── Speak helper ─────────────────────────────────────────────────────────────

function speak(text: string, voice: SpeechSynthesisVoice | null, cfg: CustomVoiceConfig): void {
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  if (voice) utter.voice = voice;
  utter.rate   = cfg.rate;
  utter.pitch  = cfg.pitch;
  utter.volume = cfg.volume;
  window.speechSynthesis.speak(utter);
}

// ─── Main component ───────────────────────────────────────────────────────────

interface VoiceStudioProps {
  onClose: () => void;
}

export function VoiceStudio({ onClose }: VoiceStudioProps) {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [config, setConfig] = useState<CustomVoiceConfig>(loadCustomVoice);
  const [previewText, setPreviewText] = useState(
    'LeeWay Edge RTC — Mission-critical WebRTC stack online. All systems operational.'
  );
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [saved, setSaved] = useState(false);
  const uttRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Load voices (async in Chrome/Edge — fires voiceschanged)
  useEffect(() => {
    function load() {
      const all = window.speechSynthesis.getVoices();
      if (all.length) {
        const english = all.filter(v => v.lang.startsWith('en'));
        setVoices(english);
        // Auto-select first MS Natural voice if none saved
        setConfig(prev => {
          if (prev.voiceName) return prev;
          const neural = english.find(v =>
            v.name.toLowerCase().includes('microsoft') && v.name.toLowerCase().includes('natural')
          );
          return neural ? { ...prev, voiceName: neural.name } : prev;
        });
      }
    }
    load();
    window.speechSynthesis.addEventListener('voiceschanged', load);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', load);
  }, []);

  const selectedVoice = voices.find(v => v.name === config.voiceName) ?? null;

  const handlePreview = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(true);
    const utter = new SpeechSynthesisUtterance(previewText);
    if (selectedVoice) utter.voice = selectedVoice;
    utter.rate   = config.rate;
    utter.pitch  = config.pitch;
    utter.volume = config.volume;
    utter.onend  = () => setIsSpeaking(false);
    utter.onerror = () => setIsSpeaking(false);
    uttRef.current = utter;
    window.speechSynthesis.speak(utter);
  }, [previewText, selectedVoice, config]);

  const handleStop = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  const handleSave = useCallback(() => {
    saveCustomVoice(config);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [config]);

  // Group voices
  const grouped: Record<VoiceGroup, SpeechSynthesisVoice[]> = {
    'ms-natural': [], 'ms-standard': [], google: [], other: [],
  };
  for (const v of voices) grouped[classifyVoice(v)].push(v);

  const slider = (
    label: string,
    key: keyof Pick<CustomVoiceConfig, 'rate' | 'pitch' | 'volume'>,
    min: number, max: number, step: number
  ) => (
    <div style={styles.sliderRow}>
      <span style={styles.sliderLabel}>{label}</span>
      <input
        type="range" min={min} max={max} step={step}
        value={config[key]}
        onChange={e => setConfig(prev => ({ ...prev, [key]: parseFloat(e.target.value) }))}
        style={styles.slider}
      />
      <span style={styles.sliderVal}>{config[key].toFixed(2)}</span>
    </div>
  );

  return (
    <div style={styles.overlay}>
      <div style={styles.panel}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <div style={styles.eyebrow}>⚡ LeeWay Voice Studio</div>
            <div style={styles.title}>Select & Preview Microsoft Natural Voices</div>
          </div>
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
        </div>

        <div style={styles.body}>
          {/* Left: voice list */}
          <div style={styles.voiceList}>
            <div style={styles.listHeader}>
              {voices.length === 0
                ? '⏳ Loading voices... (open in Edge or Chrome)'
                : `${voices.length} English voices found`}
            </div>
            {GROUP_ORDER.map(group => {
              const groupVoices = grouped[group];
              if (!groupVoices.length) return null;
              return (
                <div key={group}>
                  <div style={styles.groupLabel}>{GROUP_LABELS[group]}</div>
                  {groupVoices.map(v => {
                    const isNatural = group === 'ms-natural';
                    const isSelected = v.name === config.voiceName;
                    return (
                      <button
                        key={v.name}
                        style={{
                          ...styles.voiceItem,
                          ...(isSelected ? styles.voiceItemSelected : {}),
                          ...(isNatural ? styles.voiceItemNatural : {}),
                        }}
                        onClick={() => {
                          setConfig(prev => ({ ...prev, voiceName: v.name }));
                          // Quick 4-word preview on click
                          speak('Hello, I am ready.', v, config);
                        }}
                      >
                        <span style={styles.voiceName}>
                          {isNatural ? '🌟 ' : ''}{v.name.replace('Microsoft ', '').replace(' Online (Natural)', ' ✨').replace(' Online', '')}
                        </span>
                        <span style={styles.voiceLang}>{v.lang}</span>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Right: controls */}
          <div style={styles.controls}>
            {/* Selected voice info */}
            <div style={styles.selectedBanner}>
              <div style={styles.selectedLabel}>Selected Voice</div>
              <div style={styles.selectedName}>
                {config.voiceName
                  ? config.voiceName
                  : <span style={{ color: '#64748b' }}>None selected</span>}
              </div>
              {selectedVoice && (
                <div style={styles.selectedMeta}>
                  {classifyVoice(selectedVoice) === 'ms-natural' && (
                    <span style={styles.neuralBadge}>NEURAL</span>
                  )}
                  <span style={styles.metaChip}>{selectedVoice.lang}</span>
                  <span style={styles.metaChip}>{selectedVoice.localService ? 'Local' : 'Online'}</span>
                </div>
              )}
            </div>

            {/* Parameter sliders */}
            <div style={styles.sliderSection}>
              <div style={styles.sectionTitle}>Voice Parameters</div>
              {slider('Rate', 'rate', 0.5, 2.0, 0.05)}
              {slider('Pitch', 'pitch', 0.5, 2.0, 0.05)}
              {slider('Volume', 'volume', 0.0, 1.0, 0.05)}
            </div>

            {/* Preview text */}
            <div style={styles.previewSection}>
              <div style={styles.sectionTitle}>Preview Text</div>
              <textarea
                style={styles.textArea}
                value={previewText}
                onChange={e => setPreviewText(e.target.value)}
                rows={3}
              />
              <div style={styles.previewBtns}>
                <button
                  style={{ ...styles.btn, ...styles.btnPlay, ...(isSpeaking ? styles.btnPlaying : {}) }}
                  onClick={isSpeaking ? handleStop : handlePreview}
                  disabled={!selectedVoice && voices.length > 0}
                >
                  {isSpeaking ? '⏹ Stop' : '▶ Preview Voice'}
                </button>
              </div>
            </div>

            {/* Presets quick-select */}
            <div style={styles.presetSection}>
              <div style={styles.sectionTitle}>Microsoft Natural — Quick Picks</div>
              <div style={styles.presetGrid}>
                {[
                  { name: 'Aria', label: 'Aria (F)' },
                  { name: 'Jenny', label: 'Jenny (F)' },
                  { name: 'Michelle', label: 'Michelle (F)' },
                  { name: 'Sara', label: 'Sara (F)' },
                  { name: 'Ryan', label: 'Ryan (M)' },
                  { name: 'Guy', label: 'Guy (M)' },
                  { name: 'Eric', label: 'Eric (M)' },
                  { name: 'Brian', label: 'Brian (M)' },
                  { name: 'Christopher', label: 'Christopher (M)' },
                  { name: 'Davis', label: 'Davis (M)' },
                  { name: 'Roger', label: 'Roger (M)' },
                  { name: 'Steffan', label: 'Steffan (M)' },
                  { name: 'Tony', label: 'Tony (M)' },
                  { name: 'Ana', label: 'Ana (F)' },
                  { name: 'Elizabeth', label: 'Elizabeth (F)' },
                  { name: 'Monica', label: 'Monica (F)' },
                ].map(({ name, label }) => {
                  const found = voices.find(v =>
                    v.name.toLowerCase().includes('microsoft') &&
                    v.name.toLowerCase().includes(name.toLowerCase()) &&
                    v.name.toLowerCase().includes('natural')
                  );
                  return (
                    <button
                      key={name}
                      style={{
                        ...styles.presetChip,
                        ...(found ? {} : styles.presetChipUnavail),
                        ...(config.voiceName === found?.name ? styles.presetChipActive : {}),
                      }}
                      disabled={!found}
                      onClick={() => {
                        if (found) {
                          setConfig(prev => ({ ...prev, voiceName: found.name }));
                          speak('Hello.', found, config);
                        }
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              <div style={styles.noteText}>
                💡 Microsoft Natural voices require <strong>Microsoft Edge</strong> browser (or Chrome with updated voices). They are completely <strong>free</strong> — no API key needed.
              </div>
            </div>

            {/* Save */}
            <button
              style={{ ...styles.btn, ...styles.btnSave, ...(saved ? styles.btnSaved : {}) }}
              onClick={handleSave}
            >
              {saved ? '✓ Saved!' : '💾 Save Voice Preference'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 9999,
    background: 'rgba(2, 6, 23, 0.92)',
    backdropFilter: 'blur(12px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '16px',
  },
  panel: {
    background: '#0f172a',
    border: '1px solid rgba(34,211,238,0.2)',
    borderRadius: '24px',
    width: '100%', maxWidth: '960px',
    maxHeight: '90vh',
    display: 'flex', flexDirection: 'column',
    overflow: 'hidden',
    boxShadow: '0 0 80px rgba(34,211,238,0.1)',
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '24px 32px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  eyebrow: { fontSize: 10, fontWeight: 900, color: '#22d3ee', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 4 },
  title: { fontSize: 20, fontWeight: 900, color: '#fff' },
  closeBtn: {
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    color: '#94a3b8', borderRadius: '12px', width: 40, height: 40,
    cursor: 'pointer', fontSize: 16, fontWeight: 700,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  body: {
    display: 'flex', flex: 1, overflow: 'hidden',
  },
  voiceList: {
    width: '320px', minWidth: '260px',
    borderRight: '1px solid rgba(255,255,255,0.06)',
    overflowY: 'auto',
    padding: '16px 12px',
  },
  listHeader: {
    fontSize: 10, color: '#64748b', fontWeight: 700,
    textTransform: 'uppercase', letterSpacing: '0.15em',
    padding: '4px 8px 12px',
  },
  groupLabel: {
    fontSize: 9, fontWeight: 900, color: '#f59e0b',
    textTransform: 'uppercase', letterSpacing: '0.15em',
    padding: '12px 8px 4px',
    borderTop: '1px solid rgba(255,255,255,0.04)',
    marginTop: 8,
  },
  voiceItem: {
    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '8px 12px', marginBottom: 2,
    background: 'transparent', border: '1px solid transparent',
    borderRadius: '10px', cursor: 'pointer',
    transition: 'all 0.15s',
    textAlign: 'left',
  },
  voiceItemSelected: {
    background: 'rgba(34,211,238,0.1)',
    border: '1px solid rgba(34,211,238,0.4)',
  },
  voiceItemNatural: {
    background: 'rgba(245,158,11,0.04)',
  },
  voiceName: { fontSize: 11, fontWeight: 700, color: '#e2e8f0', flex: 1 },
  voiceLang: { fontSize: 9, color: '#475569', fontWeight: 600, marginLeft: 8 },

  controls: {
    flex: 1, overflowY: 'auto', padding: '24px 28px',
    display: 'flex', flexDirection: 'column', gap: 24,
  },
  selectedBanner: {
    padding: '16px 20px',
    background: 'rgba(34,211,238,0.05)',
    border: '1px solid rgba(34,211,238,0.15)',
    borderRadius: '16px',
  },
  selectedLabel: { fontSize: 9, fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 6 },
  selectedName: { fontSize: 14, fontWeight: 800, color: '#22d3ee', wordBreak: 'break-all' },
  selectedMeta: { display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' },
  neuralBadge: {
    fontSize: 9, fontWeight: 900, padding: '2px 8px',
    background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.4)',
    color: '#f59e0b', borderRadius: '8px', letterSpacing: '0.1em',
  },
  metaChip: {
    fontSize: 9, fontWeight: 700, padding: '2px 8px',
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    color: '#94a3b8', borderRadius: '8px',
  },

  sliderSection: { display: 'flex', flexDirection: 'column', gap: 12 },
  sectionTitle: { fontSize: 10, fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 4 },
  sliderRow: { display: 'flex', alignItems: 'center', gap: 12 },
  sliderLabel: { fontSize: 11, fontWeight: 700, color: '#94a3b8', width: 52 },
  slider: { flex: 1, accentColor: '#22d3ee', cursor: 'pointer', height: 4 },
  sliderVal: { fontSize: 11, fontWeight: 900, color: '#22d3ee', width: 40, textAlign: 'right' },

  previewSection: { display: 'flex', flexDirection: 'column', gap: 10 },
  textArea: {
    width: '100%', borderRadius: '12px', padding: '12px 14px',
    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)',
    color: '#e2e8f0', fontSize: 12, fontFamily: 'inherit',
    resize: 'vertical', outline: 'none', boxSizing: 'border-box',
  },
  previewBtns: { display: 'flex', gap: 8 },

  presetSection: { display: 'flex', flexDirection: 'column', gap: 10 },
  presetGrid: { display: 'flex', flexWrap: 'wrap', gap: 6 },
  presetChip: {
    padding: '5px 12px', borderRadius: '10px', fontSize: 10, fontWeight: 800,
    background: 'rgba(34,211,238,0.07)', border: '1px solid rgba(34,211,238,0.2)',
    color: '#22d3ee', cursor: 'pointer', transition: 'all 0.15s',
  },
  presetChipActive: {
    background: 'rgba(34,211,238,0.2)', border: '1px solid rgba(34,211,238,0.6)',
  },
  presetChipUnavail: {
    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
    color: '#334155', cursor: 'not-allowed',
  },
  noteText: {
    fontSize: 10, color: '#64748b', lineHeight: 1.6,
    padding: '8px 12px', background: 'rgba(255,255,255,0.02)',
    borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)',
  },

  btn: {
    padding: '12px 24px', borderRadius: '14px', border: 'none',
    fontSize: 12, fontWeight: 900, cursor: 'pointer',
    transition: 'all 0.15s', letterSpacing: '0.05em',
  },
  btnPlay: {
    background: 'rgba(34,211,238,0.15)', border: '1px solid rgba(34,211,238,0.4)',
    color: '#22d3ee', flex: 1,
  },
  btnPlaying: {
    background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)',
    color: '#f87171',
  },
  btnSave: {
    background: '#22d3ee', color: '#020617',
    width: '100%', textAlign: 'center',
  },
  btnSaved: {
    background: '#10b981', color: '#020617',
  },
};
