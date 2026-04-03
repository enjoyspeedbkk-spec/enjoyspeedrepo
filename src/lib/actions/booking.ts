"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { BIKE_RENTAL_PRICES as FALLBACK_BIKE_PRICES, RIDE_PACKAGES as FALLBACK_PACKAGES, TIME_SLOTS } from "@/lib/constants";
import { getLivePackages, getLiveBikeRentalPrices } from "@/lib/actions/config";
import { notifyBookingConfirmation } from "@/lib/notifications";
import { getTranslation } from "@/lib/i18n";
import type { RiderInfo, GroupType, TimeSlotId } from "@/types";

export interface CreateBookingInput {
  date: string;
  timeSlotId: TimeSlotId;
  groupType: GroupType;
  riderCount: number;
  riders: RiderInfo[];
  contactName: string;
  contactPhone?: string;
  contactEmail: string;
  contactLineId?: string;
  specialRequests?: string;
  waiverAccepted: boolean;
  userId?: string; // For email-verified guest bookings
  locale?: "en" | "th"; // Language at time of booking — used for notifications
}

export interface BookingResult {
  success: boolean;
  bookingId?: string;
  paymentAmount?: number;
  error?: string;
}

export async function createBooking(
  input: CreateBookingInput
): Promise<BookingResult> {
  try {
    const supabase = await createClient();

    // 1. Get the user — either from session or from email verification
    let resolvedUserId: string;

    if (input.userId) {
      // Email-verified guest booking — verify the userId exists
      const admin = createAdminClient();
      const { data: verifiedProfile } = await admin
        .from("profiles")
        .select("id")
        .eq("id", input.userId)
        .single();

      if (!verifiedProfile) {
        // Profile may not exist yet if there was a race condition with email-auth.
        // Try to create it now rather than hard-failing.
        const { error: upsertErr } = await admin.from("profiles").upsert({
          id: input.userId,
          full_name: input.contactName || "Guest",
          email_verified: true,
          email_verified_at: new Date().toISOString(),
        });
        if (upsertErr) {
          console.error("Profile upsert fallback failed:", upsertErr);
          return { success: false, error: "Invalid user verification. Please try again." };
        }
      }
      resolvedUserId = input.userId;
    } else {
      // Traditional auth — check session
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        return {
          success: false,
          error: "Please verify your email to continue.",
        };
      }
      resolvedUserId = user.id;
    }

    // 2. Validate the package — fetch LIVE prices from DB
    const [livePackages, liveBikePrices] = await Promise.all([
      getLivePackages(),
      getLiveBikeRentalPrices(),
    ]);
    const pkg = livePackages.find((p) => p.type === input.groupType);
    if (!pkg) {
      return { success: false, error: "Invalid ride package." };
    }

    if (
      input.riderCount < pkg.minRiders ||
      input.riderCount > pkg.maxRiders
    ) {
      return {
        success: false,
        error: `${pkg.name} requires ${pkg.minRiders}-${pkg.maxRiders} riders.`,
      };
    }

    if (!input.waiverAccepted) {
      return {
        success: false,
        error: "Waiver must be accepted to proceed.",
      };
    }

    // 3. Calculate pricing — from live DB values
    const pricePerPerson = pkg.pricePerPerson;
    const rideTotal = pricePerPerson * input.riderCount;
    const rentalTotal = input.riders
      .slice(0, input.riderCount)
      .reduce((sum, r) => sum + (r.bikePreference ? (liveBikePrices[r.bikePreference] ?? 0) : 0), 0);
    const totalPrice = rideTotal + rentalTotal;

    // Amount to pay now (ride cost only — rental paid at track)
    const paymentAmount = rideTotal;

    // 4. Use admin client for the insert to bypass RLS during creation
    const admin = createAdminClient();

    // 5. Find or create the ride session for this date + slot
    const { data: existingSession } = await admin
      .from("ride_sessions")
      .select("id, is_available, is_blackout, weather_status")
      .eq("date", input.date)
      .eq("time_slot_id", input.timeSlotId)
      .single();

    let rideSessionId: string;

    if (existingSession) {
      // Check availability
      if (!existingSession.is_available) {
        return {
          success: false,
          error: "This time slot is no longer available.",
        };
      }
      if (existingSession.is_blackout) {
        return {
          success: false,
          error: "This date has been blacked out by the operator.",
        };
      }
      if (existingSession.weather_status === "cancelled") {
        return {
          success: false,
          error:
            "This session has been cancelled due to weather. Please choose another date.",
        };
      }
      rideSessionId = existingSession.id;
    } else {
      // Auto-create session (admin will manage availability later)
      const { data: newSession, error: sessionError } = await admin
        .from("ride_sessions")
        .insert({
          date: input.date,
          time_slot_id: input.timeSlotId,
          max_groups: 1,
          is_available: true,
        })
        .select("id")
        .single();

      if (sessionError || !newSession) {
        console.error("Session creation error:", sessionError);
        const detail = sessionError?.message || sessionError?.code || "unknown";
        return {
          success: false,
          error: `Could not create ride session (${detail}). Please try again.`,
        };
      }
      rideSessionId = newSession.id;
    }

    // 6. Check for overlapping bookings on same date
    // Evening: B, C, D are mutually exclusive
    // Morning: A1, A2 are mutually exclusive
    const overlappingSlots: Record<string, string[]> = {
      A1: ["A2"],
      A2: ["A1"],
      B: ["C", "D"],
      C: ["B", "D"],
      D: ["B", "C"],
    };

    const conflictSlots = overlappingSlots[input.timeSlotId] || [];
    if (conflictSlots.length > 0) {
      const { data: conflicting } = await admin
        .from("ride_sessions")
        .select("id, time_slot_id")
        .eq("date", input.date)
        .in("time_slot_id", conflictSlots);

      if (conflicting && conflicting.length > 0) {
        // Check if any of those sessions have active bookings
        for (const sess of conflicting) {
          const { data: activeBookings } = await admin
            .from("bookings")
            .select("id")
            .eq("ride_session_id", sess.id)
            .not("status", "in", '("cancelled","no_show")')
            .limit(1);

          if (activeBookings && activeBookings.length > 0) {
            return {
              success: false,
              error: `This time slot conflicts with an existing booking in slot ${sess.time_slot_id}. Evening slots (B, C, D) and morning slots (A1, A2) cannot overlap.`,
            };
          }
        }
      }
    }

    // 8. Create the booking
    // Build the insert payload — locale column may not exist if migration 012
    // hasn't been applied yet, so we try with it first and fall back without.
    const bookingPayload: Record<string, unknown> = {
      user_id: resolvedUserId,
      ride_session_id: rideSessionId,
      group_type: input.groupType,
      rider_count: input.riderCount,
      price_per_person: pricePerPerson,
      ride_total: rideTotal,
      rental_total: rentalTotal,
      total_price: totalPrice,
      status: "pending",
      contact_name: input.contactName,
      contact_phone: input.contactPhone || null,
      contact_email: input.contactEmail || null,
      contact_line_id: input.contactLineId || null,
      special_requests: input.specialRequests || null,
      locale: input.locale || "en",
    };

    let { data: booking, error: bookingError } = await admin
      .from("bookings")
      .insert(bookingPayload)
      .select("id")
      .single();

    // If insert failed — likely because 'locale' column doesn't exist yet
    // (migration 012 not applied). PostgREST returns "Could not find the
    // 'locale' column" or error code 42703. Retry without locale.
    if (bookingError) {
      console.warn("Booking insert failed — retrying without locale column:", bookingError.message, bookingError.code);
      delete bookingPayload.locale;
      const retry = await admin
        .from("bookings")
        .insert(bookingPayload)
        .select("id")
        .single();
      booking = retry.data;
      bookingError = retry.error;
    }

    if (bookingError || !booking) {
      console.error("Booking creation error:", bookingError);
      // Surface the real DB error for debugging (will be removed once stable)
      const detail = bookingError?.message || bookingError?.code || "unknown";
      return {
        success: false,
        error: `Could not create booking (${detail}). Please try again.`,
      };
    }

    // 9. Create rider records
    const riderInserts = input.riders.slice(0, input.riderCount).map((r) => ({
      booking_id: booking.id,
      name: r.name,
      nickname: r.nickname || null,
      height_cm: r.heightCm || null,
      bike_preference: r.bikePreference,
      bike_rental_price: r.bikePreference ? (liveBikePrices[r.bikePreference] ?? 0) : 0,
      clothing_size: r.clothingSize || null,
      cycling_experience: r.cyclingExperience,
      emergency_contact_name: r.emergencyContactName || null,
      emergency_contact_phone: r.emergencyContactPhone || null,
      waiver_accepted: input.waiverAccepted,
      waiver_accepted_at: input.waiverAccepted ? new Date().toISOString() : null,
    }));

    const { error: ridersError } = await admin
      .from("riders")
      .insert(riderInserts);

    if (ridersError) {
      console.error("Riders creation error:", ridersError);
      // Booking exists but riders failed — mark for admin review
    }

    // 10. Create pending payment record
    const { error: paymentError } = await admin.from("payments").insert({
      booking_id: booking.id,
      amount: paymentAmount,
      currency: "THB",
      method: "promptpay",
      status: "pending",
    });

    if (paymentError) {
      console.error("Payment creation error:", paymentError);
    }

    // 11. Send booking confirmation notification (LINE → Email cascade)
    const slot = TIME_SLOTS.find((s) => s.id === input.timeSlotId);
    // Use translated slot label for notifications
    const notifyLocale = input.locale ?? "en";
    const slotLabel = slot
      ? (slot.labelKey ? getTranslation(notifyLocale, slot.labelKey) : slot.label)
      : input.timeSlotId;
    try {
      await notifyBookingConfirmation(resolvedUserId, {
        bookingId: booking.id,
        contactName: input.contactName,
        contactEmail: input.contactEmail,
        date: input.date,
        timeSlot: slotLabel,
        timeRange: slot ? `${slot.startTime} – ${slot.endTime}` : "",
        groupType: pkg.name,
        riderCount: input.riderCount,
        rideTotal,
        rentalTotal,
        totalPrice,
        locale: input.locale,
      });
    } catch (notifyErr) {
      // Notification failure should never block the booking
      console.error("Booking notification error:", notifyErr);
    }

    return {
      success: true,
      bookingId: booking.id,
      paymentAmount,
    };
  } catch (err) {
    console.error("Unexpected booking error:", err);
    const msg = err instanceof Error ? err.message : "unknown";
    return {
      success: false,
      error: `Something went wrong (${msg}). Please try again.`,
    };
  }
}

// Fetch available dates/slots for the booking calendar
export async function getAvailableSlots(startDate: string, endDate: string) {
  const admin = createAdminClient();

  // Get all ride sessions in the date range
  const { data: sessions } = await admin
    .from("ride_sessions")
    .select("*")
    .gte("date", startDate)
    .lte("date", endDate)
    .eq("is_available", true)
    .eq("is_blackout", false);

  // Get bookings for those sessions to check capacity
  const sessionIds = sessions?.map((s) => s.id) || [];
  const { data: bookings } = await admin
    .from("bookings")
    .select("ride_session_id, status")
    .in("ride_session_id", sessionIds)
    .not("status", "in", '("cancelled","no_show")');

  // Build availability map
  const bookedSessionIds = new Set(bookings?.map((b) => b.ride_session_id) || []);

  return {
    sessions: sessions?.map((s) => ({
      ...s,
      hasBooking: bookedSessionIds.has(s.id),
    })) || [],
  };
}

export async function expireStalePendingBookings(): Promise<{ expired: number }> {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("expire_stale_bookings");

  if (error) {
    console.error("Expire stale bookings error:", error);
    return { expired: 0 };
  }

  return { expired: data as number };
}
