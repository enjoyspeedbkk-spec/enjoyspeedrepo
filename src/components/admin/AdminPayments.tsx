"use client";

import { useState } from "react";
import {
  CreditCard,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  ExternalLink,
  Phone,
  ChevronDown,
  Eye,
  Filter,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { verifyPayment } from "@/lib/actions/admin";
import { TIME_SLOTS } from "@/lib/constants";

const STATUS_TABS = [
  { value: "pending", label: "Pending", icon: Clock },
  { value: "paid", label: "Paid (Unverified)", icon: CreditCard },
  { value: "verified", label: "Verified", icon: CheckCircle2 },
  { value: "all", label: "All", icon: Filter },
];

const STATUS_BADGES: Record<
  string,
  { variant: "success" | "warning" | "accent" | "default" | "sky"; label: string }
> = {
  pending: { variant: "warning", label: "Pending" },
  paid: { variant: "sky", label: "Paid" },
  verified: { variant: "success", label: "Verified" },
  refunded: { variant: "default", label: "Refunded" },
  partially_refunded: { variant: "default", label: "Partial Refund" },
  failed: { variant: "default", label: "Failed" },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function AdminPayments({
  pendingPayments,
  allPayments,
}: {
  pendingPayments: any[];
  allPayments: any[];
}) {
  const [tab, setTab] = useState("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [verifying, setVerifying] = useState<string | null>(null);
  const [verified, setVerified] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const displayPayments = tab === "pending" ? pendingPayments : allPayments;

  const filtered = displayPayments.filter((p) => {
    // Status filter
    if (tab !== "all" && tab !== "pending") {
      if (p.status !== tab) return false;
    }
    // Exclude already-client-verified from pending
    if (tab === "pending" && verified.has(p.id)) return false;

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const booking = p.bookings;
      return (
        booking?.contact_name?.toLowerCase().includes(q) ||
        booking?.contact_phone?.includes(q) ||
        p.id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleVerify = async (paymentId: string, bookingId: string) => {
    setVerifying(paymentId);
    const result = await verifyPayment(paymentId, bookingId);
    setVerifying(null);
    if (result.success) {
      setVerified((prev) => new Set(prev).add(paymentId));
    }
  };

  const pendingCount = pendingPayments.filter((p) => !verified.has(p.id)).length;
  const pendingTotal = pendingPayments
    .filter((p) => !verified.has(p.id))
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Payments</h1>
        <p className="text-sm text-ink-muted mt-1">
          {pendingCount > 0 ? (
            <span className="text-warning font-medium">
              {pendingCount} pending · {pendingTotal.toLocaleString()} THB awaiting verification
            </span>
          ) : (
            <span className="text-success">All payments verified</span>
          )}
        </p>
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or phone..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border-2 border-sand/60 bg-surface text-sm placeholder:text-ink-muted/50 focus:border-ink focus:outline-none transition-colors"
          />
        </div>
        <div className="flex gap-1.5">
          {STATUS_TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                tab === t.value
                  ? "bg-ink text-cream"
                  : "bg-surface border border-sand/60 text-ink-muted hover:bg-sand/20"
              }`}
            >
              <t.icon className="h-3 w-3" />
              {t.label}
              {t.value === "pending" && pendingCount > 0 && (
                <span className="ml-1 bg-warning/20 text-warning text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Payments list */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <Card padding="lg">
            <div className="flex items-center justify-center gap-3 text-ink-muted py-4">
              <CheckCircle2 className="h-5 w-5 text-success" />
              <p className="text-sm">
                {tab === "pending"
                  ? "No pending payments. You're all caught up!"
                  : "No payments match your filters."}
              </p>
            </div>
          </Card>
        ) : (
          filtered.map((payment) => {
            const booking = payment.bookings;
            const session = booking?.ride_sessions;
            const isVerifiedClient = verified.has(payment.id);
            const status = isVerifiedClient ? "verified" : payment.status;
            const badge = STATUS_BADGES[status] || STATUS_BADGES.pending;
            const isExpanded = expandedId === payment.id;
            const slot = TIME_SLOTS.find((s) => s.id === session?.time_slot_id);

            return (
              <Card key={payment.id} padding="sm" className="overflow-hidden">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : payment.id)}
                  className="w-full flex items-center gap-3 p-3 text-left hover:bg-sand/10 transition-colors rounded-xl"
                >
                  {/* Amount */}
                  <div className="w-16 text-right flex-shrink-0">
                    <p className="font-bold text-lg text-accent leading-none">
                      {payment.amount.toLocaleString()}
                    </p>
                    <p className="text-[9px] text-ink-muted mt-0.5">THB</p>
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm truncate">
                        {booking?.contact_name || "Unknown"}
                      </span>
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                    </div>
                    <p className="text-xs text-ink-muted mt-0.5">
                      {session
                        ? `${new Date(session.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })} · ${slot?.label || session.time_slot_id}`
                        : ""}{" "}
                      · {booking?.group_type} · {booking?.rider_count} riders · via{" "}
                      {payment.method || "promptpay"}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {status === "pending" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleVerify(payment.id, booking.id);
                        }}
                        disabled={verifying === payment.id}
                        className="px-3 py-1.5 rounded-lg bg-success text-white text-xs font-semibold hover:bg-success/90 transition-colors disabled:opacity-50"
                      >
                        {verifying === payment.id ? "..." : "✓ Verify"}
                      </button>
                    )}
                    <ChevronDown
                      className={`h-4 w-4 text-ink-muted transition-transform ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                </button>

                {/* Expanded */}
                {isExpanded && (
                  <div className="px-3 pb-4 pt-1 border-t border-sand/40 space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <p className="text-ink-muted mb-0.5">Payment ID</p>
                        <p className="font-mono text-[11px]">
                          {payment.id.slice(0, 12)}...
                        </p>
                      </div>
                      <div>
                        <p className="text-ink-muted mb-0.5">Booking ID</p>
                        <p className="font-mono text-[11px]">
                          {booking?.id?.slice(0, 12)}...
                        </p>
                      </div>
                      <div>
                        <p className="text-ink-muted mb-0.5">Created</p>
                        <p>
                          {new Date(payment.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      {payment.verified_at && (
                        <div>
                          <p className="text-ink-muted mb-0.5">Verified</p>
                          <p>
                            {new Date(payment.verified_at).toLocaleDateString(
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
                      )}
                      {booking?.contact_phone && (
                        <div>
                          <p className="text-ink-muted mb-0.5">Phone</p>
                          <a
                            href={`tel:${booking.contact_phone}`}
                            className="flex items-center gap-1 text-sky hover:text-sky-dark"
                          >
                            <Phone className="h-3 w-3" />
                            {booking.contact_phone}
                          </a>
                        </div>
                      )}
                      <div>
                        <p className="text-ink-muted mb-0.5">Ride Total</p>
                        <p className="font-semibold">
                          {booking?.ride_total?.toLocaleString()} THB
                        </p>
                      </div>
                    </div>

                    {/* Payment slip */}
                    {payment.slip_image_url && (
                      <a
                        href={payment.slip_image_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-sky/10 text-sky text-xs font-medium hover:bg-sky/20 transition-colors"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View Payment Slip
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}

                    {/* Verify button (in expanded view too) */}
                    {status === "pending" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            handleVerify(payment.id, booking.id)
                          }
                          disabled={verifying === payment.id}
                          className="px-4 py-2 rounded-lg bg-success text-white text-sm font-semibold hover:bg-success/90 transition-colors disabled:opacity-50"
                        >
                          {verifying === payment.id
                            ? "Verifying..."
                            : "✓ Verify Payment"}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
