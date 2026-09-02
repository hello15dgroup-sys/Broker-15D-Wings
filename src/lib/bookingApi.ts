/**
 * 15D WINGS — Aviation Charter Dispatch & Pricing Engine API Client
 * Version: 9.5.0
 * Backend Endpoint: https://bookingapi.15dwingsltd.workers.dev
 */

export const BOOKING_API_BASE = "https://bookingapi.15dwingsltd.workers.dev";

export interface FleetSpec {
  code: "LIGHT" | "MID" | "HEAVY" | "ULTRA";
  label: string;
  speedKmH: number;
  hourlyRateUsd: number;
  minHours: number;
  maxRangeKm: number;
  maxSeats: number;
  models: string;
  image?: string;
}

export interface AirportResult {
  code: string;
  name: string;
  city: string;
  country: string;
  lat: number;
  lon: number;
}

export interface FlightLegInput {
  from: string;
  to: string;
  date: string;
}

export interface ManifestInput {
  adults: number;
  children: number;
  infants: number;
  hasPets: boolean;
  petDetails?: string;
  petWeightKg?: number;
  luggageInfo?: string;
  cateringPreference?: string;
  hazmatDeclaration?: string;
  medicalAssistance?: string;
}

export interface QuoteRequestPayload {
  aircraft: string;
  trip_type: "ONE_WAY" | "ROUND_TRIP";
  manifest: ManifestInput;
  legs: FlightLegInput[];
}

export interface QuoteResponseData {
  aircraft: {
    code: string;
    label: string;
    speedKmH: number;
    hourlyRateUsd: number;
    minHours: number;
    maxRangeKm: number;
    maxSeats: number;
    models?: string;
  };
  tripType: string;
  summary: {
    totalDistanceKm: number;
    totalFlightHours: number;
    totalTechnicalStops: number;
    isInternational: boolean;
    isUrgentNoticeRequired: boolean;
    pricing: {
      currency: string;
      estimateLowerUsd: number;
      estimateUpperUsd: number;
      disclaimer: string;
    };
  };
  manifest: {
    adults: number;
    children: number;
    infants: number;
    totalPax: number;
    hasPets: boolean;
    petDetails?: string;
    petWeightKg?: number;
    luggageInfo?: string;
    cateringPreference?: string;
    hazmatDeclaration?: string;
    medicalAssistance?: string;
  };
  legs: Array<{
    legIndex: number;
    origin: AirportResult;
    destination: AirportResult;
    distanceKm: number;
    flightDurationHours: number;
    technicalStopsRequired: number;
    isInternational: boolean;
    departureDate: string;
    departureTime?: string;
    legEstimateUsd: number;
  }>;
  validation: {
    isValid: boolean;
    errors: string[];
  };
}

export interface QuoteApiResponse {
  ok: boolean;
  data?: QuoteResponseData;
  error?: string;
  details?: string[];
}

export interface DispatchRequestPayload {
  name: string;
  email: string;
  phone: string;
  aircraft: string;
  trip_type: "ONE_WAY" | "ROUND_TRIP";
  manifest: ManifestInput;
  legs: FlightLegInput[];
}

export interface DispatchApiResponse {
  ok: boolean;
  request_id?: string;
  status?: string;
  quote?: QuoteResponseData;
  message?: string;
  error?: string;
  details?: string[];
}

// Fallback Fleet Data matching API specifications
export const FALLBACK_FLEET: Record<string, FleetSpec> = {
  LIGHT: {
    code: "LIGHT",
    label: "Light Jet",
    speedKmH: 700,
    hourlyRateUsd: 2800,
    minHours: 1,
    maxRangeKm: 3333,
    maxSeats: 6,
    models: "Phenom 300, Citation CJ4, Hawker 400XP",
    image: "https://images.unsplash.com/photo-1540962351504-03099e0a754b?auto=format&fit=crop&w=800&q=80"
  },
  MID: {
    code: "MID",
    label: "Midsize Jet",
    speedKmH: 780,
    hourlyRateUsd: 4000,
    minHours: 1,
    maxRangeKm: 5185,
    maxSeats: 9,
    models: "Hawker 800/900XP, Learjet 60XR, Praetor 500",
    image: "https://res.cloudinary.com/dw9m06rgf/image/upload/v1778682411/Website-midsize-JEt-1024x499_exojji.jpg"
  },
  HEAVY: {
    code: "HEAVY",
    label: "Heavy Jet",
    speedKmH: 850,
    hourlyRateUsd: 6000,
    minHours: 1,
    maxRangeKm: 7408,
    maxSeats: 14,
    models: "Challenger 604/605, Legacy 600/650, Falcon 900",
    image: "https://res.cloudinary.com/dw9m06rgf/image/upload/v1778682756/65bd26a6a22e0c57f5eb0fc8_65134bb72c32636b787adb9d_large-private-jet_icgtng.webp"
  },
  ULTRA: {
    code: "ULTRA",
    label: "Ultra / Regional",
    speedKmH: 920,
    hourlyRateUsd: 9000,
    minHours: 1,
    maxRangeKm: 12038,
    maxSeats: 50,
    models: "ERJ-135/145, Global 6000/7500, G550/G650",
    image: "https://res.cloudinary.com/dw9m06rgf/image/upload/v1778682889/Bombardier_Global_6000_LX-NST_Exterior_4_1600x1200_fnstut.jpg"
  }
};

// Popular Hubs for instant 1-tap selection
export const POPULAR_AIRPORTS: AirportResult[] = [
  { code: "LOS", city: "Lagos", name: "Murtala Muhammed Int'l (LOS)", country: "Nigeria", lat: 6.5774, lon: 3.3212 },
  { code: "ABV", city: "Abuja", name: "Nnamdi Azikiwe Int'l (ABV)", country: "Nigeria", lat: 9.0068, lon: 7.2632 },
  { code: "PHC", city: "Port Harcourt", name: "Port Harcourt Int'l (PHC)", country: "Nigeria", lat: 5.0155, lon: 6.9525 },
  { code: "KAN", city: "Kano", name: "Mallam Aminu Kano Int'l (KAN)", country: "Nigeria", lat: 12.0476, lon: 8.5246 },
  { code: "ACC", city: "Accra", name: "Kotoka Int'l (ACC)", country: "Ghana", lat: 5.6052, lon: -0.1668 },
  { code: "LHR", city: "London", name: "London Heathrow Airport (LHR)", country: "United Kingdom", lat: 51.47, lon: -0.4543 },
  { code: "DXB", city: "Dubai", name: "Dubai International Airport (DXB)", country: "United Arab Emirates", lat: 25.2532, lon: 55.3657 },
  { code: "JFK", city: "New York", name: "John F. Kennedy Int'l (JFK)", country: "United States", lat: 40.6413, lon: -73.7781 },
  { code: "CDG", city: "Paris", name: "Charles de Gaulle (CDG)", country: "France", lat: 49.0097, lon: 2.5479 },
  { code: "JNB", city: "Johannesburg", name: "O.R. Tambo Int'l (JNB)", country: "South Africa", lat: -26.1367, lon: 28.2411 }
];

/**
 * Fetch available fleet parameters and rates from Cloudflare Worker
 */
export async function getFleet(): Promise<Record<string, FleetSpec>> {
  try {
    const res = await fetch(`${BOOKING_API_BASE}/api/v1/fleet`, {
      headers: { "Accept": "application/json" }
    });
    if (!res.ok) throw new Error(`Fleet request failed: ${res.status}`);
    const data = await res.json() as { ok: boolean; fleet?: Record<string, FleetSpec> };
    if (data.ok && data.fleet) {
      // Merge with images
      const merged: Record<string, FleetSpec> = {};
      for (const [key, val] of Object.entries(data.fleet)) {
        merged[key] = {
          ...val,
          image: FALLBACK_FLEET[key]?.image || FALLBACK_FLEET.LIGHT.image
        };
      }
      return merged;
    }
  } catch (err) {
    console.warn("Using fallback fleet data due to API error:", err);
  }
  return FALLBACK_FLEET;
}

/**
 * Search airports by code, city or country name from Cloudflare Worker
 */
export async function searchAirports(query: string): Promise<AirportResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return POPULAR_AIRPORTS.slice(0, 5);

  try {
    const res = await fetch(`${BOOKING_API_BASE}/api/v1/airports?q=${encodeURIComponent(trimmed)}`, {
      headers: { "Accept": "application/json" }
    });
    if (res.ok) {
      const data = await res.json() as { ok: boolean; results?: AirportResult[] };
      if (data.ok && Array.isArray(data.results) && data.results.length > 0) {
        return data.results;
      }
    }
  } catch (err) {
    console.warn("Airport API query failed:", err);
  }

  // Local search fallback from popular airports
  const q = trimmed.toLowerCase();
  return POPULAR_AIRPORTS.filter(a => 
    a.code.toLowerCase().includes(q) || 
    a.city.toLowerCase().includes(q) || 
    a.name.toLowerCase().includes(q) || 
    a.country.toLowerCase().includes(q)
  );
}

/**
 * Compute real-time Haversine geodesic distance, tech fuel stops, and price quote
 */
export async function calculateQuote(payload: QuoteRequestPayload): Promise<QuoteApiResponse> {
  try {
    const res = await fetch(`${BOOKING_API_BASE}/api/v1/quote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json() as QuoteApiResponse;
    return data;
  } catch (err: any) {
    console.error("Quote calculation error:", err);
    return {
      ok: false,
      error: err.message || "Failed to reach pricing engine"
    };
  }
}

/**
 * Dispatch mission telemetry to database & comms, returning official Request ID
 */
export async function dispatchMission(payload: DispatchRequestPayload): Promise<DispatchApiResponse> {
  try {
    const res = await fetch(`${BOOKING_API_BASE}/api/v1/dispatch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json() as DispatchApiResponse;
    return data;
  } catch (err: any) {
    console.error("Flight dispatch error:", err);
    return {
      ok: false,
      error: err.message || "Failed to dispatch mission"
    };
  }
}
