// ========================================
// Promotion types & pure utility functions
// Shared between server actions and client components.
// NOT a server action file — no "use server" directive.
// ========================================

/** Lightweight promotion info for the booking calendar */
export interface ActivePromotion {
  id: string;
  name: string;
  name_th: string | null;
  description: string | null;
  description_th: string | null;
  badge_label: string;
  badge_color: string;
  discount_type: "percentage" | "fixed_per_person";
  discount_value: number;
  starts_on: string;
  ends_on: string;
  applicable_packages: string[] | null;
  min_riders: number | null;
}

/**
 * Calculate the discounted price per person.
 * Pure function — safe for both server and client.
 */
export function calculatePromotionDiscount(
  pricePerPerson: number,
  promotion: ActivePromotion
): { discountedPrice: number; savedAmount: number } {
  let savedAmount: number;

  if (promotion.discount_type === "percentage") {
    savedAmount = Math.round(pricePerPerson * (promotion.discount_value / 100));
  } else {
    savedAmount = Math.min(promotion.discount_value, pricePerPerson);
  }

  return {
    discountedPrice: pricePerPerson - savedAmount,
    savedAmount,
  };
}
