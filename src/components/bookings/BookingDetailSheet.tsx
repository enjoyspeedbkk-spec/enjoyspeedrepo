"use client";

import { useState } from "react";
import { motion } from "framer-motion";
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

  const handleCancel = async () => {
    setCancelling(true);
    const result = await cancelBooking(booking.id);
    setCancelling(false);
    if (result.success) {
      setCancelResult(result.refundInfo || "Booking cancelled.");
    } else {
      setCancelResult(result.error || "Could not cancel.");
    }
  };

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-ink/40 z-40"
        onClick={onClose}
      />

      {/* Sheet */}
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-50 bg-cream rounded-t-3xl max-h-[90vh] overflow-y-auto shadow-2xl"
      >
        {/* Handle + Close */}
        <div className="sticky top-0 bg-cream rounded-t-3xl z-10 pt-3 pb-2 px-6">
          <div className="w-10 h-1 bg-sand rounded-full mx-auto mb-3" />
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-lg">Booking Details</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-sand/40 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="px-6 pb-8 space-y-5">
          {/* Booking ID + Status */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-ink-muted font-mono">
              #{booking.id.slice(0, 8).toUpperCase()}
            </span>
            <Badge
              variant={
                booking.status === "confirmed" || booking.status === "ready"
                  ? "success"
                  : booking.status === "pending"
                  ? "warning"
                  : "default"
              }
            >
              {booking.status.replace("_", " ")}
            </Badge>
          </div>

          {/* Date & Time */}
          <div className="p-4 rounded-xl bg-surface border border-sand/60">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl bg-ink text-cream flex flex-col items-center justify-center flex-shrink-0">
                <span className="text-lg font-bold leading-none">
                  {rideDate.getDate()}
                </span>
                <span className="text-[10px] font-medium uppercase text-cream/60">
                  {rideDate.toLocaleDateString("en-US", { month: "short" })}
                </span>
              </div>
              <div>
                <p className="font-bold">
                  {rideDate.toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
                <div className="flex items-center gap-1.5 text-sm text-ink-muted mt-1">
                  <Clock className="h-3.5 w-3.5" />
                  {slot
                    ? `${slot.label} — ${slot.startTime} to ${slot.endTime}`
                    : booking.time_slot_id}
                </div>
                <div className="flex items-center gap-1.5 text-sm text-ink-muted mt-1">
                  <MapPin className="h-3.5 w-3.5" />
                  Skylane (HHBL), Suvarnabhumi Airport
                </div>
              </div>
            </div>
          </div>

          {/* Weather Alert */}
          {booking.weather_status !== "clear" && (
            <div
              className={`p-3 rounded-xl flex items-start gap-2.5 ${
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
                    ? "Ride cancelled due to weather"
                    : "Weather advisory"}
                </p>
                <p className="text-xs text-ink-muted mt-0.5">
                  {booking.weather_note ||
                    "We're monitoring conditions. You'll be notified via LINE if the ride is affected."}
                </p>
              </div>
            </div>
          )}

          {/* Ride Package */}
          <div>
            <h3 className="text-sm font-semibold text-ink-muted mb-2">
              Ride Package
            </h3>
            <div className="p-3 rounded-xl bg-surface border border-sand/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-accent" />
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
          <div>
            <h3 className="text-sm font-semibold text-ink-muted mb-2">
              Riders & Bikes
            </h3>
            <div className="space-y-2">
              {booking.riders.map((rider, i) => (
                <div
                  key={rider.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-surface border border-sand/60"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-ink/10 flex items-center justify-center text-xs font-bold text-ink">
                      {i + 1}
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {rider.nickname || rider.name}
                      </p>
                      <p className="text-[10px] text-ink-muted">
                        {rider.cycling_experience} ·{" "}
                        {rider.clothing_size || "No size"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-xs">
                      <Bike className="h-3 w-3 text-ink-muted" />
                      <span className="capitalize">
                        {rider.bike_preference}
                      </span>
                    </div>
                    {rider.bike_rental_price > 0 && (
                      <p className="text-[10px] text-ink-muted">
                        {rider.bike_rental_price} THB
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Price Breakdown */}
          <div>
            <h3 className="text-sm font-semibold text-ink-muted mb-2">
              Payment
            </h3>
            <div className="p-4 rounded-xl bg-surface border border-sand/60 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-ink-muted">
                  Ride ({booking.rider_count} ×{" "}
                  {booking.price_per_person.toLocaleString()})
                </span>
                <span>{booking.ride_total.toLocaleString()} THB</span>
              </div>
              {booking.rental_total > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-ink-muted">
                    Bike rentals (at track)
                  </span>
                  <span>{booking.rental_total.toLocaleString()} THB</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-sand/60 font-bold">
                <span>Total</span>
                <span className="text-accent">
                  {booking.total_price.toLocaleString()} THB
                </span>
              </div>

              {/* Payment status */}
              {booking.payment && (
                <div className="flex items-center gap-2 pt-2 border-t border-sand/60">
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
                          ? "Awaiting payment"
                          : `Payment ${booking.payment.status}`}
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Starter Kit */}
          <div className="p-3 rounded-xl bg-success/5 border border-success/20">
            <div className="flex items-start gap-2">
              <Gift className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-ink">
                  Starter Kit included
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
                className="flex items-center justify-between w-full p-3 rounded-xl bg-sky/5 border border-sky/20 text-left"
              >
                <div className="flex items-center gap-2">
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
                  className="mt-2 p-3 rounded-xl bg-surface border border-sand/60 space-y-2"
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
            <div className="p-3 rounded-xl bg-sand/20 border border-sand/40">
              <div className="flex items-start gap-2">
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
              className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl bg-surface border border-sand/60 text-sm font-medium hover:bg-sand/20 transition-colors"
            >
              <MessageCircle className="h-4 w-4 text-success" />
              LINE Chat
            </a>
            {booking.contact_phone && (
              <a
                href={`tel:${booking.contact_phone}`}
                className="flex items-center justify-center gap-2 p-3 rounded-xl bg-surface border border-sand/60 text-sm font-medium hover:bg-sand/20 transition-colors"
              >
                <Phone className="h-4 w-4" />
              </a>
            )}
          </div>

          {/* Cancel booking */}
          {isUpcoming && !cancelResult && (
            <div className="pt-2">
              {showCancelConfirm ? (
                <div className="p-4 rounded-xl bg-error/5 border border-error/20 space-y-3">
                  <p className="text-sm font-medium text-error">
                    Are you sure you want to cancel this booking?
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
                      {cancelling ? "Cancelling..." : "Yes, Cancel"}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowCancelConfirm(true)}
                  className="text-xs text-ink-muted hover:text-error transition-colors"
                >
                  Cancel this booking
                </button>
              )}
            </div>
          )}

          {cancelResult && (
            <div className="p-3 rounded-xl bg-sand/20 border border-sand/40">
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
