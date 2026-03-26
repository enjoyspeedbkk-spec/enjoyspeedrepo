import { createClient } from "@/lib/supabase/server";
import { AuthForm } from "@/components/auth/AuthForm";
import { AccountDashboard } from "@/components/account/AccountDashboard";

export const metadata = {
  title: "Account | En-Joy Speed",
  description: "Manage your account and view your ride history.",
};

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Not signed in — show auth form
  if (!user) {
    return <AuthForm />;
  }

  // Signed in — fetch profile and recent bookings (using RLS-scoped client)
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError && profileError.code !== "PGRST116") {
    // PGRST116 = "no rows" (new user with no profile yet) — that's fine
    console.error("[account/page] profile fetch error:", profileError.message);
  }

  // Get recent bookings with session info
  const { data: bookings, error: bookingsError } = await supabase
    .from("bookings")
    .select(`
      id, status, group_type, rider_count, ride_total, total_price, created_at, contact_name,
      ride_sessions!inner(date, time_slot_id)
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5);

  if (bookingsError) {
    console.error("[account/page] bookings fetch error:", bookingsError.message);
  }

  return (
    <AccountDashboard
      user={{
        id: user.id,
        email: user.email || "",
        fullName: profile?.full_name || user.user_metadata?.full_name || "",
        phone: profile?.phone || "",
        lineId: profile?.line_id || "",
        preferredLanguage: profile?.preferred_language || "en",
        avatarUrl: user.user_metadata?.avatar_url || "",
        role: profile?.role || "user",
        createdAt: user.created_at || "",
      }}
      recentBookings={(bookings || []).map((b: any) => ({
        ...b,
        ride_sessions: Array.isArray(b.ride_sessions) ? b.ride_sessions[0] : b.ride_sessions,
      }))}
    />
  );
}
