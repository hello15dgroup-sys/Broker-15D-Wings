import { Mission } from '../types';
import { useState } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Circle } from 'lucide-react';

interface CCIPref {
  id: string;
  label: string;
  description: string;
  fee: number;
}

const EXPERIENCES: CCIPref[] = [
  { id: 'skyparty', label: 'SKY PARTY™', description: 'Curated high-altitude gatherings with production.', fee: 2500 },
  { id: 'bluehour', label: 'BLUEHOUR™', description: 'Sensory therapy with custom lighting & noise isolation.', fee: 1800 },
  { id: 'skydate', label: 'SKY DATE™', description: 'Private intimate dining and floral architectures.', fee: 1200 },
];

export default function CCIGate({ mission }: { mission: Mission }) {
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  return (
    <div className="space-y-12">
      <header>
        <span className="font-lexend text-gold mb-2 block">CUSTOMIZATION GATE</span>
        <h3 className="title-monument text-white text-2xl">DEFINE EXPERIENCE LAYERS</h3>
        <p className="text-gray-500 mt-4 max-w-xl">
          To preserve execution certainty, preferences are declared upfront. These parameters affect the <strong>Customization Complexity Index (CCI)</strong>.
        </p>
      </header>

      <div className="grid md:grid-cols-3 gap-6">
        {EXPERIENCES.map((exp) => (
          <button
            key={exp.id}
            onClick={() => toggle(exp.id)}
            className={`text-left p-8 rounded-3xl border transition-all relative overflow-hidden group ${
              selected.includes(exp.id) 
                ? 'bg-fbblue/10 border-fbblue shadow-2xl shadow-fbblue/20' 
                : 'bg-white/[0.02] border-white/10 hover:border-white/20'
            }`}
          >
            <div className="flex justify-between items-start mb-6">
              <span className={`font-lexend text-[8px] ${selected.includes(exp.id) ? 'text-fbblue' : 'text-gray-500'}`}>
                {exp.id}
              </span>
              {selected.includes(exp.id) ? <CheckCircle2 className="w-5 h-5 text-fbblue" /> : <Circle className="w-5 h-5 text-white/10" />}
            </div>
            <h4 className="title-monument text-lg text-white mb-2">{exp.label}</h4>
            <p className="text-[10px] text-gray-500 leading-relaxed mb-6">{exp.description}</p>
            <div className="text-white font-mono text-sm">${exp.fee}</div>
            
            {selected.includes(exp.id) && (
              <motion.div 
                layoutId="active-bg"
                className="absolute inset-0 bg-fbblue/5 pointer-events-none" 
              />
            )}
          </button>
        ))}
      </div>

      <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
        <div>
          <span className="font-lexend text-gray-500 text-[8px] block mb-1">TOTAL CUSTOMIZATION LOAD</span>
          <p className="text-white font-mono text-2xl">${selected.reduce((acc, id) => acc + (EXPERIENCES.find(e => e.id === id)?.fee || 0), 0)}</p>
        </div>
        <button className="bg-white text-nearblack font-lexend px-12 py-5 rounded-full hover:bg-fbblue hover:text-white transition-all shadow-2xl">
          LOCK PARAMETERS & GENERATE PRICING
        </button>
      </div>
    </div>
  );
}
