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
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showInternalLedger, setShowInternalLedger] = useState(false);

  const vipUrl = "https://vip.15dwings.com.ng";

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
              Direct high-security settlement and escrow protocol powered by <span className="font-mono text-purple-700 font-bold">vip.15dwings.com.ng</span>
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2 w-full md:w-auto">
            {/* Direct Open External Link */}
            <a
              href={vipUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-sync uppercase font-bold tracking-wider transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <span>OPEN VIP.15DWINGS.COM.NG</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>

            {/* Reload Frame Button */}
            <button
              onClick={handleRefresh}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white hover:bg-purple-50 text-gray-800 border border-purple-200 text-xs font-sync uppercase font-semibold transition-all shadow-sm active:scale-95 cursor-pointer"
              title="Reload Frame"
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
            <span className="font-mono text-gray-500 text-[11px]">GATEWAY URL:</span>
            <span className="font-mono text-purple-900 font-bold text-xs">{vipUrl}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowInternalLedger(!showInternalLedger)}
              className="text-xs text-purple-700 hover:text-purple-900 font-semibold underline underline-offset-2 cursor-pointer transition-colors"
            >
              {showInternalLedger ? "← Return to VIP Iframe" : "View System Settlement Ledger →"}
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
        /* Primary VIP Iframe Card */
        <div className="bg-white rounded-[2rem] border border-purple-200/90 shadow-2xl overflow-hidden relative">
          {/* Loading Indicator */}
          {isLoading && (
            <div className="absolute inset-0 z-20 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center gap-4 min-h-[500px]">
              <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
              <div className="text-center space-y-1">
                <p className="font-sync text-xs font-bold text-gray-900 tracking-wider uppercase">
                  CONNECTING TO VIP.15DWINGS.COM.NG ESCROW GATEWAY
                </p>
                <p className="text-xs text-gray-500">
                  Establishing encrypted handshake with financial settlement servers...
                </p>
              </div>
            </div>
          )}

          {/* Iframe Viewport */}
          <iframe
            key={iframeKey}
            src={vipUrl}
            title="15D VIP Payment & Escrow Portal"
            className="w-full h-[780px] md:h-[880px] border-none bg-white block"
            allow="payment; fullscreen; camera; clipboard-write"
            onLoad={() => setIsLoading(false)}
          />

          {/* Bottom Security Assurance Bar */}
          <div className="p-4 bg-purple-50/80 border-t border-purple-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-gray-600">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-purple-600" />
              <span>Funds held securely in Tier-1 Bank & Solana USDC Escrow protocols until wheels up.</span>
            </div>
            <a
              href={vipUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-sync uppercase font-bold text-purple-700 hover:text-purple-900 flex items-center gap-1"
            >
              <span>Direct Link</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
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
                    VIP.15DWINGS.COM.NG
                  </span>
                  <span className="text-xs text-gray-400">|</span>
                  <span className="text-xs text-gray-700 font-medium">Full Escrow Terminal</span>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={vipUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl transition-all"
                    title="Open in new window"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => setIsFullscreen(false)}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-sync uppercase font-bold transition-all shadow-sm"
                  >
                    CLOSE FULLSCREEN
                  </button>
                </div>
              </div>

              {/* Fullscreen Iframe */}
              <iframe
                src={vipUrl}
                title="15D VIP Payment & Escrow Portal (Fullscreen)"
                className="w-full flex-1 border-none bg-white"
                allow="payment; fullscreen; camera; clipboard-write"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
