export const AIRCRAFT_SPECS: Record<string, { speed: number, rate: number, minHrs: number, label: string, range: number, maxPax: number }> = {
  LIGHT: { speed: 700, rate: 2800, minHrs: 1.0, label: "Light Jet", range: 2500, maxPax: 6 },
  MIDSIZE: { speed: 780, rate: 4000, minHrs: 1.0, label: "Midsize Jet", range: 3800, maxPax: 9 },
  MID: { speed: 780, rate: 4000, minHrs: 1.0, label: "Midsize Jet", range: 3800, maxPax: 9 },
  HEAVY: { speed: 850, rate: 6000, minHrs: 1.0, label: "Heavy Jet", range: 6500, maxPax: 14 },
  ULTRA: { speed: 920, rate: 9000, minHrs: 1.0, label: "Ultra/Regional", range: 12500, maxPax: 50 },
  REGIONAL: { speed: 920, rate: 9000, minHrs: 1.0, label: "Ultra/Regional", range: 12500, maxPax: 50 }
};

export const AIRPORT_MAP: Record<string, {name: string, lat: number, lon: number, country: string}> = {
  LOS: { name: 'Lagos — Murtala Muhammed International', lat: 6.5774, lon: 3.3215, country: 'NG' },
  DNMM: { name: 'Lagos — Murtala Muhammed International', lat: 6.5774, lon: 3.3215, country: 'NG' },
  ABV: { name: 'Abuja — Nnamdi Azikiwe International', lat: 9.0068, lon: 7.2631, country: 'NG' },
  DNAA: { name: 'Abuja — Nnamdi Azikiwe International', lat: 9.0068, lon: 7.2631, country: 'NG' },
  PHC: { name: 'Port Harcourt — International Airport', lat: 5.0155, lon: 6.9496, country: 'NG' },
  DNPO: { name: 'Port Harcourt — International Airport', lat: 5.0155, lon: 6.9496, country: 'NG' },
  KAN: { name: 'Kano — Mallam Aminu Kano International', lat: 12.0476, lon: 8.5246, country: 'NG' },
  DNKN: { name: 'Kano — Mallam Aminu Kano International', lat: 12.0476, lon: 8.5246, country: 'NG' },
  ENU: { name: 'Enugu — Akanu Ibiam International', lat: 6.4743, lon: 7.5619, country: 'NG' },
  DNEN: { name: 'Enugu — Akanu Ibiam International', lat: 6.4743, lon: 7.5619, country: 'NG' },
  AKR: { name: 'Akure — Akure Airport', lat: 7.2468, lon: 5.3010, country: 'NG' },
  DNAN: { name: 'Akure — Akure Airport', lat: 7.2468, lon: 5.3010, country: 'NG' }
};

export function getAirportByCodeOrName(query: any) {
  if (!query) return null;
  const q = String(query).toUpperCase();
  if (AIRPORT_MAP[q]) return { code: q, ...AIRPORT_MAP[q] };
  
  for (const [code, data] of Object.entries(AIRPORT_MAP)) {
    if (data.name.toUpperCase().includes(q)) return { code, ...data };
  }
  return null;
}

export function calculateMissionPricing(legs: any[], aircraftClass: string, paxCount: number) {
  let cls = (aircraftClass || '').toUpperCase();
  if (cls.includes('LIGHT') || cls.includes('PHENOM 100') || cls.includes('M2') || cls.includes('SF50') || cls.includes('HONDAJET') || cls.includes('PHENOM 300') || cls.includes('CJ3') || cls.includes('CJ4') || cls.includes('LEARJET 75') || cls.includes('VLJ')) {
    cls = 'LIGHT';
  } else if (cls.includes('LATITUDE') || cls.includes('LEARJET 60') || cls.includes('HAWKER') || cls.includes('CHALLENGER 3500') || cls.includes('PRAETOR 600') || cls.includes('LONGITUDE') || cls.includes('G280') || cls.includes('MID')) {
    cls = 'MID';
  } else if (cls.includes('CHALLENGER 6') || cls.includes('650') || cls.includes('605') || cls.includes('G550') || cls.includes('G450') || cls.includes('FALCON 2000') || cls.includes('FALCON 900') || cls.includes('HEAVY')) {
    cls = 'HEAVY';
  } else if (cls.includes('G650') || cls.includes('G700') || cls.includes('GLOBAL 6000') || cls.includes('ULTRA') || cls.includes('REGIONAL') || cls.includes('LONG RANGE')) {
    cls = 'ULTRA';
  } else {
    cls = 'HEAVY';
  }

  const spec = AIRCRAFT_SPECS[cls] || AIRCRAFT_SPECS['HEAVY'];
  let total = 0;

  for (const leg of legs) {
    if (!leg) continue;
    const fromVal = leg.from || leg.departure;
    const toVal = leg.to || leg.arrival || leg.destination;
    const fromAp = getAirportByCodeOrName(fromVal);
    const toAp = getAirportByCodeOrName(toVal);
    
    // Estimate 1.5 hours if airports are unknown
    let actualHours = 1.5;
    let isIntl = false;

    if (fromAp && toAp) {
       const rad = Math.PI / 180;
       const dLat = (toAp.lat - fromAp.lat) * rad;
       const dLon = (toAp.lon - fromAp.lon) * rad;
       const a = Math.sin(dLat/2)**2 + Math.cos(fromAp.lat*rad)*Math.cos(toAp.lat*rad)*Math.sin(dLon/2)**2;
       const dist = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); // dist in KM
       actualHours = dist / spec.speed;
       isIntl = fromAp.country !== toAp.country;
    }

    const hours = Math.max(actualHours, spec.minHrs);
    let baseCost = hours * spec.rate;
    let adjustedBase = baseCost * (1 + ((paxCount || 1) * 0.01));
    const logisticsFee = isIntl ? 3500 : 1500;
    
    total += adjustedBase + logisticsFee;
  }
  
  return {
    lower: Math.round(total),
    upper: Math.round(total > 0 ? total + 4566 : 0)
  };
}
