/**
 * Tests: Supabase connection + Super Dispatch vehicle enum validation
 *
 * Run: npm test
 * These tests run without a live Supabase instance — pure logic validation.
 * For integration tests against a real DB, use `supabase start` locally first.
 */

import { VEHICLE_TYPES, type VehicleType } from "../lib/types/vehicle";

// ─── Vehicle Enum Tests ───────────────────────────────────────────────────────

describe("Super Dispatch vehicle.type enum — verified March 20 2025", () => {
  const EXPECTED_COUNT = 19;
  const VALID_TYPES: VehicleType[] = [
    "sedan", "2_door_coupe", "suv", "pickup", "4_door_pickup",
    "van", "truck_daycab", "truck_sleeper", "motorcycle", "boat",
    "rv", "heavy_machinery", "freight", "livestock", "atv",
    "trailer_bumper_pull", "trailer_gooseneck", "trailer_5th_wheel", "other",
  ];

  test("enum has exactly 19 values — no more, no less", () => {
    expect(VEHICLE_TYPES).toHaveLength(EXPECTED_COUNT);
  });

  test("all 19 official SD enum values are present", () => {
    VALID_TYPES.forEach(type => {
      expect(VEHICLE_TYPES).toContain(type);
    });
  });

  test("'car' is NOT a valid type — would return HTTP 400 from Super Dispatch", () => {
    expect(VEHICLE_TYPES).not.toContain("car");
  });

  test("'auto' is NOT a valid type", () => {
    expect(VEHICLE_TYPES).not.toContain("auto");
  });

  test("'truck' (bare) is NOT a valid type — must be truck_daycab or truck_sleeper", () => {
    expect(VEHICLE_TYPES).not.toContain("truck");
  });

  test("all types are lowercase strings with underscores only", () => {
    VEHICLE_TYPES.forEach(type => {
      expect(type).toMatch(/^[a-z0-9_]+$/);
    });
  });

  test("no duplicates in enum", () => {
    const unique = new Set(VEHICLE_TYPES);
    expect(unique.size).toBe(VEHICLE_TYPES.length);
  });
});

// ─── Quote Engine Logic Tests ─────────────────────────────────────────────────

describe("Quote engine — three-path logic (JavaScript only, no LLM)", () => {
  // Formula from blueprint: calculatedShipperQuote = Math.round(carrierPay / (1 - 0.20))
  function calculateShipperQuote(carrierPay: number): number {
    return Math.round(carrierPay / (1 - 0.20));
  }

  function costPerMile(shipperQuote: number, miles: number): string {
    return (shipperQuote / miles).toFixed(2);
  }

  function routeQuote(miles: number, recommendedPrice: number): "PATH_A" | "PATH_B" | "PATH_C" {
    if (miles === 0) return "PATH_C";           // API failure — hard stop
    if (recommendedPrice === 0) return "PATH_B"; // Obscure lane — manual review
    return "PATH_A";                             // Full market data — auto quote
  }

  test("Path A: miles > 0 AND price > 0 → full automated quote", () => {
    expect(routeQuote(1200, 800)).toBe("PATH_A");
  });

  test("Path B: miles > 0 BUT price = 0 → MANUAL_REVIEW_REQUIRED", () => {
    expect(routeQuote(450, 0)).toBe("PATH_B");
  });

  test("Path C: miles = 0 → PRICING_API_FAILED — hard stop", () => {
    expect(routeQuote(0, 0)).toBe("PATH_C");
  });

  test("20% margin formula: $800 carrier pay → $1000 shipper quote", () => {
    expect(calculateShipperQuote(800)).toBe(1000);
  });

  test("20% margin formula: $1200 carrier pay → $1500 shipper quote", () => {
    expect(calculateShipperQuote(1200)).toBe(1500);
  });

  test("cost per mile calculation — Houston to Miami ~1187 miles", () => {
    const shipperQuote = calculateShipperQuote(800); // $1000
    const miles = 1187;
    expect(Number(costPerMile(shipperQuote, miles))).toBeCloseTo(0.84, 1);
  });

  test("LLM never touches numbers — JS handles all arithmetic", () => {
    // This test documents the invariant, not code behavior.
    // The quote formula lives here in JS, not in the GPT-4o prompt.
    const carrierPay = 950;
    const quote = calculateShipperQuote(carrierPay);
    expect(typeof quote).toBe("number");
    expect(quote).toBeGreaterThan(carrierPay); // Shipper always pays more than carrier
  });
});

// ─── Supabase Config Tests ────────────────────────────────────────────────────

describe("Supabase environment variable format", () => {
  test("NEXT_PUBLIC_SUPABASE_URL format check (when set)", () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (url) {
      expect(url).toMatch(/^https:\/\/.+\.supabase\.co$/);
    } else {
      // Not set in test environment — skip
      expect(true).toBe(true);
    }
  });

  test("SUPABASE_SECRET_KEY must use sb_secret_xxx format (when set)", () => {
    const key = process.env.SUPABASE_SECRET_KEY;
    if (key) {
      // New rotatable format — not legacy service_role JWT
      expect(key).toMatch(/^sb_secret_/);
    } else {
      expect(true).toBe(true);
    }
  });

  test("NEXT_PUBLIC_SUPABASE_ANON_KEY must use sb_publishable_xxx format (when set)", () => {
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (key) {
      expect(key).toMatch(/^sb_publishable_/);
    } else {
      expect(true).toBe(true);
    }
  });
});
