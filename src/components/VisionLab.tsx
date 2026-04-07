/*
LEEWAY HEADER — DO NOT REMOVE
REGION: CLIENT.COMPONENTS.VISION
TAG: UI.VISION.LAB.MONITOR
COLOR_ONION_HEX: NEON=#00FFD1 FLUO=#00B4FF PASTEL=#C7F0FF
5WH:
  WHAT = Vision Lab Observation Deck
  WHY  = Demonstrates real-time object detection across multiple camera feeds on edge hardware
  WHO  = LEEWAY INNOVATIONS A LEEWAY INDUSTY CREATION
  WHERE = src/components/VisionLab.tsx
  WHEN = 2026
  HOW  = MediaDevices API + Canvas overlays for simulated/real perception metadata
AGENTS: OBSERVER
LICENSE: PROPRIETARY
*/

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, Maximize2, Shield, Activity, Circle, AlertCircle, Scan } from 'lucide-react';

const MOCK_FEEDS = [
  { id: 1, label: 'Front_Perimeter', objects: ['PERSON', 'SECURITY_BADGE'], active: true },
  { id: 2, label: 'Lab_Entry_01', objects: ['LAPTOP', 'CHAIR'], active: true },
  { id: 3, label: 'Server_Room', objects: ['RACK', 'CABLE_SPOOL'], active: true },
  { id: 4, label: 'Main_Lobby', objects: ['DOOR', 'BAG'], active: false },
];

export default function VisionLab() {
  const [activeFeeds] = useState(MOCK_FEEDS);

  return (
    <div className="flex flex-col gap-8 p-10 bg-slate-950/60 backdrop-blur-3xl rounded-[48px] border border-white/10 shadow-3xl">
      <div className="flex flex-col md:flex-row justify-between items-start gap-6">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tighter italic uppercase">Vision_Perception_Lab</h2>
          <p className="text-[10px] font-black text-amber-400 uppercase tracking-[0.4em] mt-2">OBSERVER (AGT-009) Multi-Stream Analysis</p>
        </div>
        <div className="flex gap-4">
           <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
             <Activity className="w-3 h-3 animate-pulse" /> EDGE_INFERENCE_ACTIVE
           </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {activeFeeds.map((feed) => (
          <div key={feed.id} className="relative aspect-video rounded-[32px] bg-slate-900 overflow-hidden border border-white/5 group">
             {/* Scanner line animation */}
             <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/10 to-transparent h-1/2 w-full animate-scan z-10 pointer-events-none" />
             
             {/* Feed Content */}
             <div className="absolute inset-0 flex items-center justify-center opacity-30">
                <Camera className="w-16 h-16 text-slate-800" />
             </div>

             {/* Perception Overlays */}
             {feed.active && (
               <div className="absolute inset-0 p-10 z-20">
                  <div className="absolute top-1/4 left-1/4 w-32 h-48 border-2 border-cyan-400/50 rounded-lg flex flex-col justify-start items-start p-2">
                     <span className="bg-cyan-500 text-slate-950 text-[8px] font-black px-1 uppercase mb-1">PERSON 01 // 94%</span>
                     <div className="w-4 h-4 border-l-2 border-t-2 border-cyan-400" />
                  </div>
                  <div className="absolute bottom-1/3 right-1/4 w-24 h-24 border-2 border-amber-400/50 rounded-lg flex flex-col justify-end items-end p-2">
                     <div className="w-4 h-4 border-r-2 border-b-2 border-amber-400" />
                     <span className="bg-amber-500 text-slate-950 text-[8px] font-black px-1 uppercase mt-1">S_BADGE // 88%</span>
                  </div>
               </div>
             )}

             {/* UI Layer */}
             <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 z-30" />
             
             <div className="absolute top-6 left-6 flex items-center gap-3 px-4 py-2 bg-black/60 backdrop-blur-md rounded-2xl border border-white/10">
                <Circle className={`w-2 h-2 ${feed.active ? 'fill-emerald-500 text-emerald-500 animate-pulse' : 'text-slate-600'}`} />
                <span className="text-[10px] font-black text-white uppercase tracking-widest">{feed.label}</span>
             </div>

             <div className="absolute top-6 right-6">
                <button className="p-3 bg-black/60 backdrop-blur-md rounded-2xl border border-white/10 text-white hover:bg-cyan-500 hover:text-slate-950 transition-all">
                   <Maximize2 className="w-4 h-4" />
                </button>
             </div>

             <div className="absolute bottom-6 left-6 right-6 flex justify-between items-center text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                <div className="flex gap-4">
                   <span>Res: 1080p</span>
                   <span>FPS: 30</span>
                </div>
                {!feed.active && (
                   <span className="flex items-center gap-2 text-rose-400">
                     <AlertCircle className="w-3 h-3" /> FEED_OFFLINE
                   </span>
                )}
             </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-8 bg-black/40 rounded-[32px] border border-white/5 flex flex-col md:flex-row gap-8 items-center justify-between">
         <div className="flex items-center gap-6">
            <div className="p-4 bg-cyan-500 rounded-2xl shadow-cyan-500/20">
               <Scan className="w-6 h-6 text-slate-950" />
            </div>
            <div>
               <h4 className="text-sm font-black text-white uppercase tracking-widest">Global Scene Analysis</h4>
               <p className="text-[10px] text-slate-500 mt-1 uppercase">Aggregating metadata across 4 active nodes</p>
            </div>
         </div>
         <div className="grid grid-cols-2 gap-4">
            <button className="px-6 py-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-300 transition-all">Enable LIDAR</button>
            <button className="px-6 py-4 bg-cyan-500 hover:bg-cyan-400 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-950 transition-all shadow-lg shadow-cyan-500/20">Analyze Now</button>
         </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(200%); }
        }
        .animate-scan {
          animation: scan 4s linear infinite;
        }
      `}} />
    </div>
  );
}
