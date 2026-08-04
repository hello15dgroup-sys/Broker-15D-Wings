import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Loader2, Calendar, MapPin, Search } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { calculateMissionPricing } from '../lib/pricing';

interface RescheduleFlightFormProps {
  mission: any;
  onSuccess: () => void;
}

export default function RescheduleFlightForm({ mission, onSuccess }: RescheduleFlightFormProps) {
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [fromQuery, setFromQuery] = useState('');
  const [toQuery, setToQuery] = useState('');
  const [fromSuggestions, setFromSuggestions] = useState<any[]>([]);
  const [toSuggestions, setToSuggestions] = useState<any[]>([]);
  const [selectedFrom, setSelectedFrom] = useState<any>(null);
  const [selectedTo, setSelectedTo] = useState<any>(null);
  const [priceImpact, setPriceImpact] = useState(0);

  useEffect(() => {
    async function fetchMission() {
      if (mission) {
        if (mission.legs && mission.legs.length > 0) {
          const first = mission.legs[0];
          const last = mission.legs[mission.legs.length - 1];
          setFromQuery(first.fromFull || first.from);
          setToQuery(last.toFull || last.to);
          setNewDate(first.date || '');
        }
      }
      setLoading(false);
    }
    fetchMission();
  }, [mission]);

  useEffect(() => {
    let impact = 0;
    if (newDate) {
      // Standard schedule amendment premium
      impact += 1500;
      const isUrgent = ((new Date(newDate).getTime() - new Date().getTime()) / 3600000) < 72;
      if (isUrgent) impact += 4000;
    }
    if (selectedFrom || selectedTo) {
      impact += 4000; // Sector change impact fee of $4000
    }
    setPriceImpact(impact);
  }, [newDate, selectedFrom, selectedTo]);

  const searchAirports = async (q: string, type: 'from' | 'to') => {
    if (q.length < 2) {
      type === 'from' ? setFromSuggestions([]) : setToSuggestions([]);
      return;
    }
    try {
      const response = await fetch(`https://airfields.15d.name.ng/?q=${encodeURIComponent(q)}`);
      const data = await response.json();
      if (data) {
        const list = Object.keys(data).slice(0, 5).map(code => ({
          code,
          name: data[code].name,
          city: data[code].city
        }));
        type === 'from' ? setFromSuggestions(list) : setToSuggestions(list);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdate = async () => {
    if (!newDate) return alert("Please select a new date.");
    setUpdating(true);
    
    let updates = { version: (mission?.version || 0) + 1 } as any;
    const isUrgent = ((new Date(newDate).getTime() - new Date().getTime()) / 3600000) < 72;

    let finalLower = parseFloat(mission?.estimated_lower || "12000");
    let finalUpper = parseFloat(mission?.estimated_upper || "18000");

    if (mission?.legs && mission.legs.length > 0) {
        let legs = [...mission.legs];
        legs[0].date = newDate;
        
        const oldFrom = legs[0].from;
        const oldTo = legs[legs.length - 1].to;
        
        if (selectedFrom) {
           legs[0].from = selectedFrom.code;
           legs[0].fromFull = selectedFrom.name;
        }
        if (selectedTo) {
           legs[legs.length - 1].to = selectedTo.code;
           legs[legs.length - 1].toFull = selectedTo.name;
        }
        updates.legs = legs;

        if (selectedFrom || selectedTo) {
           // Rethink pricing based on new route
           const pax = mission.legs[0].pax || 1;
           const pricing = calculateMissionPricing([{from: legs[0].from, to: legs[legs.length - 1].to}], mission.aircraft_class || 'HEAVY', pax);
           finalLower = pricing.lower;
           finalUpper = pricing.upper;
           applyPriceChanges(finalLower, finalUpper, isUrgent, updates);
           return; // because it handles asynchronously
        }
    }

    applyPriceChanges(finalLower, finalUpper, isUrgent, updates);
  };

  const applyPriceChanges = async (lower: number, upper: number, isUrgent: boolean, updates: any) => {
    if (isUrgent) {
        lower += 4000;
        upper += 4000;
    }

    updates.estimated_lower = lower;
    updates.estimated_upper = upper;
    updates.etd = newDate;
    
    let originalBalance = parseFloat(mission?.outstanding_balance);
    if (isNaN(originalBalance)) originalBalance = 0;
    updates.outstanding_balance = originalBalance + priceImpact;
    
    const { error } = await supabase.from('missions').update({
        ...updates,
        updated_at: new Date().toISOString()
    }).eq('id', mission.id);
    
    if (error) {
        alert("Failed to update: " + error.message);
    } else {
        // Sync to Edge Engine Clock DO
        try {
          await fetch(`/api/clock/${mission.id}/schedule`, {
            method: 'POST',
            headers:{'Content-Type':'application/json'},
            body: JSON.stringify({ mission_id: mission.id, etd: newDate })
          });
        } catch (e) {
          console.warn("Clock Sync Failed - falling back", e);
        }

        // Call Pricing Engine Edge DO to finalize new estimate numbers
        try {
          await fetch(`/api/price/${mission.id}/calculate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              mission_id: mission.id,
              estimated_upper: upper,
              estimated_lower: lower 
            })
          });
        } catch (err) {
          console.warn("Pricing Engine DO sync failed", err);
        }

        // Sync local Client Portal DO
        try {
          await fetch(`/api/mission/${mission.id}/schedule/change`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
          });
        } catch (err) {
          console.warn("Client Portal DO sync failed", err);
        }

        // Send Email Comms
        try {
            await fetch('/api/comms/send', {
                method: 'POST',
                headers:{'Content-Type':'application/json'},
                body: JSON.stringify({
                    eventType: 'RESCHEDULE_CONFIRMED',
                    to: 'hello.15dgroup@gmail.com',
                    mission_id: mission.id,
                    metadata: { newDate, priceImpact }
                })
            });
        } catch (e) {
            console.warn("Comms Failed", e);
        }

        onSuccess();
    }
    setUpdating(false);
  };

  if (loading) return (
    <div className="p-8 flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-fbblue" />
    </div>
  );

  return (
    <div className="p-8 space-y-8 max-w-2xl mx-auto">
      <h2 className="monument text-lg text-slate-50 font-black tracking-widest text-center border-b border-white/10 pb-6 mb-6">RESCHEDULE PROTOCOL</h2>
      
      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] monument text-slate-50 tracking-widest font-black block">New Departure Date & Time</label>
          <div className="custom-datepicker-wrapper">
            <DatePicker
              selected={newDate ? new Date(newDate) : null}
              onChange={(date) => setNewDate(date ? date.toISOString() : '')}
              showTimeSelect
              dateFormat="MMMM d, yyyy h:mm aa"
              className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-4 text-white font-sync text-sm outline-none focus:border-fbblue transition-all cursor-pointer"
              placeholderText="Select date and time"
              wrapperClassName="w-full"
            />
          </div>
        </div>

        <div className="pt-6 border-t border-white/10 space-y-6">
          <p className="text-[10px] monument text-slate-50 font-black tracking-widest uppercase">Adjust Route (Optional)</p>
          
          <div className="relative">
            <label className="text-[10px] uppercase text-slate-400 mb-2 block">
              Departure Airport
              <span className="block text-[9px] text-gray-500 mt-0.5 normal-case font-light">(If airport is not listed, enter 4-letter ICAO or 3-letter IATA code)</span>
            </label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input 
                type="text" 
                placeholder="Search..." 
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-12 pr-4 py-4 text-white text-sm outline-none focus:border-fbblue transition-all uppercase"
                value={fromQuery}
                onChange={(e) => {
                  setFromQuery(e.target.value);
                  searchAirports(e.target.value, 'from');
                }}
              />
            </div>
            {fromSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-50 bg-[#090d16] border border-white/10 rounded-xl mt-1 overflow-hidden shadow-2xl">
                {fromSuggestions.map((s, i) => (
                  <div 
                    key={i} 
                    className="p-4 hover:bg-white/5 cursor-pointer border-b border-white/5 text-sm"
                    onClick={() => {
                      setSelectedFrom(s);
                      setFromQuery(`${s.code} | ${s.name}`);
                      setFromSuggestions([]);
                    }}
                  >
                    <b className="text-fbblue">{s.code}</b> — {s.name} ({s.city})
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            <label className="text-[10px] uppercase text-slate-400 mb-2 block">
              Arrival Airport
              <span className="block text-[9px] text-gray-500 mt-0.5 normal-case font-light">(If airport is not listed, enter 4-letter ICAO or 3-letter IATA code)</span>
            </label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input 
                type="text" 
                placeholder="Search..." 
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-12 pr-4 py-4 text-white text-sm outline-none focus:border-fbblue transition-all uppercase"
                value={toQuery}
                onChange={(e) => {
                  setToQuery(e.target.value);
                  searchAirports(e.target.value, 'to');
                }}
              />
            </div>
            {toSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-50 bg-[#090d16] border border-white/10 rounded-xl mt-1 overflow-hidden shadow-2xl">
                {toSuggestions.map((s, i) => (
                  <div 
                    key={i} 
                    className="p-4 hover:bg-white/5 cursor-pointer border-b border-white/5 text-sm"
                    onClick={() => {
                      setSelectedTo(s);
                      setToQuery(`${s.code} | ${s.name}`);
                      setToSuggestions([]);
                    }}
                  >
                    <b className="text-fbblue">{s.code}</b> — {s.name} ({s.city})
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="pt-6 border-t border-white/10 space-y-4 text-center">
            <div className="monument text-[10px] text-slate-400 tracking-widest uppercase">Estimated Impact</div>
            <div className="text-3xl font-black text-fbblue">
              {priceImpact > 0 ? `+$${priceImpact.toLocaleString()} (Added Logistics Fee)` : 'ORIGINAL ESTIMATE MAINTAINED'}
            </div>
            {priceImpact > 0 && <p className="text-[10px] text-gray-500 italic">Sector changes or 72-Hour Operational Window triggers recalculation.</p>}
        </div>

        <button 
          onClick={handleUpdate}
          disabled={updating || !newDate}
          className="w-full bg-white text-black py-4 rounded-xl text-xs font-bold font-sync tracking-widest disabled:opacity-50 hover:bg-gray-200 transition-all flex items-center justify-center gap-2 mt-8"
        >
          {updating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              SUBMITTING...
            </>
          ) : (
            'SUBMIT ADJUSTMENT'
          )}
        </button>
      </div>
    </div>
  );
}
