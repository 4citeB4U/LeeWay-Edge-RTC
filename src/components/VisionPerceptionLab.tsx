/*
LEEWAY HEADER — DO NOT REMOVE

TAG: UI.VISION.PERCEPTION.LAB
REGION: 🧠 AI
PURPOSE: Unified visual intelligence interface - real-time optical perception across multiple agent feeds

LICENSE: PROPRIETARY
*/

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera,
  Maximize2,
  Activity,
  Circle,
  AlertCircle,
  Scan,
  BarChart3,
  Zap,
} from 'lucide-react';

// Import vision system orchestrator
import {
  visionMonitor,
  visionScanner,
  visionInspect,
  awarenessBuilder,
  visionGovernance,
  visionAdapter,
  visionDiagnostics,
  visionBudget,
  visionStorage,
} from '../vision';

import type {
  RuntimeMode,
  AwarenessPacket,
  VisionDiagnostics,
} from '../vision/types';

/**
 * VisionPerceptionLab — Unified visual intelligence interface
 *
 * Features:
 * - Real-time video capture and detection
 * - Multi-feed analysis from different agents/AI systems
 * - Live perception overlays with confidence scores
 * - Real-time brightness/motion/face detection
 * - On-demand scanning with deep region inspection
 * - Governance-filtered outputs
 * - Performance diagnostics & budget tracking
 * - Persistent storage of awareness packets
 *
 * Layout:
 * - HEADER: Component title and runtime status
 * - MAIN GRID: Multi-feed video streams with real-time overlays
 * - ACTION PANEL: Global scene analysis & controls
 * - DIAGNOSTICS: Performance metrics and storage info
 */

const VisionPerceptionLab: React.FC = () => {
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);

  // State: Controls
  const [runtimeMode, setRuntimeMode] = useState<RuntimeMode>('balanced');
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  // State: Readings
  const [currentPacket, setCurrentPacket] = useState<AwarenessPacket | null>(null);
  const [diagnostics, setDiagnostics] = useState<VisionDiagnostics | null>(null);
  const [storageInfo, setStorageInfo] = useState({ packets: 0, bytes: 0 });
  const [budgetStatus, setBudgetStatus] = useState({ safeToScan: true, load: 0 });

  // State: History
  const [detectionHistory, setDetectionHistory] = useState<AwarenessPacket[]>([]);
  const [historyScanCount, setHistoryScanCount] = useState(0);

  // Mock feeds representing different agent perspectives
  const [activeFeeds] = useState([
    {
      id: 1,
      label: 'OBSERVER.PRIMARY',
      agent: 'OBSERVER (AGT-009)',
      objects: ['PERSON', 'MOTION_ACTIVITY'],
      active: true,
    },
    {
      id: 2,
      label: 'SENTINEL.PERIMETER',
      agent: 'SENTINEL (AGT-004)',
      objects: ['ANOMALY_DETECT', 'THERMAL_SIG'],
      active: true,
    },
    {
      id: 3,
      label: 'VECTOR.SCENE',
      agent: 'VECTOR (AGT-003)',
      objects: ['SPATIAL_MAP', 'DEPTH_SENSE'],
      active: true,
    },
    {
      id: 4,
      label: 'REPAIR.DIAGNOSTIC',
      agent: 'REPAIR (AGT-006)',
      objects: ['OBJECT_CLASS', 'CONFIDENCE'],
      active: false,
    },
  ]);

  // Initialize video stream
  useEffect(() => {
    const initStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error('Failed to initialize video stream:', err);
      }
    };

    initStream();

    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

  // Monitor loop (continuous when enabled)
  useEffect(() => {
    if (!isMonitoring || !videoRef.current || !canvasRef.current) return;

    const startMonitor = async () => {
      try {
        await visionMonitor.initialize(videoRef.current!);
        visionMonitor.setRuntimeMode(runtimeMode);

        visionMonitor.start(state => {
          // Draw monitor state on overlay
          if (overlayCanvasRef.current) {
            const ctx = overlayCanvasRef.current.getContext('2d');
            if (ctx) {
              ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
              ctx.fillRect(
                0,
                0,
                overlayCanvasRef.current.width,
                overlayCanvasRef.current.height
              );

              // Brightness bar (top-left)
              ctx.fillStyle = `rgba(${Math.round(state.brightness * 255)}, 150, 100, 0.8)`;
              ctx.fillRect(10, 10, state.brightness * 80, 15);
              ctx.fillStyle = 'white';
              ctx.font = '12px monospace';
              ctx.fillText(
                `Brightness: ${(state.brightness * 100).toFixed(0)}%`,
                10,
                30
              );

              // Motion indicator (top-right)
              ctx.fillStyle =
                state.motion > 0.5
                  ? 'rgba(255, 100, 100, 0.8)'
                  : 'rgba(100, 200, 100, 0.8)';
              ctx.fillRect(220, 10, state.motion * 80, 15);
              ctx.fillStyle = 'white';
              ctx.fillText(
                `Motion: ${(state.motion * 100).toFixed(0)}%`,
                220,
                30
              );

              // Face presence (bottom-left)
              if (state.facePresent) {
                ctx.fillStyle = 'rgba(100, 255, 100, 0.8)';
                ctx.fillRect(10, overlayCanvasRef.current.height - 30, 200, 20);
                ctx.fillStyle = 'black';
                ctx.fillText('Face Detected', 15, overlayCanvasRef.current.height - 13);
              }
            }
          }

          // Update diagnostics
          setDiagnostics(visionDiagnostics.getDiagnostics(runtimeMode));
        });
      } catch (err) {
        console.error('Monitor initialization failed:', err);
        setIsMonitoring(false);
      }
    };

    startMonitor();

    return () => {
      visionMonitor.stop();
    };
  }, [isMonitoring, runtimeMode]);

  // Scan handler (on-demand)
  const handleScan = async () => {
    if (!videoRef.current || !canvasRef.current || !isMonitoring) return;

    setIsScanning(true);
    try {
      // Check budget
      const budgetCheck = visionBudget.check(runtimeMode);
      setBudgetStatus({
        safeToScan: budgetCheck.safeToScan,
        load: budgetCheck.loadEstimate,
      });

      if (!budgetCheck.safeToScan) {
        console.warn('Vision budget exceeded, downgrading mode');
        setRuntimeMode(budgetCheck.runtimeMode);
        return;
      }

      // Copy frame to canvas
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.drawImage(
          videoRef.current,
          0,
          0,
          canvasRef.current.width,
          canvasRef.current.height
        );

        // Run scanner
        const scanOutput = await visionScanner.scan(videoRef.current, runtimeMode);

        // Run inspector on detected regions
        const inspectOutput = await visionInspect.inspect(
          canvasRef.current,
          scanOutput,
          runtimeMode
        );

        // Get monitor state
        const monitorState = visionMonitor.getState();

        // Build awareness packet
        const packet = awarenessBuilder.buildPacket(
          monitorState,
          scanOutput,
          inspectOutput
        );

        // Apply governance
        const verdict = visionGovernance.evaluate(packet);

        // Adapt to agent outputs
        const agentOutput = visionAdapter.adapt(packet, verdict);

        // Store packet
        visionStorage.savePacket(packet);

        // Update UI
        setCurrentPacket(packet);
        setDetectionHistory(prev => [packet, ...prev.slice(0, 9)]);
        setHistoryScanCount(prev => prev + 1);

        // Update storage info
        const packetSize = visionStorage.getPacketSize();
        const allPackets = visionStorage.loadPackets();
        setStorageInfo({ packets: allPackets.length, bytes: packetSize });

        console.log('Vision scan complete:', agentOutput);
      }
    } catch (err) {
      console.error('Scan failed:', err);
    } finally {
      setIsScanning(false);
    }
  };

  // Load stored packets on mount
  useEffect(() => {
    const packets = visionStorage.loadPackets();
    const packetSize = visionStorage.getPacketSize();
    setStorageInfo({ packets: packets.length, bytes: packetSize });

    if (packets.length > 0) {
      setDetectionHistory(packets.slice(0, 10));
    }
  }, []);

  return (
    <div className="flex flex-col gap-8 p-10 bg-slate-950/60 backdrop-blur-3xl rounded-[48px] border border-white/10 shadow-3xl">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-6">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tighter italic uppercase">
            Vision_Perception_Lab
          </h2>
          <p className="text-[10px] font-black text-amber-400 uppercase tracking-[0.4em] mt-2">
            OBSERVER (AGT-009) Multi-Agent Optical Analysis
          </p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <span
            className={cn(
              'px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border transition-all',
              isMonitoring
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
            )}
          >
            <Activity className="w-3 h-3 animate-pulse" />
            {isMonitoring ? 'MONITORING_ACTIVE' : 'STANDBY'}
          </span>
          <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
            <Zap className="w-3 h-3" /> {runtimeMode.toUpperCase()}
          </span>
        </div>
      </div>

      {/* FEED GRID - Real video + Mock agent feeds */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Primary Video Feed */}
        <motion.div
          className="lg:col-span-2 md:col-span-2 relative aspect-video rounded-[32px] bg-slate-900 overflow-hidden border border-white/5 group"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover"
          />
          <canvas
            ref={overlayCanvasRef}
            width={640}
            height={480}
            className="absolute inset-0 w-full h-full"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 z-20" />

          {/* Label */}
          <div className="absolute top-6 left-6 flex items-center gap-2 px-4 py-2 bg-black/60 backdrop-blur-md rounded-2xl border border-white/10 z-30">
            <Circle className="w-2 h-2 fill-emerald-500 text-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black text-white uppercase tracking-widest">
              LIVE_OPTICAL
            </span>
          </div>

          {/* Controls overlay */}
          <div className="absolute bottom-6 left-6 right-6 flex justify-between items-center z-30">
            <div className="text-[9px] font-black text-slate-400 uppercase tracking-tighter flex gap-4">
              <span>Res: 640x480</span>
              <span>FPS: 30</span>
            </div>
            <motion.button
              onClick={handleScan}
              disabled={!isMonitoring || isScanning}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-600 rounded-xl text-[9px] font-black uppercase text-slate-950 transition-all"
            >
              {isScanning ? 'Scanning...' : 'Scan'}
            </motion.button>
          </div>
        </motion.div>

        {/* Agent Feed Cards */}
        {activeFeeds.slice(0, 3).map((feed, idx) => (
          <motion.div
            key={feed.id}
            className="relative aspect-video rounded-[32px] bg-slate-900 overflow-hidden border border-white/5 group"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.1 }}
          >
            {/* Scanner line animation */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/10 to-transparent h-1/2 w-full animate-scan z-10 pointer-events-none" />

            {/* Feed Content */}
            <div className="absolute inset-0 flex items-center justify-center opacity-30">
              <Camera className="w-12 h-12 text-slate-700" />
            </div>

            {/* Perception Overlays */}
            {feed.active && (
              <div className="absolute inset-0 p-6 z-20">
                <div className="absolute top-1/3 left-1/4 w-24 h-32 border-2 border-cyan-400/50 rounded-lg flex flex-col justify-start items-start p-1.5">
                  <span className="bg-cyan-500 text-slate-950 text-[7px] font-black px-1 uppercase">
                    {feed.objects[0]} // 94%
                  </span>
                  <div className="w-3 h-3 border-l-2 border-t-2 border-cyan-400 mt-1" />
                </div>
                <div className="absolute bottom-1/3 right-1/4 w-20 h-20 border-2 border-amber-400/50 rounded-lg flex flex-col justify-end items-end p-1.5">
                  <div className="w-3 h-3 border-r-2 border-b-2 border-amber-400" />
                  <span className="bg-amber-500 text-slate-950 text-[7px] font-black px-1 uppercase mt-1">
                    {feed.objects[1]} // 88%
                  </span>
                </div>
              </div>
            )}

            {/* UI Layer */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 z-30" />

            <div className="absolute top-3 left-3 flex items-center gap-2 px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-xl border border-white/10 z-30">
              <Circle
                className={`w-2 h-2 ${
                  feed.active
                    ? 'fill-emerald-500 text-emerald-500 animate-pulse'
                    : 'text-slate-600'
                }`}
              />
              <span className="text-[8px] font-black text-white uppercase tracking-widest">
                {feed.label}
              </span>
            </div>

            <div className="absolute top-3 right-3 z-30">
              <button className="p-2 bg-black/60 backdrop-blur-md rounded-xl border border-white/10 text-white hover:bg-cyan-500 hover:text-slate-950 transition-all">
                <Maximize2 className="w-3 h-3" />
              </button>
            </div>

            <div className="absolute bottom-3 left-3 right-3 text-[8px] font-black text-slate-400 uppercase tracking-tighter z-30">
              <div>{feed.agent}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ACTION PANEL */}
      <div className="mt-4 p-6 bg-black/40 rounded-[32px] border border-white/5 flex flex-col md:flex-row gap-6 items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <div className="p-3 bg-cyan-500 rounded-2xl shadow-cyan-500/20">
            <Scan className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <h4 className="text-sm font-black text-white uppercase tracking-widest">
              Global Scene Analysis
            </h4>
            <p className="text-[10px] text-slate-500 mt-0.5 uppercase">
              4 Agent Feeds • {historyScanCount} Scans • {storageInfo.packets} Packets Stored
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-3 flex-wrap">
          <motion.button
            onClick={() => setIsMonitoring(!isMonitoring)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={cn(
              'px-6 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all border',
              isMonitoring
                ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-300'
            )}
          >
            {isMonitoring ? '⏸ Stop' : '▶ Monitor'}
          </motion.button>

          <motion.button
            onClick={handleScan}
            disabled={!isMonitoring || isScanning}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-600 rounded-2xl text-[9px] font-black uppercase text-slate-950 transition-all shadow-lg shadow-cyan-500/20"
          >
            {isScanning ? '🔄 Scanning' : '📸 Analyze'}
          </motion.button>

          {/* Runtime Mode Selector */}
          <div className="flex gap-2">
            {(['ultra-light', 'balanced', 'full'] as RuntimeMode[]).map(mode => (
              <motion.button
                key={mode}
                onClick={() => setRuntimeMode(mode)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  'px-3 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all border',
                  runtimeMode === mode
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                    : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-300'
                )}
              >
                {mode === 'ultra-light' && '⚡'}
                {mode === 'balanced' && '⚖️'}
                {mode === 'full' && '🔥'}
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* CURRENT PACKET & DIAGNOSTICS */}
      {(currentPacket || diagnostics) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Current Packet */}
          <AnimatePresence>
            {currentPacket && (
              <motion.div
                className="p-6 bg-black/40 rounded-[24px] border border-white/5"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
              >
                <h4 className="text-sm font-black text-white uppercase tracking-widest mb-3">
                  Current Packet
                </h4>
                <div className="space-y-2 text-[9px] text-slate-300">
                  <p>
                    <span className="text-slate-500">ID:</span> {currentPacket.id.substring(0, 15)}...
                  </p>
                  <p>
                    <span className="text-slate-500">Confidence:</span>{' '}
                    {(currentPacket.confidence * 100).toFixed(1)}%
                  </p>
                  <p>
                    <span className="text-slate-500">Facts:</span> {currentPacket.facts.length}
                  </p>
                  <p>
                    <span className="text-slate-500">Mode:</span> {currentPacket.runtimeMode}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Diagnostics */}
          <AnimatePresence>
            {diagnostics && (
              <motion.div
                className="p-6 bg-black/40 rounded-[24px] border border-white/5"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
              >
                <h4 className="text-sm font-black text-white uppercase tracking-widest mb-3 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Diagnostics
                </h4>
                <div className="space-y-2 text-[9px] text-slate-300">
                  <p>
                    <span className="text-slate-500">Monitor:</span>{' '}
                    {diagnostics.monitorActive ? '✅ Active' : '❌ Idle'}
                  </p>
                  <p>
                    <span className="text-slate-500">Latency:</span>{' '}
                    {diagnostics.monitorLatency?.toFixed(1) || 0}ms
                  </p>
                  <p>
                    <span className="text-slate-500">CPU Est:</span>{' '}
                    {(diagnostics.cpuEstimate * 100).toFixed(2)}%
                  </p>
                  <p>
                    <span className="text-slate-500">Budget:</span>{' '}
                    <span
                      className={
                        budgetStatus.load > 0.8
                          ? 'text-red-400'
                          : budgetStatus.load > 0.5
                            ? 'text-yellow-400'
                            : 'text-emerald-400'
                      }
                    >
                      {(budgetStatus.load * 100).toFixed(0)}%
                    </span>
                  </p>
                  <p>
                    <span className="text-slate-500">Storage:</span> {storageInfo.packets} packets (
                    {(storageInfo.bytes / 1024).toFixed(1)} KB)
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Hidden canvas for processing */}
      <canvas ref={canvasRef} width={640} height={480} style={{ display: 'none' }} />

      {/* Animation styles */}
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
};

// Helper: className concatenation
function cn(...classes: (string | undefined | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export default VisionPerceptionLab;
