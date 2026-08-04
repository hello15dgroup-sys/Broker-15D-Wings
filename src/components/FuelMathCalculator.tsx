import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Calculator, Plane as PlaneIcon, Info } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatCurrency } from '../lib/utils';

interface FuelMathCalculatorProps {
  missionId: string;
  flightDurationHours: number; // e.g. 2.5
  onComputeComplete: (data: any) => void;
  onCancel: () => void;
}

export default function FuelMathCalculator({ missionId, flightDurationHours, onComputeComplete, onCancel }: FuelMathCalculatorProps) {
  const [fuelBurn, setFuelBurn] = useState(250); // gallons per hour default
  const [fuelPrice, setFuelPrice] = useState(6.50); // price per gallon
  
  // Formulas
  // Trip Fuel = flightDurationHours * fuelBurn
  // Cont Fuel = max(Trip Fuel * 0.05, (5/60) * fuelBurn)
  // Alt Fuel = (30/60) * fuelBurn
  // Res Fuel = (45/60) * fuelBurn
  // Taxi Fuel = (15/60) * fuelBurn
  
  const tripFuel = flightDurationHours * fuelBurn;
  const contFuel = Math.max(tripFuel * 0.05, (5/60) * fuelBurn);
  const altFuel = (30/60) * fuelBurn;
  const resFuel = (45/60) * fuelBurn;
  const taxiFuel = (15/60) * fuelBurn;
  const extraFuel = 0; // Keeping 0 for now as per minimal viable
  
  const blockFuel = tripFuel + contFuel + altFuel + resFuel + taxiFuel + extraFuel;
  const totalCost = blockFuel * fuelPrice;
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const updateData = {
        fuel_trip: tripFuel,
        fuel_cont: contFuel,
        fuel_alt: altFuel,
        fuel_res: resFuel,
        fuel_taxi: taxiFuel,
        fuel_block: blockFuel
      };
      
      // Update mission record in supabase
      await supabase.from('missions').update(updateData).eq('id', missionId);
      onComputeComplete({ ...updateData, cost: totalCost });
    } catch (error) {
      console.error(error);
      alert('Failed to submit fuel calculation');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="bg-[#111] border border-white/10 rounded-2xl p-6 shadow-2xl w-full max-w-xl mx-auto font-lexend space-y-6">
      <div className="flex justify-between items-center border-b border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-fbblue/20 rounded-lg">
             <Calculator className="w-5 h-5 text-fbblue" />
          </div>
          <div>
            <h3 className="text-white font-sync tracking-widest text-sm">AVIATION FUEL MATH</h3>
            <p className="text-gray-400 text-[10px] uppercase tracking-widest ui-sync">NCAA / ICAO IFR BLOCK FUEL</p>
          </div>
        </div>
        <button onClick={onCancel} className="text-gray-500 hover:text-white transition-colors"><span className="text-2xl leading-none">&times;</span></button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
           <label className="text-[10px] text-gray-500 ui-sync tracking-widest flex items-center gap-1">
              HOURLY BURN (GAL/HR)
              <Info className="w-3 h-3 text-gray-600 cursor-help" />
           </label>
           <input type="number" value={fuelBurn} onChange={e => setFuelBurn(Number(e.target.value))} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:border-fbblue/50 outline-none transition-colors" />
        </div>
        <div className="space-y-2">
           <label className="text-[10px] text-gray-500 ui-sync tracking-widest flex items-center gap-1">
              FUEL PRICE (USD/GAL)
           </label>
           <input type="number" value={fuelPrice} step="0.01" onChange={e => setFuelPrice(Number(e.target.value))} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:border-fbblue/50 outline-none transition-colors" />
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-[10px] text-gray-500 ui-sync tracking-widest border-b border-white/5 pb-2">COMPUTATION ENGINE</h4>
        
        <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-xs">
          <div className="flex justify-between items-end">
            <span className="text-gray-400 font-light">Trip Fuel (F_{'{trip}'})</span>
            <span className="text-white font-mono">{tripFuel.toFixed(1)} <span className="text-gray-600 text-[10px]">gal</span></span>
          </div>
          <div className="flex justify-between items-end">
            <span className="text-gray-400 font-light">Contingency (F_{'{cont}'})</span>
            <span className="text-white font-mono">{contFuel.toFixed(1)} <span className="text-gray-600 text-[10px]">gal</span></span>
          </div>
          <div className="flex justify-between items-end">
            <span className="text-gray-400 font-light" title="Missed approach to backup">Alternate (F_{'{alt}'})</span>
            <span className="text-white font-mono">{altFuel.toFixed(1)} <span className="text-gray-600 text-[10px]">gal</span></span>
          </div>
          <div className="flex justify-between items-end">
            <span className="text-gray-400 font-light" title="45 mins holding">Final Reserve (F_{'{res}'})</span>
            <span className="text-white font-mono">{resFuel.toFixed(1)} <span className="text-gray-600 text-[10px]">gal</span></span>
          </div>
          <div className="flex justify-between items-end">
            <span className="text-gray-400 font-light" title="APU & ground maneuvering">Taxi Fuel (F_{'{taxi}'})</span>
            <span className="text-white font-mono">{taxiFuel.toFixed(1)} <span className="text-gray-600 text-[10px]">gal</span></span>
          </div>
          <div className="flex justify-between items-end">
            <span className="text-gray-400 font-light">Extra Fuel (F_{'{extra}'})</span>
            <span className="text-white font-mono">{extraFuel.toFixed(1)} <span className="text-gray-600 text-[10px]">gal</span></span>
          </div>
        </div>

        <div className="pt-4 border-t border-white/5 flex items-center justify-between">
           <div>
              <p className="text-[10px] text-fbblue ui-sync tracking-widest font-bold mb-1">TOTAL BLOCK FUEL</p>
              <p className="text-2xl text-white font-lexend">{blockFuel.toFixed(1)} <span className="text-base text-gray-500 font-light">gal</span></p>
           </div>
           <div className="text-right">
              <p className="text-[10px] text-emerald-500 ui-sync tracking-widest font-bold mb-1">COST ESTIMATE</p>
              <p className="text-2xl text-white font-lexend">{formatCurrency(totalCost)}</p>
           </div>
        </div>
      </div>

      <button onClick={handleSubmit} disabled={isSubmitting} className="w-full bg-fbblue hover:bg-blue-600 text-white font-sync font-bold tracking-widest py-4 rounded-xl text-xs transition-colors flex justify-center items-center gap-2">
        {isSubmitting ? 'TRANSMITTING...' : 'TRANSMIT TO ICC COMMAND'}
      </button>

    </motion.div>
  );
}
