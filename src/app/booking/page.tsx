import { createClient } from "@/lib/supabase/server";
import { BookingFlow } from "@/components/booking/BookingFlow";
import { getPendingBooking } from "@/lib/actions/bookings";
import { PaymentPromptPay } from "@/components/booking/PaymentPromptPay";

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

  // If logged in, check for an unpaid pending booking (created < 30 min ago)
  // so reloading the page after booking resumes to the payment screen
  if (user) {
    const pending = await getPendingBooking();
    if (pending) {
      return (
        <PaymentPromptPay
          bookingId={pending.bookingId}
          amount={pending.paymentAmount}
          rentalAmount={pending.rentalAmount}
          promptPayTarget={process.env.NEXT_PUBLIC_PROMPTPAY_ACCOUNT || "0000000000"}
          contactName={pending.contactName}
        />
      );
    }
  }

  return (
    <BookingFlow
      userEmail={user?.email || ""}
      userName={user?.user_metadata?.full_name || ""}
      userId={user?.id}
    />
  );
}
