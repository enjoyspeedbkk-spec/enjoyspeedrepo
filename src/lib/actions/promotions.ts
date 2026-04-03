"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ActivePromotion } from "@/lib/promotions-utils";

// Re-export types and utils from shared file (safe for client import)
export type { ActivePromotion } from "@/lib/promotions-utils";

// ========================================
// EN-JOY SPEED — Promotions Actions
// Time-based, auto-applied promotions
// ========================================

export interface Promotion {
  id: string;
  name: string;
  name_th: string | null;
  description: string | null;
  description_th: string | null;
  badge_label: string;
  badge_color: string;
  discount_type: "percentage" | "fixed_per_person";
  discount_value: number;
  starts_on: string; // ISO date string YYYY-MM-DD
  ends_on: string;
  applicable_packages: string[] | null;
  min_riders: number | null;
  max_uses: number | null;
  current_uses: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ---- Public actions (no auth required) ----

/**
 * Get all active promotions that overlap with a date range.
 * Used by the booking calendar to mark promoted dates.
 */
export async function getActivePromotions(
  fromDate: string,
  toDate: string
): Promise<ActivePromotion[]> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("promotions")
    .select(
      "id, name, name_th, description, description_th, badge_label, badge_color, discount_type, discount_value, starts_on, ends_on, applicable_packages, min_riders, max_uses, current_uses"
    )
    .eq("is_active", true)
    .lte("starts_on", toDate)
    .gte("ends_on", fromDate)
    .order("starts_on", { ascending: true });

  if (error) {
    console.error("Failed to fetch active promotions:", error);
    return [];
  }

  // Filter out maxed-out promotions
  return (data || [])
    .filter((p) => !p.max_uses || p.current_uses < p.max_uses)
    .map(({ max_uses, current_uses, ...rest }) => rest);
}

/**
 * Get the best promotion for a specific date, package, and rider count.
 * Returns the promotion that gives the highest discount.
 */
export async function getBestPromotion(
  date: string,
  packageType: string,
  riderCount: number,
  pricePerPerson: number
): Promise<ActivePromotion | null> {
  const promos = await getActivePromotions(date, date);

  const applicable = promos.filter((p) => {
    if (p.applicable_packages && !p.applicable_packages.includes(packageType)) return false;
    if (p.min_riders && riderCount < p.min_riders) return false;
    return true;
  });

  if (applicable.length === 0) return null;

  // Pick the one with the highest effective discount
  return applicable.reduce((best, p) => {
    const bestDiscount =
      best.discount_type === "percentage"
        ? pricePerPerson * (best.discount_value / 100)
        : best.discount_value;
    const pDiscount =
      p.discount_type === "percentage"
        ? pricePerPerson * (p.discount_value / 100)
        : p.discount_value;
    return pDiscount > bestDiscount ? p : best;
  });
}

// ---- Admin actions (auth required) ----

/** Get all promotions (including inactive) for the admin panel */
export async function getAllPromotions(): Promise<Promotion[]> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("promotions")
    .select("*")
    .order("starts_on", { ascending: false });

  if (error) {
    console.error("Failed to fetch promotions:", error);
    return [];
  }

  return data || [];
}

/** Create a new promotion */
export async function createPromotion(
  promo: Omit<Promotion, "id" | "current_uses" | "created_at" | "updated_at">
): Promise<{ success: boolean; error?: string; id?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const admin = createAdminClient();

  const { data, error } = await admin
    .from("promotions")
    .insert({
      ...promo,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Failed to create promotion:", error);
    return { success: false, error: error.message };
  }

  return { success: true, id: data.id };
}

/** Update an existing promotion */
export async function updatePromotion(
  id: string,
  updates: Partial<Omit<Promotion, "id" | "created_at" | "updated_at">>
): Promise<{ success: boolean; error?: string }> {
  const admin = createAdminClient();

  const { error } = await admin
    .from("promotions")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    console.error("Failed to update promotion:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/** Delete a promotion */
export async function deletePromotion(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const admin = createAdminClient();

  const { error } = await admin.from("promotions").delete().eq("id", id);

  if (error) {
    console.error("Failed to delete promotion:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/** Increment usage count when a promotion is applied to a booking */
export async function incrementPromotionUsage(
  promotionId: string
): Promise<void> {
  const admin = createAdminClient();

  await admin.rpc("increment_promotion_usage", { promo_id: promotionId }).then(
    () => {},
    (err) => {
      // Fallback: manual increment if RPC doesn't exist yet
      admin
        .from("promotions")
        .update({ current_uses: admin.rpc("", {}) as unknown as number })
        .eq("id", promotionId);
      console.warn("RPC increment_promotion_usage not found, using fallback");
    }
  );

  // Simple fallback — just increment directly
  const { data } = await admin
    .from("promotions")
    .select("current_uses")
    .eq("id", promotionId)
    .single();

  if (data) {
    await admin
      .from("promotions")
      .update({ current_uses: (data.current_uses || 0) + 1 })
      .eq("id", promotionId);
  }
}
