/*
LEEWAY HEADER — DO NOT REMOVE
REGION: CLIENT.VOICE.PRESETS
TAG: VOICE.PRESETS.PROFILES
COLOR_ONION_HEX: NEON=#00FFD1 FLUO=#00B4FF PASTEL=#C7F0FF
ICON_ASCII: family=lucide glyph=sliders-horizontal
5WH:
  WHAT = LeeWay Voice Presets — 3M + 3F pinnable voice profiles
  WHY  = Lets users pin a preferred agent voice; stores only name+rate/pitch/volume —
         no bundled audio, no vendor TTS API — pure browser SpeechSynthesis
  WHO  = LeeWay Industries | LeeWay Innovation | Creator: Leonard Lee
  WHERE = src/voice/voice-presets.ts
  WHEN = 2026
  HOW  = Static preset table; voiceRegistry resolves the best matching
         SpeechSynthesisVoice at runtime from each preset's voiceNameHints array
AGENTS: ASSESS ALIGN AUDIT
LICENSE: PROPRIETARY
*/

// ─── Types ─────────────────────────────────────────────────────────────────────
export interface VoicePreset {
  /** Short stable ID — used in localStorage / user settings. */
  id: string;
  label: string;
  gender: 'male' | 'female';
  /**
   * Ordered list of voice name substrings to try when resolving a voice.
   * The registry picks the first available match on the current device.
   */
  voiceNameHints: string[];
  /** Base SpeechSynthesisUtterance parameters (emotion engine multiplies these). */
  rate: number;
  pitch: number;
  volume: number;
  description: string;
}

// ─── Preset table ─────────────────────────────────────────────────────────────
/**
 * 3 male + 3 female presets.
 * Values are chosen to be comfortable on both desktop speakers and headsets.
 */
export const VOICE_PRESETS: readonly VoicePreset[] = [
  // ── Male presets ─────────────────────────────────────────────────────────────
  {
    id: 'M1',
    label: 'Agent Lee — Command',
    gender: 'male',
    voiceNameHints: ['Daniel', 'David', 'James', 'Guy', 'Mark'],
    rate: 1.0, pitch: 0.95, volume: 1.0,
    description: 'Authoritative, clear command voice — default for RTC ops',
  },
  {
    id: 'M2',
    label: 'Agent Lee — Calm',
    gender: 'male',
    voiceNameHints: ['David', 'Alex', 'Tom', 'Fred', 'Albert'],
    rate: 0.88, pitch: 0.90, volume: 0.85,
    description: 'Measured, reassuring — best for low-urgency status reports',
  },
  {
    id: 'M3',
    label: 'Agent Lee — Alert',
    gender: 'male',
    voiceNameHints: ['Daniel', 'James', 'Guy', 'Diego'],
    rate: 1.15, pitch: 1.05, volume: 1.0,
    description: 'Faster, higher energy — used when SENTINEL raises an alert',
  },
  // ── Female presets ───────────────────────────────────────────────────────────
  {
    id: 'F1',
    label: 'Agent ARIA — Neutral',
    gender: 'female',
    voiceNameHints: ['Samantha', 'Victoria', 'Ava', 'Allison', 'Kate'],
    rate: 1.0, pitch: 1.0, volume: 0.90,
    description: 'Clear, professional — default for health monitoring readouts',
  },
  {
    id: 'F2',
    label: 'Agent ARIA — Warm',
    gender: 'female',
    voiceNameHints: ['Karen', 'Susan', 'Fiona', 'Moira', 'Hazel'],
    rate: 0.92, pitch: 0.97, volume: 0.88,
    description: 'Softer, warmer — used for advisory and recommendation output',
  },
  {
    id: 'F3',
    label: 'Agent ARIA — Precise',
    gender: 'female',
    voiceNameHints: ['Zira', 'Victoria', 'Kathy', 'Vicki', 'Tessa'],
    rate: 1.08, pitch: 1.02, volume: 0.95,
    description: 'Crisp, technical — ideal for diagnostic and governor reports',
  },
] as const;

export const DEFAULT_PRESET_ID = 'M1';

export function findPreset(id: string): VoicePreset | undefined {
  return VOICE_PRESETS.find(p => p.id === id);
}

export function getDefaultPreset(): VoicePreset {
  return VOICE_PRESETS.find(p => p.id === DEFAULT_PRESET_ID)!;
}

/** Persist user's chosen preset ID to localStorage. */
const STORAGE_KEY = 'leeway_voice_preset';

export function loadPresetId(): string {
  try { return localStorage.getItem(STORAGE_KEY) ?? DEFAULT_PRESET_ID; }
  catch { return DEFAULT_PRESET_ID; }
}

export function savePresetId(id: string): void {
  try { localStorage.setItem(STORAGE_KEY, id); }
  catch { /* ignore */ }
}
