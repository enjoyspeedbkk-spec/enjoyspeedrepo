"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarDays,
  Clock,
  Users,
  MapPin,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ChevronRight,
  Star,
  CloudRain,
  Gift,
  Bike,
  Zap,
  Crown,
  MessageCircle,
  RotateCcw,
  CreditCard,
  Sparkles,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { TIME_SLOTS, RIDE_PACKAGES, STARTER_KIT, READY_TO_RIDE, LINE_OA } from "@/lib/constants";
import { BookingDetailSheet } from "@/components/bookings/BookingDetailSheet";
import { ReviewForm } from "@/components/bookings/ReviewForm";
import type { BookingWithDetails } from "@/lib/actions/bookings";

type TabId = "upcoming" | "completed" | "cancelled";

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; icon: typeof CheckCircle2 }
> = {
  pending: {
    label: "Payment Pending",
    color: "text-warning bg-warning/10",
    icon: CreditCard,
  },
  confirmed: {
    label: "Confirmed",
    color: "text-success bg-success/10",
    icon: CheckCircle2,
  },
  rider_details: {
    label: "Rider Info Needed",
    color: "text-sky bg-sky/10",
    icon: Users,
  },
  ready: {
    label: "Ready to Ride",
    color: "text-success bg-success/10",
    icon: Sparkles,
  },
  completed: {
    label: "Completed",
    color: "text-accent bg-accent/10",
    icon: Star,
  },
  cancelled: {
    label: "Cancelled",
    color: "text-error bg-error/10",
    icon: XCircle,
  },
  no_show: {
    label: "No Show",
    color: "text-ink-muted bg-sand/40",
    icon: AlertCircle,
  },
};

const PACKAGE_ICONS: Record<string, typeof Star> = {
  duo: Star,
  squad: Zap,
  peloton: Crown,
};

interface BookingsDashboardProps {
  upcoming: BookingWithDetails[];
  completed: BookingWithDetails[];
  cancelled: BookingWithDetails[];
  userName: string;
}

function getDaysUntil(dateStr: string): number {
  const ride = new Date(dateStr);
  const now = new Date();
  return Math.ceil((ride.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function getSlotLabel(slotId: string): string {
  return TIME_SLOTS.find((s) => s.id === slotId)?.label || slotId;
}

function getSlotTime(slotId: string): string {
  const slot = TIME_SLOTS.find((s) => s.id === slotId);
  return slot ? `${slot.startTime} — ${slot.endTime}` : "";
}

function getPackageName(type: string): string {
  return RIDE_PACKAGES.find((p) => p.type === type)?.name || type;
}

export function BookingsDashboard({
  upcoming,
  completed,
  cancelled,
  userName,
}: BookingsDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabId>("upcoming");
  const [selectedBooking, setSelectedBooking] =
    useState<BookingWithDetails | null>(null);
  const [showReviewFor, setShowReviewFor] = useState<string | null>(null);

  const tabs: { id: TabId; label: string; count: number; icon: typeof Zap }[] = [
    { id: "upcoming", label: "Upcoming", count: upcoming.length, icon: Zap },
    {
      id: "completed",
      label: "Completed",
      count: completed.length,
      icon: Star,
    },
    {
      id: "cancelled",
      label: "Cancelled",
      count: cancelled.length,
      icon: XCircle,
    },
  ];

  const activeBookings =
    activeTab === "upcoming"
      ? upcoming
      : activeTab === "completed"
      ? completed
      : cancelled;

  const hasAny = upcoming.length + completed.length + cancelled.length > 0;

  return (
    <section className="min-h-screen pt-24 pb-16 bg-cream">
      <div className="mx-auto max-w-3xl px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Badge variant="accent">My Bookings</Badge>
          <h1 className="mt-4 text-3xl font-bold">
            {userName ? `Hey ${userName.split(" ")[0]}` : "Your rides"}
          </h1>
          <p className="mt-1 text-ink-muted text-sm">
            {upcoming.length > 0
              ? `You have ${upcoming.length} upcoming ride${upcoming.length > 1 ? "s" : ""}.`
              : "No upcoming rides — ready to book one?"}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === tab.id
                  ? "bg-ink text-cream shadow-md"
                  : "bg-surface border border-sand/60 text-ink-muted hover:bg-sand/20"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
              {tab.count > 0 && (
                <span
                  className={`ml-1 text-xs px-1.5 py-0.5 rounded-full font-bold ${
                    activeTab === tab.id
                      ? "bg-cream/20 text-cream"
                      : "bg-sand/40 text-ink-muted"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Booking Cards */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {activeBookings.length === 0 ? (
              <EmptyState tab={activeTab} />
            ) : (
              activeBookings.map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  isCompleted={activeTab === "completed"}
                  onViewDetails={() => setSelectedBooking(booking)}
                  onReview={() => setShowReviewFor(booking.id)}
                />
              ))
            )}
          </motion.div>
        </AnimatePresence>

        {/* Quick Rebook CTA */}
        {completed.length > 0 && activeTab === "completed" && (
          <div className="mt-8 p-5 rounded-2xl bg-gradient-to-r from-accent/5 to-sky/5 border border-accent/20">
            <div className="flex items-center gap-3">
              <RotateCcw className="h-5 w-5 text-accent" />
              <div className="flex-1">
                <p className="font-semibold text-sm">Loved your last ride?</p>
                <p className="text-xs text-ink-muted">
                  Book the same experience with one tap.
                </p>
              </div>
              <Button variant="secondary" size="sm" arrow>
                Rebook
              </Button>
            </div>
          </div>
        )}

        {/* No bookings at all */}
        {!hasAny && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/10 mb-4">
              <Bike className="h-8 w-8 text-accent" />
            </div>
            <h2 className="text-xl font-bold mb-2">No bookings yet</h2>
            <p className="text-ink-muted text-sm mb-6 max-w-sm mx-auto">
              Book your first guided cycling session on Bangkok&apos;s Skylane.
              It takes just 3 minutes.
            </p>
            <Button variant="secondary" size="lg" arrow>
              <a href="/booking">Book Your First Ride</a>
            </Button>
          </div>
        )}
      </div>

      {/* Detail Sheet */}
      {selectedBooking && (
        <BookingDetailSheet
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
        />
      )}

      {/* Review Form */}
      {showReviewFor && (
        <ReviewForm
          bookingId={showReviewFor}
          onClose={() => setShowReviewFor(null)}
        />
      )}
    </section>
  );
}

// ======== Booking Card ========
function BookingCard({
  booking,
  isCompleted,
  onViewDetails,
  onReview,
}: {
  booking: BookingWithDetails;
  isCompleted: boolean;
  onViewDetails: () => void;
  onReview: () => void;
}) {
  const statusInfo = STATUS_CONFIG[booking.status] || STATUS_CONFIG.pending;
  const StatusIcon = statusInfo.icon;
  const PackageIcon = PACKAGE_ICONS[booking.group_type] || Star;
  const daysUntil = getDaysUntil(booking.ride_date);
  const isPending = booking.status === "pending";
  const isWeatherWarning = booking.weather_status === "warning";

  const rideDate = new Date(booking.ride_date);
  const dateStr = rideDate.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <Card padding="md" hover className="relative">
      {/* Weather warning banner */}
      {isWeatherWarning && (
        <div className="flex items-center gap-2 p-2.5 -mx-6 -mt-6 mb-4 px-6 rounded-t-2xl bg-warning/10 border-b border-warning/20">
          <CloudRain className="h-4 w-4 text-warning" />
          <p className="text-xs font-medium text-warning">
            Weather advisory — {booking.weather_note || "rain possible, monitoring"}
          </p>
        </div>
      )}

      <div className="flex items-start justify-between gap-4">
        {/* Left: Date column */}
        <div className="flex-shrink-0 text-center">
          <div
            className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center ${
              isCompleted ? "bg-accent/10" : "bg-ink text-cream"
            }`}
          >
            <span
              className={`text-lg font-bold leading-none ${
                isCompleted ? "text-accent" : ""
              }`}
            >
              {rideDate.getDate()}
            </span>
            <span
              className={`text-[10px] font-medium uppercase ${
                isCompleted ? "text-accent/60" : "text-cream/60"
              }`}
            >
              {rideDate.toLocaleDateString("en-US", { month: "short" })}
            </span>
          </div>
          {!isCompleted && daysUntil > 0 && (
            <p className="text-[10px] text-ink-muted mt-1 font-medium">
              {daysUntil === 1 ? "Tomorrow" : `${daysUntil} days`}
            </p>
          )}
        </div>

        {/* Middle: Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-base truncate">
              {getSlotLabel(booking.time_slot_id)}
            </h3>
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${statusInfo.color}`}
            >
              <StatusIcon className="h-3 w-3" />
              {statusInfo.label}
            </span>
          </div>

          <div className="space-y-1 text-xs text-ink-muted">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3 w-3" />
              <span>
                {dateStr} · {getSlotTime(booking.time_slot_id)}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <PackageIcon className="h-3 w-3" />
              <span>
                {getPackageName(booking.group_type)} · {booking.rider_count}{" "}
                rider{booking.rider_count > 1 ? "s" : ""}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3 w-3" />
              <span>Skylane, Suvarnabhumi</span>
            </div>
          </div>

          {/* Rider chips */}
          {booking.riders.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {booking.riders.map((r) => (
                <span
                  key={r.id}
                  className="inline-flex items-center gap-1 text-[10px] bg-sand/30 px-2 py-0.5 rounded-full"
                >
                  {r.nickname || r.name.split(" ")[0]}
                  <span className="text-ink-muted/60">
                    {r.bike_preference === "own" ? "🚲" : r.bike_preference === "road" ? "🏎️" : "🚴"}
                  </span>
                </span>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 mt-3">
            {isPending && (
              <a href={`/bookings/${booking.id}/pay`}>
                <Button variant="secondary" size="sm">
                  Complete Payment
                </Button>
              </a>
            )}
            {isCompleted && (
              <button
                onClick={onReview}
                className="flex items-center gap-1 text-xs font-semibold text-accent hover:text-accent-dark transition-colors"
              >
                <Star className="h-3.5 w-3.5" />
                Rate & Review
              </button>
            )}
            <button
              onClick={onViewDetails}
              className="flex items-center gap-1 text-xs font-semibold text-ink-muted hover:text-ink transition-colors"
            >
              Details
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Right: Price */}
        <div className="text-right flex-shrink-0">
          <p className="font-bold text-base">
            {booking.ride_total.toLocaleString()}
          </p>
          <p className="text-[10px] text-ink-muted">THB</p>
        </div>
      </div>
    </Card>
  );
}

// ======== Empty State ========
function EmptyState({ tab }: { tab: TabId }) {
  const config = {
    upcoming: {
      icon: CalendarDays,
      title: "No upcoming rides",
      desc: "Book a session and it will appear here.",
      cta: "Book a Ride",
      href: "/booking",
    },
    completed: {
      icon: Star,
      title: "No completed rides yet",
      desc: "After your first ride, you'll see your stats and reviews here.",
      cta: null,
      href: null,
    },
    cancelled: {
      icon: XCircle,
      title: "No cancelled bookings",
      desc: "That's a good thing! All your rides are on track.",
      cta: null,
      href: null,
    },
  };

  const c = config[tab];

  return (
    <div className="text-center py-12">
      <c.icon className="h-10 w-10 text-ink-muted/30 mx-auto mb-3" />
      <h3 className="font-semibold text-ink mb-1">{c.title}</h3>
      <p className="text-sm text-ink-muted mb-4">{c.desc}</p>
      {c.cta && c.href && (
        <a href={c.href}>
          <Button variant="secondary" size="sm" arrow>
            {c.cta}
          </Button>
        </a>
      )}
    </div>
  );
}
