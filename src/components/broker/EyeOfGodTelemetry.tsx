import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Eye, ShieldCheck, Cpu, Globe, Lock, Activity, Terminal } from 'lucide-react';

export const EyeOfGodTelemetry: React.FC = () => {
  const [canvasHash, setCanvasHash] = useState<string>('GPU-CANVAS-9A8F3');
  const [ipAddress, setIpAddress] = useState<string>('102.89.34.112');
  const [logs, setLogs] = useState<Array<{ id: string; time: string; event: string; status: string }>>([
    { id: 'log-1', time: '12:44:02 UTC', event: 'Haversine Route Calculation LOS → ABV', status: 'TELEMETRY_LOGGED' },
    { id: 'log-2', time: '12:41:15 UTC', event: 'White-Label Proposal Generated (15D-001)', status: 'DISGUISE_ACTIVE' },
    { id: 'log-3', time: '12:35:50 UTC', event: 'Double-Entry Ledger Handshake (Providus 033)', status: 'ESCROW_SYNCED' },
  ]);

  useEffect(() => {
    // Generate lightweight canvas fingerprint hash dynamically
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.textBaseline = 'top';
        ctx.font = "14px 'Arial'";
        ctx.fillText('15DWingsEyeOfGod', 2, 2);
        const data = canvas.toDataURL();
        let hash = 0;
        for (let i = 0; i < data.length; i++) {
          hash = (hash << 5) - hash + data.charCodeAt(i);
          hash |= 0;
        }
        setCanvasHash(`GPU-CANVAS-${Math.abs(hash).toString(16).toUpperCase().substring(0, 6)}`);
      }
    } catch (e) {
      // fallback
    }
  }, []);

  return (
    <div className="p-6 md:p-8 rounded-[2rem] border border-white/10 glass-vip shadow-2xl relative overflow-hidden bg-gradient-to-br from-black/80 via-[#0a101b]/90 to-black/90 text-left">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-fbblue animate-pulse" />
            <span className="font-sync text-[9px] text-fbblue tracking-[0.25em] font-bold uppercase">
              MODULE 8 — EYE OF GOD TELEMETRY
            </span>
          </div>
          <h3 className="font-sync text-lg md:text-xl font-bold tracking-wider text-white uppercase">
            Anti-Poaching Telemetry Vault
          </h3>
          <p className="text-xs text-gray-400 font-light">
            Continuous hardware canvas fingerprinting & ghost quote telemetry tracking.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-full bg-fbblue/10 border border-fbblue/20 text-fbblue text-[9px] font-mono tracking-wider uppercase font-semibold flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-fbblue" /> Active Security Barrier
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-6">
        <div className="p-4 rounded-2xl bg-black/60 border border-white/10 space-y-1">
          <span className="text-[9px] text-gray-400 font-sync uppercase block flex items-center gap-1">
            <Cpu className="w-3.5 h-3.5 text-fbblue" /> HARDWARE CANVAS HASH
          </span>
          <span className="text-sm font-mono font-bold text-fbblue">{canvasHash}</span>
        </div>

        <div className="p-4 rounded-2xl bg-black/60 border border-white/10 space-y-1">
          <span className="text-[9px] text-gray-400 font-sync uppercase block flex items-center gap-1">
            <Globe className="w-3.5 h-3.5 text-emerald-400" /> CLIENT IP ADDRESS
          </span>
          <span className="text-sm font-mono font-bold text-white">{ipAddress}</span>
        </div>

        <div className="p-4 rounded-2xl bg-black/60 border border-white/10 space-y-1">
          <span className="text-[9px] text-gray-400 font-sync uppercase block flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> ANTI-POACHING STATUS
          </span>
          <span className="text-sm font-mono font-bold text-emerald-400">ENFORCED (100%)</span>
        </div>
      </div>

      {/* Terminal Telemetry Log */}
      <div className="p-4 rounded-2xl bg-black/90 border border-white/15 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-white/10 text-[10px] font-lexend text-gray-400">
          <span className="flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-fbblue" /> SYSTEM TELEMETRY AUDIT LOG
          </span>
          <span className="font-mono text-fbblue">LIVE FEED</span>
        </div>

        <div className="space-y-2 font-mono text-xs">
          {logs.map((log) => (
            <div key={log.id} className="flex justify-between items-center text-gray-300">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-500">[{log.time}]</span>
                <span className="text-xs">{log.event}</span>
              </div>
              <span className="text-[10px] text-emerald-400 font-bold">{log.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
