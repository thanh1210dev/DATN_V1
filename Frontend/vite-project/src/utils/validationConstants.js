// Centralized validation constants & helpers for monetary values and related rules
// Upper bound aligned with backend @DecimalMax(999000000000.00)
export const MONEY_MAX = 999000000000.0; // 999 billion VND
export const MONEY_MAX_LABEL = '999.000.000.000,00'; // Display label (vi-VN style)

// Regex ensures up to 12 digits before decimal and up to 2 after (covers < 1 trillion with 2 decimals)
const MONEY_REGEX = /^\d{1,12}(\.\d{1,2})?$/;

/**
 * Validate a money-like input (string | number)
 * Rules: numeric, > 0, <= MONEY_MAX, max 2 decimals
 */
export function isValidMoney(value) {
  if (value === null || value === undefined || value === '') return false;
  const num = Number(value);
  if (Number.isNaN(num) || num <= 0) return false;
  if (num > MONEY_MAX) return false;
  // Accept both comma or dot decimals by normalizing
  const normalized = String(value).replace(',', '.');
  return MONEY_REGEX.test(normalized);
}

/** Build a standardized error message for invalid money */
export function buildMoneyError(fieldLabel = 'Số tiền') {
  return `${fieldLabel} phải > 0 và ≤ ${MONEY_MAX_LABEL}`;
}

/** Format a number to VND display (no currency symbol). */
export function formatMoneyVND(amount) {
  if (amount === null || amount === undefined || amount === '') return '0';
  const num = Number(amount);
  if (Number.isNaN(num)) return '0';
  return num.toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
