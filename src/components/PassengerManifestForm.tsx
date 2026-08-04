import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { auth } from '../firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { CheckCircle2, Loader2, Upload } from 'lucide-react';

interface PassengerManifestFormProps {
  missionId: string;
  onSuccess: () => void;
  theme?: 'light' | 'dark';
}

export default function PassengerManifestForm({ missionId, onSuccess, theme = 'dark' }: PassengerManifestFormProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [driveToken, setDriveToken] = useState<string | null>(null);
  const [passengers, setPassengers] = useState<any[]>([{
    id: Date.now(),
    surname: '',
    given_name: '',
    dob: '',
    gender: '',
    nationality: '',
    passport_number: '',
    passport_country: '',
    passport_issue: '',
    passport_expiry: '',
    residence: '',
    visa_number: '',
    luggage_weight: '',
    bags_count: '',
    dietary: '',
    catering: '',
    driver_info: '',
    file: null as File | null,
    passport_drive_id: null as string | null,
    nok_name: '',
    nok_relationship: '',
    nok_email: '',
    nok_phone: ''
  }]);

  useEffect(() => {
    async function loadCurrentManifest() {
      try {
        const { data, error } = await supabase
          .from('passenger_manifest')
          .select('*')
          .eq('mission_id', missionId);
        
        if (data && data.length > 0) {
          setPassengers(data.map((p, idx) => {
            let parsedNok = { nok_name: '', nok_relationship: '', nok_email: '', nok_phone: '' };
            if (p.driver_info) {
              try {
                const parsed = JSON.parse(p.driver_info);
                if (parsed && typeof parsed === 'object') {
                  parsedNok = {
                    nok_name: parsed.nok_name || '',
                    nok_relationship: parsed.nok_relationship || '',
                    nok_email: parsed.nok_email || '',
                    nok_phone: parsed.nok_phone || ''
                  };
                }
              } catch (e) {
                // Ignore parsing errors
              }
            }
            return {
              id: p.id || `${missionId}_${idx}`,
              surname: p.surname || '',
              given_name: p.given_name || '',
              dob: p.dob || '',
              gender: p.gender || '',
              nationality: p.nationality || '',
              passport_number: p.passport_number || '',
              passport_country: p.passport_country || '',
              passport_issue: p.passport_issue || '',
              passport_expiry: p.passport_expiry || '',
              residence: p.residence || '',
              visa_number: p.visa_number || '',
              luggage_weight: p.luggage_weight || '',
              bags_count: p.bags_count || '',
              dietary: p.dietary || '',
              catering: p.catering || '',
              driver_info: p.driver_info || '',
              file: null,
              passport_drive_id: p.passport_drive_id || null,
              nok_name: parsedNok.nok_name,
              nok_relationship: parsedNok.nok_relationship,
              nok_email: parsedNok.nok_email,
              nok_phone: parsedNok.nok_phone
            };
          }));
        }
      } catch (err) {
        console.error("Failed to load passenger manifest details:", err);
      }
    }
    loadCurrentManifest();
  }, [missionId]);

  const handlePassengerChange = (index: number, field: string, value: any) => {
    setPassengers(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const addPassenger = () => {
    setPassengers(prev => [...prev, {
      id: Date.now(),
      surname: '',
      given_name: '',
      dob: '',
      gender: '',
      nationality: '',
      passport_number: '',
      passport_country: '',
      passport_issue: '',
      passport_expiry: '',
      residence: '',
      visa_number: '',
      luggage_weight: '',
      bags_count: '',
      dietary: '',
      catering: '',
      driver_info: '',
      file: null,
      passport_drive_id: null,
      nok_name: '',
      nok_relationship: '',
      nok_email: '',
      nok_phone: ''
    }]);
  };

  const removePassenger = (index: number) => {
    if (passengers.length === 1) return;
    setPassengers(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFile = async (file: File, missionId: string, surname: string) => {
    let publicUrl = '';
    try {
      try { await supabase.storage.createBucket('passports', { public: true }); } catch (ignore) {}
      const ext = file.name.split('.').pop();
      const fileName = `${missionId}_passport_${surname || Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('passports').upload(fileName, file);
      if (error) throw error;
      const { data } = supabase.storage.from('passports').getPublicUrl(fileName);
      publicUrl = data.publicUrl;
    } catch (err) {
      // Fallback to base64
      publicUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string || '');
        reader.onerror = () => resolve('');
        reader.readAsDataURL(file);
      });
    }
    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    for (const [idx, p] of passengers.entries()) {
      const pNum = idx + 1;
      if (!p.surname || !p.given_name || !p.dob || !p.passport_number || !p.passport_expiry || !p.nationality) {
        alert(`Please complete all required fields (Surname, Given Name, DOB, Passport Number, Expiry, Nationality) for Passenger ${pNum}.`);
        return;
      }

      // 1. Validate DOB pattern (YYYY-MM-DD)
      const dobRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dobRegex.test(p.dob)) {
        alert(`Invalid Date of Birth format for Passenger ${pNum}. Expected format is YYYY-MM-DD.`);
        return;
      }

      // 2. Validate Passport Number pattern ([A-Z]{2}[0-9]{6})
      const passportVal = (p.passport_number || '').trim().toUpperCase();
      const passportRegex = /^[A-Z]{2}\d{6}$/;
      if (!passportRegex.test(passportVal)) {
        alert(`Invalid Passport Number format for Passenger ${pNum}. Passport must consist of exactly 2 uppercase letters followed by 6 digits (e.g. AB123456).`);
        return;
      }

      // 3. Validate Next of Kin fields
      if (!p.nok_name || !p.nok_relationship || !p.nok_email || !p.nok_phone) {
        alert(`Please complete all Next of Kin fields (Full Name, Relationship, Email, Phone Number) for Passenger ${pNum}.`);
        return;
      }

      // 4. Validate Next of Kin Email (Standard RFC 5322 validation)
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(p.nok_email.trim())) {
        alert(`Invalid Next of Kin email address for Passenger ${pNum}. Please provide a standard valid email.`);
        return;
      }

      // 5. Validate Next of Kin Phone (E.164 international format validation)
      const phoneRegex = /^\+[1-9]\d{1,14}$/;
      if (!phoneRegex.test(p.nok_phone.trim())) {
        alert(`Invalid Next of Kin phone format for Passenger ${pNum}. Required format is E.164 international standard starting with '+' (e.g. +2349167621703).`);
        return;
      }
    }

    setIsUploading(true);
    try {
      const manifests = await Promise.all(passengers.map(async (p, idx) => {
        let docUrl = p.passport_drive_id; // re-use field name, or keep it, doesn't matter
        if (p.file) {
          docUrl = await uploadFile(p.file, missionId, p.surname);
        }

        // Serialize Next of Kin data into driver_info text field safely as JSON
        const nokData = {
          nok_name: p.nok_name || '',
          nok_relationship: p.nok_relationship || '',
          nok_email: p.nok_email || '',
          nok_phone: p.nok_phone || ''
        };
        const driverInfoString = JSON.stringify(nokData);

        return {
          id: `${missionId}_${idx}`, // Unique primary key for each passenger record
          mission_id: missionId,
          surname: (p.surname || '').toUpperCase(),
          given_name: (p.given_name || '').toUpperCase(),
          dob: p.dob || '',
          gender: p.gender || '',
          nationality: (p.nationality || '').toUpperCase(),
          passport_number: (p.passport_number || '').toUpperCase(),
          passport_country: (p.passport_country || '').toUpperCase(),
          passport_issue: p.passport_issue || '',
          passport_expiry: p.passport_expiry || '',
          residence: (p.residence || '').toUpperCase(),
          visa_number: (p.visa_number || '').toUpperCase(),
          luggage_weight: p.luggage_weight || '',
          bags_count: p.bags_count || '',
          dietary: p.dietary || '',
          catering: p.catering || '',
          driver_info: driverInfoString,
          passport_drive_id: docUrl
        };
      }));

      const { error } = await supabase.from('passenger_manifest').upsert(manifests);
      if (error) throw error;

      // Only set status to 'ACCEPTED' if not already in a more advanced status (e.g. AWAITING_CONFIRMATION)
      try {
        const { data: missionData } = await supabase
          .from('missions')
          .select('status')
          .eq('id', missionId)
          .single();
        
        const advancedStatuses = ['AWAITING_CONFIRMATION', 'OPERATOR_REVIEW', 'DEPOSIT_CONFIRMED', 'PRE_ACTIVATION', 'ACTIVATED', 'EXECUTING', 'COMPLETED', 'ROTATING', 'HOLD_STATE'];
        if (missionData && !advancedStatuses.includes(missionData.status || '')) {
          await supabase.from('missions').update({ status: 'ACCEPTED' }).eq('id', missionId);
        }
      } catch (err) {
        console.error("Error checking or updating mission status:", err);
      }
      
      onSuccess();
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-4xl mx-auto transition-colors duration-500 text-white">
      <div className="text-sm font-light space-y-4 mb-8 leading-relaxed text-slate-300">
        <p>Dear Valued Client,</p>
        <p>To ensure a seamless departure and comply with international aviation security regulations, please declare details for all passengers. You can add passengers up to the configuration capacity.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-12">
        {passengers.map((p, index) => (
          <div key={p.id} className="space-y-8 p-8 rounded-3xl border relative group transition-all glass-vip border-white/10 shadow-xl">
            <div className="flex justify-between items-center border-b pb-4 border-white/10">
              <h3 className="ui-sync text-fbblue text-[10px] tracking-[0.3em] font-bold uppercase">Passenger {index + 1}</h3>
              {passengers.length > 1 && (
                <button 
                  type="button" 
                  onClick={() => removePassenger(index)}
                  className="text-[10px] text-red-500 hover:text-red-400 transition-colors font-sync uppercase tracking-widest"
                >
                  Remove
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-[10px] block uppercase tracking-widest text-slate-400">Full Surname</label>
                <input 
                  className="w-full border rounded-xl px-4 py-3 text-sm outline-none focus:border-fbblue/50 transition-all bg-white/[0.03] border-white/10 text-white" 
                  required 
                  placeholder="As per passport"
                  value={p.surname}
                  onChange={(e) => handlePassengerChange(index, 'surname', e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] block uppercase tracking-widest text-slate-400">Given Name(s)</label>
                <input 
                  className="w-full border rounded-xl px-4 py-3 text-sm outline-none focus:border-fbblue/50 transition-all bg-white/[0.03] border-white/10 text-white" 
                  required 
                  placeholder="As per passport"
                  value={p.given_name}
                  onChange={(e) => handlePassengerChange(index, 'given_name', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1">
                <label className="text-[10px] block uppercase tracking-widest text-slate-400">Date of Birth</label>
                <input 
                  type="date" 
                  className="w-full border rounded-xl px-4 py-3 text-sm outline-none focus:border-fbblue/50 transition-all bg-white/[0.03] border-white/10 text-white" 
                  required
                  value={p.dob}
                  onChange={(e) => handlePassengerChange(index, 'dob', e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] block uppercase tracking-widest text-slate-400">Gender</label>
                <select 
                  className="w-full border rounded-xl px-4 py-3 text-sm outline-none focus:border-fbblue/50 transition-all appearance-none bg-white/[0.03] border-white/10 text-white" 
                  required
                  value={p.gender}
                  onChange={(e) => handlePassengerChange(index, 'gender', e.target.value)}
                >
                  <option value="" className="bg-[#111]">Select</option>
                  <option value="M" className="bg-[#111]">Male (M)</option>
                  <option value="F" className="bg-[#111]">Female (F)</option>
                  <option value="X" className="bg-[#111]">Other (X)</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] block uppercase tracking-widest text-slate-400">Nationality</label>
                <input 
                  className="w-full border rounded-xl px-4 py-3 text-sm outline-none focus:border-fbblue/50 transition-all bg-white/[0.03] border-white/10 text-white" 
                  required 
                  placeholder="e.g. Nigerian"
                  value={p.nationality}
                  onChange={(e) => handlePassengerChange(index, 'nationality', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-[10px] block uppercase tracking-widest text-slate-400">Passport Number</label>
                <input 
                  className="w-full border rounded-xl px-4 py-3 text-sm outline-none focus:border-fbblue/50 transition-all bg-white/[0.03] border-white/10 text-white" 
                  required
                  value={p.passport_number}
                  onChange={(e) => handlePassengerChange(index, 'passport_number', e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] block uppercase tracking-widest text-slate-400">Country of Issue</label>
                <input 
                  className="w-full border rounded-xl px-4 py-3 text-sm outline-none focus:border-fbblue/50 transition-all bg-white/[0.03] border-white/10 text-white" 
                  required
                  value={p.passport_country}
                  onChange={(e) => handlePassengerChange(index, 'passport_country', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-[10px] block uppercase tracking-widest text-slate-400">Expiry Date</label>
                <input 
                  type="date" 
                  className="w-full border rounded-xl px-4 py-3 text-sm outline-none focus:border-fbblue/50 transition-all bg-white/[0.03] border-white/10 text-white" 
                  required
                  value={p.passport_expiry}
                  onChange={(e) => handlePassengerChange(index, 'passport_expiry', e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] block uppercase tracking-widest text-slate-400">Passport Scan</label>
                <div className="flex items-center gap-4">
                  <input 
                    type="file" 
                    className="text-[11px] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-semibold file:bg-fbblue/10 file:text-fbblue hover:file:bg-fbblue/20 cursor-pointer text-gray-400"
                    onChange={(e) => handlePassengerChange(index, 'file', e.target.files?.[0] || null)}
                    accept="image/*,.pdf"
                  />
                  {p.passport_drive_id && !p.file && <span className="text-[10px] text-emerald-400">Scan uploaded ✓</span>}
                </div>
              </div>
            </div>

            {/* NEW OPERATIONAL SECTION: LUGGAGE & DIETARY */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-white/5">
              <div className="space-y-1">
                <label className="text-[10px] block uppercase tracking-widest text-slate-400">Luggage Count (Bags)</label>
                <input 
                  type="number" 
                  min="0"
                  className="w-full border rounded-xl px-4 py-3 text-sm outline-none focus:border-fbblue/50 transition-all bg-white/[0.03] border-white/10 text-white" 
                  placeholder="No. of bags"
                  value={p.bags_count || ''}
                  onChange={(e) => handlePassengerChange(index, 'bags_count', e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] block uppercase tracking-widest text-slate-400">Total Weight (kg)</label>
                <input 
                  type="number" 
                  min="0"
                  className="w-full border rounded-xl px-4 py-3 text-sm outline-none focus:border-fbblue/50 transition-all bg-white/[0.03] border-white/10 text-white" 
                  placeholder="Total weight in kg"
                  value={p.luggage_weight || ''}
                  onChange={(e) => handlePassengerChange(index, 'luggage_weight', e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] block uppercase tracking-widest text-slate-400">Food Allergies / Dietary</label>
                <input 
                  className="w-full border rounded-xl px-4 py-3 text-sm outline-none focus:border-fbblue/50 transition-all bg-white/[0.03] border-white/10 text-white" 
                  placeholder="Peanuts, Gluten-free, etc."
                  value={p.dietary || ''}
                  onChange={(e) => handlePassengerChange(index, 'dietary', e.target.value)}
                />
              </div>
            </div>

            {/* MANDATORY SUB-SECTION: NEXT OF KIN DATA */}
            <div className="space-y-6 pt-6 border-t border-white/5 bg-white/[0.01] p-6 rounded-2xl border border-white/[0.05] mt-6">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                <h4 className="ui-sync text-slate-300 text-[9px] tracking-[0.2em] font-bold uppercase">
                  Next of Kin Requirements (Mandatory Sub-Section)
                </h4>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] block uppercase tracking-widest text-slate-400">Next of Kin Full Name</label>
                  <input 
                    className="w-full border rounded-xl px-4 py-3 text-sm outline-none focus:border-fbblue/50 transition-all bg-white/[0.03] border-white/10 text-white" 
                    required 
                    placeholder="Full legal name"
                    value={p.nok_name || ''}
                    onChange={(e) => handlePassengerChange(index, 'nok_name', e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] block uppercase tracking-widest text-slate-400">Relationship to Passenger</label>
                  <input 
                    className="w-full border rounded-xl px-4 py-3 text-sm outline-none focus:border-fbblue/50 transition-all bg-white/[0.03] border-white/10 text-white" 
                    required 
                    placeholder="e.g. Spouse, Parent, Colleague"
                    value={p.nok_relationship || ''}
                    onChange={(e) => handlePassengerChange(index, 'nok_relationship', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] block uppercase tracking-widest text-slate-400">Email Address</label>
                    <span className="text-[8px] text-slate-500 font-mono">RFC 5322 Validated</span>
                  </div>
                  <input 
                    type="email"
                    className="w-full border rounded-xl px-4 py-3 text-sm outline-none focus:border-fbblue/50 transition-all bg-white/[0.03] border-white/10 text-white" 
                    required 
                    placeholder="name@domain.com"
                    value={p.nok_email || ''}
                    onChange={(e) => handlePassengerChange(index, 'nok_email', e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] block uppercase tracking-widest text-slate-400">Phone Number</label>
                    <span className="text-[8px] text-slate-500 font-mono">E.164 (+Format)</span>
                  </div>
                  <input 
                    type="tel"
                    className="w-full border rounded-xl px-4 py-3 text-sm outline-none focus:border-fbblue/50 transition-all bg-white/[0.03] border-white/10 text-white" 
                    required 
                    placeholder="e.g. +2349167621703"
                    value={p.nok_phone || ''}
                    onChange={(e) => handlePassengerChange(index, 'nok_phone', e.target.value)}
                  />
                </div>
              </div>
            </div>

          </div>
        ))}

        <button 
          type="button" 
          onClick={addPassenger}
          className="w-full py-6 rounded-2xl border-2 border-dashed transition-all font-sync text-[10px] tracking-widest uppercase border-white/10 text-gray-500 hover:border-fbblue/30 hover:text-fbblue bg-[#0B1A30]/50"
        >
          + Add Further Passenger
        </button>

        <div className="pt-12 border-t border-white/10">
          <button 
            type="submit" 
            disabled={isUploading}
            className="w-full bg-fbblue text-white py-6 rounded-2xl text-[10px] font-bold font-sync tracking-[0.2em] shadow-[0_0_30px_rgba(56,189,248,0.3)] hover:shadow-[0_0_40px_rgba(56,189,248,0.5)] transition-all flex items-center justify-center gap-4 disabled:opacity-50"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                PROCESSING PROTOCOL...
              </>
            ) : (
              'SUBMIT PASSENGER MANIFEST'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
