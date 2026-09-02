import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plane,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  MapPin,
  Users,
  Lock,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Search,
  Filter,
  CreditCard,
  DollarSign,
  Share2,
  Check,
  Calendar,
  Compass,
  AlertCircle
} from 'lucide-react';
import { copyToClipboard } from '../../lib/utils';

interface OperationalIntegrityIndexProps {
  missionId?: string;
  regionalQuotaCount?: number;
  regionalQuotaTarget?: number;
  daysInactive?: number;
}

interface AvailableAircraft {
  id: string;
  model: string;
  tail: string;
  category: 'Midsize Jet' | 'Heavy Jet' | 'Ultra Long Range' | 'Light Jet';
  hub: string;
  hubName: string;
  pax: number;
  range: string;
  speed: string;
  ratePerHourUsd: number;
  readiness: 'READY_NOW' | 'READY_90M' | 'AVAILABLE';
  operator: string;
}

interface EmptyLegFlight {
  id: string;
  origin: string;
  originName: string;
  destination: string;
  destName: string;
  aircraft: string;
  tail: string;
  pax: number;
  departureDate: string;
  departureTimeUtc: string;
  emptyPriceUsd: number;
  regularPriceUsd: number;
  discountPct: number;
  status: 'AVAILABLE' | 'FEW_SEATS' | 'HOLD';
}

interface BookedMission {
  id: string;
  route: string;
  depIcao: string;
  destIcao: string;
  depName: string;
  destName: string;
  aircraft: string;
  tail: string;
  pax: number;
  escrowStatus: 'PAID_AND_SECURED' | 'HOLD' | 'COMPLETED';
  escrowAmountUsd: number;
  targetDeparture: string;
  captain: string;
  fboLounge: string;
  currentMilestone: number; // 1 to 4
}

const SAMPLE_AVAILABLE_FLEET: AvailableAircraft[] = [
  {
    id: 'ac-1',
    model: 'Bombardier Challenger 604',
    tail: '5N-MAX',
    category: 'Heavy Jet',
    hub: 'DNAA',
    hubName: 'Abuja Nnamdi Azikiwe',
    pax: 12,
    range: '4,000 NM',
    speed: '470 KTAS',
    ratePerHourUsd: 6500,
    readiness: 'READY_NOW',
    operator: 'Max Air Charter (AOC #MA-044)',
  },
  {
    id: 'ac-2',
    model: 'Hawker 900XP',
    tail: '5N-BKI',
    category: 'Midsize Jet',
    hub: 'DNMM',
    hubName: 'Lagos Murtala Muhammed',
    pax: 8,
    range: '2,900 NM',
    speed: '483 KTAS',
    ratePerHourUsd: 4800,
    readiness: 'READY_90M',
    operator: 'Air Peace Executive (AOC #AP-2024)',
  },
  {
    id: 'ac-3',
    model: 'Gulfstream G650ER',
    tail: 'G-LUXX',
    category: 'Ultra Long Range',
    hub: 'EGGW / DNMM',
    hubName: 'London Luton & Lagos Hub',
    pax: 14,
    range: '7,500 NM',
    speed: '516 KTAS',
    ratePerHourUsd: 11200,
    readiness: 'AVAILABLE',
    operator: 'Westminster Jets UK (AOC #UK-771)',
  },
  {
    id: 'ac-4',
    model: 'Embraer Phenom 300',
    tail: '5N-PHN',
    category: 'Light Jet',
    hub: 'DNPO',
    hubName: 'Port Harcourt Int.',
    pax: 7,
    range: '2,010 NM',
    speed: '464 KTAS',
    ratePerHourUsd: 3900,
    readiness: 'READY_NOW',
    operator: 'ExecuJet West Africa',
  },
  {
    id: 'ac-5',
    model: 'Cessna Citation XLS+',
    tail: '5N-XLS',
    category: 'Midsize Jet',
    hub: 'DNKN',
    hubName: 'Kano Mallam Aminu',
    pax: 9,
    range: '2,100 NM',
    speed: '441 KTAS',
    ratePerHourUsd: 4400,
    readiness: 'READY_NOW',
    operator: 'Air Peace Executive (AOC #AP-2024)',
  },
];

const SAMPLE_EMPTY_LEGS: EmptyLegFlight[] = [
  {
    id: 'el-01',
    origin: 'LOS / DNMM',
    originName: 'Lagos (ExecuJet Terminal)',
    destination: 'ABV / DNAA',
    destName: 'Abuja (General Aviation Terminal)',
    aircraft: 'Hawker 900XP',
    tail: '5N-BKI',
    pax: 8,
    departureDate: 'Tomorrow',
    departureTimeUtc: '14:00 UTC',
    emptyPriceUsd: 9200,
    regularPriceUsd: 15800,
    discountPct: 42,
    status: 'AVAILABLE',
  },
  {
    id: 'el-02',
    origin: 'ABV / DNAA',
    originName: 'Abuja (DNAA)',
    destination: 'PHC / DNPO',
    destName: 'Port Harcourt (DNPO)',
    aircraft: 'Challenger 604',
    tail: '5N-MAX',
    pax: 12,
    departureDate: 'In 2 Days',
    departureTimeUtc: '11:30 UTC',
    emptyPriceUsd: 10800,
    regularPriceUsd: 18500,
    discountPct: 41,
    status: 'AVAILABLE',
  },
  {
    id: 'el-03',
    origin: 'LTN / EGGW',
    originName: 'London Luton (Signature FBO)',
    destination: 'NCE / LFMN',
    destName: 'Nice Côte d\'Azur (France)',
    aircraft: 'Gulfstream G650',
    tail: 'G-LUXX',
    pax: 14,
    departureDate: 'This Friday',
    departureTimeUtc: '16:00 UTC',
    emptyPriceUsd: 17500,
    regularPriceUsd: 31000,
    discountPct: 44,
    status: 'FEW_SEATS',
  },
  {
    id: 'el-04',
    origin: 'ACC / DGAA',
    originName: 'Accra Kotoka (Ghana)',
    destination: 'LOS / DNMM',
    destName: 'Lagos (DNMM)',
    aircraft: 'Phenom 300',
    tail: '5N-PHN',
    pax: 7,
    departureDate: 'Saturday',
    departureTimeUtc: '10:00 UTC',
    emptyPriceUsd: 6900,
    regularPriceUsd: 12200,
    discountPct: 43,
    status: 'AVAILABLE',
  },
];

export const OperationalIntegrityIndex: React.FC<OperationalIntegrityIndexProps> = ({
  missionId = '15D-001',
}) => {
  const [activeTab, setActiveTab] = useState<'ALL' | 'PAID_MISSIONS' | 'FLEET' | 'EMPTY_LEGS'>('ALL');
  const [selectedHub, setSelectedHub] = useState<string>('ALL');
  const [bookedMissionsList, setBookedMissionsList] = useState<BookedMission[]>([
    {
      id: missionId,
      route: 'Lagos (DNMM) ➔ Abuja (DNAA)',
      depIcao: 'DNMM',
      destIcao: 'DNAA',
      depName: 'Lagos (ExecuJet VIP Terminal)',
      destName: 'Abuja (Nnamdi Azikiwe International)',
      aircraft: 'Hawker 900XP',
      tail: '5N-BKI',
      pax: 6,
      escrowStatus: 'PAID_AND_SECURED',
      escrowAmountUsd: 18687,
      targetDeparture: 'Tomorrow • 14:00 Local (13:00 UTC)',
      captain: 'Capt. T. Adeleke / FO M. Bello',
      fboLounge: 'ExecuJet VIP Presidential Suite',
      currentMilestone: 3,
    },
    {
      id: '15D-042',
      route: 'Abuja (DNAA) ➔ London Luton (EGGW)',
      depIcao: 'DNAA',
      destIcao: 'EGGW',
      depName: 'Abuja General Aviation Terminal',
      destName: 'London Luton Signature FBO',
      aircraft: 'Gulfstream G650ER',
      tail: 'G-LUXX',
      pax: 10,
      escrowStatus: 'PAID_AND_SECURED',
      escrowAmountUsd: 68500,
      targetDeparture: 'Friday • 09:30 Local',
      captain: 'Capt. J. Henderson / FO R. Adebayo',
      fboLounge: 'Signature Aviation Terminal',
      currentMilestone: 2,
    },
  ]);

  const [claimedLeg, setClaimedLeg] = useState<EmptyLegFlight | null>(null);
  const [copiedShare, setCopiedShare] = useState<boolean>(false);
  const [requestedAircraft, setRequestedAircraft] = useState<AvailableAircraft | null>(null);

  const filteredFleet = SAMPLE_AVAILABLE_FLEET.filter((ac) => {
    if (selectedHub === 'ALL') return true;
    return ac.hub.includes(selectedHub);
  });

  const handleShareMission = async (mission: BookedMission) => {
    const shareText = `15D WINGS FLIGHT MISSION STATUS\nMission ID: ${mission.id}\nRoute: ${mission.route}\nAircraft: ${mission.aircraft} (${mission.tail})\nPayment & Escrow: PAID & ESCROW SECURED ($${mission.escrowAmountUsd.toLocaleString()})\nDeparture: ${mission.targetDeparture}\nStatus: Flight Pre-Briefing & Handling Confirmed`;
    await copyToClipboard(shareText);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 3000);
  };

  return (
    <div className="space-y-6 text-left">
      {/* Top Banner & Filter Navigation */}
      <div className="bg-white border border-purple-200 shadow-xl rounded-[2rem] p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-purple-100">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-600 animate-pulse" />
              <span className="font-sync text-[10px] text-purple-700 tracking-[0.25em] font-bold uppercase">
                FLEET TRACKING & MISSIONS RADAR
              </span>
            </div>
            <h2 className="font-sync text-xl md:text-2xl font-bold tracking-wider text-gray-950 uppercase">
              Fleet Availability, Empty Legs & Paid Missions
            </h2>
            <p className="text-xs text-gray-600 font-medium font-sans">
              Instant overview of verified aircraft ready for charter, exclusive discounted empty legs, and live status of your booked and paid flights.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-800 text-[10px] font-sync tracking-wider uppercase font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> All Aircraft AOC Verified
            </span>
          </div>
        </div>

        {/* Filter Navigation Tabs */}
        <div className="flex items-center gap-2 pt-6 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-4 py-2.5 rounded-full text-xs font-sync uppercase font-bold tracking-wider transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'ALL'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200'
            }`}
          >
            All Operations Overview
          </button>
          <button
            onClick={() => setActiveTab('PAID_MISSIONS')}
            className={`px-4 py-2.5 rounded-full text-xs font-sync uppercase font-bold tracking-wider transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'PAID_MISSIONS'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200'
            }`}
          >
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            <span>Booked & Paid Missions ({bookedMissionsList.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('FLEET')}
            className={`px-4 py-2.5 rounded-full text-xs font-sync uppercase font-bold tracking-wider transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'FLEET'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200'
            }`}
          >
            <Plane className="w-3.5 h-3.5 text-purple-600" />
            <span>Available Network Jets ({SAMPLE_AVAILABLE_FLEET.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('EMPTY_LEGS')}
            className={`px-4 py-2.5 rounded-full text-xs font-sync uppercase font-bold tracking-wider transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'EMPTY_LEGS'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Empty Legs — Save Up to 45%</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: BOOKED & PAID FLIGHT MISSIONS STATUS */}
      {(activeTab === 'ALL' || activeTab === 'PAID_MISSIONS') && (
        <div className="bg-white border border-purple-200 shadow-xl rounded-[2rem] p-6 md:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-purple-100">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded bg-emerald-100 text-emerald-700">
                  <ShieldCheck className="w-4 h-4" />
                </span>
                <span className="font-sync text-xs font-bold uppercase tracking-wider text-emerald-800">
                  STATUS OF BOOKED & PAID MISSIONS
                </span>
              </div>
              <h3 className="font-sync text-lg font-bold text-gray-950 uppercase">
                Active Client Flights Under Escrow Protection
              </h3>
            </div>
            <span className="text-xs text-gray-500 font-medium">
              Funds locked until wheels up & completed mission release
            </span>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {bookedMissionsList.map((m) => (
              <div
                key={m.id}
                className="bg-purple-50/40 border-2 border-purple-200/90 rounded-2xl p-6 space-y-6 hover:shadow-md transition-all"
              >
                {/* Mission Header Bar */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-purple-200/80">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xl font-bold text-purple-900 bg-white px-3 py-1 rounded-xl border border-purple-200 shadow-sm">
                        {m.id}
                      </span>
                      <span className="font-sync text-sm md:text-base font-bold text-gray-950 uppercase">
                        {m.route}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 font-medium">
                      Departure: <span className="font-semibold text-gray-900">{m.targetDeparture}</span>
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-3.5 py-1.5 rounded-full bg-emerald-600 text-white text-[11px] font-sync uppercase font-bold tracking-wider flex items-center gap-1.5 shadow-sm">
                      <Lock className="w-3.5 h-3.5" />
                      <span>PAID & ESCROW SECURED</span>
                    </span>
                    <span className="px-3 py-1.5 rounded-full bg-white text-purple-900 border border-purple-200 text-xs font-mono font-bold shadow-sm">
                      ${m.escrowAmountUsd.toLocaleString()} USD
                    </span>
                  </div>
                </div>

                {/* 4-Step Operational Milestone Tracker */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-sync font-bold uppercase text-gray-700">
                    <span>MISSION FLIGHT DISPATCH TIMELINE</span>
                    <span className="text-purple-700 font-mono">
                      {m.currentMilestone === 4 ? 'WHEELS UP' : 'PRE-FLIGHT STAGE 3 OF 4'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-sync uppercase font-bold text-emerald-800">STEP 1</span>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      </div>
                      <p className="text-xs font-bold text-gray-900">Escrow Cleared</p>
                      <p className="text-[10px] text-gray-600 font-medium">100% Funds locked in bank vault</p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-sync uppercase font-bold text-emerald-800">STEP 2</span>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      </div>
                      <p className="text-xs font-bold text-gray-900">Aircraft Allocated</p>
                      <p className="text-[10px] text-gray-600 font-medium">{m.aircraft} ({m.tail})</p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-purple-100/90 border border-purple-300 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-sync uppercase font-bold text-purple-900">STEP 3</span>
                        <Clock className="w-4 h-4 text-purple-700 animate-spin" />
                      </div>
                      <p className="text-xs font-bold text-gray-900">VIP FBO Lounge Ready</p>
                      <p className="text-[10px] text-gray-600 font-medium">{m.fboLounge}</p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-white border border-gray-200 space-y-1 opacity-70">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-sync uppercase font-bold text-gray-500">STEP 4</span>
                        <Plane className="w-4 h-4 text-gray-400" />
                      </div>
                      <p className="text-xs font-bold text-gray-700">Wheels Up & Airborne</p>
                      <p className="text-[10px] text-gray-500 font-medium">Scheduled at departure gate</p>
                    </div>
                  </div>
                </div>

                {/* Mission Details & Action Grid */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-purple-200/60">
                  <div className="flex flex-wrap items-center gap-4 text-xs text-gray-700">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-purple-600" />
                      <span className="font-medium">{m.pax} Passengers Confirmed</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span className="font-medium">{m.captain}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleShareMission(m)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-purple-50 border border-purple-300 text-purple-900 text-xs font-sync uppercase font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
                    >
                      {copiedShare ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5 text-purple-600" />}
                      <span>{copiedShare ? 'STATUS COPIED!' : 'SHARE STATUS'}</span>
                    </button>

                    <button
                      onClick={() => alert(`Mission ${m.id} Escrow Confirmation:\n- Amount: $${m.escrowAmountUsd.toLocaleString()} USD\n- Aircraft: ${m.aircraft} (${m.tail})\n- Status: 100% Escrow Protected by Providus Bank & Fireblocks.`)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-sync uppercase font-bold transition-all shadow-md active:scale-95 cursor-pointer"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>ESCROW RECEIPT</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 2: EMPTY LEGS (DISCOUNTED RETURN FLIGHTS) */}
      {(activeTab === 'ALL' || activeTab === 'EMPTY_LEGS') && (
        <div className="bg-white border border-purple-200 shadow-xl rounded-[2rem] p-6 md:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-purple-100">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded bg-amber-100 text-amber-700">
                  <Sparkles className="w-4 h-4" />
                </span>
                <span className="font-sync text-xs font-bold uppercase tracking-wider text-amber-800">
                  EXCLUSIVE EMPTY LEGS — SAVE 40% TO 45%
                </span>
              </div>
              <h3 className="font-sync text-lg font-bold text-gray-950 uppercase">
                Repositioning Flights Ready for Immediate Booking
              </h3>
            </div>
            <p className="text-xs text-gray-500 font-medium">
              Real-time available empty legs with fixed guaranteed pricing
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SAMPLE_EMPTY_LEGS.map((leg) => (
              <div
                key={leg.id}
                className="p-5 rounded-2xl bg-purple-50/50 border border-purple-200 hover:border-purple-400 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-sync font-bold uppercase">
                      SAVE {leg.discountPct}% OFF
                    </span>
                    <span className="font-mono text-xs font-bold text-gray-600">
                      {leg.departureDate} • {leg.departureTimeUtc}
                    </span>
                  </div>

                  {/* Route */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-base font-bold text-gray-950 font-sync">
                      <span>{leg.origin}</span>
                      <ArrowRight className="w-4 h-4 text-purple-600 shrink-0" />
                      <span>{leg.destination}</span>
                    </div>
                    <p className="text-xs text-gray-600 font-medium">
                      {leg.originName} ➔ {leg.destName}
                    </p>
                  </div>

                  {/* Aircraft Specs */}
                  <div className="flex items-center gap-4 text-xs text-gray-700 pt-1">
                    <div className="flex items-center gap-1">
                      <Plane className="w-3.5 h-3.5 text-purple-600" />
                      <span className="font-semibold text-gray-900">{leg.aircraft}</span>
                      <span className="text-gray-500 font-mono">({leg.tail})</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-gray-500" />
                      <span>{leg.pax} Seats</span>
                    </div>
                  </div>
                </div>

                {/* Price & Booking Button */}
                <div className="pt-3 border-t border-purple-200/80 flex items-center justify-between">
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-mono font-bold text-purple-900">
                        ${leg.emptyPriceUsd.toLocaleString()}
                      </span>
                      <span className="text-xs font-mono text-gray-400 line-through">
                        ${leg.regularPriceUsd.toLocaleString()}
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-500 uppercase font-sync block">Total Wholesale Price</span>
                  </div>

                  <button
                    onClick={() => {
                      setClaimedLeg(leg);
                      alert(`Empty leg flight selected: ${leg.origin} ➔ ${leg.destination} on ${leg.aircraft} for $${leg.emptyPriceUsd.toLocaleString()} USD.\n\nPre-filled into proposal builder & booking engine.`);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-sync text-xs font-bold uppercase transition-all shadow-sm active:scale-95 cursor-pointer"
                  >
                    CLAIM EMPTY LEG
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 3: AVAILABLE FLIGHTS & NETWORK FLEET */}
      {(activeTab === 'ALL' || activeTab === 'FLEET') && (
        <div className="bg-white border border-purple-200 shadow-xl rounded-[2rem] p-6 md:p-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-purple-100">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded bg-purple-100 text-purple-700">
                  <Plane className="w-4 h-4" />
                </span>
                <span className="font-sync text-xs font-bold uppercase tracking-wider text-purple-800">
                  AVAILABLE NETWORK FLEET READY FOR DISPATCH
                </span>
              </div>
              <h3 className="font-sync text-lg font-bold text-gray-950 uppercase">
                Verified Aircraft Ready for Immediate Charter
              </h3>
            </div>

            {/* Hub Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-sync font-bold uppercase text-gray-600">HUB:</span>
              <select
                value={selectedHub}
                onChange={(e) => setSelectedHub(e.target.value)}
                className="bg-white border border-purple-200 rounded-xl px-3 py-1.5 text-xs text-gray-900 font-semibold focus:border-purple-500 outline-none cursor-pointer shadow-sm"
              >
                <option value="ALL">All Hubs & Bases</option>
                <option value="DNMM">Lagos (DNMM)</option>
                <option value="DNAA">Abuja (DNAA)</option>
                <option value="DNPO">Port Harcourt (DNPO)</option>
                <option value="EGGW">London Luton (EGGW)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFleet.map((ac) => (
              <div
                key={ac.id}
                className="p-5 rounded-2xl bg-white border border-purple-200 hover:border-purple-400 hover:shadow-lg transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-full bg-purple-100 text-purple-800 text-[10px] font-sync font-bold uppercase border border-purple-200">
                      {ac.category}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-sync font-bold uppercase ${
                        ac.readiness === 'READY_NOW'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-purple-100 text-purple-800 border border-purple-200'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      {ac.readiness === 'READY_NOW' ? 'READY ON RAMP' : ac.readiness === 'READY_90M' ? 'READY IN 90M' : 'AVAILABLE'}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-sync text-sm font-bold text-gray-950 uppercase">{ac.model}</h4>
                    <p className="text-xs font-mono text-purple-700 font-semibold">Tail: {ac.tail}</p>
                    <p className="text-[11px] text-gray-500">{ac.operator}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-purple-50/60 border border-purple-100 space-y-1.5 text-xs text-gray-700">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Base Location:</span>
                      <span className="font-semibold text-gray-900">{ac.hubName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Passenger Capacity:</span>
                      <span className="font-semibold text-gray-900">{ac.pax} VIP Seats</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Maximum Range:</span>
                      <span className="font-semibold text-gray-900">{ac.range}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Cruise Speed:</span>
                      <span className="font-semibold text-gray-900">{ac.speed}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-purple-100 flex items-center justify-between">
                  <div>
                    <span className="text-base font-mono font-bold text-purple-900">
                      ${ac.ratePerHourUsd.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-gray-500 block">per flight hour</span>
                  </div>

                  <button
                    onClick={() => {
                      setRequestedAircraft(ac);
                      alert(`Selected ${ac.model} (${ac.tail}) based at ${ac.hub}.\n\nAircraft assigned for instant charter quoting.`);
                    }}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-sync text-xs font-bold uppercase transition-all shadow-sm active:scale-95 cursor-pointer"
                  >
                    REQUEST JET
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
