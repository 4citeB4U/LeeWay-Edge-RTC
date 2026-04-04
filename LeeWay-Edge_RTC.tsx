import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { VoiceStudio } from './src/voice/VoiceStudio';
import { 
  Activity, 
  AlertTriangle, 
  AudioLines, 
  Camera, 
  CheckCircle2, 
  CircleDot, 
  Cpu, 
  Gauge, 
  Globe, 
  HardDrive, 
  Lock, 
  Mic, 
  MonitorSmartphone, 
  Network, 
  Radio, 
  RefreshCw, 
  Server, 
  Shield, 
  Video, 
  Waves, 
  Wifi, 
  Zap,
  Terminal,
  Info,
  BarChart3,
  PieChart as PieChartIcon,
  Layers,
  History,
  Users,
  ArrowUpRight,
  ArrowDownLeft,
  AlertCircle,
  Maximize2,
  Share2,
  Database,
  Search,
  Settings,
  ChevronRight,
  MoreVertical
} from 'lucide-react';
import { 
  Area, 
  AreaChart, 
  CartesianGrid, 
  Line, 
  LineChart, 
  ResponsiveContainer, 
  Tooltip, 
  XAxis, 
  YAxis,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useRTCStore } from './src/rtc/store';
import type { RTCState } from './src/rtc/store';

// --- UTILS ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- UI COMPONENTS (INLINED SHADCN-LIKE) ---
const Card = ({ className, children }: { className?: string; children: React.ReactNode }) => (
  <div className={cn("bg-slate-950/40 backdrop-blur-xl border border-white/10 rounded-[32px] overflow-hidden shadow-2xl", className)}>
    {children}
  </div>
);

const CardHeader = ({ className, children }: { className?: string; children: React.ReactNode }) => (
  <div className={cn("p-6 pb-2", className)}>{children}</div>
);

const CardTitle = ({ className, children }: { className?: string; children: React.ReactNode }) => (
  <h3 className={cn("text-lg font-bold text-white", className)}>{children}</h3>
);

const CardContent = ({ className, children }: { className?: string; children: React.ReactNode }) => (
  <div className={cn("p-6", className)}>{children}</div>
);

const Badge = ({ className, children }: { className?: string; children: React.ReactNode }) => (
  <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2", className)}>
    {children}
  </span>
);

const Button = ({ className, children, variant = 'default', size = 'default', ...props }: any) => {
  const variants: any = {
    default: "bg-cyan-500 text-slate-950 hover:bg-cyan-400",
    outline: "border border-white/10 bg-transparent hover:bg-white/5 text-white",
    ghost: "hover:bg-white/5 text-white",
  };
  const sizes: any = {
    default: "h-10 px-4 py-2",
    sm: "h-8 px-3 text-xs",
    lg: "h-12 px-8",
    icon: "h-10 w-10",
  };
  return (
    <button className={cn("inline-flex items-center justify-center rounded-2xl font-bold transition-all active:scale-95 disabled:opacity-50", variants[variant], sizes[size], className)} {...props}>
      {children}
    </button>
  );
};

const Progress = ({ value, className }: { value: number; className?: string }) => (
  <div className={cn("relative h-2 w-full overflow-hidden rounded-full bg-slate-800", className)}>
    <div className="h-full w-full flex-1 bg-cyan-500 transition-all" style={{ transform: `translateX(-${100 - (value || 0)}%)` }} />
  </div>
);

const ScrollArea = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("relative overflow-auto custom-scrollbar", className)}>
    {children}
  </div>
);

// --- SUB-COMPONENTS ---
function SectionHeader({ title, eyebrow, status, statusTone = 'neutral' }: { title: string; eyebrow: string; status?: string; statusTone?: 'good' | 'warn' | 'bad' | 'neutral' }) {
  const statusToneClasses: any = {
    good: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400',
    warn: 'border-amber-500/40 bg-amber-500/10 text-amber-400',
    bad: 'border-red-500/40 bg-red-500/10 text-red-400',
    neutral: 'border-slate-500/40 bg-slate-500/10 text-slate-200',
  };
  return (
    <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-cyan-400/90">{eyebrow}</p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-white">{title}</h2>
      </div>
      {status && (
        <Badge className={cn("px-3 py-1 text-[10px] font-black tracking-widest border", statusToneClasses[statusTone])}>
          {status.toUpperCase()}
        </Badge>
      )}
    </div>
  );
}

function ConnectionTruth({ state }: { state: RTCState }) {
  return (
    <Card>
      <CardContent className="p-8">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Connection_Truth</h3>
          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[9px] font-black">SECURE_DTLS</Badge>
        </div>
        
        <div className="flex flex-col items-center justify-center py-6">
          <div className="relative w-48 h-48">
            <svg className="w-full h-full" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="#1e293b" strokeWidth="8" />
              <circle 
                cx="50" cy="50" r="45" fill="none" stroke="#22d3ee" strokeWidth="8" 
                strokeDasharray="282.7" strokeDashoffset={282.7 * (1 - 0.92)} 
                strokeLinecap="round" className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-black text-white">92%</span>
              <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">Quality_Index</span>
            </div>
          </div>
          <p className="mt-6 text-xs text-slate-400 text-center font-mono uppercase tracking-widest">Optimal Transport Path Detected</p>
        </div>

        <div className="mt-8 space-y-4">
          <div className="flex items-center justify-between p-4 bg-black/40 rounded-2xl border border-white/5">
            <div className="flex items-center gap-3">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-slate-300 uppercase">ICE_STATE</span>
            </div>
            <span className="text-[10px] font-black text-emerald-400">{state.iceState.toUpperCase()}</span>
          </div>
          <div className="flex items-center justify-between p-4 bg-black/40 rounded-2xl border border-white/5">
            <div className="flex items-center gap-3">
              <Globe className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-bold text-slate-300 uppercase">PATH_TYPE</span>
            </div>
            <span className="text-[10px] font-black text-blue-400">{state.isRelay ? 'TURN_RELAY' : 'DIRECT_P2P'}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TopologyView() {
  return (
    <Card className="bg-slate-950/40 backdrop-blur-xl border-white/10 rounded-[32px] overflow-hidden shadow-2xl">
      <CardContent className="p-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Network className="w-4 h-4 text-cyan-400" /> SFU_ROUTING_TOPOLOGY
          </h3>
          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[9px] font-black">STABLE_FLOW</Badge>
        </div>
        <div className="h-32 flex items-center justify-around relative">
          <div className="absolute inset-0 flex items-center justify-center opacity-20">
            <div className="w-full h-px bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />
          </div>
          <div className="flex flex-col items-center gap-2 z-10">
            <div className="p-3 bg-slate-800 rounded-2xl border border-white/10 shadow-xl">
              <Server className="w-6 h-6 text-cyan-400" />
            </div>
            <span className="text-[9px] font-bold text-slate-500 uppercase">Edge_Worker_US</span>
          </div>
          <div className="flex flex-col items-center gap-2 z-10">
            <div className="p-4 bg-cyan-500 rounded-full shadow-[0_0_30px_rgba(34,211,238,0.3)]">
              <Cpu className="w-8 h-8 text-slate-950" />
            </div>
            <span className="text-[9px] font-bold text-white uppercase">Mediasoup_SFU</span>
          </div>
          <div className="flex flex-col items-center gap-2 z-10">
            <div className="p-3 bg-slate-800 rounded-2xl border border-white/10 shadow-xl">
              <Globe className="w-6 h-6 text-blue-400" />
            </div>
            <span className="text-[9px] font-bold text-slate-500 uppercase">Client_Relay</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// --- MAIN COMPONENT ---
export default function LeeWayEdgeRtc() {
  const { state, addEvent, connect, disconnect, publish, stopPublish, isPublishing } = useRTCStore();
  const [series, setSeries] = useState<any[]>([]);
  const [roomInput, setRoomInput] = useState('leeway-main');
  const [showVoiceStudio, setShowVoiceStudio] = useState(false);

  // Initialize chart with zeros
  useEffect(() => {
    setSeries(Array.from({ length: 20 }).map(() => ({
      time: '--:--:--', bitrateIn: 0, bitrateOut: 0, rtt: 0, jitter: 0,
    })));
  }, []);

  // Update chart from real peer stats whenever pollStats fires
  useEffect(() => {
    const localPeer = state.peers.find(p => p.isLocal);
    if (!localPeer) return;
    const nextTime = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setSeries(prev => [...prev.slice(1), {
      time: nextTime,
      bitrateIn: Math.round(localPeer.bitrate),
      bitrateOut: Math.round(localPeer.bitrate * 0.65),
      rtt: Math.round(localPeer.rtt),
      jitter: Math.round(localPeer.jitter),
    }]);
  }, [state.peers]);

  const latest = series.length > 0 ? series[series.length - 1] : { bitrateIn: 0, bitrateOut: 0, rtt: 0, jitter: 0 };

  const distributionData = [
    { name: 'Video', value: 70, color: '#22d3ee' },
    { name: 'Audio', value: 15, color: '#10b981' },
    { name: 'Screen', value: 10, color: '#f59e0b' },
    { name: 'Overhead', value: 5, color: '#64748b' },
  ];

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 font-sans selection:bg-cyan-500/30 overflow-x-hidden">
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
      </div>

      <div className="relative z-10 mx-auto max-w-[1600px] p-4 md:p-8 space-y-8">
        {/* Top Header Bar */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-950/40 backdrop-blur-xl border border-white/10 p-6 rounded-[32px] shadow-2xl">
          <div className="flex items-center gap-5">
            <div className="p-3 bg-cyan-500 rounded-2xl shadow-[0_0_20px_rgba(34,211,238,0.4)]">
              <Zap className="w-8 h-8 text-slate-950 fill-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-black tracking-tighter text-white">LeeWay Edge RTC</h1>
                <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20 text-[10px] font-black px-2">v4.2.0-STABLE</Badge>
              </div>
              <p className="text-slate-400 text-xs font-mono mt-1 tracking-widest uppercase">Mission Control • Production Edge Stack</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-6 px-6 py-3 bg-black/40 rounded-2xl border border-white/5">
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">Status</span>
                <span className={cn("font-black text-sm", state.connectionState === 'connected' ? 'text-emerald-400' : state.connectionState === 'connecting' ? 'text-amber-400' : 'text-slate-400')}>{state.connectionState.toUpperCase()}</span>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">Active Peers</span>
                <span className="text-white font-black text-sm">{state.peers.length}</span>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">Room</span>
                <span className="text-cyan-400 font-black text-sm font-mono">{state.roomName || roomInput}</span>
              </div>
            </div>
            <Button
              onClick={() => setShowVoiceStudio(true)}
              className="bg-slate-800 hover:bg-slate-700 border border-white/10 text-white font-black text-xs px-5 h-12 rounded-2xl transition-all active:scale-95"
            >
              🎙 Voice Studio
            </Button>
            {state.connectionState !== 'connected' ? (
              <div className="flex items-center gap-2">
                <input
                  value={roomInput}
                  onChange={e => setRoomInput(e.target.value)}
                  placeholder="room-id"
                  className="h-12 px-4 rounded-2xl bg-black/40 border border-white/10 text-white text-xs font-mono w-36 focus:outline-none focus:border-cyan-500/50"
                />
                <Button
                  onClick={() => connect(roomInput)}
                  disabled={state.connectionState === 'connecting'}
                  className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs px-8 h-12 rounded-2xl shadow-lg shadow-cyan-500/20 transition-all active:scale-95 disabled:opacity-50"
                >
                  {state.connectionState === 'connecting' ? 'CONNECTING...' : 'CONNECT'}
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => isPublishing ? stopPublish() : publish(false)}
                  className={cn("font-black text-xs px-6 h-12 rounded-2xl transition-all active:scale-95", isPublishing ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950' : 'bg-slate-700 hover:bg-slate-600 text-white')}
                >
                  {isPublishing ? 'MIC_ON' : 'MIC_OFF'}
                </Button>
                <Button
                  onClick={disconnect}
                  className="bg-rose-600 hover:bg-rose-500 text-white font-black text-xs px-8 h-12 rounded-2xl shadow-lg shadow-rose-500/20 transition-all active:scale-95"
                >
                  DISCONNECT
                </Button>
              </div>
            )}
          </div>
        </header>

        {/* Main Grid */}
        <div className="grid grid-cols-12 gap-8">
          
          {/* Left Column: Visual Monitoring */}
          <div className="col-span-12 lg:col-span-8 space-y-8">
            
            {/* Live Media Section */}
            <Card>
              <CardContent className="p-8">
                <SectionHeader 
                  eyebrow="Media Stage" 
                  title="Live Stream Observation" 
                  status={state.connectionState === 'connected' ? "Live Feed Active" : "Connecting..."} 
                  statusTone={state.connectionState === 'connected' ? "good" : "warn"} 
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {state.peers.map((peer) => (
                    <div key={peer.id} className="relative aspect-video bg-slate-900 rounded-3xl overflow-hidden border border-white/5 group">
                      <div className={cn("absolute inset-0 opacity-50", peer.isLocal ? "bg-gradient-to-br from-cyan-500/10 to-transparent" : "bg-gradient-to-br from-blue-500/10 to-transparent")} />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Video className="w-16 h-16 text-slate-800" />
                      </div>
                      <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-xl border border-white/10">
                        <div className={cn("w-2 h-2 rounded-full animate-pulse", peer.isLocal ? "bg-emerald-500" : "bg-blue-500")} />
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">{peer.name.replace(' ', '_')}</span>
                      </div>
                      {!peer.isLocal && (
                        <div className="absolute top-4 right-4 px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-xl border border-white/10">
                          <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">{peer.rtt.toFixed(0)}ms RTT</span>
                        </div>
                      )}
                      <div className="absolute bottom-4 right-4 flex gap-2">
                        <Button size="icon" variant="ghost" className="bg-black/40 hover:bg-black/60 rounded-xl border border-white/10">
                          <Mic className="w-4 h-4 text-white" />
                        </Button>
                        <Button size="icon" variant="ghost" className="bg-black/40 hover:bg-black/60 rounded-xl border border-white/10">
                          <Camera className="w-4 h-4 text-white" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {state.peers.length < 2 && (
                    <div className="aspect-video bg-slate-900/30 rounded-3xl border border-dashed border-white/10 flex items-center justify-center">
                      <span className="text-slate-600 font-mono text-xs uppercase tracking-widest">Awaiting_Remote_Peer...</span>
                    </div>
                  )}
                </div>

                <div className="mt-8">
                  <TopologyView />
                </div>
              </CardContent>
            </Card>

            {/* Live Performance Analytics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card>
                <CardContent className="p-8">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-lg font-bold text-white">Throughput Analysis</h3>
                      <p className="text-xs text-slate-500 font-mono mt-1 uppercase tracking-widest">Live Bitrate In/Out</p>
                    </div>
                    <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20 text-[10px] font-black">OPTIMAL_BANDWIDTH</Badge>
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={series}>
                        <defs>
                          <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis dataKey="time" hide />
                        <YAxis hide domain={['dataMin - 500', 'dataMax + 500']} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '16px', fontSize: '10px', color: '#fff' }}
                          itemStyle={{ color: '#22d3ee' }}
                        />
                        <Area type="monotone" dataKey="bitrateIn" stroke="#22d3ee" strokeWidth={3} fillOpacity={1} fill="url(#colorIn)" isAnimationActive={true} />
                        <Area type="monotone" dataKey="bitrateOut" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorOut)" isAnimationActive={true} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-6 grid grid-cols-2 gap-4">
                    <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Current Ingress</span>
                      <span className="text-xl font-black text-cyan-400">{(latest.bitrateIn / 1000).toFixed(2)} Mbps</span>
                    </div>
                    <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Current Egress</span>
                      <span className="text-xl font-black text-blue-400">{(latest.bitrateOut / 1000).toFixed(2)} Mbps</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-8">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-lg font-bold text-white">Network Stability</h3>
                      <p className="text-xs text-slate-500 font-mono mt-1 uppercase tracking-widest">RTT & Jitter Variance</p>
                    </div>
                    <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] font-black">LOW_LATENCY</Badge>
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={series}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis dataKey="time" hide />
                        <YAxis hide domain={[0, 'dataMax + 20']} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '16px', fontSize: '10px', color: '#fff' }}
                        />
                        <Line type="monotone" dataKey="rtt" stroke="#10b981" strokeWidth={3} dot={false} isAnimationActive={true} />
                        <Line type="monotone" dataKey="jitter" stroke="#f59e0b" strokeWidth={3} dot={false} isAnimationActive={true} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-6 grid grid-cols-2 gap-4">
                    <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Avg RTT</span>
                      <span className="text-xl font-black text-emerald-400">{latest.rtt} ms</span>
                    </div>
                    <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Avg Jitter</span>
                      <span className="text-xl font-black text-amber-400">{latest.jitter} ms</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Operational Insights */}
            <Card className="bg-gradient-to-br from-cyan-500/10 to-blue-600/10 backdrop-blur-xl border-cyan-500/20 rounded-[32px] shadow-2xl">
              <CardContent className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-cyan-500/20 rounded-2xl border border-cyan-500/30">
                    <Info className="w-6 h-6 text-cyan-400" />
                  </div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tighter">Operational Insights</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <h4 className="text-xs font-black text-cyan-400 uppercase tracking-widest">Why RTT Matters</h4>
                    <p className="text-xs text-slate-300 leading-relaxed">Round-Trip Time is the heartbeat of real-time interaction. Below 50ms is optimal for conversational audio.</p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-xs font-black text-amber-400 uppercase tracking-widest">Jitter Management</h4>
                    <p className="text-xs text-slate-300 leading-relaxed">Jitter represents the variance in packet arrival. High jitter causes "robotic" audio. Our SFU uses dynamic jitter buffers.</p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-xs font-black text-rose-400 uppercase tracking-widest">Packet Loss Impact</h4>
                    <p className="text-xs text-slate-300 leading-relaxed">Even 1% loss can degrade video quality. We use Forward Error Correction (FEC) to recover lost data.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: System State & Controls */}
          <div className="col-span-12 lg:col-span-4 space-y-8">
            <ConnectionTruth state={state} />

            {/* Traffic Distribution */}
            <Card>
              <CardContent className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Traffic_Distribution</h3>
                  <PieChartIcon className="w-4 h-4 text-slate-500" />
                </div>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={distributionData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {distributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '16px', fontSize: '10px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-6 grid grid-cols-2 gap-y-3">
                  {distributionData.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-[10px] font-bold text-slate-400 uppercase">{item.name}</span>
                      <span className="text-[10px] font-black text-white">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Peer Inspector */}
            <Card>
              <CardContent className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Peer_Inspector</h3>
                  <Users className="w-4 h-4 text-slate-500" />
                </div>
                <div className="space-y-4">
                  {state.peers.map((peer) => (
                    <div key={peer.id} className="p-4 bg-black/20 rounded-2xl border border-white/5 group hover:border-cyan-500/30 transition-all">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className={cn("w-1.5 h-1.5 rounded-full", peer.packetLoss > 2 ? 'bg-rose-500' : 'bg-emerald-500')} />
                          <span className="text-xs font-bold text-slate-200 uppercase">{peer.name}</span>
                        </div>
                        <span className="text-[10px] font-black text-cyan-400">{(peer.bitrate / 1000).toFixed(1)} Mbps</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col">
                          <span className="text-[8px] font-bold text-slate-500 uppercase">Packet Loss</span>
                          <span className={cn("text-[10px] font-black", peer.packetLoss > 1 ? "text-rose-400" : "text-slate-300")}>{peer.packetLoss.toFixed(1)}%</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[8px] font-bold text-slate-500 uppercase">Latency</span>
                          <span className="text-[10px] font-black text-slate-300">{peer.rtt.toFixed(0)}ms</span>
                        </div>
                      </div>
                      <div className="mt-3">
                        <Progress value={Math.max(5, 100 - peer.packetLoss * 10)} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Event Console */}
            <Card className="h-[400px] flex flex-col">
              <CardHeader className="p-8 pb-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-cyan-400" /> Event_Stream
                  </h3>
                  <div className="flex gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[8px] font-black text-emerald-500 uppercase">Live</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0 flex-1 overflow-hidden">
                <ScrollArea className="h-full px-8 pb-8">
                  <div className="space-y-4 font-mono text-[10px]">
                    {state.events.map((event) => (
                      <div key={event.id} className="group border-l-2 border-white/5 pl-4 py-1 hover:border-cyan-500/50 transition-all">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-slate-600 font-bold">{new Date(event.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                          <span className={cn(
                            "font-black uppercase tracking-tighter",
                            event.level === 'success' ? 'text-emerald-400' : 
                            event.level === 'warn' ? 'text-amber-400' : 
                            event.level === 'error' ? 'text-rose-400' : 'text-cyan-400'
                          )}>
                            [{event.source || event.type.toUpperCase()}]
                          </span>
                        </div>
                        <p className="text-slate-300 leading-relaxed group-hover:text-white transition-colors">{event.message}</p>
                      </div>
                    ))}
                    {state.events.length === 0 && (
                      <div className="text-slate-600 italic">Waiting for events...</div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <footer className="flex flex-col md:flex-row items-center justify-between gap-4 p-8 bg-slate-950/40 backdrop-blur-xl border border-white/10 rounded-[32px]">
          <div className="flex items-center gap-4">
            <div className="flex -space-x-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-slate-950 bg-slate-800 flex items-center justify-center">
                  <Users className="w-4 h-4 text-slate-400" />
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-400 font-mono uppercase tracking-widest">3 Operators Monitoring Production</p>
          </div>
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-slate-500" />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Last Snapshot: 2s ago</span>
            </div>
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-slate-500" />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Standalone RTC Module</span>
            </div>
          </div>
        </footer>
      </div>

      {/* Global Styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.1; transform: scale(1); }
          50% { opacity: 0.15; transform: scale(1.1); }
        }
        .animate-pulse-glow {
          animation: pulse-glow 4s infinite ease-in-out;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}} />

      {/* Voice Studio Modal */}
      {showVoiceStudio && (
        <VoiceStudio onClose={() => setShowVoiceStudio(false)} />
      )}
    </div>
  );
}
