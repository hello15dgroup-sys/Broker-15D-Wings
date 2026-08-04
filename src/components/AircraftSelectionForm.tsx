import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { calculateMissionPricing } from '../lib/pricing';

import heavyJetImg from '../assets/images/heavy_challenger_650_1780611482208.png';
import ultraImg from '../assets/images/ultra_g650er_1780611495733.png';

interface AircraftSelectionFormProps {
  mission: any;
  onSuccess: () => void;
}

const AIRCRAFT_FALLBACKS = [
    { category: "HEAVY JET", label: "Bombardier Challenger 650", models: "Challenger 605, Falcon 900", pax: 14, image: heavyJetImg, tour: "https://my.matterport.com/show/?m=challenger605example", tail_number: "N650CL", model: "Challenger 650", manufacturer: "Bombardier" },
    { category: "HEAVY JET", label: "Gulfstream G450", models: "Gulfstream G450, GIV-SP", pax: 14, image: heavyJetImg, tour: "https://my.matterport.com/show/?m=challenger605example", tail_number: "N450GA", model: "G450", manufacturer: "Gulfstream" },
    { category: "HEAVY JET", label: "Dassault Falcon 2000LX", models: "Falcon 2000S, Falcon 900LX", pax: 10, image: heavyJetImg, tour: "https://my.matterport.com/show/?m=challenger605example", tail_number: "N2000F", model: "Falcon 2000LX", manufacturer: "Dassault" },
    { category: "ULTRA LONG RANGE", label: "Gulfstream G650ER", models: "Global 6000, Gulfstream G550", pax: 19, image: ultraImg, tour: "https://my.matterport.com/show/?m=global6000example", tail_number: "N650ER", model: "G650ER", manufacturer: "Gulfstream" }
];

export default function AircraftSelectionForm({ mission, onSuccess }: AircraftSelectionFormProps) {
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [aircraftList, setAircraftList] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [customAircraft, setCustomAircraft] = useState('');
  const [viewingTour, setViewingTour] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      const { data: acData } = await supabase.from('aircrafts').select('*').limit(50);
      
      let list = AIRCRAFT_FALLBACKS;
      if (acData && acData.length > 0) {
         // Filter to only include Heavy, Large, Ultra range, or models known to be heavy
         const heavyAcData = acData.filter(a => {
           const typeUpper = (a.Type || a.type || a.Category || a.category || '').toUpperCase();
           const modelUpper = (a.Model || a.model || '').toUpperCase();
           const manufacturerUpper = (a.Manufacturer || '').toUpperCase();
           
           return typeUpper.includes('HEAVY') || 
                  typeUpper.includes('LARGE') || 
                  typeUpper.includes('ULTRA') || 
                  typeUpper.includes('LONG RANGE') ||
                  modelUpper.includes('650') ||
                  modelUpper.includes('CHALLENGER') ||
                  modelUpper.includes('GULFSTREAM') ||
                  modelUpper.includes('FALCON') ||
                  modelUpper.includes('G450') ||
                  modelUpper.includes('G550') ||
                  manufacturerUpper.includes('GULFSTREAM') ||
                  manufacturerUpper.includes('BOMBARDIER') ||
                  manufacturerUpper.includes('DASSAULT');
         });

         if (heavyAcData.length > 0) {
           list = heavyAcData.map(a => {
               const manufacturer = a.Manufacturer || '';
               const model = a.Model || a.model || '';
               const label = (manufacturer && model) ? `${manufacturer} ${model}` : (model || a.Type || a.type || 'Unknown Aircraft');
               const category = a.Type || a.type || a.Category || a.category || 'Heavy Jet';
               const models = a.Type || a.type || 'Standard Asset';
               
               const typeUpper = (a.Type || a.type || '').toUpperCase();
               let fallbackImage = heavyJetImg;
               let fallbackTour = AIRCRAFT_FALLBACKS[0].tour;
               
               if (typeUpper.includes('ULTRA') || typeUpper.includes('LONG') || typeUpper.includes('REGIONAL')) {
                 fallbackImage = ultraImg;
                 fallbackTour = AIRCRAFT_FALLBACKS[3].tour;
               }
  
               let pax = Number(a.Max_Passengers || a.capacity || a.max_passengers || 0);
               let image = fallbackImage;
               try {
                  if (Array.isArray(a.images) && a.images.length > 0) {
                      image = a.images[0];
                  } else if (typeof a.images === 'string' && a.images.length > 0) {
                      const parsed = JSON.parse(a.images);
                      if (Array.isArray(parsed) && parsed.length > 0) {
                          image = parsed[0];
                      } else {
                          image = a.images;
                      }
                  } else if (a.image) {
                      image = a.image;
                  }
               } catch (e) {
                   if (typeof a.images === 'string' && a.images.startsWith('http')) {
                       image = a.images;
                   }
               }
               const tour = a.virtual_tour_url || a.virtual_tour || fallbackTour;
               return {
                   category,
                   label,
                   models,
                   pax,
                   image,
                   tour,
                   tail_number: a.tail_number || 'N' + Math.floor(100 + Math.random() * 900) + 'D',
                   model: model || a.Model || a.model || '',
                   manufacturer: manufacturer || a.Manufacturer || ''
               };
           });
         }
      }
      setAircraftList(list);

      let foundIdx = list.findIndex(a => 
        (a.label && a.label === mission?.aircraft_class) || 
        (a.category && a.category === mission?.aircraft_class) || 
        (a.label && a.label === mission?.operator_aircraft) ||
        (a.category && a.category === mission?.operator_aircraft)
      );
      if (foundIdx !== -1) {
        setSelectedCategory(foundIdx.toString());
      } else if (mission?.aircraft_class) {
        setCustomAircraft(mission.aircraft_class);
        setSelectedCategory("custom");
      }
      setLoading(false);
    }
    fetchData();
  }, [mission]);

  const handleUpdate = async () => {
    if (!selectedCategory) return;
    setUpdating(true);
    
    // get actual label from list or custom
    let actualCategory = '';
    let selectedTail = 'N650CL'; // fallback tail
    let selectedModel = 'Challenger 650'; // fallback model
    let selectedManufacturer = 'Bombardier'; // fallback manufacturer
    let selectedType = 'Heavy Jet';

    if (selectedCategory === 'custom') {
      actualCategory = customAircraft;
      selectedTail = 'CUSTOM';
      selectedModel = customAircraft || 'Custom Aircraft';
      selectedManufacturer = 'Custom';
      selectedType = 'Custom';
    } else {
      const idx = parseInt(selectedCategory || '');
      if (!isNaN(idx) && aircraftList[idx]) {
        const item = aircraftList[idx];
        actualCategory = item.label;
        selectedTail = item.tail_number || 'N650CL';
        selectedModel = item.model || item.label || 'Challenger 650';
        selectedManufacturer = item.manufacturer || 'Bombardier';
        selectedType = item.category || 'Heavy Jet';
      } else {
        actualCategory = customAircraft || selectedCategory || '';
        selectedTail = 'CUSTOM';
        selectedModel = actualCategory;
        selectedManufacturer = 'Custom';
        selectedType = 'Custom';
      }
    }

    let updates = { 
        version: (mission?.version || 0) + 1,
        aircraft_class: actualCategory,
        operator_aircraft: actualCategory,
        raw_payload: {
           ...(mission?.raw_payload || {}),
           selected_aircraft: actualCategory,
           aircraft_class: actualCategory,
           aircraft_text: actualCategory,
           tail_number: selectedTail,
           model: selectedModel
        }
    } as any;

    if (mission?.legs && mission.legs.length > 0) {
      try {
        const pax = mission.legs[0].pax || 1;
        const pricing = calculateMissionPricing(mission.legs, actualCategory, pax);
        updates.estimated_lower = pricing.lower;
        updates.estimated_upper = pricing.upper;
        
        const isUrgent = ((new Date(mission.legs[0].date).getTime() - new Date().getTime()) / 3600000) < 72;
        if (isUrgent) {
           updates.estimated_lower += 4000;
           updates.estimated_upper += 4000;
        }

        await applyUpdate(updates, actualCategory, selectedTail, selectedModel, selectedManufacturer, selectedType);
      } catch (err) {
        console.error("Pricing import/calc error:", err);
        await applyUpdate(updates, actualCategory, selectedTail, selectedModel, selectedManufacturer, selectedType);
      }
      return;
    }

    await applyUpdate(updates, actualCategory, selectedTail, selectedModel, selectedManufacturer, selectedType);
  };

  const applyUpdate = async (updates: any, catValue: string, tail: string, model: string, manufacturer: string, category: string) => {
    // 1. First write to the public.mission_aircraft and public.mission_aircrafts tables
    const accessToken = mission?.raw_payload?.access_token || '';
    try {
      const { error: maError } = await supabase
        .from('mission_aircraft')
        .upsert({
          mission_id: mission.id,
          tail_number: tail,
          model: model,
          manufacturer: manufacturer,
          category: category
        }, { onConflict: 'mission_id' });

      if (maError) {
        console.warn("Could not write to mission_aircraft table:", maError);
      }
    } catch (err) {
      console.warn("Exception writing to mission_aircraft table:", err);
    }

    try {
      const { error: masError } = await supabase
        .from('mission_aircrafts')
        .upsert({
          mission_id: mission.id,
          aircraft_name: catValue || model || 'Custom Aircraft',
          tail_number: tail,
          model: model,
          category: category,
          access_token: accessToken
        }, { onConflict: 'mission_id' });

      if (masError) {
        console.warn("Could not write to mission_aircrafts table:", masError);
      }
    } catch (err) {
      console.warn("Exception writing to mission_aircrafts table:", err);
    }

    // Sync asset configuration to public.mission_customizations table as requested
    try {
      const { data: existingCustom } = await supabase
        .from('mission_customizations')
        .select('*')
        .eq('mission_id', mission.id)
        .maybeSingle();

      const aircraftLine = `[AIRCRAFT CONFIGURATION]: Select ${catValue} (Tail: ${tail}, Model: ${model})`;
      let finalCustomDetails = aircraftLine;
      let existingCCI = 'CCI-1';
      let existingClassification = 'Light Tailoring';
      let existingSupport = 'Soft Secondary Asset Alerts';

      if (existingCustom) {
        existingCCI = existingCustom.cci_level || 'CCI-1';
        existingClassification = existingCustom.classification || 'Light Tailoring';
        existingSupport = existingCustom.system_support || 'Soft Secondary Asset Alerts';
        
        // Filter out existing [AIRCRAFT CONFIGURATION] line if any, and merge
        const otherLines = (existingCustom.request_details || '')
          .split('\n')
          .filter((line: string) => !line.includes('[AIRCRAFT CONFIGURATION]'))
          .join('\n');
        
        finalCustomDetails = otherLines ? `${aircraftLine}\n${otherLines}` : aircraftLine;
      }

      // Determine CCI for the aircraft class
      const typeUpper = category.toUpperCase();
      if (typeUpper.includes('ULTRA') || typeUpper.includes('LONG')) {
        existingCCI = 'CCI-3';
        existingClassification = 'Critical Support';
        existingSupport = 'API-Driven Standby & Route Mapping';
      } else if (typeUpper.includes('HEAVY') || typeUpper.includes('LARGE')) {
        if (existingCCI !== 'CCI-3') {
          existingCCI = 'CCI-2';
          existingClassification = 'Operational Tailoring';
          existingSupport = 'Active Standby Pre-Verification';
        }
      }

      // Upsert customized attributes as demanded by user intent
      if (existingCustom?.id) {
        await supabase
          .from('mission_customizations')
          .update({
            cci_level: existingCCI,
            classification: existingClassification,
            request_details: finalCustomDetails,
            system_support: existingSupport,
            status: 'APPROVED'
          })
          .eq('id', existingCustom.id);
      } else {
        await supabase.from('mission_customizations').insert({
          mission_id: mission.id,
          cci_level: existingCCI,
          classification: existingClassification,
          request_details: finalCustomDetails,
          system_support: existingSupport,
          status: 'APPROVED'
        });
      }
    } catch (err) {
      console.warn("Could not sync customization during aircraft selection:", err);
    }

    // 2. Write to main mission table
    const { error } = await supabase.from('missions').update(updates).eq('id', mission.id);
    if (error) {
        alert("Failed to update: " + error.message);
    } else {
        try {
          await fetch(`/api/mission/${mission.id}/flight/change`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              aircraftClass: catValue,
              legs: mission.legs,
              tailNumber: tail,
              modelName: model
            })
          });
        } catch (err) {
          console.warn("Client Portal DO sync failed", err);
        }

        // Call Pricing Engine Edge DO to finalize new estimate numbers
        if (updates.estimated_upper) {
          try {
            await fetch(`/api/price/${mission.id}/calculate`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                mission_id: mission.id,
                estimated_upper: updates.estimated_upper,
                estimated_lower: updates.estimated_lower 
              })
            });
          } catch (err) {
            console.warn("Pricing Engine DO sync failed", err);
          }
        }

        window.postMessage({ type: 'AIRCRAFT_SUCCESS', missionId: mission.id }, '*');
        onSuccess();
    }
    setUpdating(false);
  };

  if (loading) return (
    <div className="p-8 flex flex-col items-center justify-center space-y-4">
      <Loader2 className="w-8 h-8 animate-spin text-fbblue" />
      <p className="text-xs text-gray-400 font-sync tracking-widest">FETCHING FLEET...</p>
    </div>
  );

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 max-w-2xl mx-auto w-full">
      <div className="text-center space-y-2 mb-6 md:mb-8">
        <h2 className="monument text-base md:text-lg text-slate-50 font-black tracking-widest">SELECT AIRCRAFT</h2>
        <p className="text-[10px] text-fbblue font-sync tracking-widest">VIRTUAL TOURS ENABLED</p>
      </div>
      
      <div className="space-y-4">
          {aircraftList.map((a, idx) => (
            <div 
              key={idx}
              className={`p-3 md:p-4 rounded-xl flex flex-row items-center gap-3 md:gap-4 transition-all border-2 cursor-pointer ${selectedCategory === idx.toString() ? 'border-fbblue bg-fbblue/10 shadow-[0_0_20px_rgba(56,189,248,0.2)]' : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.05]'}`}
              onClick={() => setSelectedCategory(idx.toString())}
            >
                <div className="relative group shrink-0">
                    <img 
                      src={a.image} 
                      alt={a.label} 
                      referrerPolicy="no-referrer" 
                      className="w-20 h-14 md:w-24 md:h-16 object-cover rounded-lg border border-white/10" 
                    />
                    {a.tour && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); setViewingTour(a.tour); }}
                            className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center text-[8px] text-white font-bold rounded-lg"
                        >
                            3D TOUR
                        </button>
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <span className="block font-black text-slate-50 uppercase mb-0.5 md:mb-1 text-xs md:text-sm truncate">{a.label}</span>
                    <span className="block text-[9px] md:text-[10px] text-slate-400 font-medium truncate">Models: {a.models} | Max Pax: {a.pax}</span>
                </div>
                <div className="flex flex-col items-end gap-1 md:gap-2 shrink-0">
                    {selectedCategory === idx.toString() && <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-fbblue" />}
                    {a.tour && (
                         <span className="text-[7px] md:text-[8px] text-fbblue font-sync tracking-tighter">VR READY</span>
                    )}
                </div>
            </div>
          ))}
      </div>

      <div className="pt-6 border-t border-white/10 space-y-4">
          <p className="text-[10px] monument text-slate-400 tracking-widest uppercase">Or Type Desired Aircraft Bespoke</p>
          <div className="relative">
              <input 
                type="text"
                placeholder="E.g. Gulfstream G650ER, Falcon 8X..."
                value={customAircraft}
                onChange={(e) => {
                  setCustomAircraft(e.target.value);
                  setSelectedCategory(e.target.value ? 'custom' : null);
                }}
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 md:py-4 text-white text-xs md:text-sm outline-none focus:border-fbblue transition-all"
              />
          </div>
          {customAircraft && (
            <p className="text-[10px] text-fbblue italic">Bespoke Option Selected: "{customAircraft}"</p>
          )}
      </div>

      {viewingTour && (
          <div className="fixed inset-0 z-[300] bg-black/95 flex flex-col p-4 animate-in fade-in zoom-in duration-300">
              <div className="flex justify-between items-center mb-4">
                  <span className="monument text-[10px] text-white tracking-widest">VIRTUAL TOUR SESSION</span>
                  <button onClick={() => setViewingTour(null)} className="text-white text-[10px] md:text-xs font-bold bg-white/10 px-3 md:px-4 py-2 rounded-full uppercase">Exit Tour</button>
              </div>
              <iframe src={viewingTour} className="flex-1 w-full rounded-2xl border border-white/10" allowFullScreen />
          </div>
      )}

      <button 
        onClick={handleUpdate}
        disabled={updating || !selectedCategory}
        className="w-full bg-white text-black py-3.5 md:py-4 rounded-xl text-[10px] md:text-xs font-bold font-sync tracking-widest disabled:opacity-50 hover:bg-fbblue hover:text-white transition-all transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 mt-6 md:mt-8 shadow-xl"
      >
        {updating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            UPDATING...
          </>
        ) : (
          'CONFIRM AIRCRAFT SELECTION'
        )}
      </button>
    </div>
  );
}
