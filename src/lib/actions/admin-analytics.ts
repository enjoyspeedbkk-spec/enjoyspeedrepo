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

export async function getRevenueStats(days: number = 30) {
  const { admin } = await requireAdmin();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data: payments } = await admin
    .from("payments")
    .select("amount, created_at, status")
    .in("status", ["paid", "verified"])
    .gte("created_at", startDate.toISOString())
    .order("created_at");

  // Group by day
  const dailyRevenue: Record<string, number> = {};
  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    dailyRevenue[d.toISOString().split("T")[0]] = 0;
  }

  payments?.forEach((p) => {
    const day = new Date(p.created_at).toISOString().split("T")[0];
    if (dailyRevenue[day] !== undefined) {
      dailyRevenue[day] += p.amount;
    }
  });

  const totalRevenue = payments?.reduce((sum, p) => sum + p.amount, 0) || 0;

  return { dailyRevenue, totalRevenue };
}

export async function getRiderMetrics() {
  const { admin } = await requireAdmin();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Total unique users with bookings
  const { data: allBookings } = await admin
    .from("bookings")
    .select("user_id, rider_count, created_at")
    .not("status", "in", '("cancelled","no_show")');

  const userBookingCounts: Record<string, number> = {};
  let thisMonthRiders = 0;

  allBookings?.forEach((b) => {
    userBookingCounts[b.user_id] = (userBookingCounts[b.user_id] || 0) + 1;
    if (new Date(b.created_at) >= thirtyDaysAgo) {
      thisMonthRiders += b.rider_count;
    }
  });

  const totalUsers = Object.keys(userBookingCounts).length;
  const repeatUsers = Object.values(userBookingCounts).filter((c) => c > 1).length;
  const newUsers = totalUsers - repeatUsers;

  return { totalUsers, newUsers, repeatUsers, thisMonthRiders };
}

export async function getSlotPopularity() {
  const { admin } = await requireAdmin();

  const { data: bookings } = await admin
    .from("bookings")
    .select("ride_session_id, rider_count, ride_sessions!inner(time_slot_id)")
    .not("status", "in", '("cancelled","no_show")');

  const slotCounts: Record<string, { bookings: number; riders: number }> = {};

  bookings?.forEach((b: any) => {
    const slotId = b.ride_sessions?.time_slot_id;
    if (slotId) {
      if (!slotCounts[slotId]) slotCounts[slotId] = { bookings: 0, riders: 0 };
      slotCounts[slotId].bookings += 1;
      slotCounts[slotId].riders += b.rider_count;
    }
  });

  return slotCounts;
}

export async function getPaymentMethodBreakdown() {
  const { admin } = await requireAdmin();

  const { data: payments } = await admin
    .from("payments")
    .select("amount, method, status")
    .in("status", ["paid", "verified"]);

  const breakdown: Record<string, { count: number; total: number }> = {};

  payments?.forEach((p) => {
    const method = p.method || "unknown";
    if (!breakdown[method]) {
      breakdown[method] = { count: 0, total: 0 };
    }
    breakdown[method].count += 1;
    breakdown[method].total += p.amount;
  });

  return breakdown;
}

export async function getTopCustomers(limit: number = 10) {
  const { admin } = await requireAdmin();

  const { data: bookings } = await admin
    .from("bookings")
    .select("user_id, contact_name, rider_count, ride_total")
    .not("status", "in", '("cancelled","no_show")');

  const customerMap: Record<string, { name: string; rides: number; totalSpent: number; riders: number }> = {};

  bookings?.forEach((b) => {
    if (!customerMap[b.user_id]) {
      customerMap[b.user_id] = { name: b.contact_name, rides: 0, totalSpent: 0, riders: 0 };
    }
    customerMap[b.user_id].rides += 1;
    customerMap[b.user_id].totalSpent += b.ride_total;
    customerMap[b.user_id].riders += b.rider_count;
  });

  return Object.entries(customerMap)
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.rides - a.rides)
    .slice(0, limit);
}
