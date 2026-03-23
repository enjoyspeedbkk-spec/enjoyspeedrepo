// ========================================
// EN-JOY SPEED — Type Definitions
// ========================================

export type GroupType = "duo" | "squad" | "peloton";
export type TimeSlotId = "A1" | "A2" | "B" | "C" | "D";
export type TimePeriod = "morning" | "evening";
export type BikePreference = "hybrid" | "road" | "own";
export type BookingStatus =
  | "pending"
  | "confirmed"
  | "rider_details"
  | "ready"
  | "completed"
  | "cancelled"
  | "no_show";
export type PaymentStatus =
  | "pending"
  | "paid"
  | "verified"
  | "refunded"
  | "partially_refunded"
  | "failed";
export type CyclingExperience = "beginner" | "intermediate" | "experienced";
export type ClothingSize = "XS" | "S" | "M" | "L" | "XL" | "XXL";

export interface TimeSlot {
  id: TimeSlotId;
  label: string;
  startTime: string;
  endTime: string;
  period: TimePeriod;
  overlaps?: TimeSlotId[];
}

export interface RidePackage {
  type: GroupType;
  name: string;
  minRiders: number;
  maxRiders: number;
  pricePerPerson: number;
  leadersCount: number;
  heroesCount: number;
}

// Per-rider info collected in booking flow
export interface RiderInfo {
  name: string;
  nickname?: string;
  bikePreference: BikePreference;
  clothingSize?: ClothingSize;
  heightCm?: number;
  cyclingExperience: CyclingExperience;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}

export interface Booking {
  id: string;
  userId: string;
  rideSessionId: string;
  groupType: GroupType;
  riderCount: number;
  pricePerPerson: number;
  rideTotal: number;
  rentalTotal: number;
  totalPrice: number;
  status: BookingStatus;
  contactName: string;
  contactPhone?: string;
  contactEmail?: string;
  contactLineId?: string;
  specialRequests?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RiderDetail {
  id: string;
  bookingId: string;
  name: string;
  nickname?: string;
  heightCm?: number;
  bikePreference: BikePreference;
  bikeRentalPrice: number;
  clothingSize?: ClothingSize;
  cyclingExperience: CyclingExperience;
  waiverAccepted: boolean;
  waiverAcceptedAt?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}

export interface Payment {
  id: string;
  bookingId: string;
  amount: number;
  method: "promptpay" | "bank_transfer" | "cash" | "other";
  status: PaymentStatus;
  promptpayRef?: string;
  slipImageUrl?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  isRainCredit: boolean;
  rainCreditExpiresAt?: string;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  lineId?: string;
  role: "customer" | "admin" | "leader";
  preferredLanguage: "en" | "th";
  createdAt: string;
}

// Ride session (from admin availability management)
export interface RideSession {
  id: string;
  date: string;
  timeSlotId: TimeSlotId;
  maxGroups: number;
  isAvailable: boolean;
  isBlackout: boolean;
  weatherStatus: "clear" | "warning" | "cancelled";
  weatherNote?: string;
}

// Booking form state (client-side)
export interface BookingFormState {
  date: string;
  timeSlotId: TimeSlotId | null;
  groupType: GroupType | null;
  riderCount: number;
  riders: RiderInfo[];
  contactName: string;
  contactPhone?: string;
  contactEmail: string;
  contactLineId?: string;
  specialRequests?: string;
}
