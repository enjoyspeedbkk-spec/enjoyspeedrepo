"use client";

import { useState } from "react";
import {
  CalendarDays,
  Search,
  Filter,
  Users,
  ChevronDown,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  CreditCard,
  Bike,
  Phone,
  Mail,
  Sparkles,
  Loader2,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { updateBookingStatus } from "@/lib/actions/admin";
import { TIME_SLOTS } from "@/lib/constants";
import { formatDate } from "@/lib/format";

const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "pending", label: "Payment Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "rider_details", label: "Rider Details" },
  { value: "ready", label: "Ready" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "no_show", label: "No Show" },
];

const STATUS_BADGES: Record<string, { variant: "success" | "warning" | "accent" | "default" | "sky"; label: string }> = {
  pending: { variant: "warning", label: "Payment Pending" },
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

                    {/* Status change */}
                    <div>
                      <p className="text-xs font-semibold text-ink-muted mb-2">
                        Change Status
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          "confirmed",
                          "rider_details",
                          "ready",
                          "completed",
                          "cancelled",
                          "no_show",
                        ].map((s) => {
                          const isDestructive = s === "cancelled" || s === "no_show";
                          const isUpdating = updating === booking.id;
                          return (
                            <button
                              key={s}
                              disabled={
                                booking.status === s || updating === booking.id
                              }
                              onClick={() => {
                                if (isDestructive) {
                                  setConfirmDialog({
                                    open: true,
                                    bookingId: booking.id,
                                    newStatus: s,
                                    contactName: booking.contact_name,
                                  });
                                } else {
                                  handleStatusChange(booking.id, s);
                                }
                              }}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                booking.status === s
                                  ? "bg-ink text-cream"
                                  : isDestructive
                                    ? "bg-surface border border-error/30 text-error hover:bg-error/5 disabled:opacity-30"
                                    : "bg-surface border border-sand/60 text-ink-muted hover:bg-sand/20 disabled:opacity-30"
                              }`}
                            >
                              {isUpdating ? <><Loader2 className="h-3 w-3 animate-spin inline mr-1" /> {s.replace("_", " ")}</> : s.replace("_", " ")}
                            </button>
                          );
                        })}
                      </div>
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
          title={`Mark as ${confirmDialog.newStatus.replace("_", " ")}?`}
          description={`This will change ${confirmDialog.contactName}'s booking status to "${confirmDialog.newStatus.replace("_", " ")}".`}
          detail={confirmDialog.newStatus === "cancelled" ? "The customer will need to rebook if this is reversed." : undefined}
          variant="danger"
          confirmLabel={confirmDialog.newStatus === "cancelled" ? "Cancel Booking" : "Mark No Show"}
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
