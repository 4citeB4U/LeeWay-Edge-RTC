/*
LEEWAY HEADER — DO NOT REMOVE
REGION: CLIENT.COMMAND.CENTER
TAG: UI.CINEMATIC.NARRATIVE.COMMAND
COLOR_ONION_HEX: NEON=#00FFD1 FLUO=#00B4FF PASTEL=#C7F0FF
ICON_ASCII: family=lucide glyph=layout
5WH:
  WHAT = Cinematic Narrative Hub for LeeWay Edge RTC
  WHY  = Presents technical performance through a premium, high-fidelity lens to satisfy investor and developer standards
  WHO  = LeeWay Industries | LeeWay Innovation | Creator: Leonard Lee
  WHERE = LeeWay-Edge_RTC.tsx
  WHEN = 2026
  HOW  = Multi-layer Bento layout + Narrative scrolling + Lazy-loaded Lab components
AGENTS: ARIA VECTOR OBSERVER SENTINEL NEXUS GOVERNOR
LICENSE: PROPRIETARY
*/

import React, { useEffect, useState, Suspense, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { 
  ShieldCheck, ArrowDown, Zap, Radio, Layout, Globe, Activity, 
  Terminal, Info, ChevronRight, Fingerprint, Key, Layers,
  ChevronDown, ArrowRight, Play, Server, Database, ShieldAlert
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useRTCStore } from './src/rtc/store';
import GalaxyBackground from './src/components/GalaxyBackground';

// --- GOVERNANCE SENTINEL (The Lifeblood Check) ---
const GOVERNANCE_SENTINEL = 'LEEWAY HEADER — DO NOT REMOVE';
function useGovernanceCheck() {
  const [corrupted, setCorrupted] = useState(false);
  useEffect(() => {
    if (!GOVERNANCE_SENTINEL ) {
      setCorrupted(true);
    }
  }, []);
  return corrupted;
}

// --- LAZY LABS ---
const DiagnosticSpectrum = React.lazy(() => import('./src/components/DiagnosticSpectrum'));
const VisionLab = React.lazy(() => import('./src/components/VisionLab'));
const VoiceTuner = React.lazy(() => import('./src/components/VoiceTuner'));
const AgentHub = React.lazy(() => import('./src/components/AgentHub'));
const EconomicMoat = React.lazy(() => import('./src/components/EconomicMoat'));

// --- UI UTILS ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- COMPONENTS ---
const SectionHeader = ({ title, subtitle, tag, color = "royal" }: any) => (
  <div className="flex flex-col gap-3 mb-12">
    <div className="flex items-center gap-4">
       <span className={cn("w-12 h-px", color === "royal" ? "bg-royal" : color === "baby" ? "bg-blue-300" : color === "yellow" ? "bg-cardinal-yellow" : "bg-cardinal-red")} />
       <span className={cn("text-[10px] font-black uppercase tracking-[0.5em]", color === "royal" ? "text-royal glow-royal" : color === "baby" ? "text-blue-300 glow-baby" : color === "yellow" ? "text-cardinal-yellow" : "text-cardinal-red")}>{tag}</span>
    </div>
    <h2 className="text-5xl font-black text-white italic tracking-tighter uppercase leading-tight">
      {title}
    </h2>
    <p className="text-xl text-slate-500 max-w-2xl font-light leading-relaxed">
      {subtitle}
    </p>
  </div>
);

// --- AUTH (SIMPLIFIED) ---
function CommanderAuth({ onAuth }: { onAuth: (key: string) => void }) {
  const [key, setKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAuth = () => {
    if (!key) {
      setError('Enter your system access key below to proceed.');
      return;
    }
    if (!key.startsWith('-leeway23-')) {
      setError('Key must start with -leeway23- (e.g. -leeway23-demo2026)');
      return;
    }
    setLoading(true);
    setError('');
    setTimeout(() => onAuth(key), 1200);
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden font-sans bg-black">
       {/* Canvas Galaxy Background */}
       <GalaxyBackground />

       <motion.div 
         initial={{ opacity: 0 }}
         animate={{ opacity: 1 }}
         className="relative z-10 w-full h-full flex flex-col lg:flex-row items-stretch"
       >
          {/* LEFT: BRAND IMAGE */}
          <div className="flex-[3] flex justify-center items-center p-6 lg:p-16 order-2 lg:order-1 relative overflow-hidden">
             <div className="relative z-10 w-full max-w-[900px] select-none">
               <img 
                 src="/leeway-edge-rtc.png" 
                 alt="LeeWay Edge RTC" 
                 className="relative z-10 w-full h-auto object-contain"
               />
             </div>
          </div>

          {/* RIGHT: COMMAND PANE */}
          <div className="flex-[2] min-w-[380px] bg-black/85 backdrop-blur-3xl border-l border-white/10 p-8 lg:p-12 flex flex-col justify-center order-1 lg:order-2 relative z-20">
            <div className="space-y-10 max-w-md mx-auto w-full">

               {/* Title / Freedom Messaging */}
               <div className="space-y-6">
                 <h1 className="text-3xl font-black text-white tracking-tight leading-snug">
                   You Are Choosing <span className="text-outline-cardinal italic">Freedom</span> From Vendor Lock-In
                 </h1>
                 <p className="text-sm text-slate-300 leading-relaxed">
                   No SaaS fees. No vendor lock-in. Full sovereignty over your real-time communications infrastructure.
                 </p>
                 <div className="flex items-center gap-4">
                    <span className="w-12 h-px bg-cardinal-yellow/60" />
                    <p className="text-[10px] font-black text-baby uppercase tracking-[0.4em] glow-baby">Powered by LEEWAY INNOVATIONS</p>
                 </div>
               </div>

               {/* System Key Input */}
               <div className="space-y-3">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] pl-1">Authorized System Key</label>
                  <div className="flex items-center gap-4 p-4 bg-black/60 rounded-xl border border-white/5 focus-within:border-royal/50 transition-all">
                     <Key className="w-4 h-4 text-royal" />
                     <input 
                       type="password"
                       placeholder="-leeway23-demo2026"
                       value={key}
                       onChange={(e) => { setKey(e.target.value); setError(''); }}
                       onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
                       className="bg-transparent border-none outline-none text-base font-mono text-white w-full placeholder:text-slate-700"
                     />
                  </div>
                  {error && <p className="text-[10px] text-cardinal-yellow font-bold px-1 leading-relaxed">{error}</p>}
               </div>

               {/* Welcome Button */}
               <button 
                 onClick={handleAuth}
                 disabled={loading}
                 className="px-10 py-4 bg-cardinal-yellow hover:bg-yellow-400 disabled:opacity-50 text-slate-950 rounded-2xl font-black text-base uppercase tracking-wider transition-all shadow-lg shadow-yellow-500/20 active:scale-95"
               >
                  {loading ? 'Entering...' : 'Welcome'}
               </button>

               {/* Watermark */}
               <div className="pt-8 text-left opacity-30">
                  <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.4em] leading-loose">
                    POWERED BY LEEWAY INNOVATIONS<br/>
                    A LEEWAY INDUSTY CREATION
                  </p>
               </div>
            </div>
          </div>
       </motion.div>
    </div>
  );
}

// --- MAIN CINEMATIC EXPERIENCE ---
export default function LeeWayEdgeRtc() {
  const { state, connect, disconnect } = useRTCStore();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const corrupted = useGovernanceCheck();
  
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: containerRef });
  const yParallax = useTransform(scrollYProgress, [0, 1], [0, -200]);

  const handleAuth = (providedKey: string) => {
    setIsAuthorized(true);
    connect('edge-hub', providedKey);
  };

  if (corrupted) {
    return (
      <div className="fixed inset-0 bg-red-950 flex flex-col items-center justify-center text-white p-12 text-center">
        <ShieldAlert className="w-32 h-32 mb-8 animate-pulse" />
        <h1 className="text-4xl font-black mb-4">SYSTEM_INTEGRITY_FAILURE</h1>
        <p className="text-xl max-w-lg opacity-80 mb-8">The LeeWay Standards have been modified or removed. Architectural non-compliance detected. Services suspended.</p>
        <p className="text-[10px] font-black uppercase tracking-widest text-red-400/50">POWERED BY LEEWAY INNOVATIONS A LEEWAY INDUSTY CREATION</p>
      </div>
    );
  }

  if (!isAuthorized) return <CommanderAuth onAuth={handleAuth} />;

  return (
    <div ref={containerRef} className="min-h-screen text-slate-400 font-sans selection:bg-blue-500/30 overflow-x-hidden pb-40 relative bg-black">
      
      {/* Canvas Galaxy Background (Dashboard) */}
      <GalaxyBackground />

      {/* 1. INTRO (Narrative) */}
      <section className="relative h-screen flex flex-col items-center justify-center p-12 text-center">
         <motion.div 
           initial={{ opacity: 0, y: 50 }}
           whileInView={{ opacity: 1, y: 0 }}
           className="relative z-10 space-y-8"
         >
            <div className="p-4 bg-white/5 border border-white/10 rounded-3xl w-fit mx-auto">
               <ChevronDown className="w-5 h-5 text-cyan-400 animate-bounce" />
            </div>
            <h1 className="text-[12rem] font-black text-white italic tracking-tighter leading-none select-none opacity-5">EDGE</h1>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full space-y-6">
               <span className="text-[10px] font-black text-blue-400 uppercase tracking-[1em]">Sovereign, Edge-Computing Decentralized Communication Hybrid</span>
               <h2 className="text-8xl font-black text-white italic tracking-tighter leading-none drop-shadow-2xl">LeeWay Edge RTC</h2>
               <p className="text-xl text-cyan-400 font-bold max-w-2xl mx-auto uppercase tracking-widest glow-baby">
                 powered by LEEWAY INNOVATIONS
               </p>
            </div>
         </motion.div>
         
         <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <span>Scroll to Enter Dashboard</span>
            <div className="w-px h-20 bg-gradient-to-b from-cyan-500/50 to-transparent" />
         </div>
      </section>

      {/* 2. PERFORMANCE (Diagnostics) */}
      <section className="p-8 md:p-24 max-w-[1720px] mx-auto space-y-24 relative z-10">
         <SectionHeader 
           tag="System Health" 
           title="Network_Performance" 
           subtitle="Advanced Telemetry powered by LEEWAY INNOVATIONS"
           color="baby"
         />

         <Suspense fallback={<div className="h-[600px] bg-slate-900 animate-pulse rounded-[56px]" />}>
            <DiagnosticSpectrum />
         </Suspense>
      </section>

      {/* 3. VIDEO (Vision) */}
      <section className="p-8 md:p-24 max-w-[1720px] mx-auto space-y-24 relative z-10">
         <SectionHeader 
           tag="Visual Intelligence" 
           title="Optical_Perception" 
           subtitle="Multi-stream Scene Analysis powered by LEEWAY INNOVATIONS"
         />

         <Suspense fallback={<div className="h-[600px] bg-slate-900 animate-pulse rounded-[56px]" />}>
            <VisionLab />
         </Suspense>
      </section>

      {/* 4. AUDIO (Voice) */}
      <section className="p-8 md:p-24 max-w-[1720px] mx-auto space-y-24 relative z-10">
         <SectionHeader 
           tag="Audio Studio" 
           title="Vocal_Architecture" 
           subtitle="Neural Audio Engineering powered by LEEWAY INNOVATIONS"
           color="yellow"
         />

         <Suspense fallback={<div className="h-[600px] bg-slate-900 animate-pulse rounded-[56px]" />}>
            <VoiceTuner />
         </Suspense>
      </section>

      {/* 5. ECOSYSTEM (Agents) */}
      <section className="p-8 md:p-24 max-w-[1720px] mx-auto space-y-24 relative z-10">
         <SectionHeader 
           tag="Autonomous Ecosystem" 
           title="Agent_Intelligence" 
           subtitle="Advanced Developer Tools powered by LEEWAY INNOVATIONS"
           color="red"
         />

         <Suspense fallback={<div className="h-[600px] bg-slate-900 animate-pulse rounded-[56px]" />}>
            <AgentHub />
         </Suspense>
      </section>

      {/* 6. EFFICIENCY (ROI) */}
      <section className="p-8 md:p-24 max-w-[1720px] mx-auto relative z-10">
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
            <div className="space-y-12">
               <SectionHeader 
                 tag="Economic Efficiency" 
                 title="Value_Moat" 
                 subtitle="Sovereign edge infrastructure powered by LEEWAY INNOVATIONS"
                 color="yellow"
               />
               <div className="flex gap-8">
                  <div className="p-10 bg-white/5 border border-white/10 rounded-[40px] flex-1">
                     <span className="text-[10px] font-black text-slate-500 uppercase block mb-4">Data Retention (Chars)</span>
                     <span className="text-4xl font-black text-white tabular-nums italic">42.8M+</span>
                  </div>
                  <div className="p-10 bg-emerald-500/10 border border-emerald-500/20 rounded-[40px] flex-1">
                     <span className="text-[10px] font-black text-emerald-500 uppercase block mb-4">Value Retained</span>
                     <span className="text-4xl font-black text-white tabular-nums italic">$1,421.12</span>
                  </div>
               </div>
                <button onClick={disconnect} className="h-24 px-12 bg-white text-slate-950 rounded-[32px] font-black text-2xl italic tracking-tighter flex items-center gap-6 hover:bg-cardinal-yellow transition-all shadow-2xl shadow-yellow-500/20 active:scale-95 group">
                   INITIALIZE_OPERATIONS <ArrowRight className="w-8 h-8 group-hover:translate-x-2 transition-transform" />
                </button>
            </div>
            
            <Suspense fallback={<div className="h-96 bg-slate-900 animate-pulse" />}>
               <EconomicMoat />
            </Suspense>
         </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/5 p-24 mt-24 text-center relative z-10">
         <div className="flex flex-col items-center gap-8">
            <Fingerprint className="w-12 h-12 text-slate-100" />
            <div className="space-y-4">
              <p className="max-w-md text-slate-400 text-[10px] font-black uppercase tracking-[0.5em] leading-loose">
                 LeeWay Edge RTC // Architectural Excellence // Creator: Leonard Lee
              </p>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">
                POWERED BY LEEWAY INNOVATIONS A LEEWAY INDUSTY CREATION
              </p>
            </div>
         </div>
      </footer>

      {/* Custom Global Ambience */}
      <style dangerouslySetInnerHTML={{ __html: `
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #22d3ee40; border-radius: 10px; }
      `}} />
    </div>
  );
}
