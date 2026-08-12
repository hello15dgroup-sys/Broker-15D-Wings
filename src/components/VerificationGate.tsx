import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, CheckCircle2, AlertTriangle, Loader2, ShieldCheck, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface VerificationGateProps {
  missionId: string;
  operatorId: string;
  docType: 'PERMIT' | 'CREW_LEGALITY' | 'FUEL_RECEIPT';
  onVerified: () => void;
  onCancel: () => void;
}

export default function VerificationGate({ missionId, operatorId, docType, onVerified, onCancel }: VerificationGateProps) {
  const [step, setStep] = useState<'METADATA' | 'UPLOAD' | 'PROCESSING' | 'RESULT'>('METADATA');
  const [metadata, setMetadata] = useState<Record<string, string>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<{ status: 'VERIFIED' | 'REJECTED'; message: string } | null>(null);

  const config = {
    PERMIT: {
      title: 'Landing / Overflight Permit',
      fields: [
        { key: 'permit_number', label: 'Permit Reference Number', placeholder: 'e.g. NCAA-PER-2026-X8' },
        { key: 'issued_by', label: 'Issuing Authority', placeholder: 'e.g. NCAA' },
        { key: 'expiry_date', label: 'Validity Expiry Date', type: 'date' }
      ]
    },
    FUEL_RECEIPT: {
      title: 'Fuel Evidence Receipt',
      fields: [
        { key: 'frn', label: 'Fuel Release Number (FRN)', placeholder: 'e.g. TE-LOS-928371' },
        { key: 'supplier', label: 'Supplier Name', placeholder: 'e.g. TotalEnergies' },
        { key: 'volume', label: 'Authorized Volume (Liters)', type: 'number' }
      ]
    },
    CREW_LEGALITY: {
      title: 'Crew Legality Lock',
      fields: [
        { key: 'pic_license', label: 'PIC License Number', placeholder: 'e.g. NGP-29381-ATP' },
        { key: 'medical_expiry', label: 'Medical Expiry Date', type: 'date' }
      ]
    }
  }[docType];

  const handleMetadataSubmit = () => {
    // Basic validation
    const missing = config.fields.some(f => !metadata[f.key]);
    if (missing) {
      alert("All security metadata fields must be manually typed.");
      return;
    }
    setStep('UPLOAD');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setStep('PROCESSING');

    try {
      // 1. Convert to base64 for Gemini processing in server
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64 = reader.result as string;

        // 2. Call the Machine Gatekeeper API
        const response = await fetch('/api/verify-document', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            missionId,
            operatorId,
            docType,
            typedMetadata: metadata,
            fileBase64: base64
          })
        });

        const data = await response.json() as any;
        
        // 3. Update DB through Supabase (Client Side for this demo)
        const { error: dbErr } = await supabase.from('mission_verifications').insert({
          mission_id: missionId,
          operator_id: operatorId,
          doc_type: docType,
          typed_metadata: metadata,
          status: data.status,
          file_url: data.file_url || 'dummy_url_verified',
          micro_timer_expiry: data.status === 'REJECTED' ? new Date(Date.now() + 20 * 60 * 1000).toISOString() : null
        });

        if (data.status === 'REJECTED') {
          // Log score decay
          await supabase.from('ors_ledger').insert({
            operator_id: operatorId,
            mission_id: missionId,
            fault_type: 'FAKE_DOCUMENTATION',
            delta_score: -2.5,
            reason: 'Metadata-document mismatch detected by AI audit.'
          });
          // Update operator score directly (in real app, use a trigger)
           await supabase.rpc('update_operator_score', { op_id: operatorId });
        }

        setResult(data);
        setStep('RESULT');
        if (data.status === 'VERIFIED') {
           setTimeout(onVerified, 2000);
        }
      };
    } catch (err) {
      console.error(err);
      setResult({ status: 'REJECTED', message: 'Engine communication fault.' });
      setStep('RESULT');
    }
  };

  return (
    <div className="w-full max-w-lg glass-vip border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl relative">
      <div className="absolute top-0 left-0 w-full h-1 bg-white/5 overflow-hidden">
        <motion.div 
          className="h-full bg-fbblue shadow-[0_0_10px_#1877F2]" 
          initial={{ width: '0%' }}
          animate={{ width: step === 'METADATA' ? '25%' : step === 'UPLOAD' ? '50%' : step === 'PROCESSING' ? '75%' : '100%' }}
        />
      </div>

      <div className="p-8 space-y-8">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <span className="ui-sync text-[8px] text-fbblue tracking-[0.3em] font-bold uppercase">Compliance Gate: {docType.replace('_', ' ')}</span>
            <h2 className="text-xl font-light text-white uppercase tracking-tight">{config.title}</h2>
          </div>
          <button onClick={onCancel} className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <AnimatePresence mode="wait">
          {step === 'METADATA' && (
            <motion.div key="metadata" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className="bg-fbblue/5 border border-fbblue/20 p-4 rounded-2xl flex gap-3 text-[10px] text-fbblue leading-relaxed font-light">
                <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0" />
                <p>Architects of Certainty: You must manually type document metadata below. These fields are instant-matched against your upload by the Automated Verification Engine.</p>
              </div>
              <div className="space-y-4">
                {config.fields.map(f => (
                  <div key={f.key}>
                    <label className="ui-sync text-[8px] text-gray-500 block ml-1 mb-2 uppercase">{f.label}</label>
                    <input 
                      type={f.type || 'text'}
                      value={metadata[f.key] || ''}
                      onChange={e => setMetadata(prev => ({ ...prev, [f.key]: e.target.value }))}
                      placeholder={f.placeholder}
                      className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-fbblue/50 transition-all font-light"
                    />
                  </div>
                ))}
              </div>
              <button onClick={handleMetadataSubmit} className="w-full bg-white text-black py-4 rounded-xl text-[10px] font-sync font-bold tracking-widest hover:bg-gray-200 transition-all shadow-lg uppercase">
                LOCK METADATA & CONTINUE
              </button>
            </motion.div>
          )}

          {step === 'UPLOAD' && (
            <motion.div key="upload" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
              <div className="border-2 border-dashed border-white/10 rounded-3xl p-12 flex flex-col items-center justify-center text-center space-y-4 hover:border-fbblue/40 transition-all cursor-pointer relative group">
                <input 
                  type="file" 
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer" 
                  accept=".pdf,.jpg,.jpeg,.png"
                />
                <div className="w-16 h-16 bg-fbblue/10 rounded-full flex items-center justify-center group-hover:bg-fbblue/20 transition-all">
                  <Upload className="w-6 h-6 text-fbblue" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-white">Upload Digital Evidence</p>
                  <p className="text-[10px] text-gray-500 ui-sync tracking-wider uppercase">PDF, JPG, or PNG under 10MB</p>
                </div>
              </div>

              <div className="bg-white/[0.02] border border-white/5 p-4 rounded-xl space-y-2">
                <span className="ui-sync text-[8px] text-gray-500 tracking-widest block uppercase">Locked Metadata Preview</span>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(metadata).map(([k, v]) => (
                    <div key={k}>
                      <span className="text-[8px] text-fbblue block font-light uppercase opacity-60">{k.replace('_', ' ')}</span>
                      <span className="text-[10px] text-white font-mono">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {step === 'PROCESSING' && (
            <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-12 flex flex-col items-center justify-center text-center space-y-6">
              <div className="relative">
                <div className="w-24 h-24 border-4 border-fbblue/20 border-t-fbblue rounded-full animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-white animate-pulse" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-light text-white uppercase tracking-widest">Verifying Certainty</h3>
                <p className="text-[10px] text-gray-500 ui-sync animate-pulse">MATCHING METADATA VIA AUTONOMOUS AI AUDIT...</p>
              </div>
            </motion.div>
          )}

          {step === 'RESULT' && result && (
            <motion.div key="result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="py-8 flex flex-col items-center text-center space-y-6">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center ${result.status === 'VERIFIED' ? 'bg-emerald-500/20 text-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 'bg-red-500/20 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.3)]'}`}>
                {result.status === 'VERIFIED' ? <CheckCircle2 className="w-10 h-10" /> : <AlertTriangle className="w-10 h-10" />}
              </div>
              <div className="space-y-2">
                <h3 className={`text-xl font-lexend tracking-[0.2em] font-bold ${result.status === 'VERIFIED' ? 'text-emerald-500' : 'text-red-500'}`}>
                  {result.status === 'VERIFIED' ? 'CERTAINTY SECURED' : 'MATCH FAILURE'}
                </h3>
                <p className="text-gray-400 text-xs font-light max-w-xs mx-auto leading-relaxed">{result.message}</p>
              </div>
              {result.status === 'REJECTED' && (
                <div className="w-full bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex flex-col items-center gap-2">
                  <span className="ui-sync text-[10px] text-red-500 font-bold uppercase tracking-widest">20-Minute Micro-Timer Activated</span>
                  <p className="text-[9px] text-red-500/60 leading-relaxed uppercase">Over-write with valid data immediately or risk mission un-assignment (ORS Decay: -2.50 pts).</p>
                  <button onClick={() => setStep('METADATA')} className="mt-4 px-8 py-2 bg-red-500 text-white rounded-lg text-[10px] font-sync font-bold tracking-widest hover:bg-red-600 transition-all uppercase">RE-SUBMIT DATA</button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="bg-white/[0.02] border-t border-white/5 p-4 text-center">
         <p className="text-[8px] text-gray-600 ui-sync tracking-widest uppercase">Verification protocol linked to Operational Reliability Score (ORS)</p>
      </div>
    </div>
  );
}
