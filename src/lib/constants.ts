// ========================================
// EN-JOY SPEED — Business Constants
// Real data from operational documents
// ========================================

import type { TimeSlot, RidePackage, TimeSlotId } from "@/types";

export const TIME_SLOTS: TimeSlot[] = [
  {
    id: "A1",
    label: "Early Bird",
    startTime: "06:15",
    endTime: "08:15",
    period: "morning",
    overlaps: ["A2"],
  },
  {
    id: "A2",
    label: "Energy Booster",
    startTime: "06:30",
    endTime: "08:30",
    period: "morning",
    overlaps: ["A1"],
  },
  {
    id: "B",
    label: "Light Chaser",
    startTime: "16:15",
    endTime: "18:15",
    period: "evening",
    overlaps: ["C", "D"],
  },
  {
    id: "C",
    label: "Golden Hour",
    startTime: "16:45",
    endTime: "18:45",
    period: "evening",
    overlaps: ["B", "D"],
  },
  {
    id: "D",
    label: "Twilight Finish",
    startTime: "17:15",
    endTime: "19:15",
    period: "evening",
    overlaps: ["B", "C"],
  },
];

export const RIDE_PACKAGES: RidePackage[] = [
  {
    type: "duo",
    name: "Duo",
    minRiders: 2,
    maxRiders: 2,
    pricePerPerson: 2500,
    leadersCount: 1,
    heroesCount: 0,
  },
  {
    type: "squad",
    name: "The Squad",
    minRiders: 3,
    maxRiders: 5,
    pricePerPerson: 2100,
    leadersCount: 1,
    heroesCount: 1,
  },
  {
    type: "peloton",
    name: "The Peloton",
    minRiders: 6,
    maxRiders: 8,
    pricePerPerson: 2000,
    leadersCount: 2,
    heroesCount: 2,
  },
];

export const BIKE_RENTAL_PRICES = {
  hybrid: 420,
  road: 720,
  own: 0,
} as const;

export const ROUTE = {
  distance: "23.5 km",
  location: "Skylane (Happy and Healthy Bike Lane), Suvarnabhumi",
  bathroomStops: ["km 5", "km 11", "km 16"],
  lanes: {
    blue: "Slower pace",
    purple: "Faster pace",
  },
} as const;

export const STARTER_KIT = [
  "Padded cycling liner shorts (gel-padded, hygiene-first)",
  "Energy gel (Korona WATT)",
  "Reusable eco mesh bag",
] as const;

export const READY_TO_RIDE = [
  "Sport shoes (closed-toe mandatory)",
  "Athletic socks",
  "Breathable athletic top",
  "Sun protection (sunscreen + sunglasses)",
  "Helmet (required — included with bike rental, or bring your own)",
  "Cycling bidon (water bottle) — normal bottles won't fit the bike holder",
] as const;

export const MIN_BOOKING_ADVANCE_HOURS = 24;

export const DEAD_ZONE = {
  start: "10:00",
  end: "15:30",
} as const;

export const RAIN_SEASON = {
  startMonth: 6,
  endMonth: 10,
} as const;

export const LINE_OA = "@EnjoySpeed";

export function calculateTotal(
  pricePerPerson: number,
  riderCount: number,
  bikeRentals: { hybrid: number; road: number }
): number {
  const rideTotal = pricePerPerson * riderCount;
  const rentalTotal =
    bikeRentals.hybrid * BIKE_RENTAL_PRICES.hybrid +
    bikeRentals.road * BIKE_RENTAL_PRICES.road;
  return rideTotal + rentalTotal;
}

export function getOverlappingSlots(slotId: TimeSlotId): TimeSlotId[] {
  const slot = TIME_SLOTS.find((s) => s.id === slotId);
  return slot?.overlaps ?? [];
}
