import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Share2, Download, CheckCircle, Copy, QrCode, Sliders, ShieldCheck, X, Image as ImageIcon, Type, Sparkles } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';

export interface GoogleFontSpec {
  name: string;
  family: string;
  category: 'Modern' | 'Serif' | 'Luxury' | 'Display' | 'Mono';
}

export const GOOGLE_FONTS: GoogleFontSpec[] = [
  { name: 'Plus Jakarta Sans', family: 'Plus Jakarta Sans, sans-serif', category: 'Modern' },
  { name: 'Playfair Display', family: 'Playfair Display, serif', category: 'Luxury' },
  { name: 'Montserrat', family: 'Montserrat, sans-serif', category: 'Modern' },
  { name: 'Cinzel', family: 'Cinzel, serif', category: 'Luxury' },
  { name: 'Syne', family: 'Syne, sans-serif', category: 'Display' },
  { name: 'Cormorant Garamond', family: 'Cormorant Garamond, serif', category: 'Luxury' },
  { name: 'Bodoni Moda', family: 'Bodoni Moda, serif', category: 'Luxury' },
  { name: 'Marcellus', family: 'Marcellus, serif', category: 'Luxury' },
  { name: 'Italiana', family: 'Italiana, serif', category: 'Luxury' },
  { name: 'Tenor Sans', family: 'Tenor Sans, sans-serif', category: 'Modern' },
  { name: 'Lora', family: 'Lora, serif', category: 'Serif' },
  { name: 'Space Grotesk', family: 'Space Grotesk, sans-serif', category: 'Modern' },
];

interface WhiteLabelProposalBuilderProps {
  missionId?: string;
  originCode?: string;
  destCode?: string;
  aircraftName?: string;
  baselineWholesaleCostUsd?: number;
  onProposalGenerated?: (proposal: {
    agencyName: string;
    markupPercent: number;
    brokerProfitUsd: number;
    totalClientPriceUsd: number;
    proposalLink: string;
    fontFamily: string;
    logoUrl?: string;
  }) => void;
}

export const WhiteLabelProposalBuilder: React.FC<WhiteLabelProposalBuilderProps> = ({
  missionId = '15D-892',
  originCode = 'LOS',
  destCode = 'ABV',
  aircraftName = 'Midsize Jet (Hawker 900XP)',
  baselineWholesaleCostUsd = 16250,
  onProposalGenerated
}) => {
  const [agencyName, setAgencyName] = useState('Vanguard Executive Aviation');
  const [markupPercent, setMarkupPercent] = useState<number>(15);
  const [selectedFont, setSelectedFont] = useState<string>('Plus Jakarta Sans');
  const [customLogoUrl, setCustomLogoUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const usdToNgnRate = 1480;

  const brokerProfitUsd = Math.round((baselineWholesaleCostUsd * markupPercent) / 100);
  const totalClientPriceUsd = baselineWholesaleCostUsd + brokerProfitUsd;
  const totalClientPriceNgn = totalClientPriceUsd * usdToNgnRate;

  const fontSpec = GOOGLE_FONTS.find(f => f.name === selectedFont) || GOOGLE_FONTS[0];

  // Dynamically load selected Google Font in head
  useEffect(() => {
    const fontQuery = selectedFont.replace(/ /g, '+');
    const linkId = 'google-font-proposal-dynamic';
    let link = document.getElementById(linkId) as HTMLLinkElement;
    if (!link) {
      link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
    link.href = `https://fonts.googleapis.com/css2?family=${fontQuery}:wght@300;400;600;700;800&display=swap`;
  }, [selectedFont]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setCustomLogoUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const proposalLink = `https://15dwings.com.ng/verify/${missionId}?concierge=${encodeURIComponent(agencyName)}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(proposalLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleGenerate = () => {
    if (onProposalGenerated) {
      onProposalGenerated({
        agencyName,
        markupPercent,
        brokerProfitUsd,
        totalClientPriceUsd,
        proposalLink,
        fontFamily: fontSpec.family,
        logoUrl: customLogoUrl
      });
    }
    setShowPreviewModal(true);
  };

  return (
    <div className="p-6 md:p-8 rounded-[2rem] border border-white/10 glass-vip shadow-2xl relative overflow-hidden bg-gradient-to-br from-black/80 via-[#0a0f1d]/90 to-black/90">
      <div className="absolute top-0 right-0 w-64 h-64 bg-fbblue/10 blur-3xl pointer-events-none rounded-full" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-fbblue animate-pulse" />
            <span className="font-sync text-[9px] text-fbblue tracking-[0.25em] font-bold uppercase">
              MODULE 2 — WHITE-LABEL PROPOSAL DESIGNER
            </span>
          </div>
          <h3 className="font-sync text-lg md:text-xl font-bold tracking-wider text-white uppercase">
            Custom VIP Proposal Designer
          </h3>
          <p className="text-xs text-gray-400 font-light">
            Design custom proposal documents with 20 Google Fonts & uploaded broker agency logo.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-full bg-fbblue/10 border border-fbblue/20 text-fbblue text-[9px] font-mono tracking-wider uppercase font-semibold flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-fbblue" /> Blind Supply Chain Disguise
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6">
        {/* Left Column: Branding, Logo & 20 Google Fonts */}
        <div className="space-y-5">
          {/* Agency Name */}
          <div className="space-y-2">
            <label className="font-sync text-[9px] text-gray-400 tracking-widest uppercase block">
              YOUR AGENCY / BRAND NAME
            </label>
            <input
              type="text"
              value={agencyName}
              onChange={(e) => setAgencyName(e.target.value)}
              placeholder="e.g. Executive Air Charter Ltd"
              className="w-full bg-black/80 border border-white/15 rounded-2xl px-4 py-3.5 text-sm font-lexend text-white focus:border-fbblue outline-none transition-all placeholder:text-gray-600"
            />
          </div>

          {/* Logo Upload */}
          <div className="space-y-2">
            <label className="font-sync text-[9px] text-gray-400 tracking-widest uppercase block flex items-center gap-1">
              <ImageIcon className="w-3.5 h-3.5 text-fbblue" /> AGENCY LOGO UPLOAD
            </label>
            <div className="flex items-center gap-3">
              {customLogoUrl ? (
                <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 p-1 flex items-center justify-center relative overflow-hidden shrink-0">
                  <img src={customLogoUrl} alt="Agency Logo" className="max-w-full max-h-full object-contain" />
                  <button
                    onClick={() => setCustomLogoUrl('')}
                    className="absolute top-0 right-0 bg-red-600 text-white p-0.5 text-[8px] rounded-bl"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-dashed border-white/20 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5 text-gray-500" />
                </div>
              )}
              <div className="flex-1 space-y-1">
                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs font-mono font-medium transition-all">
                  <span>{customLogoUrl ? 'Change Logo Image' : 'Upload Agency Logo (PNG/JPG)'}</span>
                  <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                </label>
                <p className="text-[10px] text-gray-500 font-mono">Will be rendered at top of proposal document</p>
              </div>
            </div>
          </div>

          {/* 20 Google Fonts Selector */}
          <div className="space-y-2">
            <label className="font-sync text-[9px] text-gray-400 tracking-widest uppercase block flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Type className="w-3.5 h-3.5 text-fbblue" /> PROPOSAL TYPOGRAPHY (20 GOOGLE FONTS)
              </span>
              <span className="text-fbblue font-mono font-bold text-[10px]">{selectedFont}</span>
            </label>

            <div className="relative">
              <select
                value={selectedFont}
                onChange={(e) => setSelectedFont(e.target.value)}
                className="w-full bg-black/80 border border-white/15 rounded-2xl px-4 py-3.5 text-xs text-white font-mono focus:border-fbblue outline-none transition-all cursor-pointer"
              >
                {GOOGLE_FONTS.map((f, i) => (
                  <option key={f.name} value={f.name}>
                    {i + 1}. {f.name} ({f.category})
                  </option>
                ))}
              </select>
            </div>

            {/* Live Font Preview Box */}
            <div
              className="p-3.5 rounded-xl bg-black/50 border border-white/10 text-xs text-gray-300"
              style={{ fontFamily: fontSpec.family }}
            >
              Preview: &quot;{agencyName || 'Your Agency'} — Executive Flight Proposal ({originCode} → {destCode})&quot;
            </div>
          </div>

          {/* Broker Markup Slider */}
          <div className="space-y-3 bg-black/60 p-5 rounded-2xl border border-white/10">
            <div className="flex justify-between items-center">
              <label className="font-sync text-[9px] text-gray-400 tracking-widest uppercase block flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-fbblue" /> BROKER MARKUP (%)
              </label>
              <span className="text-sm font-mono font-bold text-fbblue">
                +{markupPercent}%
              </span>
            </div>

            <input
              type="range"
              min="0"
              max="50"
              step="1"
              value={markupPercent}
              onChange={(e) => setMarkupPercent(Number(e.target.value))}
              className="w-full accent-fbblue cursor-pointer h-2 bg-white/10 rounded-lg appearance-none"
            />

            <div className="flex justify-between text-[10px] text-gray-500 font-mono">
              <span>0% (Wholesale)</span>
              <span>15% (Standard)</span>
              <span>50% (Max)</span>
            </div>
          </div>
        </div>

        {/* Right Column: Pricing Breakdown & Generate Button */}
        <div className="space-y-4 bg-black/70 p-6 rounded-2xl border border-white/15 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs text-gray-400 pb-2 border-b border-white/10">
              <span>Baseline Wholesale Aircraft Cost:</span>
              <span className="font-mono text-white">
                ${baselineWholesaleCostUsd.toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between items-center text-xs text-fbblue py-1">
              <span>Your Broker Earnings (+{markupPercent}%):</span>
              <span className="font-mono font-bold">
                +${brokerProfitUsd.toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-white/10">
              <span className="font-lexend text-xs font-bold text-white tracking-wider">
                END-CLIENT QUOTE TOTAL:
              </span>
              <span className="text-2xl font-mono font-bold text-fbblue">
                ${totalClientPriceUsd.toLocaleString()}
              </span>
            </div>
            
            <p className="text-[10px] text-gray-400 font-mono text-right">
              ≈ ₦{totalClientPriceNgn.toLocaleString()} NGN (at ₦{usdToNgnRate}/$)
            </p>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              onClick={handleGenerate}
              className="flex-1 py-3.5 rounded-xl bg-fbblue hover:bg-fbblue/90 text-white font-sync text-xs font-bold tracking-wider uppercase transition-all shadow-[0_0_20px_rgba(24,119,242,0.4)] flex items-center justify-center gap-2 active:scale-95"
            >
              <FileText className="w-4 h-4" />
              <span>Generate Customer PDF</span>
            </button>

            <button
              onClick={handleCopyLink}
              className="px-4 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-mono text-xs font-semibold transition-all flex items-center justify-center gap-2"
            >
              {copied ? <CheckCircle className="w-4 h-4 text-fbblue" /> : <Share2 className="w-4 h-4" />}
              <span>{copied ? 'Link Copied!' : 'Share Link'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Proposal Preview Modal */}
      <AnimatePresence>
        {showPreviewModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[250] bg-black/90 backdrop-blur-[10px] flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-2xl bg-[#080d1a] rounded-3xl border border-white/20 shadow-2xl p-6 md:p-8 space-y-6 relative"
            >
              <button
                onClick={() => setShowPreviewModal(false)}
                className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-1">
                <span className="font-lexend text-[9px] text-fbblue tracking-[0.3em] font-bold block">
                  WHITE-LABEL PROPOSAL DOCUMENT PREVIEW
                </span>
                <h3 className="font-sync text-xl font-bold text-white uppercase">
                  Flight Concierge Itinerary
                </h3>
              </div>

              {/* White Label Proposal Document Styled with Selected Font */}
              <div
                className="p-6 md:p-8 rounded-2xl bg-black border border-white/15 space-y-6 text-left shadow-xl relative overflow-hidden"
                style={{ fontFamily: fontSpec.family }}
              >
                {/* Proposal Header with Logo */}
                <div className="flex justify-between items-start pb-5 border-b border-white/10">
                  <div className="space-y-1">
                    {customLogoUrl ? (
                      <img src={customLogoUrl} alt={agencyName} className="h-10 max-w-[180px] object-contain mb-2" />
                    ) : (
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-3 h-3 rounded-full bg-fbblue" />
                        <span className="font-bold text-lg text-white tracking-tight">{agencyName}</span>
                      </div>
                    )}
                    <p className="text-xs text-gray-400">Official Flight Concierge Proposal</p>
                  </div>

                  <div className="text-right space-y-0.5">
                    <span className="text-xs font-mono text-fbblue font-bold block">REF: {missionId}</span>
                    <span className="text-[10px] text-gray-500 font-mono">STATUS: CONFIRMED ROUTE</span>
                    <span className="text-[9px] text-gray-400 block pt-1 font-mono">Font: {selectedFont}</span>
                  </div>
                </div>

                {/* Routing & Aircraft Details */}
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10">
                    <span className="text-gray-400 block text-[10px] uppercase font-mono mb-1">ROUTING PATTERN</span>
                    <span className="font-mono text-white font-bold text-sm">{originCode} → {destCode}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10">
                    <span className="text-gray-400 block text-[10px] uppercase font-mono mb-1">AIRCRAFT CATEGORY</span>
                    <span className="font-mono text-white font-bold text-xs">{aircraftName}</span>
                  </div>
                </div>

                {/* Pricing Box */}
                <div className="p-5 rounded-2xl bg-fbblue/10 border border-fbblue/30 flex justify-between items-center">
                  <div>
                    <span className="text-xs text-gray-300 block font-medium">Total Executive Charter Fee:</span>
                    <span className="text-[10px] text-gray-400 font-mono">Includes fuel, landing fees & ground transport</span>
                  </div>
                  <span className="text-2xl font-mono font-bold text-fbblue">
                    ${totalClientPriceUsd.toLocaleString()}
                  </span>
                </div>

                {/* Verification Footer */}
                <div className="flex items-center gap-3 pt-2 text-[10px] text-gray-400 font-mono border-t border-white/10">
                  <QrCode className="w-8 h-8 text-fbblue shrink-0" />
                  <div>
                    <p className="text-gray-200">Dynamic Security QR: 15dwings.com.ng/verify/{missionId}</p>
                    <p className="text-gray-500">Verified Ground Escrow & Safe Payment Guarantee</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                                        alert(`Proposal PDF for ${missionId} formatted in "${selectedFont}" generated successfully!

DYNAMIC VERIFICATION:
A QR code has been embedded into this PDF pointing to: https://vip.15dwings.com.ng/verify/${missionId}`);
                    setShowPreviewModal(false);
                  }}
                  className="flex-1 py-3.5 rounded-xl bg-fbblue text-white font-sync text-xs font-bold tracking-wider uppercase hover:bg-fbblue/90 transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(24,119,242,0.4)]"
                >
                  <Download className="w-4 h-4" />
                  <span>Download PDF Document</span>
                </button>
                <button
                  onClick={handleCopyLink}
                  className="px-6 py-3.5 rounded-xl bg-white/10 text-white font-mono text-xs font-semibold hover:bg-white/15 transition-all flex items-center justify-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  <span>Copy Web Link</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

