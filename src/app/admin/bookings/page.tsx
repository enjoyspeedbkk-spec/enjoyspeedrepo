import { getAllBookings } from "@/lib/actions/admin";
import { AdminBookings } from "@/components/admin/AdminBookings";

export default async function AdminBookingsPage() {
  const bookings = await getAllBookings();
  return <AdminBookings initialBookings={bookings} />;
}
