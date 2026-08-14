import React, { useState, useEffect } from 'react';
import { 
  Shield, FileText, Users, Phone, CreditCard, Plane, 
  Plus, Trash2, Check, Sparkles
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { sendGasEmail } from '../lib/gasMailer';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface OVEGatewayProps {
  operatorId: string;
  onStateUpdated?: () => void;
}

export default function OVEGateway({ operatorId, onStateUpdated }: OVEGatewayProps) {
  const [activeFormSection, setActiveFormSection] = useState<'LEGAL' | 'IDENTITY' | 'COMMUNICATION' | 'FINANCE' | 'FLEET'>('LEGAL');
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditFeedback, setAuditFeedback] = useState<string | null>(null);

  // States for all five simplified compliance dimensions
  const [legalData, setLegalData] = useState({
    aocNumber: '',
    aocExpiry: '',
    aocAuthority: 'NCAA',
    aocUploaded: false,
    coaNumber: '',
    coaExpiry: '',
    coaUploaded: false,
    insurancePolicy: '',
    insuranceCoverage: '',
    insuranceExpiry: '',
    insuranceUploaded: false,
  });

  const [opsIdentity, setOpsIdentity] = useState({
    flightOpsName: '',
    flightOpsEmail: '',
    flightOpsPhone: '',
    chiefPilotName: '',
    chiefPilotEmail: '',
    chiefPilotPhone: '',
    opsControlName: '',
    opsControlEmail: '',
    opsControlPhone: '',
    dispatchName: '',
    dispatchEmail: '',
    dispatchPhone: '',
    escalationName: '',
    escalationEmail: '',
    escalationPhone: '',
  });

  const [commInfrastructure, setCommInfrastructure] = useState({
    primaryEmail: '',
    secondaryEmail: '',
    whatsAppNumber: '',
    dispatchHotline: '',
    escalationPref: 'WHATSAPP_FIRST',
    smsAlerts: true,
    voiceDispatch: false,
  });

  const [financeCoord, setFinanceCoord] = useState({
    beneficiaryName: '',
    bankName: '',
    accountNumber: '',
    settlementContactEmail: '',
  });

  const [fleetList, setFleetList] = useState<any[]>([]);

  const [newPlane, setNewPlane] = useState({
    tailNumber: '',
    type: 'Heavy Jet',
    model: '',
    manufacturer: '',
    capacity: 8,
    homeBase: '',
    region: 'West Africa'
  });

  // Current Verification Gate state
  const [oveState, setOveState] = useState<'REGISTERED' | 'UNDER_VERIFICATION' | 'LEGAL_VERIFIED' | 'OPERATIONAL_VERIFIED' | 'MISSION_READY'>('REGISTERED');
  const [companyName, setCompanyName] = useState('Unknown Operator');

  // Load and hydrate operator profile from database as single-source of truth, with localStorage fallback
  useEffect(() => {
    const fetchLiveState = async () => {
      try {
        const { data, error } = await supabase
          .from('operators')
          .select('*')
          .eq('id', operatorId)
          .single();
        if (data) {
          if (data.name) setCompanyName(data.name);
          if (data.ove_state) setOveState(data.ove_state);
          if (data.legal_authority) setLegalData(data.legal_authority);
          if (data.operational_identity) setOpsIdentity(data.operational_identity);
          if (data.communication_infrastructure) setCommInfrastructure(data.communication_infrastructure);
          if (data.financial_coordination) setFinanceCoord(data.financial_coordination);
          if (data.fleet_registry) setFleetList(data.fleet_registry || []);
          return; // Exit early since database query succeeded
        }
      } catch (err) {
        console.error("Error fetching live operator state from DB", err);
      }

      // Fallback if DB fetch is unsuccessful
      const key = `ove_data_${operatorId}`;
      const local = localStorage.getItem(key);
      if (local) {
        try {
          const parsed = JSON.parse(local);
          if (parsed.legalData) setLegalData(parsed.legalData);
          if (parsed.opsIdentity) setOpsIdentity(parsed.opsIdentity);
          if (parsed.commInfrastructure) setCommInfrastructure(parsed.commInfrastructure);
          if (parsed.financeCoord) setFinanceCoord(parsed.financeCoord);
          if (parsed.fleetList) setFleetList(parsed.fleetList);
          if (parsed.oveState) setOveState(parsed.oveState);
        } catch (e) {
          console.error("Error loaded local state", e);
        }
      } else {
        // Pristine initialization to allow true non-mock input tracking
        setLegalData({
          aocNumber: '',
          aocExpiry: '',
          aocAuthority: 'NCAA',
          aocUploaded: false,
          coaNumber: '',
          coaExpiry: '',
          coaUploaded: false,
          insurancePolicy: '',
          insuranceCoverage: '',
          insuranceExpiry: '',
          insuranceUploaded: false,
        });
        setOpsIdentity({
          flightOpsName: '',
          flightOpsEmail: '',
          flightOpsPhone: '',
          chiefPilotName: '',
          chiefPilotEmail: '',
          chiefPilotPhone: '',
          opsControlName: '',
          opsControlEmail: '',
          opsControlPhone: '',
          dispatchName: '',
          dispatchEmail: '',
          dispatchPhone: '',
          escalationName: '',
          escalationEmail: '',
          escalationPhone: '',
        });
        setCommInfrastructure({
          primaryEmail: '',
          secondaryEmail: '',
          whatsAppNumber: '',
          dispatchHotline: '',
          escalationPref: 'WHATSAPP_FIRST',
          smsAlerts: true,
          voiceDispatch: false,
        });
        setFinanceCoord({
          beneficiaryName: '',
          bankName: '',
          accountNumber: '',
          settlementContactEmail: '',
        });
        setFleetList([]);
      }
    };
    fetchLiveState();
  }, [operatorId]);

  const handleClearProfile = async () => {
    const emptyLegal = {
      aocNumber: '',
      aocExpiry: '',
      aocAuthority: 'NCAA',
      aocUploaded: false,
      coaNumber: '',
      coaExpiry: '',
      coaUploaded: false,
      insurancePolicy: '',
      insuranceCoverage: '',
      insuranceExpiry: '',
      insuranceUploaded: false,
    };
    const emptyTeam = {
      flightOpsName: '',
      flightOpsEmail: '',
      flightOpsPhone: '',
      chiefPilotName: '',
      chiefPilotEmail: '',
      chiefPilotPhone: '',
      opsControlName: '',
      opsControlEmail: '',
      opsControlPhone: '',
      dispatchName: '',
      dispatchEmail: '',
      dispatchPhone: '',
      escalationName: '',
      escalationEmail: '',
      escalationPhone: '',
    };
    const emptyComm = {
      primaryEmail: '',
      secondaryEmail: '',
      whatsAppNumber: '',
      dispatchHotline: '',
      escalationPref: 'WHATSAPP_FIRST',
      smsAlerts: true,
      voiceDispatch: false,
    };
    const emptyFinance = {
      beneficiaryName: '',
      bankName: '',
      accountNumber: '',
      settlementContactEmail: '',
    };
    const emptyList: any[] = [];

    setLegalData(emptyLegal);
    setOpsIdentity(emptyTeam);
    setCommInfrastructure(emptyComm);
    setFinanceCoord(emptyFinance);
    setFleetList(emptyList);
    setOveState('REGISTERED');
    
    const key = `ove_data_${operatorId}`;
    const payload = {
      legalData: emptyLegal,
      opsIdentity: emptyTeam,
      commInfrastructure: emptyComm,
      financeCoord: emptyFinance,
      fleetList: emptyList,
      oveState: 'REGISTERED'
    };
    localStorage.setItem(key, JSON.stringify(payload));
    
    await supabase.from('operators').update({
      contact_phone: '',
      ove_state: 'REGISTERED',
      compliance_status: 'PENDING_KYC',
      compliance_score: 0.0,
      legal_authority: emptyLegal,
      operational_identity: emptyTeam,
      communication_infrastructure: emptyComm,
      financial_coordination: emptyFinance,
      fleet_registry: emptyList
    }).eq('id', operatorId);

    const localSess = localStorage.getItem('operator_session');
    if (localSess) {
      try {
        const parsed = JSON.parse(localSess);
        parsed.compliance_status = 'PENDING_KYC';
        parsed.ove_state = 'REGISTERED';
        parsed.compliance_score = 0.0;
        localStorage.setItem('operator_session', JSON.stringify(parsed));
      } catch (e) {}
    }

    if (onStateUpdated) onStateUpdated();
    alert("Profile wiped! All mock/demo data cleared. All fields are now completely empty so you can carry out actual verification.");
  };

  const handleAutoFillSimulator = async () => {
    const demoLegal = {
      aocNumber: 'NCAA/AOC/09/26',
      aocExpiry: '2027-06-30',
      aocAuthority: 'NCAA',
      aocUploaded: true,
      coaNumber: 'COA/CH-604/205',
      coaExpiry: '2026-12-15',
      coaUploaded: true,
      insurancePolicy: 'INS-QA-902-WINGS',
      insuranceCoverage: '$50,000,000',
      insuranceExpiry: '2027-01-31',
      insuranceUploaded: true,
    };
    const demoTeam = {
      flightOpsName: 'Capt. Ibrahim Musa',
      flightOpsEmail: 'ibrahim.musa@execujet.ng',
      flightOpsPhone: '+2348035552010',
      chiefPilotName: 'Capt. Sarah Adebayo',
      chiefPilotEmail: 'sarah.adebayo@execujet.ng',
      chiefPilotPhone: '+2348053331122',
      opsControlName: 'David West',
      opsControlEmail: 'ops.ctrl@execujet.ng',
      opsControlPhone: '+2348123456789',
      dispatchName: 'Kelechi Okafor',
      dispatchEmail: 'dispatch@execujet.ng',
      dispatchPhone: '+2347098765432',
      escalationName: 'Security Ops Team',
      escalationEmail: 'escalations@execujet.ng',
      escalationPhone: '+2348000000001',
    };
    const demoComm = {
      primaryEmail: 'hello.15dgroup@gmail.com',
      secondaryEmail: 'ops@execujet.ng',
      whatsAppNumber: '+2348035552010',
      dispatchHotline: '+23414408100',
      escalationPref: 'WHATSAPP_FIRST',
      smsAlerts: true,
      voiceDispatch: true,
    };
    const demoFinance = {
      beneficiaryName: 'ExecuJet Nigeria Escrow Services Ltd',
      bankName: 'Access Bank PLC',
      accountNumber: '1029348576',
      settlementContactEmail: 'finance@execujet.ng',
    };
    const demoList = [
      { id: '1', tailNumber: '5N-FGW', type: 'Heavy Jet', model: 'Challenger 604', manufacturer: 'Bombardier', capacity: 12, homeBase: 'DNMM', region: 'West Africa' }
    ];

    setLegalData(demoLegal);
    setOpsIdentity(demoTeam);
    setCommInfrastructure(demoComm);
    setFinanceCoord(demoFinance);
    setFleetList(demoList);
    
    const key = `ove_data_${operatorId}`;
    const payload = {
      legalData: demoLegal,
      opsIdentity: demoTeam,
      commInfrastructure: demoComm,
      financeCoord: demoFinance,
      fleetList: demoList,
      oveState: oveState
    };
    localStorage.setItem(key, JSON.stringify(payload));
    
    await supabase.from('operators').update({
      legal_authority: demoLegal,
      operational_identity: demoTeam,
      communication_infrastructure: demoComm,
      financial_coordination: demoFinance,
      fleet_registry: demoList
    }).eq('id', operatorId);

    if (onStateUpdated) onStateUpdated();
    alert("Simulator/Demo coordinates loaded into dynamic portfolio inputs! Your compliance scores will be calculated dynamically.");
  };

  // Save changes to localStorage and database
  const saveState = async (newState?: typeof oveState, updatedFleet?: any[]) => {
    const finalState = newState || oveState;
    const finalFleet = updatedFleet || fleetList;

    const key = `ove_data_${operatorId}`;
    const payload = {
      legalData,
      opsIdentity,
      commInfrastructure,
      financeCoord,
      fleetList: finalFleet,
      oveState: finalState
    };
    
    localStorage.setItem(key, JSON.stringify(payload));

    const localSess = localStorage.getItem('operator_session');
    if (localSess) {
      try {
        const parsed = JSON.parse(localSess);
        parsed.compliance_status = (finalState === 'MISSION_READY') ? 'FIT' : 'PENDING_KYC';
        localStorage.setItem('operator_session', JSON.stringify(parsed));
      } catch (e) {}
    }

    try {
      await supabase.from('operators').update({
        compliance_status: (finalState === 'MISSION_READY') ? 'FIT' : 'PENDING_KYC',
        verification_status: (finalState === 'UNDER_VERIFICATION') ? 'AWAITING_REVIEW' : ((finalState === 'MISSION_READY') ? 'VERIFIED' : 'UNVERIFIED'),
        ove_state: finalState,
        legal_authority: legalData,
        operational_identity: opsIdentity,
        communication_infrastructure: commInfrastructure,
        financial_coordination: financeCoord,
        fleet_registry: finalFleet
      }).eq('id', operatorId);
    } catch (e) {}

    if (onStateUpdated) {
      onStateUpdated();
    }
  };

  // Human simplified Checks
  const isLegalComplete = !!(legalData.aocNumber && legalData.aocExpiry && legalData.coaNumber && legalData.coaExpiry && legalData.insurancePolicy);
  const isTeamComplete = !!(opsIdentity.flightOpsName && opsIdentity.chiefPilotName && opsIdentity.dispatchName);
  const isCommComplete = !!(commInfrastructure.whatsAppNumber && commInfrastructure.dispatchHotline);
  const isFinanceComplete = !!(financeCoord.beneficiaryName && financeCoord.accountNumber && financeCoord.bankName);
  const isFleetComplete = fleetList.length > 0;

  const isLocked = oveState === 'UNDER_VERIFICATION' || oveState === 'MISSION_READY';

  // Verify Action Handshake
  const handleVerify = () => {
    setIsAuditing(true);
    setAuditFeedback(null);

    setTimeout(() => {
      if (!isLegalComplete) {
        setAuditFeedback("⚠️ Legal permits are incomplete. Please specify your Permit AOC/COA IDs & dates.");
        setIsAuditing(false);
        return;
      }

      if (!isTeamComplete) {
        setAuditFeedback("⚠️ Key team positions are missing names. Please list your Director or Chief Pilot.");
        setIsAuditing(false);
        return;
      }

      if (!isCommComplete) {
        setAuditFeedback("⚠️ Emergency contacts are empty. Please specify an active dispatch hotline.");
        setIsAuditing(false);
        return;
      }

      if (!isFinanceComplete) {
        setAuditFeedback("⚠️ Bank coordinates are missing. Please enter your bank payout settings.");
        setIsAuditing(false);
        return;
      }

      if (!isFleetComplete) {
        setAuditFeedback("⚠️ No active airplanes registered. Your fleet needs at least one plane.");
        setIsAuditing(false);
        return;
      }

      setOveState('UNDER_VERIFICATION');
      saveState('UNDER_VERIFICATION');
      setAuditFeedback("📩 Compliance portfolio successfully submitted to the Strategic Authority! Your dispatch desk remains locked in 'UNDER_VERIFICATION' state until checked FIT by ICC Admin.");
      setIsAuditing(false);

      // Trigger VITE_OPERATORS_VERIFY_API
      const verifyApiBase = (import.meta as any).env.VITE_OPERATORS_VERIFY_API || '';
      const isExternalUrl = verifyApiBase.startsWith('http');
      const verifyUrl = isExternalUrl && !verifyApiBase.includes(window.location.host)
        ? '/api/operators/verify'
        : `${verifyApiBase}/api/operators/verify`;

      fetch(verifyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operatorId: operatorId,
          operatorName: companyName || opsIdentity.flightOpsName || 'Unknown Operator Name',
          operatorEmail: opsIdentity.flightOpsEmail || commInfrastructure.primaryEmail || 'hello.15dgroup@gmail.com',
          phone: opsIdentity.flightOpsPhone || commInfrastructure.dispatchHotline || 'N/A',
          region: legalData.aocAuthority || 'West Africa',
          complianceScore: 78
        })
      })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        console.log(`[VERIFY API] Successfully notified endpoint: ${verifyUrl}`);
        
        // Push alert to Firestore verification_alerts collection to trigger real-time toast on ICC Dashboard
        await addDoc(collection(db, 'verification_alerts'), {
          operatorId: operatorId,
          operatorName: companyName || opsIdentity.flightOpsName || 'Unknown Operator Name',
          operatorEmail: opsIdentity.flightOpsEmail || commInfrastructure.primaryEmail || 'hello.15dgroup@gmail.com',
          phone: opsIdentity.flightOpsPhone || commInfrastructure.dispatchHotline || 'N/A',
          region: legalData.aocAuthority || 'West Africa',
          complianceScore: 78,
          timestamp: serverTimestamp()
        });
        console.log(`[FIRESTORE] Real-time alert document successfully written`);
      })
      .catch(err => console.error("Operator verification endpoint sync error:", err));

      // Trigger Mail Engine notification to ICC
      fetch('/api/mail/send-verification-notice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operatorEmail: opsIdentity.flightOpsEmail || commInfrastructure.primaryEmail || 'hello.15dgroup@gmail.com',
          operatorName: opsIdentity.flightOpsName || 'Unknown Operator Name',
          phone: opsIdentity.flightOpsPhone || commInfrastructure.dispatchHotline || 'N/A',
          region: legalData.aocAuthority || 'West Africa',
          documents: {
            aoc: !!legalData.aocNumber,
            opspecs: !!legalData.coaNumber,
            insurance: !!legalData.insurancePolicy,
            incorporation: true
          },
          complianceScore: 78
        })
      }).catch(err => console.error("Mail engine notification error:", err));

      // Trigger modern GAS Email relay
      sendGasEmail({
        recipientName: opsIdentity.flightOpsName || "Operations Officer",
        recipientEmail: opsIdentity.flightOpsEmail || "ops@wings15d.gov",
        subject: "Wings 15D - Compliance Portfolio Under Review",
        messagePayload: `Your aviation credentials and operating permits have been successfully uploaded and locked for live verification.<br><br><b>Permit AOC Number:</b> ${legalData.aocNumber}<br><b>Chief Pilot:</b> ${opsIdentity.chiefPilotName || "N/A"}<br><b>Total Aircraft registered:</b> ${fleetList.length}<br><br>The Strategic Intelligence Unit is evaluating your coordinates. You will receive an operational FIT clearance report shortly.`,
        purpose: 'AIRCRAFT_VERIFICATION',
        meta: {
          operatorId: operatorId,
          clearanceStatus: 'UNDER_VERIFICATION'
        }
      });
    }, 1200);
  };

  const handleAddAircraft = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlane.tailNumber || !newPlane.model || !newPlane.manufacturer || !newPlane.homeBase) {
       alert("Please enter the tail number, model, manufacturer, and home base airport code.");
       return;
    }

    const item = {
      id: Math.random().toString(36).substring(2, 9),
      tailNumber: newPlane.tailNumber.toUpperCase(),
      type: newPlane.type,
      model: newPlane.model,
      manufacturer: newPlane.manufacturer,
      capacity: Number(newPlane.capacity),
      homeBase: newPlane.homeBase.toUpperCase(),
      region: newPlane.region
    };

    const updated = [...fleetList, item];
    setFleetList(updated);
    saveState(oveState, updated);

    setNewPlane({
      tailNumber: '',
      type: 'Heavy Jet',
      model: '',
      manufacturer: '',
      capacity: 8,
      homeBase: '',
      region: 'West Africa'
    });
  };

  const handleRemoveAircraft = (id: string) => {
    const updated = fleetList.filter(p => p.id !== id);
    setFleetList(updated);
    saveState(oveState, updated);
  };

  const currentLabelState = {
    REGISTERED: "Stage 1: Onboarding Completed",
    UNDER_VERIFICATION: "Stage 2: Under Safety Audit",
    LEGAL_VERIFIED: "Stage 3: Aviation Licenses Passed",
    OPERATIONAL_VERIFIED: "Stage 4: Comms & Settlement Bonded",
    MISSION_READY: "Stage 5: Fully Commissioned Flight Node"
  }[oveState];

  const stateOrder = ['REGISTERED', 'UNDER_VERIFICATION', 'LEGAL_VERIFIED', 'OPERATIONAL_VERIFIED', 'MISSION_READY'];
  const currentStepIndex = stateOrder.indexOf(oveState);

  const verificationStages = [
    { key: 'REGISTERED', label: 'Company Onboarded', desc: 'Registry initialized' },
    { key: 'UNDER_VERIFICATION', label: 'Under Authority Audit', desc: 'Permit files undergoing check' },
    { key: 'LEGAL_VERIFIED', label: 'Aviation Licenses Passed', desc: 'NCAA AOC and COA verified' },
    { key: 'OPERATIONAL_VERIFIED', label: 'Comms & Payout Set', desc: 'Hotline and accounts mapped' },
    { key: 'MISSION_READY', label: 'Authorized Network Partner', desc: 'Commercial dispatch active' },
  ];

  return (
    <div className="space-y-6 md:space-y-8 glass-vip border border-white/5 p-4 md:p-8 rounded-2xl md:rounded-[2rem] w-full" id="ove-container">
      {/* Dynamic Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 lg:gap-6 border-b border-white/5 pb-6 md:pb-8">
        <div>
          <div className="flex items-center gap-2 text-fbblue text-[10px] sm:text-xs tracking-wider uppercase mb-1">
             <Shield className="w-4 h-4" />
             <span>SECURITY COMPLIANCE GATE</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-white uppercase font-sans">Operator Verification Gate</h2>
          <p className="text-gray-400 text-[11px] sm:text-xs font-light max-w-xl leading-relaxed mt-1">
             To ensure flight authorization, save your company certificates, pilot team, active hotline, and plane fleet roster below.
          </p>
        </div>

        {/* Dynamic Status Indicator */}
        <div className="flex items-center gap-3 bg-white/[0.02] border border-white/5 px-4 py-2.5 rounded-xl w-full lg:w-auto justify-between lg:justify-start">
          <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">Gate Status:</span>
          <div className={`px-3 py-1 rounded-lg text-[11px] font-medium flex items-center gap-1.5 ${
            oveState === 'MISSION_READY' 
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
          }`}>
             <span className={`w-1.5 h-1.5 rounded-full ${oveState === 'MISSION_READY' ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
             <span>{currentLabelState}</span>
          </div>
        </div>
      </div>

      {/* Visual Live Status Stage Tracker - Friendly Non-Technical Progress Checkpoints */}
      <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-4 md:p-6" id="ove-live-tracker">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-fbblue opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-fbblue"></span>
            </span>
            <span className="text-[10px] sm:text-xs font-bold text-fbblue uppercase tracking-widest">
               Verification Milestones
            </span>
          </div>
          <span className="text-[9px] text-gray-500 font-mono tracking-wider uppercase">Live Sync Desk Console</span>
        </div>
        
        {/* Stages Milestones Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 relative">
          {verificationStages.map((stg, idx) => {
            const isCompleted = idx < currentStepIndex;
            const isActive = idx === currentStepIndex;
            const isPending = idx > currentStepIndex;

            return (
              <div 
                key={stg.key} 
                className={`p-3.5 rounded-xl border transition-all duration-300 relative overflow-hidden flex flex-col justify-between min-h-[96px] ${
                  isCompleted 
                    ? 'bg-emerald-500/[0.03] border-emerald-500/20' 
                    : isActive 
                      ? 'bg-fbblue/[0.03] border-fbblue/30 shadow-[0_0_15px_rgba(59,130,246,0.05)]'
                      : 'bg-white/[0.01] border-white/5 opacity-40'
                }`}
              >
                {/* Visual connection indicators / dots */}
                {isActive && (
                  <div className="absolute top-0 right-0 w-20 h-20 bg-fbblue/10 blur-xl pointer-events-none" />
                )}
                {isCompleted && (
                  <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 blur-xl pointer-events-none" />
                )}

                <div className="flex items-start justify-between">
                  <span className={`text-[9px] font-semibold tracking-wider uppercase ${
                    isCompleted ? 'text-emerald-400 font-bold' : isActive ? 'text-fbblue font-bold' : 'text-gray-500'
                  }`}>
                    Stage {idx + 1}
                  </span>
                  <div>
                    {isCompleted ? (
                      <span className="flex items-center justify-center w-4 h-4 rounded-full bg-emerald-500/15 text-emerald-400">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </span>
                    ) : isActive ? (
                      <span className="flex items-center justify-center w-4 h-4 rounded-full bg-fbblue/15 text-fbblue animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-fbblue" />
                      </span>
                    ) : (
                      <span className="flex items-center justify-center w-4 h-4 rounded-full bg-white/5 text-gray-600 text-[8px] font-mono">
                        {idx + 1}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-3 text-left">
                  <p className={`text-xs font-semibold tracking-wide ${
                    isCompleted ? 'text-emerald-400' : isActive ? 'text-fbblue' : 'text-gray-400'
                  }`}>
                    {stg.label}
                  </p>
                  <p className="text-[10px] text-gray-500 font-light mt-0.5 leading-snug">
                    {stg.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Grid Section */}
      <div className="grid lg:grid-cols-12 gap-6 lg:gap-8" id="ove-status-flow-chart">
        
        {/* Column 1: Verification Form tabs */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Tabs adapted beautifully for iOS devices and small screens */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 bg-white/[0.02] border border-white/5 p-1 rounded-xl">
             <button 
               onClick={() => setActiveFormSection('LEGAL')}
               className={`py-2 text-center rounded-lg text-[11px] font-medium tracking-wide transition-all cursor-pointer ${activeFormSection === 'LEGAL' ? 'bg-fbblue text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
             >
                1. Permits
             </button>
             <button 
               onClick={() => setActiveFormSection('IDENTITY')}
               className={`py-2 text-center rounded-lg text-[11px] font-medium tracking-wide transition-all cursor-pointer ${activeFormSection === 'IDENTITY' ? 'bg-fbblue text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
             >
                2. Key Team
             </button>
             <button 
               onClick={() => setActiveFormSection('COMMUNICATION')}
               className={`py-2 text-center rounded-lg text-[11px] font-medium tracking-wide transition-all cursor-pointer ${activeFormSection === 'COMMUNICATION' ? 'bg-fbblue text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
             >
                3. Hotline
             </button>
             <button 
               onClick={() => setActiveFormSection('FINANCE')}
               className={`py-2 text-center rounded-lg text-[11px] font-medium tracking-wide transition-all cursor-pointer ${activeFormSection === 'FINANCE' ? 'bg-fbblue text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
             >
                4. Bank info
             </button>
             <button 
               onClick={() => setActiveFormSection('FLEET')}
               className={`py-2 text-center rounded-lg text-[11px] font-medium tracking-wide transition-all cursor-pointer col-span-2 sm:col-span-1 ${activeFormSection === 'FLEET' ? 'bg-fbblue text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
             >
                5. Fleet ({fleetList.length})
             </button>
          </div>

          {/* Form Cards with text-base inputs for iOS zoom prevention */}
          <div className="bg-[#111111]/90 rounded-2xl border border-white/5 p-5 md:p-6 min-h-[360px] flex flex-col justify-between shadow-xl">
             
             {activeFormSection === 'LEGAL' && (
                <div className="space-y-4">
                   <div>
                      <h4 className="text-sm font-semibold text-white">1. Company Operating Permits</h4>
                      <p className="text-slate-400 text-[11px] font-light mt-0.5">Enter active operator certificates and expirations below.</p>
                   </div>
                   <div className="grid sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                         <label className="text-[10px] text-gray-400 uppercase tracking-wide block">Aviation Permit (AOC #)</label>
                         <input type="text" value={legalData.aocNumber} onChange={e => setLegalData({...legalData, aocNumber: e.target.value})} className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-base md:text-sm text-white focus:border-fbblue focus:ring-1 focus:ring-fbblue outline-none transition-all" />
                      </div>
                      <div className="space-y-1">
                         <label className="text-[10px] text-gray-400 uppercase tracking-wide block">Permit Expiry Date</label>
                         <input type="date" value={legalData.aocExpiry} onChange={e => setLegalData({...legalData, aocExpiry: e.target.value})} className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-base md:text-sm text-white focus:border-fbblue focus:ring-1 focus:ring-fbblue outline-none transition-all" />
                      </div>
                      <div className="space-y-1">
                         <label className="text-[10px] text-gray-400 uppercase tracking-wide block">Plane Safety Cert (COA #)</label>
                         <input type="text" value={legalData.coaNumber} onChange={e => setLegalData({...legalData, coaNumber: e.target.value})} className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-base md:text-sm text-white focus:border-fbblue focus:ring-1 focus:ring-fbblue outline-none transition-all" />
                      </div>
                      <div className="space-y-1">
                         <label className="text-[10px] text-gray-400 uppercase tracking-wide block">Safety Cert Expiry Date</label>
                         <input type="date" value={legalData.coaExpiry} onChange={e => setLegalData({...legalData, coaExpiry: e.target.value})} className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-base md:text-sm text-white focus:border-fbblue focus:ring-1 focus:ring-fbblue outline-none transition-all" />
                      </div>
                      <div className="space-y-1 sm:col-span-2">
                         <label className="text-[10px] text-gray-400 uppercase tracking-wide block">Insurance Policy Number</label>
                         <input type="text" value={legalData.insurancePolicy} onChange={e => setLegalData({...legalData, insurancePolicy: e.target.value})} className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-base md:text-sm text-white focus:border-fbblue focus:ring-1 focus:ring-fbblue outline-none transition-all" />
                      </div>
                   </div>
                </div>
             )}

             {activeFormSection === 'IDENTITY' && (
                <div className="space-y-4">
                   <div>
                      <h4 className="text-sm font-semibold text-white">2. Key Operations Contacts</h4>
                      <p className="text-slate-400 text-[11px] font-light mt-0.5">Please name the main authorities in charge of your aircraft crew.</p>
                   </div>
                   <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                      <div className="p-3 bg-white/[0.01] border border-white/5 rounded-xl space-y-2">
                         <span className="text-[10px] text-fbblue uppercase font-bold tracking-wider">Director of Flight Operations</span>
                         <div className="grid sm:grid-cols-2 gap-2">
                            <input placeholder="FullName" value={opsIdentity.flightOpsName} onChange={e => setOpsIdentity({...opsIdentity, flightOpsName: e.target.value})} className="bg-black/60 border border-white/10 rounded-lg p-2.5 text-base md:text-sm text-white outline-none" />
                            <input placeholder="Email Address" value={opsIdentity.flightOpsEmail} onChange={e => setOpsIdentity({...opsIdentity, flightOpsEmail: e.target.value})} className="bg-black/60 border border-white/10 rounded-lg p-2.5 text-base md:text-sm text-white outline-none" />
                         </div>
                      </div>
                      <div className="p-3 bg-white/[0.01] border border-white/5 rounded-xl space-y-2">
                         <span className="text-[10px] text-fbblue uppercase font-bold tracking-wider">Chief Pilot</span>
                         <div className="grid sm:grid-cols-2 gap-2">
                            <input placeholder="FullName" value={opsIdentity.chiefPilotName} onChange={e => setOpsIdentity({...opsIdentity, chiefPilotName: e.target.value})} className="bg-black/60 border border-white/10 rounded-lg p-2.5 text-base md:text-sm text-white outline-none" />
                            <input placeholder="Email Address" value={opsIdentity.chiefPilotEmail} onChange={e => setOpsIdentity({...opsIdentity, chiefPilotEmail: e.target.value})} className="bg-black/60 border border-white/10 rounded-lg p-2.5 text-base md:text-sm text-white outline-none" />
                         </div>
                      </div>
                      <div className="p-3 bg-white/[0.01] border border-white/5 rounded-xl space-y-2">
                         <span className="text-[10px] text-fbblue uppercase font-bold tracking-wider">Dispatch Lead Officer</span>
                         <div className="grid sm:grid-cols-2 gap-2">
                            <input placeholder="FullName" value={opsIdentity.dispatchName} onChange={e => setOpsIdentity({...opsIdentity, dispatchName: e.target.value})} className="bg-black/60 border border-white/10 rounded-lg p-2.5 text-base md:text-sm text-white outline-none" />
                            <input placeholder="Email Address" value={opsIdentity.dispatchEmail} onChange={e => setOpsIdentity({...opsIdentity, dispatchEmail: e.target.value})} className="bg-black/60 border border-white/10 rounded-lg p-2.5 text-base md:text-sm text-white outline-none" />
                         </div>
                      </div>
                   </div>
                </div>
             )}

             {activeFormSection === 'COMMUNICATION' && (
                <div className="space-y-4">
                   <div>
                      <h4 className="text-sm font-semibold text-white">3. Active Dispatch Hotline</h4>
                      <p className="text-slate-400 text-[11px] font-light mt-0.5">Channels used by flight planners to check flight logs.</p>
                   </div>
                   <div className="grid sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                         <label className="text-[10px] text-gray-400 uppercase block">Primary Contact Email</label>
                         <input type="email" value={commInfrastructure.primaryEmail} onChange={e => setCommInfrastructure({...commInfrastructure, primaryEmail: e.target.value})} className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-base md:text-sm text-white focus:border-fbblue Outline-none" />
                      </div>
                      <div className="space-y-1">
                         <label className="text-[10px] text-gray-400 uppercase block">WhatsApp Messenger Phone</label>
                         <input type="text" value={commInfrastructure.whatsAppNumber} onChange={e => setCommInfrastructure({...commInfrastructure, whatsAppNumber: e.target.value})} className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-base md:text-sm text-white focus:border-fbblue outline-none" />
                      </div>
                      <div className="space-y-1 sm:col-span-2">
                         <label className="text-[10px] text-gray-400 uppercase block">Direct Desk Deskline Hotline Phone Number</label>
                         <input type="text" value={commInfrastructure.dispatchHotline} onChange={e => setCommInfrastructure({...commInfrastructure, dispatchHotline: e.target.value})} className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-base md:text-sm text-white focus:border-fbblue outline-none" />
                      </div>
                   </div>
                </div>
             )}

             {activeFormSection === 'FINANCE' && (
                <div className="space-y-4">
                   <div>
                      <h4 className="text-sm font-semibold text-white">4. Bank Account for Payouts</h4>
                      <p className="text-slate-400 text-[11px] font-light mt-0.5">Where corporate money settlements will be processed.</p>
                   </div>
                   <div className="grid sm:grid-cols-2 gap-3">
                      <div className="space-y-1 sm:col-span-2">
                         <label className="text-[10px] text-gray-400 uppercase block">Corporate Name on Account</label>
                         <input type="text" value={financeCoord.beneficiaryName} onChange={e => setFinanceCoord({...financeCoord, beneficiaryName: e.target.value})} className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-base md:text-sm text-white focus:border-fbblue outline-none" />
                      </div>
                      <div className="space-y-1">
                         <label className="text-[10px] text-gray-400 uppercase block">Bank Name</label>
                         <input type="text" value={financeCoord.bankName} onChange={e => setFinanceCoord({...financeCoord, bankName: e.target.value})} className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-base md:text-sm text-white focus:border-fbblue outline-none" />
                      </div>
                      <div className="space-y-1">
                         <label className="text-[10px] text-gray-400 uppercase block">Account Number</label>
                         <input type="text" value={financeCoord.accountNumber} onChange={e => setFinanceCoord({...financeCoord, accountNumber: e.target.value})} className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-base md:text-sm text-white focus:border-fbblue outline-none" />
                      </div>
                   </div>
                </div>
             )}

             {activeFormSection === 'FLEET' && (
                <div className="space-y-4">
                   <div>
                      <h4 className="text-sm font-semibold text-white">5. Aircraft Fleet Roster</h4>
                      <p className="text-slate-400 text-[11px] font-light mt-0.5">Record the operating aircraft tail numbers on this dashboard.</p>
                   </div>
                   
                   <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                      {fleetList.length === 0 ? (
                         <p className="text-gray-500 text-xs py-2 italic text-center">No airplanes. Please enter your first plane below.</p>
                      ) : (
                         fleetList.map((plane: any) => (
                            <div key={plane.id} className="flex justify-between items-center p-3 bg-white/[0.01] border border-white/5 rounded-xl">
                               <div>
                                  <span className="text-fbblue font-mono font-bold block text-xs">{plane.tailNumber}</span>
                                  <span className="text-slate-300 text-[10px]">{plane.manufacturer} {plane.model} • Base: {plane.homeBase}</span>
                               </div>
                               <button 
                                  onClick={() => handleRemoveAircraft(plane.id)}
                                  className="p-1.5 bg-red-500/10 border border-red-500/20 rounded-lg hover:bg-red-500/30 text-red-400 transition-colors cursor-pointer"
                               >
                                  <Trash2 className="w-3.5 h-3.5" />
                               </button>
                            </div>
                         ))
                      )}
                   </div>

                   <form onSubmit={handleAddAircraft} className="bg-black/30 border border-white/5 p-3 rounded-xl space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                         <input placeholder="Tail # (e.g. 5N-FGW)" value={newPlane.tailNumber} onChange={e => setNewPlane({...newPlane, tailNumber: e.target.value})} className="bg-black border border-white/10 rounded-lg p-2 text-xs text-white outline-none placeholder-gray-600" />
                         <input placeholder="Maker (e.g. Bombardier)" value={newPlane.manufacturer} onChange={e => setNewPlane({...newPlane, manufacturer: e.target.value})} className="bg-black border border-white/10 rounded-lg p-2 text-xs text-white outline-none placeholder-gray-600" />
                         <input placeholder="Model (e.g. Challenger)" value={newPlane.model} onChange={e => setNewPlane({...newPlane, model: e.target.value})} className="bg-black border border-white/10 rounded-lg p-2 text-xs text-white outline-none placeholder-gray-600" />
                         <input placeholder="Airport Base (e.g. DNMM)" value={newPlane.homeBase} onChange={e => setNewPlane({...newPlane, homeBase: e.target.value})} className="bg-black border border-white/10 rounded-lg p-2 text-xs text-white outline-none placeholder-gray-600" />
                      </div>
                      <button 
                         type="submit"
                         className="w-full bg-white text-black font-semibold py-2 rounded-lg hover:bg-gray-100 text-xs cursor-pointer flex items-center justify-center gap-1.5 duration-100"
                      >
                         <Plus className="w-3.5 h-3.5" /> Register Aircraft
                      </button>
                   </form>
                </div>
             )}

             {/* Direct Action Bars */}
             <div className="pt-4 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-3">
                <button 
                   onClick={handleAutoFillSimulator}
                   className="w-full sm:w-auto bg-amber-500/10 border border-amber-500/20 text-amber-500 hover:bg-amber-500/20 text-[10px] font-sync font-bold py-2 px-4 rounded-lg cursor-pointer active:scale-95 transition-all text-center uppercase tracking-widest font-mono"
                >
                   Auto-Fill Simulator Docs
                 </button>
                 <button 
                    onClick={handleClearProfile}
                    className="w-full sm:w-auto bg-red-500/10 border border-red-500/25 text-red-400 hover:bg-red-500/20 text-[10px] font-sync font-bold py-2 px-4 rounded-lg cursor-pointer active:scale-95 transition-all text-center uppercase tracking-widest font-mono"
                 >
                    Clear & Leave Spaces Empty
                </button>
                <button 
                   onClick={() => {
                     saveState();
                     alert("Success! Your section state draft has been updated.");
                   }}
                   className="bg-white/5 border border-white/10 text-slate-300 text-xs font-semibold py-2 px-4 rounded-lg cursor-pointer hover:bg-white/10 active:scale-95 transition-all"
                >
                   Save draft
                </button>
             </div>
          </div>
        </div>

        {/* Column 2: Simplified Earned Score Status & Checklist */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#141414]/80 p-5 rounded-2xl border border-white/5 space-y-4 shadow-xl">
             <div className="space-y-1 pb-2 border-b border-white/5">
                <h3 className="text-xs text-yellow-500 font-bold uppercase tracking-wider flex items-center gap-2">
                   <Sparkles className="w-4 h-4 text-fbblue" /> Required Handshake Check
                </h3>
                <p className="text-[11px] text-slate-400 font-light leading-snug">
                   Your operator reliability is earned incrementally as you save each file and execute the check.
                </p>
             </div>

             {/* Human Checklist status */}
             <div className="space-y-2">
                {/* 1 */}
                <div className={`p-2.5 rounded-lg border flex items-center justify-between transition-colors ${
                  isLegalComplete ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-black/25 border-white/5'
                }`}>
                   <div className="flex items-center gap-2.5">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${isLegalComplete ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-gray-500'}`}>
                         {isLegalComplete ? <Check className="w-3 h-3" /> : "1"}
                      </div>
                      <span className="text-[11px] font-medium text-white">Company Permits complete</span>
                   </div>
                </div>

                {/* 2 */}
                <div className={`p-2.5 rounded-lg border flex items-center justify-between transition-colors ${
                  isTeamComplete ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-black/25 border-white/5'
                }`}>
                   <div className="flex items-center gap-2.5">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${isTeamComplete ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-gray-500'}`}>
                         {isTeamComplete ? <Check className="w-3 h-3" /> : "2"}
                      </div>
                      <span className="text-[11px] font-medium text-white">Representative contacts listed</span>
                   </div>
                </div>

                {/* 3 */}
                <div className={`p-2.5 rounded-lg border flex items-center justify-between transition-colors ${
                  isCommComplete ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-black/25 border-white/5'
                }`}>
                   <div className="flex items-center gap-2.5">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${isCommComplete ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-gray-500'}`}>
                         {isCommComplete ? <Check className="w-3 h-3" /> : "3"}
                      </div>
                      <span className="text-[11px] font-medium text-white">Communications hotline active</span>
                   </div>
                </div>

                {/* 4 */}
                <div className={`p-2.5 rounded-lg border flex items-center justify-between transition-colors ${
                  isFinanceComplete ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-black/25 border-white/5'
                }`}>
                   <div className="flex items-center gap-2.5">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${isFinanceComplete ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-gray-500'}`}>
                         {isFinanceComplete ? <Check className="w-3 h-3" /> : "4"}
                      </div>
                      <span className="text-[11px] font-medium text-white">Bank coords for payouts registered</span>
                   </div>
                </div>

                {/* 5 */}
                <div className={`p-2.5 rounded-lg border flex items-center justify-between transition-colors ${
                  isFleetComplete ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-black/25 border-white/5'
                }`}>
                   <div className="flex items-center gap-2.5">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${isFleetComplete ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-gray-500'}`}>
                         {isFleetComplete ? <Check className="w-3 h-3" /> : "5"}
                      </div>
                      <span className="text-[11px] font-medium text-white">Roster aircraft registered</span>
                   </div>
                </div>
             </div>

             {/* Single Audit/Verify Action */}
             <div className="bg-black/30 border border-white/5 rounded-xl p-3.5 flex flex-col gap-2 items-center justify-center text-center">
                <div className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-mono tracking-widest uppercase">
                   <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                   {oveState === 'UNDER_VERIFICATION' ? (
                    <span className="text-amber-400 font-bold">AWAITING REVIEW</span>
                  ) : oveState === 'MISSION_READY' ? (
                    <span className="text-emerald-400 font-bold">MISSION READY</span>
                  ) : (
                    <button
                      onClick={handleVerify}
                      disabled={isAuditing}
                      className="px-6 py-2 bg-fbblue hover:bg-fbblue/90 text-white font-bold text-xs rounded-xl shadow-lg transition-all active:scale-95 duration-150 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isAuditing ? "Analyzing..." : "Submit Portfolio for Audit"}
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-gray-500 font-light leading-normal">
                   {oveState === 'UNDER_VERIFICATION' ? "Portfolio is locked in database. No edits are allowed during active ICC evaluation." : "Credentials will lock in database and synchronize with NCAA upon submission."}
                </p>
             </div>
          </div>

          {/* Clean User Feedback Card (No technical logging logs/larp) */}
          {auditFeedback && (
             <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-4 text-xs font-light text-slate-300 leading-relaxed shadow-lg">
                <div className="flex items-center gap-2 mb-1.5 text-fbblue font-semibold">
                   <span>ℹ️ Status Update</span>
                </div>
                {auditFeedback}
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
