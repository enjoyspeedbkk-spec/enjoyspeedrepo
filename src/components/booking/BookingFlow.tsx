"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useLiff } from "@/lib/liff/useLiff";
import { formatDate } from "@/lib/format";
import { motion, AnimatePresence } from "framer-motion";
import { AnimatedNumber, AnimatedPrice } from "@/components/ui/AnimatedNumber";
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
  RIDE_PACKAGES as FALLBACK_PACKAGES,
  TIME_SLOTS as FALLBACK_SLOTS,
  BIKE_RENTAL_PRICES as FALLBACK_BIKE_PRICES,
  STARTER_KIT,
  READY_TO_RIDE,
  LINE_OA,
} from "@/lib/constants";
import type { LiveConfig } from "@/lib/actions/config";
import type {
  GroupType,
  TimeSlotId,
  BikePreference,
  RiderInfo,
  CyclingExperience,
  ClothingSize,
} from "@/types";
import { createBooking, getAvailableSlots } from "@/lib/actions/booking";
import { PaymentPromptPay } from "@/components/booking/PaymentPromptPay";
import { EmailVerification } from "@/components/booking/EmailVerification";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { messages } from "@/lib/i18n";

// ------ Step definitions ------
const STEPS = [
  { id: "date", labelKey: "booking.date", icon: CalendarDays },
  { id: "time", labelKey: "booking.time", icon: Clock },
  { id: "package", labelKey: "booking.package", icon: Users },
  { id: "riders", labelKey: "booking.riders", icon: UserPlus },
  { id: "waiver", labelKey: "booking.waiver", icon: ShieldCheck },
  { id: "review", labelKey: "booking.reviewAndPay", icon: CreditCard },
] as const;

type StepId = (typeof STEPS)[number]["id"];

// Package icon mapping
const packageIcons: Record<GroupType, typeof Star> = {
  duo: Star,
  squad: Zap,
  peloton: Crown,
};

// Clothing size options
const SIZES: ClothingSize[] = ["S", "M", "L", "XL", "2XL", "3XL", "4XL"];

function createEmptyRider(index: number): RiderInfo {
  return {
    name: "",
    nickname: "",
    bikePreference: undefined,
    clothingSize: undefined,
    heightCm: undefined,
    gender: undefined,
    cyclingExperience: undefined,
    emergencyContactName: "",
    emergencyContactPhone: "",
  };
}

import type { PendingBookingInfo } from "@/lib/actions/bookings";
import {
  getActivePromotions,
  calculatePromotionDiscount,
  type ActivePromotion,
} from "@/lib/actions/promotions";

interface BookingFlowProps {
  userEmail?: string;
  userName?: string;
  userId?: string; // undefined = guest user (book-first flow)
  pendingBookings?: PendingBookingInfo[];
  liveConfig?: LiveConfig;
}

export function BookingFlow({ userEmail = "", userName = "", userId, pendingBookings = [], liveConfig }: BookingFlowProps) {
  const { t, locale } = useLanguage();
  const dict = messages[locale] as Record<string, Record<string, unknown>>;
  const translatedStarterKit = (dict.booking?.starterKitItems as string[]) ?? STARTER_KIT;
  const translatedReadyToRide = (dict.booking?.readyToRideItems as string[]) ?? READY_TO_RIDE;

  // ── Live config from DB (with fallback to hardcoded constants) ──
  const RIDE_PACKAGES = useMemo(() => {
    if (liveConfig?.packages?.length) {
      return liveConfig.packages.map((p) => ({
        type: p.type as GroupType,
        name: p.name,
        nameKey: `packages.${p.type}.name`,
        minRiders: p.minRiders,
        maxRiders: p.maxRiders,
        pricePerPerson: p.pricePerPerson,
        leadersCount: p.leadersCount,
        heroesCount: p.heroesCount,
      }));
    }
    return FALLBACK_PACKAGES;
  }, [liveConfig]);

  const BIKE_RENTAL_PRICES: Record<string, number> = useMemo(() => {
    if (liveConfig?.bikeRentalPrices && Object.keys(liveConfig.bikeRentalPrices).length > 0) {
      return liveConfig.bikeRentalPrices;
    }
    return FALLBACK_BIKE_PRICES;
  }, [liveConfig]);

  const TIME_SLOTS = useMemo(() => {
    if (liveConfig?.timeSlots?.length) {
      return liveConfig.timeSlots.map((s) => ({
        id: s.id as import("@/types").TimeSlotId,
        label: s.label,
        labelKey: `timeSlots.${s.id}.label`,
        startTime: s.startTime,
        endTime: s.endTime,
        period: s.period as "morning" | "evening",
        overlaps: s.overlaps as import("@/types").TimeSlotId[],
      }));
    }
    return FALLBACK_SLOTS;
  }, [liveConfig]);
  const experienceOptions: { value: CyclingExperience; label: string; desc: string }[] = [
    { value: "beginner", label: t("booking.beginner"), desc: t("booking.firstTimeOrVeryFewRides") },
    { value: "intermediate", label: t("booking.intermediate"), desc: t("booking.rideOccasionally") },
    { value: "experienced", label: t("booking.experienced"), desc: t("booking.regularCyclist") },
  ];
  const bikeOptions: { value: BikePreference; label: string; price: string; desc: string }[] = [
    {
      value: "hybrid" as BikePreference,
      label: t("booking.bikeOptionHybrid"),
      price: `${(BIKE_RENTAL_PRICES.hybrid ?? 420).toLocaleString()} THB`,
      desc: t("booking.bikeOptionHybridDesc"),
    },
    {
      value: "road" as BikePreference,
      label: t("booking.bikeOptionRoad"),
      price: `${(BIKE_RENTAL_PRICES.road ?? 720).toLocaleString()} THB`,
      desc: t("booking.bikeOptionRoadDesc"),
    },
    {
      value: "own" as BikePreference,
      label: t("booking.bikeOptionOwn"),
      price: t("booking.bikeOptionOwnPrice"),
      desc: t("booking.bikeOptionOwnDesc"),
    },
  ];
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
  const [emailVerified, setEmailVerified] = useState(!!userId);
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSizeChart, setShowSizeChart] = useState(false);

  // Test mode state — set when admin email is verified
  const [isTestMode, setIsTestMode] = useState(false);

  // Pending bookings — user can choose to resume payment or start fresh
  const [showPendingResume, setShowPendingResume] = useState(pendingBookings.length > 0);
  const [resumingBooking, setResumingBooking] = useState<PendingBookingInfo | null>(null);

  // Booking state persistence
  const BOOKING_DRAFT_KEY = "enjoyspeed_booking_draft";
  const [draftRestored, setDraftRestored] = useState(false);

  // Slot availability for selected date
  const [bookedSlotIds, setBookedSlotIds] = useState<Set<string>>(new Set());
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Active promotions for date range
  const [promotions, setPromotions] = useState<ActivePromotion[]>([]);

  // Restore booking draft from sessionStorage on mount
  useEffect(() => {
    if (draftRestored) return;
    setDraftRestored(true);

    try {
      const saved = sessionStorage.getItem(BOOKING_DRAFT_KEY);
      if (!saved) return;

      const draft = JSON.parse(saved);
      // Expire drafts older than 2 hours
      if (Date.now() - draft.savedAt > 2 * 60 * 60 * 1000) {
        sessionStorage.removeItem(BOOKING_DRAFT_KEY);
        return;
      }

      if (draft.selectedDate) setSelectedDate(draft.selectedDate);
      if (draft.selectedSlot) setSelectedSlot(draft.selectedSlot);
      if (draft.selectedPackage) setSelectedPackage(draft.selectedPackage);
      if (draft.riderCount) setRiderCount(draft.riderCount);
      if (draft.riders?.length) setRiders(draft.riders);
      if (draft.contactName && !contactName) setContactName(draft.contactName);
      if (draft.contactPhone) setContactPhone(draft.contactPhone);
      if (draft.contactEmail && !contactEmail) setContactEmail(draft.contactEmail);
      if (draft.waiverAccepted) setWaiverAccepted(draft.waiverAccepted);
      if (draft.currentStep > 0) setCurrentStep(draft.currentStep);
    } catch {
      // Invalid draft — ignore
    }
  }, []); // empty deps — run once on mount

  // LINE LIFF integration — auto-populate if opened from LINE
  const liff = useLiff();
  const [liffLineId, setLiffLineId] = useState<string | null>(null);
  const didLiffPopulate = useRef(false);

  useEffect(() => {
    if (didLiffPopulate.current || liff.loading) return;
    if (liff.isInClient && liff.profile) {
      didLiffPopulate.current = true;
      // Auto-fill name and LINE ID from LIFF
      if (!contactName && liff.profile.displayName) {
        setContactName(liff.profile.displayName);
      }
      setLiffLineId(liff.profile.userId);

      // Call the LIFF API to check if this LINE user is already linked
      fetch("/api/liff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "lookup",
          lineUserId: liff.profile.userId,
          displayName: liff.profile.displayName,
          pictureUrl: liff.profile.pictureUrl,
        }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.linked && data.userId) {
            // User is already linked — pre-fill everything
            setVerifiedUserId(data.userId);
            if (data.profile) {
              if (data.profile.name) setContactName(data.profile.name);
              if (data.profile.email) setContactEmail(data.profile.email);
              if (data.profile.emailVerified) setEmailVerified(true);
              if (data.profile.phone) {
                const digits = data.profile.phone.replace(/\D/g, "");
                const formatted =
                  digits.length === 10
                    ? `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`
                    : digits;
                setContactPhone(formatted);
              }
            }
          }
        })
        .catch(() => {});
    }
  }, [liff.loading, liff.isInClient, liff.profile, contactName]);

  const searchParams = useSearchParams();
  const didReadParams = useRef(false);

  // Pre-select package from URL ?package=duo|squad|peloton
  useEffect(() => {
    if (didReadParams.current) return;
    didReadParams.current = true;
    const pkgParam = searchParams.get("package") as GroupType | null;
    if (pkgParam && RIDE_PACKAGES.some((p) => p.type === pkgParam)) {
      setSelectedPackage(pkgParam);
      const pkg = RIDE_PACKAGES.find((p) => p.type === pkgParam);
      if (pkg) setRiderCount(pkg.minRiders);
    }
  }, [searchParams]);

  const activePackage = RIDE_PACKAGES.find((p) => p.type === selectedPackage);
  const activeSlot = TIME_SLOTS.find((s) => s.id === selectedSlot);

  // Update page title with current step
  useEffect(() => {
    const stepKey = STEPS[currentStep]?.labelKey;
    const stepLabel = stepKey ? t(stepKey) : "";
    document.title = `${stepLabel} — Book a Ride | En-Joy Speed`;
  }, [currentStep, t]);

  // Save booking draft to sessionStorage whenever relevant state changes
  useEffect(() => {
    if (completedBooking) {
      sessionStorage.removeItem(BOOKING_DRAFT_KEY);
      return;
    }
    // Don't save if nothing selected yet or draft hasn't been restored
    if (!draftRestored || (!selectedDate && !selectedPackage)) return;

    const draft = {
      selectedDate,
      selectedSlot,
      selectedPackage,
      riderCount,
      riders: riders.slice(0, riderCount),
      contactName,
      contactPhone,
      contactEmail,
      waiverAccepted,
      currentStep,
      savedAt: Date.now(),
    };
    sessionStorage.setItem(BOOKING_DRAFT_KEY, JSON.stringify(draft));
  }, [
    selectedDate,
    selectedSlot,
    selectedPackage,
    riderCount,
    riders,
    contactName,
    contactPhone,
    contactEmail,
    waiverAccepted,
    currentStep,
    completedBooking,
    draftRestored,
    BOOKING_DRAFT_KEY,
  ]);

  // Fetch booked slots when selected date changes
  useEffect(() => {
    if (!selectedDate) return;
    let cancelled = false;
    setLoadingSlots(true);
    (async () => {
      try {
        const result = await getAvailableSlots(selectedDate, selectedDate);
        if (cancelled) return;
        // Slots that already have a booking → blocked
        const booked = new Set<string>();
        const sessions = result?.sessions ?? [];
        for (const s of sessions) {
          if (s.hasBooking) booked.add(s.time_slot_id);
        }
        // Also block overlapping periods: if any morning slot (A1/A2) is booked, block the other
        // If any evening slot (B/C/D) is booked, block all evening slots
        const morningIds = ["A1", "A2"];
        const eveningIds = ["B", "C", "D"];
        const hasMorningBooking = morningIds.some((id) => booked.has(id));
        const hasEveningBooking = eveningIds.some((id) => booked.has(id));
        if (hasMorningBooking) morningIds.forEach((id) => booked.add(id));
        if (hasEveningBooking) eveningIds.forEach((id) => booked.add(id));
        setBookedSlotIds(booked);
        // If the currently selected slot is now blocked, deselect it
        if (selectedSlot && booked.has(selectedSlot)) {
          setSelectedSlot(null);
        }
      } catch (err) {
        // Slot availability check failed — don't block the user from booking
        console.warn("Slot availability check failed:", err);
        if (!cancelled) setBookedSlotIds(new Set());
      } finally {
        if (!cancelled) setLoadingSlots(false);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedDate]); // eslint-disable-line react-hooks/exhaustive-deps

  // Generate next 30 days
  const availableDates = useMemo(() => {
    const dates = [];
    const now = new Date();
    for (let i = 1; i <= 30; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() + i);
      dates.push(d);
    }
    return dates;
  }, []);

  // Fetch active promotions for the 30-day date range
  useEffect(() => {
    if (availableDates.length === 0) return;
    const from = availableDates[0].toISOString().split("T")[0];
    const to = availableDates[availableDates.length - 1].toISOString().split("T")[0];
    getActivePromotions(from, to).then(setPromotions).catch(() => {});
  }, [availableDates]);

  // Helper: get promotions applicable to a specific date
  const getPromosForDate = useCallback(
    (dateStr: string) =>
      promotions.filter((p) => p.starts_on <= dateStr && p.ends_on >= dateStr),
    [promotions]
  );

  // Best applicable promotion for current selection
  const activePromo = useMemo(() => {
    if (!selectedDate || !selectedPackage || promotions.length === 0) return null;
    const datePromos = getPromosForDate(selectedDate);
    const pkg = RIDE_PACKAGES.find((p) => p.type === selectedPackage);
    if (!pkg || datePromos.length === 0) return null;

    // Filter by package + rider count
    const applicable = datePromos.filter((p) => {
      if (p.applicable_packages && !p.applicable_packages.includes(selectedPackage)) return false;
      if (p.min_riders && riderCount < p.min_riders) return false;
      return true;
    });
    if (applicable.length === 0) return null;

    // Pick the one with the highest discount
    return applicable.reduce((best, p) => {
      const bestVal =
        best.discount_type === "percentage"
          ? pkg.pricePerPerson * (best.discount_value / 100)
          : best.discount_value;
      const pVal =
        p.discount_type === "percentage"
          ? pkg.pricePerPerson * (p.discount_value / 100)
          : p.discount_value;
      return pVal > bestVal ? p : best;
    });
  }, [selectedDate, selectedPackage, riderCount, promotions, getPromosForDate]);

  // Discounted price per person (if promotion applies)
  const promoDiscount = useMemo(() => {
    if (!activePromo || !activePackage) return null;
    return calculatePromotionDiscount(activePackage.pricePerPerson, activePromo);
  }, [activePromo, activePackage]);

  // Calculate total with per-rider bike preferences (promo-aware)
  const effectivePricePerPerson = promoDiscount
    ? promoDiscount.discountedPrice
    : activePackage?.pricePerPerson ?? 0;

  const totalPrice = useMemo(() => {
    if (!activePackage) return 0;
    const rideTotal = effectivePricePerPerson * riderCount;
    const rentalTotal = riders.slice(0, riderCount).reduce((sum, rider) => {
      return sum + BIKE_RENTAL_PRICES[rider.bikePreference || "hybrid"];
    }, 0);
    return rideTotal + rentalTotal;
  }, [activePackage, effectivePricePerPerson, riderCount, riders]);

  const rideSubtotal = activePackage
    ? effectivePricePerPerson * riderCount
    : 0;
  const rentalSubtotal = riders.slice(0, riderCount).reduce((sum, rider) => {
    return sum + BIKE_RENTAL_PRICES[rider.bikePreference || "hybrid"];
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
        // All riders must have a name, bike preference, and cycling experience
        const activeRiders = riders.slice(0, riderCount);
        return activeRiders.every(
          (r) => r.name.trim().length > 0 && r.bikePreference && r.cyclingExperience
        );
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
  const handleEmailVerified = (email: string, newUserId: string) => {
    setContactEmail(email);
    setVerifiedUserId(newUserId);
    setEmailVerified(true);
    setShowEmailVerification(false);

    // Check if this is the admin email (test mode)
    const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
    if (adminEmail && email.toLowerCase() === adminEmail.toLowerCase()) {
      setIsTestMode(true);
    }

    // Now proceed to create the booking — LINE linking happens in submitBookingWithUser
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
      contactLineId: liffLineId || "",
      specialRequests: "",
      waiverAccepted,
      locale: locale as "en" | "th",
      userId: userIdToUse, // Pass verified user ID for guest bookings
    });

    setIsSubmitting(false);

    if (result.success && result.bookingId) {
      // If LIFF user, link their LINE account to the verified Supabase user
      if (liffLineId && userIdToUse) {
        fetch("/api/liff", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "link",
            lineUserId: liffLineId,
            displayName: liff.profile?.displayName,
            pictureUrl: liff.profile?.pictureUrl,
          }),
        }).catch(() => {}); // Non-blocking — don't fail booking if link fails
      }

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
        promptPayTarget={process.env.NEXT_PUBLIC_PROMPTPAY_ACCOUNT || "0000000000"}
        contactName={contactName || userName}
      />
    );
  }

  // If user chose to resume a specific pending booking
  if (resumingBooking) {
    return (
      <PaymentPromptPay
        bookingId={resumingBooking.bookingId}
        amount={resumingBooking.paymentAmount}
        rentalAmount={resumingBooking.rentalAmount}
        promptPayTarget={process.env.NEXT_PUBLIC_PROMPTPAY_ACCOUNT || "0000000000"}
        contactName={resumingBooking.contactName}
        createdAt={resumingBooking.createdAt}
      />
    );
  }

  return (
    <section className="min-h-screen pt-24 pb-16 bg-cream">
      <div className="mx-auto max-w-4xl px-6 lg:px-8">
        {/* Test Mode Banner */}
        {isTestMode && emailVerified && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-xl bg-warning/10 border-2 border-warning/30 flex items-center gap-3"
          >
            <Zap className="h-5 w-5 text-warning flex-shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-warning text-sm">{t("booking.testModeActive")}</p>
              <p className="text-xs text-warning/80 mt-0.5">{t("booking.testModeExpiry")}</p>
            </div>
            <Badge variant="warning">TEST</Badge>
          </motion.div>
        )}

        {/* Pending Bookings Banner — list all unpaid bookings or start new */}
        {showPendingResume && pendingBookings.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-2xl bg-sky/10 border border-sky/30 overflow-hidden"
          >
            <div className="flex items-start gap-3 px-5 pt-5 pb-3">
              <QrCode className="h-5 w-5 text-sky-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-ink text-sm">
                  {pendingBookings.length === 1
                    ? t("booking.pendingBookingTitle")
                    : t("booking.pendingBookingsTitle")}
                </p>
                <p className="text-xs text-ink-muted mt-1">
                  {t("booking.pendingBookingDesc")}
                </p>
              </div>
            </div>

            {/* List each pending booking */}
            <div className="px-5 pb-3 space-y-2">
              {pendingBookings.map((pb) => {
                const slot = TIME_SLOTS.find((s) => s.id === pb.timeSlotId);
                const pkg = RIDE_PACKAGES.find((p) => p.type === pb.groupType);
                const dateLabel = pb.rideDate
                  ? new Date(pb.rideDate).toLocaleDateString(locale === "th" ? "th-TH" : "en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })
                  : null;
                return (
                  <button
                    key={pb.bookingId}
                    onClick={() => setResumingBooking(pb)}
                    className="w-full flex items-center justify-between gap-3 p-3 rounded-xl bg-white border border-sand/60 hover:border-accent/40 hover:bg-accent/5 transition-colors text-left group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                        <CreditCard className="h-4 w-4 text-accent" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-ink truncate">
                          {pkg?.name || pb.groupType} · {pb.riderCount} rider{pb.riderCount > 1 ? "s" : ""}
                        </p>
                        <p className="text-xs text-ink-muted mt-0.5">
                          {dateLabel && <span>{dateLabel}</span>}
                          {dateLabel && slot && <span> · </span>}
                          {slot && <span>{slot.startTime}</span>}
                          {!dateLabel && !slot && <span>#{pb.bookingId.slice(0, 8).toUpperCase()}</span>}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-sm font-bold text-accent">
                        {pb.paymentAmount.toLocaleString()} <span className="text-xs font-normal">THB</span>
                      </span>
                      <ChevronRight className="h-4 w-4 text-ink-muted group-hover:text-accent transition-colors" />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Start new booking button */}
            <div className="px-5 pb-5">
              <button
                onClick={() => setShowPendingResume(false)}
                className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-white border border-sand/60 px-5 py-2.5 text-sm font-semibold text-ink hover:bg-cream transition-colors"
              >
                <CalendarDays className="h-4 w-4" />
                {t("booking.startNewBooking")}
              </button>
            </div>
          </motion.div>
        )}

        {/* Header */}
        <div className="text-center mb-10">
          <Badge variant="accent">{t("booking.bookYourRideBadge")}</Badge>
          <h1 className="mt-4 text-3xl lg:text-4xl font-bold">
            {t("booking.setupTitle")}
          </h1>
          <p className="mt-2 text-ink-muted">
            {t("booking.setupSubtitle")}
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-12">
          {/* Mobile: current step indicator */}
          <div className="sm:hidden flex items-center justify-between mb-3 px-1">
            <p className="text-xs text-ink-muted font-medium">
              {t("booking.stepOf", { current: String(currentStep + 1), total: String(STEPS.length) })}
            </p>
            <p className="text-xs font-semibold text-ink">{t(STEPS[currentStep].labelKey)}</p>
          </div>
          {/* Progress bar (mobile) / Step pills (desktop) */}
          <div className="sm:hidden h-1.5 bg-sand/40 rounded-full overflow-hidden mb-4">
            <div
              className="h-full bg-ink rounded-full transition-all duration-500"
              style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
            />
          </div>
          <div className="hidden sm:flex items-center justify-center gap-1 overflow-x-auto pb-2">
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
                  <span className="text-xs">{t(step.labelKey)}</span>
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
                  <h2 className="text-xl font-bold mb-2">{t("booking.pickYourDate")}</h2>
                  <p className="text-sm text-ink-muted mb-6">
                    {t("booking.pickYourDateDesc")}
                  </p>
                  {/* Mobile: Horizontal carousel, Desktop: Calendar grid */}
                  {/* Mobile carousel */}
                  <div className="sm:hidden -mx-4 px-4">
                    <div className="flex gap-2 overflow-x-auto pb-2 snap-x snap-mandatory">
                      {availableDates.map((date) => {
                        const dateStr = date.toISOString().split("T")[0];
                        const isSelected = selectedDate === dateStr;
                        const dateLocale = locale === "th" ? "th-TH" : "en-US";
                        const dayName = date.toLocaleDateString(dateLocale, {
                          weekday: "short",
                        });
                        const dayNum = date.getDate();
                        const month = date.toLocaleDateString(dateLocale, {
                          month: "short",
                        });
                        const datePromos = getPromosForDate(dateStr);
                        const hasPromo = datePromos.length > 0;
                        const topPromo = datePromos[0];

                        return (
                          <button
                            key={dateStr}
                            onClick={() => setSelectedDate(dateStr)}
                            className={`relative flex flex-col items-center py-3 px-2 rounded-lg border-2 transition-all duration-200 flex-shrink-0 snap-start ${
                              isSelected
                                ? "border-ink bg-ink text-cream shadow-md"
                                : hasPromo
                                ? "border-amber-300 bg-amber-50 hover:border-amber-400 hover:shadow-sm"
                                : "border-sand/60 bg-surface hover:border-ink/20 hover:shadow-sm"
                            }`}
                            style={{ width: "70px" }}
                          >
                            {hasPromo && (
                              <span
                                className="absolute -top-2 left-1/2 -translate-x-1/2 px-1.5 py-px rounded-full text-[8px] font-bold text-white uppercase tracking-wide whitespace-nowrap"
                                style={{ backgroundColor: topPromo.badge_color }}
                              >
                                {topPromo.badge_label}
                              </span>
                            )}
                            <span
                              className={`text-xs font-medium ${
                                isSelected ? "text-cream/90" : "text-ink-muted"
                              }`}
                            >
                              {dayName}
                            </span>
                            <span className={`text-xl font-bold mt-1 ${isSelected ? "text-cream" : "text-ink"}`}>
                              {dayNum}
                            </span>
                            <span
                              className={`text-xs ${
                                isSelected ? "text-cream/90" : "text-ink-muted"
                              }`}
                            >
                              {month}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Desktop: Calendar grid (7-column layout) */}
                  <div className="hidden sm:grid sm:grid-cols-4 lg:grid-cols-7 gap-3">
                    {availableDates.map((date) => {
                      const dateStr = date.toISOString().split("T")[0];
                      const isSelected = selectedDate === dateStr;
                      const dateLocale = locale === "th" ? "th-TH" : "en-US";
                      const dayName = date.toLocaleDateString(dateLocale, {
                        weekday: "short",
                      });
                      const dayNum = date.getDate();
                      const month = date.toLocaleDateString(dateLocale, {
                        month: "short",
                      });
                      const datePromos = getPromosForDate(dateStr);
                      const hasPromo = datePromos.length > 0;
                      const topPromo = datePromos[0];

                      return (
                        <button
                          key={dateStr}
                          onClick={() => setSelectedDate(dateStr)}
                          className={`relative flex flex-col items-center py-4 px-3 rounded-xl border-2 transition-all duration-200 ${
                            isSelected
                              ? "border-ink bg-ink text-cream shadow-md scale-[1.02]"
                              : hasPromo
                              ? "border-amber-300 bg-amber-50 hover:border-amber-400 hover:shadow-sm ring-1 ring-amber-200"
                              : "border-sand/60 bg-surface hover:border-ink/20 hover:shadow-sm"
                          }`}
                        >
                          {hasPromo && (
                            <span
                              className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[9px] font-bold text-white uppercase tracking-wide whitespace-nowrap shadow-sm"
                              style={{ backgroundColor: topPromo.badge_color }}
                            >
                              {topPromo.badge_label}
                            </span>
                          )}
                          <span
                            className={`text-xs font-medium ${
                              isSelected ? "text-cream/90" : "text-ink-muted"
                            }`}
                          >
                            {dayName}
                          </span>
                          <span className={`text-2xl font-bold mt-1 ${isSelected ? "text-cream" : "text-ink"}`}>
                            {dayNum}
                          </span>
                          <span
                            className={`text-xs ${
                              isSelected ? "text-cream/90" : "text-ink-muted"
                            }`}
                          >
                            {month}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-3 text-xs text-ink-muted text-center">
                    {t("booking.availabilityNote")}
                  </p>

                  {/* Promotion banner when a promoted date is selected */}
                  {selectedDate && getPromosForDate(selectedDate).length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200"
                    >
                      {getPromosForDate(selectedDate).map((promo) => (
                        <div key={promo.id} className="flex items-start gap-3">
                          <span
                            className="mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold text-white uppercase tracking-wide flex-shrink-0"
                            style={{ backgroundColor: promo.badge_color }}
                          >
                            {promo.badge_label}
                          </span>
                          <div>
                            <p className="text-sm font-semibold text-ink">
                              {locale === "th" && promo.name_th ? promo.name_th : promo.name}
                            </p>
                            <p className="text-xs text-ink-muted mt-0.5">
                              {locale === "th" && promo.description_th
                                ? promo.description_th
                                : promo.description ||
                                  (promo.discount_type === "percentage"
                                    ? `${promo.discount_value}% ${t("booking.promoOff")}`
                                    : `${promo.discount_value.toLocaleString()} THB ${t("booking.promoOff")}`)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </div>
              )}

              {/* ===================== STEP 2: Time Slot ===================== */}
              {STEPS[currentStep].id === "time" && (
                <div>
                  <h2 className="text-xl font-bold mb-2">{t("booking.chooseYourTime")}</h2>
                  <p className="text-sm text-ink-muted mb-6">
                    {t("booking.morningVibe")}
                  </p>

                  {/* Morning */}
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Sunrise className="h-4 w-4 text-sky" />
                      <span className="text-sm font-semibold text-ink">
                        {t("booking.morning")}
                      </span>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {TIME_SLOTS.filter((s) => s.period === "morning").map(
                        (slot) => {
                          const isSelected = selectedSlot === slot.id;
                          const isBooked = bookedSlotIds.has(slot.id);
                          return (
                            <button
                              key={slot.id}
                              onClick={() => !isBooked && setSelectedSlot(slot.id)}
                              disabled={isBooked}
                              className={`flex items-center justify-between p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                                isBooked
                                  ? "border-sand/30 bg-sand/10 opacity-50 cursor-not-allowed"
                                  : isSelected
                                  ? "border-ink bg-ink text-cream shadow-md"
                                  : "border-sand/60 bg-surface hover:border-ink/20"
                              }`}
                            >
                              <div>
                                <p className={`font-semibold ${isBooked ? "text-ink-muted" : isSelected ? "text-cream" : "text-ink"}`}>{slot.labelKey ? t(slot.labelKey) : slot.label}</p>
                                <p
                                  className={`text-sm ${
                                    isBooked
                                      ? "text-ink-muted/60"
                                      : isSelected
                                      ? "text-cream/90"
                                      : "text-ink-muted"
                                  }`}
                                >
                                  {isBooked ? t("booking.slotBooked") : `${slot.startTime} — ${slot.endTime}`}
                                </p>
                              </div>
                              <span
                                className={`text-xs font-medium px-2 py-1 rounded-full ${
                                  isBooked
                                    ? "bg-sand/20 text-ink-muted/50"
                                    : isSelected
                                    ? "bg-cream/25 text-cream"
                                    : "bg-sky/10 text-sky-dark"
                                }`}
                              >
                                {isBooked ? t("booking.slotFull") : `${t("booking.slotPrefix")} ${slot.id}`}
                              </span>
                            </button>
                          );
                        }
                      )}
                    </div>
                    <p className="mt-2 text-xs text-sky-dark flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky" />
                      {t("booking.morningOverlapNote")}
                    </p>
                  </div>

                  {/* Evening */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Sunset className="h-4 w-4 text-accent" />
                      <span className="text-sm font-semibold text-ink">
                        {t("booking.evening")}
                      </span>
                    </div>
                    <div className="grid sm:grid-cols-3 gap-3">
                      {TIME_SLOTS.filter((s) => s.period === "evening").map(
                        (slot) => {
                          const isSelected = selectedSlot === slot.id;
                          const isBooked = bookedSlotIds.has(slot.id);
                          return (
                            <button
                              key={slot.id}
                              onClick={() => !isBooked && setSelectedSlot(slot.id)}
                              disabled={isBooked}
                              className={`flex flex-col p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                                isBooked
                                  ? "border-sand/30 bg-sand/10 opacity-50 cursor-not-allowed"
                                  : isSelected
                                  ? "border-ink bg-ink text-cream shadow-md"
                                  : "border-sand/60 bg-surface hover:border-ink/20"
                              }`}
                            >
                              <span
                                className={`text-xs font-medium px-2 py-0.5 rounded-full self-start mb-2 ${
                                  isBooked
                                    ? "bg-sand/20 text-ink-muted/50"
                                    : isSelected
                                    ? "bg-cream/25 text-cream"
                                    : slot.id === "C"
                                    ? "bg-accent/10 text-accent-dark"
                                    : "bg-accent/10 text-accent-dark"
                                }`}
                              >
                                {isBooked ? t("booking.slotFull") : slot.id === "C" ? t("booking.staffPick") : slot.id === "D" ? t("booking.scenic") : `${t("booking.slotPrefix")} ${slot.id}`}
                              </span>
                              <p className={`font-semibold ${isBooked ? "text-ink-muted" : isSelected ? "text-cream" : "text-ink"}`}>{slot.labelKey ? t(slot.labelKey) : slot.label}</p>
                              <p
                                className={`text-sm ${
                                  isBooked
                                    ? "text-ink-muted/60"
                                    : isSelected
                                    ? "text-cream/90"
                                    : "text-ink-muted"
                                }`}
                              >
                                {isBooked ? t("booking.slotBooked") : `${slot.startTime} — ${slot.endTime}`}
                              </p>
                            </button>
                          );
                        }
                      )}
                    </div>
                    <p className="mt-2 text-xs text-ink-muted">
                      <strong>{t("booking.staffPick")}</strong> = most popular time. <strong>{t("booking.scenic")}</strong> = best golden hour light.
                    </p>
                  </div>
                </div>
              )}

              {/* ===================== STEP 3: Package ===================== */}
              {STEPS[currentStep].id === "package" && (
                <div>
                  <h2 className="text-xl font-bold mb-2">
                    {t("booking.chooseYourRideType")}
                  </h2>
                  <p className="text-sm text-ink-muted mb-6">
                    {t("booking.chooseYourRideTypeDesc")}
                  </p>
                  <div className="grid sm:grid-cols-3 gap-4">
                    {RIDE_PACKAGES.map((pkg) => {
                      const isSelected = selectedPackage === pkg.type;
                      const Icon = packageIcons[pkg.type];
                      return (
                        <button
                          key={pkg.type}
                          onClick={() => handlePackageSelect(pkg.type)}
                          className={`relative overflow-visible flex flex-col p-6 rounded-2xl border-2 text-left transition-all duration-200 ${
                            isSelected
                              ? "border-ink bg-ink text-cream shadow-lg scale-[1.02]"
                              : "border-sand/60 bg-surface hover:border-ink/20 hover:shadow-sm"
                          }`}
                        >
                          {pkg.type === "squad" && (
                            <span
                              className={`absolute -top-2.5 left-1/2 -translate-x-1/2 text-xs font-bold uppercase tracking-wider px-3 py-0.5 rounded-full whitespace-nowrap z-10 ${
                                isSelected
                                  ? "bg-accent text-white shadow-md"
                                  : "bg-accent text-white shadow-sm"
                              }`}
                            >
                              {t("booking.mostPopular")}
                            </span>
                          )}
                          <Icon
                            className={`h-6 w-6 mb-3 ${
                              isSelected ? "text-cream" : "text-accent"
                            }`}
                          />
                          <h3 className={`text-lg font-bold ${isSelected ? "text-cream" : "text-ink"}`}>{pkg.nameKey ? t(pkg.nameKey) : pkg.name}</h3>
                          <p
                            className={`text-sm mt-1 ${
                              isSelected ? "text-cream/90" : "text-ink-muted"
                            }`}
                          >
                            {pkg.minRiders}
                            {pkg.maxRiders !== pkg.minRiders
                              ? `–${pkg.maxRiders}`
                              : ""}{" "}
                            {t("booking.ridersUnit")}
                          </p>
                          <div className="mt-4 pt-4 border-t border-current/10">
                            <p className={`text-2xl font-bold ${isSelected ? "text-cream" : "text-ink"}`}>
                              {pkg.pricePerPerson.toLocaleString()}
                              <span
                                className={`text-xs font-normal ml-1 ${
                                  isSelected
                                    ? "text-cream/90"
                                    : "text-ink-muted"
                                }`}
                              >
                                {t("booking.thbPerPerson")}
                              </span>
                            </p>
                            <p
                              className={`text-xs mt-1 ${
                                isSelected ? "text-cream/90" : "text-ink-muted"
                              }`}
                            >
                              {pkg.leadersCount} {t("booking.leaderLabel")}{pkg.leadersCount > 1 ? t("booking.leaderPluralSuffix") : ""}
                              {pkg.heroesCount > 0
                                ? ` + ${pkg.heroesCount} ${t("booking.heroSweepLabel")}`
                                : ""}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <p className="mt-3 text-xs text-ink-muted text-center">
                    {t("booking.leadersNote")}
                  </p>

                  {/* Starter Kit callout */}
                  <div className="mt-4 p-4 rounded-xl bg-success/5 border border-success/20">
                    <div className="flex items-start gap-3">
                      <Gift className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-sm text-ink">
                          {t("booking.starterKitIncludedBadge")}
                        </p>
                        <p className="text-xs text-ink-muted mt-1">
                          {translatedStarterKit.join(" · ")}
                        </p>
                        <p className="text-xs text-ink-muted mt-1">
                          {t("booking.starterKitFree")}
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
                    {t("booking.tellUsAboutRiders")}
                  </h2>
                  <p className="text-sm text-ink-muted mb-6">
                    {t("booking.tellUsAboutRidersDesc")}
                  </p>

                  {/* Rider count control */}
                  {activePackage.minRiders !== activePackage.maxRiders && (
                    <Card padding="md" className="mb-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-ink">
                            {t("booking.numberOfRiders")}
                          </p>
                          <p className="text-sm text-ink-muted">
                            {activePackage.nameKey ? t(activePackage.nameKey) : activePackage.name}: {activePackage.minRiders}–
                            {activePackage.maxRiders} {t("booking.ridersUnit")}
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
                          <span className="text-2xl font-bold w-8 text-center overflow-hidden">
                            <AnimatePresence mode="wait">
                              <motion.span
                                key={riderCount}
                                initial={{ y: 12, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: -12, opacity: 0 }}
                                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                className="inline-block"
                              >
                                {riderCount}
                              </motion.span>
                            </AnimatePresence>
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
                  <div className="relative">
                  <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scroll-smooth" style={{ scrollbarWidth: "none", msOverflowStyle: "none", WebkitOverflowScrolling: "touch" }}>
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
                          : t("booking.riderTabLabel", { n: String(i + 1) })}
                      </button>
                    ))}
                  </div>
                  {riderCount > 3 && (
                    <div className="pointer-events-none absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-cream to-transparent sm:hidden" />
                  )}
                  </div>

                  {/* Active rider form */}
                  <Card padding="lg" className="space-y-5">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-lg">
                        {t("booking.riderCardTitle", { n: String(activeRiderIndex + 1) })}
                      </h3>
                      {riders[activeRiderIndex]?.name?.trim() && (
                        <Badge variant="success">{t("booking.infoProvided")}</Badge>
                      )}
                    </div>

                    {/* Name */}
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-ink mb-1.5">
                          {t("booking.fullNameLabel")} <span className="text-error">*</span>
                        </label>
                        <input
                          type="text"
                          value={riders[activeRiderIndex]?.name || ""}
                          onChange={(e) =>
                            updateRider(activeRiderIndex, "name", e.target.value)
                          }
                          placeholder={t("booking.fullNamePlaceholder")}
                          className="w-full px-4 py-3 rounded-xl border-2 border-sand/60 bg-surface text-ink placeholder:text-ink-muted/70 focus:border-ink focus:outline-none transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-ink mb-1.5">
                          {t("booking.nicknameLabel")}
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
                          placeholder={t("booking.riderNamePlaceholder")}
                          className="w-full px-4 py-3 rounded-xl border-2 border-sand/60 bg-surface text-ink placeholder:text-ink-muted/70 focus:border-ink focus:outline-none transition-colors"
                        />
                      </div>
                    </div>

                    {/* Bike Preference — PER RIDER */}
                    <div>
                      <label className="block text-sm font-medium text-ink mb-2">
                        {t("booking.bikePreferenceLabel")} <span className="text-error">*</span>
                      </label>
                      <p className="text-xs text-ink-muted mb-3">
                        {t("booking.bikeRentalNote")}
                      </p>
                      <div className="grid grid-cols-3 gap-3">
                        {bikeOptions.map((option) => (
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
                            <span className={`text-sm font-semibold ${
                                riders[activeRiderIndex]?.bikePreference ===
                                option.value
                                  ? "text-cream"
                                  : "text-ink"
                              }`}>
                              {option.label}
                            </span>
                            <span
                              className={`text-xs mt-0.5 ${
                                riders[activeRiderIndex]?.bikePreference ===
                                option.value
                                  ? "text-cream/90"
                                  : "text-ink-muted"
                              }`}
                            >
                              {option.price}
                            </span>
                            <span
                              className={`text-xs mt-1 text-center ${
                                riders[activeRiderIndex]?.bikePreference ===
                                option.value
                                  ? "text-cream/90"
                                  : "text-ink-muted/60"
                              }`}
                            >
                              {option.desc}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Height & Gender for bike setup (only for rental bikes) */}
                    {riders[activeRiderIndex]?.bikePreference !== "own" && (
                      <div className="grid sm:grid-cols-2 gap-4 p-4 rounded-xl bg-sky/5 border border-sky/20">
                        <div>
                          <label className="block text-sm font-medium text-ink mb-1.5">
                            {t("booking.heightLabel")} <span className="text-xs font-normal text-ink-muted">{t("booking.forBikeSetup")}</span>
                          </label>
                          <input
                            type="number"
                            value={riders[activeRiderIndex]?.heightCm || ""}
                            onChange={(e) =>
                              updateRider(
                                activeRiderIndex,
                                "heightCm",
                                e.target.value ? Number(e.target.value) : undefined
                              )
                            }
                            placeholder="e.g. 170"
                            className="w-full px-4 py-3 rounded-xl border-2 border-sand/60 bg-surface text-ink placeholder:text-ink-muted/70 focus:border-ink focus:outline-none transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-ink mb-1.5">
                            {t("booking.genderLabel")} <span className="text-xs font-normal text-ink-muted">{t("booking.forBikeSetup")}</span>
                          </label>
                          <div className="flex gap-2">
                            {(["male", "female"] as const).map((g) => (
                              <button
                                key={g}
                                onClick={() =>
                                  updateRider(activeRiderIndex, "gender", g)
                                }
                                className={`flex-1 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                                  riders[activeRiderIndex]?.gender === g
                                    ? "border-ink bg-ink text-cream"
                                    : "border-sand/60 bg-surface hover:border-ink/20"
                                }`}
                              >
                                {g === "male" ? t("booking.male") : t("booking.female")}
                              </button>
                            ))}
                          </div>
                        </div>
                        <p className="text-xs text-ink-muted sm:col-span-2">
                          {t("booking.bikeSetupNote")}
                        </p>
                      </div>
                    )}

                    {/* Experience */}
                    <div>
                      <label className="block text-sm font-medium text-ink mb-2">
                        {t("booking.cyclingExperienceLabel")}
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        {experienceOptions.map((opt) => (
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
                            <span className="text-xs text-ink-muted mt-0.5">
                              {opt.desc}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Clothing Size (for padded liner shorts from starter kit) */}
                    <div>
                      <label className="block text-sm font-medium text-ink mb-1">
                        {t("booking.linerShortsSize")}
                        <span className="text-xs font-normal text-ink-muted ml-2">
                          {t("booking.linerShortsValue")}
                        </span>
                      </label>
                      <div className="flex items-start gap-3 mb-3 p-3 rounded-lg bg-sand/20 border border-sand/40">
                        <button
                          type="button"
                          onClick={() => setShowSizeChart(true)}
                          className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 group ring-2 ring-accent/30 hover:ring-accent transition-all"
                        >
                          <img
                            src="/images/pants-sizing.jpg"
                            alt="Cycling liner shorts sizing reference"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-ink/40 flex items-center justify-center group-hover:bg-ink/50 transition-colors">
                            <span className="text-xs font-bold text-cream uppercase tracking-wide">{t("booking.sizeGuide")}</span>
                          </div>
                        </button>
                        <div className="flex-1">
                          <p className="text-xs text-ink-muted">
                            {t("booking.linerShortsDesc")}
                          </p>
                          <button
                            type="button"
                            onClick={() => setShowSizeChart(true)}
                            className="mt-1.5 text-xs font-semibold text-accent hover:text-accent-dark transition-colors underline underline-offset-2"
                          >
                            {t("booking.viewFullSizeChart")}
                          </button>
                        </div>
                      </div>
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
                        {t("booking.nextRider", { n: String(activeRiderIndex + 2) })}
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    )}
                  </Card>

                  {/* Rider summary */}
                  {riderCount > 1 && (
                    <div className="mt-4 p-3 rounded-xl bg-sand/20 border border-sand/40">
                      <p className="text-xs font-medium text-ink-muted mb-2">
                        {t("booking.bikeBreakdown")}
                      </p>
                      <div className="flex flex-wrap gap-2 overflow-x-auto pb-2 -mb-2">
                        {riders.slice(0, riderCount).map((r, i) => (
                          <button
                            key={i}
                            onClick={() => setActiveRiderIndex(i)}
                            className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border flex-shrink-0 transition-all ${
                              activeRiderIndex === i
                                ? "bg-ink text-cream border-ink shadow-sm"
                                : "bg-surface border-sand/60 hover:border-ink/30 cursor-pointer"
                            }`}
                          >
                            <span className={`font-medium ${activeRiderIndex === i ? "text-cream" : ""}`}>
                              {r.nickname || r.name.split(" ")[0] || `Rider ${i + 1}`}
                            </span>
                            <span className={activeRiderIndex === i ? "text-cream/70" : r.bikePreference ? "text-ink-muted" : "text-ink-muted/40 italic"}>
                              {r.clothingSize
                                ? r.clothingSize
                                : r.bikePreference
                                  ? r.bikePreference === "own"
                                    ? t("booking.ownBikeShort")
                                    : r.bikePreference
                                  : t("booking.notSet")}
                            </span>
                          </button>
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
                    {t("booking.safetyWaiverTitle")}
                  </h2>
                  <p className="text-sm text-ink-muted mb-6">
                    {t("booking.safetyWaiverDesc")}
                  </p>

                  {/* LINE notifications consent — shown only when booking through LINE */}
                  {liff.isInClient && liff.profile && (
                    <div className="flex items-start gap-3 p-4 rounded-xl bg-[#06C755]/8 border border-[#06C755]/20 mb-6">
                      {/* LINE logo mark */}
                      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#06C755] flex items-center justify-center mt-0.5">
                        <svg viewBox="0 0 48 48" className="w-5 h-5 fill-white">
                          <path d="M24 4C12.95 4 4 11.82 4 21.5c0 6.1 3.55 11.47 8.98 14.73-.38 1.4-1.38 5.07-1.58 5.86-.25.97.36 1.96 1.38 1.61.82-.28 9.44-6.23 11.42-7.54.59.07 1.19.1 1.8.1 11.05 0 20-7.82 20-17.5S35.05 4 24 4z"/>
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-ink">
                          {t("booking.lineNotificationsTitle")}
                        </p>
                        <p className="text-xs text-ink-muted mt-0.5">
                          {t("booking.lineNotificationsDesc", { name: liff.profile.displayName?.split(" ")[0] || "there" })}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Waiver text */}
                  <Card padding="md" className="mb-6 relative">
                    <div className="max-h-48 overflow-y-auto text-xs text-ink-light leading-relaxed space-y-3 pr-2 scroll-smooth" style={{ scrollbarWidth: "thin" }}>
                      <p className="font-bold text-sm text-ink">
                        {t("booking.waiverTitle")}
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
                    {/* Scroll fade hint */}
                    <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-surface to-transparent rounded-b-2xl" />
                  </Card>

                  {/* Waiver acceptance */}
                  <label
                    htmlFor="waiver-accepted"
                    className={`flex items-start gap-3 w-full p-4 rounded-xl border-2 text-left transition-all duration-200 mb-6 cursor-pointer ${
                      waiverAccepted
                        ? "border-success bg-success/5"
                        : "border-sand/60 bg-surface hover:border-ink/20"
                    }`}
                  >
                    <input
                      type="checkbox"
                      id="waiver-accepted"
                      checked={waiverAccepted}
                      onChange={(e) => setWaiverAccepted(e.target.checked)}
                      className="sr-only"
                    />
                    <div
                      aria-hidden="true"
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
                        {t("booking.acceptWaiverLabel")}
                      </p>
                      <p className="text-xs text-ink-muted mt-1">
                        {t("booking.acceptWaiverSub", { n: String(riderCount) })}
                      </p>
                    </div>
                  </label>

                  {/* Contact Info */}
                  <h3 className="font-bold text-lg mb-4">
                    {t("booking.groupContactTitle")}
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-ink mb-1.5">
                        {t("booking.contactNameLabel")} <span className="text-error">*</span>
                      </label>
                      <input
                        type="text"
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder={t("booking.emergencyContactNamePlaceholder")}
                        className="w-full px-4 py-3 rounded-xl border-2 border-sand/60 bg-surface text-ink placeholder:text-ink-muted/70 focus:border-ink focus:outline-none transition-colors"
                      />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-ink mb-1.5">
                          {t("booking.emailLabel")} <span className="text-error">*</span>
                        </label>
                        <input
                          type="email"
                          value={contactEmail}
                          onChange={(e) => setContactEmail(e.target.value)}
                          placeholder="your@email.com"
                          className={`w-full px-4 py-3 rounded-xl border-2 bg-surface text-ink placeholder:text-ink-muted/70 focus:outline-none transition-colors ${
                            contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)
                              ? "border-error/40 focus:border-error"
                              : "border-sand/60 focus:border-ink"
                          }`}
                        />
                        {contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail) && (
                          <p className="mt-1 text-xs text-error">{t("booking.invalidEmailError")}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-ink mb-1.5">
                          {t("booking.phoneLabel")} <span className="text-ink-muted text-xs font-normal">{t("booking.phoneOptional")}</span>
                        </label>
                        <input
                          type="tel"
                          value={contactPhone}
                          onChange={(e) => {
                            const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                            const formatted = digits.length > 3
                              ? digits.length > 6
                                ? `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`
                                : `${digits.slice(0, 3)}-${digits.slice(3)}`
                              : digits;
                            setContactPhone(formatted);
                          }}
                          placeholder="08X-XXX-XXXX"
                          className="w-full px-4 py-3 rounded-xl border-2 border-sand/60 bg-surface text-ink placeholder:text-ink-muted/70 focus:border-ink focus:outline-none transition-colors"
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
                      {t("booking.reviewTitle")}
                    </h2>
                    <p className="text-sm text-ink-muted mb-6">
                      {t("booking.reviewDesc")}
                    </p>

                    <Card padding="lg" className="mb-6">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center pb-4 border-b border-sand/60">
                          <span className="text-sm text-ink-muted">{t("booking.dateReviewLabel")}</span>
                          <span className="font-semibold">
                            {formatDate(new Date(selectedDate), "long")}
                          </span>
                        </div>
                        <div className="flex justify-between items-center pb-4 border-b border-sand/60">
                          <span className="text-sm text-ink-muted">
                            {t("booking.timeSlotReviewLabel")}
                          </span>
                          <span className="font-semibold">
                            {activeSlot.labelKey ? t(activeSlot.labelKey) : activeSlot.label} ({activeSlot.startTime} —{" "}
                            {activeSlot.endTime})
                          </span>
                        </div>
                        <div className="flex justify-between items-center pb-4 border-b border-sand/60">
                          <span className="text-sm text-ink-muted">
                            {t("booking.rideTypeReviewLabel")}
                          </span>
                          <span className="font-semibold">
                            {activePackage.nameKey ? t(activePackage.nameKey) : activePackage.name}
                          </span>
                        </div>

                        {/* Per-rider breakdown */}
                        <div className="pb-4 border-b border-sand/60">
                          <span className="text-sm text-ink-muted block mb-3">
                            {t("booking.ridersAndBikes")}
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
                                    ? t("booking.ownBike")
                                    : `${(rider.bikePreference || "hybrid") === "hybrid" ? t("booking.bikeOptionHybrid") : t("booking.bikeOptionRoad")} ${t("booking.rentalSeparator")} ${BIKE_RENTAL_PRICES[rider.bikePreference || "hybrid"]} THB`}
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
                              {t("booking.starterKitIncludedEach")}
                            </span>
                          </div>
                          <p className="text-xs text-ink-muted pl-6">
                            {translatedStarterKit.join(" · ")}
                          </p>
                        </div>

                        {/* Price breakdown */}
                        <div className="pt-2 space-y-2">
                          {/* Original price line (with strikethrough if promo) */}
                          <div className="flex justify-between text-sm">
                            <span className="text-ink-muted">
                              {t("booking.rideBreakdown", { n: String(riderCount), price: activePackage.pricePerPerson.toLocaleString() })}
                            </span>
                            <span className={`font-medium ${promoDiscount ? "line-through text-ink-muted/50" : ""}`}>
                              {promoDiscount
                                ? <>{(activePackage.pricePerPerson * riderCount).toLocaleString()} THB</>
                                : <><AnimatedNumber value={rideSubtotal} format="currency" /> THB</>
                              }
                            </span>
                          </div>
                          {/* Promo discount line */}
                          {promoDiscount && activePromo && (
                            <div className="flex justify-between text-sm">
                              <span className="text-success font-medium flex items-center gap-1.5">
                                <span
                                  className="px-1.5 py-px rounded text-[9px] font-bold text-white uppercase"
                                  style={{ backgroundColor: activePromo.badge_color }}
                                >
                                  {activePromo.badge_label}
                                </span>
                                {locale === "th" && activePromo.name_th ? activePromo.name_th : activePromo.name}
                              </span>
                              <span className="font-semibold text-success">
                                −{(promoDiscount.savedAmount * riderCount).toLocaleString()} THB
                              </span>
                            </div>
                          )}
                          {promoDiscount && (
                            <div className="flex justify-between text-sm">
                              <span className="text-ink-muted">
                                {t("booking.rideBreakdown", { n: String(riderCount), price: effectivePricePerPerson.toLocaleString() })}
                              </span>
                              <span className="font-bold text-success">
                                <AnimatedNumber value={rideSubtotal} format="currency" /> THB
                              </span>
                            </div>
                          )}
                          {rentalSubtotal > 0 && (
                            <div className="flex justify-between text-sm">
                              <span className="text-ink-muted">
                                {t("booking.bikeRentalsAtTrack")}
                              </span>
                              <span className="font-medium">
                                {rentalSubtotal.toLocaleString()} THB
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between pt-3 border-t border-sand/60">
                            <span className="font-bold text-lg">
                              {t("booking.totalLabel")}
                            </span>
                            <span className="font-bold text-lg text-accent">
                              <AnimatedNumber value={totalPrice} format="currency" /> THB
                            </span>
                          </div>
                          {rentalSubtotal > 0 && (
                            <p className="text-xs text-ink-muted">
                              {t("booking.payNowViaPP", { amount: rideSubtotal.toLocaleString() })} <span className="text-ink-muted/60">· {t("booking.bikeRentalAtTrackNote", { rental: rentalSubtotal.toLocaleString() })}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    </Card>

                    {/* Safety trust badge */}
                    <div className="mb-4 flex items-center gap-3 p-3 rounded-xl bg-success/5 border border-success/20">
                      <ShieldCheck className="h-5 w-5 text-success flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-ink">{t("booking.safetyFirstTitle")}</p>
                        <p className="text-xs text-ink-muted">
                          {t("booking.safetyFirstDesc")}
                        </p>
                      </div>
                    </div>

                    {/* What to bring reminder */}
                    <div className="mb-6 p-4 rounded-xl bg-sky/5 border border-sky/20">
                      <div className="flex items-start gap-3">
                        <Package className="h-5 w-5 text-sky mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-semibold text-sm text-ink">
                            {t("booking.readyToRideChecklistTitle")}
                          </p>
                          <p className="text-xs text-ink-muted mt-1">
                            {translatedReadyToRide.join(" · ")}
                          </p>
                          <p className="text-xs text-ink-muted mt-1">
                            {t("booking.prepGuideNote")}
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
                          <div role="alert" aria-live="polite" className="mb-4 flex items-center gap-2 p-3 rounded-lg bg-error/5 text-error text-sm">
                            <AlertCircle className="h-4 w-4 flex-shrink-0" />
                            {bookingError}
                          </div>
                        )}

                        {/* Confirmation modal */}
                        <AnimatePresence>
                          {showConfirmModal && (
                            <motion.div
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 8 }}
                              className="mb-4 p-4 rounded-xl border-2 border-accent/30 bg-accent/5"
                            >
                              <p className="font-semibold text-sm text-ink mb-2">{t("booking.readyToBook")}</p>
                              <div className="text-xs text-ink-muted space-y-1 mb-3">
                                <p>{selectedDate && formatDate(new Date(selectedDate), "long")} · {activeSlot?.labelKey ? t(activeSlot.labelKey) : activeSlot?.label}</p>
                                <p>{activePackage?.nameKey ? t(activePackage.nameKey) : activePackage?.name} · {riderCount} {t("booking.ridersUnit")}</p>
                                <p className="font-semibold text-ink">Total: {rideSubtotal.toLocaleString()} THB</p>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  fullWidth
                                  onClick={() => {
                                    setShowConfirmModal(false);
                                    handleSubmitBooking();
                                  }}
                                  loading={isSubmitting}
                                >
                                  {isSubmitting ? t("booking.submittingButton") : t("booking.submitButton")}
                                </Button>
                                <button
                                  onClick={() => setShowConfirmModal(false)}
                                  className="px-4 py-2 text-sm font-medium text-ink-muted hover:text-ink transition-colors"
                                >
                                  {t("common.cancel")}
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {!showConfirmModal && (
                          <Button
                            variant="secondary"
                            size="lg"
                            fullWidth
                            onClick={() => setShowConfirmModal(true)}
                            loading={isSubmitting}
                            className="text-base"
                          >
                            {emailVerified
                              ? t("booking.confirmAndPay", { amount: rideSubtotal.toLocaleString() })
                              : t("booking.verifyEmailAndPay", { amount: rideSubtotal.toLocaleString() })}
                          </Button>
                        )}
                        <p className="mt-3 text-xs text-center text-ink-muted">
                          {emailVerified
                            ? t("booking.promptPayNote")
                            : t("booking.verifyEmailNote")}
                          {" "}
                          <a
                            href={`https://line.me/R/ti/p/${LINE_OA}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-0.5 text-[#06C755] font-semibold hover:underline"
                          >
                            {t("booking.followOnLine", { line: LINE_OA })}
                          </a>
                        </p>
                      </>
                    )}
                  </div>
                )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation + Summary */}
        <div className="mt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-2">
          {/* Row 1 on mobile: Price info */}
          {activePackage && STEPS[currentStep].id !== "review" && (
            <div className="sm:order-2 text-left sm:text-right">
              {rentalSubtotal > 0 ? (
                <>
                  <p className="text-xs text-ink-muted">{t("booking.payNowPromptPay")}</p>
                  <p className="text-lg font-bold text-ink">
                    <AnimatedNumber value={rideSubtotal} format="currency" />{" "}
                    <span className="text-sm font-normal text-ink-muted">THB</span>
                  </p>
                  <p className="text-xs text-ink-muted line-clamp-1 sm:line-clamp-none">
                    {t("booking.bikeRentalExtra", { amount: rentalSubtotal.toLocaleString() })}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-xs text-ink-muted">{t("booking.estimatedTotal")}</p>
                  <p className="text-lg font-bold text-ink">
                    <AnimatedNumber value={totalPrice} format="currency" />{" "}
                    <span className="text-sm font-normal text-ink-muted">THB</span>
                  </p>
                </>
              )}
            </div>
          )}

          {/* Row 2 on mobile: Back + Continue buttons */}
          <div className="flex items-center justify-between sm:order-3 gap-2 w-full sm:w-auto">
            <button
              onClick={prev}
              disabled={currentStep === 0}
              className="flex items-center gap-1 text-sm font-medium text-ink-muted hover:text-ink disabled:opacity-0 transition-all"
            >
              <ChevronLeft className="h-4 w-4" />
              {t("common.back")}
            </button>

            {STEPS[currentStep].id !== "review" && (
              <Button onClick={next} disabled={!canProceed()} arrow>
                Continue
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Size Chart Modal */}
      <AnimatePresence>
        {showSizeChart && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm"
            onClick={() => setShowSizeChart(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="bg-surface rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto border border-sand/60"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal header */}
              <div className="sticky top-0 bg-surface/95 backdrop-blur-sm border-b border-sand/60 px-5 py-4 rounded-t-2xl flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-ink">Cycling Liner Shorts — Size Guide</h3>
                  <p className="text-xs text-ink-muted mt-0.5">All measurements in cm. Size up if between sizes.</p>
                </div>
                <button
                  onClick={() => setShowSizeChart(false)}
                  className="p-2 -mr-2 rounded-lg hover:bg-sand/30 transition-colors text-ink-muted hover:text-ink"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Size table */}
              <div className="px-5 py-4">
                <div className="overflow-x-auto -mx-1">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-ink text-cream">
                        <th className="text-left px-3 py-2.5 rounded-tl-lg font-semibold text-xs">Measurement</th>
                        <th className="px-2.5 py-2.5 font-semibold text-xs">S</th>
                        <th className="px-2.5 py-2.5 font-semibold text-xs">M</th>
                        <th className="px-2.5 py-2.5 font-semibold text-xs">L</th>
                        <th className="px-2.5 py-2.5 font-semibold text-xs">XL</th>
                        <th className="px-2.5 py-2.5 font-semibold text-xs">2XL</th>
                        <th className="px-2.5 py-2.5 font-semibold text-xs">3XL</th>
                        <th className="px-2.5 py-2.5 rounded-tr-lg font-semibold text-xs">4XL</th>
                      </tr>
                    </thead>
                    <tbody className="text-center text-xs">
                      <tr className="border-b border-sand/40">
                        <td className="text-left px-3 py-2.5 font-medium text-ink">Waist (in)</td>
                        <td className="px-2 py-2.5 text-ink-muted">26–28</td>
                        <td className="px-2 py-2.5 text-ink-muted">28–30</td>
                        <td className="px-2 py-2.5 text-ink-muted">30–32</td>
                        <td className="px-2 py-2.5 text-ink-muted">32–34</td>
                        <td className="px-2 py-2.5 text-ink-muted">34–36</td>
                        <td className="px-2 py-2.5 text-ink-muted">36–38</td>
                        <td className="px-2 py-2.5 text-ink-muted">38–40</td>
                      </tr>
                      <tr className="border-b border-sand/40 bg-sand/10">
                        <td className="text-left px-3 py-2.5 font-medium text-ink">Hip (in)</td>
                        <td className="px-2 py-2.5 text-ink-muted">32</td>
                        <td className="px-2 py-2.5 text-ink-muted">34</td>
                        <td className="px-2 py-2.5 text-ink-muted">36</td>
                        <td className="px-2 py-2.5 text-ink-muted">38</td>
                        <td className="px-2 py-2.5 text-ink-muted">40</td>
                        <td className="px-2 py-2.5 text-ink-muted">42</td>
                        <td className="px-2 py-2.5 text-ink-muted">44</td>
                      </tr>
                      <tr className="border-b border-sand/40">
                        <td className="text-left px-3 py-2.5 font-medium text-ink">Leg Opening (in)</td>
                        <td className="px-2 py-2.5 text-ink-muted">16.75</td>
                        <td className="px-2 py-2.5 text-ink-muted">17.5</td>
                        <td className="px-2 py-2.5 text-ink-muted">18.25</td>
                        <td className="px-2 py-2.5 text-ink-muted">19</td>
                        <td className="px-2 py-2.5 text-ink-muted">19.75</td>
                        <td className="px-2 py-2.5 text-ink-muted">20.5</td>
                        <td className="px-2 py-2.5 text-ink-muted">21.5</td>
                      </tr>
                      <tr className="border-b border-sand/40 bg-sand/10">
                        <td className="text-left px-3 py-2.5 font-medium text-ink">Height (cm)</td>
                        <td className="px-2 py-2.5 text-ink-muted">160–165</td>
                        <td className="px-2 py-2.5 text-ink-muted">165–170</td>
                        <td className="px-2 py-2.5 text-ink-muted">170–175</td>
                        <td className="px-2 py-2.5 text-ink-muted">175–180</td>
                        <td className="px-2 py-2.5 text-ink-muted">180–185</td>
                        <td className="px-2 py-2.5 text-ink-muted">185–190</td>
                        <td className="px-2 py-2.5 text-ink-muted">190–195</td>
                      </tr>
                      <tr>
                        <td className="text-left px-3 py-2.5 font-medium text-ink">Weight (kg)</td>
                        <td className="px-2 py-2.5 text-ink-muted">55–60</td>
                        <td className="px-2 py-2.5 text-ink-muted">60–65</td>
                        <td className="px-2 py-2.5 text-ink-muted">65–70</td>
                        <td className="px-2 py-2.5 text-ink-muted">70–75</td>
                        <td className="px-2 py-2.5 text-ink-muted">75–80</td>
                        <td className="px-2 py-2.5 text-ink-muted">80–85</td>
                        <td className="px-2 py-2.5 text-ink-muted">90–95</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Quick tips */}
                <div className="mt-4 p-3 rounded-lg bg-accent/5 border border-accent/15">
                  <p className="text-xs font-semibold text-accent mb-1.5">Quick tips</p>
                  <ul className="text-xs text-ink-muted space-y-1">
                    <li>• Measure your waist at its narrowest point, divide by 2</li>
                    <li>• Between sizes? Go one size up for comfort</li>
                    <li>• These are padded gel liners — worn under your regular shorts</li>
                  </ul>
                </div>

                {/* Select size directly from modal */}
                <div className="mt-4">
                  <p className="text-xs font-medium text-ink mb-2">Select your size:</p>
                  <div className="flex flex-wrap gap-2">
                    {SIZES.map((size) => (
                      <button
                        key={size}
                        onClick={() => {
                          updateRider(activeRiderIndex, "clothingSize", size);
                          setShowSizeChart(false);
                        }}
                        className={`px-4 py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${
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
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
