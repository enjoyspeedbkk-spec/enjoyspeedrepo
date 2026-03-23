import { createClient } from "@/lib/supabase/server";
import { BookingFlow } from "@/components/booking/BookingFlow";

export const metadata = {
  title: "Book a Ride | En-Joy Speed",
  description:
    "Book your premium guided cycling session on Bangkok's Skylane.",
};

export default async function BookingPage() {
  // Try to get the current user, but don't redirect if not logged in
  // Book-first, verify-later: anyone can start booking
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <BookingFlow
      userEmail={user?.email || ""}
      userName={user?.user_metadata?.full_name || ""}
      userId={user?.id}
    />
  );
}
