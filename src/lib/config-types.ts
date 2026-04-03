// ========================================
// Live config types — shared between server actions and client components.
// NOT a server action file — no "use server" directive.
// ========================================

export interface LivePackage {
  type: string;
  name: string;
  name_th?: string;
  minRiders: number;
  maxRiders: number;
  pricePerPerson: number;
  leadersCount: number;
  heroesCount: number;
}

export interface LiveBikeRental {
  id: string;
  bike_type: string;
  name: string;
  price: number;
  is_active: boolean;
}

export interface LiveTimeSlot {
  id: string;
  label: string;
  label_th?: string;
  startTime: string;
  endTime: string;
  period: string;
  overlaps: string[];
  is_active: boolean;
}

export interface LiveConfig {
  packages: LivePackage[];
  bikeRentals: LiveBikeRental[];
  bikeRentalPrices: Record<string, number>;
  timeSlots: LiveTimeSlot[];
}
