import re

with open('src/components/broker/PremiumBookFlightPanel.tsx', 'r') as f:
    content = f.read()

new_content = """import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink, ShieldCheck, Plane, Lock, Maximize2, RotateCw } from "lucide-react";

interface PremiumBookFlightPanelProps {
  onClose: () => void;
  onSuccess?: (requestId: string) => void;
  sessionVerified?: boolean;
  onLoginRequest?: () => void;
}

export const PremiumBookFlightPanel: React.FC<PremiumBookFlightPanelProps> = ({
  onClose
}) => {
  const [iframeKey, setIframeKey] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  const BOOKING_URL = "https://fly.15dwings.com.ng";

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isFullscreen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, isFullscreen]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={`fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm ${isFullscreen ? 'p-0' : 'p-4 sm:p-6 md:p-12'}`}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className={`w-full bg-white shadow-2xl overflow-hidden flex flex-col relative ${isFullscreen ? 'h-full rounded-none max-w-none' : 'max-w-6xl rounded-[2rem] h-[90vh]'}`}
        >
          {/* Header */}
          <div className="bg-slate-950 px-6 py-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
                <Plane className="w-4 h-4 text-purple-400" />
              </div>
              <div>
                <h2 className="text-white font-sync tracking-widest text-sm font-bold uppercase">
                  Secure Booking Gateway
                </h2>
                <p className="text-slate-400 text-[10px] font-mono mt-0.5">
                  ESTABLISHING DIRECT TUNNEL
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIframeKey(prev => prev + 1)}
                className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                title="Reload Engine"
              >
                <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                title="Toggle Fullscreen"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
              <div className="w-px h-6 bg-slate-800 mx-2" />
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Iframe Content */}
          <div className="flex-1 w-full relative bg-slate-50">
            {isLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-10">
                <div className="w-16 h-16 border-4 border-purple-100 border-t-purple-600 rounded-full animate-spin mb-4" />
                <p className="font-sync uppercase tracking-widest text-sm font-bold text-gray-900">
                  Loading Market Engine...
                </p>
              </div>
            )}
            
            <iframe
              key={iframeKey}
              ref={iframeRef}
              src={BOOKING_URL}
              title="15D Wings Booking Engine"
              className={`w-full h-full border-0 transition-opacity duration-300 ${isLoading ? "opacity-0" : "opacity-100"}`}
              allow="geolocation; microphone; camera; payment; clipboard-write; fullscreen"
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-downloads allow-top-navigation-by-user-activation"
              onLoad={() => setIsLoading(false)}
            />
          </div>

          {/* Footer */}
          <div className="bg-white px-6 py-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-600" />
              <span>End-to-End Encrypted Tunnel</span>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-purple-600" />
                <span>Verified Environment</span>
              </div>
              <span className="text-gray-300">•</span>
              <a
                href={BOOKING_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-600 hover:text-purple-800 font-semibold flex items-center gap-1 uppercase font-sync tracking-wider text-[10px]"
              >
                <span>Launch in New Tab</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
"""

with open('src/components/broker/PremiumBookFlightPanel.tsx', 'w') as f:
    f.write(new_content)
