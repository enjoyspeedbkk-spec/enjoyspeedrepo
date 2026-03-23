import { getDashboardStats, getPendingPayments, getTodayRides } from "@/lib/actions/admin";
import { AdminOverview } from "@/components/admin/AdminOverview";
import { TodayRides } from "@/components/admin/TodayRides";

export default async function AdminPage() {
  const [stats, pendingPayments, todaySlots] = await Promise.all([
    getDashboardStats(),
    getPendingPayments(),
    getTodayRides(),
  ]);

  return (
    <div className="space-y-8">
      <TodayRides slots={todaySlots as any} />
      <AdminOverview stats={stats} pendingPayments={pendingPayments} />
    </div>
  );
}
