// ========================================
// EN-JOY SPEED — Shared Formatting Utilities
// Single source of truth for dates & currency
// ========================================

/**
 * Consistent date formatting across all admin and public pages.
 *
 * "short"   → "Mar 25"
 * "medium"  → "Mar 25, 2026"
 * "long"    → "Tuesday, March 25, 2026"
 * "datetime"→ "Mar 25, 12:30 PM"
 */
export function formatDate(
  dateInput: string | Date,
  style: "short" | "medium" | "long" | "datetime" = "medium"
): string {
  const date =
    typeof dateInput === "string"
      ? new Date(dateInput.includes("T") ? dateInput : `${dateInput}T12:00`)
      : dateInput;

  switch (style) {
    case "short":
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    case "medium":
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    case "long":
      return date.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    case "datetime":
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
  }
}

/**
 * Consistent currency formatting.
 * Always uses "THB" suffix, no decimals (Thai baht convention).
 *
 * formatCurrency(5000) → "5,000 THB"
 * formatCurrency(5000, { short: true }) → "5,000"
 */
export function formatCurrency(
  amount: number,
  options?: { short?: boolean }
): string {
  const formatted = Math.round(amount).toLocaleString();
  return options?.short ? formatted : `${formatted} THB`;
}
