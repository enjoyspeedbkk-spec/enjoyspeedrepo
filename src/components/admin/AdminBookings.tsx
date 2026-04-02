"use client";

import { useState } from "react";
import {
  Search,
  ChevronDown,
  CheckCircle2,
  Clock,
  Bike,
  Phone,
  Mail,
  Loader2,
  CreditCard,
  UserCheck,
  ClipboardCheck,
  Flag,
  Ban,
  EyeOff,
  PartyPopper,
  ArrowRight,
  Send,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { updateBookingStatus } from "@/lib/actions/admin";
import { TIME_SLOTS } from "@/lib/constants";
import { formatDate } from "@/lib/format";

// ── Status pipeline: the "happy path" a booking travels through ──
const STATUS_PIPELINE = [
  { value: "pending", label: "Pending", shortLabel: "Pending", icon: Clock, color: "text-amber-600", bg: "bg-amber-50", ring: "ring-amber-200", activeBg: "bg-amber-500" },
  { value: "confirmed", label: "Confirmed", shortLabel: "Paid", icon: CreditCard, color: "text-emerald-600", bg: "bg-emerald-50", ring: "ring-emerald-200", activeBg: "bg-emerald-500" },
  { value: "rider_details", label: "Rider Details", shortLabel: "Details", icon: UserCheck, color: "text-sky-600", bg: "bg-sky-50", ring: "ring-sky-200", activeBg: "bg-sky-500" },
  { value: "ready", label: "Ready to Ride", shortLabel: "Ready", icon: ClipboardCheck, color: "text-emerald-600", bg: "bg-emerald-50", ring: "ring-emerald-200", activeBg: "bg-emerald-500" },
  { value: "completed", label: "Completed", shortLabel: "Done", icon: Flag, color: "text-violet-600", bg: "bg-violet-50", ring: "ring-violet-200", activeBg: "bg-violet-500" },
] as const;

const TERMINAL_STATUSES = [
  { value: "cancelled", label: "Cancelled", icon: Ban, color: "text-red-500" },
  { value: "no_show", label: "No Show", icon: EyeOff, color: "text-zinc-500" },
] as const;

const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  ...STATUS_PIPELINE.map((s) => ({ value: s.value, label: s.label })),
  ...TERMINAL_STATUSES.map((s) => ({ value: s.value, label: s.label })),
];

const STATUS_BADGES: Record<string, { variant: "success" | "warning" | "accent" | "default" | "sky"; label: string }> = {
  pending: { variant: "warning", label: "Pending" },
  confirmed: { variant: "success", label: "Confirmed" },
  rider_details: { variant: "sky", label: "Rider Details" },
  ready: { variant: "success", label: "Ready" },
  completed: { variant: "accent", label: "Completed" },
  cancelled: { variant: "default", label: "Cancelled" },
  no_show: { variant: "default", label: "No Show" },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function AdminBookings({ initialBookings }: { initialBookings: any[] }) {
  const toast = useToast();
  const [bookings, setBookings] = useState(initialBookings);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    bookingId: string;
    newStatus: string;
    contactName: string;
    isFinal?: boolean;
  } | null>(null);

  const filtered = bookings.filter((b) => {
    if (statusFilter !== "all" && b.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        b.contact_name?.toLowerCase().includes(q) ||
        b.id.toLowerCase().includes(q) ||
        b.riders?.some((r: { name: string }) => r.name.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleStatusChange = async (bookingId: string, newStatus: string) => {
    setUpdating(bookingId);
    const result = await updateBookingStatus(bookingId, newStatus);
    setUpdating(null);
    if (result.success) {
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b))
      );
      toast.success(`Booking status updated to ${newStatus}`);
    } else {
      toast.error("Failed to update booking status");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Bookings</h1>
        <p className="text-sm text-ink-muted mt-1">
          {bookings.length} total booking{bookings.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or booking ID..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border-2 border-sand/60 bg-surface text-sm placeholder:text-ink-muted/70 focus:border-ink focus:outline-none transition-colors"
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={`px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                statusFilter === opt.value
                  ? "bg-ink text-cream"
                  : "bg-surface border border-sand/60 text-ink-muted hover:bg-sand/20"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bookings list */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <Card padding="lg">
            <p className="text-center text-ink-muted text-sm">
              No bookings match your filters.
            </p>
          </Card>
        ) : (
          filtered.map((booking) => {
            const isExpanded = expandedId === booking.id;
            const session = booking.ride_sessions;
            const riders = booking.riders || [];
            const payments = booking.payments || [];
            const profile = booking.profiles;
            const slot = TIME_SLOTS.find((s) => s.id === session?.time_slot_id);
            const statusBadge = STATUS_BADGES[booking.status] || STATUS_BADGES.pending;

            return (
              <Card key={booking.id} padding="sm" className="overflow-hidden">
                {/* Summary row */}
                <button
                  onClick={() =>
                    setExpandedId(isExpanded ? null : booking.id)
                  }
                  className="w-full flex items-center gap-3 p-3 text-left hover:bg-sand/10 transition-colors rounded-xl"
                >
                  {/* Date */}
                  <div className="w-12 h-12 rounded-lg bg-ink text-cream flex flex-col items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold leading-none">
                      {session ? new Date(session.date).getDate() : "?"}
                    </span>
                    <span className="text-[10px] uppercase text-cream/70">
                      {session
                        ? formatDate(session.date, "short").split(" ")[0]
                        : ""}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm truncate">
                        {booking.contact_name}
                      </span>
                      {booking.is_test && (
                        <Badge variant="warning">TEST</Badge>
                      )}
                      <Badge variant={statusBadge.variant}>
                        {statusBadge.label}
                      </Badge>
                    </div>
                    <p className="text-xs text-ink-muted mt-0.5">
                      {slot?.label || session?.time_slot_id} ·{" "}
                      {booking.group_type} · {booking.rider_count} riders ·{" "}
                      {booking.ride_total.toLocaleString()} THB
                    </p>
                  </div>

                  <ChevronDown
                    className={`h-4 w-4 text-ink-muted transition-transform ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="px-3 pb-4 pt-1 border-t border-sand/40 space-y-4">
                    {/* Contact info */}
                    <div className="flex flex-wrap gap-3 text-xs">
                      {booking.contact_phone && (
                        <a
                          href={`tel:${booking.contact_phone}`}
                          className="flex items-center gap-1 text-sky hover:text-sky-dark"
                        >
                          <Phone className="h-3 w-3" />
                          {booking.contact_phone}
                        </a>
                      )}
                      {booking.contact_email && (
                        <a
                          href={`mailto:${booking.contact_email}`}
                          className="flex items-center gap-1 text-sky hover:text-sky-dark"
                        >
                          <Mail className="h-3 w-3" />
                          {booking.contact_email}
                        </a>
                      )}
                      <span className="text-ink-muted font-mono">
                        #{booking.id.slice(0, 8)}
                      </span>
                    </div>

                    {/* Riders */}
                    {riders.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-ink-muted mb-2">
                          Riders
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {riders.map((r: { id: string; name: string; nickname: string | null; bike_preference: string; bike_rental_price: number; waiver_accepted: boolean }) => (
                            <div
                              key={r.id}
                              className="flex items-center justify-between p-2 rounded-lg bg-sand/20 text-xs"
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-medium">
                                  {r.nickname || r.name}
                                </span>
                                {r.waiver_accepted && (
                                  <CheckCircle2 className="h-3 w-3 text-success" />
                                )}
                              </div>
                              <div className="flex items-center gap-1 text-ink-muted">
                                <Bike className="h-3 w-3" />
                                {r.bike_preference}
                                {r.bike_rental_price > 0 &&
                                  ` (${r.bike_rental_price.toLocaleString()} THB)`}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Payment info */}
                    {payments.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-ink-muted mb-2">
                          Payment
                        </p>
                        {payments.map((p: { id: string; amount: number; status: string; method: string; slip_url: string | null; verified_at: string | null }) => (
                          <div
                            key={p.id}
                            className="flex items-center justify-between p-2 rounded-lg bg-sand/20 text-xs"
                          >
                            <div>
                              <span className="font-medium">
                                {p.amount.toLocaleString()} THB
                              </span>
                              <span className="text-ink-muted ml-2">
                                via {p.method}
                              </span>
                            </div>
                            <Badge
                              variant={
                                p.status === "verified"
                                  ? "success"
                                  : p.status === "paid"
                                  ? "sky"
                                  : "warning"
                              }
                            >
                              {p.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Status pipeline stepper */}
                    <div>
                      <p className="text-xs font-semibold text-ink-muted mb-3">
                        Progress
                      </p>

                      {/* Pipeline: visual step indicator */}
                      {booking.status !== "cancelled" && booking.status !== "no_show" ? (
                        <>
                          <div className="flex items-center gap-0 mb-3">
                            {STATUS_PIPELINE.map((step, i) => {
                              const currentIdx = STATUS_PIPELINE.findIndex(s => s.value === booking.status);
                              const isActive = step.value === booking.status;
                              const isPast = i < currentIdx;
                              const isNext = i === currentIdx + 1;
                              const StepIcon = step.icon;
                              const isUpdating = updating === booking.id;

                              return (
                                <div key={step.value} className="flex items-center flex-1 min-w-0">
                                  {/* Step circle */}
                                  <button
                                    disabled={isActive || isPast || !isNext || isUpdating}
                                    onClick={() => {
                                      if (step.value === "completed") {
                                        setConfirmDialog({
                                          open: true,
                                          bookingId: booking.id,
                                          newStatus: "completed",
                                          contactName: booking.contact_name,
                                          isFinal: true,
                                        });
                                      } else {
                                        handleStatusChange(booking.id, step.value);
                                      }
                                    }}
                                    title={isNext ? `Advance to ${step.label}` : step.label}
                                    className={`relative flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                                      isActive
                                        ? `${step.activeBg} text-white shadow-md ring-2 ${step.ring} scale-110`
                                        : isPast
                                          ? "bg-emerald-500 text-white"
                                          : isNext
                                            ? `${step.bg} ${step.color} ring-2 ${step.ring} cursor-pointer hover:scale-110 hover:shadow-md`
                                            : "bg-sand/30 text-ink-muted/40"
                                    } disabled:cursor-default`}
                                  >
                                    {isUpdating && isNext ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : isPast ? (
                                      <CheckCircle2 className="h-4 w-4" />
                                    ) : (
                                      <StepIcon className="h-4 w-4" />
                                    )}
                                  </button>
                                  {/* Connector line */}
                                  {i < STATUS_PIPELINE.length - 1 && (
                                    <div className={`flex-1 h-0.5 mx-1 rounded-full transition-colors ${
                                      i < currentIdx ? "bg-emerald-400" : "bg-sand/40"
                                    }`} />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                          {/* Step labels */}
                          <div className="flex items-start gap-0 mb-4">
                            {STATUS_PIPELINE.map((step, i) => {
                              const currentIdx = STATUS_PIPELINE.findIndex(s => s.value === booking.status);
                              const isActive = step.value === booking.status;
                              const isNext = i === currentIdx + 1;
                              return (
                                <div key={step.value} className="flex-1 min-w-0 text-center">
                                  <span className={`text-[10px] leading-tight ${
                                    isActive ? "font-bold text-ink" : isNext ? `font-semibold ${step.color}` : "text-ink-muted/50"
                                  }`}>
                                    {step.shortLabel}
                                  </span>
                                </div>
                              );
                            })}
                          </div>

                          {/* Next action button — prominent CTA */}
                          {(() => {
                            const currentIdx = STATUS_PIPELINE.findIndex(s => s.value === booking.status);
                            const nextStep = STATUS_PIPELINE[currentIdx + 1];
                            if (!nextStep || booking.status === "completed") return null;
                            const NextIcon = nextStep.icon;
                            return (
                              <button
                                disabled={updating === booking.id}
                                onClick={() => {
                                  if (nextStep.value === "completed") {
                                    setConfirmDialog({
                                      open: true,
                                      bookingId: booking.id,
                                      newStatus: "completed",
                                      contactName: booking.contact_name,
                                      isFinal: true,
                                    });
                                  } else {
                                    handleStatusChange(booking.id, nextStep.value);
                                  }
                                }}
                                className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:shadow-md active:scale-[0.98] disabled:opacity-50 ${nextStep.activeBg}`}
                              >
                                {updating === booking.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <NextIcon className="h-4 w-4" />
                                    Advance to {nextStep.label}
                                    <ArrowRight className="h-3.5 w-3.5 ml-auto" />
                                  </>
                                )}
                              </button>
                            );
                          })()}

                          {/* Terminal actions — less prominent, at bottom */}
                          <div className="flex gap-2 mt-3 pt-3 border-t border-sand/30">
                            {TERMINAL_STATUSES.map((ts) => {
                              const TsIcon = ts.icon;
                              return (
                                <button
                                  key={ts.value}
                                  disabled={updating === booking.id}
                                  onClick={() =>
                                    setConfirmDialog({
                                      open: true,
                                      bookingId: booking.id,
                                      newStatus: ts.value,
                                      contactName: booking.contact_name,
                                    })
                                  }
                                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-sand/40 ${ts.color} hover:bg-sand/10 transition-colors disabled:opacity-30`}
                                >
                                  <TsIcon className="h-3 w-3" />
                                  {ts.label}
                                </button>
                              );
                            })}
                          </div>
                        </>
                      ) : (
                        /* Terminal state — show badge and no pipeline */
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-sand/20">
                          {booking.status === "cancelled" ? (
                            <Ban className="h-5 w-5 text-red-500" />
                          ) : (
                            <EyeOff className="h-5 w-5 text-zinc-500" />
                          )}
                          <div>
                            <p className="text-sm font-semibold">
                              {booking.status === "cancelled" ? "Booking Cancelled" : "No Show"}
                            </p>
                            <p className="text-xs text-ink-muted">
                              This booking has been finalized.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Completed state — show survey info */}
                      {booking.status === "completed" && (
                        <div className="flex items-center gap-3 mt-3 p-3 rounded-xl bg-violet-50 border border-violet-200">
                          <Send className="h-4 w-4 text-violet-600 flex-shrink-0" />
                          <p className="text-xs text-violet-700">
                            Survey link was sent to the rider via LINE / email.
                          </p>
                        </div>
                      )}
                    </div>

                    {booking.special_requests && (
                      <div className="p-2 rounded-lg bg-accent/5 border border-accent/20 text-xs">
                        <p className="font-semibold text-accent-dark">
                          Special Requests:
                        </p>
                        <p className="text-ink-muted mt-0.5">
                          {booking.special_requests}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>

      {confirmDialog && (
        <ConfirmDialog
          open={confirmDialog.open}
          title={
            confirmDialog.isFinal
              ? "Complete this booking?"
              : `Mark as ${confirmDialog.newStatus.replace("_", " ")}?`
          }
          description={
            confirmDialog.isFinal
              ? `${confirmDialog.contactName}'s ride will be marked as completed. A feedback survey will be sent to the rider automatically.`
              : `This will change ${confirmDialog.contactName}'s booking status to "${confirmDialog.newStatus.replace("_", " ")}".`
          }
          detail={
            confirmDialog.isFinal
              ? "This action can't be undone."
              : confirmDialog.newStatus === "cancelled"
                ? "The customer will need to rebook if this is reversed."
                : undefined
          }
          variant={confirmDialog.isFinal ? "warning" : "danger"}
          confirmLabel={
            confirmDialog.isFinal
              ? "Yes, Complete & Send Survey"
              : confirmDialog.newStatus === "cancelled"
                ? "Cancel Booking"
                : "Mark No Show"
          }
          onConfirm={() => {
            handleStatusChange(confirmDialog.bookingId, confirmDialog.newStatus);
            setConfirmDialog(null);
          }}
          onCancel={() => setConfirmDialog(null)}
        />
      )}
    </div>
  );
}
