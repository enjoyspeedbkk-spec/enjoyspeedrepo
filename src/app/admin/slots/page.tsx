import { getUpcomingSessions } from "@/lib/actions/admin";
import { AdminSlots } from "@/components/admin/AdminSlots";

export default async function AdminSlotsPage() {
  const data = await getUpcomingSessions(21);
  return (
    <AdminSlots
      initialSessions={data.sessions}
      initialBookings={data.bookings}
      initialBlackouts={data.blackouts}
    />
  );
}
