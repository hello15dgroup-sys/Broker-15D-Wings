import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, X, Plane, Phone, Mail, User, Info, ShieldAlert, CheckCircle2, 
  MapPin, Calendar, Clock, DollarSign, RefreshCw, Send, ChevronRight, 
  ChevronLeft, Search, Check, AlertCircle, FileText
} from "lucide-react";
import { supabase } from "../../lib/supabase";

// Global searchable countries list with flag emojis and country extensions
const countriesList = [
  { name: "Nigeria", code: "+234", flag: "🇳🇬" },
  { name: "United Kingdom", code: "+44", flag: "🇬🇧" },
  { name: "United States", code: "+1", flag: "🇺🇸" },
  { name: "United Arab Emirates", code: "+971", flag: "🇦🇪" },
  { name: "South Africa", code: "+27", flag: "🇿🇦" },
  { name: "France", code: "+33", flag: "🇫🇷" },
  { name: "Germany", code: "+49", flag: "🇩🇪" },
  { name: "Canada", code: "+1", flag: "🇨🇦" },
  { name: "Australia", code: "+61", flag: "🇦🇺" },
  { name: "Saudi Arabia", code: "+966", flag: "🇸🇦" },
  { name: "Qatar", code: "+974", flag: "🇶🇦" },
  { name: "Singapore", code: "+65", flag: "🇸🇬" },
  { name: "Switzerland", code: "+41", flag: "🇨🇭" },
  { name: "Netherlands", code: "+31", flag: "🇳🇱" },
  { name: "China", code: "+86", flag: "🇨🇳" },
  { name: "Japan", code: "+81", flag: "🇯🇵" },
  { name: "India", code: "+91", flag: "🇮🇳" },
  { name: "Brazil", code: "+55", flag: "🇧🇷" },
  { name: "Egypt", code: "+20", flag: "🇪🇬" },
  { name: "Ghana", code: "+233", flag: "🇬🇭" },
  { name: "Kenya", code: "+254", flag: "🇰🇪" },
  { name: "Rwanda", code: "+250", flag: "🇷🇼" },
  { name: "Ethiopia", code: "+251", flag: "🇪🇹" },
  { name: "Mali", code: "+223", flag: "🇲🇱" },
  { name: "Morocco", code: "+212", flag: "🇲🇦" },
  { name: "Uganda", code: "+256", flag: "🇺🇬" },
  { name: "Cameroon", code: "+237", flag: "🇨🇲" },
  { name: "Gambia", code: "+220", flag: "🇬🇲" },
  { name: "Sierra Leone", code: "+232", flag: "🇸🇱" },
  { name: "Senegal", code: "+221", flag: "🇸🇳" },
  { name: "Ivory Coast", code: "+225", flag: "🇨🇮" },
  { name: "Liberia", code: "+231", flag: "🇱🇷" },
  { name: "Angola", code: "+244", flag: "🇦🇴" },
  { name: "Tanzania", code: "+255", flag: "🇹🇿" },
  { name: "Zambia", code: "+260", flag: "🇿🇲" },
  { name: "Zimbabwe", code: "+263", flag: "🇿🇼" },
  { name: "Turkey", code: "+90", flag: "🇹🇷" },
  { name: "Belgium", code: "+32", flag: "🇧🇪" },
  { name: "Italy", code: "+39", flag: "🇮🇹" },
  { name: "Spain", code: "+34", flag: "🇪🇸" },
  { name: "Sweden", code: "+46", flag: "🇸🇪" },
  { name: "Norway", code: "+47", flag: "🇳🇴" },
  { name: "Denmark", code: "+45", flag: "🇩🇰" },
  { name: "Finland", code: "+358", flag: "🇫🇮" },
  { name: "Russia", code: "+7", flag: "🇷🇺" },
  { name: "Ukraine", code: "+380", flag: "🇺🇦" },
  { name: "Ireland", code: "+353", flag: "🇮🇪" },
  { name: "Austria", code: "+43", flag: "🇦🇹" },
  { name: "Greece", code: "+30", flag: "🇬🇷" },
  { name: "Portugal", code: "+351", flag: "🇵🇹" },
  { name: "Mexico", code: "+52", flag: "🇲🇽" },
  { name: "Argentina", code: "+54", flag: "🇦🇷" },
  { name: "Colombia", code: "+57", flag: "🇨🇴" },
  { name: "Chile", code: "+56", flag: "🇨🇱" },
  { name: "Peru", code: "+51", flag: "🇵🇪" },
  { name: "Indonesia", code: "+62", flag: "🇮🇩" },
  { name: "Malaysia", code: "+60", flag: "🇲🇾" },
  { name: "Thailand", code: "+66", flag: "🇹🇭" },
  { name: "Philippines", code: "+63", flag: "🇵🇭" },
  { name: "Vietnam", code: "+84", flag: "🇻🇳" },
  { name: "New Zealand", code: "+64", flag: "🇳🇿" },
  { name: "Pakistan", code: "+92", flag: "🇵🇰" },
  { name: "Bangladesh", code: "+880", flag: "🇧🇩" },
  { name: "Kuwait", code: "+965", flag: "🇰🇼" },
  { name: "Oman", code: "+968", flag: "🇴🇲" },
  { name: "Bahrain", code: "+973", flag: "🇧🇭" },
  { name: "Jordan", code: "+962", flag: "🇯🇴" },
  { name: "Lebanon", code: "+961", flag: "🇱🇧" },
  { name: "Iraq", code: "+964", flag: "🇮🇶" }
].sort((a, b) => a.name.localeCompare(b.name));

const AIRCRAFT_FLEET = {
  LIGHT: { speed: 700, rate: 2800, minHrs: 1.0, label: "Light Jet", range: 2500, maxPax: 6, models: "Phenom 300, Citation CJ4, Hawker 400XP", image: "https://images.unsplash.com/photo-1540962351504-03099e0a754b?auto=format&fit=crop&w=800&q=80" },
  MID:   { speed: 780, rate: 4000, minHrs: 1.0, label: "Midsize Jet", range: 3800, maxPax: 9, models: "Hawker 800/900XP, Learjet 60XR, Praetor 500", image: "https://res.cloudinary.com/dw9m06rgf/image/upload/v1778682411/Website-midsize-JEt-1024x499_exojji.jpg" },
  HEAVY: { speed: 850, rate: 6000, minHrs: 1.0, label: "Heavy Jet", range: 6500, maxPax: 14, models: "Challenger 604/605, Legacy 600/650, Falcon 900", image: "https://res.cloudinary.com/dw9m06rgf/image/upload/v1778682756/65bd26a6a22e0c57f5eb0fc8_65134bb72c32636b787adb9d_large-private-jet_icgtng.webp" },
  ULTRA: { speed: 920, rate: 9000, minHrs: 1.0, label: "Ultra/Regional", range: 12500, maxPax: 50, models: "ERJ-135/145, Global 6000/7500, G550/G650", image: "https://res.cloudinary.com/dw9m06rgf/image/upload/v1778682889/Bombardier_Global_6000_LX-NST_Exterior_4_1600x1200_fnstut.jpg" }
};

interface PremiumBookFlightPanelProps {
  onClose: () => void;
  onSuccess: (requestId: string) => void;
  sessionVerified: boolean;
  onLoginRequest: () => void;
}

export const PremiumBookFlightPanel: React.FC<PremiumBookFlightPanelProps> = ({
  onClose,
  onSuccess,
  sessionVerified,
  onLoginRequest
}) => {
  // Mobile / Tab Stack management
  const [activeStackTab, setActiveStackTab] = useState<"details" | "aircraft" | "passengers" | "payment">("details");
  const [tripType, setTripType] = useState<"ONEWAY" | "ROUND">("ONEWAY");

  // Onboarding / Form inputs
  const [executiveName, setExecutiveName] = useState("");
  const [executiveEmail, setExecutiveEmail] = useState("");
  const [executivePhone, setExecutivePhone] = useState("");
  const [countryCode, setCountryCode] = useState("+234");
  const [countrySearchQuery, setCountrySearchQuery] = useState("");
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);

  // Flight Route details
  const [origin, setOrigin] = useState("DNMM | MURTALA MUHAMMED INT'L (LAGOS)");
  const [destination, setDestination] = useState("DNAA | NNAMDI AZIKIWE INT'L (ABUJA)");
  const [flightDate, setFlightDate] = useState(() => {
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 3); // 72 hours out by default
    return defaultDate.toISOString().slice(0, 16);
  });
  const [returnDate, setReturnDate] = useState("");

  // Fleet choice
  const [jetClass, setJetClass] = useState<keyof typeof AIRCRAFT_FLEET>("HEAVY");
  const [passengerCount, setPassengerCount] = useState(1);

  // Dynamic analysis results
  const [flightCost, setFlightCost] = useState(0);
  const [flightCostHigh, setFlightCostHigh] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [isRequesting, setIsRequesting] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [generatedRequestId, setGeneratedRequestId] = useState("");

  // Reference for closing country dropdown on outside click
  const countryDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target as Node)) {
        setIsCountryDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Calculate dynamic flight cost on input changes
  useEffect(() => {
    let baseRate = AIRCRAFT_FLEET[jetClass].rate;
    let distMultiplier = tripType === "ROUND" ? 2 : 1;
    let computedBaseCost = baseRate * 2.5 * distMultiplier; // Average 2.5 hr travel vector simulation
    let computedHighCost = computedBaseCost + 4566 * distMultiplier;

    setFlightCost(computedBaseCost);
    setFlightCostHigh(computedHighCost);
  }, [jetClass, tripType, passengerCount]);

  // Handle Dispatch triggers
  const handleStartDispatch = async () => {
    if (!executiveName || !executiveEmail || !executivePhone) {
      alert("Executive Details are fully required to allocate routing paths.");
      return;
    }

    setIsRequesting(true);
    setAnalysisProgress(10);
    const progressInterval = setInterval(() => {
      setAnalysisProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 15;
      });
    }, 200);

    const generatedId = `15D-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    
    // Simulate API storage & Edge dispatch
    setTimeout(async () => {
      try {
        const payload = {
          client_name: executiveName,
          client_email: executiveEmail,
          client_phone: `${countryCode}${executivePhone}`,
          request_id: generatedId,
          ref_id: generatedId,
          total_estimate: Math.round(flightCost),
          estimate_lower: Math.round(flightCost),
          estimate_upper: Math.round(flightCostHigh),
          aircraft: AIRCRAFT_FLEET[jetClass].label,
          departure_airport: origin.split("|")[0].trim(),
          arrival_airport: destination.split("|")[0].trim(),
          departure_date: flightDate,
          timestamp: new Date().toISOString()
        };

        // Write locally to Supabase
        await supabase.from("missions").insert({
          id: generatedId,
          client_email: executiveEmail,
          client_phone: `${countryCode}${executivePhone}`,
          departure_airport: origin.split("|")[0].trim(),
          arrival_airport: destination.split("|")[0].trim(),
          departure_date: flightDate,
          aircraft_type: AIRCRAFT_FLEET[jetClass].label,
          status: "ACCEPTED",
          payment_status: "AWAITING_PAYMENT",
          upfront_deposit: Math.round(flightCost * 0.25),
          outstanding_balance: Math.round(flightCost * 0.75),
          gross_operator_quote: Math.round(flightCost)
        });

        // Store email address context for instant login bypass
        sessionStorage.setItem(`15d_email_${generatedId}`, executiveEmail);
      } catch (err) {
        console.warn("Supabase database insert failed, storing in active session: ", err);
      }

      setGeneratedRequestId(generatedId);
      setIsRequesting(false);
      setShowCompleteModal(true);
    }, 1800);
  };

  const selectedJet = AIRCRAFT_FLEET[jetClass];
  const filteredCountries = countriesList.filter(c => 
    c.name.toLowerCase().includes(countrySearchQuery.toLowerCase()) || 
    c.code.includes(countrySearchQuery)
  );

  return (
    <div className="fixed inset-0 z-[300] bg-[#07090e] text-gray-900 flex flex-col font-lexend overflow-hidden">
      {/* Infinite Looping Video Background */}
      <video className="absolute inset-0 w-full h-full object-cover opacity-15 pointer-events-none z-0" autoPlay loop muted playsInline>
        <source src="https://res.cloudinary.com/dfbweqelf/video/upload/v1777901872/VID-20260428-WA0004_xuyz4u.mp4" type="video/mp4" />
      </video>

      {/* Global Navigation Header inside IFrame equivalent */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 md:px-12 bg-white/80 backdrop-blur-md border-b border-purple-100 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <button 
            onClick={onClose}
            className="flex items-center gap-2 p-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-xs font-space lowercase tracking-widest text-gray-900 transition-all lowercase cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-purple-600" />
            <span>BACK TO CRM</span>
          </button>
          
          <div className="hidden md:flex items-center gap-3 pl-4 border-l border-purple-200">
            <span className="font-space lowercase text-xs tracking-[0.2em] text-gray-900 font-extrabold lowercase">15D WINGS</span>
            <span className="px-2.5 py-0.5 rounded-md bg-purple-600/20 text-purple-600 text-[8px] font-space lowercase font-bold lowercase tracking-wider">
              VIP FLIGHT BOOKING V8.0.2
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {!sessionVerified ? (
            <button 
              onClick={onLoginRequest}
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-600/90 text-gray-900 font-space lowercase text-[10px] tracking-widest font-bold transition-all shadow-[0_0_15px_rgba(24,119,242,0.3)] cursor-pointer active:scale-95"
            >
              BROKER SIGN IN
            </button>
          ) : (
            <span className="px-4 py-2.5 rounded-xl bg-purple-50 border border-purple-200 text-[9px] font-space lowercase text-emerald-400 font-bold lowercase tracking-widest">
              BROKER AUTHENTICATED
            </span>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <div className="relative z-10 flex-1 overflow-y-auto px-4 py-6 md:px-12 md:py-10">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* Regional Nigeria Clearance Banner */}
          <div className="p-5 md:p-6 rounded-2xl bg-gradient-to-r from-purple-600/20 to-royalpurple/5 border border-purple-500/20 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-1">
              <span className="font-space lowercase text-[9px] text-purple-600 tracking-[0.25em] font-bold block lowercase">
                REGIONAL CLEARANCE PROTOCOL
              </span>
              <h2 className="text-sm font-semibold text-gray-900 lowercase font-space lowercase">
                NIGERIA FLIGHT OPERATIONS FOCUS
              </h2>
              <p className="text-xs text-gray-700 max-w-2xl leading-relaxed">
                Flight routing vectors, international air space slots, and instant dispatch allocations are fully synchronized for domestic operations within Nigeria.
              </p>
            </div>
            <div className="flex gap-2">
              <span className="px-3.5 py-1.5 rounded-lg bg-white/80 backdrop-blur-md border border-purple-200 text-[9px] font-mono font-bold text-slate-300">
                ACTIVE VECTOR: DNMM
              </span>
            </div>
          </div>

          {/* Desktop Multi-Window Columns & iOS Card Stack controller */}
          <div className="hidden md:grid grid-cols-12 gap-8">
            
            {/* Desktop Left: Dynamic sequential booking wizard inputs */}
            <div className="col-span-7 space-y-6">
              
              {/* Box 1: Executive Details */}
              <div className="p-8 rounded-3xl border border-purple-100 bg-white/80 backdrop-blur-md backdrop-blur-md space-y-6">
                <div className="flex items-center gap-3 pb-3 border-b border-purple-100">
                  <User className="w-4 h-4 text-purple-600" />
                  <span className="font-space lowercase text-[10px] text-gray-900 font-extrabold tracking-widest lowercase">
                    01 / EXECUTIVE DETAILS
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-gray-600 text-[9px] font-space lowercase lowercase tracking-widest block pl-1">
                      Full Name
                    </label>
                    <input 
                      type="text"
                      value={executiveName}
                      onChange={(e) => setExecutiveName(e.target.value)}
                      placeholder="Executive name"
                      className="w-full border border-purple-200 rounded-xl px-4 py-3.5 font-lexend text-sm outline-none bg-white/80 backdrop-blur-md text-gray-900 focus:border-purple-500 focus:bg-white/90 transition-all placeholder:text-gray-600"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-gray-600 text-[9px] font-space lowercase lowercase tracking-widest block pl-1">
                      Email Address
                    </label>
                    <input 
                      type="email"
                      value={executiveEmail}
                      onChange={(e) => setExecutiveEmail(e.target.value)}
                      placeholder="executive@domain.com"
                      className="w-full border border-purple-200 rounded-xl px-4 py-3.5 font-lexend text-sm outline-none bg-white/80 backdrop-blur-md text-gray-900 focus:border-purple-500 focus:bg-white/90 transition-all placeholder:text-gray-600"
                    />
                  </div>
                </div>

                {/* Country selector & Phone number field */}
                <div className="space-y-1.5">
                  <label className="text-gray-600 text-[9px] font-space lowercase lowercase tracking-widest block pl-1">
                    Phone Number (SMS Contact)
                  </label>
                  <div className="flex gap-3">
                    <div className="relative shrink-0" ref={countryDropdownRef}>
                      <button 
                        type="button"
                        onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
                        className="flex items-center gap-2 px-4 py-3.5 bg-white/80 backdrop-blur-md border border-purple-200 hover:border-purple-500 rounded-xl text-sm font-mono text-gray-900 outline-none transition-all cursor-pointer"
                      >
                        <span>{countriesList.find(c => c.code === countryCode)?.flag || "🇳🇬"}</span>
                        <span>{countryCode}</span>
                      </button>

                      <AnimatePresence>
                        {isCountryDropdownOpen && (
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute top-full left-0 mt-2 w-72 bg-slate-950 border border-purple-200 rounded-2xl shadow-2xl z-[50] overflow-hidden backdrop-blur-xl"
                          >
                            <div className="p-3 border-b border-purple-100 flex items-center gap-2 bg-white/80 backdrop-blur-md">
                              <Search className="w-3.5 h-3.5 text-gray-500" />
                              <input 
                                type="text"
                                placeholder="Search country code..."
                                value={countrySearchQuery}
                                onChange={(e) => setCountrySearchQuery(e.target.value)}
                                className="w-full bg-transparent text-xs outline-none text-gray-900 placeholder:text-gray-600 font-lexend"
                              />
                            </div>
                            <div className="max-h-56 overflow-y-auto scrollbar-hide py-1.5">
                              {filteredCountries.map((c, i) => (
                                <button
                                  key={i}
                                  type="button"
                                  onClick={() => {
                                    setCountryCode(c.code);
                                    setIsCountryDropdownOpen(false);
                                  }}
                                  className="w-full flex items-center justify-between px-4 py-3 text-xs text-left text-gray-700 hover:bg-purple-600 hover:text-gray-900 transition-colors"
                                >
                                  <span className="font-lexend font-medium">{c.flag} {c.name}</span>
                                  <span className="font-mono text-gray-500 group-hover:text-gray-900/80">{c.code}</span>
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <input 
                      type="tel"
                      value={executivePhone}
                      onChange={(e) => setExecutivePhone(e.target.value)}
                      placeholder="801 234 5678"
                      className="flex-1 border border-purple-200 rounded-xl px-4 py-3.5 font-mono text-sm outline-none bg-white/80 backdrop-blur-md text-gray-900 focus:border-purple-500 focus:bg-white/90 transition-all placeholder:text-gray-600"
                    />
                  </div>
                </div>
              </div>

              {/* Box 2: Route details */}
              <div className="p-8 rounded-3xl border border-purple-100 bg-white/80 backdrop-blur-md backdrop-blur-md space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-purple-100">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-[#8B5CF6]" />
                    <span className="font-space lowercase text-[10px] text-gray-900 font-extrabold tracking-widest lowercase">
                      02 / FLIGHT ROUTE VECTOR
                    </span>
                  </div>

                  <div className="flex gap-1.5 bg-white/80 backdrop-blur-md p-1 rounded-full border border-purple-100">
                    <button 
                      onClick={() => setTripType("ONEWAY")}
                      className={`px-3 py-1.5 rounded-full text-[8px] font-space lowercase font-bold transition-all lowercase ${tripType === "ONEWAY" ? "bg-purple-100 text-gray-900" : "text-gray-500 hover:text-gray-900"}`}
                    >
                      One Way
                    </button>
                    <button 
                      onClick={() => setTripType("ROUND")}
                      className={`px-3 py-1.5 rounded-full text-[8px] font-space lowercase font-bold transition-all lowercase ${tripType === "ROUND" ? "bg-purple-100 text-gray-900" : "text-gray-500 hover:text-gray-900"}`}
                    >
                      Round Trip
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-gray-600 text-[9px] font-space lowercase lowercase tracking-widest block pl-1">
                      Origin Airport
                    </label>
                    <input 
                      type="text"
                      value={origin}
                      onChange={(e) => setOrigin(e.target.value)}
                      placeholder="DNMM | Murtala Muhammed Int'l (Lagos)"
                      className="w-full border border-purple-200 rounded-xl px-4 py-3.5 font-lexend text-sm outline-none bg-white/80 backdrop-blur-md text-gray-900 focus:border-purple-500 focus:bg-white/90 transition-all placeholder:text-gray-600"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-gray-600 text-[9px] font-space lowercase lowercase tracking-widest block pl-1">
                      Destination Airport
                    </label>
                    <input 
                      type="text"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      placeholder="DNAA | Nnamdi Azikiwe Int'l (Abuja)"
                      className="w-full border border-purple-200 rounded-xl px-4 py-3.5 font-lexend text-sm outline-none bg-white/80 backdrop-blur-md text-gray-900 focus:border-purple-500 focus:bg-white/90 transition-all placeholder:text-gray-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-gray-600 text-[9px] font-space lowercase lowercase tracking-widest block pl-1">
                      Departure Date &amp; Time
                    </label>
                    <input 
                      type="datetime-local"
                      value={flightDate}
                      onChange={(e) => setFlightDate(e.target.value)}
                      className="w-full border border-purple-200 rounded-xl px-4 py-3.5 font-lexend text-sm outline-none bg-white/80 backdrop-blur-md text-gray-900 focus:border-purple-500 focus:bg-white/90 transition-all"
                    />
                  </div>

                  {tripType === "ROUND" && (
                    <div className="space-y-1.5">
                      <label className="text-gray-600 text-[9px] font-space lowercase lowercase tracking-widest block pl-1">
                        Return Date &amp; Time
                      </label>
                      <input 
                        type="datetime-local"
                        value={returnDate}
                        onChange={(e) => setReturnDate(e.target.value)}
                        className="w-full border border-purple-200 rounded-xl px-4 py-3.5 font-lexend text-sm outline-none bg-white/80 backdrop-blur-md text-gray-900 focus:border-purple-500 focus:bg-white/90 transition-all"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Box 3: Aircraft class selection */}
              <div className="p-8 rounded-3xl border border-purple-100 bg-white/80 backdrop-blur-md backdrop-blur-md space-y-6">
                <div className="flex items-center gap-3 pb-3 border-b border-purple-100">
                  <Plane className="w-4 h-4 text-emerald-400" />
                  <span className="font-space lowercase text-[10px] text-gray-900 font-extrabold tracking-widest lowercase">
                    03 / JET SELECTION &amp; PASSENGERS
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-gray-600 text-[9px] font-space lowercase lowercase tracking-widest block pl-1">
                      Jet Class
                    </label>
                    <select
                      value={jetClass}
                      onChange={(e) => setJetClass(e.target.value as any)}
                      className="w-full border border-purple-200 rounded-xl px-4 py-3.5 font-lexend text-sm outline-none bg-[#0a0f1d] text-gray-900 focus:border-purple-500 transition-all cursor-pointer"
                    >
                      <option value="LIGHT">Light Jet | 4-6 Seats</option>
                      <option value="MID">Midsize Jet | 7-9 Seats</option>
                      <option value="HEAVY">Heavy Jet | 10-14 Seats</option>
                      <option value="ULTRA">Ultra / Long Range | 15-50 Seats</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-gray-600 text-[9px] font-space lowercase lowercase tracking-widest block pl-1">
                      Passenger Count
                    </label>
                    <input 
                      type="number"
                      min={1}
                      max={selectedJet.maxPax}
                      value={passengerCount}
                      onChange={(e) => setPassengerCount(parseInt(e.target.value) || 1)}
                      className="w-full border border-purple-200 rounded-xl px-4 py-3.5 font-lexend text-sm outline-none bg-white/80 backdrop-blur-md text-gray-900 focus:border-purple-500 focus:bg-white/90 transition-all"
                    />
                  </div>
                </div>

                {/* Jet detailed card with specifications & image */}
                <div className="p-4 rounded-2xl bg-white/80 backdrop-blur-md border border-purple-100 flex gap-4 items-center">
                  <img 
                    src={selectedJet.image} 
                    alt={selectedJet.label}
                    className="w-24 h-20 rounded-xl object-cover border border-purple-200 shrink-0"
                  />
                  <div className="space-y-1">
                    <h4 className="font-space lowercase text-[10px] text-gray-900 font-bold lowercase">{selectedJet.label} Fleet Profile</h4>
                    <p className="text-[11px] text-gray-600 font-mono lowercase">{selectedJet.models}</p>
                    <div className="flex gap-3 pt-1 text-[10px] text-purple-600 font-mono font-bold">
                      <span>Max Seats: {selectedJet.maxPax}</span>
                      <span>Range: ~{selectedJet.range} KM</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Desktop Right: Telemetry, cost breakdowns, and live visual plot */}
            <div className="col-span-5 space-y-6">
              
              {/* Cost Estimator */}
              <div className="p-8 rounded-3xl border border-purple-100 bg-gradient-to-b from-purple-600/10 to-transparent backdrop-blur-md text-center space-y-4">
                <span className="font-space lowercase text-[9px] text-purple-600 tracking-widest lowercase block">
                  ESTIMATED FLIGHT COST (USD)
                </span>
                
                <h3 className="text-3xl md:text-4xl font-space lowercase font-bold tracking-tight text-gray-900 py-2">
                  ${Math.round(flightCost).toLocaleString()} - ${Math.round(flightCostHigh).toLocaleString()}
                </h3>

                <span className="px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-[8px] font-space lowercase text-gray-600 lowercase tracking-widest">
                  SUBJECT TO FINAL RADAR CONFIRMATION
                </span>
              </div>

              {/* Vector Flight Radar simulation */}
              <div className="p-6 rounded-3xl border border-purple-100 bg-white/80 backdrop-blur-md backdrop-blur-md relative h-64 overflow-hidden flex flex-col justify-between">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />
                
                {/* Simulated route lines */}
                <svg className="absolute inset-0 w-full h-full opacity-65 z-0" xmlns="http://www.w3.org/2000/svg">
                  <line x1="20%" y1="75%" x2="80%" y2="25%" stroke="#1877f2" strokeWidth="2" strokeDasharray="4 8" />
                  <circle cx="20%" cy="75%" r="6" fill="#1877f2" className="animate-pulse" />
                  <circle cx="80%" cy="25%" r="6" fill="#8B5CF6" className="animate-pulse" />
                </svg>

                <div className="relative z-10 flex justify-between items-start">
                  <div className="space-y-1">
                    <span className="font-space lowercase text-[8px] text-purple-600 tracking-widest lowercase block">VECTOR LOGISTICS</span>
                    <span className="text-xs font-bold font-mono text-gray-900">ROUTE RADAR PLOTTED</span>
                  </div>
                  <span className="text-[9px] font-mono text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded lowercase">
                    ONLINE
                  </span>
                </div>

                <div className="relative z-10 space-y-1 bg-white/80 backdrop-blur-md p-3.5 rounded-xl border border-purple-100 font-mono text-[10px] text-gray-600">
                  <p>DEPARTURE: <strong className="text-gray-900">{origin.substring(0, 30)}</strong></p>
                  <p>ARRIVAL: <strong className="text-gray-900">{destination.substring(0, 30)}</strong></p>
                  <p>RANGE COMPLIANT: <strong className="text-emerald-400">YES</strong></p>
                </div>
              </div>

              {/* VIP Dispatch Action */}
              <button 
                onClick={handleStartDispatch}
                disabled={isRequesting}
                className="w-full py-5 rounded-2xl bg-purple-600 hover:bg-purple-600/90 text-gray-900 font-space lowercase text-xs tracking-[0.25em] font-bold shadow-[0_0_25px_rgba(24,119,242,0.4)] cursor-pointer active:scale-95 transition-all lowercase flex items-center justify-center gap-3"
              >
                {isRequesting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-gray-900" />
                    <span>ARCHITECTING DISPATCH...</span>
                  </>
                ) : (
                  <>
                    <Plane className="w-4 h-4 text-gray-900" />
                    <span>REQUEST VIP FLIGHT NOW</span>
                  </>
                )}
              </button>

            </div>

          </div>

          {/* iOS / Mobile Only Optimized "Card Stack" or swipeable tab panels to prevent horizontal scrolling */}
          <div className="md:hidden space-y-6">
            
            {/* Horizontal iOS-style Segment Controller */}
            <div className="flex bg-white/80 backdrop-blur-md p-1 rounded-xl border border-purple-100 backdrop-blur-md">
              <button 
                onClick={() => setActiveStackTab("details")}
                className={`flex-1 py-2.5 rounded-lg text-[9px] font-space lowercase font-bold lowercase transition-all ${activeStackTab === "details" ? "bg-purple-600 text-gray-900 shadow" : "text-gray-500"}`}
              >
                Flight
              </button>
              <button 
                onClick={() => setActiveStackTab("aircraft")}
                className={`flex-1 py-2.5 rounded-lg text-[9px] font-space lowercase font-bold lowercase transition-all ${activeStackTab === "aircraft" ? "bg-purple-600 text-gray-900 shadow" : "text-gray-500"}`}
              >
                Aircraft
              </button>
              <button 
                onClick={() => setActiveStackTab("passengers")}
                className={`flex-1 py-2.5 rounded-lg text-[9px] font-space lowercase font-bold lowercase transition-all ${activeStackTab === "passengers" ? "bg-purple-600 text-gray-900 shadow" : "text-gray-500"}`}
              >
                Executive
              </button>
              <button 
                onClick={() => setActiveStackTab("payment")}
                className={`flex-1 py-2.5 rounded-lg text-[9px] font-space lowercase font-bold lowercase transition-all ${activeStackTab === "payment" ? "bg-purple-600 text-gray-900 shadow" : "text-gray-500"}`}
              >
                Confirm
              </button>
            </div>

            {/* Tap contents mapping */}
            <AnimatePresence mode="wait">
              {activeStackTab === "details" && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="p-6 rounded-2xl border border-purple-100 bg-white/80 backdrop-blur-md backdrop-blur-md space-y-5"
                >
                  <div className="flex justify-between items-center pb-2 border-b border-purple-100">
                    <span className="font-space lowercase text-[9px] text-purple-600 tracking-widest font-extrabold lowercase">FLIGHT ROUTE</span>
                    <div className="flex gap-1 bg-white p-1 rounded-full border border-purple-100">
                      <button 
                        onClick={() => setTripType("ONEWAY")}
                        className={`px-3 py-1 rounded-full text-[8px] font-space lowercase font-bold lowercase transition-all ${tripType === "ONEWAY" ? "bg-purple-100 text-gray-900" : "text-gray-500"}`}
                      >
                        Oneway
                      </button>
                      <button 
                        onClick={() => setTripType("ROUND")}
                        className={`px-3 py-1 rounded-full text-[8px] font-space lowercase font-bold lowercase transition-all ${tripType === "ROUND" ? "bg-purple-100 text-gray-900" : "text-gray-500"}`}
                      >
                        Round
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-gray-600 text-[8px] font-space lowercase lowercase tracking-widest">Origin</label>
                      <input 
                        type="text"
                        value={origin}
                        onChange={(e) => setOrigin(e.target.value)}
                        className="w-full border border-purple-200 rounded-xl px-4 py-3 bg-white/80 backdrop-blur-md text-gray-900 text-xs outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-gray-600 text-[8px] font-space lowercase lowercase tracking-widest">Destination</label>
                      <input 
                        type="text"
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                        className="w-full border border-purple-200 rounded-xl px-4 py-3 bg-white/80 backdrop-blur-md text-gray-900 text-xs outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-gray-600 text-[8px] font-space lowercase lowercase tracking-widest">Departure Date</label>
                      <input 
                        type="datetime-local"
                        value={flightDate}
                        onChange={(e) => setFlightDate(e.target.value)}
                        className="w-full border border-purple-200 rounded-xl px-4 py-3 bg-white/80 backdrop-blur-md text-gray-900 text-xs outline-none"
                      />
                    </div>
                  </div>

                  <button 
                    onClick={() => setActiveStackTab("aircraft")}
                    className="w-full py-4 rounded-xl bg-purple-50 border border-purple-200 text-xs font-space lowercase tracking-widest font-bold lowercase text-gray-900 flex items-center justify-center gap-2 mt-4"
                  >
                    <span>NEXT: SELECT AIRCRAFT</span>
                    <ChevronRight className="w-4 h-4 text-purple-600" />
                  </button>
                </motion.div>
              )}

              {activeStackTab === "aircraft" && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="p-6 rounded-2xl border border-purple-100 bg-white/80 backdrop-blur-md backdrop-blur-md space-y-5"
                >
                  <span className="font-space lowercase text-[9px] text-emerald-400 tracking-widest font-extrabold lowercase block pb-2 border-b border-purple-100">
                    AIRCRAFT &amp; CLASS
                  </span>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-gray-600 text-[8px] font-space lowercase lowercase tracking-widest">Jet Category</label>
                      <select
                        value={jetClass}
                        onChange={(e) => setJetClass(e.target.value as any)}
                        className="w-full border border-purple-200 rounded-xl px-4 py-3 bg-[#0a0f1d] text-gray-900 text-xs outline-none"
                      >
                        <option value="LIGHT">Light Jet | 4-6 Seats</option>
                        <option value="MID">Midsize Jet | 7-9 Seats</option>
                        <option value="HEAVY">Heavy Jet | 10-14 Seats</option>
                        <option value="ULTRA">Ultra / Long Range</option>
                      </select>
                    </div>

                    <div className="p-4 rounded-xl bg-white border border-purple-100 flex flex-col gap-3">
                      <img src={selectedJet.image} alt={selectedJet.label} className="w-full h-24 rounded-lg object-cover" />
                      <div className="space-y-1">
                        <span className="font-space lowercase text-[9px] font-bold block">{selectedJet.label} fleet</span>
                        <p className="text-[10px] text-gray-600 font-mono">{selectedJet.models}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-4">
                    <button 
                      onClick={() => setActiveStackTab("details")}
                      className="flex-1 py-4 rounded-xl bg-purple-50 border border-purple-200 text-xs font-space lowercase tracking-widest text-gray-900 lowercase flex items-center justify-center gap-1"
                    >
                      <ChevronLeft className="w-4 h-4 text-purple-600" />
                      <span>BACK</span>
                    </button>
                    <button 
                      onClick={() => setActiveStackTab("passengers")}
                      className="flex-1 py-4 rounded-xl bg-purple-600 text-gray-900 text-xs font-space lowercase tracking-widest font-bold lowercase flex items-center justify-center gap-1 shadow-lg"
                    >
                      <span>NEXT</span>
                      <ChevronRight className="w-4 h-4 text-gray-900" />
                    </button>
                  </div>
                </motion.div>
              )}

              {activeStackTab === "passengers" && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="p-6 rounded-2xl border border-purple-100 bg-white/80 backdrop-blur-md backdrop-blur-md space-y-5"
                >
                  <span className="font-space lowercase text-[9px] text-purple-600 tracking-widest font-extrabold lowercase block pb-2 border-b border-purple-100">
                    EXECUTIVE DETAILS
                  </span>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-gray-600 text-[8px] font-space lowercase lowercase tracking-widest">Full Name</label>
                      <input 
                        type="text"
                        value={executiveName}
                        onChange={(e) => setExecutiveName(e.target.value)}
                        placeholder="Executive name"
                        className="w-full border border-purple-200 rounded-xl px-4 py-3 bg-white/80 backdrop-blur-md text-gray-900 text-xs outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-gray-600 text-[8px] font-space lowercase lowercase tracking-widest">Email Address</label>
                      <input 
                        type="email"
                        value={executiveEmail}
                        onChange={(e) => setExecutiveEmail(e.target.value)}
                        placeholder="executive@domain.com"
                        className="w-full border border-purple-200 rounded-xl px-4 py-3 bg-white/80 backdrop-blur-md text-gray-900 text-xs outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-gray-600 text-[8px] font-space lowercase lowercase tracking-widest">Country &amp; Phone</label>
                      <div className="flex gap-2">
                        <select
                          value={countryCode}
                          onChange={(e) => setCountryCode(e.target.value)}
                          className="bg-white border border-purple-200 rounded-xl px-3 py-3 text-xs font-mono text-gray-900 outline-none cursor-pointer shrink-0"
                        >
                          <option value="+234">🇳🇬 +234</option>
                          <option value="+1">🇺🇸 +1</option>
                          <option value="+44">🇬🇧 +44</option>
                          <option value="+971">🇦🇪 +971</option>
                          <option value="+27">🇿🇦 +27</option>
                        </select>
                        <input 
                          type="tel"
                          value={executivePhone}
                          onChange={(e) => setExecutivePhone(e.target.value)}
                          placeholder="Phone number"
                          className="flex-1 border border-purple-200 rounded-xl px-4 py-3 bg-white/80 backdrop-blur-md text-gray-900 text-xs font-mono outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-4">
                    <button 
                      onClick={() => setActiveStackTab("aircraft")}
                      className="flex-1 py-4 rounded-xl bg-purple-50 border border-purple-200 text-xs font-space lowercase tracking-widest text-gray-900 lowercase flex items-center justify-center gap-1"
                    >
                      <ChevronLeft className="w-4 h-4 text-purple-600" />
                      <span>BACK</span>
                    </button>
                    <button 
                      onClick={() => setActiveStackTab("payment")}
                      className="flex-1 py-4 rounded-xl bg-purple-600 text-gray-900 text-xs font-space lowercase tracking-widest font-bold lowercase flex items-center justify-center gap-1 shadow-lg"
                    >
                      <span>CONFIRM</span>
                      <ChevronRight className="w-4 h-4 text-gray-900" />
                    </button>
                  </div>
                </motion.div>
              )}

              {activeStackTab === "payment" && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="p-6 rounded-2xl border border-purple-100 bg-white/80 backdrop-blur-md backdrop-blur-md space-y-5"
                >
                  <span className="font-space lowercase text-[9px] text-[#8B5CF6] tracking-widest font-extrabold lowercase block pb-2 border-b border-purple-100">
                    CONFIRMATION DETAILS
                  </span>

                  <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-600/10 to-royalpurple/5 border border-purple-100 text-center space-y-2">
                    <span className="text-[8px] font-space lowercase text-gray-600 lowercase tracking-widest block">ESTIMATED TRIP COST</span>
                    <h4 className="text-2xl font-space lowercase font-bold text-gray-900">
                      ${Math.round(flightCost).toLocaleString()} - ${Math.round(flightCostHigh).toLocaleString()}
                    </h4>
                  </div>

                  <div className="space-y-2.5 font-mono text-[10px] text-gray-600 bg-white/80 backdrop-blur-md p-4 rounded-xl border border-purple-100">
                    <p>EXECUTIVE: <strong className="text-gray-900">{executiveName || "TBD"}</strong></p>
                    <p>ROUTE: <strong className="text-gray-900">{origin.split("|")[0]} &gt; {destination.split("|")[0]}</strong></p>
                    <p>DEPARTURE: <strong className="text-gray-900">{flightDate}</strong></p>
                    <p>AIRCRAFT: <strong className="text-gray-900">{selectedJet.label}</strong></p>
                  </div>

                  <div className="flex gap-3 mt-4">
                    <button 
                      onClick={() => setActiveStackTab("passengers")}
                      className="flex-1 py-4 rounded-xl bg-purple-50 border border-purple-200 text-xs font-space lowercase tracking-widest text-gray-900 lowercase flex items-center justify-center gap-1"
                    >
                      <ChevronLeft className="w-4 h-4 text-purple-600" />
                      <span>BACK</span>
                    </button>
                    <button 
                      onClick={handleStartDispatch}
                      disabled={isRequesting}
                      className="flex-1 py-4 rounded-xl bg-purple-600 text-gray-900 text-xs font-space lowercase tracking-widest font-bold lowercase flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(24,119,242,0.3)]"
                    >
                      {isRequesting ? (
                        <RefreshCw className="w-4 h-4 animate-spin text-gray-900" />
                      ) : (
                        <span>DISPATCH NOW</span>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>

        </div>
      </div>

      {/* DISPATCH SUCCESS OVERLAY MODAL */}
      <AnimatePresence>
        {showCompleteModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[500] backdrop-blur-2xl bg-white/40 flex items-center justify-center p-6 text-center overflow-y-auto"
          >
            <div className="w-full max-w-xl p-8 rounded-[2.5rem] border border-purple-200 bg-slate-950 shadow-2xl space-y-6 my-auto">
              <div className="flex justify-center">
                <div className="p-3.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <CheckCircle2 className="w-12 h-12" />
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="font-space lowercase text-[10px] text-emerald-400 tracking-[0.3em] font-bold block lowercase">
                  REQUEST SUCCESSFULLY DISPATCHED
                </span>
                <h3 className="font-space lowercase font-bold text-2xl text-gray-900 lowercase tracking-tight">
                  VIP PARAMETERS INGESTED
                </h3>
              </div>

              <div className="p-6 rounded-2xl bg-white/80 backdrop-blur-md border border-purple-100 space-y-4">
                <span className="text-[9px] font-space lowercase text-gray-500 tracking-widest lowercase block">
                  YOUR UNIQUE FLIGHT ACCESS CODE
                </span>

                <div className="flex items-center justify-center gap-3">
                  <span className="font-space lowercase font-bold text-3xl tracking-widest text-gray-900">
                    {generatedRequestId}
                  </span>
                </div>

                <p className="text-xs text-gray-600 leading-relaxed font-lexend max-w-sm mx-auto">
                  Use this Flight Request ID passcode to securely log in and monitor status on the 15D Wings Command Centre.
                </p>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => {
                    setShowCompleteModal(false);
                    onSuccess(generatedRequestId);
                  }}
                  className="flex-1 py-4 rounded-xl bg-purple-600 hover:bg-purple-600/90 text-gray-900 font-space lowercase text-xs font-bold tracking-widest lowercase transition-all shadow-[0_0_15px_rgba(24,119,242,0.3)] cursor-pointer"
                >
                  ACCESS COMMAND CENTRE
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
