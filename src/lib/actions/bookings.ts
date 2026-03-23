"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export interface BookingWithDetails {
  id: string;
  ride_session_id: string;
  group_type: string;
  rider_count: number;
  price_per_person: number;
  ride_total: number;
  rental_total: number;
  total_price: number;
  status: string;
  contact_name: string;
  contact_phone: string | null;
  contact_email: string | null;
  special_requests: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  ride_date: string;
  time_slot_id: string;
  weather_status: string;
  weather_note: string | null;
  riders: RiderSummary[];
  payment: PaymentSummary | null;
}

export interface RiderSummary {
  id: string;
  name: string;
  nickname: string | null;
  bike_preference: string;
  bike_rental_price: number;
  clothing_size: string | null;
  cycling_experience: string;
  waiver_accepted: boolean;
}

export interface PaymentSummary {
  id: string;
  amount: number;
  status: string;
  method: string;
  slip_image_url: string | null;
  verified_at: string | null;
  is_rain_credit: boolean;
  rain_credit_expires_at: string | null;
}

export async function getUserBookings(): Promise<{
  upcoming: BookingWithDetails[];
  completed: BookingWithDetails[];
  cancelled: BookingWithDetails[];
}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { upcoming: [], completed: [], cancelled: [] };
  }

  const admin = createAdminClient();

  // Fetch all bookings for this user with joined data
  const { data: bookings, error } = await admin
    .from("bookings")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error || !bookings) {
    console.error("Error fetching bookings:", error);
    return { upcoming: [], completed: [], cancelled: [] };
  }

  // Get ride sessions for all bookings
  const sessionIds = [...new Set(bookings.map((b) => b.ride_session_id))];
  const { data: sessions } = await admin
    .from("ride_sessions")
    .select("*")
    .in("id", sessionIds);

  const sessionMap = new Map(sessions?.map((s) => [s.id, s]) || []);

  // Get riders for all bookings
  const bookingIds = bookings.map((b) => b.id);
  const { data: allRiders } = await admin
    .from("riders")
    .select("*")
    .in("booking_id", bookingIds);

  const ridersMap = new Map<string, RiderSummary[]>();
  allRiders?.forEach((r) => {
    if (!ridersMap.has(r.booking_id)) {
      ridersMap.set(r.booking_id, []);
    }
    ridersMap.get(r.booking_id)!.push({
      id: r.id,
      name: r.name,
      nickname: r.nickname,
      bike_preference: r.bike_preference,
      bike_rental_price: r.bike_rental_price,
      clothing_size: r.clothing_size,
      cycling_experience: r.cycling_experience,
      waiver_accepted: r.waiver_accepted,
    });
  });

  // Get payments for all bookings
  const { data: allPayments } = await admin
    .from("payments")
    .select("*")
    .in("booking_id", bookingIds)
    .order("created_at", { ascending: false });

  const paymentMap = new Map<string, PaymentSummary>();
  allPayments?.forEach((p) => {
    // Keep only the latest payment per booking
    if (!paymentMap.has(p.booking_id)) {
      paymentMap.set(p.booking_id, {
        id: p.id,
        amount: p.amount,
        status: p.status,
        method: p.method,
        slip_image_url: p.slip_image_url,
        verified_at: p.verified_at,
        is_rain_credit: p.is_rain_credit,
        rain_credit_expires_at: p.rain_credit_expires_at,
      });
    }
  });

  // Assemble full booking objects
  const fullBookings: BookingWithDetails[] = bookings.map((b) => {
    const session = sessionMap.get(b.ride_session_id);
    return {
      ...b,
      ride_date: session?.date || "",
      time_slot_id: session?.time_slot_id || "",
      weather_status: session?.weather_status || "clear",
      weather_note: session?.weather_note || null,
      riders: ridersMap.get(b.id) || [],
      payment: paymentMap.get(b.id) || null,
    };
  });

  const today = new Date().toISOString().split("T")[0];

  const upcoming = fullBookings.filter(
    (b) =>
      b.ride_date >= today &&
      !["cancelled", "no_show", "completed"].includes(b.status)
  );

  const completed = fullBookings.filter((b) => b.status === "completed");

  const cancelled = fullBookings.filter(
    (b) => b.status === "cancelled" || b.status === "no_show"
  );

  return { upcoming, completed, cancelled };
}

export async function getBookingById(
  bookingId: string
): Promise<BookingWithDetails | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const admin = createAdminClient();

  const { data: booking } = await admin
    .from("bookings")
    .select("*")
    .eq("id", bookingId)
    .eq("user_id", user.id)
    .single();

  if (!booking) return null;

  const { data: session } = await admin
    .from("ride_sessions")
    .select("*")
    .eq("id", booking.ride_session_id)
    .single();

  const { data: riders } = await admin
    .from("riders")
    .select("*")
    .eq("booking_id", booking.id);

  const { data: payments } = await admin
    .from("payments")
    .select("*")
    .eq("booking_id", booking.id)
    .order("created_at", { ascending: false })
    .limit(1);

  const payment = payments?.[0] || null;

  return {
    ...booking,
    ride_date: session?.date || "",
    time_slot_id: session?.time_slot_id || "",
    weather_status: session?.weather_status || "clear",
    weather_note: session?.weather_note || null,
    riders: (riders || []).map((r) => ({
      id: r.id,
      name: r.name,
      nickname: r.nickname,
      bike_preference: r.bike_preference,
      bike_rental_price: r.bike_rental_price,
      clothing_size: r.clothing_size,
      cycling_experience: r.cycling_experience,
      waiver_accepted: r.waiver_accepted,
    })),
    payment: payment
      ? {
          id: payment.id,
          amount: payment.amount,
          status: payment.status,
          method: payment.method,
          slip_image_url: payment.slip_image_url,
          verified_at: payment.verified_at,
          is_rain_credit: payment.is_rain_credit,
          rain_credit_expires_at: payment.rain_credit_expires_at,
        }
      : null,
  };
}

export async function cancelBooking(bookingId: string): Promise<{
  success: boolean;
  error?: string;
  refundInfo?: string;
}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const admin = createAdminClient();

  // Fetch booking + session
  const { data: booking } = await admin
    .from("bookings")
    .select("*, ride_sessions!inner(date)")
    .eq("id", bookingId)
    .eq("user_id", user.id)
    .single();

  if (!booking) {
    return { success: false, error: "Booking not found" };
  }

  if (["cancelled", "completed", "no_show"].includes(booking.status)) {
    return { success: false, error: "This booking cannot be cancelled" };
  }

  // Calculate refund based on rain policy timing
  const rideDate = new Date(booking.ride_sessions.date);
  const now = new Date();
  const hoursUntilRide =
    (rideDate.getTime() - now.getTime()) / (1000 * 60 * 60);

  let refundInfo: string;
  if (hoursUntilRide > 48) {
    refundInfo = "Full refund will be processed within 3 business days.";
  } else if (hoursUntilRide > 24) {
    refundInfo =
      "50% cancellation fee applies per our policy. Remaining 50% refunded within 3 business days.";
  } else {
    refundInfo =
      "Cancellation within 24 hours of ride — no refund per our policy. You may receive a rain credit if weather-related.";
  }

  // Update booking status
  const { error } = await admin
    .from("bookings")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
      cancellation_reason: "User-initiated cancellation",
    })
    .eq("id", bookingId);

  if (error) {
    return { success: false, error: "Could not cancel booking" };
  }

  return { success: true, refundInfo };
}

export async function submitReview(
  bookingId: string,
  review: {
    rating: number;
    enjoyedRide: boolean;
    gainedSkills: boolean;
    willReturn: boolean;
    nextSteps: string;
    comment: string;
  }
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const admin = createAdminClient();

  // Verify this booking belongs to the user
  const { data: booking } = await admin
    .from("bookings")
    .select("id, status")
    .eq("id", bookingId)
    .eq("user_id", user.id)
    .single();

  if (!booking) {
    return { success: false, error: "Booking not found" };
  }

  // Store review — we'll add a reviews table
  const { error } = await admin.from("reviews").insert({
    booking_id: bookingId,
    user_id: user.id,
    rating: review.rating,
    enjoyed_ride: review.enjoyedRide,
    gained_skills: review.gainedSkills,
    will_return: review.willReturn,
    next_steps: review.nextSteps,
    comment: review.comment,
  });

  if (error) {
    console.error("Review submission error:", error);
    return { success: false, error: "Could not submit review" };
  }

  return { success: true };
}
