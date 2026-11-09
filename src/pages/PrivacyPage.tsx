import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, ArrowLeft, Lock, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PrivacyPage() {
  const useNavigateHook = useNavigate();

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-slate-100 font-lexend selection:bg-purple-600 selection:text-white pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-purple-900/30 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono tracking-widest text-purple-400 uppercase block font-bold">
              SKY PARTY LTD (RC: 8997727)
            </span>
            <h1 className="text-base font-space font-bold uppercase tracking-tight text-white">
              15D WINGS • PRIVACY & DATA SECURITY
            </h1>
          </div>
        </div>

        <button
          onClick={() => useNavigateHook('/')}
          className="px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 rounded-xl text-xs font-sync uppercase font-bold text-purple-300 transition-all flex items-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Portal</span>
        </button>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 pt-12 space-y-10">
        <div className="p-8 md:p-12 rounded-[2.5rem] bg-gradient-to-br from-slate-950 via-purple-950/40 to-slate-900 border border-purple-500/20 shadow-2xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-purple-800/40">
            <div>
              <span className="px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-[10px] font-mono uppercase text-purple-300 font-bold">
                DATA PROTECTION & PRIVACY STATEMENT
              </span>
              <h2 className="text-2xl md:text-3xl font-space font-bold tracking-tight text-white mt-2">
                PRIVACY POLICY & INFORMATION SECURITY FRAMEWORK
              </h2>
            </div>
            <div className="px-4 py-2 rounded-2xl bg-purple-950/60 border border-purple-600/40 text-right">
              <span className="text-[10px] text-purple-300 block font-mono uppercase">Entity</span>
              <span className="text-xs font-bold text-white">SKY PARTY LTD (RC: 8997727)</span>
            </div>
          </div>

          <div className="space-y-8 text-xs md:text-sm text-slate-300 leading-relaxed font-light">
            <section className="space-y-3">
              <h3 className="text-sm font-space font-bold uppercase tracking-wide text-purple-300">
                1. INTRODUCTION & COMMITMENT TO PRIVACY
              </h3>
              <p>
                Sky Party LTD (RC: 8997727), operating the 15D Wings platform ("15D Wings," "we," "us," or "our"), respects your privacy and is committed to protecting your personal and corporate data in compliance with the Nigeria Data Protection Act (NDPA), General Data Protection Regulation (GDPR), and international aviation confidentiality standards.
              </p>
              <p>
                This Privacy Policy outlines how we collect, use, store, and safeguard your information when you utilize our luxury charter booking systems, broker portals, and escrow settlement rails.
              </p>
            </section>

            <section className="space-y-3 pt-4 border-t border-purple-900/40">
              <h3 className="text-sm font-space font-bold uppercase tracking-wide text-purple-300">
                2. INFORMATION WE COLLECT
              </h3>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-300">
                <li><strong>Broker & Client Identity Data:</strong> Full legal names, corporate registration documents (CAC), dates of birth, government-issued IDs, and passport details.</li>
                <li><strong>Contact & Communication Data:</strong> Corporate work email addresses, telephone numbers, encrypted chat logs, and operational telemetry.</li>
                <li><strong>Financial & Escrow Data:</strong> Bank verification records, payment receipts, escrow deposit transactions, and source of funds verification.</li>
                <li><strong>Technical Telemetry:</strong> Device fingerprints, IP addresses, browser specifications, and secure session tokens ("Eye of God" intelligence logs).</li>
              </ul>
            </section>

            <section className="space-y-3 pt-4 border-t border-purple-900/40">
              <h3 className="text-sm font-space font-bold uppercase tracking-wide text-purple-300">
                3. HOW WE USE YOUR INFORMATION
              </h3>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-300">
                <li>To execute private jet charter bookings, flight dispatches, and aircraft rotations.</li>
                <li>To perform mandatory Anti-Money Laundering (AML/CFT) and Know Your Customer (KYC) verifications.</li>
                <li>To protect platform security against fraud, unauthorized access, and financial crime.</li>
                <li>To provide white-labeled proposal generation and broker CRM services.</li>
              </ul>
            </section>

            <section className="space-y-3 pt-4 border-t border-purple-900/40">
              <h3 className="text-sm font-space font-bold uppercase tracking-wide text-purple-300">
                4. DATA SECURITY & RETENTION
              </h3>
              <p>
                All personal and financial data is encrypted in transit and at rest using bank-grade security protocols (Cloudflare R2 vaults and PostgreSQL row-level security). In compliance with statutory requirements, data is retained for a minimum of five (5) years following the completion of transactions or relationship termination.
              </p>
            </section>

            <section className="space-y-3 pt-4 border-t border-purple-900/40">
              <h3 className="text-sm font-space font-bold uppercase tracking-wide text-purple-300">
                5. CONTACT US
              </h3>
              <p>
                For any privacy inquiries or data protection requests, please contact our Compliance Officer at <a href="mailto:ops@15dwings.com.ng" className="text-purple-400 underline font-medium">ops@15dwings.com.ng</a> or visit our headquarters at Murtala Muhammed International Airport (DNMM), Lagos.
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
