/*
LEEWAY HEADER — DO NOT REMOVE
REGION: CLIENT.COMPONENTS.DIAGNOSTICS
TAG: UI.DIAGNOSTIC.SPECTRUM.DEEP
COLOR_ONION_HEX: NEON=#00FFD1 FLUO=#00B4FF PASTEL=#C7F0FF
5WH:
  WHAT = Advanced WebRTC Deep Telemetry Dashboard
  WHY  = Measures entire living system health (Network + Media + Device + Agents) instead of just top-layer stats
  WHO  = LEEWAY INNOVATIONS A LEEWAY INDUSTY CREATION
  WHERE = src/components/DiagnosticSpectrum.tsx
  WHEN = 2026
  HOW  = Framer motion + CSS Grids + Simulated FAST/SLOW Lane WebRTC telemetry
AGENTS: VECTOR
LICENSE: PROPRIETARY
*/

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, Network, Laptop, Globe, ShieldAlert, Wifi, Zap, Hexagon, 
  Orbit, Volume2, Video, Cpu, ArrowLeftRight, HeartPulse 
} from 'lucide-react';

export default function DiagnosticSpectrum() {
  const [healthScore, setHealthScore] = useState(96);
  // Simulating the telemetry rolling buffer updates
  useEffect(() => {
    const interval = setInterval(() => {
      setHealthScore(prev => prev > 94 ? prev - Math.random() * 2 : prev + Math.random() * 3);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const healthColor = healthScore > 90 ? 'text-emerald-400' : healthScore > 75 ? 'text-amber-400' : 'text-cardinal-red';
  const healthBg = healthScore > 90 ? 'bg-emerald-500/10 border-emerald-500/20' : healthScore > 75 ? 'bg-amber-500/10 border-amber-500/20' : 'bg-red-500/10 border-red-500/20';

  return (
    <div className="flex flex-col gap-10 p-10 bg-slate-950/60 backdrop-blur-3xl rounded-[48px] border border-white/10 shadow-3xl overflow-hidden relative">
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-cyan-500/5 blur-[120px] rounded-full pointer-events-none" />

      {/* HEADER & GLOBAL HEALTH SCORE */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 border-b border-white/5 pb-10 relative z-10">
        <div>
          <h2 className="text-4xl font-black text-white tracking-tighter italic uppercase flex items-center gap-4">
             Diagnostic_Spectrum
             <span className="px-3 py-1 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-xl text-[10px] uppercase tracking-widest flex items-center gap-2">
                <Orbit className="w-3 h-3 animate-spin duration-3000" /> V2.0 DEEP TELEMETRY
             </span>
          </h2>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mt-2">VECTOR (AGT-002) // Real-Time System Awareness</p>
        </div>
        
        <div className={`p-6 rounded-[32px] border ${healthBg} flex items-center gap-8 min-w-[300px]`}>
           <div className="space-y-1">
             <span className="text-[9px] font-black text-slate-200 uppercase tracking-widest block opacity-70">Peer Health Score</span>
             <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${healthColor}`}>
               {healthScore > 90 ? 'STATUS: GOLD' : 'STATUS: DEGRADED'}
             </span>
           </div>
           <div className="flex-1 flex justify-end items-baseline gap-1">
              <span className={`text-6xl font-black italic tracking-tighter ${healthColor}`}>{healthScore.toFixed(0)}</span>
              <span className={`text-xl font-bold ${healthColor} opacity-50`}>/100</span>
           </div>
        </div>
      </div>

      {/* 6-PANEL DEEP TELEMETRY GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 relative z-10">
        
        {/* PANEL A: NETWORK */}
        <div className="p-8 bg-black/40 rounded-[32px] border border-white/5 space-y-6 hover:border-cyan-500/30 transition-colors">
           <div className="flex items-center gap-4 border-b border-white/5 pb-4">
              <Globe className="w-5 h-5 text-cyan-400" />
              <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest">Network Truth</h3>
           </div>
           <div className="space-y-4">
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-bold text-slate-500 uppercase">RTT (Latest)</span>
                <span className="text-lg font-black text-emerald-400">14ms</span>
              </div>
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Bitrate Headroom</span>
                <span className="text-lg font-black text-cyan-400">8.4 Mbps</span>
              </div>
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Path Type</span>
                <span className="text-xs font-black text-slate-300 border border-white/10 px-2 py-1 rounded-md uppercase">DIRECT srflx</span>
              </div>
           </div>
        </div>

        {/* PANEL B: AUDIO */}
        <div className="p-8 bg-black/40 rounded-[32px] border border-white/5 space-y-6 hover:border-yellow-500/30 transition-colors">
           <div className="flex items-center gap-4 border-b border-white/5 pb-4">
              <Volume2 className="w-5 h-5 text-cardinal-yellow" />
              <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest">Voice Quality</h3>
           </div>
           <div className="space-y-4">
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Concealment Ratio</span>
                <span className="text-lg font-black text-emerald-400">0.02%</span>
              </div>
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Jitter Buffer Dly</span>
                <span className="text-lg font-black text-amber-400">42ms</span>
              </div>
              <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden mt-4">
                 <div className="bg-cardinal-yellow h-full w-[98%]" />
              </div>
              <span className="text-[8px] font-black text-cardinal-yellow uppercase tracking-widest text-center block pt-1">Audio Intelligibility: High</span>
           </div>
        </div>

        {/* PANEL C: VIDEO */}
        <div className="p-8 bg-black/40 rounded-[32px] border border-white/5 space-y-6 hover:border-purple-500/30 transition-colors">
           <div className="flex items-center gap-4 border-b border-white/5 pb-4">
              <Video className="w-5 h-5 text-purple-400" />
              <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest">Video Stability</h3>
           </div>
           <div className="space-y-4">
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Send / Decode FPS</span>
                <span className="text-lg font-black text-white">30 <span className="text-slate-500 text-sm">/ 30</span></span>
              </div>
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Freeze Duration</span>
                <span className="text-lg font-black text-emerald-400">0ms</span>
              </div>
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Resolution Scaling</span>
                <span className="text-xs font-black text-purple-400 px-2 py-1 bg-purple-500/10 rounded-md">1080p (Native)</span>
              </div>
           </div>
        </div>

        {/* PANEL D: SYSTEM PRESSURE */}
        <div className="p-8 bg-black/40 rounded-[32px] border border-white/5 space-y-6 hover:border-rose-500/30 transition-colors">
           <div className="flex items-center gap-4 border-b border-white/5 pb-4">
              <Cpu className="w-5 h-5 text-rose-400" />
              <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest">Device Pressure</h3>
           </div>
           <div className="space-y-4">
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Limitation Reason</span>
                <span className="text-lg font-black text-emerald-400 uppercase tracking-tight">NONE</span>
              </div>
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Encode Avg Time</span>
                <span className="text-lg font-black text-slate-300">4.1ms</span>
              </div>
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Capture Stalls</span>
                <span className="text-lg font-black text-white">0</span>
              </div>
           </div>
        </div>

        {/* PANEL E: ADAPTATION */}
        <div className="p-8 bg-black/40 rounded-[32px] border border-white/5 space-y-6 hover:border-blue-500/30 transition-colors">
           <div className="flex items-center gap-4 border-b border-white/5 pb-4">
              <ArrowLeftRight className="w-5 h-5 text-blue-400" />
              <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest">Adaptation Intel</h3>
           </div>
           <div className="space-y-4">
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Bitrate Oscillation</span>
                <span className="text-lg font-black text-emerald-400">Low (±2%)</span>
              </div>
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Keyframe Recv (PLI)</span>
                <span className="text-lg font-black text-slate-300">2 / hr</span>
              </div>
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Retransmission Ratio</span>
                <span className="text-lg font-black text-blue-400">0.05%</span>
              </div>
           </div>
        </div>

        {/* PANEL F: EXPERIENCE */}
        <div className="p-8 bg-black/40 rounded-[32px] border border-white/5 space-y-6 hover:border-emerald-500/30 transition-colors relative overflow-hidden">
           <div className="absolute inset-0 bg-emerald-500/5 pulse-opacity" />
           <div className="flex items-center gap-4 border-b border-white/5 pb-4 relative z-10">
              <HeartPulse className="w-5 h-5 text-emerald-400" />
              <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest">User Experience</h3>
           </div>
           <div className="space-y-4 relative z-10">
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Mouth-to-Ear Latency</span>
                <span className="text-lg font-black text-emerald-400">~65ms</span>
              </div>
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Time in Degraded State</span>
                <span className="text-lg font-black text-slate-300">0.0s</span>
              </div>
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-bold text-slate-500 uppercase">User-Visible Freezes</span>
                <span className="text-lg font-black text-slate-300">0</span>
              </div>
           </div>
        </div>
      </div>
      
      {/* AGENT INSIGHT OVL */}
      <div className="mt-4 p-6 bg-cyan-500/5 rounded-[32px] border border-cyan-500/10 text-center relative z-10">
          <p className="text-[10px] font-bold text-cyan-400 leading-relaxed uppercase tracking-[0.3em]">
            &lt;VECTOR AGT-002&gt; "All spectrum layers synchronized. Device pressure null. Fast+Slow lane telemetry processing nominal."
          </p>
      </div>
    </div>
  );
}
