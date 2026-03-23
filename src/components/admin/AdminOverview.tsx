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
  Plus,
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
  adminName,
}: {
  stats: DashboardStats;
  pendingPayments: PendingPayment[];
  adminName: string;
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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div>
        <h1 className="text-3xl font-bold">
          {getGreeting()}, {adminName}
        </h1>
        <p className="text-sm text-ink-muted mt-1">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </p>
      </div>

      {/* Today's operations */}
      <div>
        <h2 className="text-sm font-semibold text-ink-muted mb-3 flex items-center gap-2">
          <Clock className="h-4 w-4" />
          TODAY'S OPERATIONS
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            icon={CalendarDays}
            label="Bookings"
            value={stats.todayBookings}
            sub={`${stats.todayRiders} riders on the road`}
            color="text-sky bg-sky/10"
          />
          <StatCard
            icon={DollarSign}
            label="Today's Revenue"
            value={`${(stats.todayRevenue / 1000).toFixed(1)}k THB`}
            sub="Confirmed payments"
            color="text-success bg-success/10"
          />
          <StatCard
            icon={AlertCircle}
            label="Payments Pending"
            value={stats.pendingPayments}
            sub={`${stats.pendingAmount.toLocaleString()} THB`}
            color="text-warning bg-warning/10"
            alert={stats.pendingPayments > 0}
          />
        </div>
      </div>

      {/* Business overview */}
      <div>
        <h2 className="text-sm font-semibold text-ink-muted mb-3 flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          BUSINESS OVERVIEW
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <StatCard
            icon={TrendingUp}
            label="This Week"
            value={`${(stats.weekRevenue / 1000).toFixed(1)}k`}
            sub="THB revenue"
            color="text-accent bg-accent/10"
          />
          <StatCard
            icon={Users}
            label="Upcoming (7 days)"
            value={stats.upcomingBookings}
            sub={`${stats.upcomingRiders} riders scheduled`}
            color="text-accent bg-accent/10"
          />
        </div>
      </div>

      {/* Payments to Verify — the #1 daily action */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-warning" />
              Verify Payments
              {pendingPayments.length > 0 && (
                <span className="text-xs bg-warning text-white px-2 py-0.5 rounded-full font-bold">
                  {pendingPayments.length} pending
                </span>
              )}
            </h2>
            <p className="text-xs text-ink-muted mt-0.5">
              Review and verify bank transfer slips
            </p>
          </div>
          {pendingPayments.length > 0 && (
            <Link href="/admin/payments">
              <Button variant="outline" size="sm">
                View all
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          )}
        </div>

        {pendingPayments.length === 0 ? (
          <Card padding="md" className="bg-success/5 border border-success/20">
            <div className="flex items-center gap-3 text-success">
              <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold">All payments verified</p>
                <p className="text-xs text-success/80">You're all caught up!</p>
              </div>
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
                <Card key={payment.id} padding="md" className="hover:ring-1 hover:ring-ink/10 transition-all">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="font-semibold text-sm">
                          {booking.contact_name}
                        </p>
                        {isVerified ? (
                          <Badge variant="success">✓ Verified</Badge>
                        ) : (
                          <Badge variant="warning">Pending</Badge>
                        )}
                      </div>
                      <div className="text-xs text-ink-muted space-y-1">
                        <p className="font-medium">
                          {rideDate.toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}{" "}
                          · Slot {session.time_slot_id} · {booking.group_type}
                        </p>
                        <p>
                          {booking.rider_count} rider{booking.rider_count !== 1 ? "s" : ""} · Booked{" "}
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
                      <p className="text-xs text-ink-muted mb-2">THB</p>

                      {!isVerified && (
                        <button
                          onClick={() =>
                            handleVerify(payment.id, booking.id)
                          }
                          disabled={verifying === payment.id}
                          className="w-full px-3 py-1.5 rounded-lg bg-success text-white text-xs font-semibold hover:bg-success/90 transition-colors disabled:opacity-50"
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
      <div>
        <h3 className="text-sm font-semibold text-ink-muted mb-3">QUICK ACTIONS</h3>
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
            href="/admin/settings?tab=staff"
            icon={Users}
            label="Manage Staff"
          />
        </div>
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
    <Card padding="md" className={alert ? "ring-2 ring-warning/30 bg-warning/5" : ""}>
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
      <p className="text-xs font-semibold text-ink-muted uppercase tracking-wider mt-3">
        {label}
      </p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      <p className="text-xs text-ink-muted mt-1">{sub}</p>
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
      className="flex items-center gap-2.5 p-4 rounded-xl bg-surface border border-sand/60 hover:bg-sand/20 hover:border-ink/10 transition-all group"
    >
      <Icon className="h-4 w-4 text-ink-muted group-hover:text-ink transition-colors" />
      <span className="text-sm font-medium">{label}</span>
      <ChevronRight className="h-3.5 w-3.5 ml-auto text-ink-muted group-hover:text-ink transition-colors" />
    </Link>
  );
}
