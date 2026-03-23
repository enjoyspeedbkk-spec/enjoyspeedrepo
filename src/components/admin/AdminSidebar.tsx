"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  CreditCard,
  Users,
  Settings,
  Menu,
  X,
  ChevronRight,
  Shield,
  Package,
  Clock,
  Bike,
  Gift,
  UserCog,
  Tag,
  CloudOff,
} from "lucide-react";

const navItems = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    label: "Bookings",
    href: "/admin/bookings",
    icon: CalendarDays,
  },
  {
    label: "Payments",
    href: "/admin/payments",
    icon: CreditCard,
  },
  {
    label: "Slots & Availability",
    href: "/admin/slots",
    icon: Clock,
  },
  {
    label: "Settings",
    href: "/admin/settings",
    icon: Settings,
    children: [
      { label: "General", href: "/admin/settings", icon: Settings },
      { label: "Ride Packages", href: "/admin/settings#packages", icon: Package },
      { label: "Time Slots", href: "/admin/settings#slots", icon: Clock },
      { label: "Bike Rentals", href: "/admin/settings#bikes", icon: Bike },
      { label: "Starter Kit", href: "/admin/settings#kit", icon: Gift },
      { label: "Staff", href: "/admin/settings#staff", icon: UserCog },
      { label: "Promo Codes", href: "/admin/settings#promos", icon: Tag },
    ],
  },
];

export function AdminSidebar({ userName }: { userName: string }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  const sidebar = (
    <div className="flex flex-col h-full">
      {/* Admin header */}
      <div className="p-5 border-b border-sand/60">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-accent" />
          <div>
            <p className="font-bold text-sm text-ink">Admin Panel</p>
            <p className="text-[10px] text-ink-muted truncate">{userName}</p>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <div key={item.href}>
            <Link
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive(item.href, item.exact)
                  ? "bg-ink text-cream shadow-sm"
                  : "text-ink-light hover:bg-sand/40 hover:text-ink"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          </div>
        ))}
      </nav>

      {/* Back to site */}
      <div className="p-3 border-t border-sand/60">
        <Link
          href="/"
          className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-ink-muted hover:text-ink hover:bg-sand/40 transition-all"
        >
          <ChevronRight className="h-4 w-4 rotate-180" />
          Back to website
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:block fixed left-0 top-[72px] bottom-0 w-64 bg-surface border-r border-sand/60 z-30">
        {sidebar}
      </aside>

      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed bottom-6 left-6 z-50 p-3 rounded-full bg-ink text-cream shadow-lg hover:shadow-xl transition-all"
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 bg-ink/40 z-40"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="lg:hidden fixed left-0 top-[72px] bottom-0 w-72 bg-surface z-50 shadow-xl">
            {sidebar}
          </aside>
        </>
      )}
    </>
  );
}
