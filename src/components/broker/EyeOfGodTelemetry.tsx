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
    <div className="p-6 md:p-8 rounded-[2rem] border border-purple-200 shadow-xl relative overflow-hidden bg-white text-left">
      <div className="absolute top-0 right-0 w-64 h-64 bg-purple-100/50 blur-3xl pointer-events-none rounded-full" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-purple-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-600 animate-pulse" />
            <span className="font-sync text-[10px] text-purple-700 tracking-[0.25em] font-bold uppercase">
              FLIGHT LOGS & TELEMETRY AUDIT
            </span>
          </div>
          <h3 className="font-sync text-lg md:text-xl font-bold tracking-wider text-gray-950 uppercase">
            Security & Mission Telemetry Vault
          </h3>
          <p className="text-xs text-gray-600 font-medium">
            Real-time flight operational telemetry, encrypted session handshake & verification audit logs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-800 text-[10px] font-sync tracking-wider uppercase font-bold flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-emerald-600" /> Active Security Barrier
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-6">
        <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200 space-y-1.5 shadow-sm">
          <span className="text-[10px] text-gray-700 font-sync uppercase font-bold block flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-purple-600" /> HARDWARE CANVAS HASH
          </span>
          <span className="text-sm font-mono font-bold text-purple-800">{canvasHash}</span>
        </div>

        <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200 space-y-1.5 shadow-sm">
          <span className="text-[10px] text-gray-700 font-sync uppercase font-bold block flex items-center gap-1.5">
            <Globe className="w-4 h-4 text-emerald-600" /> CLIENT IP ADDRESS
          </span>
          <span className="text-sm font-mono font-bold text-gray-950">{ipAddress}</span>
        </div>

        <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200 space-y-1.5 shadow-sm">
          <span className="text-[10px] text-gray-700 font-sync uppercase font-bold block flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" /> ANTI-POACHING STATUS
          </span>
          <span className="text-sm font-mono font-bold text-emerald-700">ENFORCED (100%)</span>
        </div>
      </div>

      {/* Terminal Telemetry Log */}
      <div className="p-5 rounded-2xl bg-white border border-purple-200 space-y-3 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-purple-100 text-[11px] font-sync text-gray-700">
          <span className="flex items-center gap-2 font-bold uppercase text-purple-900 tracking-wider">
            <Terminal className="w-4 h-4 text-purple-600" /> SYSTEM FLIGHT TELEMETRY AUDIT LOG
          </span>
          <span className="font-mono text-purple-700 font-bold bg-purple-100 px-2 py-0.5 rounded-full text-[10px]">LIVE FEED</span>
        </div>

        <div className="space-y-2 font-mono text-xs divide-y divide-purple-50">
          {logs.map((log) => (
            <div key={log.id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 pt-2 text-gray-800">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                  {log.time}
                </span>
                <span className="text-xs font-semibold text-gray-900">{log.event}</span>
              </div>
              <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 font-bold px-2.5 py-0.5 rounded-full self-start sm:self-auto">
                {log.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
