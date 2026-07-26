// src/utils/financials.ts

/**
 * Financial utility functions for the PetShop marketplace.
 * All monetary values are handled with integer math to avoid floating‑point errors.
 * Formatted strings use Persian digits and the appropriate thousand separator.
 */

export const toCents = (amount: number): number => {
  return Math.round(amount * 100);
};

export const fromCents = (cents: number): number => {
  return cents / 100;
};

export const roundCurrency = (amount: number): number => {
  return Math.round(amount * 100) / 100;
};

/**
 * Convert English digits (0‑9) to Persian/Arabic‑Indic digits (۰‑۹).
 */
export const toPersianDigits = (str: string): string => {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return str.replace(/\d/g, (ch) => persianDigits[parseInt(ch, 10)]);
};

/**
 * Format an amount in Iranian Rials as a localized string.
 * Example: 1234567 → '۱٬۲۳۴٬۵۶۷ ریال'
 */
export const formatCurrencyIRR = (amountRials: number): string => {
  // Work with integer value; ignore fractional part if any.
  const value = Math.round(Math.abs(amountRials));
  const integerStr = value.toString(10);
  // Insert the Arabic thousands separator (U+066C) every three digits from the right.
  const groups = integerStr.match(/\d{1,3}/g);
  if (!groups) {
    return '۰ ریال';
  }
  const formatted = groups.reverse().join('٬');
  const persian = toPersianDigits(formatted);
  const sign = amountRials < 0 ? '‑' : '';
  return `${sign}${persian} ریال`;
};

/**
 * Convert Rials to Toman (1 Toman = 10 Rials) and format with Persian digits.
 */
export const formatCurrencyToman = (amountRials: number): string => {
  const toman = Math.round(amountRials / 10);
  return formatCurrencyIRR(toman).replace('ریال', 'تومان');
};

/**
 * Calculate the percentage of `value` relative to `total`.
 * Result is rounded to one decimal place.
 */
export const calculatePercentage = (value: number, total: number): number => {
  if (total === 0) return 0;
  // Multiply by 1000 to keep one decimal, then round.
  return Math.round((value * 1000) / total) / 10;
};

/**
 * Check if a monetary amount is strictly positive.
 */
export const isPositiveAmount = (amount: number): boolean => {
  return amount > 0;
};
