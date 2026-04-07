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
import { TrendingUp, ShieldCheck } from 'lucide-react';

export default function EconomicMoat() {
  return (
    <div className="bg-gradient-to-br from-indigo-600/20 to-blue-600/10 border border-indigo-500/20 rounded-[40px] overflow-hidden p-8 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.6)]">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-xs font-black text-indigo-300 uppercase tracking-widest flex items-center gap-3">
          <TrendingUp className="w-4 h-4" /> Market_Value_Efficiency
        </h3>
        <span className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-blue-300 border border-blue-500/30 px-3 py-1 rounded-full text-[10px] font-black uppercase">Enterprise Founder</span>
      </div>
      
      <div className="space-y-6">
        <div>
          <div className="flex justify-between items-end mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase">Cloud Vendor Cost (Est.)</span>
            <span className="text-sm font-black text-rose-400">$1,421.12</span>
          </div>
          <div className="h-1.5 w-full bg-rose-500/10 rounded-full">
            <div className="h-full w-[85%] bg-rose-500" />
          </div>
        </div>
        
        <div>
          <div className="flex justify-between items-end mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase">LeeWay Edge RTC Cost</span>
            <span className="text-sm font-black text-emerald-400">$0.00</span>
          </div>
          <div className="h-1.5 w-full bg-emerald-500/10 rounded-full">
            <div className="h-full w-[2%] bg-emerald-500" />
          </div>
        </div>

        <div className="pt-4 border-t border-white/5 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[9px] font-bold text-slate-500 uppercase">Total Characters Saved</span>
            <span className="text-2xl font-black text-white">42.8M</span>
          </div>
          <div className="p-3 bg-emerald-500 rounded-2xl shadow-emerald-500/20">
            <ShieldCheck className="w-6 h-6 text-slate-950" />
          </div>
        </div>
      </div>
    </div>
  );
}
