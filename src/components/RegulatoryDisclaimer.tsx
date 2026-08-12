import { ShieldCheck, Globe, Navigation } from 'lucide-react';

export default function RegulatoryDisclaimer() {
  return (
    <div className="flex flex-col items-center justify-center space-y-6 mt-12 opacity-50 hover:opacity-100 transition-opacity duration-500">
      <p className="font-montserrat text-[10px] md:text-xs uppercase tracking-widest text-gray-400 text-center max-w-sm leading-relaxed">
        All flights are operated by NCAA Part 135 authorized and licensed direct air carriers.
      </p>
      
      <div className="flex items-center justify-center gap-8 text-gray-500">
        <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 opacity-70" />
            <span className="font-lexend text-[10px] tracking-widest font-bold">IATA</span>
        </div>
        <div className="w-px h-6 bg-white/10" />
        <div className="flex items-center gap-2">
            <Navigation className="w-4 h-4 opacity-70" />
            <span className="font-lexend text-[10px] tracking-widest font-bold">ICAO</span>
        </div>
        <div className="w-px h-6 bg-white/10" />
        <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 opacity-70" />
            <span className="font-lexend text-[10px] tracking-widest font-bold">NCAA</span>
        </div>
      </div>
    </div>
  );
}
