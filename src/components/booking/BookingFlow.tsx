"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarDays,
  Clock,
  Users,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Check,
  Minus,
  Plus,
  Bike,
  Star,
  Zap,
  Crown,
  Sunrise,
  Sunset,
  UserPlus,
  Gift,
  ShieldCheck,
  QrCode,
  Package,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  RIDE_PACKAGES,
  TIME_SLOTS,
  BIKE_RENTAL_PRICES,
  STARTER_KIT,
  READY_TO_RIDE,
  LINE_OA,
} from "@/lib/constants";
import type {
  GroupType,
  TimeSlotId,
  BikePreference,
  RiderInfo,
  CyclingExperience,
  ClothingSize,
} from "@/types";
import { createBooking } from "@/lib/actions/booking";
import { PaymentPromptPay } from "@/components/booking/PaymentPromptPay";
import { EmailVerification } from "@/components/booking/EmailVerification";

// ------ Step definitions ------
const STEPS = [
  { id: "date", label: "Date", icon: CalendarDays },
  { id: "time", label: "Time Slot", icon: Clock },
  { id: "package", label: "Ride Type", icon: Users },
  { id: "riders", label: "Riders", icon: UserPlus },
  { id: "waiver", label: "Waiver", icon: ShieldCheck },
  { id: "review", label: "Review & Pay", icon: CreditCard },
] as const;

type StepId = (typeof STEPS)[number]["id"];

// Package icon mapping
const packageIcons: Record<GroupType, typeof Star> = {
  duo: Star,
  squad: Zap,
  peloton: Crown,
};

// Clothing size options
const SIZES: ClothingSize[] = ["XS", "S", "M", "L", "XL", "XXL"];
const EXPERIENCE_OPTIONS: { value: CyclingExperience; label: string; desc: string }[] = [
  { value: "beginner", label: "Beginner", desc: "First time or very few rides" },
  { value: "intermediate", label: "Intermediate", desc: "Ride occasionally" },
  { value: "experienced", label: "Experienced", desc: "Regular cyclist" },
];

function createEmptyRider(index: number): RiderInfo {
  return {
    name: "",
    nickname: "",
    bikePreference: "hybrid",
    clothingSize: undefined,
    heightCm: undefined,
    cyclingExperience: "beginner",
    emergencyContactName: "",
    emergencyContactPhone: "",
  };
}

interface BookingFlowProps {
  userEmail?: string;
  userName?: string;
  userId?: string; // undefined = guest user (book-first flow)
}

export function BookingFlow({ userEmail = "", userName = "", userId }: BookingFlowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedSlot, setSelectedSlot] = useState<TimeSlotId | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<GroupType | null>(null);
  const [riderCount, setRiderCount] = useState(2);
  const [riders, setRiders] = useState<RiderInfo[]>([
    createEmptyRider(0),
    createEmptyRider(1),
  ]);
  const [activeRiderIndex, setActiveRiderIndex] = useState(0);
  const [waiverAccepted, setWaiverAccepted] = useState(false);
  const [contactName, setContactName] = useState(userName);
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState(userEmail);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [completedBooking, setCompletedBooking] = useState<{
    bookingId: string;
    paymentAmount: number;
  } | null>(null);

  // Email verification state (book-first flow)
  const [verifiedUserId, setVerifiedUserId] = useState<string | undefined>(userId);
  const [emailVerified, setEmailVerified] = useState(!!userId); // Already verified if logged in
  const [showEmailVerification, setShowEmailVerification] = useState(false);

  const activePackage = RIDE_PACKAGES.find((p) => p.type === selectedPackage);
  const activeSlot = TIME_SLOTS.find((s) => s.id === selectedSlot);

  // Generate next 14 days
  const availableDates = useMemo(() => {
    const dates = [];
    const now = new Date();
    for (let i = 1; i <= 14; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() + i);
      dates.push(d);
    }
    return dates;
  }, []);

  // Calculate total with per-rider bike preferences
  const totalPrice = useMemo(() => {
    if (!activePackage) return 0;
    const rideTotal = activePackage.pricePerPerson * riderCount;
    const rentalTotal = riders.slice(0, riderCount).reduce((sum, rider) => {
      return sum + BIKE_RENTAL_PRICES[rider.bikePreference];
    }, 0);
    return rideTotal + rentalTotal;
  }, [activePackage, riderCount, riders]);

  const rideSubtotal = activePackage
    ? activePackage.pricePerPerson * riderCount
    : 0;
  const rentalSubtotal = riders.slice(0, riderCount).reduce((sum, rider) => {
    return sum + BIKE_RENTAL_PRICES[rider.bikePreference];
  }, 0);

  // Update a specific rider field
  const updateRider = useCallback(
    (index: number, field: keyof RiderInfo, value: string | number | undefined) => {
      setRiders((prev) => {
        const updated = [...prev];
        updated[index] = { ...updated[index], [field]: value };
        return updated;
      });
    },
    []
  );

  const canProceed = () => {
    switch (STEPS[currentStep].id) {
      case "date":
        return !!selectedDate;
      case "time":
        return !!selectedSlot;
      case "package":
        return !!selectedPackage;
      case "riders": {
        // All riders must have a name and bike preference
        const activeRiders = riders.slice(0, riderCount);
        return activeRiders.every((r) => r.name.trim().length > 0);
      }
      case "waiver":
        return waiverAccepted && contactName.trim().length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail);
      case "review":
        return true;
      default:
        return false;
    }
  };

  const next = () => {
    if (currentStep < STEPS.length - 1 && canProceed()) {
      setCurrentStep((s) => s + 1);
    }
  };

  const prev = () => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  };

  // Update rider count when package changes
  const handlePackageSelect = (type: GroupType) => {
    setSelectedPackage(type);
    const pkg = RIDE_PACKAGES.find((p) => p.type === type)!;
    const newCount = pkg.minRiders;
    setRiderCount(newCount);
    // Adjust riders array
    setRiders((prev) => {
      const updated = [...prev];
      while (updated.length < newCount) {
        updated.push(createEmptyRider(updated.length));
      }
      return updated;
    });
  };

  const handleRiderCountChange = (newCount: number) => {
    setRiderCount(newCount);
    setRiders((prev) => {
      const updated = [...prev];
      while (updated.length < newCount) {
        updated.push(createEmptyRider(updated.length));
      }
      return updated;
    });
    if (activeRiderIndex >= newCount) {
      setActiveRiderIndex(newCount - 1);
    }
  };

  // Handle email verification callback
  const handleEmailVerified = (verifiedEmail: string, newUserId: string) => {
    setContactEmail(verifiedEmail);
    setVerifiedUserId(newUserId);
    setEmailVerified(true);
    setShowEmailVerification(false);
    // Now proceed to actually create the booking
    submitBookingWithUser(newUserId);
  };

  // Called when user clicks "Confirm & Pay" — either goes to email verification or straight to booking
  const handleSubmitBooking = async () => {
    // If not verified yet, show email verification first
    if (!emailVerified && !verifiedUserId) {
      setShowEmailVerification(true);
      return;
    }
    // Already verified — submit directly
    await submitBookingWithUser(verifiedUserId);
  };

  const submitBookingWithUser = async (userIdToUse?: string) => {
    setIsSubmitting(true);
    setBookingError("");

    const result = await createBooking({
      date: selectedDate,
      timeSlotId: selectedSlot!,
      groupType: selectedPackage!,
      riderCount,
      riders: riders.slice(0, riderCount),
      contactName,
      contactPhone,
      contactEmail: contactEmail || userEmail,
      contactLineId: "",
      specialRequests: "",
      waiverAccepted,
      userId: userIdToUse, // Pass verified user ID for guest bookings
    });

    setIsSubmitting(false);

    if (result.success && result.bookingId) {
      setCompletedBooking({
        bookingId: result.bookingId,
        paymentAmount: result.paymentAmount || rideSubtotal,
      });
    } else {
      setBookingError(result.error || "Something went wrong.");
    }
  };

  // If booking is complete, show payment screen
  if (completedBooking) {
    return (
      <PaymentPromptPay
        bookingId={completedBooking.bookingId}
        amount={completedBooking.paymentAmount}
        rentalAmount={rentalSubtotal}
        promptPayTarget={process.env.NEXT_PUBLIC_PROMPTPAY_ACCOUNT || "228-1-15365-2"}
        promptPayBankCode={process.env.NEXT_PUBLIC_PROMPTPAY_BANK_CODE || "004"}
        contactName={contactName || userName}
      />
    );
  }

  return (
    <section className="min-h-screen pt-24 pb-16 bg-cream">
      <div className="mx-auto max-w-4xl px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10">
          <Badge variant="accent">Book Your Ride</Badge>
          <h1 className="mt-4 text-3xl lg:text-4xl font-bold">
            Let&apos;s set up your ride
          </h1>
          <p className="mt-2 text-ink-muted">
            Six simple steps. Takes about 3 minutes.
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-1 mb-12 overflow-x-auto pb-2">
          {STEPS.map((step, i) => (
            <div key={step.id} className="flex items-center flex-shrink-0">
              <button
                onClick={() => i < currentStep && setCurrentStep(i)}
                disabled={i > currentStep}
                className={`flex items-center gap-1.5 px-2.5 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  i === currentStep
                    ? "bg-ink text-cream shadow-md"
                    : i < currentStep
                    ? "bg-success/10 text-success cursor-pointer hover:bg-success/20"
                    : "bg-sand/40 text-ink-muted cursor-default"
                }`}
              >
                {i < currentStep ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <step.icon className="h-4 w-4" />
                )}
                <span className="hidden sm:inline text-xs">{step.label}</span>
              </button>
              {i < STEPS.length - 1 && (
                <div
                  className={`w-4 lg:w-8 h-0.5 mx-0.5 rounded-full transition-colors ${
                    i < currentStep ? "bg-success/30" : "bg-sand/60"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="relative min-h-[400px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* ===================== STEP 1: Date ===================== */}
              {STEPS[currentStep].id === "date" && (
                <div>
                  <h2 className="text-xl font-bold mb-2">Pick your date</h2>
                  <p className="text-sm text-ink-muted mb-6">
                    Select a date for your ride. All dates are at least 24 hours
                    from now.
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                    {availableDates.map((date) => {
                      const dateStr = date.toISOString().split("T")[0];
                      const isSelected = selectedDate === dateStr;
                      const dayName = date.toLocaleDateString("en-US", {
                        weekday: "short",
                      });
                      const dayNum = date.getDate();
                      const month = date.toLocaleDateString("en-US", {
                        month: "short",
                      });

                      return (
                        <button
                          key={dateStr}
                          onClick={() => setSelectedDate(dateStr)}
                          className={`flex flex-col items-center py-4 px-3 rounded-xl border-2 transition-all duration-200 ${
                            isSelected
                              ? "border-ink bg-ink text-cream shadow-md scale-[1.02]"
                              : "border-sand/60 bg-surface hover:border-ink/20 hover:shadow-sm"
                          }`}
                        >
                          <span
                            className={`text-xs font-medium ${
                              isSelected ? "text-cream/60" : "text-ink-muted"
                            }`}
                          >
                            {dayName}
                          </span>
                          <span className="text-2xl font-bold mt-1">
                            {dayNum}
                          </span>
                          <span
                            className={`text-xs ${
                              isSelected ? "text-cream/60" : "text-ink-muted"
                            }`}
                          >
                            {month}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ===================== STEP 2: Time Slot ===================== */}
              {STEPS[currentStep].id === "time" && (
                <div>
                  <h2 className="text-xl font-bold mb-2">Choose your time</h2>
                  <p className="text-sm text-ink-muted mb-6">
                    Morning for performance. Evening for vibes.
                  </p>

                  {/* Morning */}
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Sunrise className="h-4 w-4 text-sky" />
                      <span className="text-sm font-semibold text-ink">
                        Morning
                      </span>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {TIME_SLOTS.filter((s) => s.period === "morning").map(
                        (slot) => {
                          const isSelected = selectedSlot === slot.id;
                          return (
                            <button
                              key={slot.id}
                              onClick={() => setSelectedSlot(slot.id)}
                              className={`flex items-center justify-between p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                                isSelected
                                  ? "border-ink bg-ink text-cream shadow-md"
                                  : "border-sand/60 bg-surface hover:border-ink/20"
                              }`}
                            >
                              <div>
                                <p className="font-semibold">{slot.label}</p>
                                <p
                                  className={`text-sm ${
                                    isSelected
                                      ? "text-cream/60"
                                      : "text-ink-muted"
                                  }`}
                                >
                                  {slot.startTime} — {slot.endTime}
                                </p>
                              </div>
                              <span
                                className={`text-xs font-medium px-2 py-1 rounded-full ${
                                  isSelected
                                    ? "bg-cream/15 text-cream"
                                    : "bg-sky/10 text-sky-dark"
                                }`}
                              >
                                Slot {slot.id}
                              </span>
                            </button>
                          );
                        }
                      )}
                    </div>
                    <p className="mt-2 text-xs text-warning flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-warning" />
                      A1 and A2 overlap — only one morning slot per day
                    </p>
                  </div>

                  {/* Evening */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Sunset className="h-4 w-4 text-accent" />
                      <span className="text-sm font-semibold text-ink">
                        Evening
                      </span>
                    </div>
                    <div className="grid sm:grid-cols-3 gap-3">
                      {TIME_SLOTS.filter((s) => s.period === "evening").map(
                        (slot) => {
                          const isSelected = selectedSlot === slot.id;
                          return (
                            <button
                              key={slot.id}
                              onClick={() => setSelectedSlot(slot.id)}
                              className={`flex flex-col p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                                isSelected
                                  ? "border-ink bg-ink text-cream shadow-md"
                                  : "border-sand/60 bg-surface hover:border-ink/20"
                              }`}
                            >
                              <span
                                className={`text-xs font-medium px-2 py-0.5 rounded-full self-start mb-2 ${
                                  isSelected
                                    ? "bg-cream/15 text-cream"
                                    : slot.id === "C"
                                    ? "bg-accent/10 text-accent-dark"
                                    : "bg-accent/10 text-accent-dark"
                                }`}
                              >
                                {slot.id === "C" ? "Staff Pick" : `Slot ${slot.id}`}
                              </span>
                              <p className="font-semibold">{slot.label}</p>
                              <p
                                className={`text-sm ${
                                  isSelected
                                    ? "text-cream/60"
                                    : "text-ink-muted"
                                }`}
                              >
                                {slot.startTime} — {slot.endTime}
                              </p>
                            </button>
                          );
                        }
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ===================== STEP 3: Package ===================== */}
              {STEPS[currentStep].id === "package" && (
                <div>
                  <h2 className="text-xl font-bold mb-2">
                    Choose your ride type
                  </h2>
                  <p className="text-sm text-ink-muted mb-6">
                    Each format comes with different group sizes, support levels,
                    and pricing.
                  </p>
                  <div className="grid sm:grid-cols-3 gap-4">
                    {RIDE_PACKAGES.map((pkg) => {
                      const isSelected = selectedPackage === pkg.type;
                      const Icon = packageIcons[pkg.type];
                      return (
                        <button
                          key={pkg.type}
                          onClick={() => handlePackageSelect(pkg.type)}
                          className={`relative flex flex-col p-6 rounded-2xl border-2 text-left transition-all duration-200 ${
                            isSelected
                              ? "border-ink bg-ink text-cream shadow-lg scale-[1.02]"
                              : "border-sand/60 bg-surface hover:border-ink/20 hover:shadow-sm"
                          }`}
                        >
                          {pkg.type === "squad" && (
                            <span
                              className={`absolute -top-2.5 right-4 text-xs font-bold px-2.5 py-0.5 rounded-full ${
                                isSelected
                                  ? "bg-accent text-white"
                                  : "bg-accent/10 text-accent-dark"
                              }`}
                            >
                              Popular
                            </span>
                          )}
                          <Icon
                            className={`h-6 w-6 mb-3 ${
                              isSelected ? "text-cream" : "text-accent"
                            }`}
                          />
                          <h3 className="text-lg font-bold">{pkg.name}</h3>
                          <p
                            className={`text-sm mt-1 ${
                              isSelected ? "text-cream/60" : "text-ink-muted"
                            }`}
                          >
                            {pkg.minRiders}
                            {pkg.maxRiders !== pkg.minRiders
                              ? `–${pkg.maxRiders}`
                              : ""}{" "}
                            riders
                          </p>
                          <div className="mt-4 pt-4 border-t border-current/10">
                            <p className="text-2xl font-bold">
                              {pkg.pricePerPerson.toLocaleString()}
                              <span
                                className={`text-xs font-normal ml-1 ${
                                  isSelected
                                    ? "text-cream/50"
                                    : "text-ink-muted"
                                }`}
                              >
                                THB/person
                              </span>
                            </p>
                            <p
                              className={`text-xs mt-1 ${
                                isSelected ? "text-cream/50" : "text-ink-muted"
                              }`}
                            >
                              {pkg.leadersCount} Leader
                              {pkg.heroesCount > 0
                                ? ` + ${pkg.heroesCount} Hero`
                                : ""}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Starter Kit callout */}
                  <div className="mt-6 p-4 rounded-xl bg-success/5 border border-success/20">
                    <div className="flex items-start gap-3">
                      <Gift className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-sm text-ink">
                          Starter Kit included with every ride
                        </p>
                        <p className="text-xs text-ink-muted mt-1">
                          {STARTER_KIT.join(" · ")}
                        </p>
                        <p className="text-xs text-ink-muted mt-1">
                          Yours to keep — no extra charge.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ===================== STEP 4: Riders ===================== */}
              {STEPS[currentStep].id === "riders" && activePackage && (
                <div>
                  <h2 className="text-xl font-bold mb-2">
                    Tell us about your riders
                  </h2>
                  <p className="text-sm text-ink-muted mb-6">
                    Each rider can choose their own bike type. Most beginners
                    love the hybrid — it&apos;s comfortable and easy to ride.
                  </p>

                  {/* Rider count control */}
                  {activePackage.minRiders !== activePackage.maxRiders && (
                    <Card padding="md" className="mb-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-ink">
                            Number of Riders
                          </p>
                          <p className="text-sm text-ink-muted">
                            {activePackage.name}: {activePackage.minRiders}–
                            {activePackage.maxRiders} riders
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() =>
                              handleRiderCountChange(
                                Math.max(activePackage.minRiders, riderCount - 1)
                              )
                            }
                            disabled={riderCount <= activePackage.minRiders}
                            className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-sand/60 hover:border-ink/20 disabled:opacity-30 transition-colors"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="text-2xl font-bold w-8 text-center">
                            {riderCount}
                          </span>
                          <button
                            onClick={() =>
                              handleRiderCountChange(
                                Math.min(activePackage.maxRiders, riderCount + 1)
                              )
                            }
                            disabled={riderCount >= activePackage.maxRiders}
                            className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-sand/60 hover:border-ink/20 disabled:opacity-30 transition-colors"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </Card>
                  )}

                  {/* Rider tabs */}
                  <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                    {Array.from({ length: riderCount }).map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveRiderIndex(i)}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                          activeRiderIndex === i
                            ? "bg-ink text-cream shadow-md"
                            : riders[i]?.name?.trim()
                            ? "bg-success/10 text-success"
                            : "bg-sand/40 text-ink-muted hover:bg-sand/60"
                        }`}
                      >
                        {riders[i]?.name?.trim() && activeRiderIndex !== i && (
                          <Check className="h-3.5 w-3.5" />
                        )}
                        {riders[i]?.name?.trim()
                          ? riders[i].nickname || riders[i].name.split(" ")[0]
                          : `Rider ${i + 1}`}
                      </button>
                    ))}
                  </div>

                  {/* Active rider form */}
                  <Card padding="lg" className="space-y-5">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-lg">
                        Rider {activeRiderIndex + 1}
                      </h3>
                      {riders[activeRiderIndex]?.name?.trim() && (
                        <Badge variant="success">Info provided</Badge>
                      )}
                    </div>

                    {/* Name */}
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-ink mb-1.5">
                          Full Name <span className="text-error">*</span>
                        </label>
                        <input
                          type="text"
                          value={riders[activeRiderIndex]?.name || ""}
                          onChange={(e) =>
                            updateRider(activeRiderIndex, "name", e.target.value)
                          }
                          placeholder="e.g. Somchai Jaidee"
                          className="w-full px-4 py-3 rounded-xl border-2 border-sand/60 bg-surface text-ink placeholder:text-ink-muted/50 focus:border-ink focus:outline-none transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-ink mb-1.5">
                          Nickname
                        </label>
                        <input
                          type="text"
                          value={riders[activeRiderIndex]?.nickname || ""}
                          onChange={(e) =>
                            updateRider(
                              activeRiderIndex,
                              "nickname",
                              e.target.value
                            )
                          }
                          placeholder="What should we call you?"
                          className="w-full px-4 py-3 rounded-xl border-2 border-sand/60 bg-surface text-ink placeholder:text-ink-muted/50 focus:border-ink focus:outline-none transition-colors"
                        />
                      </div>
                    </div>

                    {/* Bike Preference — PER RIDER */}
                    <div>
                      <label className="block text-sm font-medium text-ink mb-2">
                        Bike Preference <span className="text-error">*</span>
                      </label>
                      <p className="text-xs text-ink-muted mb-3">
                        Bike rental is paid separately at the track to HHBL
                        (Happy and Healthy Bike Lane). Each rider can pick their
                        own bike type.
                      </p>
                      <div className="grid grid-cols-3 gap-3">
                        {(
                          [
                            {
                              value: "hybrid" as BikePreference,
                              label: "Hybrid",
                              price: "420 THB",
                              desc: "Comfortable, beginner-friendly",
                            },
                            {
                              value: "road" as BikePreference,
                              label: "Road Bike",
                              price: "700 THB",
                              desc: "Faster, sportier feel",
                            },
                            {
                              value: "own" as BikePreference,
                              label: "Own Bike",
                              price: "Free",
                              desc: "Bring your own",
                            },
                          ]
                        ).map((option) => (
                          <button
                            key={option.value}
                            onClick={() =>
                              updateRider(
                                activeRiderIndex,
                                "bikePreference",
                                option.value
                              )
                            }
                            className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all duration-200 ${
                              riders[activeRiderIndex]?.bikePreference ===
                              option.value
                                ? "border-ink bg-ink text-cream shadow-md"
                                : "border-sand/60 bg-surface hover:border-ink/20"
                            }`}
                          >
                            <Bike
                              className={`h-5 w-5 mb-2 ${
                                riders[activeRiderIndex]?.bikePreference ===
                                option.value
                                  ? "text-cream"
                                  : "text-ink-muted"
                              }`}
                            />
                            <span className="text-sm font-semibold">
                              {option.label}
                            </span>
                            <span
                              className={`text-xs mt-0.5 ${
                                riders[activeRiderIndex]?.bikePreference ===
                                option.value
                                  ? "text-cream/60"
                                  : "text-ink-muted"
                              }`}
                            >
                              {option.price}
                            </span>
                            <span
                              className={`text-[10px] mt-1 text-center ${
                                riders[activeRiderIndex]?.bikePreference ===
                                option.value
                                  ? "text-cream/40"
                                  : "text-ink-muted/60"
                              }`}
                            >
                              {option.desc}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Experience */}
                    <div>
                      <label className="block text-sm font-medium text-ink mb-2">
                        Cycling Experience
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        {EXPERIENCE_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() =>
                              updateRider(
                                activeRiderIndex,
                                "cyclingExperience",
                                opt.value
                              )
                            }
                            className={`flex flex-col p-3 rounded-xl border-2 text-left transition-all duration-200 ${
                              riders[activeRiderIndex]?.cyclingExperience ===
                              opt.value
                                ? "border-ink bg-ink/5"
                                : "border-sand/60 bg-surface hover:border-ink/20"
                            }`}
                          >
                            <span className="text-sm font-semibold">
                              {opt.label}
                            </span>
                            <span className="text-[10px] text-ink-muted mt-0.5">
                              {opt.desc}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Clothing Size (for padded liner shorts from starter kit) */}
                    <div>
                      <label className="block text-sm font-medium text-ink mb-2">
                        Liner Shorts Size
                        <span className="text-xs font-normal text-ink-muted ml-2">
                          (from your Starter Kit)
                        </span>
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {SIZES.map((size) => (
                          <button
                            key={size}
                            onClick={() =>
                              updateRider(
                                activeRiderIndex,
                                "clothingSize",
                                size
                              )
                            }
                            className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                              riders[activeRiderIndex]?.clothingSize === size
                                ? "border-ink bg-ink text-cream"
                                : "border-sand/60 bg-surface hover:border-ink/20"
                            }`}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Next rider shortcut */}
                    {activeRiderIndex < riderCount - 1 && (
                      <button
                        onClick={() =>
                          setActiveRiderIndex(activeRiderIndex + 1)
                        }
                        className="flex items-center gap-2 text-sm font-medium text-accent hover:text-accent-dark transition-colors mt-2"
                      >
                        Next rider: Rider {activeRiderIndex + 2}
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    )}
                  </Card>

                  {/* Rider summary */}
                  {riderCount > 1 && (
                    <div className="mt-4 p-3 rounded-xl bg-sand/20 border border-sand/40">
                      <p className="text-xs font-medium text-ink-muted mb-2">
                        Bike breakdown:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {riders.slice(0, riderCount).map((r, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 text-xs bg-surface px-2.5 py-1 rounded-full border border-sand/60"
                          >
                            <span className="font-medium">
                              {r.nickname || r.name.split(" ")[0] || `Rider ${i + 1}`}
                            </span>
                            <span className="text-ink-muted">
                              {r.bikePreference === "own"
                                ? "own"
                                : r.bikePreference}
                            </span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ===================== STEP 5: Waiver & Contact ===================== */}
              {STEPS[currentStep].id === "waiver" && (
                <div>
                  <h2 className="text-xl font-bold mb-2">
                    Safety waiver & contact
                  </h2>
                  <p className="text-sm text-ink-muted mb-6">
                    For your safety and ours. One acceptance covers all riders in
                    your group.
                  </p>

                  {/* Waiver text */}
                  <Card padding="md" className="mb-6">
                    <div className="max-h-48 overflow-y-auto text-xs text-ink-light leading-relaxed space-y-3 pr-2">
                      <p className="font-bold text-sm text-ink">
                        Liability & Assumption of Risk Waiver
                      </p>
                      <p>
                        By booking a ride with En-Joy Speed, I acknowledge that
                        cycling involves inherent risks including but not limited
                        to: falls, collisions, mechanical failure, weather
                        conditions, road hazards, and physical exertion.
                      </p>
                      <p>
                        I confirm that I (and all riders in my group) are in
                        adequate physical condition to participate in a 23.5 km
                        cycling session on the Skylane at Suvarnabhumi. I
                        understand that:
                      </p>
                      <ul className="list-disc pl-4 space-y-1">
                        <li>
                          Helmets are mandatory and must be worn at all times
                          during the ride.
                        </li>
                        <li>
                          I must follow all instructions from my Athlete Leader
                          and Hero support riders.
                        </li>
                        <li>
                          Bike rental equipment is provided by HHBL (Happy and
                          Healthy Bike Lane) and inspected before each session.
                        </li>
                        <li>
                          En-Joy Speed carries group accident insurance for the
                          pilot phase covering medical expenses up to the policy
                          limit.
                        </li>
                        <li>
                          In case of rain or severe weather, the ride may be
                          rescheduled per our weather policy.
                        </li>
                      </ul>
                      <p>
                        I release En-Joy Speed, its leaders, staff, and partners
                        from liability for any injury, loss, or damage arising
                        from my participation, except in cases of gross
                        negligence.
                      </p>
                      <p className="text-ink-muted italic">
                        โดยการจองการขี่จักรยานกับ En-Joy Speed
                        ข้าพเจ้ารับทราบว่ากิจกรรมปั่นจักรยานมีความเสี่ยงโดยธรรมชาติ
                        ข้าพเจ้ายินยอมรับความเสี่ยงทั้งหมดและปลดเปลื้อง
                        En-Joy Speed
                        จากความรับผิดชอบต่อการบาดเจ็บหรือความเสียหายใดๆ
                      </p>
                    </div>
                  </Card>

                  {/* Waiver acceptance */}
                  <button
                    onClick={() => setWaiverAccepted(!waiverAccepted)}
                    className={`flex items-start gap-3 w-full p-4 rounded-xl border-2 text-left transition-all duration-200 mb-6 ${
                      waiverAccepted
                        ? "border-success bg-success/5"
                        : "border-sand/60 bg-surface hover:border-ink/20"
                    }`}
                  >
                    <div
                      className={`flex items-center justify-center w-6 h-6 rounded-md border-2 flex-shrink-0 mt-0.5 transition-all ${
                        waiverAccepted
                          ? "bg-success border-success text-white"
                          : "border-sand bg-surface"
                      }`}
                    >
                      {waiverAccepted && <Check className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-ink">
                        I accept the liability waiver on behalf of all riders in
                        my group
                      </p>
                      <p className="text-xs text-ink-muted mt-1">
                        By checking this box, you agree to the terms above for
                        all {riderCount} riders.
                      </p>
                    </div>
                  </button>

                  {/* Contact Info */}
                  <h3 className="font-bold text-lg mb-4">
                    Group contact details
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-ink mb-1.5">
                        Contact Name <span className="text-error">*</span>
                      </label>
                      <input
                        type="text"
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder="Primary contact for this booking"
                        className="w-full px-4 py-3 rounded-xl border-2 border-sand/60 bg-surface text-ink placeholder:text-ink-muted/50 focus:border-ink focus:outline-none transition-colors"
                      />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-ink mb-1.5">
                          Email <span className="text-error">*</span>
                        </label>
                        <input
                          type="email"
                          value={contactEmail}
                          onChange={(e) => setContactEmail(e.target.value)}
                          placeholder="your@email.com"
                          className="w-full px-4 py-3 rounded-xl border-2 border-sand/60 bg-surface text-ink placeholder:text-ink-muted/50 focus:border-ink focus:outline-none transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-ink mb-1.5">
                          Phone <span className="text-ink-muted text-xs font-normal">(optional)</span>
                        </label>
                        <input
                          type="tel"
                          value={contactPhone}
                          onChange={(e) => setContactPhone(e.target.value)}
                          placeholder="08X-XXX-XXXX"
                          className="w-full px-4 py-3 rounded-xl border-2 border-sand/60 bg-surface text-ink placeholder:text-ink-muted/50 focus:border-ink focus:outline-none transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ===================== STEP 6: Review & Pay ===================== */}
              {STEPS[currentStep].id === "review" &&
                activePackage &&
                activeSlot && (
                  <div>
                    <h2 className="text-xl font-bold mb-2">
                      Review your ride
                    </h2>
                    <p className="text-sm text-ink-muted mb-6">
                      Everything look good? Confirm and pay via PromptPay.
                    </p>

                    <Card padding="lg" className="mb-6">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center pb-4 border-b border-sand/60">
                          <span className="text-sm text-ink-muted">Date</span>
                          <span className="font-semibold">
                            {new Date(selectedDate).toLocaleDateString("en-US", {
                              weekday: "long",
                              month: "long",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                        <div className="flex justify-between items-center pb-4 border-b border-sand/60">
                          <span className="text-sm text-ink-muted">
                            Time Slot
                          </span>
                          <span className="font-semibold">
                            {activeSlot.label} ({activeSlot.startTime} —{" "}
                            {activeSlot.endTime})
                          </span>
                        </div>
                        <div className="flex justify-between items-center pb-4 border-b border-sand/60">
                          <span className="text-sm text-ink-muted">
                            Ride Type
                          </span>
                          <span className="font-semibold">
                            {activePackage.name}
                          </span>
                        </div>

                        {/* Per-rider breakdown */}
                        <div className="pb-4 border-b border-sand/60">
                          <span className="text-sm text-ink-muted block mb-3">
                            Riders & Bikes
                          </span>
                          <div className="space-y-2">
                            {riders.slice(0, riderCount).map((rider, i) => (
                              <div
                                key={i}
                                className="flex justify-between items-center text-sm"
                              >
                                <span className="font-medium">
                                  {rider.nickname ||
                                    rider.name ||
                                    `Rider ${i + 1}`}
                                </span>
                                <span className="text-ink-muted">
                                  {rider.bikePreference === "own"
                                    ? "Own bike"
                                    : `${rider.bikePreference === "hybrid" ? "Hybrid" : "Road"} rental — ${BIKE_RENTAL_PRICES[rider.bikePreference]} THB`}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Starter Kit */}
                        <div className="pb-4 border-b border-sand/60">
                          <div className="flex items-center gap-2 mb-1">
                            <Gift className="h-4 w-4 text-success" />
                            <span className="text-sm font-medium text-success">
                              Starter Kit included for each rider
                            </span>
                          </div>
                          <p className="text-xs text-ink-muted pl-6">
                            {STARTER_KIT.join(" · ")}
                          </p>
                        </div>

                        {/* Price breakdown */}
                        <div className="pt-2 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-ink-muted">
                              Ride ({riderCount} ×{" "}
                              {activePackage.pricePerPerson.toLocaleString()}{" "}
                              THB)
                            </span>
                            <span className="font-medium">
                              {rideSubtotal.toLocaleString()} THB
                            </span>
                          </div>
                          {rentalSubtotal > 0 && (
                            <div className="flex justify-between text-sm">
                              <span className="text-ink-muted">
                                Bike rentals (paid at track)
                              </span>
                              <span className="font-medium">
                                {rentalSubtotal.toLocaleString()} THB
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between pt-3 border-t border-sand/60">
                            <span className="font-bold text-lg">
                              Total
                            </span>
                            <span className="font-bold text-lg text-accent">
                              {totalPrice.toLocaleString()} THB
                            </span>
                          </div>
                          {rentalSubtotal > 0 && (
                            <p className="text-xs text-ink-muted">
                              Pay {rideSubtotal.toLocaleString()} THB now via
                              PromptPay · Bike rental (
                              {rentalSubtotal.toLocaleString()} THB) paid at
                              track
                            </p>
                          )}
                        </div>
                      </div>
                    </Card>

                    {/* What to bring reminder */}
                    <div className="mb-6 p-4 rounded-xl bg-sky/5 border border-sky/20">
                      <div className="flex items-start gap-3">
                        <Package className="h-5 w-5 text-sky mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-semibold text-sm text-ink">
                            Ready-to-Ride checklist
                          </p>
                          <p className="text-xs text-ink-muted mt-1">
                            {READY_TO_RIDE.join(" · ")}
                          </p>
                          <p className="text-xs text-ink-muted mt-1">
                            We&apos;ll send the full prep guide via LINE after
                            booking.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Email Verification (for guest users) */}
                    {showEmailVerification && !emailVerified ? (
                      <div className="mb-6">
                        <EmailVerification
                          initialEmail={contactEmail}
                          contactName={contactName}
                          onVerified={handleEmailVerified}
                        />
                      </div>
                    ) : (
                      <>
                        {bookingError && (
                          <div className="mb-4 flex items-center gap-2 p-3 rounded-lg bg-error/5 text-error text-sm">
                            <AlertCircle className="h-4 w-4 flex-shrink-0" />
                            {bookingError}
                          </div>
                        )}

                        <Button
                          variant="secondary"
                          size="lg"
                          fullWidth
                          onClick={handleSubmitBooking}
                          loading={isSubmitting}
                          className="text-base"
                        >
                          {isSubmitting
                            ? "Creating booking..."
                            : emailVerified
                            ? `Confirm & Pay ${rideSubtotal.toLocaleString()} THB`
                            : `Verify Email & Pay ${rideSubtotal.toLocaleString()} THB`}
                        </Button>
                        <p className="mt-3 text-xs text-center text-ink-muted">
                          {emailVerified
                            ? `You'll see a PromptPay QR code to scan with your banking app.`
                            : `We'll verify your email, then show you a PromptPay QR code.`}
                          {" "}Confirmation sent via LINE {LINE_OA}.
                        </p>
                      </>
                    )}
                  </div>
                )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation + Summary */}
        <div className="mt-8 flex items-center justify-between">
          <button
            onClick={prev}
            disabled={currentStep === 0}
            className="flex items-center gap-1 text-sm font-medium text-ink-muted hover:text-ink disabled:opacity-0 transition-all"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </button>

          {/* Live price summary */}
          {activePackage && STEPS[currentStep].id !== "review" && (
            <div className="text-right">
              <p className="text-xs text-ink-muted">Estimated total</p>
              <p className="text-lg font-bold text-ink">
                {totalPrice.toLocaleString()}{" "}
                <span className="text-sm font-normal text-ink-muted">THB</span>
              </p>
            </div>
          )}

          {STEPS[currentStep].id !== "review" && (
            <Button onClick={next} disabled={!canProceed()} arrow>
              Continue
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
