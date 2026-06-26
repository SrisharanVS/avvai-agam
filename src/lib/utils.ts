import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function parseWeightToKg(weightStr: string | null | undefined): number {
  if (!weightStr) return 1; // Default to 1 kg if no weight is specified
  const normalized = weightStr.trim().toLowerCase();
  
  // Extract number and unit (e.g. "500 g", "1.5 kg", "250g")
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

export function calculateShipping({
  items,
  subtotal,
  state,
  shippingFeeTN,
  shippingFeeOther,
  freeShippingThreshold,
}: {
  items: Array<{ weight: string | null | undefined; quantity: number }>;
  subtotal: number;
  state?: string | null;
  shippingFeeTN: number;
  shippingFeeOther: number;
  freeShippingThreshold: number;
}): number {
  const totalWeightKg = items.reduce((total, item) => {
    return total + (parseWeightToKg(item.weight) * item.quantity);
  }, 0);
  
  const billableWeight = Math.max(1, Math.ceil(totalWeightKg));
  
  const isTN = !state || /tamil\s*nadu/i.test(state);
  
  if (isTN) {
    return subtotal >= freeShippingThreshold ? 0 : billableWeight * shippingFeeTN;
  } else {
    return billableWeight * shippingFeeOther;
  }
}
