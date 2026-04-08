/*
LEEWAY HEADER — DO NOT REMOVE

TAG: UI.CALL.MODE.INTERFACE
REGION: 🔵 RUNTIME
PURPOSE: Real-time call session UI - start/stop, phase indicator, mute toggle, interrupt indicator
LICENSE: PROPRIETARY
*/

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone, PhoneOff, Mic, MicOff, Volume2, AlertCircle, Circle,
} from 'lucide-react';
import { callModeController, type CallModeSessionState } from '../runtime/CallMode';

const PHASE_LABELS: Record<CallModeSessionState['phase'], string> = {
  idle: 'Ready',
  listening: 'Listening',
  processing: 'Processing',
  speaking: 'Speaking',
  error: 'Error',
};

const PHASE_COLORS: Record<CallModeSessionState['phase'], string> = {
  idle: 'from-slate-500 to-slate-600',
  listening: 'from-cyan-500 to-blue-500',
  processing: 'from-purple-500 to-indigo-500',
  speaking: 'from-emerald-500 to-green-500',
  error: 'from-red-500 to-orange-500',
};

export function CallModeUI() {
  const [state, setState] = useState<CallModeSessionState>(callModeController.getState());
  const [isMuted, setIsMuted] = useState(false);
  const [showTranscript, setShowTranscript] = useState(true);

  useEffect(() => {
    const unsubscribe = callModeController.subscribe(setState);
    return unsubscribe;
  }, []);

  const handleStartCall = () => {
    callModeController.init();
    callModeController.startSession();
  };

  const handleEndCall = () => {
    callModeController.stopSession();
  };

  const handleToggleMute = () => {
    if (isMuted) {
      callModeController.resumeListening();
    } else {
      callModeController.pauseListening();
    }
    setIsMuted(!isMuted);
  };

  const handleInterrupt = () => {
    callModeController.interrupt();
  };

  return (
    <div className="flex flex-col gap-6 p-8 bg-slate-950/60 backdrop-blur-3xl rounded-[40px] border border-white/10 shadow-3xl">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Call Mode</h2>
          <p className="text-[10px] text-slate-500 uppercase mt-1">Real-Time Voice Session Orchestration</p>
        </div>

        {/* Phase Indicator */}
        <motion.div
          className={`px-6 py-3 rounded-2xl bg-gradient-to-r ${
            PHASE_COLORS[state.phase]
          } flex items-center gap-3 shadow-lg`}
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
        >
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="w-3 h-3 rounded-full bg-white"
          />
          <span className="text-sm font-black text-white uppercase tracking-wider">
            {PHASE_LABELS[state.phase]}
          </span>
        </motion.div>
      </div>

      {/* Main Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Start/Stop Call */}
        <motion.button
          onClick={state.active ? handleEndCall : handleStartCall}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`h-24 rounded-2xl font-black uppercase text-sm tracking-wider transition-all flex items-center justify-center gap-3 ${
            state.active
              ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20'
              : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
          }`}
        >
          {state.active ? <PhoneOff className="w-6 h-6" /> : <Phone className="w-6 h-6" />}
          {state.active ? 'End Call' : 'Start Call'}
        </motion.button>

        {/* Mute Toggle */}
        <motion.button
          onClick={handleToggleMute}
          disabled={!state.active}
          whileHover={{ scale: state.active ? 1.02 : 1 }}
          whileTap={{ scale: state.active ? 0.98 : 1 }}
          className={`h-24 rounded-2xl font-black uppercase text-sm tracking-wider transition-all flex items-center justify-center gap-3 ${
            isMuted
              ? 'bg-orange-500 hover:bg-orange-600 text-white'
              : 'bg-cyan-500 hover:bg-cyan-600 text-white'
          } ${!state.active ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          {isMuted ? 'Muted' : 'Unmuted'}
        </motion.button>

        {/* Interrupt Button */}
        <motion.button
          onClick={handleInterrupt}
          disabled={!state.active || state.phase !== 'speaking'}
          whileHover={{ scale: state.active && state.phase === 'speaking' ? 1.02 : 1 }}
          whileTap={{ scale: state.active && state.phase === 'speaking' ? 0.98 : 1 }}
          className={`h-24 rounded-2xl font-black uppercase text-sm tracking-wider transition-all flex items-center justify-center gap-3 ${
            state.active && state.phase === 'speaking'
              ? 'bg-purple-500 hover:bg-purple-600 text-white'
              : 'bg-slate-700 text-slate-400 cursor-not-allowed'
          }`}
        >
          <AlertCircle className="w-6 h-6" />
          Interrupt
        </motion.button>
      </div>

      {/* Status Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Mic Status */}
        <div className="p-4 bg-black/40 border border-white/5 rounded-2xl flex items-center gap-4">
          <div className="flex-1">
            <p className="text-[10px] font-black text-slate-500 uppercase mb-2">Microphone</p>
            <div className="flex items-center gap-2">
              <Circle
                className={`w-3 h-3 ${
                  state.micOpen ? 'fill-emerald-500 text-emerald-500' : 'text-slate-600'
                }`}
              />
              <span className="text-sm text-white font-bold">
                {state.micOpen ? 'Open' : 'Closed'}
              </span>
            </div>
          </div>
        </div>

        {/* Voice Config */}
        <div className="p-4 bg-black/40 border border-white/5 rounded-2xl">
          <p className="text-[10px] font-black text-slate-500 uppercase mb-2">Voice</p>
          <p className="text-sm text-cyan-300 font-bold truncate">
            {state.currentVoiceName || 'System Default'}
          </p>
        </div>
      </div>

      {/* Transcript Display */}
      <AnimatePresence>
        {showTranscript && state.transcript && (
          <motion.div
            className="p-4 bg-slate-900/60 border border-cyan-500/20 rounded-2xl"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="text-[10px] font-black text-slate-500 uppercase mb-2">Transcript</p>
                <p className="text-sm text-cyan-100">{state.transcript}</p>
              </div>
              <button
                onClick={() => setShowTranscript(false)}
                className="text-slate-500 hover:text-slate-300"
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Display */}
      <AnimatePresence>
        {state.lastError && (
          <motion.div
            className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-black text-red-400 uppercase mb-1">Error</p>
                <p className="text-sm text-red-200">{state.lastError}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info Panel */}
      <div className="p-4 bg-slate-900/30 rounded-2xl border border-white/5">
        <div className="text-[10px] text-slate-500 space-y-1 uppercase font-black">
          <p>
            📍 Status:{' '}
            <span className="text-slate-300">
              {state.active ? 'Session Active' : 'Idle'}
            </span>
          </p>
          <p>
            🎤 Processing:{' '}
            <span className="text-slate-300">
              {state.isProcessing ? 'Yes' : 'No'}
            </span>
          </p>
          {state.interrupted && (
            <p className="text-orange-400">⚡ User interrupted agent speech</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default CallModeUI;
