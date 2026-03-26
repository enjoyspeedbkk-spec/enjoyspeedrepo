import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getLocaleFromRequest } from "@/lib/i18n/getLocaleFromRequest";

// Protected paths that require Supabase auth check
const PROTECTED_PATHS = ["/bookings", "/account/profile", "/admin"];
const ADMIN_PATHS = ["/admin"];

export async function middleware(request: NextRequest) {
  // ── Step 1: Locale detection (runs on EVERY page) ──────────────────────
  // This is fast (cookie read only) and must run everywhere so that server
  // components on public pages (/about, /packages, /contact, etc.) receive
  // the correct x-locale header instead of always defaulting to 'en'.
  const locale = getLocaleFromRequest(request);

  let supabaseResponse = NextResponse.next({ request });

  // Forward locale to server components via a response header
  supabaseResponse.headers.set("x-locale", locale);

  // Persist locale cookie on first visit
  if (!request.cookies.get("lang")) {
    supabaseResponse.cookies.set("lang", locale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }

  // ── Step 2: Auth guard (only for protected paths) ──────────────────────
  // Skip the Supabase round-trip entirely for public pages to keep them fast.
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));
  const isAdmin = ADMIN_PATHS.some((p) => pathname.startsWith(p));

  if (!isProtected && !isAdmin) {
    // Public page — locale header already set, nothing else needed
    return supabaseResponse;
  }

  // Skip auth if Supabase env vars aren't configured
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
            supabaseResponse = NextResponse.next({ request });
            // Re-apply locale header after recreating the response
            supabaseResponse.headers.set("x-locale", locale);
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    // Refresh session — required for Server Components
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Redirect unauthenticated users away from protected routes
    // Note: /booking is intentionally NOT protected (book-first, verify-later)
    if (isProtected && !user) {
      const url = request.nextUrl.clone();
      url.pathname = "/account";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }

    // Admin-only gate
    if (isAdmin && user) {
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
        return NextResponse.redirect(new URL("/", request.url));
      }
    }

    return supabaseResponse;
  } catch {
    // Don't block the request if auth check fails
    return supabaseResponse;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static  (static files)
     * - _next/image   (image optimisation)
     * - favicon.ico
     * - public assets (images, fonts, etc.)
     *
     * This ensures every page (including /about, /packages, /contact) receives
     * the x-locale header so server components can render in the correct language.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|otf|eot|mp4|pdf)$).*)",
  ],
};
