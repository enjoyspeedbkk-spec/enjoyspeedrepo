"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  CreditCard,
  Clock,
  Settings,
  Menu,
  X,
  ChevronRight,
  Shield,
  Package,
  Bike,
  Gift,
  UserCog,
  Tag,
  BarChart3,
  MessageSquare,
  ImageIcon,
  Users,
  Star,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
  badge?: string;
  children?: { label: string; href: string; icon: typeof LayoutDashboard }[];
}

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    label: "Analytics",
    href: "/admin/analytics",
    icon: BarChart3,
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
    label: "Customers",
    href: "/admin/customers",
    icon: Users,
  },
  {
    label: "Slots & Availability",
    href: "/admin/slots",
    icon: Clock,
  },
  {
    label: "Messaging",
    href: "/admin/messaging",
    icon: MessageSquare,
  },
  {
    label: "Feedback",
    href: "/admin/feedback",
    icon: Star,
  },
  {
    label: "Site Images",
    href: "/admin/images",
    icon: ImageIcon,
  },
  {
    label: "Settings",
    href: "/admin/settings",
    icon: Settings,
    children: [
      { label: "Ride Packages", href: "/admin/settings?tab=packages", icon: Package },
      { label: "Time Slots", href: "/admin/settings?tab=slots", icon: Clock },
      { label: "Bike Rentals", href: "/admin/settings?tab=bikes", icon: Bike },
      { label: "Pro-pack", href: "/admin/settings?tab=kit", icon: Gift },
      { label: "Staff", href: "/admin/settings?tab=staff", icon: UserCog },
      { label: "Promo Codes", href: "/admin/settings?tab=promos", icon: Tag },
      { label: "Admin Access", href: "/admin/settings?tab=access", icon: Shield },
    ],
  },
];

export function AdminSidebar({ userName }: { userName: string }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    // Auto-expand Settings when already on the settings page
    pathname.startsWith("/admin/settings") ? new Set(["/admin/settings"]) : new Set()
  );

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  const toggleGroup = (href: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(href)) next.delete(href);
      else next.add(href);
      return next;
    });
  };

  const sidebar = (
    <div className="flex flex-col h-full">
      {/* Admin header */}
      <div className="p-5 border-b border-sand/60">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-accent" />
          <div>
            <p className="font-bold text-sm text-ink">Admin Panel</p>
            <p className="text-xs text-ink-muted truncate">{userName}</p>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => (
          <div key={item.href}>
            {item.children ? (
              <>
                <button
                  onClick={() => toggleGroup(item.href)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                    isActive(item.href)
                      ? "bg-ink text-cream shadow-sm"
                      : "text-ink-light hover:bg-sand/40 hover:text-ink"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                  <ChevronRight
                    className={`h-3 w-3 ml-auto transition-transform ${
                      expandedGroups.has(item.href) ? "rotate-90" : ""
                    }`}
                  />
                </button>
                {expandedGroups.has(item.href) && (
                  <div className="ml-4 mt-0.5 space-y-0.5">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-ink-muted hover:bg-sand/40 hover:text-ink transition-all"
                      >
                        <child.icon className="h-3.5 w-3.5" />
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <Link
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                  isActive(item.href, item.exact)
                    ? "bg-ink text-cream shadow-sm"
                    : "text-ink-light hover:bg-sand/40 hover:text-ink"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            )}
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
