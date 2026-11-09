import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Lock, ArrowLeft, FileText, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function TosPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-slate-100 font-lexend selection:bg-purple-600 selection:text-white pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-purple-900/30 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono tracking-widest text-purple-400 uppercase block font-bold">
              SKY PARTY LTD (RC: 8997727)
            </span>
            <h1 className="text-base font-space font-bold uppercase tracking-tight text-white">
              15D WINGS • LEGAL COMPLIANCE
            </h1>
          </div>
        </div>

        <button
          onClick={() => navigate('/')}
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
                VERSION: 1.1 • EFFECTIVE DATE: November 15, 2025
              </span>
              <h2 className="text-2xl md:text-3xl font-space font-bold tracking-tight text-white mt-2">
                ANTI-MONEY LAUNDERING AND COUNTER-FINANCING OF TERRORISM (AML/CFT) POLICY
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
                1. POLICY STATEMENT AND PURPOSE
              </h3>
              <p>
                Sky Party LTD (RC: 8997727), operating the 15D Wings platform ("15D Wings," "the Company," "We," "Us"), is committed to the highest standards of operational integrity, legal compliance, and ethical conduct.
              </p>
              <p>
                Due to the nature of luxury transit coordination, flight dispatch services, charter brokerage, and digital financial settlement integrations (fiat and digital assets via authorized providers), 15D Wings recognizes the inherent risks associated with money laundering (ML), terrorist financing (TF), proliferation financing (PF), and financial crime.
              </p>
              <p className="font-semibold text-white">
                The purpose of this AML/CFT Policy is to:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-300">
                <li>Establish a robust institutional framework to prevent 15D Wings from being utilized as a conduit for financial crime.</li>
                <li>Ensure full compliance with applicable statutory and regulatory requirements, including the Money Laundering (Prevention and Prohibition) Act 2022, the Terrorism (Prevention and Prohibition) Act 2022, guidelines issued by the Nigerian Financial Intelligence Unit (NFIU), the Special Control Unit Against Money Laundering (SCUML), and international standards set by the Financial Action Task Force (FATF).</li>
                <li>Protect the operational status, reputation, and licensing standing of Sky Party LTD, its directors, officers, employees, and aviation network partners.</li>
              </ul>
            </section>

            <section className="space-y-3 pt-4 border-t border-purple-900/40">
              <h3 className="text-sm font-space font-bold uppercase tracking-wide text-purple-300">
                2. GOVERNING LAWS AND REGULATORY FRAMEWORK
              </h3>
              <p>This Policy is formulated in accordance with and governed by:</p>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-300">
                <li>Money Laundering (Prevention and Prohibition) Act, 2022 (MLPPA).</li>
                <li>Terrorism (Prevention and Prohibition) Act, 2022 (TPPA).</li>
                <li>Central Bank of Nigeria (CBN) AML/CFT/CPF Regulations.</li>
                <li>Guidelines issued by the Special Control Unit Against Money Laundering (SCUML) / Economic and Financial Crimes Commission (EFCC).</li>
                <li>Nigerian Financial Intelligence Unit (NFIU) Act and Regulations.</li>
                <li>Financial Action Task Force (FATF) Recommendations on Virtual Assets and Designated Non-Financial Businesses and Professions (DNFBPs).</li>
              </ul>
            </section>

            <section className="space-y-3 pt-4 border-t border-purple-900/40">
              <h3 className="text-sm font-space font-bold uppercase tracking-wide text-purple-300">
                3. DESIGNATION AND DUTIES OF THE COMPLIANCE OFFICER
              </h3>
              <p>
                The Management of Sky Party LTD shall formally designate an Anti-Money Laundering Compliance Officer (AMLCO) who shall possess adequate seniority, authority, and independence to enforce this Policy.
              </p>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mt-2">
                3.1 Key Responsibilities of the AMLCO:
              </h4>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-300">
                <li><strong>System Oversight:</strong> Designing, implementing, and periodically updating the Company’s AML/CFT framework, internal controls, and Risk-Based Approach (RBA).</li>
                <li><strong>Reporting:</strong> Serving as the primary liaison between 15D Wings, Sky Party LTD, the NFIU, SCUML, and relevant law enforcement agencies.</li>
                <li><strong>Transaction Monitoring:</strong> Monitoring transaction logs across all 15D Wings portals (Client App, Ops Portal, Broker Portal, ICC/GIO) for suspicious patterns or policy breaches.</li>
                <li><strong>SAR/STR Submissions:</strong> Filing Suspicious Transaction Reports (STRs) and Currency Transaction Reports (CTRs) with statutory bodies within prescribed timelines.</li>
                <li><strong>Training & Audit:</strong> Organizing mandatory annual AML/CFT training for all staff, operators, and contractors, and facilitating independent annual compliance audits.</li>
              </ul>
            </section>

            <section className="space-y-3 pt-4 border-t border-purple-900/40">
              <h3 className="text-sm font-space font-bold uppercase tracking-wide text-purple-300">
                4. RISK-BASED APPROACH (RBA)
              </h3>
              <p>
                15D Wings applies a Risk-Based Approach (RBA) to identify, assess, and mitigate money laundering and terrorist financing risks.
              </p>
              <div className="overflow-x-auto mt-4">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-purple-800 text-purple-300">
                      <th className="py-2.5 px-3">Risk Category</th>
                      <th className="py-2.5 px-3">Indicators / Criteria</th>
                      <th className="py-2.5 px-3">Required Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-900/30">
                    <tr>
                      <td className="py-3 px-3 font-bold text-emerald-400">Low Risk</td>
                      <td className="py-3 px-3">Verified domestic corporate entities with clear ownership structure; routine charter requests; established regional operators.</td>
                      <td className="py-3 px-3">Standard Customer Due Diligence (CDD).</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-3 font-bold text-amber-400">Medium Risk</td>
                      <td className="py-3 px-3">High-value single-leg bookings; third-party payment settlement; unlisted corporate entities; cross-border flights to standard jurisdictions.</td>
                      <td className="py-3 px-3">Standard CDD + Source of Funds Verification.</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-3 font-bold text-red-400">High Risk</td>
                      <td className="py-3 px-3">Politically Exposed Persons (PEPs); ultra-high-value charter bookings via high-velocity digital assets; requests originating from or routing to high-risk/prohibited jurisdictions (Schedule 1 list); complex multi-layered ownership structures; payments originating from brokers/third parties where KYC records do not match.</td>
                      <td className="py-3 px-3">Enhanced Due Diligence (EDD) + Senior Management Approval + Mandatory Broker Verification Protocol.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section className="space-y-3 pt-4 border-t border-purple-900/40">
              <h3 className="text-sm font-space font-bold uppercase tracking-wide text-purple-300">
                5. CUSTOMER DUE DILIGENCE (CDD) AND KNOW YOUR CUSTOMER (KYC)
              </h3>
              <p>
                No individual or corporate entity shall utilize 15D Wings services, execute charter manifests, or complete financial settlements without undergoing verified Know Your Customer (KYC) procedures.
              </p>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mt-2">
                5.1 Individual Due Diligence Requirements:
              </h4>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-300">
                <li>Full Legal Name (cross-checked against valid government ID).</li>
                <li>Date of Birth and Nationality.</li>
                <li>Residential Address (supported by utility bill or proof of residence issued within 3 months).</li>
                <li>Government-issued Identification: Valid International Passport, Driver's License, or National Identity Card (NIN).</li>
                <li>Tax Identification Number (TIN) / Bank Verification Number (BVN) where applicable.</li>
              </ul>

              <h4 className="text-xs font-bold text-white uppercase tracking-wider mt-3">
                5.2 Corporate & Institutional Due Diligence Requirements:
              </h4>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-300">
                <li>Certificate of Incorporation / Registration (CAC / Foreign equivalent).</li>
                <li>Memorandum and Articles of Association (or equivalent constitutional documents).</li>
                <li>Status Report / Particulars of Directors and Shareholder Structure.</li>
                <li>Identification and verification of ultimate Beneficial Owners (UBOs) holding 10% or more direct or indirect interest/voting rights.</li>
                <li>Resolution of the Board authorizing the transaction and designating authorized operators/signatories.</li>
              </ul>

              <h4 className="text-xs font-bold text-white uppercase tracking-wider mt-3">
                5.3 Politically Exposed Persons (PEPs):
              </h4>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-300">
                <li>PEPs (foreign or domestic senior government officials, judicial, military, or state enterprise executives, and their close associates/family members) are automatically designated as High Risk.</li>
                <li>Approval from the AMLCO or Senior Management is mandatory prior to onboarding or completing transactions for a PEP.</li>
                <li>Source of Wealth and Source of Funds verification must be strictly documented.</li>
              </ul>
            </section>

            <section className="space-y-3 pt-4 border-t border-purple-900/40">
              <h3 className="text-sm font-space font-bold uppercase tracking-wide text-purple-300">
                6. BROKER-HANDLED TRANSACTIONS & KYC MISMATCH PROTOCOLS
              </h3>
              <p>
                When flight bookings or settlements are facilitated by an intermediary (individual broker, corporate agency, or third-party charter manager), 15D Wings enforces a strict "No Unverified Third-Party Settlement" policy.
              </p>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mt-2">
                6.1 Requirements for Broker-Handled Settlements:
              </h4>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-300">
                <li><strong>Tripartite Mapping:</strong> For every broker-handled booking, the system/compliance team must verify: The Client/Passenger, The Broker Intermediary, and The Payor Account.</li>
                <li><strong>Mandatory Dual KYC:</strong> Full KYC must be completed and validated for both the broker and the client/passenger, including UBO verification (&ge; 10%).</li>
                <li><strong>Written Broker Mandate / Authorization Letter:</strong> The broker must provide a formal written mandate, contract, or power of attorney signed by the underlying client.</li>
              </ul>

              <h4 className="text-xs font-bold text-white uppercase tracking-wider mt-3">
                6.2 Handling KYC Mismatches (Step-by-Step Procedure):
              </h4>
              <p>A "KYC Mismatch" occurs when the paying bank account/digital asset wallet name does not match the verified profile of either the broker or the client.</p>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-300">
                <li><strong>Immediate Transaction Hold:</strong> The transaction/settlement is placed on Hold automatically. No flight clearance or booking confirmation may be issued.</li>
                <li><strong>Request for Information (RFI) Issued:</strong> The Compliance Team issues an RFI for relationship verification, Source of Funds (SoF), and third-party KYC.</li>
                <li><strong>Escalation & Assessment:</strong> AMLCO evaluates the response within 24 hours. If valid, hold is released. If unresolved within 48 hours, payment is refunded exclusively to the original source, booking is canceled, and an STR may be filed with the NFIU.</li>
              </ul>
            </section>

            <section className="space-y-3 pt-4 border-t border-purple-900/40">
              <h3 className="text-sm font-space font-bold uppercase tracking-wide text-purple-300">
                7. SANCTIONS SCREENING & PROHIBITED JURISDICTIONS
              </h3>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-300">
                <li><strong>Screening Databases:</strong> UN Security Council Consolidated Sanctions List, OFAC Specially Designated Nationals (SDN) List, EU Financial Sanctions List, Local Nigerian Sanctions / Terrorist Watchlists.</li>
                <li><strong>Prohibited Countries & Entities:</strong> Strict prohibition on transactions originating from, bound for, or linked with entities/persons in designated high-risk or sanctioned jurisdictions.</li>
                <li><strong>Immediate Action on Sanctions Match:</strong> Positive match results in immediate account/transaction freeze and STR filing with the NFIU within 24 hours.</li>
              </ul>
            </section>

            <section className="space-y-3 pt-4 border-t border-purple-900/40">
              <h3 className="text-sm font-space font-bold uppercase tracking-wide text-purple-300">
                8. TRANSACTION MONITORING AND SUSPICIOUS TRANSACTION REPORTING (STR)
              </h3>
              <p><strong>Red Flags:</strong> Cash/bearer instruments above thresholds, frequent high-value cancellations with refunds to third parties, account name mismatches, reluctance to provide UBO or manifest details.</p>
              <p><strong>Reporting Thresholds:</strong> Currency Transaction Reports (CTRs) for cash exceeding ₦5M (individuals) or ₦10M (corporate) within 7 days. Immediate STRs for suspected proceeds of crime.</p>
            </section>

            <section className="space-y-3 pt-4 border-t border-purple-900/40">
              <h3 className="text-sm font-space font-bold uppercase tracking-wide text-purple-300">
                9. RECORD KEEPING & RETENTION
              </h3>
              <p>All customer/broker KYC, verification records, booking manifests, and transaction logs are securely retained for a minimum of five (5) years following relationship termination, readily available for inspection by statutory authorities (NFIU, SCUML, EFCC, CBN).</p>
            </section>

            <section className="space-y-3 pt-4 border-t border-purple-900/40">
              <h3 className="text-sm font-space font-bold uppercase tracking-wide text-purple-300">
                10. EMPLOYEE TRAINING, AWARENESS, AND SCREENING
              </h3>
              <p>Mandatory pre-employment background checks, annual ongoing AML/CFT training for all staff, and strict non-retaliation whistleblower protections.</p>
            </section>

            <section className="space-y-3 pt-4 border-t border-purple-900/40">
              <h3 className="text-sm font-space font-bold uppercase tracking-wide text-purple-300">
                11. INDEPENDENT AUDIT AND POLICY REVIEW
              </h3>
              <p>Annual independent internal/external audits and annual policy reviews by compliance officers and senior management.</p>
            </section>

            <section className="space-y-4 pt-6 border-t-2 border-purple-600/40 bg-purple-950/20 p-6 rounded-2xl">
              <h3 className="text-sm font-space font-bold uppercase tracking-wide text-purple-300">
                12. ADOPTION AND SIGN-OFF
              </h3>
              <p>
                This Anti-Money Laundering and Counter-Financing of Terrorism Policy has been formally approved and adopted by the Management of Sky Party LTD (RC: 8997727).
              </p>
              <div className="pt-2">
                <p className="font-bold text-white">APPROVED BY:</p>
                <p className="font-mono text-purple-300 mt-1">[Signed: Precious Ubadike]</p>
                <p className="text-xs text-slate-400 mt-0.5">Precious Ubadike • Director / Authorised Signatory</p>
                <p className="text-xs text-slate-400">Sky Party LTD (RC: 8997727)</p>
                <p className="text-xs text-purple-400 font-mono mt-1">Date: October 20, 2026</p>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
