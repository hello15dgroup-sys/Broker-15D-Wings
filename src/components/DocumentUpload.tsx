import React, { useState } from 'react';
import { Upload, CheckCircle2, ShieldCheck, Loader2 } from 'lucide-react';

const DOC_TYPES = [
  { id: 'id_principal', label: 'Executive Identification', description: 'Passport or Sovereign Identity Card' },
  { id: 'flight_docs', label: 'Flight Manifest', description: 'Verified passenger documentation' },
  { id: 'company_auth', label: 'Execution Authorization', description: 'Corporate mission clearance' },
];

export default function DocumentUpload({ missionId }: { missionId: string }) {
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [uploaded, setUploaded] = useState<Record<string, boolean>>({});

  const handleUpload = async (docId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading({ ...uploading, [docId]: true });

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('scope', 'mission');
      formData.append('id', missionId);
      formData.append('doc_type', docId);

      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Upload failed');
      
      setUploaded({ ...uploaded, [docId]: true });
    } catch (err) {
      console.error(err);
      alert('Failed to upload document to Edge Worker');
    } finally {
      setUploading({ ...uploading, [docId]: false });
    }
  };

  return (
    <div className="grid md:grid-cols-3 gap-6">
      {DOC_TYPES.map((doc) => {
        const isUploading = uploading[doc.id];
        const isUploaded = uploaded[doc.id];

        return (
          <label key={doc.id} className={`p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4 hover:border-fbblue/30 transition-all cursor-${isUploading || isUploaded ? 'default' : 'pointer'} group block relative`}>
            {!(isUploading || isUploaded) && (
              <input type="file" className="hidden" onChange={(e) => handleUpload(doc.id, e)} />
            )}
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform ${isUploaded ? 'bg-emerald-500/10 text-emerald-500' : 'bg-fbblue/10 text-fbblue group-hover:scale-110'}`}>
              {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : isUploaded ? <CheckCircle2 className="w-5 h-5" /> : <Upload className="w-5 h-5" />}
            </div>
            <div>
              <h4 className="text-white text-sm font-semibold mb-1">{doc.label}</h4>
              <p className="text-[10px] text-gray-500 leading-relaxed">{doc.description}</p>
            </div>
            <div className="pt-4 flex items-center justify-between">
              <span className={`font-lexend text-[8px] ${isUploaded ? 'text-emerald-500' : 'text-gray-600'}`}>{isUploading ? 'UPLOADING...' : isUploaded ? 'VERIFIED' : 'AWAITING'}</span>
              {isUploaded ? <ShieldCheck className="w-4 h-4 text-emerald-500" /> : <ShieldCheck className="w-4 h-4 text-white/10" />}
            </div>
          </label>
        );
      })}
    </div>
  );
}
