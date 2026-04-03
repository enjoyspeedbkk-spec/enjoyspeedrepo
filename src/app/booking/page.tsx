import { createClient } from "@/lib/supabase/server";
import { BookingFlow } from "@/components/booking/BookingFlow";
import { getPendingBookings } from "@/lib/actions/bookings";
import { getLiveConfig } from "@/lib/actions/config";

export const metadata = {
  title: "Book a Ride | En-Joy Speed",
  description:
    "Book your premium guided cycling session on Bangkok's Skylane.",
};

// Ensure this page is never statically cached — always fetches fresh config
export const dynamic = "force-dynamic";

export default async function BookingPage() {
  // Try to get the current user, but don't redirect if not logged in
  // Book-first, verify-later: anyone can start booking
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If logged in, check for unpaid pending bookings (created < 30 min ago)
  // Pass as prop so BookingFlow can offer "resume payment" OR "start new"
  const pendingBookings = user ? await getPendingBookings() : [];

  // Fetch live pricing from DB (packages, bike rentals, time slots)
  const liveConfig = await getLiveConfig();

  return (
    <BookingFlow
      userEmail={user?.email || ""}
      userName={user?.user_metadata?.full_name || ""}
      userId={user?.id}
      pendingBookings={pendingBookings}
      liveConfig={liveConfig}
    />
  );
}
