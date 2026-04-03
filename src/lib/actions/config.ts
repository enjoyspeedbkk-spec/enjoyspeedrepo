"use server";

// ========================================
// PUBLIC CONFIG — Live pricing & settings from DB
// No admin auth required — these are public-facing read queries.
// Used by booking page, pricing displays, etc.
// Falls back to hardcoded constants if DB is unreachable.
// ========================================

import { createAdminClient } from "@/lib/supabase/admin";
import {
  RIDE_PACKAGES,
  TIME_SLOTS,
  BIKE_RENTAL_PRICES,
} from "@/lib/constants";
import type { RidePackage, TimeSlot } from "@/types";

// ── Types ──────────────────────────────────────────

export interface LivePackage {
  type: string;
  name: string;
  name_th?: string;
  minRiders: number;
  maxRiders: number;
  pricePerPerson: number;
  leadersCount: number;
  heroesCount: number;
}

export interface LiveBikeRental {
  id: string;
  bike_type: string;
  name: string;
  price: number;
  is_active: boolean;
}

export interface LiveTimeSlot {
  id: string;
  label: string;
  label_th?: string;
  startTime: string;
  endTime: string;
  period: string;
  overlaps: string[];
  is_active: boolean;
}

export interface LiveConfig {
  packages: LivePackage[];
  bikeRentals: LiveBikeRental[];
  bikeRentalPrices: Record<string, number>;
  timeSlots: LiveTimeSlot[];
}

// ── Fetchers ───────────────────────────────────────

export async function getLivePackages(): Promise<LivePackage[]> {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("ride_packages_config")
      .select("type, name, name_th, min_riders, max_riders, price_per_person, leaders_count, heroes_count, is_active, sort_order")
      .eq("is_active", true)
      .order("sort_order");

    if (data && data.length > 0) {
      return data.map((p) => ({
        type: p.type,
        name: p.name,
        name_th: p.name_th,
        minRiders: p.min_riders,
        maxRiders: p.max_riders,
        pricePerPerson: p.price_per_person,
        leadersCount: p.leaders_count ?? 1,
        heroesCount: p.heroes_count ?? 0,
      }));
    }
  } catch {
    // Fall back to constants
  }

  // Fallback: return hardcoded constants
  return RIDE_PACKAGES.map((p) => ({
    type: p.type,
    name: p.name,
    minRiders: p.minRiders,
    maxRiders: p.maxRiders,
    pricePerPerson: p.pricePerPerson,
    leadersCount: p.leadersCount,
    heroesCount: p.heroesCount,
  }));
}

export async function getLiveBikeRentals(): Promise<LiveBikeRental[]> {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("bike_rentals_config")
      .select("id, bike_type, name, price, is_active, sort_order")
      .eq("is_active", true)
      .order("sort_order");

    if (data && data.length > 0) {
      return data;
    }
  } catch {
    // Fall back to constants
  }

  // Fallback
  return [
    { id: "hybrid", bike_type: "hybrid", name: "Hybrid Bike", price: BIKE_RENTAL_PRICES.hybrid, is_active: true },
    { id: "road", bike_type: "road", name: "Road Bike", price: BIKE_RENTAL_PRICES.road, is_active: true },
    { id: "own", bike_type: "own", name: "Bring Own Bike", price: 0, is_active: true },
  ];
}

/**
 * Build a { hybrid: 420, road: 720, own: 0 } style price map
 * from live DB data — used everywhere prices are looked up by bike type.
 */
export async function getLiveBikeRentalPrices(): Promise<Record<string, number>> {
  const rentals = await getLiveBikeRentals();
  const prices: Record<string, number> = { own: 0 };
  for (const r of rentals) {
    prices[r.bike_type] = r.price;
  }
  return prices;
}

export async function getLiveTimeSlots(): Promise<LiveTimeSlot[]> {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("time_slots_config")
      .select("id, label, label_th, start_time, end_time, period, overlaps, is_active, sort_order")
      .eq("is_active", true)
      .order("sort_order");

    if (data && data.length > 0) {
      return data.map((s) => ({
        id: s.id,
        label: s.label,
        label_th: s.label_th,
        startTime: s.start_time,
        endTime: s.end_time,
        period: s.period,
        overlaps: s.overlaps || [],
        is_active: s.is_active,
      }));
    }
  } catch {
    // Fall back to constants
  }

  return TIME_SLOTS.map((s) => ({
    id: s.id,
    label: s.label,
    startTime: s.startTime,
    endTime: s.endTime,
    period: s.period,
    overlaps: s.overlaps || [],
    is_active: true,
  }));
}

/**
 * Fetch ALL live config in one call — used by booking page.
 */
export async function getLiveConfig(): Promise<LiveConfig> {
  const [packages, bikeRentals, timeSlots] = await Promise.all([
    getLivePackages(),
    getLiveBikeRentals(),
    getLiveTimeSlots(),
  ]);

  const bikeRentalPrices: Record<string, number> = { own: 0 };
  for (const r of bikeRentals) {
    bikeRentalPrices[r.bike_type] = r.price;
  }

  return { packages, bikeRentals, bikeRentalPrices, timeSlots };
}
