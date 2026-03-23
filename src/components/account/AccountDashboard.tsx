"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { signOut } from "@/lib/actions/auth";
import { TIME_SLOTS } from "@/lib/constants";
import {
  User,
  Calendar,
  ChevronRight,
  LogOut,
  Shield,
  Bike,
  Clock,
  Settings,
  ArrowRight,
} from "lucide-react";

interface AccountUser {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  avatarUrl: string;
  role: string;
  createdAt: string;
}

interface Booking {
  id: string;
  status: string;
  group_type: string;
  rider_count: number;
  ride_total: number;
  total_price: number;
  created_at: string;
  contact_name: string;
  ride_sessions: {
    date: string;
    time_slot_id: string;
  };
}

const STATUS_STYLE: Record<string, { variant: "success" | "warning" | "accent" | "default" | "sky"; label: string }> = {
  pending: { variant: "warning", label: "Payment Pending" },
  confirmed: { variant: "success", label: "Confirmed" },
  rider_details: { variant: "sky", label: "Details Needed" },
  ready: { variant: "accent", label: "Ready to Ride" },
  completed: { variant: "default", label: "Completed" },
  cancelled: { variant: "default", label: "Cancelled" },
  no_show: { variant: "default", label: "No Show" },
};

export function AccountDashboard({
  user,
  recentBookings,
}: {
  user: AccountUser;
  recentBookings: Booking[];
}) {
  const [signingOut, setSigningOut] = useState(false);

  const upcomingBookings = recentBookings.filter(
    (b) => !["completed", "cancelled", "no_show"].includes(b.status)
  );
  const pastBookings = recentBookings.filter((b) =>
    ["completed", "cancelled", "no_show"].includes(b.status)
  );

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut();
  };

  const initials = user.fullName
    ? user.fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user.email[0].toUpperCase();

  return (
    <section className="min-h-screen pt-24 pb-16 bg-cream">
      <div className="mx-auto max-w-2xl px-6">
        {/* Profile header */}
        <div className="flex items-center gap-4 mb-8">
          {user.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.avatarUrl}
              alt={user.fullName}
              className="w-16 h-16 rounded-2xl object-cover shadow-sm"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center">
              <span className="text-xl font-bold text-accent">{initials}</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold truncate">
              {user.fullName || "Rider"}
            </h1>
            <p className="text-sm text-ink-muted truncate">{user.email}</p>
            {user.role === "admin" && (
              <Link
                href="/admin"
                className="inline-flex items-center gap-1 mt-1 text-xs font-semibold text-accent hover:text-accent-dark transition-colors"
              >
                <Shield className="h-3 w-3" />
                Admin Dashboard
                <ChevronRight className="h-3 w-3" />
              </Link>
            )}
          </div>
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="p-2.5 rounded-xl text-ink-muted hover:text-ink hover:bg-sand/30 transition-all"
            title="Sign out"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <Link href="/booking">
            <Card hover padding="md" className="h-full">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <Bike className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Book a Ride</p>
                  <p className="text-xs text-ink-muted">New session</p>
                </div>
              </div>
            </Card>
          </Link>
          <Link href="/bookings">
            <Card hover padding="md" className="h-full">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky/10 flex items-center justify-center flex-shrink-0">
                  <Calendar className="h-5 w-5 text-sky" />
                </div>
                <div>
                  <p className="font-semibold text-sm">My Bookings</p>
                  <p className="text-xs text-ink-muted">
                    {upcomingBookings.length > 0
                      ? `${upcomingBookings.length} upcoming`
                      : "View all"}
                  </p>
                </div>
              </div>
            </Card>
          </Link>
        </div>

        {/* Upcoming bookings */}
        {upcomingBookings.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold">Upcoming Rides</h2>
              <Link
                href="/bookings"
                className="text-xs font-medium text-accent hover:text-accent-dark flex items-center gap-0.5 transition-colors"
              >
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="space-y-2">
              {upcomingBookings.map((booking) => {
                const session = booking.ride_sessions;
                const slot = TIME_SLOTS.find(
                  (s) => s.id === session.time_slot_id
                );
                const status =
                  STATUS_STYLE[booking.status] || STATUS_STYLE.pending;
                const rideDate = new Date(session.date + "T12:00");

                return (
                  <Link key={booking.id} href="/bookings">
                    <Card hover padding="sm" className="group">
                      <div className="flex items-center gap-3 p-2">
                        {/* Date badge */}
                        <div className="w-14 h-14 rounded-xl bg-accent/5 flex flex-col items-center justify-center flex-shrink-0">
                          <span className="text-[10px] font-semibold text-ink-muted uppercase">
                            {rideDate.toLocaleDateString("en-US", {
                              month: "short",
                            })}
                          </span>
                          <span className="text-xl font-bold text-ink leading-none">
                            {rideDate.getDate()}
                          </span>
                          <span className="text-[9px] text-ink-muted">
                            {rideDate.toLocaleDateString("en-US", {
                              weekday: "short",
                            })}
                          </span>
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm">
                              {slot?.label || session.time_slot_id}
                            </span>
                            <Badge variant={status.variant}>
                              {status.label}
                            </Badge>
                          </div>
                          <p className="text-xs text-ink-muted mt-0.5">
                            <Clock className="inline h-3 w-3 mr-1" />
                            {slot
                              ? `${slot.startTime}–${slot.endTime}`
                              : session.time_slot_id}{" "}
                            · {booking.group_type} ·{" "}
                            {booking.rider_count} rider
                            {booking.rider_count > 1 ? "s" : ""}
                          </p>
                        </div>

                        <ChevronRight className="h-4 w-4 text-ink-muted group-hover:text-ink transition-colors flex-shrink-0" />
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* No upcoming bookings */}
        {upcomingBookings.length === 0 && (
          <Card padding="lg" className="mb-8 text-center">
            <Bike className="h-8 w-8 text-ink-muted/30 mx-auto mb-3" />
            <p className="font-semibold text-sm">No upcoming rides</p>
            <p className="text-xs text-ink-muted mt-1 mb-4">
              Book your first guided cycling session on the Skylane.
            </p>
            <Link href="/booking">
              <Button variant="secondary" size="sm" arrow>
                Book a Ride
              </Button>
            </Link>
          </Card>
        )}

        {/* Past bookings preview */}
        {pastBookings.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-bold mb-3">Recent Rides</h2>
            <div className="space-y-2">
              {pastBookings.slice(0, 3).map((booking) => {
                const session = booking.ride_sessions;
                const slot = TIME_SLOTS.find(
                  (s) => s.id === session.time_slot_id
                );
                const rideDate = new Date(session.date + "T12:00");

                return (
                  <Link key={booking.id} href="/bookings">
                    <Card hover padding="sm" className="group opacity-75 hover:opacity-100 transition-opacity">
                      <div className="flex items-center gap-3 p-2">
                        <div className="w-10 h-10 rounded-lg bg-sand/30 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-ink-muted">
                            {rideDate.getDate()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium">
                            {slot?.label || session.time_slot_id}
                          </span>
                          <p className="text-xs text-ink-muted">
                            {rideDate.toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}{" "}
                            · {booking.group_type} ·{" "}
                            {booking.total_price?.toLocaleString()} THB
                          </p>
                        </div>
                        <Badge variant="default">
                          {booking.status === "completed"
                            ? "Completed"
                            : booking.status}
                        </Badge>
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Account info */}
        <Card padding="md">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="h-4 w-4 text-ink-muted" />
            <h2 className="text-sm font-bold">Account Details</h2>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-ink-muted">Name</span>
              <span className="font-medium">{user.fullName || "Not set"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-muted">Email</span>
              <span className="font-medium">{user.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-muted">Phone</span>
              <span className="font-medium">{user.phone || "Not set"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-muted">Member since</span>
              <span className="font-medium">
                {new Date(user.createdAt).toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
        </Card>

        {/* Sign out */}
        <div className="mt-6 text-center">
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="text-sm text-ink-muted hover:text-ink font-medium transition-colors"
          >
            {signingOut ? "Signing out..." : "Sign out"}
          </button>
        </div>
      </div>
    </section>
  );
}
