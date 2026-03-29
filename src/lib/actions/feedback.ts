"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// ========================================
// Types
// ========================================

export interface Survey {
  id: string;
  booking_id: string;
  user_id: string;
  overall_rating: number;
  guide_rating: number;
  route_rating: number;
  equipment_rating: number;
  highlight: string | null;
  improvement: string | null;
  would_recommend: boolean;
  photo_consent: boolean;
  created_at: string;
}

export interface Review {
  id: string;
  booking_id: string;
  user_id: string;
  rating: number;
  enjoyed_ride: boolean;
  gained_skills: boolean;
  will_return: boolean;
  next_steps: string | null;
  comment: string | null;
  photo_consent: boolean;
  is_public: boolean;
  admin_response: string | null;
  created_at: string;
}

export interface Booking {
  id: string;
  contact_name: string;
  contact_email: string | null;
  contact_phone: string | null;
  ride_session_id: string;
  created_at: string;
}

export interface RideSession {
  id: string;
  date: string;
  time_slot_id: string;
}

export interface SurveyWithBooking extends Survey {
  bookings: Booking & { ride_sessions: RideSession };
}

export interface ReviewWithBooking extends Review {
  bookings: Booking & { ride_sessions: RideSession };
}

export interface FeedbackStats {
  totalSurveys: number;
  totalReviews: number;
  totalResponses: number;
  avgOverall: number;
  avgGuide: number;
  avgRoute: number;
  avgEquipment: number;
  avgRating: number;
  wouldRecommendPct: number;
  npsScore: number;
  engagedCount: number;
}

// ========================================
// Auth guard — ensures user is admin
// ========================================

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") throw new Error("Not authorized");

  return { userId: user.id, admin };
}

// ========================================
// Get all feedback data
// ========================================

export async function getAllFeedback(): Promise<{
  surveys: SurveyWithBooking[];
  reviews: ReviewWithBooking[];
  stats: FeedbackStats;
}> {
  const { admin } = await requireAdmin();

  // Fetch all surveys with booking details
  const { data: surveys } = await admin
    .from("ride_surveys")
    .select(
      `
      *,
      bookings(id, contact_name, contact_email, contact_phone, ride_session_id, created_at, ride_sessions(id, date, time_slot_id))
    `
    )
    .order("created_at", { ascending: false });

  // Fetch all reviews with booking details
  const { data: reviews } = await admin
    .from("reviews")
    .select(
      `
      *,
      bookings(id, contact_name, contact_email, contact_phone, ride_session_id, created_at, ride_sessions(id, date, time_slot_id))
    `
    )
    .order("created_at", { ascending: false });

  // Fetch stats
  const stats = await getFeedbackStats();

  return {
    surveys: (surveys || []) as SurveyWithBooking[],
    reviews: (reviews || []) as ReviewWithBooking[],
    stats,
  };
}

// ========================================
// Get feedback stats
// ========================================

export async function getFeedbackStats(): Promise<FeedbackStats> {
  const { admin } = await requireAdmin();

  // Get surveys
  const { data: surveys } = await admin
    .from("ride_surveys")
    .select("overall_rating, guide_rating, route_rating, equipment_rating, would_recommend");

  // Get reviews
  const { data: reviews } = await admin
    .from("reviews")
    .select("rating, enjoyed_ride, gained_skills, will_return");

  const totalSurveys = surveys?.length || 0;
  const totalReviews = reviews?.length || 0;
  const totalResponses = totalSurveys + totalReviews;

  // Calculate survey averages
  let avgOverall = 0;
  let avgGuide = 0;
  let avgRoute = 0;
  let avgEquipment = 0;
  if (totalSurveys > 0 && surveys) {
    avgOverall = surveys.reduce((sum, s) => sum + s.overall_rating, 0) / totalSurveys;
    avgGuide = surveys.reduce((sum, s) => sum + s.guide_rating, 0) / totalSurveys;
    avgRoute = surveys.reduce((sum, s) => sum + s.route_rating, 0) / totalSurveys;
    avgEquipment = surveys.reduce((sum, s) => sum + s.equipment_rating, 0) / totalSurveys;
  }

  // Calculate reviews average
  let avgReviewRating = 0;
  if (totalReviews > 0 && reviews) {
    avgReviewRating = reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews;
  }

  // Weighted average across all ratings
  const allRatings: number[] = [];
  if (surveys) {
    surveys.forEach((s) => {
      allRatings.push(s.overall_rating, s.guide_rating, s.route_rating, s.equipment_rating);
    });
  }
  if (reviews) {
    reviews.forEach((r) => {
      allRatings.push(r.rating);
    });
  }
  const avgRating = allRatings.length > 0 ? allRatings.reduce((a, b) => a + b) / allRatings.length : 0;

  // Would recommend percentage
  const recommendCount = surveys?.filter((s) => s.would_recommend).length || 0;
  const wouldRecommendPct = totalSurveys > 0 ? Math.round((recommendCount / totalSurveys) * 100) : 0;

  // NPS score (based on would_recommend and will_return)
  let npsScore = 0;
  if (totalResponses > 0) {
    const promoters = (recommendCount || 0) + (reviews?.filter((r) => r.will_return).length || 0);
    const passives = totalResponses * 0.25; // rough estimate
    const detractors = totalResponses - promoters - passives;
    npsScore = Math.round(((promoters - detractors) / totalResponses) * 100);
  }

  // Engaged count (positive feedback)
  let engagedCount = 0;
  if (surveys) {
    engagedCount += surveys.filter((s) => s.overall_rating >= 4).length;
  }
  if (reviews) {
    engagedCount += reviews.filter((r) => r.rating >= 4).length;
  }

  return {
    totalSurveys,
    totalReviews,
    totalResponses,
    avgOverall: parseFloat(avgOverall.toFixed(2)),
    avgGuide: parseFloat(avgGuide.toFixed(2)),
    avgRoute: parseFloat(avgRoute.toFixed(2)),
    avgEquipment: parseFloat(avgEquipment.toFixed(2)),
    avgRating: parseFloat(avgRating.toFixed(2)),
    wouldRecommendPct,
    npsScore,
    engagedCount,
  };
}

// ========================================
// Toggle review visibility
// ========================================

export async function toggleReviewVisibility(
  reviewId: string,
  isPublic: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const { admin } = await requireAdmin();

    const { error } = await admin
      .from("reviews")
      .update({ is_public: isPublic })
      .eq("id", reviewId);

    if (error) {
      console.error("Review update error:", error);
      return { success: false, error: "Could not update review visibility" };
    }

    return { success: true };
  } catch (err) {
    console.error("Toggle visibility error:", err);
    return { success: false, error: "Something went wrong" };
  }
}

// ========================================
// Submit admin response to review
// ========================================

export async function submitAdminResponse(
  reviewId: string,
  response: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { admin } = await requireAdmin();

    if (!response.trim()) {
      return { success: false, error: "Response cannot be empty" };
    }

    const { error } = await admin
      .from("reviews")
      .update({ admin_response: response.trim() })
      .eq("id", reviewId);

    if (error) {
      console.error("Admin response error:", error);
      return { success: false, error: "Could not save response" };
    }

    return { success: true };
  } catch (err) {
    console.error("Submit response error:", err);
    return { success: false, error: "Something went wrong" };
  }
}
