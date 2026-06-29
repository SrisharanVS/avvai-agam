import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { ProductUnit } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ─── Variant Label Formatting ─────────────────────────────────────────────────

/**
 * Format a variant label for display.
 * e.g. (500, "GRAM", null) → "500 g"
 * e.g. (2, "CUSTOM", "Bottles") → "2 Bottles"
 */
export function formatVariantLabel(
  quantityValue: number,
  unit: ProductUnit,
  customUnit: string | null | undefined
): string {
  switch (unit) {
    case "GRAM":
      return `${quantityValue} g`;
    case "KILOGRAM":
      return `${quantityValue} kg`;
    case "MILLILITRE":
      return `${quantityValue} ml`;
    case "LITRE":
      return `${quantityValue} L`;
    case "CUSTOM":
      if (customUnit) {
        return `${quantityValue} ${customUnit}`;
      }
      return `${quantityValue}`;
    default:
      return `${quantityValue}`;
  }
}

// ─── SKU Generation ───────────────────────────────────────────────────────────

/**
 * Generate a variant SKU from a product SKU and variant index.
 * e.g. ("PROD-000001", 0) → "PROD-000001-A"
 */
export function generateVariantSKU(productSku: string, index: number): string {
  const suffix = String.fromCharCode(65 + index); // A, B, C, ...
  return `${productSku}-${suffix}`;
}

// ─── Shipping Weight Calculation ──────────────────────────────────────────────

/**
 * Ceil the total shipping weight to the nearest whole kilogram.
 * Always at least 1 kg.
 * e.g. 0.5 → 1, 1.1 → 2, 2.0 → 2
 */
export function ceilShippingWeight(totalKg: number): number {
  return Math.max(1, Math.ceil(totalKg));
}

/**
 * Calculate the shipping fee for a cart.
 *
 * @param items - Array of cart items with numeric shippingWeight (kg) per unit
 * @param subtotal - Cart subtotal in INR
 * @param state - Delivery state (for TN detection)
 * @param shippingFeeTN - Per-kg rate for Tamil Nadu
 * @param shippingFeeOther - Per-kg rate for other states
 * @param freeShippingThreshold - Subtotal above which TN shipping is free
 */
export function calculateShipping({
  items,
  subtotal,
  state,
  shippingFeeTN,
  shippingFeeOther,
  freeShippingThreshold,
}: {
  items: Array<{ shippingWeight: number; quantity: number }>;
  subtotal: number;
  state?: string | null;
  shippingFeeTN: number;
  shippingFeeOther: number;
  freeShippingThreshold: number;
}): number {
  const totalWeightKg = items.reduce((total, item) => {
    return total + item.shippingWeight * item.quantity;
  }, 0);

  const billableWeight = ceilShippingWeight(totalWeightKg);

  const isTN = !state || /tamil\s*nadu/i.test(state);

  if (isTN) {
    return subtotal >= freeShippingThreshold ? 0 : billableWeight * shippingFeeTN;
  } else {
    return billableWeight * shippingFeeOther;
  }
}

/**
 * Legacy: parse a weight string (e.g. "500g", "1.5 kg") to kg.
 * Kept for any display purposes. Shipping logic now uses numeric shippingWeight.
 */
export function parseWeightToKg(weightStr: string | null | undefined): number {
  if (!weightStr) return 1;
  const normalized = weightStr.trim().toLowerCase();

  const numMatch = normalized.match(/^([\d.]+)\s*([a-zA-Z]+)/);
  if (!numMatch) {
    const parsed = parseFloat(normalized);
    return isNaN(parsed) ? 1 : parsed;
  }

  const val = parseFloat(numMatch[1]);
  const unit = numMatch[2];

  if (isNaN(val)) return 1;

  if (unit === "g" || unit === "gm" || unit === "gram" || unit === "grams") {
    return val / 1000;
  }

  if (unit === "ml" || unit === "millilitre" || unit === "millilitres") {
    return val / 1000;
  }

  return val;
}
