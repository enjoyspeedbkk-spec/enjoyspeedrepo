import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const rawNext = searchParams.get("next") ?? "/account";
  // Sanitise: must be a relative path (starts with / but not //) — prevents open redirect
  const isSafeRelative = rawNext.startsWith("/") && !rawNext.startsWith("//") && !rawNext.includes("://");
  // Don't redirect non-admin users back to admin routes after sign-in
  const next = (!isSafeRelative || rawNext.startsWith("/admin")) ? "/account" : rawNext;

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Auth error — redirect to account page with error
  return NextResponse.redirect(`${origin}/account?error=auth_callback_failed`);
}
