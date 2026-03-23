import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { BookingsDashboard } from "@/components/bookings/BookingsDashboard";
import { getUserBookings } from "@/lib/actions/bookings";

export const metadata = {
  title: "My Bookings | En-Joy Speed",
  description: "View and manage your cycling bookings.",
};

export default async function BookingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/account?next=/bookings");
  }

  const { upcoming, completed, cancelled } = await getUserBookings();

  return (
    <BookingsDashboard
      upcoming={upcoming}
      completed={completed}
      cancelled={cancelled}
      userName={user.user_metadata?.full_name || user.email || ""}
    />
  );
}
