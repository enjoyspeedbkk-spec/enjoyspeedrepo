"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronRight, User, LogOut, CalendarDays, Shield } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";

// Base nav links — "Book a Ride" removed (redundant with CTA button)
const customerLinks = [
  { href: "/", label: "Home" },
  { href: "/packages", label: "Rides" },
  { href: "/bookings", label: "My Bookings" },
  { href: "/about", label: "About" },
];

// Admin sees a different nav — focused on admin tasks
const adminLinks = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/bookings", label: "Bookings" },
  { href: "/admin/payments", label: "Payments" },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/settings", label: "Settings" },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<{ email?: string; fullName?: string; avatarUrl?: string; isAdmin?: boolean } | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const loadUser = async (userId: string, metadata: Record<string, any>) => {
      // Check profile for admin role
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();

      setUser({
        email: metadata.email,
        fullName: metadata.full_name || metadata.name,
        avatarUrl: metadata.avatar_url || metadata.picture,
        isAdmin: profile?.role === "admin",
      });
    };

    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await loadUser(session.user.id, {
          email: session.user.email,
          ...session.user.user_metadata,
        });
      }
      setAuthLoading(false);
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadUser(session.user.id, {
          email: session.user.email,
          ...session.user.user_metadata,
        });
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Sign out — clear user immediately, then redirect
  const handleSignOut = useCallback(async () => {
    setShowUserMenu(false);
    setIsOpen(false);
    // Clear user state immediately so UI updates
    setUser(null);

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }, [router]);

  const initials = user?.fullName
    ? user.fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || "?";

  // Use admin or customer links depending on user role
  const navLinks = user?.isAdmin ? adminLinks : customerLinks;

  // Check if a nav link is the current page
  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <>
      <motion.header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? "bg-surface/90 backdrop-blur-xl shadow-md border-b border-sand/50"
            : "bg-transparent"
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <nav className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex h-18 items-center justify-between">
            {/* Logo — typographic wordmark */}
            <Link href={user?.isAdmin ? "/admin" : "/"} className="relative z-10 flex items-center gap-2">
              <span className="text-xl font-extrabold tracking-tight" style={{ fontFamily: "var(--font-heading, 'Plus Jakarta Sans', sans-serif)" }}>
                <span className="text-ink">en</span>
                <span className="text-accent">-</span>
                <span className="text-ink">joy</span>
              </span>
              <span
                className="text-xl font-extrabold tracking-tight text-accent"
                style={{ fontFamily: "var(--font-heading, 'Plus Jakarta Sans', sans-serif)" }}
              >
                speed
              </span>
              {user?.isAdmin && (
                <span className="ml-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-accent/10 text-accent rounded-full">
                  Admin
                </span>
              )}
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-0.5">
              {navLinks.map((link) => {
                const active = isActive(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`relative px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 ${
                      active
                        ? "text-accent"
                        : "text-ink-light hover:text-ink hover:bg-sand/40"
                    }`}
                  >
                    {link.label}
                    {active && (
                      <motion.div
                        layoutId="nav-indicator"
                        className="absolute inset-x-2 -bottom-0.5 h-0.5 bg-accent rounded-full"
                        transition={{ type: "spring", stiffness: 500, damping: 35 }}
                      />
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Desktop CTA / User — Book Now first, then account (rightmost) */}
            <div className="hidden md:flex items-center gap-3">
              {user?.isAdmin ? (
                <Link
                  href="/"
                  className="group inline-flex items-center gap-1.5 rounded-full border-2 border-sand/60 px-4 py-2 text-sm font-medium text-ink-light transition-all duration-200 hover:border-ink/30 hover:text-ink"
                >
                  View Site
                  <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
              ) : (
                <Link
                  href="/booking"
                  className="group inline-flex items-center gap-1.5 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-all duration-300 hover:bg-accent-dark hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                >
                  Book a Ride
                  <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
              )}

              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2.5 px-3 py-1.5 rounded-full hover:bg-sand/40 transition-colors"
                  >
                    {user.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={user.avatarUrl}
                        alt={user.fullName || "User avatar"}
                        className="w-8 h-8 rounded-full object-cover ring-2 ring-sand/60"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                        <span className="text-xs font-bold text-accent">{initials}</span>
                      </div>
                    )}
                    <span className="text-sm font-medium text-ink max-w-[120px] truncate">
                      {user.fullName || user.email?.split("@")[0]}
                    </span>
                    <ChevronRight className={`h-3 w-3 text-ink-muted transition-transform ${showUserMenu ? "rotate-90" : ""}`} />
                  </button>

                  {/* User dropdown */}
                  <AnimatePresence>
                    {showUserMenu && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 top-full mt-2 w-56 z-50 rounded-xl bg-surface border border-sand/60 shadow-lg overflow-hidden"
                        >
                          <div className="p-3 border-b border-sand/40">
                            <p className="text-sm font-semibold truncate">{user.fullName || "Rider"}</p>
                            <p className="text-xs text-ink-muted truncate">{user.email}</p>
                            {user.isAdmin && (
                              <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-semibold text-accent">
                                <Shield className="h-2.5 w-2.5" /> Admin
                              </span>
                            )}
                          </div>
                          <div className="p-1.5">
                            <Link
                              href="/account"
                              onClick={() => setShowUserMenu(false)}
                              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm hover:bg-sand/30 transition-colors"
                            >
                              <User className="h-4 w-4 text-ink-muted" />
                              My Account
                            </Link>
                            {user.isAdmin ? (
                              <>
                                <Link
                                  href="/admin/line-followers"
                                  onClick={() => setShowUserMenu(false)}
                                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm hover:bg-sand/30 transition-colors"
                                >
                                  <CalendarDays className="h-4 w-4 text-ink-muted" />
                                  LINE Followers
                                </Link>
                                <Link
                                  href="/admin/messaging"
                                  onClick={() => setShowUserMenu(false)}
                                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm hover:bg-sand/30 transition-colors"
                                >
                                  <CalendarDays className="h-4 w-4 text-ink-muted" />
                                  LINE Messaging
                                </Link>
                                <Link
                                  href="/admin/images"
                                  onClick={() => setShowUserMenu(false)}
                                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm hover:bg-sand/30 transition-colors"
                                >
                                  <User className="h-4 w-4 text-ink-muted" />
                                  Site Images
                                </Link>
                              </>
                            ) : (
                              <Link
                                href="/bookings"
                                onClick={() => setShowUserMenu(false)}
                                className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm hover:bg-sand/30 transition-colors"
                              >
                                <CalendarDays className="h-4 w-4 text-ink-muted" />
                                My Bookings
                              </Link>
                            )}
                            <button
                              onClick={handleSignOut}
                              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-ink-muted hover:bg-sand/30 hover:text-ink transition-colors w-full text-left"
                            >
                              <LogOut className="h-4 w-4" />
                              Sign Out
                            </button>
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              ) : authLoading ? (
                <div className="w-8 h-8 rounded-full bg-sand/40 animate-pulse" />
              ) : (
                <Link
                  href="/account"
                  className="px-4 py-2 text-sm font-medium text-ink-light hover:text-ink transition-colors"
                >
                  Sign In
                </Link>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="relative z-10 md:hidden p-2 -mr-2 rounded-lg hover:bg-sand/40 transition-colors"
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </nav>
      </motion.header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-40 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div
              className="absolute inset-0 bg-navy/20 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              className="absolute top-0 right-0 h-full w-[80%] max-w-sm bg-cream shadow-xl"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="flex flex-col pt-24 px-8 gap-1">
                {/* User info on mobile */}
                {user && (
                  <div className="flex items-center gap-3 mb-6 pb-4 border-b border-sand/40">
                    {user.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={user.avatarUrl}
                        alt={user.fullName || "User avatar"}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                        <span className="text-sm font-bold text-accent">{initials}</span>
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{user.fullName || "Rider"}</p>
                      <p className="text-xs text-ink-muted truncate">{user.email}</p>
                      {user.isAdmin && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-accent">
                          <Shield className="h-2.5 w-2.5" /> Admin
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {navLinks.map((link, i) => {
                  const active = isActive(link.href);
                  return (
                    <motion.div
                      key={link.href}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 + 0.1 }}
                    >
                      <Link
                        href={link.href}
                        onClick={() => setIsOpen(false)}
                        className={`flex items-center justify-between py-3 px-4 text-lg font-medium rounded-xl transition-colors ${
                          active
                            ? "text-accent bg-accent/5"
                            : "text-ink hover:bg-sand/40"
                        }`}
                      >
                        <span className="flex items-center gap-2.5">
                          {active && <div className="w-1.5 h-1.5 rounded-full bg-accent" />}
                          {link.label}
                        </span>
                        <ChevronRight className={`h-4 w-4 ${active ? "text-accent" : "text-ink-muted"}`} />
                      </Link>
                    </motion.div>
                  );
                })}

                {user && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 }}
                  >
                    <Link
                      href="/account"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center justify-between py-3 px-4 text-lg font-medium text-ink hover:bg-sand/40 rounded-xl transition-colors"
                    >
                      My Account
                      <User className="h-4 w-4 text-ink-muted" />
                    </Link>
                  </motion.div>
                )}

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mt-6 pt-6 border-t border-sand"
                >
                  {user?.isAdmin ? (
                    <Link
                      href="/"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center justify-center gap-2 w-full rounded-full border-2 border-sand/60 px-6 py-3 text-base font-medium text-ink-light hover:text-ink transition-colors"
                    >
                      View Public Site
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  ) : (
                    <Link
                      href="/booking"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center justify-center gap-2 w-full rounded-full bg-accent px-6 py-3.5 text-base font-semibold text-white hover:bg-accent-dark transition-colors"
                    >
                      Book a Ride
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  )}
                  {!user && !authLoading && (
                    <Link
                      href="/account"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center justify-center mt-3 text-sm font-medium text-ink-muted hover:text-ink transition-colors"
                    >
                      Sign In
                    </Link>
                  )}
                  {user && (
                    <button
                      onClick={handleSignOut}
                      className={`flex items-center justify-center gap-2 ${!user.isAdmin ? "mt-3" : ""} text-sm font-medium text-ink-muted hover:text-ink transition-colors w-full`}
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      Sign Out
                    </button>
                  )}
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
