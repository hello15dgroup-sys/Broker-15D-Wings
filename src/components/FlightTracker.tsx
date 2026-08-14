import React, { useState, useEffect, useRef } from "react";
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Compass, 
  Wind, 
  Clock, 
  Gauge, 
  Plane, 
  Sliders, 
  Activity, 
  MapPin, 
  AlertCircle
} from "lucide-react";

// Known airport coordinates for Nigeria
const AIRPORT_COORDS: Record<string, { name: string; lat: number; lon: number; city: string }> = {
  LOS: { name: "Murtala Muhammed Intl", lat: 6.5774, lon: 3.3215, city: "Lagos" },
  DNMM: { name: "Murtala Muhammed Intl", lat: 6.5774, lon: 3.3215, city: "Lagos" },
  ABV: { name: "Nnamdi Azikiwe Intl", lat: 9.0068, lon: 7.2631, city: "Abuja" },
  DNAA: { name: "Nnamdi Azikiwe Intl", lat: 9.0068, lon: 7.2631, city: "Abuja" },
  PHC: { name: "Port Harcourt Intl", lat: 5.0155, lon: 6.9496, city: "Port Harcourt" },
  DNPO: { name: "Port Harcourt Intl", lat: 5.0155, lon: 6.9496, city: "Port Harcourt" },
  KAN: { name: "Mallam Aminu Kano Intl", lat: 12.0476, lon: 8.5246, city: "Kano" },
  DNKN: { name: "Mallam Aminu Kano Intl", lat: 12.0476, lon: 8.5246, city: "Kano" },
  ENU: { name: "Akanu Ibiam Intl", lat: 6.4743, lon: 7.5619, city: "Enugu" },
  DNEN: { name: "Akanu Ibiam Intl", lat: 6.4743, lon: 7.5619, city: "Enugu" },
  AKR: { name: "Akure Airport", lat: 7.2468, lon: 5.301, city: "Akure" },
  DNAN: { name: "Akure Airport", lat: 7.2468, lon: 5.301, city: "Akure" },
};

// Auxiliary reference locations across Nigeria to make the radar map authentic
const REFERENCE_NODES = [
  { code: "KAD", city: "Kaduna", lat: 10.5960, lon: 7.4480 },
  { code: "CBQ", city: "Calabar", lat: 4.9757, lon: 8.3472 },
  { code: "IBA", city: "Ibadan", lat: 7.4258, lon: 3.9782 },
  { code: "ILR", city: "Ilorin", lat: 8.4821, lon: 4.5779 },
  { code: "YOL", city: "Yola", lat: 9.2575, lon: 12.4299 },
  { code: "MIU", city: "Maiduguri", lat: 11.8540, lon: 13.1510 },
  { code: "BEN", city: "Benin City", lat: 6.3176, lon: 5.5995 },
  { code: "SXO", city: "Sokoto", lat: 12.9167, lon: 5.2074 },
];

interface FlightTrackerProps {
  mission: any;
}

export const FlightTracker: React.FC<FlightTrackerProps> = ({ mission }) => {
  // 1. Resolve Route Locations
  const getAirportCode = (fullNameStr: string | null | undefined, fallback: string): string => {
    if (!fullNameStr) return fallback;
    const cleanStr = fullNameStr.toUpperCase();
    for (const code of Object.keys(AIRPORT_COORDS)) {
      if (cleanStr.includes(code)) return code;
    }
    // Check key patterns
    if (cleanStr.includes("LAGOS")) return "LOS";
    if (cleanStr.includes("ABUJA")) return "ABV";
    if (cleanStr.includes("PORT HARCOURT") || cleanStr.includes("HARCOURT")) return "PHC";
    if (cleanStr.includes("KANO")) return "KAN";
    if (cleanStr.includes("ENUGU")) return "ENU";
    if (cleanStr.includes("AKURE")) return "AKR";
    
    return fallback;
  };

  const depCode = getAirportCode(mission?.departure_airport || mission?.raw_payload?.departure || mission?.raw_payload?.from, "LOS");
  const destCode = getAirportCode(mission?.destination_airport || mission?.raw_payload?.destination || mission?.raw_payload?.to, "ABV");

  const depAirport = AIRPORT_COORDS[depCode] || AIRPORT_COORDS.LOS;
  const destAirport = AIRPORT_COORDS[destCode] || AIRPORT_COORDS.ABV;

  // Project longitude/latitude onto SVG coordinates [800 x 400]
  const project = (lat: number, lon: number) => {
    const width = 800;
    const height = 350;
    
    // Bounds wrapping Nigeria loosely with safety padding
    const minLon = 1.5;
    const maxLon = 15.5;
    const minLat = 3.5;
    const maxLat = 14.5;

    const x = ((lon - minLon) / (maxLon - minLon)) * width;
    const y = height - ((lat - minLat) / (maxLat - minLat)) * height;
    return { x, y };
  };

  const pStart = project(depAirport.lat, depAirport.lon);
  const pEnd = project(destAirport.lat, destAirport.lon);

  // Compute Bezier Curve points
  const getBezierPath = (x1: number, y1: number, x2: number, y2: number) => {
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;
    
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    
    // Perpendicular offsets to give an arc shape curving upwards/northwards
    const px = -dy / len;
    const py = dx / len;
    const offset = Math.max(len * 0.15, 30); // Dynamic beautiful arch
    
    const cx = mx + px * offset;
    const cy = my + py * offset;
    
    return {
      pathStr: `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`,
      cx,
      cy
    };
  };

  const { pathStr, cx, cy } = getBezierPath(pStart.x, pStart.y, pEnd.x, pEnd.y);

  // Interpolate state at progress `t` (0 to 1)
  const getBezierPoint = (t: number, x1: number, y1: number, cxPoint: number, cyPoint: number, x2: number, y2: number) => {
    const mt = 1 - t;
    const x = mt * mt * x1 + 2 * mt * t * cxPoint + t * t * x2;
    const y = mt * mt * y1 + 2 * mt * t * cyPoint + t * t * y2;

    const dx = 2 * mt * (cxPoint - x1) + 2 * t * (x2 - cxPoint);
    const dy = 2 * mt * (cyPoint - y1) + 2 * t * (y2 - cyPoint);
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);

    return { x, y, angle };
  };

  // State Management
  const [progress, setProgress] = useState(0.35); // Defaults to active mid-flight status
  const [isPlaying, setIsPlaying] = useState(true);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [isManualMode, setIsManualMode] = useState(false);
  const [fluctuation, setFluctuation] = useState(0);

  // Fluctuations for sensory realism
  useEffect(() => {
    const interval = setInterval(() => {
      setFluctuation((Math.random() - 0.5) * 4);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  // Animation Loop
  useEffect(() => {
    if (!isPlaying || isManualMode) return;

    let animFrameId: number;
    let lastTime = performance.now();

    const loop = (time: number) => {
      const delta = (time - lastTime) / 1000; // in seconds
      lastTime = time;

      // Base flight completes in roughly 60 seconds at 1x speed multiplier
      const step = (delta / 45) * speedMultiplier; 

      setProgress((prev) => {
        const next = prev + step;
        if (next >= 1) {
          setIsPlaying(false);
          return 1.0;
        }
        return next;
      });

      animFrameId = requestAnimationFrame(loop);
    };

    animFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameId);
  }, [isPlaying, speedMultiplier, isManualMode]);

  // Compute derived current metrics
  const currentPos = getBezierPoint(progress, pStart.x, pStart.y, cx, cy, pEnd.x, pEnd.y);
  
  // Realistic physical metrics derived from flight profile
  const totalDistanceKm = Math.round(
    Math.sqrt(Math.pow(pEnd.x - pStart.x, 2) + Math.pow(pEnd.y - pStart.y, 2)) * 1.6 // roughly scaled
  );
  const distanceTraveled = Math.round(totalDistanceKm * progress);
  const distanceRemaining = totalDistanceKm - distanceTraveled;

  // Altitude algorithm matching realistic private jet flight profile
  let altitude = 0;
  let statusText = "PRE-FLIGHT CHECK";
  let statusColor = "text-gray-400 border-gray-400/20 bg-gray-500/10";
  let speed = 0;

  if (progress === 0) {
    altitude = 120; // Ground elevation
    speed = 0;
    statusText = "PRE-FLIGHT DISPATCHED";
    statusColor = "text-amber-400 border-amber-400/20 bg-amber-500/5";
  } else if (progress > 0 && progress <= 0.05) {
    altitude = 120;
    speed = 35 + Math.round(fluctuation * 2);
    statusText = "TAXIING TO RUNWAY";
    statusColor = "text-blue-400 border-blue-400/20 bg-blue-500/5";
  } else if (progress > 0.05 && progress <= 0.25) {
    // Climb phase: linear interpolator to 41,000 ft
    const climbRatio = (progress - 0.05) / 0.20;
    altitude = Math.round(120 + climbRatio * 40880);
    speed = Math.round(180 + climbRatio * 300 + fluctuation);
    statusText = "ACTIVE VERTICAL CLIMB";
    statusColor = "text-indigo-400 border-indigo-400/20 bg-indigo-500/5";
  } else if (progress > 0.25 && progress <= 0.80) {
    // Cruising flight levels
    altitude = 41000 + Math.round(fluctuation * 10);
    speed = 480 + Math.round(fluctuation);
    statusText = "CRUISING • FLIGHT LEVEL FL410";
    statusColor = "text-emerald-400 border-emerald-400/20 bg-emerald-500/5";
  } else if (progress > 0.80 && progress < 0.97) {
    // Descent phase: down to 1,500 ft
    const descentRatio = (progress - 0.80) / 0.17;
    altitude = Math.round(41000 - descentRatio * 39500);
    speed = Math.round(480 - descentRatio * 310 + fluctuation);
    statusText = "STANDARD ARRIVAL DESCENT";
    statusColor = "text-amber-400 border-amber-400/20 bg-amber-500/5";
  } else if (progress >= 0.97 && progress < 1.0) {
    // Final approach
    const approachRatio = (progress - 0.97) / 0.03;
    altitude = Math.round(1500 - approachRatio * 1380);
    speed = Math.round(170 - approachRatio * 40);
    statusText = "FINAL GLIDESLOPE APPROACH";
    statusColor = "text-pink-400 border-pink-400/20 bg-pink-500/5";
  } else {
    // Arrived
    altitude = 120;
    speed = 0;
    statusText = "ARRIVED & SECURED";
    statusColor = "text-emerald-400 border-emerald-400/20 bg-emerald-500/10";
  }

  // Round calculated compass heading
  const headingVal = Math.round((currentPos.angle + 360 + 90) % 360);

  // Format flight progress percentages
  const formattedPercent = Math.round(progress * 100);

  // Live timer simulation
  const totalDurationMinutes = Math.round(totalDistanceKm * 0.12);
  const minutesElapsed = Math.round(totalDurationMinutes * progress);
  const minutesRemaining = totalDurationMinutes - minutesElapsed;

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsManualMode(true);
    setProgress(parseFloat(e.target.value));
  };

  return (
    <div id="flight-tracking-panel" className="bg-[#050b14] border border-emerald-500/20 rounded-3xl p-6 md:p-8 space-y-6 relative overflow-hidden shadow-2xl">
      {/* Background ambient radar sweeps */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/[0.02] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-fbblue/[0.02] rounded-full blur-3xl pointer-events-none" />

      {/* Panel Title HUD */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="text-[10px] text-emerald-400 font-mono tracking-widest uppercase">
              15D TELEMETRY HUB • SECURE FEED
            </span>
          </div>
          <h3 className="text-lg font-light text-white tracking-tight flex items-center gap-2">
            Real-Time Mission Trajectory Tracker
          </h3>
        </div>

        {/* Live status label */}
        <div className="flex items-center gap-3">
          <div className={`px-3.5 py-1.5 rounded-full border text-[10px] font-mono font-bold uppercase tracking-wider ${statusColor} transition-all duration-300`}>
            {statusText}
          </div>
        </div>
      </div>

      {/* SVG Trajectory Visualization Map */}
      <div className="relative bg-[#02050a] border border-white/5 rounded-2xl overflow-hidden aspect-[16/9] sm:aspect-[21/9] md:aspect-[2.4/1]">
        {/* Subtle grid pattern background */}
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="radarSweep" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(16, 185, 129, 0.15)" />
              <stop offset="50%" stopColor="rgba(16, 185, 129, 0.02)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0)" />
            </radialGradient>
            <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.15" />
              <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.8" />
            </linearGradient>
            <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
            
            {/* Elegant dropshadow for elements */}
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Grid lines: Latitude/Longitude coordinates */}
          {Array.from({ length: 15 }).map((_, i) => {
            const x = (i * 800) / 14;
            return (
              <line 
                key={`lon-${i}`}
                x1={x} 
                y1={0} 
                x2={x} 
                y2={350} 
                stroke="rgba(255, 255, 255, 0.025)" 
                strokeDasharray="2 6" 
              />
            );
          })}
          {Array.from({ length: 8 }).map((_, i) => {
            const y = (i * 350) / 7;
            return (
              <line 
                key={`lat-${i}`}
                x1={0} 
                y1={y} 
                x2={800} 
                y2={y} 
                stroke="rgba(255, 255, 255, 0.025)" 
                strokeDasharray="2 6" 
              />
            );
          })}

          {/* Coordinate text overlays */}
          <text x={10} y={340} fill="rgba(255,255,255,0.15)" fontSize="7" fontFamily="monospace">GRID PROJ: NGA-WGS84</text>
          <text x={720} y={340} fill="rgba(255,255,255,0.15)" fontSize="7" fontFamily="monospace">SCALE: DETERMINISTIC</text>

          {/* Radar scope concentric sweeps around Capital Abuja */}
          {(() => {
            const abujaProj = project(9.0068, 7.2631);
            return (
              <g opacity="0.3">
                <circle cx={abujaProj.x} cy={abujaProj.y} r={70} fill="none" stroke="rgba(16, 185, 129, 0.03)" strokeWidth="1" strokeDasharray="3 3" />
                <circle cx={abujaProj.x} cy={abujaProj.y} r={140} fill="none" stroke="rgba(16, 185, 129, 0.02)" strokeWidth="1" strokeDasharray="3 3" />
                <circle cx={abujaProj.x} cy={abujaProj.y} r={210} fill="none" stroke="rgba(16, 185, 129, 0.01)" strokeWidth="1" strokeDasharray="3 3" />
                <line x1={abujaProj.x - 220} y1={abujaProj.y} x2={abujaProj.x + 220} y2={abujaProj.y} stroke="rgba(16, 185, 129, 0.02)" strokeWidth="0.5" />
                <line x1={abujaProj.x} y1={abujaProj.y - 220} x2={abujaProj.x} y2={abujaProj.y + 220} stroke="rgba(16, 185, 129, 0.02)" strokeWidth="0.5" />
              </g>
            );
          })()}

          {/* Background Auxiliary reference nodes (Cities in Nigeria) */}
          {REFERENCE_NODES.map((node) => {
            const proj = project(node.lat, node.lon);
            // Hide if too close to starting/ending airports to maintain clean layout
            const distToStart = Math.sqrt(Math.pow(proj.x - pStart.x, 2) + Math.pow(proj.y - pStart.y, 2));
            const distToEnd = Math.sqrt(Math.pow(proj.x - pEnd.x, 2) + Math.pow(proj.y - pEnd.y, 2));
            if (distToStart < 40 || distToEnd < 40) return null;

            return (
              <g key={node.code} opacity="0.25" className="transition-opacity hover:opacity-80 duration-300">
                <circle cx={proj.x} cy={proj.y} r="2" fill="#94a3b8" />
                <text x={proj.x + 5} y={proj.y + 3} fill="#64748b" fontSize="7" fontFamily="monospace" fontWeight="light">{node.code}</text>
              </g>
            );
          })}

          {/* Main Flight Path Arc (Planned Route) */}
          <path 
            d={pathStr} 
            fill="none" 
            stroke="url(#routeGradient)" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeDasharray="4 6"
          />

          {/* Active Flight Path Overlay (Progress Traveled) */}
          <path 
            d={pathStr} 
            fill="none" 
            stroke="url(#progressGradient)" 
            strokeWidth="3" 
            strokeLinecap="round" 
            strokeDasharray="1000"
            strokeDashoffset={1000 * (1 - progress)} // Smooth crop based on progress
            className="transition-all duration-300"
          />

          {/* Pulsing Start Airport Marker */}
          <g transform={`translate(${pStart.x}, ${pStart.y})`}>
            <circle cx="0" cy="0" r="10" fill="rgba(16, 185, 129, 0.1)" className="animate-ping" style={{ animationDuration: '3s' }} />
            <circle cx="0" cy="0" r="5" fill="#10b981" />
            <circle cx="0" cy="0" r="2.5" fill="#02050a" />
            <text x="8" y="12" fill="#10b981" fontSize="9" fontFamily="monospace" fontWeight="bold" letterSpacing="0.05em">{depCode}</text>
          </g>

          {/* Pulsing End Airport Marker */}
          <g transform={`translate(${pEnd.x}, ${pEnd.y})`}>
            <circle cx="0" cy="0" r="14" fill="rgba(59, 130, 246, 0.15)" className="animate-ping" style={{ animationDuration: '2s' }} />
            <circle cx="0" cy="0" r="6" fill="#3b82f6" />
            <circle cx="0" cy="0" r="3" fill="#02050a" />
            <text x="8" y="-10" fill="#3b82f6" fontSize="9" fontFamily="monospace" fontWeight="bold" letterSpacing="0.05em">{destCode}</text>
          </g>

          {/* Current Aircraft Interpolated Node */}
          {progress > 0 && progress < 1.0 && (
            <g 
              transform={`translate(${currentPos.x}, ${currentPos.y}) rotate(${currentPos.angle})`}
              className="transition-transform duration-300"
              filter="url(#glow)"
            >
              {/* Dynamic visual radar pulse ring around the airplane */}
              <circle cx="0" cy="0" r="18" fill="none" stroke="rgba(59, 130, 246, 0.4)" strokeWidth="1" className="animate-ping" style={{ animationDuration: '2s' }} />
              
              {/* Sleek, solid white vector private aircraft */}
              <g transform="scale(0.85) translate(-12, -12)">
                <path 
                  d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" 
                  fill="#ffffff" 
                  stroke="#3b82f6" 
                  strokeWidth="1"
                />
              </g>
            </g>
          )}
        </svg>

        {/* Floating Mini HUD readout directly on top of the SVG map */}
        <div className="absolute top-4 left-4 bg-black/75 backdrop-blur-[10px] border border-white/10 rounded-xl px-3 py-2 flex flex-col gap-0.5 pointer-events-none">
          <span className="text-[8px] text-gray-500 font-mono tracking-widest uppercase">GPS SECTOR</span>
          <span className="text-[10px] text-white font-mono font-medium flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            {currentPos.x.toFixed(1)}°E • {currentPos.y.toFixed(1)}°N
          </span>
        </div>

        <div className="absolute top-4 right-4 bg-black/75 backdrop-blur-[10px] border border-white/10 rounded-xl px-3.5 py-2 flex flex-col gap-0.5 pointer-events-none text-right">
          <span className="text-[8px] text-gray-500 font-mono tracking-widest uppercase">PROGRESS RATIO</span>
          <span className="text-sm text-emerald-400 font-mono font-bold tracking-tight">
            {formattedPercent}%
          </span>
        </div>
      </div>

      {/* Primary Telemetry HUD Grid (Laid out in an oversimplified elegant dashboard style) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
        <div className="bg-[#02050a]/60 border border-white/5 rounded-2xl p-4 space-y-1.5 transition-all hover:bg-[#02050a]/80 duration-300">
          <div className="flex items-center gap-2 text-gray-500">
            <Gauge className="w-3.5 h-3.5 text-fbblue" />
            <span className="text-[9px] font-mono tracking-widest uppercase font-medium">GROUND SPEED</span>
          </div>
          <div className="space-y-0.5">
            <p className="text-xl font-light text-white tracking-tight">
              {speed} <span className="text-xs text-gray-500">KTAS</span>
            </p>
            <p className="text-[9px] text-gray-500 font-mono">
              ~ {Math.round(speed * 1.852)} km/h Cruise Rate
            </p>
          </div>
        </div>

        <div className="bg-[#02050a]/60 border border-white/5 rounded-2xl p-4 space-y-1.5 transition-all hover:bg-[#02050a]/80 duration-300">
          <div className="flex items-center gap-2 text-gray-500">
            <Wind className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[9px] font-mono tracking-widest uppercase font-medium">ALTITUDE (MSL)</span>
          </div>
          <div className="space-y-0.5">
            <p className="text-xl font-light text-white tracking-tight">
              {altitude.toLocaleString()} <span className="text-xs text-gray-500">FT</span>
            </p>
            <p className="text-[9px] text-gray-500 font-mono">
              {altitude > 10000 ? `Flight Level FL${Math.round(altitude / 100)}` : 'Terminal Altitude Area'}
            </p>
          </div>
        </div>

        <div className="bg-[#02050a]/60 border border-white/5 rounded-2xl p-4 space-y-1.5 transition-all hover:bg-[#02050a]/80 duration-300">
          <div className="flex items-center gap-2 text-gray-500">
            <Compass className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-[9px] font-mono tracking-widest uppercase font-medium">TRUE HEADING</span>
          </div>
          <div className="space-y-0.5">
            <p className="text-xl font-light text-white tracking-tight">
              {headingVal}° <span className="text-xs text-gray-500">HDG</span>
            </p>
            <p className="text-[9px] text-gray-500 font-mono">
              Oriented {headingVal < 90 || headingVal > 270 ? 'North' : 'South'}-{headingVal > 180 ? 'Westbound' : 'Eastbound'}
            </p>
          </div>
        </div>

        <div className="bg-[#02050a]/60 border border-white/5 rounded-2xl p-4 space-y-1.5 transition-all hover:bg-[#02050a]/80 duration-300">
          <div className="flex items-center gap-2 text-gray-500">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-[9px] font-mono tracking-widest uppercase font-medium">ESTIMATED ETE</span>
          </div>
          <div className="space-y-0.5">
            <p className="text-xl font-light text-white tracking-tight">
              {minutesRemaining > 0 ? `${minutesRemaining} MIN` : "COMPLETED"}
            </p>
            <p className="text-[9px] text-gray-500 font-mono">
              Elapsed: {minutesElapsed}m / {totalDurationMinutes}m Total
            </p>
          </div>
        </div>
      </div>

      {/* Progress timeline with detailed metrics & route stops */}
      <div className="bg-[#02050a]/30 border border-white/5 rounded-2xl p-4 space-y-4">
        <div className="flex items-center justify-between text-[10px] text-gray-500 font-mono tracking-wider">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3 h-3 text-emerald-400" />
            <span>ORIGIN: <strong className="text-white">{depAirport.city} ({depCode})</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3 h-3 text-blue-400" />
            <span>DESTINATION: <strong className="text-white">{destAirport.city} ({destCode})</strong></span>
          </div>
        </div>

        {/* Flight Track progress line */}
        <div className="relative pt-1">
          <div className="overflow-hidden h-2 text-xs flex rounded-full bg-white/5">
            <div 
              style={{ width: `${formattedPercent}%` }} 
              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-emerald-500 to-blue-500 transition-all duration-300"
            />
          </div>
          
          {/* Timeline markers */}
          <div className="flex justify-between text-[9px] text-gray-600 font-mono pt-1.5">
            <span>Takeoff</span>
            <span className={progress >= 0.5 ? "text-blue-500/80" : "text-gray-600"}>Cruise (50%)</span>
            <span>Arrival</span>
          </div>
        </div>

        {/* Live Mileage Counter HUD */}
        <div className="flex justify-between items-center text-xs text-gray-400 font-light border-t border-white/5 pt-3">
          <div>
            Distance Traveled: <strong className="text-white font-mono">{distanceTraveled} KM</strong>
          </div>
          <div className="text-right">
            Remaining Distance: <strong className="text-white font-mono">{distanceRemaining} KM</strong>
          </div>
        </div>
      </div>

      {/* Interactive Command & Simulation Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-[#02050a]/50 border border-white/5 rounded-2xl p-4 sm:p-5">
        
        {/* Playback controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setIsManualMode(false);
              setIsPlaying(!isPlaying);
            }}
            className={`p-3 rounded-full flex items-center justify-center transition-all ${
              isPlaying 
                ? "bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20" 
                : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20"
            }`}
            title={isPlaying ? "Pause Stream" : "Resume Stream"}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>

          <button
            onClick={() => {
              setProgress(0);
              setIsPlaying(true);
              setIsManualMode(false);
            }}
            className="p-3 rounded-full bg-white/[0.03] text-gray-400 border border-white/5 hover:bg-white/[0.08] hover:text-white transition-all"
            title="Reset Flight Feed"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <div className="h-6 w-[1px] bg-white/10 mx-1" />

          {/* Speed multipliers */}
          <div className="flex items-center gap-1 bg-black/40 p-1 border border-white/5 rounded-xl">
            {[1, 2, 5, 10].map((mult) => (
              <button
                key={mult}
                onClick={() => {
                  setSpeedMultiplier(mult);
                  setIsManualMode(false);
                  setIsPlaying(true);
                }}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-mono font-bold tracking-wider transition-all ${
                  speedMultiplier === mult && !isManualMode && isPlaying
                    ? "bg-fbblue text-white"
                    : "text-gray-500 hover:text-white hover:bg-white/[0.02]"
                }`}
              >
                {mult}X
              </button>
            ))}
          </div>
        </div>

        {/* Scrub timeline controller */}
        <div className="flex-1 flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-gray-500">
            <Sliders className="w-3.5 h-3.5" />
            <span className="text-[10px] font-mono tracking-wider uppercase">Scrub</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.001"
            value={progress}
            onChange={handleSliderChange}
            className="flex-1 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-fbblue focus:outline-none"
          />
          <span className="text-[10px] font-mono text-gray-400 min-w-[40px] text-right">
            {isManualMode ? "SCRUB" : `${speedMultiplier}x`}
          </span>
        </div>
      </div>
    </div>
  );
};
