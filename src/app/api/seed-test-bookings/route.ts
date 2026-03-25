import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

// TEMPORARY: Seed 10 fake bookings for testing. Remove after use.
// Hit GET /api/seed-test-bookings?secret=enjoy-speed-seed-2026 to run.

function addDays(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const PRICING: Record<string, { pricePerPerson: number }> = {
  duo: { pricePerPerson: 2500 },
  squad: { pricePerPerson: 2100 },
  peloton: { pricePerPerson: 2000 },
};
const BIKE_PRICES: Record<string, number> = { hybrid: 420, road: 720, own: 0 };
const NAMES = [
  "Somchai K.", "Lisa C.", "Marco R.", "Yuki T.", "Anna S.",
  "James M.", "Nina L.", "Kai W.", "Sofia P.", "Tom B.",
  "Pim N.", "Oliver H.", "Mia D.", "Leo F.", "Sakura A.",
];
const SIZES = ["S", "M", "L", "XL"] as const;
const EXPERIENCES = ["beginner", "intermediate", "experienced"] as const;
const BIKES = ["hybrid", "road", "own"] as const;

const BOOKING_CONFIGS = [
  { dayOffset: 1, slot: "C", group: "duo", status: "confirmed" },
  { dayOffset: 2, slot: "A1", group: "squad", status: "pending" },
  { dayOffset: 3, slot: "D", group: "peloton", status: "rider_details" },
  { dayOffset: 4, slot: "B", group: "duo", status: "ready" },
  { dayOffset: 5, slot: "C", group: "squad", status: "confirmed" },
  { dayOffset: 7, slot: "A2", group: "duo", status: "pending" },
  { dayOffset: 8, slot: "D", group: "squad", status: "confirmed" },
  { dayOffset: 10, slot: "B", group: "peloton", status: "rider_details" },
  { dayOffset: 12, slot: "C", group: "duo", status: "cancelled" },
  { dayOffset: 14, slot: "A1", group: "squad", status: "ready" },
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  if (searchParams.get("secret") !== "enjoy-speed-seed-2026") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const results: string[] = [];

  // Get or create test users
  let { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .limit(5);

  if (!profiles || profiles.length === 0) {
    // Create 3 test users
    const testEmails = [
      { name: "Somchai Tanaka", email: "somchai.test@enjoyspeed.test" },
      { name: "Lisa Chen", email: "lisa.test@enjoyspeed.test" },
      { name: "Marco Rossi", email: "marco.test@enjoyspeed.test" },
    ];
    profiles = [];
    for (const u of testEmails) {
      const { data, error } = await supabase.auth.admin.createUser({
        email: u.email,
        password: "TestPass123!",
        email_confirm: true,
        user_metadata: { full_name: u.name },
      });
      if (error) {
        results.push(`Failed to create user ${u.email}: ${error.message}`);
        continue;
      }
      await supabase.from("profiles").upsert({
        id: data.user.id,
        full_name: u.name,
        email: u.email,
      });
      profiles.push({ id: data.user.id, full_name: u.name, email: u.email });
    }
  }

  if (profiles.length === 0) {
    return NextResponse.json({ error: "No users available", results }, { status: 500 });
  }

  let created = 0;
  for (let i = 0; i < BOOKING_CONFIGS.length; i++) {
    const cfg = BOOKING_CONFIGS[i];
    const date = addDays(cfg.dayOffset);
    const user = profiles[i % profiles.length];
    const pricing = PRICING[cfg.group];

    let riderCount: number;
    if (cfg.group === "duo") riderCount = 2;
    else if (cfg.group === "squad") riderCount = randomInt(3, 5);
    else riderCount = randomInt(6, 8);

    // Ensure ride session
    let sessionId: string;
    const { data: existing } = await supabase
      .from("ride_sessions")
      .select("id")
      .eq("date", date)
      .eq("time_slot_id", cfg.slot)
      .single();

    if (existing) {
      sessionId = existing.id;
    } else {
      const { data: newSession, error } = await supabase
        .from("ride_sessions")
        .insert({ date, time_slot_id: cfg.slot, max_groups: 3, is_available: true, weather_status: "clear" })
        .select("id")
        .single();
      if (error || !newSession) {
        results.push(`#${i + 1} Failed session ${date} ${cfg.slot}: ${error?.message}`);
        continue;
      }
      sessionId = newSession.id;
    }

    // Build riders
    const riders = [];
    let rentalTotal = 0;
    for (let r = 0; r < riderCount; r++) {
      const bike = randomFrom([...BIKES]);
      const rentalPrice = BIKE_PRICES[bike];
      rentalTotal += rentalPrice;
      riders.push({
        name: randomFrom(NAMES),
        nickname: r === 0 ? (user.full_name || "").split(" ")[0] : null,
        height_cm: randomInt(155, 190),
        weight_kg: randomInt(50, 95),
        bike_preference: bike,
        bike_rental_price: rentalPrice,
        clothing_size: randomFrom([...SIZES]),
        cycling_experience: randomFrom([...EXPERIENCES]),
        waiver_accepted: cfg.status !== "pending",
        waiver_accepted_at: cfg.status !== "pending" ? new Date().toISOString() : null,
      });
    }

    const rideTotal = pricing.pricePerPerson * riderCount;
    const totalPrice = rideTotal + rentalTotal;

    const { data: booking, error: bookingErr } = await supabase
      .from("bookings")
      .insert({
        user_id: user.id,
        ride_session_id: sessionId,
        group_type: cfg.group,
        rider_count: riderCount,
        price_per_person: pricing.pricePerPerson,
        ride_total: rideTotal,
        rental_total: rentalTotal,
        total_price: totalPrice,
        currency: "THB",
        status: cfg.status,
        contact_name: user.full_name || "Test User",
        contact_email: user.email,
        contact_phone: "+66" + randomInt(800000000, 999999999),
        special_requests: i === 0 ? "First time cycling, please go easy!" : null,
        cancelled_at: cfg.status === "cancelled" ? new Date().toISOString() : null,
        cancellation_reason: cfg.status === "cancelled" ? "Weather concerns" : null,
      })
      .select("id")
      .single();

    if (bookingErr || !booking) {
      results.push(`#${i + 1} Failed booking: ${bookingErr?.message}`);
      continue;
    }

    const ridersWithBookingId = riders.map((r) => ({ ...r, booking_id: booking.id }));
    const { error: ridersErr } = await supabase.from("riders").insert(ridersWithBookingId);
    if (ridersErr) {
      results.push(`#${i + 1} Riders error: ${ridersErr.message}`);
    }

    const slotLabels: Record<string, string> = {
      A1: "Early Bird", A2: "Energy Booster", B: "Light Chaser", C: "Golden Hour", D: "Twilight Finish",
    };
    results.push(`#${i + 1} ${date} ${slotLabels[cfg.slot]} (${cfg.slot}) ${cfg.group} x${riderCount} THB ${totalPrice} [${cfg.status}]`);
    created++;
  }

  return NextResponse.json({
    message: `Created ${created}/10 fake bookings`,
    results,
  });
}
