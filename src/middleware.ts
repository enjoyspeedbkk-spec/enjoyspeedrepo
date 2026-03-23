import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // Skip middleware if env vars are not set
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return supabaseResponse;
  }

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            supabaseResponse = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    // Refresh session if expired — required for Server Components
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Protected routes — redirect to sign in if not authenticated
    // Note: /booking is intentionally NOT protected (book-first, verify-later flow)
    const protectedPaths = ["/bookings", "/account/profile", "/admin"];
    const isProtected = protectedPaths.some((path) =>
      request.nextUrl.pathname.startsWith(path)
    );

    if (isProtected && !user) {
      const url = request.nextUrl.clone();
      url.pathname = "/account";
      url.searchParams.set("next", request.nextUrl.pathname);
      return NextResponse.redirect(url);
    }

    // Admin-only routes — only check if profiles table exists
    // Skip if DB isn't set up yet to avoid crashing the middleware
    if (request.nextUrl.pathname.startsWith("/admin") && user) {
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (profile?.role !== "admin") {
          return NextResponse.redirect(new URL("/", request.url));
        }
      } catch {
        // profiles table may not exist yet — let through for now
        return NextResponse.redirect(new URL("/", request.url));
      }
    }

    return supabaseResponse;
  } catch {
    // If anything goes wrong in middleware, don't block the request
    return NextResponse.next({ request });
  }
}

export const config = {
  matcher: [
    // Only match specific protected routes, not everything
    // /booking is NOT matched — it uses book-first flow with email verification
    "/bookings/:path*",
    "/account/:path*",
    "/admin/:path*",
    "/auth/:path*",
  ],
};
