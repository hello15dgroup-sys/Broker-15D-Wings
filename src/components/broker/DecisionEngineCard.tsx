import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plane, MapPin, Calculator, Fuel, Clock, DollarSign, ChevronRight, Compass } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';

export interface AirportOption {
  code: string;
  icao: string;
  name: string;
  city: string;
  country: string;
  lat: number;
  lon: number;
}

export const AIRPORT_DATABASE: AirportOption[] = [
  { code: 'LOS', icao: 'DNMM', name: 'Murtala Muhammed Intl', city: 'Lagos', country: 'Nigeria', lat: 6.5774, lon: 3.3215 },
  { code: 'ABV', icao: 'DNAA', name: 'Nnamdi Azikiwe Intl', city: 'Abuja', country: 'Nigeria', lat: 9.0068, lon: 7.2631 },
  { code: 'PHC', icao: 'DNPO', name: 'Port Harcourt Intl', city: 'Port Harcourt', country: 'Nigeria', lat: 5.0155, lon: 6.9496 },
  { code: 'KAN', icao: 'DNKN', name: 'Mallam Aminu Kano Intl', city: 'Kano', country: 'Nigeria', lat: 12.0476, lon: 8.5246 },
  { code: 'ACC', icao: 'DGAA', name: 'Kotoka Intl', city: 'Accra', country: 'Ghana', lat: 5.6052, lon: -0.1668 },
  { code: 'LHR', icao: 'EGLL', name: 'London Heathrow', city: 'London', country: 'United Kingdom', lat: 51.4700, lon: -0.4543 },
  { code: 'DXB', icao: 'OMDB', name: 'Dubai Intl', city: 'Dubai', country: 'UAE', lat: 25.2532, lon: 55.3657 },
  { code: 'TEB', icao: 'KTEB', name: 'Teterboro Executive', city: 'New York / NJ', country: 'United States', lat: 40.8501, lon: -74.0608 },
  { code: 'VNY', icao: 'KVNY', name: 'Van Nuys Executive', city: 'Los Angeles / CA', country: 'United States', lat: 34.2098, lon: -118.4899 },
  { code: 'LBG', icao: 'LFPB', name: 'Paris Le Bourget', city: 'Paris', country: 'France', lat: 48.9694, lon: 2.4414 },
];

export interface AircraftClassSpec {
  id: string;
  name: string;
  category: string;
  speedKts: number;
  fuelBurnGph: number;
  hourlyRateUsd: number;
  capacityPax: number;
  rangeNm: number;
}

export const AIRCRAFT_CLASSES: AircraftClassSpec[] = [
  { id: 'light', name: 'Light Jet (Citation CJ4 / Phenom 300)', category: 'Light Jet', speedKts: 430, fuelBurnGph: 195, hourlyRateUsd: 4200, capacityPax: 7, rangeNm: 1950 },
  { id: 'midsize', name: 'Midsize Jet (Hawker 900XP / Lear 60)', category: 'Midsize Jet', speedKts: 460, fuelBurnGph: 260, hourlyRateUsd: 6500, capacityPax: 9, rangeNm: 2800 },
  { id: 'heavy', name: 'Heavy Jet (Challenger 650 / Falcon 2000)', category: 'Heavy Jet', speedKts: 488, fuelBurnGph: 360, hourlyRateUsd: 9800, capacityPax: 14, rangeNm: 4000 },
  { id: 'ultra', name: 'Ultra Long Range (Gulfstream G650 / Global 6000)', category: 'Ultra Long Range', speedKts: 516, fuelBurnGph: 450, hourlyRateUsd: 14500, capacityPax: 16, rangeNm: 6500 },
];

function calculateHaversineNm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3440.065; // Radius of earth in Nautical Miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

interface DecisionEngineCardProps {
  onQuoteCalculated?: (calc: {
    origin: AirportOption;
    destination: AirportOption;
    aircraft: AircraftClassSpec;
    distanceNm: number;
    flightHours: number;
    fuelGallons: number;
    wholesaleCostUsd: number;
  }) => void;
}

export const DecisionEngineCard: React.FC<DecisionEngineCardProps> = ({ onQuoteCalculated }) => {
  const [originCode, setOriginCode] = useState<string>('LOS');
  const [destCode, setDestCode] = useState<string>('ABV');
  const [selectedAircraftId, setSelectedAircraftId] = useState<string>('midsize');
  const [tripType, setTripType] = useState<'ONE_WAY' | 'ROUND_TRIP'>('ONE_WAY');
  const [currency, setCurrency] = useState<'USD' | 'NGN'>('USD');
  const usdToNgnRate = 1480;

  const origin = useMemo(() => AIRPORT_DATABASE.find(a => a.code === originCode) || AIRPORT_DATABASE[0], [originCode]);
  const destination = useMemo(() => AIRPORT_DATABASE.find(a => a.code === destCode) || AIRPORT_DATABASE[1], [destCode]);
  const aircraft = useMemo(() => AIRCRAFT_CLASSES.find(ac => ac.id === selectedAircraftId) || AIRCRAFT_CLASSES[1], [selectedAircraftId]);

  const calculation = useMemo(() => {
    let distance = calculateHaversineNm(origin.lat, origin.lon, destination.lat, destination.lon);
    if (distance < 50) distance = 50; // minimum airspace routing floor
    
    // Flight duration in hours (includes 15 min taxi/hold)
    const rawHours = distance / aircraft.speedKts + 0.25;
    const flightHours = Math.round(rawHours * 10) / 10;
    
    const multiplier = tripType === 'ROUND_TRIP' ? 2 : 1;
    const totalNm = distance * multiplier;
    const totalHours = Math.round(flightHours * multiplier * 10) / 10;
    
    const fuelGallons = Math.round(totalHours * aircraft.fuelBurnGph);
    const fuelCostUsd = Math.round(fuelGallons * 6.85); // jet fuel average gallon cost
    
    const wholesaleCostUsd = Math.round(totalHours * aircraft.hourlyRateUsd);
    const wholesaleCostNgn = wholesaleCostUsd * usdToNgnRate;

    return {
      distanceNm: totalNm,
      flightHours: totalHours,
      fuelGallons,
      fuelCostUsd,
      wholesaleCostUsd,
      wholesaleCostNgn
    };
  }, [origin, destination, aircraft, tripType]);

  const handleApplyEstimate = () => {
    if (onQuoteCalculated) {
      onQuoteCalculated({
        origin,
        destination,
        aircraft,
        distanceNm: calculation.distanceNm,
        flightHours: calculation.flightHours,
        fuelGallons: calculation.fuelGallons,
        wholesaleCostUsd: calculation.wholesaleCostUsd
      });
    }
  };

  return (
    <div className="p-6 md:p-8 rounded-[2rem] border border-white/10 glass-vip shadow-2xl relative overflow-hidden bg-gradient-to-br from-black/80 via-[#070c16]/90 to-black/90">
      <div className="absolute top-0 right-0 w-64 h-64 bg-fbblue/5 blur-3xl pointer-events-none rounded-full" />
      
      {/* Header with Law of Cheerful Giver tag */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-fbblue animate-pulse" />
            <span className="ui-sync text-[9px] text-fbblue tracking-[0.25em] font-bold uppercase">
              MODULE 1 — NATIVE DECISION ENGINE
            </span>
          </div>
          <h3 className="font-sync text-lg md:text-xl font-bold tracking-wider text-white uppercase">
            Get Flight Estimate
          </h3>
          <p className="text-xs text-gray-400 font-light">
            Zero-latency route distance, fuel burn, and wholesale cost calculation.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <span className="px-3 py-1.5 rounded-full bg-fbblue/10 border border-fbblue/20 text-fbblue text-[9px] font-mono tracking-wider uppercase font-semibold">
            100% Free Route Math
          </span>
          <div className="bg-white/5 p-1 rounded-xl border border-white/10 flex gap-1">
            <button
              onClick={() => setCurrency('USD')}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all ${currency === 'USD' ? 'bg-fbblue text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
            >
              USD ($)
            </button>
            <button
              onClick={() => setCurrency('NGN')}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all ${currency === 'NGN' ? 'bg-fbblue text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
            >
              NGN (₦)
            </button>
          </div>
        </div>
      </div>

      {/* Controls Form */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 py-6">
        {/* Departure */}
        <div className="space-y-2">
          <label className="ui-sync text-[9px] text-gray-400 tracking-widest uppercase block">
            DEPARTURE CITY (ORIGIN)
          </label>
          <div className="relative">
            <select
              value={originCode}
              onChange={(e) => setOriginCode(e.target.value)}
              className="w-full bg-black/80 border border-white/15 rounded-2xl px-4 py-3.5 text-sm text-white font-mono focus:border-fbblue outline-none transition-all cursor-pointer appearance-none"
            >
              {AIRPORT_DATABASE.map((apt) => (
                <option key={apt.code} value={apt.code} disabled={apt.code === destCode}>
                  {apt.city} ({apt.code} / {apt.icao}) — {apt.name}
                </option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
              <MapPin className="w-4 h-4 text-fbblue" />
            </div>
          </div>
        </div>

        {/* Destination */}
        <div className="space-y-2">
          <label className="ui-sync text-[9px] text-gray-400 tracking-widest uppercase block">
            DESTINATION CITY
          </label>
          <div className="relative">
            <select
              value={destCode}
              onChange={(e) => setDestCode(e.target.value)}
              className="w-full bg-black/80 border border-white/15 rounded-2xl px-4 py-3.5 text-sm text-white font-mono focus:border-fbblue outline-none transition-all cursor-pointer appearance-none"
            >
              {AIRPORT_DATABASE.map((apt) => (
                <option key={apt.code} value={apt.code} disabled={apt.code === originCode}>
                  {apt.city} ({apt.code} / {apt.icao}) — {apt.name}
                </option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
              <MapPin className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
        </div>

        {/* Aircraft Selection */}
        <div className="space-y-2">
          <label className="ui-sync text-[9px] text-gray-400 tracking-widest uppercase block">
            AIRCRAFT CLASS
          </label>
          <div className="relative">
            <select
              value={selectedAircraftId}
              onChange={(e) => setSelectedAircraftId(e.target.value)}
              className="w-full bg-black/80 border border-white/15 rounded-2xl px-4 py-3.5 text-xs text-white font-lexend focus:border-fbblue outline-none transition-all cursor-pointer appearance-none"
            >
              {AIRCRAFT_CLASSES.map((ac) => (
                <option key={ac.id} value={ac.id}>
                  {ac.name} ({ac.capacityPax} Seats)
                </option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
              <Plane className="w-4 h-4 text-fbblue" />
            </div>
          </div>
        </div>
      </div>

      {/* Trip Type Selector */}
      <div className="flex gap-4 pb-6">
        <button
          onClick={() => setTripType('ONE_WAY')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-mono font-semibold transition-all border ${
            tripType === 'ONE_WAY'
              ? 'bg-fbblue/20 border-fbblue text-fbblue'
              : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
          }`}
        >
          ONE WAY FLIGHT
        </button>
        <button
          onClick={() => setTripType('ROUND_TRIP')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-mono font-semibold transition-all border ${
            tripType === 'ROUND_TRIP'
              ? 'bg-fbblue/20 border-fbblue text-fbblue'
              : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
          }`}
        >
          ROUND TRIP (RETURN)
        </button>
      </div>

      {/* Decision Results Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5 rounded-2xl bg-black/60 border border-white/10 my-2">
        <div className="space-y-1">
          <span className="text-[9px] text-gray-400 ui-sync uppercase block flex items-center gap-1">
            <Compass className="w-3 h-3 text-fbblue" /> AIR DISTANCE
          </span>
          <span className="text-xl font-mono font-bold text-white">
            {calculation.distanceNm} <span className="text-xs text-gray-400 font-normal">NM</span>
          </span>
        </div>

        <div className="space-y-1">
          <span className="text-[9px] text-gray-400 ui-sync uppercase block flex items-center gap-1">
            <Clock className="w-3 h-3 text-fbblue" /> FLIGHT DURATION
          </span>
          <span className="text-xl font-mono font-bold text-fbblue">
            {calculation.flightHours} <span className="text-xs text-gray-400 font-normal">HRS</span>
          </span>
        </div>

        <div className="space-y-1">
          <span className="text-[9px] text-gray-400 ui-sync uppercase block flex items-center gap-1">
            <Fuel className="w-3 h-3 text-amber-400" /> EST. FUEL BURN
          </span>
          <span className="text-xl font-mono font-bold text-amber-300">
            {calculation.fuelGallons.toLocaleString()} <span className="text-xs text-gray-400 font-normal">GAL</span>
          </span>
        </div>

        <div className="space-y-1">
          <span className="text-[9px] text-gray-400 ui-sync uppercase block flex items-center gap-1">
            <DollarSign className="w-3 h-3 text-emerald-400" /> BASELINE WHOLESALE
          </span>
          <span className="text-xl font-mono font-bold text-emerald-400">
            {currency === 'USD'
              ? `$${calculation.wholesaleCostUsd.toLocaleString()}`
              : `₦${calculation.wholesaleCostNgn.toLocaleString()}`}
          </span>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 mt-2">
        <div className="text-[10px] text-gray-400 font-mono">
          <span>Haversine Matrix: </span>
          <span className="text-fbblue font-semibold">{origin.code} ({origin.lat}, {origin.lon})</span>
          <span> → </span>
          <span className="text-emerald-400 font-semibold">{destination.code} ({destination.lat}, {destination.lon})</span>
        </div>

        <button
          onClick={handleApplyEstimate}
          className="w-full sm:w-auto px-6 py-3 rounded-xl bg-fbblue hover:bg-fbblue/90 text-white font-sync text-xs font-bold tracking-wider uppercase transition-all shadow-[0_0_20px_rgba(24,119,242,0.4)] flex items-center justify-center gap-2 active:scale-95"
        >
          <span>Use Estimate in Proposal</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
