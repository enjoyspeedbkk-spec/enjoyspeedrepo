"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sun, CloudRain, XCircle, Users, Bike, CheckCircle2,
  Phone, AlertTriangle, ChevronDown, ChevronUp,
  UserCheck, Clock, Shirt, AlertCircle, ImageIcon, X,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { TIME_SLOTS } from "@/lib/constants";
import {
  checkInRider, bulkCheckInBooking, bulkWeatherCancel, adminCancelBooking, verifyPayment,
  checkWeatherNow, sendWeatherAlertToCustomers,
} from "@/lib/actions/admin";

interface RiderData {
  id: string;
  name: string;
  nickname: string | null;
  bike_preference: string;
  clothing_size: string | null;
  cycling_experience: string;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  checked_in: boolean;
  checked_in_at: string | null;
}

interface PaymentData {
  id: string;
  amount: number;
  status: string;
  slip_url: string | null;
}

interface BookingData {
  id: string;
  status: string;
  contact_name: string;
  contact_phone: string | null;
  contact_email: string | null;
  contact_line_id: string | null;
  group_type: string;
  rider_count: number;
  ride_total: number;
  rental_total: number;
  special_requests: string | null;
  ride_session_id: string;
  riders: RiderData[];
  payments: PaymentData[];
}

interface SessionData {
  id: string;
  date: string;
  time_slot_id: string;
  weather_status: string;
  is_available: boolean;
  is_blackout: boolean;
}

interface SlotData {
  session: SessionData | null;
  bookings: BookingData[];
}

interface TodayRidesProps {
  slots: Record<string, SlotData>;
}

const weatherIcons: Record<string, typeof Sun> = {
  clear: Sun,
  watch: CloudRain,
  warning: AlertTriangle,
  severe: XCircle,
  cancelled: XCircle,
};

const weatherColors: Record<string, string> = {
  clear: "text-success",
  watch: "text-sky-500",
  warning: "text-warning",
  severe: "text-error",
  cancelled: "text-error",
};

export function TodayRides({ slots }: TodayRidesProps) {
  const router = useRouter();
  const [expandedSlot, setExpandedSlot] = useState<string | null>(null);
  const [cancelModal, setCancelModal] = useState<{ type: "weather" | "booking"; slotId?: string; bookingId?: string } | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [slipPreview, setSlipPreview] = useState<{ url: string; amount: number; name: string; paymentId: string; bookingId: string } | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [localUpdates, setLocalUpdates] = useState<Record<string, boolean>>({});
  const [verifiedPayments, setVerifiedPayments] = useState<Set<string>>(new Set());

  // Weather check state
  const [checkingWeather, setCheckingWeather] = useState(false);
  const [weatherAlerts, setWeatherAlerts] = useState<Array<{
    date: string;
    slotLabel: string;
    severity: string;
    message: string;
    bookingCount: number;
    sessionId: string;
    timeSlotId: string;
  }>>([]);
  const [sendingAlert, setSendingAlert] = useState<string | null>(null);
  const [alertsSent, setAlertsSent] = useState<Set<string>>(new Set());

  const handleCheckWeather = async () => {
    setCheckingWeather(true);
    const result = await checkWeatherNow();
    if (result.success) {
      setWeatherAlerts(result.alerts.filter((a) => a.severity !== "clear"));
    }
    setCheckingWeather(false);
  };

  const handleSendAlert = async (sessionId: string, severity: string, message: string) => {
    setSendingAlert(sessionId);
    const result = await sendWeatherAlertToCustomers(
      sessionId,
      severity as "watch" | "warning",
      message
    );
    if (result.success) {
      setAlertsSent((prev) => new Set(prev).add(sessionId));
    }
    setSendingAlert(null);
  };

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  // Calculate bike prep summary across all slots
  const allBookings = Object.values(slots).flatMap((s) => s.bookings);
  const allRiders = allBookings.flatMap((b) => b.riders);
  const bikeCount = {
    hybrid: allRiders.filter((r) => r.bike_preference === "hybrid").length,
    road: allRiders.filter((r) => r.bike_preference === "road").length,
    own: allRiders.filter((r) => r.bike_preference === "own").length,
  };
  const totalRiders = allRiders.length;
  const checkedIn = allRiders.filter((r) => r.checked_in || localUpdates[r.id]).length;

  const handleCheckIn = async (riderId: string, value: boolean) => {
    setLocalUpdates((prev) => ({ ...prev, [riderId]: value }));
    await checkInRider(riderId, value);
  };

  const handleBulkCheckIn = async (bookingId: string) => {
    const booking = allBookings.find((b) => b.id === bookingId);
    if (!booking) return;
    for (const rider of booking.riders) {
      setLocalUpdates((prev) => ({ ...prev, [rider.id]: true }));
    }
    await bulkCheckInBooking(bookingId, true);
  };

  const handleWeatherCancel = async (slotIds: string[]) => {
    if (!cancelReason.trim()) return;
    setCancelling(true);
    const todayStr = new Date().toISOString().split("T")[0];
    await bulkWeatherCancel(todayStr, slotIds, cancelReason);
    setCancelling(false);
    setCancelModal(null);
    setCancelReason("");
    router.refresh();
  };

  const handleAdminCancel = async (bookingId: string) => {
    if (!cancelReason.trim()) return;
    setCancelling(true);
    await adminCancelBooking(bookingId, cancelReason, true);
    setCancelling(false);
    setCancelModal(null);
    setCancelReason("");
    router.refresh();
  };

  const handleVerifyFromSlip = async (paymentId: string, bookingId: string) => {
    setVerifying(true);
    await verifyPayment(paymentId, bookingId);
    setVerifiedPayments((prev) => new Set(prev).add(paymentId));
    setVerifying(false);
    setSlipPreview(null);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Clock className="h-5 w-5 text-accent" />
            Today&apos;s Rides
          </h2>
          <p className="text-xs text-ink-muted mt-0.5">{today}</p>
        </div>
        {totalRiders > 0 && (
          <div className="text-right">
            <p className="text-sm font-bold">{checkedIn}/{totalRiders} checked in</p>
            <div className="w-24 h-1.5 bg-sand/40 rounded-full mt-1 overflow-hidden">
              <div
                className="h-full bg-success rounded-full transition-all duration-500"
                style={{ width: `${totalRiders > 0 ? (checkedIn / totalRiders) * 100 : 0}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Weather Check Button */}
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="secondary"
          onClick={handleCheckWeather}
          disabled={checkingWeather}
          className="text-sm"
        >
          <CloudRain className={`h-4 w-4 mr-1.5 ${checkingWeather ? "animate-pulse" : ""}`} />
          {checkingWeather ? "Checking..." : "Check Weather"}
        </Button>
        {weatherAlerts.length > 0 && (
          <span className="text-xs text-ink-muted">
            {weatherAlerts.length} alert{weatherAlerts.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Weather Alerts Panel */}
      {weatherAlerts.length > 0 && (
        <div className="space-y-2">
          {weatherAlerts.map((alert) => {
            const Icon = weatherIcons[alert.severity] || AlertTriangle;
            const color = weatherColors[alert.severity] || "text-warning";
            const isSent = alertsSent.has(alert.sessionId);
            const isSending = sendingAlert === alert.sessionId;
            const isSevere = alert.severity === "severe";

            return (
              <div
                key={alert.sessionId}
                className={`p-3 rounded-xl border ${
                  isSevere
                    ? "bg-error/5 border-error/20"
                    : alert.severity === "warning"
                      ? "bg-warning/5 border-warning/20"
                      : "bg-sky/5 border-sky/20"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    <Icon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${color}`} />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ink">
                        {alert.date} — {alert.slotLabel}
                      </p>
                      <p className="text-xs text-ink-muted mt-0.5">{alert.message}</p>
                      <p className="text-xs text-ink-muted mt-1">
                        {alert.bookingCount} booking{alert.bookingCount !== 1 ? "s" : ""} affected
                      </p>
                    </div>
                  </div>
                  <div className="flex-shrink-0 flex gap-2">
                    {isSevere ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="text-xs text-error border-error/30"
                        onClick={() =>
                          setCancelModal({
                            type: "weather",
                            slotId: alert.timeSlotId,
                          })
                        }
                      >
                        Cancel Rides
                      </Button>
                    ) : isSent ? (
                      <span className="text-xs text-success flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Sent
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="text-xs"
                        disabled={isSending || alert.bookingCount === 0}
                        onClick={() =>
                          handleSendAlert(
                            alert.sessionId,
                            alert.severity,
                            alert.message
                          )
                        }
                      >
                        {isSending ? "Sending..." : "Notify Riders"}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Bike Prep Summary */}
      {totalRiders > 0 && (
        <div className="flex gap-3 text-xs">
          {bikeCount.hybrid > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky/10 text-sky-dark font-medium">
              <Bike className="h-3.5 w-3.5" /> {bikeCount.hybrid} Hybrid
            </div>
          )}
          {bikeCount.road > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/10 text-accent font-medium">
              <Bike className="h-3.5 w-3.5" /> {bikeCount.road} Road
            </div>
          )}
          {bikeCount.own > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sand/30 text-ink-muted font-medium">
              <Bike className="h-3.5 w-3.5" /> {bikeCount.own} Own
            </div>
          )}
        </div>
      )}

      {/* Slot Cards — only show slots with bookings, or collapsed empty summary */}
      {(() => {
        const slotsWithBookings = TIME_SLOTS.filter((slot) => {
          const slotData = slots[slot.id];
          return (slotData?.bookings || []).length > 0;
        });
        const emptySlots = TIME_SLOTS.filter((slot) => {
          const slotData = slots[slot.id];
          return (slotData?.bookings || []).length === 0;
        });

        return (
          <>
            {slotsWithBookings.length === 0 && (
              <Card padding="md" className="bg-sand/10 border border-sand/40">
                <div className="flex items-center gap-3 text-ink-muted">
                  <Clock className="h-5 w-5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-ink">No rides scheduled today</p>
                    <p className="text-sm mt-0.5">All {TIME_SLOTS.length} time slots are open and available for bookings.</p>
                  </div>
                </div>
              </Card>
            )}

            {slotsWithBookings.map((slot) => {
              const slotData = slots[slot.id];
              const session = slotData?.session;
              const bookings = slotData?.bookings || [];
              const riders = bookings.flatMap((b) => b.riders);
              const weather = session?.weather_status || "clear";
              const WeatherIcon = weatherIcons[weather] || Sun;
              const isExpanded = expandedSlot === slot.id;
              const hasBookings = bookings.length > 0;
              const isCancelled = weather === "cancelled" || session?.is_blackout;

              return (
                <Card
                  key={slot.id}
                  padding="md"
                  className={`transition-all ${
                    isCancelled ? "opacity-50" : hasBookings ? "ring-1 ring-ink/10" : ""
                  }`}
                >
                  {/* Slot header */}
                  <button
                    onClick={() => setExpandedSlot(isExpanded ? null : slot.id)}
                    className="w-full flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-center leading-none">
                        <p className="text-lg font-bold">{slot.id}</p>
                        <p className="text-[10px] text-ink-muted">{slot.startTime}</p>
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-semibold">{slot.label}</p>
                        <p className="text-xs text-ink-muted">
                          {slot.startTime} — {slot.endTime}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <WeatherIcon className={`h-4 w-4 ${weatherColors[weather]}`} />
                      <Badge variant="accent">
                        {riders.length} rider{riders.length !== 1 ? "s" : ""}
                      </Badge>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-ink-muted" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-ink-muted" />
                      )}
                    </div>
                  </button>

            {/* Expanded content */}
            {isExpanded && hasBookings && (
              <div className="mt-4 pt-4 border-t border-sand/60 space-y-4">
                {bookings.map((booking) => {
                  const payment = booking.payments?.[0];
                  const paymentVerified = payment?.status === "verified" || verifiedPayments.has(payment?.id);

                  return (
                    <div key={booking.id} className="space-y-3">
                      {/* Booking header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm">{booking.contact_name}</p>
                          <Badge variant={booking.status === "confirmed" ? "success" : "warning"}>
                            {booking.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          {booking.contact_phone && (
                            <a href={`tel:${booking.contact_phone}`} className="p-1.5 rounded-lg bg-sky/10 text-sky hover:bg-sky/20 transition-colors">
                              <Phone className="h-3.5 w-3.5" />
                            </a>
                          )}
                          <button
                            onClick={() => setCancelModal({ type: "booking", bookingId: booking.id })}
                            className="p-1.5 rounded-lg bg-error/10 text-error hover:bg-error/20 transition-colors"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Payment status + slip */}
                      {payment && !paymentVerified && (
                        <div className="flex items-center justify-between p-2.5 rounded-lg bg-warning/5 border border-warning/20">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-warning" />
                            <span className="text-xs font-medium">Payment: {payment.amount.toLocaleString()} THB — {payment.status}</span>
                          </div>
                          {payment.slip_url && (
                            <button
                              onClick={() => setSlipPreview({
                                url: payment.slip_url!,
                                amount: payment.amount,
                                name: booking.contact_name,
                                paymentId: payment.id,
                                bookingId: booking.id,
                              })}
                              className="flex items-center gap-1 text-xs font-semibold text-accent hover:text-accent-dark transition-colors"
                            >
                              <ImageIcon className="h-3.5 w-3.5" />
                              View Slip & Verify
                            </button>
                          )}
                        </div>
                      )}

                      {/* Riders checklist */}
                      <div className="space-y-1.5">
                        {booking.riders.map((rider) => {
                          const isChecked = rider.checked_in || localUpdates[rider.id];
                          return (
                            <div
                              key={rider.id}
                              className={`flex items-center justify-between p-2.5 rounded-lg transition-all ${
                                isChecked ? "bg-success/5 border border-success/20" : "bg-surface border border-sand/40"
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <button
                                  onClick={() => handleCheckIn(rider.id, !isChecked)}
                                  className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                                    isChecked
                                      ? "bg-success border-success text-white"
                                      : "border-sand bg-surface hover:border-ink/30"
                                  }`}
                                >
                                  {isChecked && <CheckCircle2 className="h-4 w-4" />}
                                </button>
                                <div>
                                  <p className="text-sm font-medium">
                                    {rider.nickname || rider.name}
                                  </p>
                                  <div className="flex items-center gap-2 text-[10px] text-ink-muted">
                                    <span className="flex items-center gap-0.5">
                                      <Bike className="h-3 w-3" />
                                      {rider.bike_preference}
                                    </span>
                                    {rider.clothing_size && (
                                      <span className="flex items-center gap-0.5">
                                        <Shirt className="h-3 w-3" />
                                        {rider.clothing_size}
                                      </span>
                                    )}
                                    <span>{rider.cycling_experience}</span>
                                  </div>
                                </div>
                              </div>
                              {rider.emergency_contact_phone && (
                                <a
                                  href={`tel:${rider.emergency_contact_phone}`}
                                  className="text-[10px] text-ink-muted hover:text-ink transition-colors"
                                  title={`Emergency: ${rider.emergency_contact_name}`}
                                >
                                  SOS
                                </a>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Bulk check-in */}
                      {booking.riders.some((r) => !r.checked_in && !localUpdates[r.id]) && (
                        <button
                          onClick={() => handleBulkCheckIn(booking.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-success/10 text-xs font-medium text-success hover:bg-success/20 transition-colors"
                        >
                          <UserCheck className="h-3.5 w-3.5" />
                          Check in all {booking.rider_count} riders
                        </button>
                      )}

                      {/* Special requests */}
                      {booking.special_requests && (
                        <div className="p-2.5 rounded-lg bg-accent/5 border border-accent/20 text-xs text-ink-light">
                          <span className="font-semibold">Note:</span> {booking.special_requests}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Weather cancel for this slot */}
                {!isCancelled && (
                  <button
                    onClick={() => setCancelModal({ type: "weather", slotId: slot.id })}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-xs font-medium text-red-600 hover:bg-red-100 transition-colors mt-2"
                  >
                    <CloudRain className="h-3.5 w-3.5" />
                    Cancel this slot (weather/other)
                  </button>
                )}
              </div>
            )}

                </Card>
              );
            })}

            {/* Empty slots summary — collapsed at the bottom */}
            {emptySlots.length > 0 && slotsWithBookings.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 text-sm text-ink-muted pt-1">
                <span className="font-medium">Open slots:</span>
                {emptySlots.map((slot) => (
                  <span key={slot.id} className="px-2 py-0.5 rounded-md bg-sand/30 text-xs font-medium">
                    {slot.id} · {slot.startTime}
                  </span>
                ))}
              </div>
            )}
          </>
        );
      })()}

      {/* Cancel Modal */}
      {cancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4">
          <Card padding="lg" className="max-w-sm w-full">
            <h3 className="font-bold text-lg mb-2">
              {cancelModal.type === "weather" ? "Cancel Slot" : "Cancel Booking"}
            </h3>
            <p className="text-sm text-ink-muted mb-4">
              {cancelModal.type === "weather"
                ? "This will cancel all bookings for this slot and notify customers."
                : "This will cancel the booking and notify the customer."}
            </p>
            <label className="block text-sm font-medium mb-1.5">Reason</label>
            <input
              type="text"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Rain forecast / Schedule conflict / ..."
              className="w-full px-3 py-2.5 rounded-xl border-2 border-sand/60 bg-surface text-sm focus:border-ink focus:outline-none mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => { setCancelModal(null); setCancelReason(""); }} className="flex-1">
                Back
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  if (cancelModal.type === "weather" && cancelModal.slotId) {
                    handleWeatherCancel([cancelModal.slotId]);
                  } else if (cancelModal.bookingId) {
                    handleAdminCancel(cancelModal.bookingId);
                  }
                }}
                loading={cancelling}
                disabled={!cancelReason.trim() || cancelling}
                className="flex-1 !bg-error hover:!bg-error/90"
              >
                Cancel & Notify
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Slip Preview Modal */}
      {slipPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4">
          <Card padding="lg" className="max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">Verify Payment</h3>
              <button onClick={() => setSlipPreview(null)} className="p-1 rounded-lg hover:bg-sand/30 transition-colors">
                <X className="h-5 w-5 text-ink-muted" />
              </button>
            </div>

            {/* Slip image */}
            <div className="rounded-xl overflow-hidden border border-sand/60 mb-4 bg-sand/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={slipPreview.url}
                alt="Payment slip"
                className="w-full max-h-80 object-contain"
              />
            </div>

            {/* Expected details */}
            <div className="space-y-2 mb-4 p-3 rounded-lg bg-sand/20">
              <div className="flex justify-between text-sm">
                <span className="text-ink-muted">Customer</span>
                <span className="font-semibold">{slipPreview.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-ink-muted">Expected Amount</span>
                <span className="font-bold text-accent">{slipPreview.amount.toLocaleString()} THB</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setSlipPreview(null)} className="flex-1">
                Close
              </Button>
              <Button
                variant="secondary"
                onClick={() => handleVerifyFromSlip(slipPreview.paymentId, slipPreview.bookingId)}
                loading={verifying}
                disabled={verifying}
                className="flex-1 !bg-success hover:!bg-success/90"
              >
                <CheckCircle2 className="h-4 w-4" />
                Verify Payment
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
