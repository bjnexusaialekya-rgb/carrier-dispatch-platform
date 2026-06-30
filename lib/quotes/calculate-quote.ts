import type { VehicleType } from "@/lib/types/vehicle";
import type { ServiceTier, BookingModel } from "@/lib/types/booking";

export type QuotePath = "AUTO" | "MANUAL_REVIEW_REQUIRED" | "PRICING_API_FAILED";
export type QuoteConfidence = "high" | "medium" | "low";

export interface QuoteResult {
  path: QuotePath;
  miles: number | null;
  shipperQuote: number | null;
  marketRateLow: number | null;
  marketRateHigh: number | null;
  confidence: QuoteConfidence | null;
  ratePerMileApplied: number | null;
  disclaimer: string;
}

interface ZipLocation {
  lat: number;
  lng: number;
}

const ZIP_LOOKUP_TIMEOUT_MS = 6_000;
const ESTIMATE_DISCLAIMER =
  "This is an instant estimate based on route distance and current rate guidelines. " +
  "Your final price is confirmed once a carrier is assigned and may vary based on " +
  "live carrier availability, fuel costs, and seasonal demand.";
const MANUAL_REVIEW_DISCLAIMER =
  "We could not generate an instant estimate for this route. Our team will review " +
  "your request and follow up with a quote shortly.";

async function geocodeZip(zip: string): Promise<ZipLocation | null> {
  const cleanZip = (zip ?? "").trim().slice(0, 5);
  if (!/^\d{5}$/.test(cleanZip)) return null;

  try {
    const res = await fetch(`https://api.zippopotam.us/us/${cleanZip}`, {
      signal: AbortSignal.timeout(ZIP_LOOKUP_TIMEOUT_MS),
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;

    const data = await res.json();
    const place = data?.places?.[0];
    if (!place) return null;

    const lat = parseFloat(place.latitude);
    const lng = parseFloat(place.longitude);
    if (Number.isNaN(lat) || Number.isNaN(lng)) return null;

    return { lat, lng };
  } catch {
    return null;
  }
}

function haversineMiles(a: ZipLocation, b: ZipLocation): number {
  const earthRadiusMiles = 3958.8;
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));

  const roadRoutingFactor = 1.17;
  return earthRadiusMiles * c * roadRoutingFactor;
}

interface DistanceBand {
  maxMiles: number;
  ratePerMile: number;
}

const DISTANCE_BANDS: DistanceBand[] = [
  { maxMiles: 250, ratePerMile: 1.1 },
  { maxMiles: 500, ratePerMile: 0.95 },
  { maxMiles: 1000, ratePerMile: 0.75 },
  { maxMiles: 1750, ratePerMile: 0.62 },
  { maxMiles: 2500, ratePerMile: 0.52 },
  { maxMiles: Infinity, ratePerMile: 0.46 },
];

function baseRatePerMile(miles: number): number {
  const band = DISTANCE_BANDS.find((b) => miles <= b.maxMiles);
  return band ? band.ratePerMile : 0.5;
}

const VEHICLE_MULTIPLIER: Record<VehicleType, number> = {
  sedan: 1.0,
  "2_door_coupe": 1.0,
  suv: 1.1,
  pickup: 1.15,
  "4_door_pickup": 1.2,
  van: 1.15,
  truck_daycab: 1.6,
  truck_sleeper: 1.8,
  motorcycle: 0.6,
  boat: 1.7,
  rv: 2.0,
  heavy_machinery: 2.2,
  freight: 1.9,
  livestock: 1.8,
  atv: 0.65,
  trailer_bumper_pull: 1.3,
  trailer_gooseneck: 1.5,
  trailer_5th_wheel: 1.5,
  other: 1.2,
};

const SERVICE_TIER_MULTIPLIER: Record<ServiceTier, number> = {
  standard: 1.0,
  priority: 1.15,
  white_glove: 1.35,
};

const BOOKING_MODEL_MULTIPLIER: Record<BookingModel, number> = {
  full_service: 1.05,
  marketplace: 1.0,
};

const INOPERABLE_SURCHARGE = 1.15;
const MINIMUM_QUOTE = 450;

function roundToTen(value: number): number {
  return Math.round(value / 10) * 10;
}

function confidenceForMiles(miles: number): QuoteConfidence {
  if (miles >= 50 && miles <= 3000) return "high";
  if (miles > 3000 && miles <= 3500) return "medium";
  if (miles < 50) return "medium";
  return "low";
}

export async function calculateQuote(params: {
  originZip: string;
  destinationZip: string;
  vehicleType: VehicleType;
  serviceTier: ServiceTier;
  bookingModel: BookingModel;
  isInoperable: boolean;
}): Promise<QuoteResult> {
  const { originZip, destinationZip, vehicleType, serviceTier, bookingModel, isInoperable } = params;

  const [origin, destination] = await Promise.all([
    geocodeZip(originZip),
    geocodeZip(destinationZip),
  ]);

  if (!origin || !destination) {
    return {
      path: "MANUAL_REVIEW_REQUIRED",
      miles: null,
      shipperQuote: null,
      marketRateLow: null,
      marketRateHigh: null,
      confidence: null,
      ratePerMileApplied: null,
      disclaimer: MANUAL_REVIEW_DISCLAIMER,
    };
  }

  const miles = haversineMiles(origin, destination);

  const vehicleMult = VEHICLE_MULTIPLIER[vehicleType] ?? 1.2;
  const tierMult = SERVICE_TIER_MULTIPLIER[serviceTier] ?? 1.0;
  const modelMult = BOOKING_MODEL_MULTIPLIER[bookingModel] ?? 1.0;
  const inoperableMult = isInoperable ? INOPERABLE_SURCHARGE : 1.0;
  const ratePerMile = baseRatePerMile(miles);

  const rawMid = miles * ratePerMile * vehicleMult * tierMult * modelMult * inoperableMult;

  const mid = Math.max(MINIMUM_QUOTE, roundToTen(rawMid));
  const low = roundToTen(mid * 0.88);
  const high = roundToTen(mid * 1.15);

  return {
    path: "AUTO",
    miles: Math.round(miles),
    shipperQuote: mid,
    marketRateLow: low,
    marketRateHigh: high,
    confidence: confidenceForMiles(miles),
    ratePerMileApplied: ratePerMile,
    disclaimer: ESTIMATE_DISCLAIMER,
  };
}
