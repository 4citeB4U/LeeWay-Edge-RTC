/*
LEEWAY HEADER — DO NOT REMOVE
REGION: CLIENT.COMPONENTS.VOICE.LAB
TAG: UI.VOICE.ENGINE.LAB.INTEGRATION
COLOR_ONION_HEX: NEON=#00FFD1 FLUO=#00B4FF PASTEL=#C7F0FF
5WH:
  WHAT = VoiceStudioLab — Integration wrapper for Voice Matching + Modulation Engine
  WHY  = Provides dashboard-ready voice workflow UI with agent-guided 7-step workflow
  WHO  = LEEWAY INNOVATIONS A LEEWAY INDUSTRY CREATION
  WHERE = src/components/VoiceStudioLab.tsx
  WHEN = 2026
  HOW  = Wraps enhanced VoiceStudio component for lazy-loading in main dashboard
AGENTS: ASSESS ALIGN AUDIT
LICENSE: PROPRIETARY
*/

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { VoiceStudio } from '../voice/VoiceStudio';

export default function VoiceStudioLab() {
  const [showModal, setShowModal] = useState(false);

  return (
    <React.Fragment>
      {/* Dashboard Trigger Card */}
      <div className="flex flex-col gap-8 p-10 bg-slate-950/60 backdrop-blur-3xl rounded-[48px] border border-white/10 shadow-3xl">
        <div className="flex flex-col md:flex-row justify-between items-start gap-6">
          <div>
            <h2 className="text-3xl font-black text-white tracking-tighter italic">VOICE_MATCHING_ENGINE</h2>
            <p className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.4em] mt-2">Deterministic Matching // Modulation // Preview</p>
          </div>
          <div className="flex gap-4">
            <span className="bg-slate-800 text-slate-400 border border-white/5 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest">7 STEP WORKFLOW</span>
          </div>
        </div>

        <p className="text-slate-300 text-sm leading-relaxed max-w-3xl">
          Transform your voice through a guided 7-step workflow: <strong>Capture</strong> your speech, 
          <strong> Analyze</strong> acoustic traits (pitch, energy, tone), <strong>Profile</strong> your unique voice, 
          <strong> Match</strong> to optimal browser voices, <strong>Modulate</strong> with presets (Natural, Deep, Bright, Broadcast), 
          <strong> Preview</strong> the result, and <strong>Save</strong> your personalized configuration.
        </p>

        <motion.button
          onClick={() => setShowModal(true)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full h-16 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-lg shadow-cyan-500/20 text-slate-950 font-black uppercase text-sm tracking-wider"
        >
          🎤 Launch Voice Engine
        </motion.button>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-white/5">
          {[
            { icon: '🎵', title: 'Acoustic Analysis', desc: 'Pitch, energy, tone, stability detection' },
            { icon: '🎯', title: 'Voice Matching', desc: 'Deterministic matching with ranked candidates' },
            { icon: '🎚️', title: 'Modulation Presets', desc: '4 presets: Natural, Deep, Bright, Broadcast' },
          ].map((feature, i) => (
            <div key={i} className="p-4 bg-black/40 border border-white/5 rounded-2xl">
              <div className="text-2xl mb-2">{feature.icon}</div>
              <p className="text-xs font-black text-white uppercase tracking-wider mb-1">{feature.title}</p>
              <p className="text-[10px] text-slate-400">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {showModal && <VoiceStudio onClose={() => setShowModal(false)} />}
    </React.Fragment>
  );
}
