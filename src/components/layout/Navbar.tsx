"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronRight, User, LogOut, Shield } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/packages", label: "Rides" },
  { href: "/booking", label: "Book a Ride" },
  { href: "/bookings", label: "My Bookings" },
  { href: "/about", label: "About" },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<{ email?: string; fullName?: string; avatarUrl?: string } | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Check auth state on mount
  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser({
          email: session.user.email,
          fullName: session.user.user_metadata?.full_name || session.user.user_metadata?.name,
          avatarUrl: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture,
        });
      }
    };

    getUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          email: session.user.email,
          fullName: session.user.user_metadata?.full_name || session.user.user_metadata?.name,
          avatarUrl: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture,
        });
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const initials = user?.fullName
    ? user.fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || "?";

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
            {/* Logo */}
            <Link href="/" className="relative z-10 flex items-center gap-1">
              <Image
                src="/images/logo.jpg"
                alt="En-Joy Speed"
                width={48}
                height={48}
                className="rounded-md object-contain"
                priority
              />
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="relative px-4 py-2 text-sm font-medium text-ink-light hover:text-ink transition-colors duration-200 rounded-full hover:bg-sand/40"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Desktop CTA / User */}
            <div className="hidden md:flex items-center gap-3">
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
                        alt=""
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
                            <Link
                              href="/bookings"
                              onClick={() => setShowUserMenu(false)}
                              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm hover:bg-sand/30 transition-colors"
                            >
                              <ChevronRight className="h-4 w-4 text-ink-muted" />
                              My Bookings
                            </Link>
                            <form action="/api/auth/signout" method="POST">
                              <Link
                                href="/account"
                                onClick={async (e) => {
                                  e.preventDefault();
                                  setShowUserMenu(false);
                                  const { signOut } = await import("@/lib/actions/auth");
                                  await signOut();
                                }}
                                className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-ink-muted hover:bg-sand/30 hover:text-ink transition-colors w-full"
                              >
                                <LogOut className="h-4 w-4" />
                                Sign Out
                              </Link>
                            </form>
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link
                  href="/account"
                  className="px-4 py-2 text-sm font-medium text-ink-light hover:text-ink transition-colors"
                >
                  Sign In
                </Link>
              )}
              <Link
                href="/booking"
                className="group inline-flex items-center gap-1.5 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-all duration-300 hover:bg-accent-dark hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
              >
                Book Now
                <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
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
                        alt=""
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
                    </div>
                  </div>
                )}

                {navLinks.map((link, i) => (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 + 0.1 }}
                  >
                    <Link
                      href={link.href}
                      onClick={() => setIsOpen(false)}
                      className="flex items-center justify-between py-3 px-4 text-lg font-medium text-ink hover:bg-sand/40 rounded-xl transition-colors"
                    >
                      {link.label}
                      <ChevronRight className="h-4 w-4 text-ink-muted" />
                    </Link>
                  </motion.div>
                ))}

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
                  <Link
                    href="/booking"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-center gap-2 w-full rounded-full bg-accent px-6 py-3.5 text-base font-semibold text-white hover:bg-accent-dark transition-colors"
                  >
                    Book a Ride
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                  {!user && (
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
                      onClick={async () => {
                        setIsOpen(false);
                        const { signOut } = await import("@/lib/actions/auth");
                        await signOut();
                      }}
                      className="flex items-center justify-center gap-2 mt-3 text-sm font-medium text-ink-muted hover:text-ink transition-colors w-full"
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
