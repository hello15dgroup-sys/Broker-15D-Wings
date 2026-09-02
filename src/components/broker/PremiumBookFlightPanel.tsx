import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  RotateCw,
  Maximize2,
  Minimize2,
  ExternalLink,
  ShieldCheck,
  Plane,
  Lock,
  Headphones,
  AlertCircle
} from "lucide-react";

interface PremiumBookFlightPanelProps {
  onClose: () => void;
  onSuccess?: (requestId: string) => void;
  sessionVerified?: boolean;
  onLoginRequest?: () => void;
}

export const PremiumBookFlightPanel: React.FC<PremiumBookFlightPanelProps> = ({
  onClose,
  onSuccess,
}) => {
  const [iframeKey, setIframeKey] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showSlowLoadWarning, setShowSlowLoadWarning] = useState<boolean>(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const BOOKING_URL = "https://fly.15dwings.com.ng";

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Set timeout to show helpful message if network is slow
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (isLoading) {
      timeout = setTimeout(() => {
        setShowSlowLoadWarning(true);
      }, 5000);
    } else {
      setShowSlowLoadWarning(false);
    }
    return () => clearTimeout(timeout);
  }, [isLoading, iframeKey]);

  // Listen for potential postMessage events from fly.15dwings.com.ng
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        if (
          typeof event.origin === "string" &&
          (event.origin.includes("15dwings.com.ng") || event.origin.includes("fly."))
        ) {
          const data = event.data;
          if (data && (data.type === "BOOKING_COMPLETE" || data.status === "confirmed" || data.requestId)) {
            const reqId = data.requestId || data.id || `15D-${Math.floor(10000 + Math.random() * 90000)}`;
            onSuccess?.(reqId);
          }
        }
      } catch (err) {
        console.warn("Error parsing iframe message:", err);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onSuccess]);

  const handleRefresh = () => {
    setIsLoading(true);
    setShowSlowLoadWarning(false);
    setIframeKey((prev) => prev + 1);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] bg-slate-950/60 backdrop-blur-md flex flex-col items-center justify-center p-2 sm:p-4 md:p-6 overflow-hidden"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <motion.div
          initial={{ scale: 0.96, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.96, opacity: 0, y: 15 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className={`w-full bg-white rounded-2xl md:rounded-3xl border border-purple-200 shadow-2xl flex flex-col overflow-hidden transition-all duration-300 relative ${
            isFullscreen
              ? "fixed inset-2 sm:inset-4 h-[calc(100vh-1rem)] sm:h-[calc(100vh-2rem)] max-w-none z-[210]"
              : "max-w-7xl h-[92vh] max-h-[1050px]"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Navigation & Status Bar */}
          <div className="bg-white px-4 sm:px-6 py-3.5 border-b border-purple-100 flex flex-wrap items-center justify-between gap-3 shrink-0">
            {/* Left: Brand & Connection Status */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-600 flex items-center justify-center text-white shadow-md shadow-purple-500/20">
                <Plane className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-sync text-sm sm:text-base font-bold uppercase tracking-wider text-gray-900">
                    15D WINGS FLIGHT BOOKING
                  </h2>
                  <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-sync font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    LIVE PORTAL
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500 font-mono">
                  <span>Direct link:</span>
                  <a
                    href={BOOKING_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-700 hover:text-purple-900 font-bold hover:underline flex items-center gap-1"
                  >
                    <span>fly.15dwings.com.ng</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>

            {/* Right: Actions (New Tab, Reload, Fullscreen, Close) */}
            <div className="flex items-center gap-2 ml-auto">
              {/* Direct Open in New Window */}
              <a
                href={BOOKING_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden md:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-sync uppercase font-bold tracking-wider transition-all shadow-sm active:scale-95 cursor-pointer"
                title="Open in external browser window"
              >
                <span>OPEN EXTERNAL</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              {/* Refresh Frame Button */}
              <button
                onClick={handleRefresh}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-purple-50 text-gray-700 border border-purple-200 text-xs font-sync uppercase font-semibold transition-all shadow-sm active:scale-95 cursor-pointer"
                title="Reload Booking Engine"
              >
                <RotateCw
                  className={`w-3.5 h-3.5 ${
                    isLoading ? "animate-spin text-purple-600" : "text-gray-600"
                  }`}
                />
                <span className="hidden sm:inline">REFRESH</span>
              </button>

              {/* Fullscreen Toggle */}
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-purple-50 text-gray-700 border border-purple-200 text-xs font-sync uppercase font-semibold transition-all shadow-sm active:scale-95 cursor-pointer"
                title={isFullscreen ? "Exit Fullscreen" : "Maximize"}
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

              {/* Close Button */}
              <button
                onClick={onClose}
                className="p-2 sm:px-3 sm:py-2 rounded-xl bg-gray-100 hover:bg-red-50 hover:text-red-700 text-gray-700 transition-all font-bold cursor-pointer active:scale-95 flex items-center gap-1 text-xs"
                title="Close"
              >
                <X className="w-4 h-4" />
                <span className="hidden sm:inline font-sync uppercase">CLOSE</span>
              </button>
            </div>
          </div>

          {/* Iframe Viewport Container */}
          <div className="flex-1 w-full relative bg-slate-50 overflow-hidden">
            {/* Loading Indicator */}
            {isLoading && (
              <div className="absolute inset-0 z-10 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 rounded-3xl bg-purple-100 border border-purple-200 flex items-center justify-center mb-4 text-purple-600 animate-pulse">
                  <Plane className="w-8 h-8 animate-bounce" />
                </div>
                <h3 className="text-gray-900 font-sync uppercase text-sm sm:text-base font-bold tracking-wider mb-1">
                  Connecting to 15D Wings Booking Engine
                </h3>
                <p className="text-gray-500 font-sans text-xs max-w-sm mb-4">
                  Establishing direct encrypted tunnel to <span className="font-mono text-purple-700 font-semibold">fly.15dwings.com.ng</span>...
                </p>

                <div className="w-48 h-1.5 bg-purple-100 rounded-full overflow-hidden">
                  <div className="w-full h-full bg-purple-600 rounded-full animate-pulse" />
                </div>

                {showSlowLoadWarning && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 max-w-md text-xs flex flex-col items-center gap-3"
                  >
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Loading is taking slightly longer than usual.</span>
                    </div>
                    <a
                      href={BOOKING_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold font-sync uppercase tracking-wider text-[11px] flex items-center gap-2 shadow-sm"
                    >
                      <span>Open fly.15dwings.com.ng in New Window</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </motion.div>
                )}
              </div>
            )}

            {/* Live Iframe */}
            <iframe
              key={iframeKey}
              ref={iframeRef}
              src={BOOKING_URL}
              title="15D Wings Charter Booking Engine"
              className={`w-full h-full border-0 transition-opacity duration-300 ${
                isLoading ? "opacity-0" : "opacity-100"
              }`}
              allow="geolocation; microphone; camera; payment; clipboard-write; fullscreen"
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-downloads allow-top-navigation-by-user-activation"
              loading="eager"
              onLoad={() => {
                setIsLoading(false);
                setShowSlowLoadWarning(false);
              }}
            />
          </div>

          {/* Bottom Security & Information Footer */}
          <div className="bg-white px-4 sm:px-6 py-2.5 border-t border-purple-100 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-600 shrink-0">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 font-medium text-gray-700">
                <Lock className="w-3.5 h-3.5 text-emerald-600" />
                <span>SSL Encrypted Connection</span>
              </span>
              <span className="hidden sm:flex items-center gap-1.5 font-medium text-gray-700">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                <span>Synchronized with 15D Wings Operations</span>
              </span>
            </div>

            <div className="flex items-center gap-3">
              <a
                href="https://wa.me/2348100000000?text=Hello%2015D%20Wings%20Concierge,%20I%20need%20assistance%20with%20flight%20booking"
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-700 hover:text-purple-900 font-semibold flex items-center gap-1 text-[11px]"
              >
                <Headphones className="w-3.5 h-3.5" />
                <span>Concierge Desk</span>
              </a>
              <span className="text-gray-300">•</span>
              <button
                onClick={() => window.open(BOOKING_URL, "_blank")}
                className="text-purple-700 hover:text-purple-900 font-semibold underline text-[11px] cursor-pointer"
              >
                Open in Full Window
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
