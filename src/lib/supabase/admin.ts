import { createClient } from "@supabase/supabase-js";

// Admin client using service role key — NEVER expose in browser code
// Only use in Server Components, API routes, and server actions
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
