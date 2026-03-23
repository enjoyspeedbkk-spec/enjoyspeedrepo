"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Users,
  CreditCard,
  TrendingUp,
  CalendarDays,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronRight,
  Bike,
  DollarSign,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { verifyPayment } from "@/lib/actions/admin";

interface DashboardStats {
  todayBookings: number;
  todayRiders: number;
  todayRevenue: number;
  pendingPayments: number;
  pendingAmount: number;
  weekRevenue: number;
  upcomingBookings: number;
  upcomingRiders: number;
}

interface PendingPayment {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  slip_image_url: string | null;
  bookings: {
    id: string;
    contact_name: string;
    contact_phone: string | null;
    rider_count: number;
    group_type: string;
    ride_total: number;
    total_price: number;
    ride_sessions: {
      date: string;
      time_slot_id: string;
    };
  };
}

export function AdminOverview({
  stats,
  pendingPayments,
}: {
  stats: DashboardStats;
  pendingPayments: PendingPayment[];
}) {
  const [verifying, setVerifying] = useState<string | null>(null);
  const [verified, setVerified] = useState<Set<string>>(new Set());

  const handleVerify = async (paymentId: string, bookingId: string) => {
    setVerifying(paymentId);
    const result = await verifyPayment(paymentId, bookingId);
    setVerifying(null);
    if (result.success) {
      setVerified((prev) => new Set(prev).add(paymentId));
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-ink-muted mt-1">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={CalendarDays}
          label="Today"
          value={stats.todayBookings}
          sub={`${stats.todayRiders} riders`}
          color="text-sky bg-sky/10"
        />
        <StatCard
          icon={CreditCard}
          label="Pending Payments"
          value={stats.pendingPayments}
          sub={`${stats.pendingAmount.toLocaleString()} THB`}
          color="text-warning bg-warning/10"
          alert={stats.pendingPayments > 0}
        />
        <StatCard
          icon={TrendingUp}
          label="This Week"
          value={`${(stats.weekRevenue / 1000).toFixed(1)}k`}
          sub="THB revenue"
          color="text-success bg-success/10"
        />
        <StatCard
          icon={Users}
          label="Upcoming"
          value={stats.upcomingBookings}
          sub={`${stats.upcomingRiders} riders next 7 days`}
          color="text-accent bg-accent/10"
        />
      </div>

      {/* Pending Payments — the #1 daily action */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-warning" />
            Payments to Verify
            {pendingPayments.length > 0 && (
              <span className="text-xs bg-warning/10 text-warning px-2 py-0.5 rounded-full font-bold">
                {pendingPayments.length}
              </span>
            )}
          </h2>
          <Link href="/admin/payments">
            <Button variant="ghost" size="sm">
              View all
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>

        {pendingPayments.length === 0 ? (
          <Card padding="md">
            <div className="flex items-center gap-3 text-success">
              <CheckCircle2 className="h-5 w-5" />
              <p className="text-sm font-medium">
                All payments verified. You&apos;re up to date!
              </p>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {pendingPayments.slice(0, 5).map((payment) => {
              const isVerified = verified.has(payment.id);
              const booking = payment.bookings;
              const session = booking.ride_sessions;
              const rideDate = new Date(session.date);

              return (
                <Card key={payment.id} padding="md">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-sm truncate">
                          {booking.contact_name}
                        </p>
                        {isVerified ? (
                          <Badge variant="success">Verified</Badge>
                        ) : (
                          <Badge variant="warning">Pending</Badge>
                        )}
                      </div>
                      <div className="text-xs text-ink-muted space-y-0.5">
                        <p>
                          {rideDate.toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}{" "}
                          · Slot {session.time_slot_id} ·{" "}
                          {booking.group_type} · {booking.rider_count} riders
                        </p>
                        <p>
                          Booked{" "}
                          {new Date(payment.created_at).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                            }
                          )}
                        </p>
                      </div>

                      {payment.slip_image_url && (
                        <a
                          href={payment.slip_image_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-sky hover:text-sky-dark transition-colors"
                        >
                          View payment slip →
                        </a>
                      )}
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-lg text-accent">
                        {payment.amount.toLocaleString()}
                      </p>
                      <p className="text-[10px] text-ink-muted">THB</p>

                      {!isVerified && (
                        <button
                          onClick={() =>
                            handleVerify(payment.id, booking.id)
                          }
                          disabled={verifying === payment.id}
                          className="mt-2 px-3 py-1.5 rounded-lg bg-success text-white text-xs font-semibold hover:bg-success/90 transition-colors disabled:opacity-50"
                        >
                          {verifying === payment.id
                            ? "Verifying..."
                            : "✓ Verify"}
                        </button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <QuickAction
          href="/admin/bookings"
          icon={CalendarDays}
          label="All Bookings"
        />
        <QuickAction
          href="/admin/slots"
          icon={Clock}
          label="Manage Slots"
        />
        <QuickAction
          href="/admin/settings"
          icon={DollarSign}
          label="Edit Pricing"
        />
        <QuickAction
          href="/admin/settings#staff"
          icon={Users}
          label="Manage Staff"
        />
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
  alert,
}: {
  icon: typeof Users;
  label: string;
  value: string | number;
  sub: string;
  color: string;
  alert?: boolean;
}) {
  return (
    <Card padding="md" className={alert ? "ring-2 ring-warning/30" : ""}>
      <div className="flex items-start justify-between">
        <div
          className={`p-2 rounded-lg ${color
            .split(" ")
            .slice(1)
            .join(" ")}`}
        >
          <Icon className={`h-4 w-4 ${color.split(" ")[0]}`} />
        </div>
        {alert && (
          <AlertCircle className="h-4 w-4 text-warning animate-pulse" />
        )}
      </div>
      <p className="text-2xl font-bold mt-3">{value}</p>
      <p className="text-xs text-ink-muted mt-0.5">{sub}</p>
      <p className="text-[10px] text-ink-muted/60 mt-1 uppercase tracking-wider font-semibold">
        {label}
      </p>
    </Card>
  );
}

function QuickAction({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: typeof Users;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 p-4 rounded-xl bg-surface border border-sand/60 hover:bg-sand/20 hover:border-ink/10 transition-all"
    >
      <Icon className="h-4 w-4 text-ink-muted" />
      <span className="text-sm font-medium">{label}</span>
    </Link>
  );
}
