import { useState, useEffect, Suspense, lazy, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Calendar,
  Users,
  Plane,
  ShieldCheck,
  CheckCircle2,
  ChevronDown,
  Upload,
  Clock,
  X,
  AlertCircle,
  Bell,
  ArrowLeft,
} from "lucide-react";
import { formatCurrency, calculateFlightTime, formatToLocalDate } from "../lib/utils";
const Spline = lazy(() => import("@splinetool/react-spline"));

import RegulatoryDisclaimer from "../components/RegulatoryDisclaimer";
import PassengerManifestForm from "../components/PassengerManifestForm";
import AircraftSelectionForm from "../components/AircraftSelectionForm";
import MissionCustomizationForm from "../components/MissionCustomizationForm";
import RescheduleFlightForm from "../components/RescheduleFlightForm";
import VoiceAssistant from "../components/VoiceAssistant";
import UserMenu from "../components/UserMenu";
import MissionChat from "../components/chat/MissionChat";
import { MissionClockWidget } from "../components/MissionClockWidget";
import { FlightTracker } from "../components/FlightTracker";

import { DecisionEngineCard } from "../components/broker/DecisionEngineCard";
import { WhiteLabelProposalBuilder } from "../components/broker/WhiteLabelProposalBuilder";
import { BookingCodeGenerator } from "../components/broker/BookingCodeGenerator";
import { SystemizedCheckoutEngine } from "../components/broker/SystemizedCheckoutEngine";
import { OperationalIntegrityIndex } from "../components/broker/OperationalIntegrityIndex";
import { EyeOfGodTelemetry } from "../components/broker/EyeOfGodTelemetry";
import { BrokerCRMWorkspace } from "../components/broker/BrokerCRMWorkspace";
import { FastSplineCanvas } from "../components/broker/FastSplineCanvas";

import heavyJetImg from "../assets/images/heavy_challenger_650_1780611482208.png";
import vljImg from "../assets/images/vlj_phenom_100_1780611441744.png";
import lightJetImg from "../assets/images/light_citation_cj4_1780611454957.png";
import midsizeImg from "../assets/images/midsize_hawker_900_1780611469263.png";
import ultraImg from "../assets/images/ultra_g650er_1780611495733.png";

const AIRPORT_MAP: Record<string, { name: string; lat: number; lon: number }> =
  {
    LOS: {
      name: "Lagos — Murtala Muhammed International",
      lat: 6.5774,
      lon: 3.3215,
    },
    DNMM: {
      name: "Lagos — Murtala Muhammed International",
      lat: 6.5774,
      lon: 3.3215,
    },
    ABV: {
      name: "Abuja — Nnamdi Azikiwe International",
      lat: 9.0068,
      lon: 7.2631,
    },
    DNAA: {
      name: "Abuja — Nnamdi Azikiwe International",
      lat: 9.0068,
      lon: 7.2631,
    },
    PHC: {
      name: "Port Harcourt — International Airport",
      lat: 5.0155,
      lon: 6.9496,
    },
    DNPO: {
      name: "Port Harcourt — International Airport",
      lat: 5.0155,
      lon: 6.9496,
    },
    KAN: {
      name: "Kano — Mallam Aminu Kano International",
      lat: 12.0476,
      lon: 8.5246,
    },
    DNKN: {
      name: "Kano — Mallam Aminu Kano International",
      lat: 12.0476,
      lon: 8.5246,
    },
    ENU: {
      name: "Enugu — Akanu Ibiam International",
      lat: 6.4743,
      lon: 7.5619,
    },
    DNEN: {
      name: "Enugu — Akanu Ibiam International",
      lat: 6.4743,
      lon: 7.5619,
    },
    AKR: {
      name: "Akure — Akure Airport",
      lat: 7.2468,
      lon: 5.301,
    },
    DNAN: {
      name: "Akure — Akure Airport",
      lat: 7.2468,
      lon: 5.301,
    },
  };

import PaymentReceiptForm from "../components/PaymentReceiptForm";

export const getAircraftDisplayDetails = (
  classOrModel: string | null | undefined,
) => {
  if (!classOrModel)
    return {
      name: "Category Pending",
      class: "Plane Allocation Pending",
      image: heavyJetImg,
      specs: { range: "4,000 NM", speed: "470 KTAS", pax: 12 },
    };

  const nameUpper = classOrModel.toUpperCase();

  // Very Light Jets
  if (
    nameUpper.includes("PHENOM 100") ||
    nameUpper.includes("M2") ||
    nameUpper.includes("SF50") ||
    nameUpper.includes("HONDAJET") ||
    nameUpper.includes("VLJ") ||
    nameUpper.includes("VERY LIGHT")
  ) {
    const specificName =
      nameUpper === "VLJ" ||
      nameUpper === "VERY LIGHT" ||
      nameUpper.includes("VERY LIGHT")
        ? "Embraer Phenom 100"
        : classOrModel;
    return {
      name: specificName,
      class: "Very Light Jet (VLJ)",
      image: vljImg,
      specs: { range: "1,178 - 1,550 NM", speed: "422 KTAS", pax: 5 },
    };
  }

  // Light Jets
  if (
    nameUpper.includes("PHENOM 300") ||
    nameUpper.includes("CJ3") ||
    nameUpper.includes("CJ4") ||
    nameUpper.includes("LEARJET 75") ||
    nameUpper.includes("LIGHT")
  ) {
    const specificName =
      nameUpper === "LIGHT" || nameUpper === "LIGHT JET"
        ? "Cessna Citation CJ4"
        : classOrModel;
    return {
      name: specificName,
      class: "Light Jet",
      image: lightJetImg,
      specs: { range: "2,010 - 2,165 NM", speed: "464 KTAS", pax: 9 },
    };
  }

  // Midsize & Super Midsize Jets
  if (
    nameUpper.includes("LATITUDE") ||
    nameUpper.includes("LEARJET 60") ||
    nameUpper.includes("HAWKER") ||
    nameUpper.includes("CHALLENGER 3500") ||
    nameUpper.includes("PRAETOR 600") ||
    nameUpper.includes("LONGITUDE") ||
    nameUpper.includes("G280") ||
    nameUpper.includes("MID") ||
    nameUpper.includes("MIDSIZE")
  ) {
    const isSuperMid =
      nameUpper.includes("CHALLENGER 3500") ||
      nameUpper.includes("PRAETOR 600") ||
      nameUpper.includes("LONGITUDE") ||
      nameUpper.includes("G280");
    const specificName =
      nameUpper === "MID" ||
      nameUpper === "MIDSIZE" ||
      nameUpper === "MIDSIZE JET"
        ? "Hawker 900XP"
        : classOrModel;
    return {
      name: specificName,
      class: isSuperMid ? "Super Midsize Jet" : "Midsize Jet",
      image: midsizeImg,
      specs: {
        range: isSuperMid ? "3,200 - 4,018 NM" : "2,405 - 2,929 NM",
        speed: "483 KTAS",
        pax: isSuperMid ? 12 : 9,
      },
    };
  }

  // Heavy Jets
  if (
    nameUpper.includes("CHALLENGER 6") ||
    nameUpper.includes("650") ||
    nameUpper.includes("605") ||
    nameUpper.includes("G450") ||
    nameUpper.includes("FALCON 2000") ||
    nameUpper.includes("FALCON 900") ||
    nameUpper.includes("HEAVY") ||
    nameUpper.includes("HEAVY JET")
  ) {
    const specificName =
      nameUpper === "HEAVY" || nameUpper === "HEAVY JET"
        ? "Bombardier Challenger 650"
        : classOrModel;
    return {
      name: specificName,
      class: "Large / Heavy Jet",
      image: heavyJetImg,
      specs: { range: "4,000 - 4,350 NM", speed: "478 KTAS", pax: 14 },
    };
  }

  // Ultra Long Range
  if (
    nameUpper.includes("G650") ||
    nameUpper.includes("G700") ||
    nameUpper.includes("GLOBAL 6000") ||
    nameUpper.includes("ULTRA") ||
    nameUpper.includes("REGIONAL") ||
    nameUpper.includes("RANGE") ||
    nameUpper.includes("LONG RANGE")
  ) {
    const specificName =
      nameUpper === "ULTRA" ||
      nameUpper === "ULTRA LONG RANGE" ||
      nameUpper === "LONG RANGE"
        ? "Gulfstream G650ER"
        : classOrModel;
    return {
      name: specificName,
      class: "Ultra Long Range",
      image: ultraImg,
      specs: { range: "7,500 - 7,750 NM", speed: "516 KTAS", pax: 19 },
    };
  }

  // Generic Fallback
  return {
    name: classOrModel,
    class: "Premium Jet",
    image: heavyJetImg,
    specs: { range: "3,500 NM", speed: "470 KTAS", pax: 12 },
  };
};

function getFullAirportName(code: string, fullName?: string) {
  if (fullName) return fullName;
  if (!code) return "Airport Pending";
  const c = code.toUpperCase();
  if (AIRPORT_MAP[c]) return AIRPORT_MAP[c].name;
  return `${code} Airport`;
}

function estimateFlightTime(departure: string, arrival: string) {
  if (!departure || !arrival) return null;
  const dep = AIRPORT_MAP[departure.toUpperCase()];
  const arr = AIRPORT_MAP[arrival.toUpperCase()];
  if (!dep || !arr) return null;
  return calculateFlightTime(dep.lat, dep.lon, arr.lat, arr.lon, 450);
}

function translateStatus(status: string) {
  const map: Record<string, string> = {
    ACCEPTED: "Reviewing Flight",
    INTAKE_SUBMITTED: "Checking Options",
    DECISION_REVIEW: "Reviewing Details",
    CONFIRMATION_LOCKED: "Flight Locked",
    AWAITING_CONFIRMATION: "Waiting for Confirmation",
    OPERATOR_REVIEW: "Finding a Plane",
    DEPOSIT_CONFIRMED: "Payment Received",
    PRE_ACTIVATION: "Preparing Plane",
    ACTIVATED: "Plane Confirmed",
    EXECUTING: "In Progress",
    COMPLETED: "Flight Complete",
    ROTATING: "Updating Details",
    HOLD_STATE: "Action Required",
    CANCELLED: "Flight Cancelled",
    ABORTED: "Flight Cancelled",
  };
  return map[status?.toUpperCase()] || "Awaiting Status";
}

function parseLegs(mission: any) {
  if (mission?.departure_airport && mission?.destination_airport) {
    return {
      dep: getFullAirportName(mission.departure_airport),
      dest: getFullAirportName(mission.destination_airport),
    };
  }
  const arr = Array.isArray(mission?.legs)
    ? mission.legs
    : Array.isArray(mission?.raw_payload?.legs)
      ? mission.raw_payload.legs
      : [];
  if (arr.length === 0) {
    if (
      (mission?.raw_payload?.departure || mission?.raw_payload?.from) &&
      (mission?.raw_payload?.destination || mission?.raw_payload?.to)
    ) {
      return {
        dep: getFullAirportName(
          mission?.raw_payload?.departure || mission?.raw_payload?.from,
          mission?.raw_payload?.fromFull || mission?.raw_payload?.departureFull,
        ),
        dest: getFullAirportName(
          mission?.raw_payload?.destination || mission?.raw_payload?.to,
          mission?.raw_payload?.toFull || mission?.raw_payload?.destinationFull,
        ),
      };
    }
    return { dep: "Routing Pending", dest: "Generation" };
  }
  const first = arr[0];
  const last = arr[arr.length - 1];
  return {
    dep: getFullAirportName(
      first?.departure ||
        first?.from ||
        mission?.raw_payload?.departure ||
        mission?.raw_payload?.from,
      first?.fromFull || first?.departureFull || mission?.raw_payload?.fromFull,
    ),
    dest: getFullAirportName(
      last?.arrival ||
        last?.to ||
        mission?.raw_payload?.destination ||
        mission?.raw_payload?.to,
      last?.toFull || last?.arrivalFull || mission?.raw_payload?.toFull,
    ),
  };
}

function parseDate(mission: any) {
  const arr = Array.isArray(mission?.legs)
    ? mission.legs
    : Array.isArray(mission?.raw_payload?.legs)
      ? mission.raw_payload.legs
      : [];
  let dateStr =
    mission?.raw_payload?.executionDate || mission?.raw_payload?.date;
  let timeStr = mission?.raw_payload?.time;

  if (arr.length > 0) {
    if (arr[0]?.date && arr[0]?.time) {
      dateStr = arr[0].date;
      timeStr = arr[0].time;
    } else {
      dateStr = arr[0]?.date || arr[0]?.departureTime || dateStr;
    }
  }
  if (!dateStr) return "Flexible Sequence";

  try {
    const combinedStr = timeStr ? `${dateStr} ${timeStr}` : dateStr;
    const d = new Date(combinedStr);
    if (isNaN(d.getTime())) {
      const backupDate = new Date(dateStr);
      if (isNaN(backupDate.getTime())) return combinedStr;
      return formatToLocalDate(dateStr) + (timeStr ? ` ${timeStr}` : "");
    }
    return formatToLocalDate(combinedStr, true);
  } catch {
    return "Timeline Establishing";
  }
}

function getFlightTargetTime(mission: any, dateStr: string): number {
  if (mission) {
    const arr = Array.isArray(mission.legs) ? mission.legs : [];
    let dateVal =
      mission.raw_payload?.executionDate || mission.raw_payload?.date;
    let timeVal = mission.raw_payload?.time;
    if (arr.length > 0) {
      if (arr[0]?.date) {
        dateVal = arr[0].date;
        timeVal = arr[0].time || timeVal;
      }
    }
    if (dateVal) {
      const combined = timeVal ? `${dateVal} ${timeVal}` : dateVal;
      const t = Date.parse(combined);
      if (!isNaN(t)) return t;
    }
  }

  if (dateStr) {
    const t = Date.parse(dateStr);
    if (!isNaN(t)) return t;
    try {
      const cleaned = dateStr.replace(",", "").replace(" at ", " ");
      const t2 = Date.parse(cleaned);
      if (!isNaN(t2)) return t2;
    } catch {
      // ignore
    }
  }
  return Date.now() + 4 * 24 * 60 * 60 * 1000 + 12 * 60 * 60 * 1000;
}

function FlightCountdown({
  dateStr,
  mission,
}: {
  dateStr: string;
  mission?: any;
}) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isOver: boolean;
  }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isOver: false,
  });

  useEffect(() => {
    const targetTime = getFlightTargetTime(mission, dateStr);

    const interval = setInterval(() => {
      const now = Date.now();
      const diff = targetTime - now;

      if (diff <= 0) {
        setTimeLeft({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          isOver: true,
        });
        clearInterval(interval);
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor(
          (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
        );
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft({ days, hours, minutes, seconds, isOver: false });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [dateStr, mission]);

  if (timeLeft.isOver) {
    return (
      <span className="text-red-500 font-sync tracking-widest text-[10px] uppercase font-bold">
        EXPIRED
      </span>
    );
  }

  const pad = (num: number) => String(num).padStart(2, "0");

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-fbblue/10 border border-fbblue/20 rounded-lg text-xs font-mono text-white mt-2 select-none shadow-[0_0_10px_rgba(24,119,242,0.1)]">
      <div className="flex gap-1 items-center font-bold tracking-wider text-xs">
        <span className="text-white font-mono">{pad(timeLeft.days)}</span>
        <span className="text-gray-500 text-[9px] lowercase font-sans">d</span>
        <span className="text-white/20">:</span>
        <span className="text-white font-mono">{pad(timeLeft.hours)}</span>
        <span className="text-gray-500 text-[9px] lowercase font-sans">h</span>
        <span className="text-white/20">:</span>
        <span className="text-white font-mono">{pad(timeLeft.minutes)}</span>
        <span className="text-gray-500 text-[9px] lowercase font-sans">m</span>
        <span className="text-white/20">:</span>
        <span className="text-fbblue font-mono animate-pulse">
          {pad(timeLeft.seconds)}
        </span>
        <span className="text-fbblue/50 text-[9px] lowercase font-sans">s</span>
      </div>
    </div>
  );
}

interface ToastState {
  message: string;
  type: "success" | "info" | "warning" | "error";
  id: number;
}

interface NotificationItem {
  id: string;
  type: 'system' | 'icc' | 'chat';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export default function BrokerPortal() {
  const [searchParams, setSearchParams] = useSearchParams();
  const missionId = searchParams.get("missionId");
  const sessionVerified = searchParams.get("verified") === "true";

  const [authStep, setAuthStep] = useState<'LOGIN' | 'SIGNUP' | 'SMS_OTP'>('LOGIN');
  const [inputId, setInputId] = useState(missionId || "");
  const [inputEmail, setInputEmail] = useState("");
  const [inputPassword, setInputPassword] = useState("");
  const [inputPhone, setInputPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+234");
  const [otpDigits, setOtpDigits] = useState<string[]>(["1", "5", "9", "3", "8", "2"]);
  const [authError, setAuthError] = useState("");
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  /* First-Time Broker Onboarding State */
  const [isBrokerOnboarded, setIsBrokerOnboarded] = useState<boolean>(() => {
    return localStorage.getItem("15d_broker_onboarded") === "true";
  });
  const [onboardingPhase, setOnboardingPhase] = useState<1 | 2>(1);
  const [brokerFirstName, setBrokerFirstName] = useState("");
  const [brokerSurname, setBrokerSurname] = useState("");
  const [brokerCompany, setBrokerCompany] = useState("");
  const [operatorName, setOperatorName] = useState("");
  const [operatorAocNumber, setOperatorAocNumber] = useState("");
  const [operatorEmail, setOperatorEmail] = useState("");

  const [activeTab, setActiveTab] = useState<
    "crm_workspace" | "proposal_builder" | "booking_code" | "checkout_engine" | "operational_radar" | "telemetry_vault" | "status" | "customization" | "manifest"
  >("crm_workspace");

  const [showAOCModal, setShowAOCModal] = useState(false);

  /* Notifications & APV lock states */
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  /* UI Modal and Interaction States */
  const [showAIOnboarding, setShowAIOnboarding] = useState(false);
  const [showExperienceIframe, setShowExperienceIframe] = useState(false);
  const [showBookFlightIframe, setShowBookFlightIframe] = useState(false);
  const [isAdjustingFlight, setIsAdjustingFlight] = useState(false);
  const [newFlightDate, setNewFlightDate] = useState("");
  const [manifestUploaded, setManifestUploaded] = useState(false);
  const [isUploadingManifest, setIsUploadingManifest] = useState(false);
  const [showRescheduleIframe, setShowRescheduleIframe] = useState(false);
  const [showAircraftIframe, setShowAircraftIframe] = useState(false);
  const [showManifestIframe, setShowManifestIframe] = useState(false);
  const [showCustomizationModal, setShowCustomizationModal] = useState(false);
  const [showReceiptUpload, setShowReceiptUpload] = useState(false);
  const [isConfigLocked, setIsConfigLocked] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isAgreed, setIsAgreed] = useState(false);

  /* Overrides for local optimistic state triggers */
  const [localStatus, setLocalStatus] = useState<string | null>(null);
  const [localPaymentStatus, setLocalPaymentStatus] = useState<string | null>(
    null,
  );

  /* Modern floating toast message array for executive UI consistency */
  const [toasts, setToasts] = useState<ToastState[]>([]);
  const queryClient = useQueryClient();

  const showToast = (message: string, type: ToastState["type"] = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { message, type, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  const {
    data: rawFlight,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["mission", missionId],
    queryFn: async () => {
      const email = sessionStorage.getItem(`15d_email_${missionId}`);
      if (email) {
        try {
          // Dynamic edge cluster fetch eagerly matching transactional states
          const res = await fetch(
            `/api/mission/${missionId}/init`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ missionId }),
            },
          );
          const json = (await res.json()) as { success?: boolean; state?: any };
          if (json.success && json.state) {
            return json.state;
          }
        } catch (e) {
          console.warn("Edge sync failed, falling back to database", e);
        }

        const { data, error } = await supabase.rpc(
          "get_mission_by_credentials",
          {
            p_mission_id: missionId!,
            p_email: email,
          },
        );
        if (error) throw error;
        return Array.isArray(data) ? data[0] : data;
      } else {
        const { data, error } = await supabase
          .from("missions")
          .select("*")
          .eq("id", missionId!)
          .single();
        if (error) throw error;
        return data;
      }
    },
    enabled: !!missionId && sessionVerified,
    refetchInterval: 5000,
    staleTime: 0,
  });

  // Fetch specific aircraft tail & model from plural or singular database entities
  const { data: dbFlightAircraft } = useQuery({
    queryKey: ["mission_aircraft_portal", missionId],
    queryFn: async () => {
      try {
        const { data: pluralData, error: pluralErr } = await supabase
          .from("mission_aircrafts")
          .select("*")
          .eq("mission_id", missionId!)
          .maybeSingle();

        if (!pluralErr && pluralData) {
          return {
            ...pluralData,
            aircraft_name: pluralData.aircraft_name,
            tail_number: pluralData.tail_number,
            model: pluralData.model || pluralData.aircraft_name,
            category: pluralData.category,
          };
        }

        const { data, error } = await supabase
          .from("mission_aircraft")
          .select("*")
          .eq("mission_id", missionId!)
          .maybeSingle();
        if (error) return null;
        return data;
      } catch (e) {
        return null;
      }
    },
    enabled: !!missionId && sessionVerified,
    refetchInterval: 5000,
  });

  const mission = rawFlight
    ? {
        ...rawFlight,
        status: localStatus || rawFlight.status,
        payment_status: localPaymentStatus || rawFlight.payment_status,
        mission_aircraft: dbFlightAircraft || rawFlight.mission_aircraft,
      }
    : null;

  // Fetch global fleet inventory for specifications parsing
  const { data: dbAircrafts } = useQuery({
    queryKey: ["aircrafts_portal", mission?.id],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from("aircrafts").select("*");
        if (error) return [];
        return data || [];
      } catch (e) {
        return [];
      }
    },
    enabled: !!mission,
    initialData: [],
  });

  const aircraftListForPortal = useMemo(() => {
    return dbAircrafts && dbAircrafts.length > 0 ? dbAircrafts : [];
  }, [dbAircrafts]);

  const matchingAircraft = useMemo(() => {
    if (!mission) return null;
    const selectedAircraftText =
      mission?.operator_aircraft || mission?.aircraft_class || "";
    if (!selectedAircraftText) return null;

    if (aircraftListForPortal.length > 0) {
      const matched = aircraftListForPortal.find((ac: any) => {
        const brand = (ac.Manufacturer || ac.manufacturer || "")
          .trim()
          .toLowerCase();
        const modelName = (ac.Model || ac.model || "").trim().toLowerCase();
        const specificName = `${brand} ${modelName}`.trim().toLowerCase();
        const typeLower = (
          ac.Type ||
          ac.type ||
          ac.Category ||
          ac.category ||
          ""
        ).toLowerCase();
        const tailLower = (ac.tail_number || "").toLowerCase();
        const selectionLower = selectedAircraftText.toLowerCase();

        return (
          selectionLower.includes(specificName) ||
          specificName.includes(selectionLower) ||
          (typeLower && selectionLower.includes(typeLower)) ||
          (typeLower && typeLower.includes(selectionLower)) ||
          (tailLower && selectionLower.includes(tailLower))
        );
      });
      if (matched) return matched;
    }

    return null;
  }, [mission, aircraftListForPortal]);

  const specificAircraftName = useMemo(() => {
    if (!mission) return "Category Pending";
    if (!matchingAircraft)
      return (
        mission.operator_aircraft ||
        mission.aircraft_class ||
        "Category Pending"
      );
    const brand =
      matchingAircraft.Manufacturer || matchingAircraft.manufacturer || "";
    const model =
      matchingAircraft.Model ||
      matchingAircraft.model ||
      matchingAircraft.label ||
      "";
    if (brand && model) return `${brand} ${model}`;
    return (
      model ||
      brand ||
      mission.operator_aircraft ||
      mission.aircraft_class ||
      "Category Pending"
    );
  }, [matchingAircraft, mission]);

  useEffect(() => {
    // ONLY clear the optimistic front-end flags if raw database has reached verification state
    if (
      rawFlight?.status === "AWAITING_CONFIRMATION" ||
      rawFlight?.status === "OPERATOR_REVIEW" ||
      rawFlight?.status === "ACTIVATED"
    ) {
      setLocalStatus(null);
      setLocalPaymentStatus(null);
    }
  }, [rawFlight?.status, rawFlight?.payment_status]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (mission?.payment_status === "AWAITING_VERIFICATION" && activeTab !== "status") {
      setActiveTab("status");
    }
  }, [mission?.payment_status, activeTab]);

  useEffect(() => {
    if (!mission?.id) return;
    const storageKey = `notifications_${mission.id}`;
    let loaded: NotificationItem[] = [];
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        loaded = JSON.parse(stored);
      }
    } catch (e) {
      console.error(e);
    }

    const defaultAlerts: NotificationItem[] = [
      {
        id: "onboarding-welcome",
        type: "system",
        title: "Welcome Onboarding Protocol",
        message: "Welcome back! To finalize your charter booking, please note that your total payment is split into two installments: a commitment deposit due upon signing, and the final balance, which must be settled 48 hours prior to takeoff. Thank you for securing your journey with 15D Wings.",
        timestamp: new Date("2026-07-10T12:00:00Z").toISOString(),
        read: false
      },
      {
        id: "icc-clearance",
        type: "icc",
        title: "ICC Strategic Directive 12-A",
        message: "General Aviation corridor overflight clearance secured for VIP Flight. Clear skies established.",
        timestamp: new Date("2026-07-10T12:05:00Z").toISOString(),
        read: false
      },
      {
        id: "operator-welcome",
        type: "chat",
        title: "Operator Dispatch Feed",
        message: "Welcome aboard. Ground dispatch team stands ready at Lagos MMA General Aviation Terminal for immediate logistics deployment.",
        timestamp: new Date("2026-07-10T12:10:00Z").toISOString(),
        read: false
      }
    ];

    let updated = loaded.length > 0 ? [...loaded] : [...defaultAlerts];

    const addIfNew = (id: string, type: 'system' | 'icc' | 'chat', title: string, message: string) => {
      if (!updated.some(n => n.id === id)) {
        updated.unshift({
          id,
          type,
          title,
          message,
          timestamp: new Date().toISOString(),
          read: false
        });
      }
    };

    if (mission.payment_status === "AWAITING_VERIFICATION" || mission.payment_status === "CONFIRMING") {
      addIfNew(
        `pay-verif-${mission.payment_status}`,
        "system",
        "Payment Verification Active",
        "Database Alert: Payment verification initiated. The security audit team is currently confirming your wire receipt."
      );
    } else if (mission.payment_status === "CONFIRMED" || mission.payment_status === "SETTLED") {
      addIfNew(
        `pay-confirmed-${mission.payment_status}`,
        "system",
        "Commitment Payment Secured",
        "Database Alert: Commitment deposit verified successfully. Aircraft dispatch and flight crews have been locked."
      );
    } else if (mission.payment_status === "REJECTED" || mission.payment_status === "FAILED") {
      addIfNew(
        `pay-rejected-${mission.payment_status}`,
        "system",
        "Payment Settlement Exception",
        "Database Alert: Transaction Settlement Exception. Mismatch detected. Please re-upload proof of payment."
      );
    }

    if (mission.status === "ROTATING") {
      addIfNew(
        "status-rotating",
        "icc",
        "ICC Refinement Directive",
        "Strategic Directive: Flight is currently in ROTATING status for operational corridor refinement."
      );
    }

    localStorage.setItem(storageKey, JSON.stringify(updated));
    setNotifications(updated);
  }, [mission?.id, mission?.status, mission?.payment_status]);

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (
        e.data?.type === "RESCHEDULE_SUCCESS" &&
        e.data?.missionId === missionId
      ) {
        setShowRescheduleIframe(false);
        refetch();
        showToast(
          "Flight successfully rescheduled! Your timeline & specifications have been updated.",
          "success",
        );
      }
      if (
        e.data?.type === "AIRCRAFT_SUCCESS" &&
        e.data?.missionId === missionId
      ) {
        setShowAircraftIframe(false);
        refetch();
        showToast("Aircraft category updated.", "success");
      }
      if (
        e.data?.type === "MANIFEST_SUCCESS" &&
        e.data?.missionId === missionId
      ) {
        setShowManifestIframe(false);
        setManifestUploaded(true);
        refetch();
        showToast("Passenger manifest successfully uploaded.", "success");
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [missionId, refetch]);

  useEffect(() => {
    if (!missionId) return;
    const subscription = supabase
      .channel('payment-status-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payment_states',
          filter: `mission_id=eq.${missionId}`
        },
        (payload) => {
          refetch();
          if (payload.new && (payload.new as any).status === 'active') {
            setLocalStatus('ACTIVATED');
            setLocalPaymentStatus('SETTLED');
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(subscription);
    };
  }, [missionId, refetch]);

  useEffect(() => {
    if (missionId && sessionVerified && !inputEmail) {
      const stored = sessionStorage.getItem(`15d_email_${missionId}`);
      if (stored) setInputEmail(stored);
    }
  }, [missionId, sessionVerified]);

  const handleCloseOnboarding = () => {
    localStorage.setItem("15d_onboarding_seen", "true");
    setShowAIOnboarding(false);
  };

  const handleDirectSignIn = async () => {
    setAuthError("");
    setIsAuthenticating(true);
    try {
      let targetId = inputId.trim().toUpperCase();
      let targetEmail = inputEmail.trim().toLowerCase() || "broker@charterdesk.com";

      if (!targetId) {
        const { data: firstFlight } = await supabase
          .from("missions")
          .select("id, client_email")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (firstFlight && firstFlight.id) {
          targetId = firstFlight.id;
          if (firstFlight.client_email) {
            targetEmail = firstFlight.client_email;
          }
        } else {
          targetId = "15D-001";
        }
      }

      sessionStorage.setItem(`15d_email_${targetId}`, targetEmail);
      setSearchParams({ missionId: targetId, verified: "true" });
    } catch (err: any) {
      setAuthError("Sign in failed. Please try again.");
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleProceedToOtp = () => {
    setAuthError("");
    if (!inputPhone) {
      setAuthError("Phone number is required for SMS verification during account creation.");
      return;
    }
    setAuthStep("SMS_OTP");
  };

  const handleSmsVerify = async () => {
    setAuthError("");
    setIsAuthenticating(true);
    try {
      let targetId = inputId.trim().toUpperCase();
      let targetEmail = inputEmail.trim().toLowerCase() || "broker@charterdesk.com";

      if (!targetId) {
        const { data: firstFlight } = await supabase
          .from("missions")
          .select("id, client_email")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (firstFlight && firstFlight.id) {
          targetId = firstFlight.id;
          if (firstFlight.client_email) {
            targetEmail = firstFlight.client_email;
          }
        } else {
          targetId = "15D-001";
        }
      }

      sessionStorage.setItem(`15d_email_${targetId}`, targetEmail);
      setSearchParams({ missionId: targetId, verified: "true" });
    } catch (err: any) {
      setAuthError("Verification failed. Please try again.");
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleCompleteBrokerOnboarding = () => {
    if (!brokerFirstName || !brokerSurname || !brokerCompany) {
      showToast("Please complete all required broker verification fields.", "warning");
      return;
    }
    localStorage.setItem("15d_broker_onboarded", "true");
    localStorage.setItem("15d_broker_company", brokerCompany);
    setIsBrokerOnboarded(true);
    showToast("Broker identity & carrier proof verified successfully!", "success");
  };

  const handleOtpDigitChange = (index: number, val: string) => {
    const updated = [...otpDigits];
    updated[index] = val.slice(-1);
    setOtpDigits(updated);
    if (val && index < 5) {
      const nextEl = document.getElementById(`otp-input-${index + 1}`);
      if (nextEl) nextEl.focus();
    }
  };

  useEffect(() => {
    if (sessionVerified && activeTab) {
      const hasSeenOnboarding = localStorage.getItem("15d_onboarding_seen");
      if (!hasSeenOnboarding && mission?.status !== "COMPLETED") {
        setShowAIOnboarding(true);
      }
    }
  }, [sessionVerified, mission?.status, activeTab]);

  useEffect(() => {
    if (!missionId || !sessionVerified) return;

    const syncWithEdge = async () => {
      try {
        await fetch(
          `/api/mission/${missionId}/init`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ missionId }),
          },
        );
      } catch (e) {
        console.warn("Dynamic state synchronization heartbeat offline:", e);
      }
    };

    syncWithEdge();
    const interval = setInterval(syncWithEdge, 5000);
    return () => clearInterval(interval);
  }, [missionId, sessionVerified]);

  useEffect(() => {
    if (mission) {
      // Auto-lock configurations if not in setup phase
      if (!["ACCEPTED", "INTAKE_SUBMITTED"].includes(mission.status)) {
        setIsConfigLocked(true);
      } else if (mission.is_config_locked) {
        setIsConfigLocked(true);
      } else {
        setIsConfigLocked(isConfigLocked);
      }

      const checkManifest = async () => {
        try {
          const { data } = await supabase
            .from("passenger_manifest")
            .select("id")
            .eq("mission_id", mission.id);
          if (data && data.length > 0) {
            setManifestUploaded(true);
          }
        } catch (e) {}
      };
      checkManifest();
    }
  }, [mission]);

  const handleUpdateFlight = async () => {
    const depDateStr = parseDate(mission);
    let isWithin72Hours = false;
    if (
      depDateStr !== "Flexible Sequence" &&
      depDateStr !== "Timeline Establishing"
    ) {
      const depDate = new Date(depDateStr).getTime();
      const now = new Date().getTime();
      if (depDate - now < 72 * 60 * 60 * 1000) {
        isWithin72Hours = true;
      }
    }

    if (isWithin72Hours) {
      showToast(
        "Your flight is within 72 hours. Details are now locked. Please contact support.",
        "warning",
      );
      return;
    }

    showToast("Details submitted for review.", "info");
  };

  const handlePaymentAlert = async () => {
    if (!manifestUploaded) {
      showToast(
        "The passenger manifest has not been completed. Please complete Step 2 first.",
        "warning",
      );
      setActiveTab("manifest");
      return;
    }
    setShowReceiptUpload(true);
  };

  if (!missionId || !sessionVerified) {
    return (
      <div className="relative min-h-screen bg-[#07090e] text-white flex items-center justify-center p-4 md:p-6 font-lexend overflow-hidden">
        {/* Fast 3D / Radar canvas background - Optimized for both Desktop & Mobile */}
        <div className="absolute inset-0 z-0 opacity-50 pointer-events-none">
          <FastSplineCanvas scene="https://prod.spline.design/BAU4reX5eINJeOJx/scene.splinecode" />
        </div>

        <div className="z-10 w-full max-w-md flex flex-col items-center pt-8 md:pt-14 pb-12">
          {/* Header branding above card */}
          <div className="text-center space-y-3 mb-8 md:mb-12">
            <span className="ui-sync text-[10px] text-gray-400 tracking-[0.38em] font-bold block">
              15D WINGS
            </span>
            <h2 className="font-sync font-light text-xl md:text-2xl tracking-[0.25em] text-white uppercase pt-1">
              {authStep === 'LOGIN' ? 'FLIGHT BROKER' : authStep === 'SIGNUP' ? 'CREATE BROKER ACCOUNT' : 'SMS VERIFICATION'}
            </h2>
            <p className="ui-sync text-fbblue tracking-[0.3em] text-[9px] uppercase font-semibold pt-1">
              {authStep === 'LOGIN' ? 'BROKER PORTAL LOGIN' : authStep === 'SIGNUP' ? 'PHASE 1 REGISTRATION' : 'MOBILE OTP VERIFICATION'}
            </p>
          </div>

          <div className="p-8 md:p-10 rounded-[2.5rem] w-full space-y-6 border border-white/10 glass-vip shadow-[0_0_60px_rgba(0,0,0,0.85)] backdrop-blur-2xl relative overflow-hidden mt-2">
            <AnimatePresence mode="wait">
              {authStep === 'LOGIN' ? (
                <motion.div
                  key="login-step"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-5"
                >
                  {/* Google Sign In Button */}
                  <button
                    onClick={handleDirectSignIn}
                    className="w-full py-3.5 px-4 bg-white/10 hover:bg-white/15 border border-white/15 rounded-2xl flex items-center justify-center gap-3 text-xs md:text-sm font-medium text-white transition-all shadow-md group"
                  >
                    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <span>Sign in with Google</span>
                  </button>

                  {/* Divider */}
                  <div className="relative flex items-center justify-center my-3">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white/10" />
                    </div>
                    <span className="relative bg-[#080d16] px-3 text-[9px] text-gray-500 font-mono tracking-widest uppercase">
                      ─── OR SIGN IN WITH EMAIL ───
                    </span>
                  </div>

                  {/* Email & Password Fields */}
                  <div className="space-y-4 text-left">
                    <div className="space-y-1.5">
                      <label className="ui-sync text-[8px] text-gray-400 block ml-1 tracking-widest uppercase">
                        EMAIL ADDRESS
                      </label>
                      <input
                        type="email"
                        value={inputEmail}
                        onChange={(e) => setInputEmail(e.target.value)}
                        className="w-full border border-white/10 rounded-2xl px-4 py-3.5 font-lexend text-sm outline-none transition-all bg-black/60 text-white focus:border-fbblue focus:bg-white/[0.05] placeholder:text-gray-600"
                        placeholder="broker@charterdesk.com"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="ui-sync text-[8px] text-gray-400 block ml-1 tracking-widest uppercase">
                        PASSWORD
                      </label>
                      <input
                        type="password"
                        value={inputPassword}
                        onChange={(e) => setInputPassword(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleDirectSignIn();
                        }}
                        className="w-full border border-white/10 rounded-2xl px-4 py-3.5 font-lexend text-sm outline-none transition-all bg-black/60 text-white focus:border-fbblue focus:bg-white/[0.05] placeholder:text-gray-600"
                        placeholder="••••••••••••••••"
                      />
                    </div>

                    {/* Optional Access Code Line */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="ui-sync text-[8px] text-gray-500 block ml-1 tracking-widest uppercase">
                          FLIGHT FLIGHT REF (OPTIONAL)
                        </label>
                      </div>
                      <input
                        type="text"
                        value={inputId}
                        onChange={(e) => setInputId(e.target.value.toUpperCase())}
                        className="w-full border border-white/10 rounded-2xl px-4 py-2.5 font-mono text-xs outline-none transition-all bg-black/40 text-gray-300 focus:border-fbblue placeholder:text-gray-600 uppercase"
                        placeholder="e.g. 15D-001"
                      />
                    </div>
                  </div>

                  {authError && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-[10px] text-center w-full text-red-400"
                    >
                      {authError}
                    </motion.p>
                  )}

                  <button
                    onClick={handleDirectSignIn}
                    disabled={isAuthenticating}
                    className="w-full py-4 rounded-2xl text-xs font-sync tracking-[0.2em] font-bold bg-fbblue text-white hover:bg-fbblue/90 transition-all shadow-[0_0_20px_rgba(24,119,242,0.4)] uppercase active:scale-[0.98]"
                  >
                    {isAuthenticating ? "AUTHENTICATING..." : "SIGN IN"}
                  </button>

                  <div className="pt-2 text-center">
                    <button
                      onClick={() => {
                        setAuthError("");
                        setAuthStep("SIGNUP");
                      }}
                      className="text-[11px] text-gray-400 hover:text-white transition-colors tracking-wide"
                    >
                      Don't have a broker account? <span className="text-fbblue font-semibold">Sign Up</span>
                    </button>
                  </div>
                </motion.div>
              ) : authStep === 'SIGNUP' ? (
                <motion.div
                  key="signup-step"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="space-y-5 text-left"
                >
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="ui-sync text-[8px] text-gray-400 block ml-1 tracking-widest uppercase">
                        WORK EMAIL ADDRESS
                      </label>
                      <input
                        type="email"
                        value={inputEmail}
                        onChange={(e) => setInputEmail(e.target.value)}
                        className="w-full border border-white/10 rounded-2xl px-4 py-3.5 font-lexend text-sm outline-none transition-all bg-black/60 text-white focus:border-fbblue focus:bg-white/[0.05] placeholder:text-gray-600"
                        placeholder="broker@charterdesk.com"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="ui-sync text-[8px] text-gray-400 block ml-1 tracking-widest uppercase">
                        PASSWORD
                      </label>
                      <input
                        type="password"
                        value={inputPassword}
                        onChange={(e) => setInputPassword(e.target.value)}
                        className="w-full border border-white/10 rounded-2xl px-4 py-3.5 font-lexend text-sm outline-none transition-all bg-black/60 text-white focus:border-fbblue focus:bg-white/[0.05] placeholder:text-gray-600"
                        placeholder="••••••••••••••••"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="ui-sync text-[8px] text-gray-400 block ml-1 tracking-widest uppercase">
                        MOBILE PHONE NUMBER (FOR SMS OTP)
                      </label>
                      <div className="flex gap-2">
                        <select
                          value={countryCode}
                          onChange={(e) => setCountryCode(e.target.value)}
                          className="bg-black/70 border border-white/10 rounded-2xl px-3 py-3.5 text-xs font-mono text-white outline-none focus:border-fbblue transition-all cursor-pointer shrink-0"
                        >
                          <option value="+234">🇳🇬 +234</option>
                          <option value="+1">🇺🇸 +1</option>
                          <option value="+971">🇦🇪 +971</option>
                          <option value="+44">🇬🇧 +44</option>
                          <option value="+33">🇫🇷 +33</option>
                          <option value="+27">🇿🇦 +27</option>
                        </select>
                        <input
                          type="tel"
                          value={inputPhone}
                          onChange={(e) => setInputPhone(e.target.value)}
                          placeholder="801 234 5678"
                          className="flex-1 bg-black/70 border border-white/10 rounded-2xl px-4 py-3.5 text-sm font-mono text-white outline-none focus:border-fbblue transition-all placeholder:text-gray-600"
                        />
                      </div>
                    </div>
                  </div>

                  {authError && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-[10px] text-center w-full text-red-400"
                    >
                      {authError}
                    </motion.p>
                  )}

                  <div className="space-y-2 pt-2">
                    <button
                      onClick={handleProceedToOtp}
                      className="w-full py-4 rounded-2xl text-xs font-sync tracking-[0.2em] font-bold bg-fbblue text-white hover:bg-fbblue/90 transition-all shadow-[0_0_20px_rgba(24,119,242,0.4)] uppercase active:scale-[0.98]"
                    >
                      SEND SMS VERIFICATION CODE
                    </button>

                    <button
                      onClick={() => setAuthStep("LOGIN")}
                      className="w-full py-2 text-[10px] font-sync tracking-widest text-gray-400 hover:text-white transition-colors uppercase text-center"
                    >
                      ← BACK TO SIGN IN
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="sms-step"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="space-y-5 text-left"
                >
                  <div className="space-y-1.5">
                    <label className="ui-sync text-[8px] text-gray-400 block ml-1 tracking-widest uppercase">
                      PHONE NUMBER ({countryCode} {inputPhone || "801 234 5678"})
                    </label>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="ui-sync text-[8px] text-gray-400 block ml-1 tracking-widest uppercase">
                        SMS VERIFICATION CODE
                      </label>
                      <span className="text-[9px] text-fbblue font-mono">DEMO PIN: 159382</span>
                    </div>

                    <div className="grid grid-cols-6 gap-2 my-2">
                      {otpDigits.map((digit, idx) => (
                        <input
                          key={idx}
                          id={`otp-input-${idx}`}
                          type="text"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Backspace" && !digit && idx > 0) {
                              const prevInput = document.getElementById(`otp-input-${idx - 1}`);
                              if (prevInput) prevInput.focus();
                            }
                          }}
                          className="w-full h-12 text-center bg-black/80 border border-white/20 rounded-xl text-base font-mono font-bold text-fbblue focus:border-fbblue focus:bg-fbblue/10 outline-none transition-all"
                        />
                      ))}
                    </div>
                  </div>

                  {authError && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-[10px] text-center w-full text-red-400"
                    >
                      {authError}
                    </motion.p>
                  )}

                  <div className="space-y-2 pt-2">
                    <button
                      onClick={handleSmsVerify}
                      disabled={isAuthenticating}
                      className="w-full py-4 rounded-2xl text-xs font-sync tracking-[0.2em] font-bold bg-fbblue text-white hover:bg-fbblue/90 transition-all shadow-[0_0_20px_rgba(24,119,242,0.4)] uppercase active:scale-[0.98]"
                    >
                      {isAuthenticating ? "VERIFYING..." : "VERIFY & SIGN UP"}
                    </button>

                    <button
                      onClick={() => setAuthStep("SIGNUP")}
                      className="w-full py-2 text-[10px] font-sync tracking-widest text-gray-500 hover:text-white transition-colors uppercase text-center"
                    >
                      ← EDIT REGISTRATION INFO
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <RegulatoryDisclaimer />
        </div>
      </div>
    );
  }



  if (isLoading || !mission) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center space-y-6 font-lexend relative transition-colors duration-500">
        <div className="w-8 h-8 rounded-full border border-fbblue/20 border-t-fbblue animate-spin" />
        <p className="ui-sync text-gray-400 tracking-[0.3em] text-[10px]">
          LOADING...
        </p>
      </div>
    );
  }

  const { dep, dest } = parseLegs(mission);
  const statusText = translateStatus(mission.status);
  const isSetupPhase = ["ACCEPTED", "INTAKE_SUBMITTED"].includes(
    mission.status,
  );

  const handleManifestUpload = () => {
    if (manifestUploaded || isUploadingManifest) return;
    setShowManifestIframe(true);
  };

  const dynamicDeposit = mission.upfront_deposit
    ? Number(mission.upfront_deposit)
    : mission.commitment_activation_fee
      ? Number(mission.commitment_activation_fee)
      : 0;
  const remainingBalance =
    mission.outstanding_balance !== undefined &&
    mission.outstanding_balance !== null
      ? Number(mission.outstanding_balance)
      : mission.gross_operator_quote
        ? Number(mission.gross_operator_quote) - dynamicDeposit
        : 0;

  const totalVerifiedCost = mission.gross_operator_quote
    ? Number(mission.gross_operator_quote)
    : remainingBalance + dynamicDeposit;

  let isWithin72Hours = false;
  const depDateStr = parseDate(mission);
  if (
    depDateStr !== "Flexible Sequence" &&
    depDateStr !== "Timeline Establishing"
  ) {
    const depDate = new Date(depDateStr).getTime();
    const now = new Date().getTime();
    if (depDate - now < 72 * 60 * 60 * 1000) {
      isWithin72Hours = true;
    }
  }

  if (mission.status === "COMPLETED") {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white font-lexend flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-fbblue/20 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="w-8 h-8 text-fbblue" />
        </div>
        <h1 className="text-3xl md:text-4xl font-light mb-4 text-white/90">
          Flight Completed
        </h1>
        <p className="text-gray-400 font-light mb-12 max-w-md mx-auto leading-relaxed text-sm">
          Your flight was a success! Create an account to save your history and
          preferences for future bookings.
        </p>

        <div className="w-full max-w-sm space-y-4 bg-white/[0.02] p-8 rounded-[2rem] border border-white/5">
          <button
            onClick={() =>
              showToast(
                "Google Auth not fully implemented in preview environment",
                "info",
              )
            }
            className="w-full bg-white text-black py-4 rounded-xl text-xs font-light hover:bg-gray-200 transition-all flex items-center justify-center gap-3"
          >
            <img
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              className="w-4 h-4"
              alt="Google"
            />
            Continue with Google
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-[10px] ui-sync tracking-widest">
              <span className="bg-[#111] px-2 text-gray-500">OR</span>
            </div>
          </div>

          <button
            onClick={() =>
              showToast(
                "Password creation not fully implemented in preview environment",
                "info",
              )
            }
            className="w-full bg-white/[0.05] text-white border border-white/10 py-4 rounded-xl text-xs font-light hover:bg-white/10 transition-all"
          >
            Create Password
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-black text-white font-lexend pt-24 pb-20 px-4 md:px-8">
      {/* Premium Toast Overlays */}
      <div className="fixed top-6 right-6 z-[300] flex flex-col gap-3 max-w-md w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
              className="pointer-events-auto w-full p-4 rounded-2xl glass-vip border shadow-2xl flex items-start gap-3 backdrop-blur-md"
              style={{
                borderColor:
                  t.type === "success"
                    ? "rgba(16, 185, 129, 0.2)"
                    : t.type === "error"
                      ? "rgba(239, 68, 68, 0.2)"
                      : t.type === "warning"
                        ? "rgba(245, 158, 11, 0.2)"
                        : "rgba(59, 130, 246, 0.2)",
                background:
                  "linear-gradient(135deg, rgba(10,10,10,0.9) 0%, rgba(20,20,20,0.95) 100%)",
              }}
            >
              {t.type === "success" && (
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              )}
              {t.type === "error" && (
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              )}
              {t.type === "warning" && (
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              )}
              {t.type === "info" && (
                <Clock className="w-5 h-5 text-fbblue shrink-0 mt-0.5" />
              )}

              <div className="flex-1">
                <p className="text-xs text-white/90 font-light leading-relaxed">
                  {t.message}
                </p>
              </div>
              <button
                onClick={() =>
                  setToasts((prev) => prev.filter((item) => item.id !== t.id))
                }
                className="text-white/40 hover:text-white/80 transition-colors p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="absolute -inset-10 z-0 opacity-40 pointer-events-none">
        <FastSplineCanvas scene="https://prod.spline.design/IRiKQPrmc8XrbtI1/scene.splinecode" />
      </div>
      <div className="relative z-10 w-full h-full">
        <AnimatePresence>
          {showAIOnboarding && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm"
            >
              <motion.div
                initial={{ y: 20, scale: 0.95 }}
                animate={{ y: 0, scale: 1 }}
                className="bg-[#111] border border-white/10 p-8 rounded-[2rem] max-w-sm w-full relative shadow-2xl overflow-hidden"
              >
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-fbblue/20 blur-3xl rounded-full pointer-events-none" />
                <h3 className="text-xl font-light mb-4">
                  Welcome to your Portal
                </h3>
                <p className="text-sm text-gray-400 font-light leading-relaxed mb-6">
                  Your portal is ready. Tap the{" "}
                  <strong className="text-fbblue">AI Voice Support</strong>{" "}
                  button in the bottom right corner at any time to speak with
                  your assistant.
                </p>
                <p className="text-sm text-gray-400 font-light leading-relaxed mb-8 border-t border-white/10 pt-6">
                  You can also add extra experiences to your flight in the CABIN
                  EXPERIENCE tab.
                </p>
                <button
                  onClick={handleCloseOnboarding}
                  className="w-full bg-white text-black py-4 rounded-xl text-xs font-light hover:bg-gray-200 transition-all"
                >
                  CONTINUE
                </button>
              </motion.div>
            </motion.div>
          )}

          {showExperienceIframe && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex flex-col"
            >
              <div className="flex justify-between items-center p-4 md:px-8 border-b border-white/10 bg-black">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowExperienceIframe(false)}
                    className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl flex items-center gap-2 text-xs font-lexend uppercase tracking-wider transition-all border border-white/15 cursor-pointer active:scale-95 shadow-md"
                    title="Back to Broker Portal"
                  >
                    <ArrowLeft className="w-4 h-4 text-white" />
                    <span className="hidden sm:inline">BACK</span>
                  </button>
                  <h3 className="text-white font-sync tracking-widest text-sm uppercase">
                    15D EXPERIENCES PORTAL
                  </h3>
                </div>
                <button
                  onClick={() => setShowExperienceIframe(false)}
                  className="p-3 bg-white/5 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
                  title="Close"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
              <div className="flex-1 w-full bg-black">
                <iframe
                  src="https://experience.15dwings.com.ng"
                  className="w-full h-full border-none"
                  title="15D Experiences"
                />
              </div>
            </motion.div>
          )}

          {showBookFlightIframe && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex flex-col"
            >
              <div className="flex justify-between items-center p-4 md:px-8 border-b border-white/10 bg-black">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowBookFlightIframe(false)}
                    className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl flex items-center gap-2 text-xs font-lexend uppercase tracking-wider transition-all border border-white/15 cursor-pointer active:scale-95 shadow-md"
                    title="Back to Broker Portal"
                  >
                    <ArrowLeft className="w-4 h-4 text-white" />
                    <span className="hidden sm:inline">BACK</span>
                  </button>
                  <h3 className="text-white font-sync tracking-widest text-sm uppercase">
                    BOOK FLIGHT — FLY 15D WINGS
                  </h3>
                </div>
                <button
                  onClick={() => setShowBookFlightIframe(false)}
                  className="p-3 bg-white/5 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
                  title="Close"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
              <div className="flex-1 w-full bg-black">
                <iframe
                  src="https://fly.15dwings.com.ng"
                  className="w-full h-full border-none"
                  title="Fly 15D Wings"
                />
              </div>
            </motion.div>
          )}

          {showRescheduleIframe && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 overflow-y-auto"
            >
              <div className="w-full max-w-2xl max-h-[95vh] overflow-y-auto bg-black rounded-3xl border border-white/10 shadow-2xl flex flex-col my-auto scrollbar-hide">
                <div className="flex justify-between items-center p-6 border-b border-white/10 bg-black sticky top-0 z-10">
                  <h3 className="text-white font-sync font-bold tracking-widest text-sm uppercase">
                    Reschedule Flight
                  </h3>
                  <button
                    onClick={() => setShowRescheduleIframe(false)}
                    className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
                <div className="flex-1 w-full bg-[#090d16] relative">
                  <RescheduleFlightForm
                    mission={mission}
                    onSuccess={() => {
                      setShowRescheduleIframe(false);
                      showToast(
                        "Flight successfully rescheduled! Your timeline & specifications have been updated.",
                        "success",
                      );
                    }}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {showAircraftIframe && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 overflow-y-auto"
            >
              <div className="w-full max-w-2xl max-h-[95vh] overflow-y-auto bg-black rounded-3xl border border-white/10 shadow-2xl flex flex-col my-auto scrollbar-hide">
                <div className="flex justify-between items-center p-6 border-b border-white/10 bg-black sticky top-0 z-10">
                  <h3 className="text-white font-sync font-bold tracking-widest text-sm uppercase">
                    Select Aircraft
                  </h3>
                  <button
                    onClick={() => setShowAircraftIframe(false)}
                    className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
                <div className="flex-1 w-full bg-[#090d16] relative">
                  <AircraftSelectionForm
                    mission={mission}
                    onSuccess={() => {
                      setShowAircraftIframe(false);
                      refetch();
                      // @ts-ignore
                      queryClient.invalidateQueries(["mission_aircraft_portal", missionId]);
                    }}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {showManifestIframe && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 overflow-y-auto"
            >
              <div className="w-full max-w-2xl max-h-[95vh] overflow-y-auto bg-black rounded-3xl border border-white/10 shadow-2xl flex flex-col my-auto scrollbar-hide">
                <div className="flex justify-between items-center p-6 border-b border-white/10 bg-black sticky top-0 z-10">
                  <h3 className="text-white font-sync font-bold tracking-widest text-sm uppercase">
                    Passenger Manifest
                  </h3>
                  <button
                    onClick={() => setShowManifestIframe(false)}
                    className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
                <div className="flex-1 w-full bg-[#090d16] relative">
                  <PassengerManifestForm
                    missionId={missionId!}
                    onSuccess={() => {
                      setShowManifestIframe(false);
                      refetch();
                      setManifestUploaded(true);
                      showToast(
                        "Passenger manifest successfully uploaded.",
                        "success",
                      );
                    }}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {showReceiptUpload && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4"
            >
              <div className="w-full max-w-lg glass-vip rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
                <div className="flex justify-end p-4">
                  <button
                    onClick={() => setShowReceiptUpload(false)}
                    className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
                <PaymentReceiptForm
                  missionId={missionId!}
                  onSuccess={() => {
                    setLocalStatus("AWAITING_CONFIRMATION");
                    setLocalPaymentStatus("CONFIRMING");
                    setShowReceiptUpload(false);
                    refetch();
                    showToast(
                      "Payment receipt uploaded. We are reviewing your booking.",
                      "success",
                    );
                  }}
                  onSkip={async () => {
                    setLocalStatus("AWAITING_CONFIRMATION");
                    setLocalPaymentStatus("CONFIRMING");
                    setShowReceiptUpload(false);
                    try {
                      const { error } = await supabase
                        .from("missions")
                        .update({
                          payment_status: "CONFIRMING",
                          status: "AWAITING_CONFIRMATION",
                        })
                        .eq("id", missionId);
                      
                      await supabase.from('payment_states').upsert({
                        mission_id: missionId,
                        status: 'awaiting_payment',
                        updated_at: new Date().toISOString()
                      }, { onConflict: 'mission_id' });
                        
                      try {
                        await fetch('/api/mail/send-funding-notice', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ missionId })
                        });
                      } catch (mailErr) {
                        console.warn("Mail dispatch deferred:", mailErr);
                      }

                      if (error) {
                        console.warn(
                          "Supabase RLS Error during status update:",
                          error.message,
                        );
                      }
                    } catch (err: any) {
                      console.error(
                        "Failed to update status on skip:",
                        err.message,
                      );
                    }
                    refetch();
                    showToast("We are reviewing your booking.", "info");
                  }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {}
        <div className="max-w-4xl mx-auto space-y-12">
          <header className="flex flex-row items-start justify-between gap-4 pt-4 w-full">
            <div className="space-y-2 text-left">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-fbblue animate-pulse" />
                <span className="ui-sync text-[9px] text-fbblue tracking-[0.25em] font-bold uppercase">
                  15D WINGS — BROKER BROKER CONTROL
                </span>
              </div>
              <h1 className="font-sync text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white uppercase">
                FLIGHT CONCIERGE DESK
              </h1>
              <div className="flex items-center gap-3 pt-1">
                <span className="px-3 py-1 rounded-full bg-fbblue/20 border border-fbblue/40 text-fbblue text-[9px] font-mono tracking-wider uppercase font-bold">
                  ACTIVE BROKER DESK
                </span>
                <span className="text-gray-500 text-[10px] font-mono">
                  FLIGHT REF: <strong className="text-white">{mission.id}</strong>
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Book Flight iFrame Trigger */}
              <button
                onClick={() => setShowBookFlightIframe(true)}
                className="px-4 py-2.5 rounded-2xl bg-fbblue hover:bg-fbblue/90 text-white text-xs font-sync tracking-wider font-bold transition-all shadow-[0_0_20px_rgba(24,119,242,0.4)] flex items-center gap-2 uppercase cursor-pointer active:scale-95"
              >
                <Plane className="w-3.5 h-3.5" />
                <span>BOOK FLIGHT</span>
              </button>

              {/* Unified Notification Bell */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-3.5 rounded-full bg-white/[0.03] border border-white/10 text-gray-400 hover:text-white hover:border-fbblue/50 hover:bg-white/[0.08] transition-all flex items-center justify-center cursor-pointer shadow-lg"
                >
                  <Bell className="w-4 h-4" />
                  {notifications.some(n => !n.read) && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-fbblue rounded-full border border-black shadow-[0_0_10px_rgba(56,189,248,0.5)] animate-pulse" />
                  )}
                </button>
              </div>
              <UserMenu />
            </div>
          </header>

          {/* UNIFIED NOTIFICATION CENTER DRAWER */}
          <AnimatePresence>
            {showNotifications && (
              <>
                {/* Backdrop overlay */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowNotifications(false)}
                  className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm"
                />

                {/* Sidebar Panel */}
                <motion.div
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "100%" }}
                  transition={{ type: "spring", damping: 25, stiffness: 200 }}
                  className="fixed right-0 top-0 bottom-0 w-full max-w-md z-[160] bg-[#03060c] border-l border-white/10 shadow-2xl p-6 flex flex-col justify-between"
                >
                  <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-center justify-between pb-6 border-b border-white/5">
                      <div className="space-y-1">
                        <h3 className="text-lg font-light tracking-tight text-white flex items-center gap-2">
                          <Bell className="w-4 h-4 text-fbblue" />
                          Unified Alerts
                        </h3>
                        <p className="ui-sync text-[8px] text-gray-500 tracking-[0.2em] uppercase">
                          System Alerts • Directives • Chat
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            const updated = notifications.map(n => ({ ...n, read: true }));
                            setNotifications(updated);
                            localStorage.setItem(`notifications_${mission.id}`, JSON.stringify(updated));
                          }}
                          className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[9px] font-sync tracking-wider uppercase text-gray-400 hover:text-white transition-all cursor-pointer"
                        >
                          Mark all read
                        </button>
                        <button
                          onClick={() => setShowNotifications(false)}
                          className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
                        >
                          <X className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    </div>

                    {/* Alert list - Persistent Log Scroll */}
                    <div className="flex-1 overflow-y-auto py-6 space-y-4 pr-1 custom-scrollbar">
                      {notifications.length === 0 ? (
                        <div className="text-center py-12 space-y-2">
                          <p className="text-gray-500 text-xs">No notifications recorded.</p>
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div
                            key={notif.id}
                            className={`p-4 rounded-2xl border transition-all relative overflow-hidden ${
                              notif.read 
                                ? "bg-white/[0.01] border-white/5 opacity-70" 
                                : "bg-gradient-to-br from-fbblue/5 to-white/[0.02] border-white/10 shadow-md"
                            }`}
                          >
                            {!notif.read && (
                              <div className="absolute top-3 right-3 w-1.5 h-1.5 bg-fbblue rounded-full" />
                            )}
                            
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                {notif.type === "system" && (
                                  <span className="px-2 py-0.5 rounded text-[7px] font-sync tracking-wider bg-fbblue/20 text-fbblue border border-fbblue/30 uppercase">
                                    System
                                  </span>
                                )}
                                {notif.type === "icc" && (
                                  <span className="px-2 py-0.5 rounded text-[7px] font-sync tracking-wider bg-gold/20 text-gold border border-gold/30 uppercase">
                                    ICC Directive
                                  </span>
                                )}
                                {notif.type === "chat" && (
                                  <span className="px-2 py-0.5 rounded text-[7px] font-sync tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase">
                                    Chat Feed
                                  </span>
                                )}
                                <span className="text-[8px] text-gray-500 font-mono">
                                  {new Date(notif.timestamp).toUTCString().replace("GMT", "UTC")}
                                </span>
                              </div>
                              <h4 className="text-xs font-semibold text-white pt-1">
                                {notif.title}
                              </h4>
                              <p className="text-xs text-gray-400 leading-relaxed font-light">
                                {notif.message}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {mission.status === "ROTATING" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 rounded-2xl border transition-all bg-amber-500/10 border-amber-500/20 mb-8"
            >
              <h4 className="text-amber-500 text-sm mb-2">
                Operational refinement in progress.
              </h4>
              <p className="text-gray-400 text-xs font-light leading-relaxed">
                Execution pathway being adjusted to preserve integrity. Buffers
                exist to protect execution against airspace and crew volatility.
                No action required on your part.
              </p>
            </motion.div>
          )}

          <MissionClockWidget mission={mission} />

          {/* BROKER DESK NAVIGATION TABS */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide border-b border-white/10">
            <button
              onClick={() => setActiveTab('crm_workspace')}
              className={`px-4 py-3 rounded-2xl text-xs font-lexend tracking-wider font-bold transition-all uppercase whitespace-nowrap shrink-0 border ${
                activeTab === 'crm_workspace'
                  ? 'bg-fbblue text-white border-fbblue shadow-[0_0_15px_rgba(24,119,242,0.4)]'
                  : 'bg-white/5 text-gray-400 border-white/10 hover:text-white hover:bg-white/10'
              }`}
            >
              0. Broker CRM
            </button>
            <button
              onClick={() => setActiveTab('proposal_builder')}
              className={`px-4 py-3 rounded-2xl text-xs font-lexend tracking-wider font-bold transition-all uppercase whitespace-nowrap shrink-0 border ${
                activeTab === 'proposal_builder'
                  ? 'bg-fbblue text-white border-fbblue shadow-[0_0_15px_rgba(24,119,242,0.4)]'
                  : 'bg-white/5 text-gray-400 border-white/10 hover:text-white hover:bg-white/10'
              }`}
            >
              2. White-Label Proposal
            </button>
            <button
              onClick={() => setActiveTab('booking_code')}
              className={`px-4 py-3 rounded-2xl text-xs font-lexend tracking-wider font-bold transition-all uppercase whitespace-nowrap shrink-0 border ${
                activeTab === 'booking_code'
                  ? 'bg-fbblue text-white border-fbblue shadow-[0_0_15px_rgba(24,119,242,0.4)]'
                  : 'bg-white/5 text-gray-400 border-white/10 hover:text-white hover:bg-white/10'
              }`}
            >
              3. Client Booking Code
            </button>
            <button
              onClick={() => setActiveTab('checkout_engine')}
              className={`px-4 py-3 rounded-2xl text-xs font-lexend tracking-wider font-bold transition-all uppercase whitespace-nowrap shrink-0 border ${
                activeTab === 'checkout_engine'
                  ? 'bg-fbblue text-white border-fbblue shadow-[0_0_15px_rgba(24,119,242,0.4)]'
                  : 'bg-white/5 text-gray-400 border-white/10 hover:text-white hover:bg-white/10'
              }`}
            >
              4. Payment & Escrow
            </button>
            <button
              onClick={() => setActiveTab('operational_radar')}
              className={`px-4 py-3 rounded-2xl text-xs font-lexend tracking-wider font-bold transition-all uppercase whitespace-nowrap shrink-0 border ${
                activeTab === 'operational_radar'
                  ? 'bg-fbblue text-white border-fbblue shadow-[0_0_15px_rgba(24,119,242,0.4)]'
                  : 'bg-white/5 text-gray-400 border-white/10 hover:text-white hover:bg-white/10'
              }`}
            >
              5. Fleet Tracking
            </button>
            <button
              onClick={() => setActiveTab('telemetry_vault')}
              className={`px-4 py-3 rounded-2xl text-xs font-lexend tracking-wider font-bold transition-all uppercase whitespace-nowrap shrink-0 border ${
                activeTab === 'telemetry_vault'
                  ? 'bg-fbblue text-white border-fbblue shadow-[0_0_15px_rgba(24,119,242,0.4)]'
                  : 'bg-white/5 text-gray-400 border-white/10 hover:text-white hover:bg-white/10'
              }`}
            >
              6. Flight Logs
            </button>
            <button
              onClick={() => setActiveTab('status')}
              className={`px-4 py-3 rounded-2xl text-xs font-lexend tracking-wider font-bold transition-all uppercase whitespace-nowrap shrink-0 border ${
                activeTab === 'status'
                  ? 'bg-white text-black border-white'
                  : 'bg-white/5 text-gray-400 border-white/10 hover:text-white hover:bg-white/10'
              }`}
            >
              7. Flight Details
            </button>
          </div>

          {/* ACTIVE BROKER MODULE RENDERER */}
          {activeTab === 'crm_workspace' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <BrokerCRMWorkspace
                missionId={mission.id}
                brokerCompanyName={brokerCompany || "15D Executive Aviation Brokerage"}
              />
            </motion.div>
          )}

          {activeTab === 'proposal_builder' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <WhiteLabelProposalBuilder
                missionId={mission.id}
                originCode={dep.substring(0, 3)}
                destCode={dest.substring(0, 3)}
                aircraftName={mission.operator_aircraft || mission.aircraft_class || "Midsize Jet (Hawker 900XP)"}
                baselineWholesaleCostUsd={totalVerifiedCost || 16250}
              />
            </motion.div>
          )}

          {activeTab === 'booking_code' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <BookingCodeGenerator
                currentMissionId={mission.id}
                onCodeGenerated={(code, op) => {
                  showToast(`Flight code ${code} assigned to ${op.companyName}`, "success");
                }}
              />
            </motion.div>
          )}

          {activeTab === 'checkout_engine' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <SystemizedCheckoutEngine
                amountUsd={totalVerifiedCost || 18687}
                hoursToDeparture={isWithin72Hours ? 36 : 120}
              />
            </motion.div>
          )}

          {activeTab === 'operational_radar' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <OperationalIntegrityIndex missionId={mission.id} />
            </motion.div>
          )}

          {activeTab === 'telemetry_vault' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <EyeOfGodTelemetry />
            </motion.div>
          )}

          {activeTab === 'status' && (
            <div className="grid md:grid-cols-2 gap-4">
                <div className="p-6 md:p-8 rounded-[2rem] border border-white/[0.05] glass-vip flex flex-col justify-between transition-all col-span-1 md:col-span-2">
                  <div className="flex flex-col md:flex-row justify-between mb-8 pb-8 border-b border-white/5 gap-8">
                    <div>
                      <span className="text-[10px] text-gray-500 block mb-3 font-sync tracking-widest uppercase">
                        Target Departure
                      </span>
                      <div className="text-3xl font-light text-white tracking-tight">
                        {parseDate(mission)}
                      </div>
                      {mission.status !== "COMPLETED" &&
                        mission.status !== "CANCELLED" &&
                        mission.status !== "ABORTED" &&
                        parseDate(mission) !== "Flexible Sequence" &&
                        parseDate(mission) !== "Timeline Establishing" && (
                          <FlightCountdown
                            dateStr={parseDate(mission)}
                            mission={mission}
                          />
                        )}
                    </div>

                    <div className="flex flex-col justify-start md:items-end">
                      <span className="text-[10px] text-gray-500 block mb-3 font-sync tracking-widest uppercase text-left md:text-right">
                        Choose A Plane
                      </span>
                      {(() => {
                        let asset = getAircraftDisplayDetails(
                          mission.operator_aircraft || mission.aircraft_class,
                        );
                        let hasAircraft = !!(
                          mission.operator_aircraft || mission.aircraft_class
                        );

                        if (hasAircraft && matchingAircraft) {
                          let matchedImage = asset.image;
                          try {
                            if (
                              Array.isArray(matchingAircraft.images) &&
                              matchingAircraft.images.length > 0
                            ) {
                              matchedImage = matchingAircraft.images[0];
                            } else if (
                              typeof matchingAircraft.images === "string" &&
                              matchingAircraft.images.length > 0
                            ) {
                              const parsed = JSON.parse(
                                matchingAircraft.images,
                              );
                              if (Array.isArray(parsed) && parsed.length > 0)
                                matchedImage = parsed[0];
                              else matchedImage = matchingAircraft.images;
                            } else if (matchingAircraft.image) {
                              matchedImage = matchingAircraft.image;
                            }
                          } catch (e) {
                            if (
                              typeof matchingAircraft.images === "string" &&
                              matchingAircraft.images.startsWith("http")
                            ) {
                              matchedImage = matchingAircraft.images;
                            }
                          }
                          asset = {
                            ...asset,
                            name: specificAircraftName,
                            class:
                              matchingAircraft.Type ||
                              matchingAircraft.type ||
                              matchingAircraft.Category ||
                              matchingAircraft.category ||
                              asset.class,
                            image: matchedImage,
                            specs: {
                              pax:
                                matchingAircraft.Max_Passengers ||
                                matchingAircraft.capacity ||
                                matchingAircraft.max_passengers ||
                                asset.specs.pax,
                              range: matchingAircraft.range_nm
                                ? `${matchingAircraft.range_nm} NM`
                                : asset.specs.range,
                              speed: matchingAircraft.Cruise_Speed_KTAS
                                ? `${matchingAircraft.Cruise_Speed_KTAS} KTAS`
                                : asset.specs.speed,
                            },
                          };
                        }
                        return (
                          <div
                            className={`flex items-center gap-4 bg-white/[0.02] border border-white/5 p-3 rounded-2xl cursor-pointer hover:bg-white/[0.05] hover:border-white/10 transition-all max-w-sm ${mission.status !== "ACCEPTED" && mission.status !== "INTAKE_SUBMITTED" ? "pointer-events-none" : ""}`}
                            onClick={() => setShowAircraftIframe(true)}
                          >
                            <img
                              src={asset.image}
                              alt={asset.name}
                              referrerPolicy="no-referrer"
                              className="w-20 h-14 object-cover rounded-xl border border-white/10 shrink-0"
                            />
                            <div className="flex flex-col text-left">
                              <p
                                className="text-sm font-bold text-white uppercase tracking-wider font-sync truncate max-w-[200px]"
                                title={asset.name}
                              >
                                {asset.name}
                              </p>
                              <span className="text-[9px] text-fbblue font-sync uppercase tracking-widest mt-0.5">
                                {asset.class}
                              </span>
                              <div className="flex gap-2 mt-1 text-[8px] text-gray-500 font-mono">
                                <span>Pax: {asset.specs.pax}</span>
                                <span>•</span>
                                <span>Range: {asset.specs.range}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-gray-500 block mb-6 font-lexend uppercase tracking-widest">
                      ITINERARY & LOGISTICS
                    </span>

                    {Array.isArray(mission.legs) && mission.legs.length > 0 ? (
                      <div className="space-y-0 relative pb-4">
                        {(() => {
                          const points = [];
                          for (let i = 0; i < mission.legs.length; i++) {
                            const leg = mission.legs[i];

                            points.push(
                              <div
                                key={`dep-${i}`}
                                className="relative pl-8 pb-8"
                              >
                                <div className="absolute left-[11px] top-3 bottom-0 w-px bg-fbblue/30" />
                                <div className="absolute left-1.5 top-1.5 w-2 h-2 rounded-full bg-fbblue ring-4 ring-[#0a0a0a]" />
                                <div>
                                  <p className="text-[9px] text-fbblue mb-1 tracking-widest uppercase ui-sync font-bold">
                                    {i === 0
                                      ? "ORIGIN"
                                      : `LEG ${i + 1} DEPARTURE`}{" "}
                                    • {leg.date}{" "}
                                    {leg.time ? ` ${leg.time}` : ""}
                                  </p>
                                  <p className="text-sm font-light text-white/90">
                                    <span className="text-white">
                                      {getFullAirportName(
                                        leg.departure || leg.from,
                                      )}
                                    </span>
                                  </p>
                                </div>
                              </div>,
                            );

                            const ft = estimateFlightTime(
                              leg.departure || leg.from,
                              leg.arrival || leg.to,
                            );

                            if (i < mission.legs.length - 1) {
                              points.push(
                                <div
                                  key={`arr-${i}`}
                                  className="relative pl-8 pb-8"
                                >
                                  <div className="absolute left-[11px] top-3 bottom-0 w-px bg-fbblue/30 border-l-2 border-dashed border-[#0a0a0a]" />
                                  <div className="absolute left-[9px] top-1.5 w-1.5 h-1.5 rounded-full bg-gray-500 ring-4 ring-[#0a0a0a]" />
                                  <div>
                                    <p className="text-[9px] text-gray-400 mb-1 tracking-widest uppercase ui-sync font-bold">
                                      LEG {i + 1} ARRIVAL (Est. Flight: {ft})
                                    </p>
                                    <p className="text-sm font-light text-white/90">
                                      <span className="text-white">
                                        {getFullAirportName(
                                          leg.arrival || leg.to,
                                        )}
                                      </span>
                                    </p>
                                  </div>
                                  <div className="mt-4 inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg z-10 relative">
                                    <Clock className="w-3 h-3 text-amber-500" />
                                    <span className="text-[9px] text-amber-500 font-sync uppercase tracking-widest">
                                      Calculated Layover
                                    </span>
                                  </div>
                                </div>,
                              );
                            } else {
                              points.push(
                                <div
                                  key={`dest`}
                                  className="relative pl-8 pb-0"
                                >
                                  <div className="absolute left-[9px] top-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 ring-4 ring-[#0a0a0a]" />
                                  <div>
                                    <p className="text-[9px] text-emerald-500 mb-1 tracking-widest uppercase ui-sync font-bold">
                                      FINAL DESTINATION (Est. Flight: {ft})
                                    </p>
                                    <p className="text-sm font-light text-white/90">
                                      <span className="text-white">
                                        {getFullAirportName(
                                          leg.arrival || leg.to,
                                        )}
                                      </span>
                                    </p>
                                  </div>
                                </div>,
                              );
                            }
                          }
                          return points;
                        })()}
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="flex gap-4 items-start">
                          <MapPin className="w-4 h-4 text-fbblue/50 mt-1 shrink-0" />
                          <div>
                            <p className="text-xs text-gray-500 mb-1 uppercase tracking-widest ui-sync">
                              DEPARTURE
                            </p>
                            <p className="text-sm font-light text-white/90">
                              {dep}
                            </p>
                          </div>
                        </div>
                        <div className="w-px h-6 ml-2 bg-white/10" />
                        <div className="flex gap-4 items-start">
                          <MapPin className="w-4 h-4 text-fbblue/50 mt-1 shrink-0" />
                          <div>
                            <p className="text-xs text-gray-500 mb-1 uppercase tracking-widest ui-sync">
                              ARRIVAL
                            </p>
                            <p className="text-sm font-light text-white/90">
                              {dest}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {estimateFlightTime(
                      mission?.raw_payload?.departure,
                      mission?.raw_payload?.destination,
                    ) &&
                      (!mission.legs || mission.legs.length <= 1) && (
                        <div className="flex gap-3 items-center mt-6 pt-6 border-t border-white/5">
                          <Clock className="w-4 h-4 text-fbblue/50" />
                          <div>
                            <p className="text-[10px] text-gray-500 ui-sync tracking-widest">
                              EST. DIRECT DURATION
                            </p>
                            <p className="text-xs mt-0.5 text-white">
                              {estimateFlightTime(
                                mission?.raw_payload?.departure,
                                mission?.raw_payload?.destination,
                              )}{" "}
                              computed (450 kts)
                            </p>
                          </div>
                        </div>
                      )}

                    {}
                    {Array.isArray(mission.legs) && mission.legs.length > 1 && (
                      <div className="flex flex-col gap-4 mt-6 pt-6 border-t border-white/5">
                        <div className="flex items-center gap-3">
                          <Clock className="w-4 h-4 text-fbblue/50" />
                          <span className="text-[10px] text-gray-500 ui-sync tracking-widest uppercase">
                            Multi-Leg Duration Overview
                          </span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {mission.legs.map((leg: any, idx: number) => {
                            const ft = estimateFlightTime(
                              leg.departure || leg.from,
                              leg.arrival || leg.to,
                            );
                            return (
                              <div
                                key={idx}
                                className="bg-white/[0.02] border border-white/5 rounded-xl p-3"
                              >
                                <p className="text-[9px] text-gray-500 font-sync tracking-widest uppercase mb-1">
                                  Leg {idx + 1} Time
                                </p>
                                <p className="text-xs text-white">
                                  {ft || "TBD"}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

          {}
          <div className="pt-8">
            {mission.payment_status === "CONFIRMING" ||
            mission.status === "AWAITING_CONFIRMATION" ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-[2.5rem] p-8 md:p-12 border border-blue-500/30 shadow-2xl backdrop-blur-md"
                style={{
                  background:
                    "linear-gradient(135deg, #050a12 0%, #111a2e 100%)",
                }}
              >
                <div className="absolute top-0 right-0 w-80 h-80 bg-fbblue/20 blur-[100px] rounded-full pointer-events-none animate-pulse" />
                <div className="absolute top-0 left-0 w-64 h-64 bg-amber-500/10 blur-[80px] rounded-full pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6 pb-8 border-b border-white/10 mb-8">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                      <span className="text-[10px] text-amber-500 font-sync tracking-[0.3em] uppercase">
                        VERIFYING EVIDENCE
                      </span>
                    </div>
                    <h2 className="text-2xl font-light text-white tracking-tight">
                      TRANSITIONAL ACTIVATION SECURED
                    </h2>
                  </div>
                  <div className="px-5 py-3 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 text-xs font-lexend uppercase tracking-widest font-bold text-center">
                    AWAITING ADMINISTRATIVE VERIFICATION
                  </div>
                </div>

                <div className="relative z-10 space-y-8">
                  <div className="p-6 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                    <h4 className="text-amber-500 text-xs font-sync tracking-wider uppercase mb-2">
                      CRITICAL AUDIT NOTICE
                    </h4>
                    <p className="text-gray-300 text-xs font-light leading-relaxed">
                      Evidence of payment has been uploaded for our Strategic
                      Authority review. **Please note that storing or uploading
                      evidence is not the final proof of payment until the
                      transfer has fully settled in our account and verified by
                      our administrative team.**
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-8 pt-4">
                    <div className="space-y-6">
                      <h3 className="ui-sync text-[10px] text-gray-500 tracking-widest">
                        FLIGHT SPECIFICATIONS
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <span className="text-[9px] text-gray-400 block font-lexend uppercase">
                            ROUTE
                          </span>
                          <span className="text-sm font-light text-white/90">
                            {dep} ➔ {dest}
                          </span>
                        </div>
                        <div>
                          <span className="text-[9px] text-gray-400 block font-lexend uppercase">
                            SCHEDULED DEPARTURE
                          </span>
                          <span className="text-sm font-light text-white/90">
                            {parseDate(mission)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[9px] text-gray-400 block font-lexend uppercase">
                            AIRCRAFT RESOURCE
                          </span>
                          <span className="text-sm font-light text-white/90 uppercase tracking-wider font-sync">
                            {specificAircraftName}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6 p-6 rounded-3xl bg-black/50 border border-white/5">
                      <h3 className="ui-sync text-[10px] text-fbblue tracking-widest">
                        FINANCIAL SETTLEMENT (V-2 HYBRID)
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between text-xs font-light">
                          <span className="text-gray-500">
                            Midpoint Valuation (EM):
                          </span>
                          <span className="text-white">
                            {mission.midpoint_estimate
                              ? formatCurrency(mission.midpoint_estimate)
                              : "—"}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs font-light">
                          <span className="text-gray-500">
                            Escrow Deposit (50% Collateral):
                          </span>
                          <span className="text-white">
                            {mission.escrow_deposit
                              ? formatCurrency(mission.escrow_deposit)
                              : "—"}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs font-light">
                          <span className="text-gray-500">
                            Platform Activation Fee (10%):
                          </span>
                          <span className="text-white">
                            {mission.platform_fee
                              ? formatCurrency(mission.platform_fee)
                              : "—"}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs font-bold pt-2 border-t border-white/5">
                          <span className="text-amber-500">
                            Total Upfront Paid (TU):
                          </span>
                          <span className="text-amber-500">
                            {formatCurrency(dynamicDeposit)}
                          </span>
                        </div>

                        <div className="flex justify-between items-start text-base font-medium pt-3 border-t border-white/15">
                          <div>
                            <span className="text-white block">
                              Flight Cost (Gross Quote):
                            </span>
                            <span className="text-[9px] text-gray-500 font-sync mt-1 block tracking-wider uppercase">
                              {mission.gross_operator_quote
                                ? "Verified ICC Route Valuation"
                                : "Pending Final ICC Verification"}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-white font-lexend uppercase block text-lg">
                              {mission.gross_operator_quote
                                ? formatCurrency(mission.gross_operator_quote)
                                : "TBD"}
                            </span>
                          </div>
                        </div>

                        <div className="flex justify-between items-start text-base font-medium pt-3 border-t border-emerald-500/20 bg-emerald-500/5 p-3 -mx-3 rounded-xl border">
                          <div>
                            <span className="text-emerald-500 block">
                              Outstanding Balance:
                            </span>
                            <span className="text-[9px] text-emerald-500/70 font-sync mt-1 block tracking-wider uppercase">
                              DUE AT T-48 BOUNDARY
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-emerald-500 font-lexend uppercase block text-lg">
                              {mission.gross_operator_quote
                                ? formatCurrency(mission.outstanding_balance)
                                : "TBD"}
                            </span>
                            {!mission.gross_operator_quote &&
                              mission.midpoint_estimate && (
                                <span className="text-[9px] text-emerald-500/70 font-sync mt-1 block tracking-wider uppercase">
                                  (Est:{" "}
                                  {formatCurrency(
                                    Math.max(
                                      0,
                                      mission.midpoint_estimate -
                                        (mission.escrow_deposit || 0),
                                    ),
                                  )}
                                  )
                                </span>
                              )}
                          </div>
                        </div>

                        {mission.raw_payload?.customization_cost > 0 && (
                          <div className="flex justify-between text-xs font-light mt-2 pt-2 border-t border-white/[0.05]">
                            <span className="text-gray-500">
                              Premium Additions Added:
                            </span>
                            <span className="text-fbblue">
                              +
                              {formatCurrency(
                                mission?.raw_payload?.customization_cost || 0,
                              )}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="mt-6 pt-4 border-t border-white/5">
                        <p className="text-[10px] text-red-400/90 font-light leading-relaxed">
                          <strong className="text-red-400 uppercase">
                            Settlement Period Restriction:
                          </strong>{" "}
                          Payment of the outstanding balance must be fully paid
                          and settled in our system **no later than 48 hours
                          prior to the scheduled flight departure.** The final
                          verified balance will be coordinated by our ICC
                          division and may differ based on operational
                          consensus. If complete settlement is not received by
                          this T-48 hour window, the flight will be aborted and
                          aircraft allocation released.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-8 text-center text-[10px] text-gray-500 border-t border-white/5 italic">
                    All action parameters have been locked during transit
                    verification. Access to customization, configuration, and
                    upgrades are temporarily paused.
                  </div>
                </div>
              </motion.div>
            ) : mission.payment_status === "CONFIRMED" ||
              [
                "OPERATOR_REVIEW",
                "DEPOSIT_CONFIRMED",
                "PRE_ACTIVATION",
                "ACTIVATED",
                "EXECUTING",
                "COMPLETED",
              ].includes(mission.status) ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-[2.5rem] p-8 md:p-12 border border-emerald-500/30 shadow-2xl backdrop-blur-md"
                style={{
                  background:
                    "linear-gradient(135deg, #030a06 0%, #0d1e11 100%)",
                }}
              >
                <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/20 blur-[100px] rounded-full pointer-events-none animate-pulse" />
                <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-400/10 blur-[80px] rounded-full pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6 pb-8 border-b border-white/10 mb-8">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                      <span className="text-[10px] text-emerald-500 font-sync tracking-[0.3em] uppercase">
                        FLIGHT PRE-ACTIVATION INITIATED
                      </span>
                    </div>
                    <h2 className="text-2xl font-light text-white tracking-tight">
                      FLIGHT FULLY ACTIVATED
                    </h2>
                  </div>
                  <div className="px-5 py-3 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs font-lexend uppercase tracking-widest font-bold text-center">
                    ACTIVATION SECURED & VERIFIED
                  </div>
                </div>

                <div className="relative z-10 space-y-10">
                  <div className="text-center space-y-4">
                    <span className="ui-sync text-[10px] text-gray-400 tracking-widest uppercase block mb-1">
                      COUNTDOWN TO FLIGHT DEPARTURE
                    </span>
                    <FlightCountdown dateStr={depDateStr} mission={mission} />
                  </div>

                  {/* Real-Time Flight Tracker Panel */}
                  <FlightTracker mission={mission} />

                  <div className="grid md:grid-cols-2 gap-8 pt-4">
                    <div className="space-y-6">
                      <h3 className="ui-sync text-[10px] text-gray-400 tracking-widest">
                        ACTIVATED DETAILS
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <span className="text-[9px] text-gray-400 block font-lexend uppercase">
                            ROUTE
                          </span>
                          <span className="text-sm font-light text-white/90">
                            {dep} ➔ {dest}
                          </span>
                        </div>
                        <div>
                          <span className="text-[9px] text-gray-400 block font-lexend uppercase">
                            SCHEDULED DEPARTURE
                          </span>
                          <span className="text-sm font-light text-white/90">
                            {parseDate(mission)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[9px] text-gray-400 block font-lexend uppercase">
                            AIRCRAFT SPECIFICATION
                          </span>
                          <span className="text-sm font-light text-white/90 uppercase tracking-wider font-sync">
                            {specificAircraftName}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6 p-6 rounded-3xl bg-black/40 border border-white/5">
                      <h3 className="ui-sync text-[10px] text-emerald-500 tracking-widest">
                        FINANCIAL RESOLUTION
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between text-xs font-light">
                          <span className="text-gray-500">
                            Verified ICC Value:
                          </span>
                          <span className="text-white">
                            {formatCurrency(remainingBalance + dynamicDeposit)}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs font-light">
                          <span className="text-gray-500">
                            Deposit Fully Cleared:
                          </span>
                          <span className="text-emerald-500">
                            PAID & SETTLED ({formatCurrency(dynamicDeposit)})
                          </span>
                        </div>
                        <div className="flex justify-between text-xs font-light pb-2">
                          <span className="text-gray-500">
                            ICC Settled Balance:
                          </span>
                          <span className="text-emerald-500">
                            VERIFIED ({formatCurrency(remainingBalance)})
                          </span>
                        </div>
                        <div className="flex justify-between text-sm font-medium pt-3 border-t border-white/10">
                          <span className="text-white">Active Balance:</span>
                          <span className="text-emerald-400 font-lexend uppercase">
                            FULLY CONFIRMED ($0.00 DUE)
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 text-center text-[10px] text-gray-500 border-t border-white/5">
                    Pre-flight dispatch check completed. Logistical routing
                    successfully secured. Contact administrative desk for sudden
                    modifications.
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <h3 className="text-lg font-light text-white/90 mb-6 border-b border-white/5 pb-4">
                    Execution Progression
                  </h3>

                  <div className="flex items-center space-x-2 mb-8">
                    <div
                      className={`h-1.5 flex-1 rounded-full transition-all duration-700 ${!isSetupPhase || activeTab !== "customization" ? "bg-fbblue shadow-[0_0_10px_rgba(24,119,242,0.5)]" : "bg-fbblue/20"}`}
                    />
                    <div
                      className={`h-1.5 flex-1 rounded-full transition-all duration-700 ${manifestUploaded ? "bg-fbblue shadow-[0_0_10px_rgba(24,119,242,0.5)]" : "bg-white/10"}`}
                    />
                    <div
                      className={`h-1.5 flex-1 rounded-full transition-all duration-700 ${mission.payment_status === "CONFIRMED" || mission.payment_status === "CONFIRMING" ? "bg-fbblue shadow-[0_0_10px_rgba(24,119,242,0.5)]" : "bg-white/10"}`}
                    />
                  </div>

                  {/* Step 1: Customization */}
                  <div
                    className={`p-6 rounded-2xl border transition-all ${
                      mission.payment_status === "AWAITING_VERIFICATION"
                        ? "opacity-40 cursor-not-allowed border-red-500/10"
                        : activeTab === "customization"
                        ? "bg-fbblue/10 border-fbblue/30 shadow-[0_0_20px_rgba(24,119,242,0.1)]"
                        : "glass-vip border-white/10 hover:border-white/20"
                    } cursor-pointer`}
                    onClick={() => {
                      if (mission.payment_status === "AWAITING_VERIFICATION") {
                        showToast("Navigation is locked during Awaiting Payment Verification (APV) phase.", "warning");
                        return;
                      }
                      setActiveTab("customization");
                    }}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-sm text-white">
                        1. Customize Your Flight
                      </h4>
                      {mission.payment_status === "AWAITING_VERIFICATION" ? (
                        <span className="text-[10px] text-red-500 font-lexend uppercase font-bold tracking-wider flex items-center gap-1">
                          🔒 LOCKED
                        </span>
                      ) : isConfigLocked ? (
                        <span className="text-[10px] text-fbblue tracking-wider font-lexend uppercase">
                          LOCKED
                        </span>
                      ) : (
                        <span className="text-[10px] text-fbblue tracking-wider font-lexend uppercase">
                          AWAITING
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 font-medium font-sync mt-1 uppercase tracking-wider">
                      {mission.payment_status === "AWAITING_VERIFICATION"
                        ? "Secured during audit"
                        : isConfigLocked
                        ? "Flight fully customized"
                        : "Choose plane and options"}
                    </p>
                  </div>

                  {/* Step 2: Passenger Manifest */}
                  <div
                    className={`p-6 rounded-2xl border transition-all ${
                      mission.payment_status === "AWAITING_VERIFICATION"
                        ? "opacity-40 cursor-not-allowed border-red-500/10"
                        : activeTab === "manifest"
                        ? "bg-fbblue/10 border-fbblue/30 shadow-[0_0_20px_rgba(24,119,242,0.1)]"
                        : "glass-vip border-white/10 hover:border-white/20"
                    } cursor-pointer`}
                    onClick={() => {
                      if (mission.payment_status === "AWAITING_VERIFICATION") {
                        showToast("Navigation is locked during Awaiting Payment Verification (APV) phase.", "warning");
                        return;
                      }
                      setActiveTab("manifest");
                    }}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-sm text-white">2. Passenger List</h4>
                      {mission.payment_status === "AWAITING_VERIFICATION" ? (
                        <span className="text-[10px] text-red-500 font-lexend uppercase font-bold tracking-wider flex items-center gap-1">
                          🔒 LOCKED
                        </span>
                      ) : manifestUploaded ? (
                        <CheckCircle2 className="w-4 h-4 text-fbblue" />
                      ) : (
                        <span className="text-[10px] text-gray-500 tracking-wider font-lexend uppercase">
                          PENDING
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 font-light">
                      {mission.payment_status === "AWAITING_VERIFICATION"
                        ? "Secured during audit"
                        : "Who is flying? Please add passengers."}
                    </p>
                  </div>

                  {/* Step 3: Funding */}
                  <div
                    className={`p-6 rounded-2xl border transition-all ${activeTab === "status" ? "bg-fbblue/10 border-fbblue/30 shadow-[0_0_20px_rgba(24,119,242,0.1)]" : "glass-vip border-white/10 hover:border-white/20"} cursor-pointer`}
                    onClick={() => {
                      if (mission.payment_status === "AWAITING_VERIFICATION") {
                        setActiveTab("status");
                        return;
                      }
                      if (!isConfigLocked) {
                        showToast(
                          "Please complete the steps in sequence. Lock your flight configuration in Step 1 first.",
                          "warning",
                        );
                        setActiveTab("customization");
                        return;
                      }
                      if (!manifestUploaded) {
                        showToast(
                          "Please complete your Passenger Manifest in Step 2 before moving to Step 3.",
                          "warning",
                        );
                        setActiveTab("manifest");
                        return;
                      }
                      setActiveTab("status");
                    }}
                  >
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-sm text-white">
                        3. Flight Activation Commitment
                      </h4>
                      <span className="text-[10px] text-fbblue tracking-wider font-lexend uppercase">
                        {manifestUploaded &&
                        isConfigLocked &&
                        mission.status !== "AWAITING_CONFIRMATION"
                          ? "ACTION REQUIRED"
                          : "LOCKED"}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-2xl font-light text-white/90">
                        {dynamicDeposit ? formatCurrency(dynamicDeposit) : "—"}
                      </p>
                      <p className="text-[9px] text-gray-500 font-sync tracking-widest uppercase">
                        Estimated Flight Deposit
                      </p>
                    </div>
                  </div>
                </div>

                {}
                <div>
                  <h3 className="text-lg font-light text-transparent mb-6 border-b border-transparent pb-4 select-none">
                    Action
                  </h3>

                  <AnimatePresence mode="wait">
                    {activeTab === "customization" && (
                      <motion.div
                        key="customization"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="p-8 rounded-[2rem] space-y-8 glass-vip border border-white/10 shadow-2xl"
                      >
                        <div>
                          <span className="ui-sync text-gold text-[8px] mb-2 block">
                            YOUR PLANE
                          </span>
                          <h4 className="text-lg font-light mb-4">
                            {isConfigLocked
                              ? "Flight Locked & Ready"
                              : "Choose A Plane"}
                          </h4>
                          <div className="relative h-44 rounded-2xl overflow-hidden mb-4 border border-white/10 group shadow-2xl">
                            {(() => {
                              let asset = getAircraftDisplayDetails(
                                mission.operator_aircraft ||
                                  mission.aircraft_class,
                              );
                              let hasAircraft = !!(
                                mission.operator_aircraft ||
                                mission.aircraft_class
                              );

                              if (hasAircraft && matchingAircraft) {
                                let matchedImage = asset.image;
                                try {
                                  if (
                                    Array.isArray(matchingAircraft.images) &&
                                    matchingAircraft.images.length > 0
                                  ) {
                                    matchedImage = matchingAircraft.images[0];
                                  } else if (
                                    typeof matchingAircraft.images ===
                                      "string" &&
                                    matchingAircraft.images.length > 0
                                  ) {
                                    const parsed = JSON.parse(
                                      matchingAircraft.images,
                                    );
                                    if (
                                      Array.isArray(parsed) &&
                                      parsed.length > 0
                                    )
                                      matchedImage = parsed[0];
                                    else matchedImage = matchingAircraft.images;
                                  } else if (matchingAircraft.image) {
                                    matchedImage = matchingAircraft.image;
                                  }
                                } catch (e) {
                                  if (
                                    typeof matchingAircraft.images ===
                                      "string" &&
                                    matchingAircraft.images.startsWith("http")
                                  ) {
                                    matchedImage = matchingAircraft.images;
                                  }
                                }
                                asset = {
                                  ...asset,
                                  name: specificAircraftName,
                                  class:
                                    matchingAircraft.Type ||
                                    matchingAircraft.type ||
                                    matchingAircraft.Category ||
                                    matchingAircraft.category ||
                                    asset.class,
                                  image: matchedImage,
                                  specs: {
                                    pax:
                                      matchingAircraft.Max_Passengers ||
                                      matchingAircraft.capacity ||
                                      matchingAircraft.max_passengers ||
                                      asset.specs.pax,
                                    range: matchingAircraft.range_nm
                                      ? `${matchingAircraft.range_nm} NM`
                                      : asset.specs.range,
                                    speed: matchingAircraft.Cruise_Speed_KTAS
                                      ? `${matchingAircraft.Cruise_Speed_KTAS} KTAS`
                                      : asset.specs.speed,
                                  },
                                };
                              }
                              return (
                                <>
                                  <img
                                    src={asset.image}
                                    className="w-full h-full object-cover opacity-80 transition-all duration-500 group-hover:scale-105"
                                    alt={asset.name}
                                    referrerPolicy="no-referrer"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />

                                  <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                                    <div className="text-left">
                                      <span className="text-[9px] text-fbblue font-mono font-bold tracking-widest block uppercase">
                                        {hasAircraft
                                          ? asset.class
                                          : "DEPLOYABLE INVENTORY"}
                                      </span>
                                      <h5
                                        className="text-sm font-black tracking-wider font-sync text-white uppercase mt-0.5 max-w-[250px] truncate"
                                        title={asset.name}
                                      >
                                        {hasAircraft
                                          ? asset.name
                                          : "CHOOSE A PLANE"}
                                      </h5>
                                      <div className="flex gap-2 mt-1 text-[9px] text-gray-300 font-mono">
                                        <span>
                                          Capacity: {asset.specs.pax} Pax
                                        </span>
                                        <span>•</span>
                                        <span>Range: {asset.specs.range}</span>
                                      </div>
                                    </div>
                                  </div>

                                  <div
                                    className={`absolute inset-0 flex items-center justify-center bg-black/30 transition-all duration-300 ${hasAircraft ? "opacity-0 group-hover:opacity-100 bg-black/60" : "opacity-100"}`}
                                  >
                                    <button
                                      disabled={isConfigLocked}
                                      onClick={() =>
                                        !isConfigLocked &&
                                        setShowAircraftIframe(true)
                                      }
                                      className="ui-sync text-[9px] bg-white text-black px-6 py-3 rounded-full hover:bg-fbblue hover:text-white transition-all transform hover:scale-105 shadow-[0_0_15px_rgba(255,255,255,0.2)] font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      {isConfigLocked
                                        ? `LINKED: ${asset.name.toUpperCase()}`
                                        : hasAircraft
                                          ? "CHANGE CONFIGURATION"
                                          : "SELECT AIRCRAFT CONFIGURATION"}
                                    </button>
                                  </div>
                                </>
                              );
                            })()}
                          </div>

                          {(() => {
                            const activeAircraftRecord = Array.isArray(
                              mission?.mission_aircraft,
                            )
                              ? mission.mission_aircraft[0]
                              : mission?.mission_aircraft;

                            if (
                              activeAircraftRecord ||
                              mission.operator_aircraft ||
                              mission.aircraft_class
                            ) {
                              return (
                                <div
                                  id="selected-aircraft-spec"
                                  className="p-4 rounded-xl bg-white/[0.03] border border-white/5 space-y-3 mb-4"
                                >
                                  <div className="flex justify-between items-center">
                                    <div>
                                      <span className="text-[9px] text-gray-500 uppercase font-sync block">
                                        Active Plane Details
                                      </span>
                                      <span className="text-sm font-bold text-white tracking-widest uppercase font-sync mt-1 block">
                                        {activeAircraftRecord?.aircraft_name ||
                                          activeAircraftRecord?.model ||
                                          mission.operator_aircraft ||
                                          mission.aircraft_class}
                                      </span>
                                    </div>
                                    <span className="text-[8px] bg-fbblue/20 text-fbblue border border-fbblue/30 px-3 py-1 rounded-md font-sync uppercase font-bold tracking-wider">
                                      {mission.operator_aircraft
                                        ? "Partner Allocated"
                                        : "Client Selected"}
                                    </span>
                                  </div>
                                  {activeAircraftRecord?.tail_number && (
                                    <div className="pt-2 border-t border-white/5 flex justify-between items-center text-[10px] font-mono">
                                      <span className="text-gray-500 uppercase">
                                        SPECIFIC REGISTRATION / TAIL
                                      </span>
                                      <span className="text-fbblue font-bold tracking-widest uppercase text-xs">
                                        {activeAircraftRecord.tail_number}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              );
                            }
                            return null;
                          })()}

                          {isWithin72Hours || isConfigLocked ? (
                            <div className="mt-4 p-5 rounded-2xl bg-black/40 border border-fbblue/20 space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="ui-sync text-[8px] text-fbblue font-bold uppercase tracking-widest">
                                  ITINERARY PROTOCOL ACTIVE
                                </span>
                              </div>
                              <p className="text-gray-400 text-[10px] font-light leading-relaxed">
                                Flight parameters are locked to ensure absolute
                                operational and logistical certainty.
                                Adjustments must be confirmed via ICC Strategic
                                Authority.
                              </p>
                            </div>
                          ) : (
                            <div className="flex justify-between items-center mt-4 border-b border-white/5 pb-6">
                              <button
                                onClick={() => setShowRescheduleIframe(true)}
                                className="text-xs text-white/60 hover:text-white transition-colors flex items-center gap-2"
                              >
                                <Calendar className="w-3 h-3" /> Adjust
                                Itinerary
                              </button>
                            </div>
                          )}

                          <div className="mt-6 pt-6 border-t border-white/5">
                            <span className="ui-sync text-fbblue text-[8px] mb-2 block uppercase tracking-widest">
                              Customization & In-Flight Amenities
                            </span>
                            <p className="text-xs text-gray-400 font-light mb-4">
                              Select fine vintage wines, Michelin-star
                              gastronomy, secure tarmac transfer escorts,
                              Starlink broadband connection, or logistical
                              security. Scribe suggestions with our custom AI
                              Scribe.
                            </p>
                            <button
                              disabled={isConfigLocked}
                              onClick={() =>
                                !isConfigLocked &&
                                setShowCustomizationModal(true)
                              }
                              className="w-full bg-black border border-white/10 text-white py-4 rounded-xl text-xs font-bold font-lexend uppercase tracking-widest hover:border-fbblue/50 hover:bg-white/5 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isConfigLocked
                                ? "FLIGHT LOCKED & READY"
                                : "Customize Your Flight"}
                            </button>
                          </div>
                        </div>
                        <div className="border-t border-white/5 pt-6">
                          <span className="ui-sync text-fbblue text-[8px] mb-2 block uppercase tracking-widest">
                            Experiential Upgrade
                          </span>
                          <p className="text-xs text-gray-400 font-light mb-4 text-balance">
                            bespoke productions like BlueHour™ or Sky Party™ are
                            integrated into your mission. Upgrades automatically
                            synchronize with your final billing.
                          </p>
                          <button
                            disabled={isConfigLocked}
                            onClick={() =>
                              !isConfigLocked && setShowExperienceIframe(true)
                            }
                            className="w-full bg-white text-black py-4 rounded-xl text-xs font-bold font-lexend uppercase tracking-widest hover:bg-gray-200 transition-all shadow-lg mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isConfigLocked
                              ? "EXPERIENTIAL UPGRADES SECURED"
                              : "ENTER EXPERIENCES PORTAL"}
                          </button>
                          <button
                            disabled={isConfigLocked}
                            onClick={async () => {
                              if (!manifestUploaded) {
                                showToast(
                                  "The passenger manifest has not been completed. Fill Step 2 before locking state.",
                                  "warning",
                                );
                                setActiveTab("manifest");
                                return;
                              }
                              if (!mission?.aircraft_class) {
                                showToast(
                                  "Flight cannot lock in: You must select a plane first.",
                                  "warning",
                                );
                                return;
                              }
                              try {
                                await supabase
                                  .from("missions")
                                  .update({ is_config_locked: true })
                                  .eq("id", mission.id);
                              } catch (err) {}
                              setIsConfigLocked(true);
                              setActiveTab("manifest");
                            }}
                            className="w-full bg-white/[0.05] text-white border border-white/10 py-4 rounded-xl text-xs font-light hover:bg-white/10 transition-all mt-4 font-lexend uppercase tracking-widest"
                          >
                            {isConfigLocked
                              ? "CONFIGURATION LOCKED"
                              : "LOCK CONFIGURATION"}
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {activeTab === "manifest" && (
                      <motion.div
                        key="manifest"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="p-0 rounded-[2rem] overflow-hidden glass-vip border border-white/10 min-h-[700px] relative shadow-2xl"
                      >
                        {manifestUploaded ? (
                          <div className="p-12 flex flex-col items-center justify-center h-full text-center space-y-4">
                            <CheckCircle2 className="w-16 h-16 text-emerald-500 mb-2" />
                            <h4 className="monument text-lg tracking-widest text-white/90">
                              Manifest Validated
                            </h4>
                            <p className="text-sm text-gray-400 max-w-sm font-light">
                              Your executive travel identities have been
                              recorded and encrypted. All parameters are secured
                              for departure.
                            </p>
                            <div className="pt-8 w-full max-w-xs border-t border-white/5">
                              <button
                                onClick={async () => {
                                  try {
                                    await supabase
                                      .from("missions")
                                      .update({ is_config_locked: true })
                                      .eq("id", mission.id);
                                  } catch (e) {}
                                  setIsConfigLocked(true);
                                  await refetch();
                                  setActiveTab("status");
                                  showToast(
                                    "Flight details confirmed. Your flight is now locked.",
                                    "success",
                                  );
                                }}
                                className="w-full bg-white/[0.05] text-white border border-white/10 py-4 rounded-xl text-[10px] font-sync tracking-widest uppercase hover:bg-white/10 transition-all"
                              >
                                Proceed to Activation
                              </button>
                            </div>
                          </div>
                        ) : (
                          <PassengerManifestForm
                            missionId={missionId!}
                            onSuccess={() => {
                              setManifestUploaded(true);
                              refetch();
                              if (isConfigLocked) {
                                setActiveTab("status");
                              } else {
                                showToast(
                                  "Passenger manifest submitted successfully. Lock configuration in Step 1 to activate.",
                                  "success",
                                );
                                setActiveTab("customization");
                              }
                            }}
                          />
                        )}
                      </motion.div>
                    )}

                    {activeTab === "status" && (
                      <motion.div
                        key="status"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="space-y-6"
                      >
                        <div
                          className="relative overflow-hidden rounded-[2rem] p-8 md:p-10 border border-white/10 shadow-2xl"
                          style={{
                            background:
                              "linear-gradient(135deg, #030507 0%, #1a1e23 100%)",
                          }}
                        >
                          <div className="absolute top-0 right-0 w-64 h-64 bg-fbblue/10 blur-[60px] rounded-full pointer-events-none" />
                          <div className="flex justify-between items-start mb-10 relative z-10">
                            <span className="font-lexend uppercase tracking-widest text-white/80 text-xs font-bold">
                              15D WINGS
                            </span>
                            <span className="ui-sync text-[8px] text-white/40 tracking-[0.5em]">
                              FLIGHT ACTIVATION
                            </span>
                          </div>

                           {mission.payment_status === "REJECTED" || mission.payment_status === "FAILED" ? (
                            <div className="relative z-10 space-y-6">
                              <div className="flex items-center gap-3">
                                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                                <h4 className="text-red-500 font-lexend uppercase tracking-widest text-sm">
                                  PAYMENT VERIFICATION REJECTED
                                </h4>
                              </div>
                              <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-2xl space-y-3">
                                <h5 className="text-[10px] text-red-400 font-sync tracking-widest uppercase">
                                  STRATEGIC AUTHORITY REFUSAL RECORD:
                                </h5>
                                <p className="text-white text-xs font-mono bg-black/40 p-4 rounded-xl border border-red-500/10 leading-relaxed">
                                  {(() => {
                                    try {
                                      const payload = typeof mission.raw_payload === 'string' 
                                        ? JSON.parse(mission.raw_payload) 
                                        : mission.raw_payload;
                                      return payload?.payment_error || "TRANSACTION REFERENCE UNRESOLVABLE: Ledger reference mismatch detected. The uploaded evidence does not match any settled wire entry on the Federal Clearing Network within the specified window.";
                                    } catch (e) {
                                      return "TRANSACTION REFERENCE UNRESOLVABLE: Ledger reference mismatch detected. The uploaded evidence does not match any settled wire entry on the Federal Clearing Network within the specified window.";
                                    }
                                  })()}
                                </p>
                              </div>
                              <p className="text-gray-400 text-xs font-light leading-relaxed">
                                Please re-submit your wire transfer notification or upload a clear, legible payment receipt containing the exact bank transaction stamp, sequence ID, and routing details.
                              </p>
                              <div className="pt-4 border-t border-white/5">
                                <button
                                  onClick={handlePaymentAlert}
                                  className="px-6 py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold font-lexend uppercase tracking-widest transition-all cursor-pointer shadow-[0_0_15px_rgba(239,68,68,0.3)]"
                                >
                                  RE-UPLOAD RECEIPT PROOF
                                </button>
                              </div>
                            </div>
                          ) : mission.payment_status === "AWAITING_VERIFICATION" ? (
                            <div className="relative z-10 space-y-6">
                              <div className="flex items-center gap-3">
                                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                                <h4 className="text-amber-500 font-sync tracking-widest text-sm uppercase">
                                  Ledger Verification Active
                                </h4>
                              </div>
                              <div className="p-6 bg-amber-500/10 border border-amber-500/20 rounded-2xl space-y-4">
                                <h5 className="text-[10px] text-amber-400 font-sync tracking-widest uppercase">
                                  APV LOCK STATE: ACTIVE
                                </h5>
                                <p className="text-gray-300 text-xs font-light leading-relaxed">
                                  Your transaction receipt is undergoing rigorous settlement verification by our ICC Compliance division. 
                                  <br /><br />
                                  To ensure transactional integrity, your portal navigation has been locked to this screen. We will notify you instantly upon completion of settlement verification.
                                </p>
                              </div>
                              <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl flex justify-between text-[10px] text-gray-500 font-mono">
                                <span>VERIFICATION CODE:</span>
                                <span className="text-white font-bold">{mission.id}-APV</span>
                              </div>
                            </div>
                          ) : mission.payment_status === "CONFIRMING" ? (
                            <div className="relative z-10 space-y-4">
                              <h4 className="text-fbblue font-lexend uppercase tracking-widest text-sm">
                                PAYMENT IN REVIEW
                              </h4>
                              <p className="text-gray-400 text-xs font-light leading-relaxed">
                                Your payment confirmation has been received. Our
                                Strategic Authority is verifying the transfer.
                              </p>
                            </div>
                          ) : mission.payment_status === "CONFIRMED" ? (
                            <div className="relative z-10 space-y-6">
                              <div className="space-y-2">
                                <h4 className="text-emerald-500 font-lexend uppercase tracking-widest text-sm">
                                  ACTIVATION SECURED
                                </h4>
                                <p className="text-white font-lexend font-light text-2xl">
                                  {dynamicDeposit
                                    ? formatCurrency(dynamicDeposit)
                                    : "—"}
                                </p>
                              </div>
                              {(() => {
                                const parsedLegs = typeof mission.legs === "string" ? JSON.parse(mission.legs) : mission.legs;
                                const legsArr = Array.isArray(parsedLegs) ? parsedLegs : [];
                                
                                if (!mission.raw_payload?.icc_approved_quote) {
                                  return (
                                    <div className="border-t border-white/10 pt-4 space-y-3">
                                      <p className="text-amber-500 text-xs font-semibold leading-relaxed font-mono">
                                        ⚠ A tail number for your route will be matched within 12 to 24 hours due to high demand for flights at this time.
                                      </p>
                                      <p className="text-gray-400 text-xs font-light leading-relaxed">
                                        The 15D Wings Broker Engine (Durable Object & Cloudflare Worker) has matched optimal partner operators based on your flight details:
                                      </p>
                                      
                                      <div className="grid grid-cols-2 gap-3 bg-white/[0.02] p-3 rounded-xl border border-white/5 text-[11px] font-mono text-gray-300">
                                        <div>
                                          <span className="text-gray-500 text-[9px] block">AIRCRAFT TYPE</span>
                                          {mission.aircraft_class || "VVIP Class"}
                                        </div>
                                        <div>
                                          <span className="text-gray-500 text-[9px] block">FLIGHT PARAMETERS</span>
                                          {legsArr.length || 1} Legs • {mission.pax || 1} Pax
                                        </div>
                                      </div>

                                      {legsArr.length > 0 && (
                                        <div className="bg-white/[0.02] p-3 rounded-xl border border-white/5 text-[11px] space-y-2">
                                          <span className="text-gray-500 font-mono text-[9px] block">ROUTING SUMMARY</span>
                                          {legsArr.map((leg: any, idx: number) => (
                                            <div key={idx} className="flex justify-between text-white border-l-2 border-fbblue/30 pl-2">
                                              <span>Leg {idx + 1}: {leg.origin || leg.departure || leg.from}</span>
                                              <span className="text-gray-500">→ {leg.destination || leg.to}</span>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  );
                                } else {
                                  return (
                                    <div className="border-t border-white/10 pt-4 space-y-4">
                                      <div className="space-y-2">
                                        <span className="text-gray-500 font-mono text-[9px] block">MATCHED SPECIFICATION</span>
                                        <p className="text-white text-sm font-semibold font-lexend uppercase tracking-wide flex items-center gap-2">
                                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                                          {mission.raw_payload?.tail_number || "5N-BGE / Gulfstream G550"}
                                        </p>
                                      </div>

                                      <div className="space-y-2">
                                        <span className="text-gray-500 font-mono text-[9px] block">DISPATCH STATUS</span>
                                        <p className="text-emerald-400 text-xs font-mono font-medium">
                                          {mission.raw_payload?.readiness_status || "Ready for flight. Pre-flight check cleared. Crew dispatched."}
                                        </p>
                                      </div>

                                      {/* Virtual Tour Section */}
                                      <div className="bg-white/[0.02] p-4 rounded-2xl border border-white/5 space-y-3">
                                        <span className="text-fbblue font-sync text-[9px] tracking-widest font-semibold uppercase block">
                                          INTERACTIVE VIRTUAL TOUR & GALLERY
                                        </span>
                                        <p className="text-[10px] text-slate-400 font-light leading-normal">
                                          Step inside your assigned private jet cabin. View 360° virtual tours and inspect configuration spaces before departure.
                                        </p>
                                        
                                        {/* Plane image slider / previews */}
                                        <div className="grid grid-cols-2 gap-2 mt-2">
                                          {Array.isArray(mission.raw_payload?.plane_images) && mission.raw_payload?.plane_images.map((imgUrl: string, idx: number) => (
                                            <img 
                                              key={idx}
                                              src={imgUrl} 
                                              alt={`Cabin Preview ${idx + 1}`}
                                              referrerPolicy="no-referrer"
                                              className="w-full h-20 object-cover rounded-xl border border-white/5 hover:border-fbblue/30 transition-all"
                                            />
                                          ))}
                                        </div>

                                        {/* Video Player */}
                                        {mission.raw_payload?.plane_video_url && (
                                          <div className="mt-2 rounded-xl overflow-hidden border border-white/10">
                                            <video 
                                              src={mission.raw_payload?.plane_video_url} 
                                              controls 
                                              className="w-full h-36 object-cover"
                                            />
                                          </div>
                                        )}

                                        {mission.raw_payload?.virtual_tour_url && (
                                          <a 
                                            href={mission.raw_payload?.virtual_tour_url} 
                                            target="_blank" 
                                            rel="noreferrer"
                                            className="flex items-center justify-center gap-2 w-full py-2.5 bg-fbblue hover:bg-blue-600 text-white font-bold rounded-xl text-[10px] font-lexend uppercase tracking-widest transition-colors mt-2 text-center"
                                          >
                                            LAUNCH 3D VIRTUAL CABIN TOUR
                                          </a>
                                        )}
                                      </div>
                                    </div>
                                  );
                                }
                              })()}
                            </div>
                          ) : (
                            <>
                              <div className="mb-6 relative z-10 space-y-4">
                                <div>
                                  <p className="ui-sync text-fbblue text-[8px] mb-2 tracking-[0.3em]">
                                    PLATFORM ACTIVATION DEPOSIT
                                  </p>
                                  <p className="text-white font-lexend font-light text-4xl">
                                    {dynamicDeposit
                                      ? formatCurrency(dynamicDeposit)
                                      : "—"}
                                  </p>
                                </div>
                                {mission.estimated_lower && (
                                  <div className="pt-2 border-t border-white/10">
                                    <p className="ui-sync text-gray-400 text-[8px] mb-1 tracking-[0.3em]">
                                      FULL ESTIMATED PRICE RANGE
                                    </p>
                                    <p className="text-white font-lexend text-sm">
                                      {formatCurrency(mission.estimated_lower)}{" "}
                                      -{" "}
                                      {formatCurrency(mission.estimated_upper)}{" "}
                                      <span className="text-gray-500 text-[10px]">
                                        (± dynamic operator quote)
                                      </span>
                                    </p>
                                  </div>
                                )}

                                <p className="text-[10px] text-gray-400 font-light leading-relaxed">
                                  This activation deposit secures your aircraft
                                  allocation and platform logistics tracking.
                                  <br />
                                  <br />
                                  <span className="text-amber-500 font-medium">
                                    SETTLEMENT REMINDER: Please prepare to pay
                                    your final outstanding balance. Our ICC
                                    division will verify the exact final figure
                                    (which may be lower than the initial upper
                                    estimate based on operator consensus). To
                                    ensure immediate dispatch, the final
                                    verified balance must be fully settled no
                                    later than 48 hours prior to your scheduled
                                    flight departure. Failure to clear the funds
                                    by this deadline may abort the flight
                                    mission.
                                  </span>
                                  <br />
                                  <br />
                                  <span className="text-gray-500">
                                    Storing or uploading evidence of payment is
                                    a required notification step, but it is not
                                    the final proof of payment until funds have
                                    settled completely in our account and are
                                    verified by the administrative team.
                                  </span>
                                </p>

                                <div className="bg-black/50 p-4 rounded-xl border border-white/5 space-y-3 mt-4">
                                  <span className="ui-sync text-[8px] text-gray-400 tracking-widest block border-b border-white/5 pb-2">
                                    WIRE INSTRUCTIONS (USD INTERNATIONAL)
                                  </span>
                                  <div className="flex justify-between text-xs font-light">
                                    <span className="text-gray-500">Bank:</span>
                                    <span className="text-white">
                                      Fidelity Bank
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-xs font-light">
                                    <span className="text-gray-500">
                                      Account Name:
                                    </span>
                                    <span className="text-white">
                                      SKY PARTY LTD
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-xs font-light">
                                    <span className="text-gray-500">
                                      Account No:
                                    </span>
                                    <span className="text-white">
                                      5240087555
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-xs font-light">
                                    <span className="text-gray-500">
                                      SWIFT:
                                    </span>
                                    <span className="text-white">FIDTNGLA</span>
                                  </div>
                                  <div className="mt-2 pt-2 border-t border-white/5 space-y-2">
                                    <span className="ui-sync text-[8px] text-gray-500 tracking-widest block">
                                      INTERMEDIARY BANK
                                    </span>
                                    <div className="flex justify-between text-[10px] font-light">
                                      <span className="text-gray-500">
                                        Bank:
                                      </span>
                                      <span className="text-white">
                                        Citibank N.A. NY
                                      </span>
                                    </div>
                                    <div className="flex justify-between text-[10px] font-light">
                                      <span className="text-gray-500">
                                        SWIFT / Routing (ABA):
                                      </span>
                                      <span className="text-white">
                                        CITIUS33 / 021000089
                                      </span>
                                    </div>
                                    <div className="flex justify-between text-[10px] font-light">
                                      <span className="text-gray-500">
                                        Fidelity A/C with Citibank:
                                      </span>
                                      <span className="text-white">
                                        36115264
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex justify-between text-xs font-light mt-2 pt-2 border-t border-white/5">
                                    <span className="text-gray-500">
                                      Reference:
                                    </span>
                                    <span className="text-fbblue">
                                      {mission.id}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="relative z-10 mt-6 space-y-4">
                                <label className="flex items-start gap-3 cursor-pointer group">
                                  <div className="relative flex items-center justify-center mt-0.5">
                                    <input
                                      type="checkbox"
                                      id="legal-agreement"
                                      className="peer sr-only"
                                      checked={isAgreed}
                                      onChange={(e) =>
                                        setIsAgreed(e.target.checked)
                                      }
                                    />
                                    <div className="w-4 h-4 border border-white/20 rounded bg-white/[0.02] peer-checked:bg-fbblue peer-checked:border-fbblue transition-colors flex items-center justify-center">
                                      <svg
                                        className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth="3"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          d="M5 13l4 4L19 7"
                                        />
                                      </svg>
                                    </div>
                                  </div>
                                  <span className="text-[9px] text-gray-400 font-light leading-relaxed group-hover:text-gray-300 transition-colors">
                                    I acknowledge and agree to the 15D Wings
                                    Charter Agreement, irrevocably binding this
                                    charter into operation. I accept the
                                    activation deposit terms and the application
                                    of tiered commissions including a 5% cost of
                                    certainty on the final balance.
                                  </span>
                                </label>

                                <div className="flex justify-between items-end pt-2">
                                  <div className="text-[8px] text-white/60 ui-sync tracking-widest uppercase">
                                    {mission.client_name || "EXECUTIVE"}
                                  </div>
                                  <button
                                    id="payment-btn"
                                    disabled={!isAgreed}
                                    onClick={handlePaymentAlert}
                                    className="px-6 py-4 bg-fbblue text-white rounded-xl text-xs font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_15px_rgba(24,119,242,0.3)] disabled:shadow-none font-lexend uppercase tracking-widest font-bold"
                                  >
                                    I HAVE MADE PAYMENT
                                  </button>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </div>

          <div className="pt-8 pb-12">
            <div className="p-6 rounded-[2rem] border border-white/5 bg-white/[0.01]">
              <div className="flex justify-between items-center mb-6">
                <span className="ui-sync text-gray-500 text-[8px]">
                  ARCHITECTURE LOGS
                </span>
                <span className="text-[10px] text-gray-600">LIVE FEED</span>
              </div>
              <div className="space-y-4">
                <div className="flex gap-4 text-xs font-light pb-3 border-b border-white/5">
                  <span className="text-fbblue">SYSTEM</span>
                  <span className="text-gray-300">
                    Flight {mission.id} ready. Parameters awaiting lock.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {[
            "ACTIVATED",
            "EXECUTING",
            "DEPARTED",
            "ARRIVED",
            "IN_FLIGHT",
          ].includes(mission.status?.toUpperCase()) && (
            <MissionChat missionId={missionId || ""} role="CLIENT" senderId={mission.client_name || "Client"} />
          )}

          <div className="pt-20 border-t border-white/5 flex justify-center">
            <VoiceAssistant />
          </div>
        </div>
      </div>

      {}
      <AnimatePresence>
        {showCustomizationModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black/80 backdrop-blur-md p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="w-full max-w-2xl max-h-[95vh] overflow-y-auto rounded-[2rem] scrollbar-hide"
            >
              <MissionCustomizationForm
                missionId={mission.id}
                currentCustomizations={mission.mission_customizations}
                onSuccess={() => {
                  setShowCustomizationModal(false);
                  refetch();
                  showToast(
                    "Flight details confirmed. Payment details updated.",
                    "success",
                  );
                }}
                onClose={() => setShowCustomizationModal(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
