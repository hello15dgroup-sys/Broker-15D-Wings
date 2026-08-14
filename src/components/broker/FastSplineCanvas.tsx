import React, { lazy, Suspense, useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const Spline = lazy(() => import('@splinetool/react-spline'));

interface FastSplineCanvasProps {
  scene: string;
  className?: string;
}

export const FastSplineCanvas: React.FC<FastSplineCanvasProps> = ({ scene, className = '' }) => {
  const [isMobileDevice, setIsMobileDevice] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobileDevice(window.innerWidth < 768 || 'ontouchstart' in window);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Mobile fast vector flight radar alternative
  if (false) {
    return (
      <div className={`relative w-full h-full overflow-hidden bg-gradient-to-b from-[#07090e] via-[#0b101c] to-[#07090e] ${className}`}>
        {/* Animated radar grid lines */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
        
        {/* Concentric radar circles */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[280px] rounded-full border border-fbblue/10 animate-ping opacity-20 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[180px] h-[180px] rounded-full border border-fbblue/20 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90px] h-[90px] rounded-full border border-fbblue/30 pointer-events-none" />

        {/* Pulsing Jet Waypoints */}
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[220px] h-[220px] pointer-events-none"
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-fbblue shadow-[0_0_12px_#1877f2]" />
          <div className="absolute bottom-4 right-2 w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]" />
        </motion.div>

        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center space-y-1.5 opacity-60">
            <span className="font-sync text-[8px] text-fbblue tracking-[0.3em] font-bold block uppercase">
              15D WINGS RADAR
            </span>
            <span className="text-[10px] text-gray-400 font-mono">
              HIGH-SPEED MOBILE INTERFACE READY
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className={`relative w-full h-full flex items-center justify-center bg-[#07090e] ${className}`}>
        <div className="text-center space-y-2 p-6 rounded-2xl bg-white/[0.02] border border-white/5">
          <span className="font-sync text-[9px] text-fbblue tracking-[0.3em] font-bold uppercase block">
            AERO ENGINE ACTIVE
          </span>
          <p className="text-xs text-gray-400 font-mono">Fallback graphics active</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full ${className}`}>
      {!isLoaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#07090e]/80 backdrop-blur-[10px] z-10 transition-opacity duration-500">
          <div className="w-8 h-8 rounded-full border-2 border-fbblue/20 border-t-fbblue animate-spin mb-3" />
          <span className="font-sync text-[8px] text-fbblue tracking-[0.3em] font-bold uppercase">
            LOADING 3D ENGINE...
          </span>
        </div>
      )}
      <Suspense fallback={null}>
        <Spline 
          scene={scene} 
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
        />
      </Suspense>
    </div>
  );
};
