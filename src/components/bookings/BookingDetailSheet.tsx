"use client";

import { useState, useEffect } from "react";
import { formatDate } from "@/lib/format";
import { motion } from "framer-motion";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import {
  X,
  CalendarDays,
  Clock,
  Users,
  MapPin,
  Bike,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Gift,
  Package,
  CloudRain,
  MessageCircle,
  Phone,
  Mail,
  Shield,
  ChevronDown,
  ChevronUp,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  TIME_SLOTS,
  RIDE_PACKAGES,
  BIKE_RENTAL_PRICES,
  STARTER_KIT,
  READY_TO_RIDE,
  LINE_OA,
} from "@/lib/constants";
import { cancelBooking } from "@/lib/actions/bookings";
import type { BookingWithDetails } from "@/lib/actions/bookings";

interface BookingDetailSheetProps {
  booking: BookingWithDetails;
  onClose: () => void;
}

export function BookingDetailSheet({
  booking,
  onClose,
}: BookingDetailSheetProps) {
  const { t } = useLanguage();
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelResult, setCancelResult] = useState<string | null>(null);
  const [showPrepChecklist, setShowPrepChecklist] = useState(false);

  const slot = TIME_SLOTS.find((s) => s.id === booking.time_slot_id);
  const pkg = RIDE_PACKAGES.find((p) => p.type === booking.group_type);
  const rideDate = new Date(booking.ride_date);
  const isUpcoming =
    rideDate >= new Date() &&
    !["cancelled", "completed", "no_show"].includes(booking.status);
  const isPaid =
    booking.payment?.status === "paid" ||
    booking.payment?.status === "verified";

  // Lock body scroll when sheet is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const handleCancel = async () => {
    setCancelling(true);
    const result = await cancelBooking(booking.id);
    setCancelling(false);
    if (result.success) {
      setCancelResult(result.refundInfo || t("bookings.bookingCancelled"));
    } else {
      setCancelResult(result.error || t("bookings.couldNotCancel"));
    }
  };

  const statusColor =
    booking.status === "confirmed" || booking.status === "ready"
      ? "success"
      : booking.status === "pending"
      ? "warning"
      : "default";

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-ink/50 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Panel — side panel on desktop, full-screen sheet on mobile */}
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] bg-cream shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-sand/40 bg-cream flex-shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="font-bold text-lg">{t("bookings.bookingDetails")}</h2>
            <Badge variant={statusColor}>
              {booking.status.replace("_", " ")}
            </Badge>
          </div>
          <button
            onClick={onClose}
            className="p-2 -mr-2 rounded-full hover:bg-sand/40 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Booking ID */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-ink-muted font-mono bg-sand/30 px-2 py-0.5 rounded">
              #{booking.id.slice(0, 8).toUpperCase()}
            </span>
          </div>

          {/* Date & Time Card */}
          <div className="p-5 rounded-2xl bg-surface border border-sand/60">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl bg-ink text-cream flex flex-col items-center justify-center flex-shrink-0">
                <span className="text-lg font-bold leading-none">
                  {rideDate.getDate()}
                </span>
                <span className="text-xs font-medium uppercase text-cream/60">
                  {rideDate.toLocaleDateString("en-US", { month: "short" })}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-ink">
                  {formatDate(rideDate, "long")}
                </p>
                <div className="flex items-center gap-1.5 text-sm text-ink-muted mt-1.5">
                  <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>
                    {slot
                      ? `${slot.label} — ${slot.startTime} to ${slot.endTime}`
                      : booking.time_slot_id}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-ink-muted mt-1">
                  <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>Skylane (HHBL), Suvarnabhumi Airport</span>
                </div>
              </div>
            </div>
          </div>

          {/* Weather Alert */}
          {booking.weather_status !== "clear" && (
            <div
              className={`p-4 rounded-2xl flex items-start gap-3 ${
                booking.weather_status === "cancelled"
                  ? "bg-error/5 border border-error/20"
                  : "bg-warning/5 border border-warning/20"
              }`}
            >
              <CloudRain
                className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
                  booking.weather_status === "cancelled"
                    ? "text-error"
                    : "text-warning"
                }`}
              />
              <div>
                <p className="font-semibold text-sm">
                  {booking.weather_status === "cancelled"
                    ? t("bookings.weatherCancelledRide")
                    : t("bookings.weatherAdvisory")}
                </p>
                <p className="text-xs text-ink-muted mt-0.5">
                  {booking.weather_note || t("bookings.weatherMonitoring")}
                </p>
              </div>
            </div>
          )}

          {/* Package & Riders Section */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
              {t("bookings.package")}
            </h3>
            <div className="p-4 rounded-2xl bg-surface border border-sand/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center">
                    <Users className="h-4 w-4 text-accent" />
                  </div>
                  <span className="font-semibold">
                    {pkg?.name || booking.group_type}
                  </span>
                </div>
                <span className="text-sm text-ink-muted">
                  {booking.rider_count} rider
                  {booking.rider_count > 1 ? "s" : ""}
                </span>
              </div>
            </div>
          </div>

          {/* Riders */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
              Riders
            </h3>
            {booking.riders.map((rider, i) => (
              <div
                key={rider.id}
                className="flex items-center justify-between p-4 rounded-2xl bg-surface border border-sand/60"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-ink/8 flex items-center justify-center text-xs font-bold text-ink">
                    {i + 1}
                  </div>
                  <div>
                    <p className="font-medium text-sm">
                      {rider.nickname || rider.name}
                    </p>
                    <p className="text-xs text-ink-muted mt-0.5">
                      {rider.cycling_experience} · {rider.clothing_size || "No size"}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1.5 text-xs text-ink-muted">
                    <Bike className="h-3.5 w-3.5" />
                    <span className="capitalize">{rider.bike_preference}</span>
                  </div>
                  {rider.bike_rental_price > 0 && (
                    <p className="text-xs text-ink-muted mt-0.5">
                      {rider.bike_rental_price.toLocaleString()} THB
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Price Breakdown */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
              {t("bookings.paymentStatus")}
            </h3>
            <div className="p-5 rounded-2xl bg-surface border border-sand/60 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-ink-muted">
                  Ride ({booking.rider_count} × {booking.price_per_person.toLocaleString()})
                </span>
                <span className="font-medium">{booking.ride_total.toLocaleString()} THB</span>
              </div>
              {booking.rental_total > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-ink-muted">Bike rentals (at track)</span>
                  <span className="font-medium">{booking.rental_total.toLocaleString()} THB</span>
                </div>
              )}
              <div className="flex justify-between pt-3 border-t border-sand/60 font-bold text-base">
                <span>Total</span>
                <span className="text-accent">
                  {booking.total_price.toLocaleString()} THB
                </span>
              </div>

              {/* Payment status */}
              {booking.payment && (
                <div className="flex items-center justify-between pt-3 border-t border-sand/60">
                  <div className="flex items-center gap-2">
                    {isPaid ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-success" />
                        <span className="text-sm text-success font-medium">
                          Payment verified
                        </span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-4 w-4 text-warning" />
                        <span className="text-sm text-warning font-medium">
                          {booking.payment.status === "pending"
                            ? t("bookings.awaitingPayment")
                            : `Payment ${booking.payment.status}`}
                        </span>
                      </>
                    )}
                  </div>
                  {!isPaid && booking.status === "pending" && (
                    <a
                      href={`/bookings/${booking.id}/pay`}
                      className="px-4 py-2 rounded-full bg-accent text-white text-sm font-semibold hover:bg-accent-dark transition-colors"
                    >
                      Pay Now
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Starter Kit */}
          <div className="p-4 rounded-2xl bg-success/5 border border-success/20">
            <div className="flex items-start gap-3">
              <Gift className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-ink">
                  En-Joy Speed Pro-pack included
                </p>
                <p className="text-xs text-ink-muted mt-0.5">
                  {STARTER_KIT.join(" · ")}
                </p>
              </div>
            </div>
          </div>

          {/* Ride Prep Checklist (expandable) */}
          {isUpcoming && (
            <div>
              <button
                onClick={() => setShowPrepChecklist(!showPrepChecklist)}
                className="flex items-center justify-between w-full p-4 rounded-2xl bg-sky/5 border border-sky/20 text-left"
              >
                <div className="flex items-center gap-2.5">
                  <Package className="h-4 w-4 text-sky" />
                  <span className="text-sm font-medium text-ink">
                    Ready-to-Ride Checklist
                  </span>
                </div>
                {showPrepChecklist ? (
                  <ChevronUp className="h-4 w-4 text-ink-muted" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-ink-muted" />
                )}
              </button>
              {showPrepChecklist && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  className="mt-2 p-4 rounded-2xl bg-surface border border-sand/60 space-y-2.5"
                >
                  {READY_TO_RIDE.map((item, i) => (
                    <label
                      key={i}
                      className="flex items-center gap-2.5 text-sm text-ink-light cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        className="rounded border-sand text-success focus:ring-success"
                      />
                      {item}
                    </label>
                  ))}
                </motion.div>
              )}
            </div>
          )}

          {/* Rain Policy */}
          {isUpcoming && (
            <div className="p-4 rounded-2xl bg-sand/20 border border-sand/40">
              <div className="flex items-start gap-3">
                <Shield className="h-4 w-4 text-ink-muted mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-ink">Rain Policy</p>
                  <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                    More than 48 hrs before ride: full refund. 24–48 hrs: 50%
                    fee. Under 24 hrs: 100% fee. Weather-related cancellations
                    receive a 90-day rain credit.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Contact */}
          <div className="flex gap-3">
            <a
              href={`https://line.me/R/ti/p/${LINE_OA}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 p-3 rounded-2xl bg-surface border border-sand/60 text-sm font-medium hover:bg-sand/20 transition-colors"
            >
              <MessageCircle className="h-4 w-4 text-success" />
              LINE Chat
            </a>
            {booking.contact_phone && (
              <a
                href={`tel:${booking.contact_phone}`}
                className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-surface border border-sand/60 text-sm font-medium hover:bg-sand/20 transition-colors"
              >
                <Phone className="h-4 w-4" />
              </a>
            )}
          </div>

          {/* Cancel booking */}
          {isUpcoming && !cancelResult && (
            <div className="pt-2 pb-4">
              {showCancelConfirm ? (
                <div className="p-5 rounded-2xl bg-error/5 border border-error/20 space-y-3">
                  <p className="text-sm font-medium text-error">
                    {t("bookings.cancelConfirm")}
                  </p>
                  <p className="text-xs text-ink-muted">
                    Refund policy applies based on how close the ride date is.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowCancelConfirm(false)}
                    >
                      Keep Booking
                    </Button>
                    <button
                      onClick={handleCancel}
                      disabled={cancelling}
                      className="px-4 py-2 rounded-lg bg-error text-white text-sm font-semibold hover:bg-error/90 transition-colors disabled:opacity-50"
                    >
                      {cancelling ? `${t("bookings.cancelling")}...` : `${t("bookings.cancel")}`}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowCancelConfirm(true)}
                  className="text-xs text-ink-muted hover:text-error transition-colors"
                >
                  {t("bookings.cancel")}
                </button>
              )}
            </div>
          )}

          {cancelResult && (
            <div className="p-4 rounded-2xl bg-sand/20 border border-sand/40">
              <div className="flex items-start gap-2">
                <XCircle className="h-4 w-4 text-ink-muted mt-0.5" />
                <p className="text-sm text-ink-muted">{cancelResult}</p>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
}
