export default function MissionHealthRing({ score }: { score: number }) {
  const getStatus = () => {
    if (score > 80) return { label: 'STABLE', color: '#10b981' };
    if (score > 50) return { label: 'MONITORING', color: '#f59e0b' };
    return { label: 'ACTION REQUIRED', color: '#ef4444' };
  };

  const status = getStatus();
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative w-20 h-20 flex items-center justify-center">
      <svg className="w-full h-full -rotate-90">
        <circle
          cx="40"
          cy="40"
          r={radius}
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="4"
          fill="transparent"
        />
        <circle
          cx="40"
          cy="40"
          r={radius}
          stroke={status.color}
          strokeWidth="4"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
          style={{ filter: `drop-shadow(0 0 4px ${status.color})` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-lexend text-[6px] text-gray-500">MHI</span>
        <div 
          className="w-2 h-2 rounded-full mt-1" 
          style={{ backgroundColor: status.color, boxShadow: `0 0 10px ${status.color}` }} 
        />
      </div>
    </div>
  );
}
