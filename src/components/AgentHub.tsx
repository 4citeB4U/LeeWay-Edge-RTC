/*
LEEWAY HEADER — DO NOT REMOVE
REGION: CLIENT.COMPONENTS.AGENTS
TAG: UI.AGENT.HUB.NPC
COLOR_ONION_HEX: NEON=#00FFD1 FLUO=#00B4FF PASTEL=#C7F0FF
5WH:
  WHAT = NPC Agent Profile Hub
  WHY  = Present technical oversight agents as immersive narrative characters for easier human-agent interaction
  WHO  = LEEWAY INNOVATIONS A LEEWAY INDUSTY CREATION
  WHERE = src/components/AgentHub.tsx
  WHEN = 2026
  HOW  = Bento-style cards + Framer Motion staggered reveals + TTS integration
AGENTS: NEXUS
LICENSE: PROPRIETARY
*/

import React from 'react';
import { motion } from 'framer-motion';
import { Volume2, Shield, Eye, Activity, Cpu, Settings, Zap, Info, ChevronRight } from 'lucide-react';

const AGENT_FLEET = [
  { 
    id: 'AGT-001', 
    name: 'ARIA', 
    position: 'Communications Lead', 
    purpose: 'Voice synthesis and protocol coordination.', 
    status: 'Monitoring audio pipelines...', 
    color: 'text-cyan-400', 
    bg: 'bg-cyan-500/10',
    icon: Volume2
  },
  { 
    id: 'AGT-002', 
    name: 'VECTOR', 
    position: 'Metrics Diagnostics', 
    purpose: 'Telemetry gathering and performance monitoring.', 
    status: 'All spectrums nominal.', 
    color: 'text-blue-400', 
    bg: 'bg-blue-500/10',
    icon: Activity
  },
  { 
    id: 'AGT-003', 
    name: 'WARD', 
    position: 'System Janitor', 
    purpose: 'Memory management and state cleanup.', 
    status: 'Awaiting next garbage collection.', 
    color: 'text-slate-400', 
    bg: 'bg-slate-500/10',
    icon: Settings
  },
  { 
    id: 'AGT-004', 
    name: 'SENTINEL', 
    position: 'Cyber Security Officer', 
    purpose: 'Deep packet inspection and threat detection.', 
    status: 'Perimeter secure. 0 threats detected.', 
    color: 'text-rose-400', 
    bg: 'bg-rose-500/10',
    icon: Shield
  },
  { 
    id: 'AGT-007', 
    name: 'GOVERNOR', 
    position: 'Chief Legal Officer', 
    purpose: 'Policy enforcement and IP protection.', 
    status: 'All standards compliant. Audit passed.', 
    color: 'text-purple-400', 
    bg: 'bg-purple-500/10',
    icon: Cpu
  },
  { 
    id: 'AGT-009', 
    name: 'OBSERVER', 
    position: 'Vision Perception System', 
    purpose: 'Visual scene analysis and object detection.', 
    status: 'Scanning 4 camera streams...', 
    color: 'text-amber-400', 
    bg: 'bg-amber-500/10',
    icon: Eye
  },
];

export default function AgentHub() {
  const playAudio = (agentName: string, status: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // clear previous
      const utterance = new SpeechSynthesisUtterance(`Agent ${agentName} reporting. ${status}`);
      utterance.pitch = agentName === 'ARIA' ? 1.4 : agentName === 'OBSERVER' ? 0.9 : 1.0;
      utterance.rate = 1.1;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="flex flex-col gap-10 p-10 bg-slate-950/60 backdrop-blur-3xl rounded-[48px] border border-white/10 shadow-3xl">
      <div className="flex flex-col md:flex-row justify-between items-start gap-6 border-b border-white/5 pb-10">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tighter italic uppercase">Agent_NPC_Fleet</h2>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mt-2">Mission Control Staff // Autonomous Support</p>
        </div>
        <div className="flex gap-4 p-4 bg-white/5 rounded-3xl border border-white/10">
           <Zap className="w-5 h-5 text-cyan-400 fill-cyan-400" />
           <span className="text-xs font-black text-white uppercase tracking-widest self-center">Operational Efficiency: 99.8%</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {AGENT_FLEET.map((agent, i) => (
          <motion.div 
            key={agent.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="group relative bg-black/40 p-8 rounded-[40px] border border-white/5 hover:border-white/20 transition-all flex flex-col h-full"
          >
             <div className="flex justify-between items-start mb-8">
                <div className={`p-4 rounded-2xl ${agent.bg} ${agent.color}`}>
                   <agent.icon className="w-6 h-6" />
                </div>
                <span className="text-[9px] font-black text-slate-700 uppercase">{agent.id}</span>
             </div>

             <div className="space-y-2 mb-6">
                <h3 className="text-2xl font-black text-white tracking-tight uppercase italic group-hover:text-cyan-400 transition-colors">{agent.name}</h3>
                <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{agent.position}</p>
             </div>

             <div className="flex-1 space-y-4">
                <p className="text-xs text-slate-400 leading-relaxed font-medium">{agent.purpose}</p>
                <div className="flex items-center gap-2 p-3 bg-white/5 rounded-2xl border border-white/5">
                   <Activity className={`w-3 h-3 ${agent.color} animate-pulse`} />
                   <span className="text-[9px] font-bold text-slate-300 uppercase truncate">{agent.status}</span>
                </div>
             </div>

             <div className="mt-8 pt-6 border-t border-white/5 flex gap-3">
                <button 
                  onClick={() => playAudio(agent.name, agent.status)}
                  className="flex-1 h-12 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center gap-2 transition-all active:bg-cyan-500/20 active:text-cyan-400"
                >
                   <Volume2 className="w-4 h-4 text-slate-400 group-hover:text-cyan-400 transition-colors" />
                   <span className="text-[10px] font-black text-white uppercase group-hover:text-cyan-400 transition-colors">Audio Update</span>
                </button>
                <button className="w-12 h-12 bg-slate-800 hover:bg-slate-700 rounded-xl flex items-center justify-center transition-all">
                   <ChevronRight className="w-4 h-4 text-white" />
                </button>
             </div>
          </motion.div>
        ))}

      </div>

      <div className="p-8 bg-gradient-to-r from-cyan-500/10 to-transparent rounded-[32px] border border-cyan-500/20 flex flex-col md:flex-row gap-8 items-center justify-between">
         <div className="flex items-center gap-6">
            <Info className="w-6 h-6 text-cyan-400" />
            <p className="text-xs text-slate-400 italic">Need assistance? Select an agent to receive a localized briefing on current system tasks.</p>
         </div>
         <button className="px-10 py-4 bg-cyan-500 hover:bg-cyan-400 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-950 transition-all font-sans">
           Request Global Briefing
         </button>
      </div>
    </div>
  );
}
