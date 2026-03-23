"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") throw new Error("Not authorized");
  return { userId: user.id, admin };
}

export interface CustomerWithStats {
  id: string;
  full_name: string | null;
  phone: string | null;
  line_id: string | null;
  role: string;
  created_at: string;
  total_rides?: number;
  total_spent?: number;
  last_ride_date?: string;
  customer_tier?: string;
  stats: {
    bookings: number;
    riders: number;
    spent: number;
    lastEmail: string;
    lastPhone: string;
    name: string;
  };
}

export async function getCustomerDirectory(): Promise<CustomerWithStats[]> {
  const { admin } = await requireAdmin();

  // Get all profiles with booking stats
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, full_name, phone, line_id, role, created_at, total_rides, total_spent, last_ride_date, customer_tier")
    .order("created_at", { ascending: false })
    .limit(500);

  // Get booking counts per user
  const { data: bookings } = await admin
    .from("bookings")
    .select("user_id, rider_count, ride_total, status, contact_email, contact_phone, contact_name");

  // Merge stats
  const userStats: Record<string, { bookings: number; riders: number; spent: number; lastEmail: string; lastPhone: string; name: string }> = {};
  bookings?.forEach((b) => {
    if (!userStats[b.user_id]) {
      userStats[b.user_id] = { bookings: 0, riders: 0, spent: 0, lastEmail: "", lastPhone: "", name: "" };
    }
    if (b.status !== "cancelled" && b.status !== "no_show") {
      userStats[b.user_id].bookings += 1;
      userStats[b.user_id].riders += b.rider_count || 0;
      userStats[b.user_id].spent += b.ride_total || 0;
    }
    if (b.contact_email) userStats[b.user_id].lastEmail = b.contact_email;
    if (b.contact_phone) userStats[b.user_id].lastPhone = b.contact_phone;
    if (b.contact_name) userStats[b.user_id].name = b.contact_name;
  });

  return (profiles || []).map((p) => ({
    ...p,
    stats: userStats[p.id] || { bookings: 0, riders: 0, spent: 0, lastEmail: "", lastPhone: "", name: "" },
  }));
}

export async function addCustomerNote(
  profileId: string,
  content: string,
  noteType: string = "general"
): Promise<{ success: boolean; error?: string }> {
  try {
    const { userId, admin } = await requireAdmin();
    const { error } = await admin.from("rider_notes").insert({
      profile_id: profileId,
      admin_id: userId,
      content,
      note_type: noteType,
    });
    return { success: !error, error: error?.message };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function getCustomerNotes(profileId: string) {
  const { admin } = await requireAdmin();
  const { data } = await admin
    .from("rider_notes")
    .select("*")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false })
    .limit(50);
  return data || [];
}

export async function updateCustomerTier(
  profileId: string,
  tier: "vip" | "regular" | "new" | "lapsed"
): Promise<{ success: boolean; error?: string }> {
  try {
    const { admin } = await requireAdmin();
    const { error } = await admin
      .from("profiles")
      .update({ customer_tier: tier })
      .eq("id", profileId);
    return { success: !error, error: error?.message };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}
