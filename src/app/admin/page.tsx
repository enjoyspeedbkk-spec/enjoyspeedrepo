import { getDashboardStats, getPendingPayments, getTodayRides } from "@/lib/actions/admin";
import { AdminOverview } from "@/components/admin/AdminOverview";
import { TodayRides } from "@/components/admin/TodayRides";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let adminName = "Admin";
  if (user) {
    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();
    adminName = profile?.full_name || user.email?.split("@")[0] || "Admin";
  }

  const [stats, pendingPayments, todaySlots] = await Promise.all([
    getDashboardStats(),
    getPendingPayments(),
    getTodayRides(),
  ]);

  return (
    <div className="space-y-8">
      <TodayRides slots={todaySlots as any} />
      <AdminOverview stats={stats} pendingPayments={pendingPayments} adminName={adminName} />
    </div>
  );
}
