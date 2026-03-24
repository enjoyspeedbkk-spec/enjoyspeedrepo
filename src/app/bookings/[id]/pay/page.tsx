import { getBookingById } from "@/lib/actions/bookings";
import { PaymentPromptPay } from "@/components/booking/PaymentPromptPay";
import { redirect } from "next/navigation";
import Link from "next/link";

export const metadata = {
  title: "Complete Payment | En-Joy Speed",
};

export default async function PayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const booking = await getBookingById(id);

  if (!booking) {
    redirect("/bookings");
  }

  // Already paid — show a confirmation instead of QR
  const isPaid =
    booking.payment?.status === "paid" ||
    booking.payment?.status === "verified";

  if (isPaid) {
    return (
      <section className="min-h-screen pt-24 pb-16 bg-cream">
        <div className="mx-auto max-w-lg px-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success/10 mb-4">
            <svg className="h-8 w-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2">Payment confirmed</h1>
          <p className="text-ink-muted text-sm mb-6">
            Your booking #{id.slice(0, 8).toUpperCase()} is confirmed. See you on ride day!
          </p>
          <Link
            href="/bookings"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-accent text-white font-semibold hover:bg-accent-dark transition-colors"
          >
            View My Bookings
          </Link>
        </div>
      </section>
    );
  }

  // Cancelled — don't show payment
  if (["cancelled", "no_show"].includes(booking.status)) {
    redirect("/bookings");
  }

  return (
    <PaymentPromptPay
      bookingId={booking.id}
      amount={booking.ride_total}
      rentalAmount={booking.rental_total}
      promptPayTarget={process.env.NEXT_PUBLIC_PROMPTPAY_ACCOUNT || "0000000000"}
      contactName={booking.contact_name}
    />
  );
}
