"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export interface SurveyInput {
  bookingId: string;
  userId?: string;
  overallRating: number;
  guideRating: number;
  routeRating: number;
  equipmentRating: number;
  highlight: string;
  improvement: string;
  wouldRecommend: boolean;
  photoConsent: boolean;
}

export async function submitSurvey(
  input: SurveyInput
): Promise<{ success: boolean; error?: string }> {
  try {
    const admin = createAdminClient();

    // Verify booking exists and is completed
    const { data: booking } = await admin
      .from("bookings")
      .select("id, status, user_id")
      .eq("id", input.bookingId)
      .single();

    if (!booking) {
      return { success: false, error: "Booking not found." };
    }

    // Check if survey already submitted
    const { data: existing } = await admin
      .from("ride_surveys")
      .select("id")
      .eq("booking_id", input.bookingId)
      .single();

    if (existing) {
      return { success: false, error: "You've already submitted feedback for this ride. Thank you!" };
    }

    const { error } = await admin.from("ride_surveys").insert({
      booking_id: input.bookingId,
      user_id: input.userId || booking.user_id,
      overall_rating: input.overallRating,
      guide_rating: input.guideRating,
      route_rating: input.routeRating,
      equipment_rating: input.equipmentRating,
      highlight: input.highlight || null,
      improvement: input.improvement || null,
      would_recommend: input.wouldRecommend,
      photo_consent: input.photoConsent,
    });

    if (error) {
      console.error("Survey insert error:", error);
      return { success: false, error: "Could not save your feedback. Please try again." };
    }

    return { success: true };
  } catch (err) {
    console.error("Survey error:", err);
    return { success: false, error: "Something went wrong." };
  }
}

// Admin: get all surveys with booking context
export async function getAllSurveys() {
  const admin = createAdminClient();
  const { data } = await admin
    .from("ride_surveys")
    .select(`
      *,
      bookings(contact_name, group_type, rider_count, ride_sessions(date, time_slot_id))
    `)
    .order("submitted_at", { ascending: false })
    .limit(50);

  return data || [];
}
