import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Sparkles, Save, Wine, ShieldCheck, CreditCard, X, Wifi, ShieldAlert } from 'lucide-react';

const PREMIUM_CUSTOMIZATIONS = [
  { 
    id: 'wine', 
    name: 'White Wine & Vintage Champagnes', 
    price: 450, 
    cci: 'CCI-1', 
    classification: 'Light Tailoring', 
    support: 'Soft Secondary Asset Alerts',
    desc: 'Grand Cru Chablis, Dom Pérignon Vintage, custom-chilled champagne service.',
    icon: Wine
  },
  { 
    id: 'michelin', 
    name: 'Michelin-Star Gastronomy', 
    price: 1200, 
    cci: 'CCI-2', 
    classification: 'Operational Tailoring', 
    support: 'Active Standby Pre-Verification',
    desc: 'Wagyu steak, caviar, custom-tailored dietary or kosher/halal-safe menu.',
    icon: Sparkles
  },
  { 
    id: 'limo', 
    name: 'Ramp-Side Maybach Transfer', 
    price: 850, 
    cci: 'CCI-2', 
    classification: 'Operational Tailoring', 
    support: 'Active Standby Pre-Verification',
    desc: 'Chauffeured tarmac vehicle escort direct from VIP Lounge to aircraft steps.',
    icon: ShieldCheck
  },
  { 
    id: 'starlink', 
    name: 'Starlink Cryptographic Broadband', 
    price: 250, 
    cci: 'CCI-1', 
    classification: 'Light Tailoring', 
    support: 'Soft Secondary Asset Alerts',
    desc: 'Ultra high-speed satellite network with custom enterprise encryption filters.',
    icon: Wifi
  },
  { 
    id: 'security', 
    name: 'Diplomatic Logistical Security', 
    price: 3500, 
    cci: 'CCI-3', 
    classification: 'Critical Support', 
    support: 'API-Driven Standby & Route Mapping',
    desc: 'Advanced physical asset monitoring and discrete security escorts.',
    icon: ShieldAlert
  }
];

export default function MissionCustomizationForm({ missionId, currentCustomizations, onSuccess, onClose }: { missionId: string, currentCustomizations?: any[], onSuccess: () => void, onClose?: () => void }) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [customDetails, setCustomDetails] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Flat amendment cost for updating flight variables
  const FLAT_AMENDMENT_FEE = 1500;

  // Reactively fetch and parse existing configurations on build/load or when props change
  React.useEffect(() => {
    async function loadExistingCustomization() {
      if (!missionId) return;
      try {
        let data = null;
        if (currentCustomizations && currentCustomizations.length > 0) {
          data = currentCustomizations[0];
        } else {
          const { data: dbData, error } = await supabase
            .from('mission_customizations')
            .select('*')
            .eq('mission_id', missionId)
            .maybeSingle();
          data = dbData;
        }

        if (data) {
          const details = data.request_details || '';
          const foundIds: string[] = [];
          PREMIUM_CUSTOMIZATIONS.forEach(c => {
            if (details.includes(c.name)) {
              foundIds.push(c.id);
            }
          });
          setSelectedIds(foundIds);
          
          let parsedNotes = details;
          if (details.includes('[DETAILED CLIENT NOTES]: ')) {
            parsedNotes = details.split('[DETAILED CLIENT NOTES]: ')[1] || '';
          }
          setCustomDetails(parsedNotes === 'None' ? '' : parsedNotes);
        }
      } catch (err) {
        console.warn("Failed to load existing customization parameters:", err);
      }
    }
    loadExistingCustomization();
  }, [missionId, currentCustomizations]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleGenerateAI = async () => {
    setIsGenerating(true);
    try {
      const selectedNames = PREMIUM_CUSTOMIZATIONS
        .filter(c => selectedIds.includes(c.id))
        .map(c => c.name)
        .join(', ');

      const response = await fetch('/api/ai/generate-customization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          cciLevel: selectedIds.length > 0 ? PREMIUM_CUSTOMIZATIONS.find(c => selectedIds.includes(c.id))?.cci : 'CCI-1', 
          currentDetails: `Selected suggestions: [${selectedNames}]. Specific requests: ${customDetails || 'None provided yet'}`
        })
      });

      if (response.ok) {
        const data = await response.json() as { result?: string };
        setCustomDetails(data.result || '');
      } else {
        throw new Error('AI failed');
      }
    } catch {
      alert("AI helper is temporarily offline. Please write your raw specifications instead.");
    } finally {
      setIsGenerating(false);
    }
  };

  const calculateTotalCost = () => {
    if (selectedIds.length === 0) return 0;
    const itemsCost = PREMIUM_CUSTOMIZATIONS
      .filter(c => selectedIds.includes(c.id))
      .reduce((sum, c) => sum + c.price, 0);
    return itemsCost + FLAT_AMENDMENT_FEE;
  };

  const handleSubmit = async () => {
    if (!missionId) return;
    setIsSubmitting(true);

    // Determine highest CCI level chosen
    let highestCCI = 'CCI-0';
    let highestClassification = 'Standard Flight';
    let highestSupport = 'Direct Dispatch Sequencing';

    const selectedSpecs = PREMIUM_CUSTOMIZATIONS.filter(c => selectedIds.includes(c.id));
    if (selectedSpecs.length > 0) {
      if (selectedSpecs.some(c => c.cci === 'CCI-3')) {
        highestCCI = 'CCI-3';
        highestClassification = 'Critical Support';
        highestSupport = 'API-Driven Standby & Route Mapping';
      } else if (selectedSpecs.some(c => c.cci === 'CCI-2')) {
        highestCCI = 'CCI-2';
        highestClassification = 'Operational Tailoring';
        highestSupport = 'Active Standby Pre-Verification';
      } else {
        highestCCI = 'CCI-1';
        highestClassification = 'Light Tailoring';
        highestSupport = 'Soft Secondary Asset Alerts';
      }
    }

    const itemsSummary = selectedSpecs.map(c => `${c.name} ($${c.price})`).join(', ');
    const totalCost = calculateTotalCost();

    // Fetch existing custom record details to preserve [AIRCRAFT CONFIGURATION] line
    const { data: existingRecord } = await supabase
      .from('mission_customizations')
      .select('id, request_details, cci_level')
      .eq('mission_id', missionId)
      .maybeSingle();

    const existingDetails = existingRecord?.request_details || '';
    let aircraftLine = '';
    const aircraftMatch = existingDetails.split('\n').find((line: string) => line.includes('[AIRCRAFT CONFIGURATION]'));
    if (aircraftMatch) {
      aircraftLine = aircraftMatch + '\n';
    }

    // Preserve aircraft CCI to keep highest level correct
    let finalCCI = highestCCI;
    let finalClassification = highestClassification;
    let finalSupport = highestSupport;

    if (existingRecord?.cci_level) {
      const levelMap: Record<string, number> = { 'CCI-0': 0, 'CCI-1': 1, 'CCI-2': 2, 'CCI-3': 3 };
      if (levelMap[existingRecord.cci_level] > levelMap[highestCCI]) {
        finalCCI = existingRecord.cci_level;
        if (finalCCI === 'CCI-3') {
          finalClassification = 'Critical Support';
          finalSupport = 'API-Driven Standby & Route Mapping';
        } else if (finalCCI === 'CCI-2') {
          finalClassification = 'Operational Tailoring';
          finalSupport = 'Active Standby Pre-Verification';
        } else if (finalCCI === 'CCI-1') {
          finalClassification = 'Light Tailoring';
          finalSupport = 'Soft Secondary Asset Alerts';
        }
      }
    }

    const finalDetails = `${aircraftLine}[CUSTOM CHOSEN AMENITIES]: ${itemsSummary || 'None'}\n[DETAILED CLIENT NOTES]: ${customDetails || 'None'}`;

    let customError;
    if (existingRecord?.id) {
      const { error } = await supabase
        .from('mission_customizations')
        .update({
          cci_level: finalCCI,
          classification: finalClassification,
          request_details: finalDetails,
          system_support: finalSupport,
          status: 'APPROVED'
        })
        .eq('id', existingRecord.id);
      customError = error;
    } else {
      const { error } = await supabase.from('mission_customizations').insert({
        mission_id: missionId,
        cci_level: finalCCI,
        classification: finalClassification,
        request_details: finalDetails,
        system_support: finalSupport,
        status: 'APPROVED'
      });
      customError = error;
    }

    if (customError) {
      alert("Failed to save customized attributes: " + customError.message);
      setIsSubmitting(false);
      return;
    }

    // 2. Fetch current mission to calculate new outstanding balance
    const { data: currentMission } = await supabase
      .from('missions')
      .select('outstanding_balance, estimated_lower, estimated_upper, raw_payload')
      .eq('id', missionId)
      .single();

    const rawPayload = currentMission?.raw_payload || {};
    
    // Ensure base outstanding balance is stored securely to avoid double compounding
    let baseOutstandingBalance = Number(rawPayload.base_outstanding_balance);
    if (!baseOutstandingBalance) {
      baseOutstandingBalance = Number(currentMission?.outstanding_balance || 0);
      rawPayload.base_outstanding_balance = baseOutstandingBalance;
    }

    // Ensure base estimations are stored securely to avoid double compounding
    let baseEstimatedLower = Number(rawPayload.base_estimated_lower);
    if (!baseEstimatedLower) {
      baseEstimatedLower = Number(currentMission?.estimated_lower || 0);
      rawPayload.base_estimated_lower = baseEstimatedLower;
    }

    let baseEstimatedUpper = Number(rawPayload.base_estimated_upper);
    if (!baseEstimatedUpper) {
      baseEstimatedUpper = Number(currentMission?.estimated_upper || 0);
      rawPayload.base_estimated_upper = baseEstimatedUpper;
    }

    rawPayload.customization_cost = totalCost;

    const newBalance = baseOutstandingBalance + totalCost;
    const newEstimatedLower = baseEstimatedLower > 0 ? baseEstimatedLower + totalCost : undefined;
    const newEstimatedUpper = baseEstimatedUpper > 0 ? baseEstimatedUpper + totalCost : undefined;

    // Call Pricing Engine Edge DO to finalize new estimate numbers based on changes
    // We will do optimistic UI updates locally so it reflects immediately
    try {
      fetch(`/api/price/${missionId}/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          mission_id: missionId,
          customization_cost: totalCost
        })
      }).catch(() => {}); // Ignore network errors in background
    } catch (err) {
      // Background DO call
    }

    // 3. Update the flight data adding the modification fee standard (DO NOT lock yet so they can update iteratively)
    const { error: missionError } = await supabase
      .from('missions')
      .update({
        outstanding_balance: newBalance,
        estimated_lower: newEstimatedLower,
        estimated_upper: newEstimatedUpper,
        raw_payload: rawPayload
      })
      .eq('id', missionId);

    if (!missionError) {
      onSuccess();
    } else {
      alert("Error adding customized parameters to flight account: " + missionError.message);
    }
    
    setIsSubmitting(false);
  };

  return (
    <div className="bg-[#090d16] border border-white/10 rounded-[1.5rem] md:rounded-[2rem] p-4 md:p-8 w-full max-w-2xl mx-auto relative overflow-hidden backdrop-blur-xl shadow-2xl">
      <div className="absolute top-0 right-0 w-64 h-64 bg-fbblue/5 rounded-full filter blur-[120px] pointer-events-none" />

      <div className="flex justify-between items-start mb-6">
        <div>
           <h2 className="text-lg md:text-xl font-light text-white uppercase tracking-widest font-sync">Tailor Flight Experience</h2>
           <p className="text-[10px] md:text-xs text-gray-400 mt-2 font-light">Select premium additions for your flight. Note: Each alteration incurs a modification charge added to the final flight invoice.</p>
        </div>
        <button onClick={onClose || onSuccess} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors self-start shrink-0">
          <X className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {/* Suggested Luxury Customizations */}
      <div className="grid grid-cols-1 gap-3 mb-6 max-h-[45vh] md:max-h-[35vh] overflow-y-auto pr-1 md:pr-2 scrollbar-thin">
         {PREMIUM_CUSTOMIZATIONS.map((c) => {
           const Icon = c.icon;
           const isSelected = selectedIds.includes(c.id);
           return (
             <div 
               key={c.id}
               onClick={() => toggleSelect(c.id)}
               className={`p-3 md:p-4 rounded-xl border transition-all cursor-pointer flex gap-3 md:gap-4 items-center ${isSelected ? 'bg-fbblue/10 border-fbblue/40 shadow-[0_0_15px_rgba(24,119,242,0.15)]' : 'bg-white/[0.02] border-white/5 hover:border-white/25'}`}
             >
                <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center shrink-0 ${isSelected ? 'bg-fbblue text-white' : 'bg-white/5 text-gray-400'}`}>
                   <Icon className="w-4 h-4 md:w-5 md:h-5" />
                </div>
                <div className="flex-1 min-w-0">
                   <div className="flex justify-between items-start md:items-center gap-2">
                     <h4 className="text-sm font-semibold text-white tracking-wide truncate">{c.name}</h4>
                     <span className="text-xs text-fbblue font-mono font-medium shrink-0">+${c.price}</span>
                   </div>
                   <p className="text-[10px] md:text-[11px] text-gray-400 mt-1 md:mt-0.5 font-light leading-snug">{c.desc}</p>
                </div>
             </div>
           );
         })}
      </div>

      {/* Custom AI Assist Input */}
      <div className="space-y-3 mb-6">
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 md:gap-0">
            <label className="text-[10px] text-gray-500 uppercase tracking-widest font-sync">Bespoke Requirements / Instructions</label>
            <button 
              onClick={handleGenerateAI}
              disabled={isGenerating}
              className="px-3 py-2 md:py-1.5 w-full md:w-auto bg-fbblue/20 text-fbblue text-[9px] uppercase tracking-widest font-sync rounded-lg border border-fbblue/30 flex items-center justify-center md:justify-start gap-1.5 hover:bg-fbblue/30 transition-all disabled:opacity-50"
            >
               <Sparkles className="w-3" />
               {isGenerating ? 'Synthesizing...' : 'Scribe Suggestions with AI'}
            </button>
         </div>
         <textarea 
           value={customDetails}
           onChange={(e) => setCustomDetails(e.target.value)}
           placeholder="E.g., Require standard Figuier ambient cabin aroma, customized silk bedding, specific floral arrangements..."
           className="w-full h-24 bg-black/60 border border-white/10 rounded-xl p-3 text-xs text-white focus:border-fbblue/50 outline-none transition-all resize-none font-light"
         />
      </div>

      {/* cost breakdown and amendment warning */}
      <div className="bg-white/[0.02] border border-white/5 p-3 md:p-4 rounded-xl mb-6 flex flex-col gap-3">
         <div className="flex justify-between items-center text-[11px] md:text-xs">
           <span className="text-gray-400 flex items-center gap-1.5 md:gap-2"><CreditCard className="w-3 h-3 md:w-3.5 md:h-3.5 text-fbblue" /> Flight Schedule Amendment Rate</span>
           <span className="text-white font-mono">+${FLAT_AMENDMENT_FEE}</span>
         </div>
         <div className="flex justify-between items-center text-[11px] md:text-xs">
           <span className="text-gray-400">Total Amenities Upgrade</span>
           <span className="text-white font-mono">+${PREMIUM_CUSTOMIZATIONS.filter(c => selectedIds.includes(c.id)).reduce((sum, c) => sum + c.price, 0)}</span>
         </div>
         <div className="border-t border-white/5 pt-2 flex justify-between items-center text-sm font-semibold">
           <span className="text-fbblue">Outstanding Account Surcharge</span>
           <span className="text-fbblue font-mono">${calculateTotalCost()}</span>
         </div>
      </div>

      <div className="flex justify-end mt-4">
         <button 
           onClick={handleSubmit}
           disabled={isSubmitting}
           className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-white text-black rounded-xl text-xs md:text-sm font-bold uppercase tracking-widest hover:bg-gray-200 transition-all font-sync disabled:opacity-50 shadow-xl"
         >
           {isSubmitting ? 'Saving Options...' : 'Add to Flight Options'}
           <Save className="w-4 h-4" />
         </button>
      </div>
    </div>
  );
}
