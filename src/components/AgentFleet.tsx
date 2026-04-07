/*
LEEWAY HEADER — DO NOT REMOVE
REGION: CORE.LEGACY.SECURE
TAG: CORE.INTERNAL.MODULE
COLOR_ONION_HEX: NEON=#00FFD1 FLUO=#00B4FF PASTEL=#C7F0FF
ICON_ASCII: family=lucide glyph=lock
5WH:
  WHAT = Migrated LeeWay SFU Internal Logic
  WHY  = Ensures baseline architectural compliance with the Living Organism integrity guard
  WHO  = LEEWAY INNOVATIONS A LEEWAY INDUSTY CREATION
  WHERE = services/sfu/src/
  WHEN = 2026
  HOW  = Governance Patch v43.4
AGENTS: AUDIT
LICENSE: PROPRIETARY
*/
import React from 'react';
import { motion } from 'framer-motion';
import { Layers } from 'lucide-react';

const AGENTS = [
  { id: 'AGT-001', code: 'ARIA', role: 'Health', status: 'Optimal', cpu: 1.2, health: 100 },
  { id: 'AGT-002', code: 'VECTOR', role: 'Metrics', status: 'Optimal', cpu: 0.8, health: 100 },
  { id: 'AGT-003', code: 'WARD', role: 'Janitor', status: 'Idle', cpu: 0.1, health: 100 },
  { id: 'AGT-004', code: 'SENTINEL', role: 'Security', status: 'Shielded', cpu: 2.1, health: 100 },
  { id: 'AGT-009', code: 'OBSERVER', role: 'Vision', status: 'Scanning', cpu: 4.5, health: 98 },
  { id: 'AGT-007', code: 'GOVERNOR', role: 'Governance', status: 'Enforcing', cpu: 1.1, health: 100 }
];

export default function AgentFleet() {
  return (
    <div className="bg-slate-950/40 backdrop-blur-2xl border border-white/5 rounded-[40px] overflow-hidden">
      <div className="p-8 pb-4 flex items-center justify-between">
        <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-3">
          <Layers className="w-4 h-4 text-cyan-400" /> Active_Agent_Fleet
        </h3>
        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full text-[10px] font-black uppercase">9 Nodes Online</span>
      </div>
      <div className="px-4 pb-8 space-y-2">
        {AGENTS.map((a) => (
          <div key={a.id} className="grid grid-cols-12 items-center gap-4 p-4 hover:bg-white/5 rounded-3xl transition-colors group">
            <div className="col-span-1 flex justify-center">
              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
            </div>
            <div className="col-span-3">
              <span className="text-[10px] font-black text-white block leading-none">{a.code}</span>
              <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tight">{a.role}</span>
            </div>
            <div className="col-span-4">
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${a.health}%` }}
                  className="h-full bg-cyan-400"
                />
              </div>
            </div>
            <div className="col-span-2 text-right">
              <span className="text-[9px] font-bold text-slate-400">{a.cpu}% CPU</span>
            </div>
            <div className="col-span-2 text-right">
              <span className="text-[8px] px-2 py-0.5 bg-emerald-500/10 text-emerald-500 rounded-md font-black uppercase">{a.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
