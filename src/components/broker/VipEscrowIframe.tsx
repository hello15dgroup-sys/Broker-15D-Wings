import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Lock, ExternalLink, RotateCw, Maximize2, Minimize2, ArrowUpRight, CheckCircle2, CreditCard, ChevronRight } from 'lucide-react';
import { SystemizedCheckoutEngine } from './SystemizedCheckoutEngine';

interface VipEscrowIframeProps {
  amountUsd?: number;
  hoursToDeparture?: number;
}

export const VipEscrowIframe: React.FC<VipEscrowIframeProps> = ({
  amountUsd = 18687,
  hoursToDeparture = 36,
}) => {
  const [iframeKey, setIframeKey] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showInternalLedger, setShowInternalLedger] = useState(true);

  const portalUrl = typeof window !== 'undefined' ? window.location.origin : '';

  const handleRefresh = () => {
    setIsLoading(true);
    setIframeKey((prev) => prev + 1);
  };

  return (
    <div className="space-y-6">
      {/* Top Controls & Security Header */}
      <div className="bg-white/95 border border-purple-200/90 rounded-[2rem] p-6 shadow-xl backdrop-blur-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-purple-100">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-purple-100 text-purple-700">
                <CreditCard className="w-4 h-4" />
              </span>
              <span className="font-sync uppercase text-[11px] text-purple-700 font-bold tracking-[0.25em]">
                ESCROW GATEWAY
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-sync font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Lock className="w-3 h-3 text-emerald-600" /> SECURE SSL
              </span>
            </div>
            <h3 className="font-sync text-lg md:text-xl font-bold uppercase text-gray-950 tracking-wider">
              15D VIP PAYMENT & ESCROW PORTAL
            </h3>
            <p className="text-xs text-gray-600 font-medium font-sans">
              Direct high-security settlement and escrow protocol powered by <span className="font-mono text-purple-700 font-bold">15D Secure Vault</span>
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2 w-full md:w-auto">
            {/* Reload Frame Button */}
            <button
              onClick={handleRefresh}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white hover:bg-purple-50 text-gray-800 border border-purple-200 text-xs font-sync uppercase font-semibold transition-all shadow-sm active:scale-95 cursor-pointer"
              title="Reload Portal"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-purple-600' : 'text-gray-700'}`} />
              <span className="hidden sm:inline">REFRESH</span>
            </button>

            {/* Toggle Fullscreen Modal */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white hover:bg-purple-50 text-gray-800 border border-purple-200 text-xs font-sync uppercase font-semibold transition-all shadow-sm active:scale-95 cursor-pointer"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5 text-purple-600" />
                  <span className="hidden sm:inline">EXIT FULL</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5 text-purple-600" />
                  <span className="hidden sm:inline">EXPAND</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Live URL Pill & Status Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 text-xs text-gray-700">
          <div className="flex items-center gap-2 bg-purple-50/70 border border-purple-200/70 px-3.5 py-2 rounded-xl">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-mono text-gray-500 text-[11px]">SECURE GATEWAY:</span>
            <span className="font-mono text-purple-900 font-bold text-xs">{portalUrl}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowInternalLedger(!showInternalLedger)}
              className="text-xs text-purple-700 hover:text-purple-900 font-semibold underline underline-offset-2 cursor-pointer transition-colors"
            >
              {showInternalLedger ? "Switch to Embedded View" : "View System Settlement Ledger →"}
            </button>
          </div>
        </div>
      </div>

      {/* Internal Ledger Alternative (if toggled) */}
      {showInternalLedger ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
          <SystemizedCheckoutEngine
            amountUsd={amountUsd}
            hoursToDeparture={hoursToDeparture}
          />
        </motion.div>
      ) : (
        /* Primary VIP Portal Card */
        <div className="bg-white rounded-[2rem] border border-purple-200/90 shadow-2xl overflow-hidden relative">
          <SystemizedCheckoutEngine
            amountUsd={amountUsd}
            hoursToDeparture={hoursToDeparture}
          />
        </div>
      )}

      {/* Fullscreen Modal View (if expanded) */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[500] bg-gray-950/80 backdrop-blur-md flex flex-col p-2 md:p-6"
          >
            <div className="bg-white rounded-3xl w-full h-full flex flex-col overflow-hidden shadow-2xl border border-purple-200">
              {/* Modal Bar */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-purple-100 bg-white">
                <div className="flex items-center gap-3">
                  <span className="font-sync uppercase text-xs font-bold text-purple-700 tracking-wider">
                    15D SECURE VAULT
                  </span>
                  <span className="text-xs text-gray-400">|</span>
                  <span className="text-xs text-gray-700 font-medium">Full Escrow Terminal</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsFullscreen(false)}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-sync uppercase font-bold transition-all shadow-sm"
                  >
                    CLOSE FULLSCREEN
                  </button>
                </div>
              </div>

              {/* Fullscreen Content */}
              <div className="flex-1 overflow-y-auto p-6 bg-purple-50/40">
                <SystemizedCheckoutEngine
                  amountUsd={amountUsd}
                  hoursToDeparture={hoursToDeparture}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
