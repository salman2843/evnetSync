// Mirrors the rules in server/src/utils/validation.js. The server re-checks
// everything; this copy only exists so the planner sees the problem before a
// round trip.
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// E.164: a "+", a country code that does not start with 0, 8-15 digits in total.
export const PHONE_PATTERN = /^\+[1-9]\d{7,14}$/;

export function normalizePhone(value) {
  return typeof value === 'string' ? value.replace(/[\s().-]/g, '') : value;
}

// Phone entry for this app: a fixed +91 box and a 10-digit national number.
// The database still stores one E.164 string, so nothing on the server changes.
export const PHONE_DIAL_CODE = '+91';
export const NATIONAL_PHONE_LENGTH = 10;

// "+919876543210" -> "9876543210". Also copes with a stored foreign number by
// keeping its last ten digits, so editing never shows an overflowing box.
export function nationalFromPhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.startsWith('91') && digits.length === 12) return digits.slice(2);
  return digits.slice(-NATIONAL_PHONE_LENGTH);
}

// "9876543210" -> "+919876543210"; an empty field stays empty (optional phone).
export function toE164(national) {
  const digits = String(national || '')
    .replace(/\D/g, '')
    .slice(0, NATIONAL_PHONE_LENGTH);
  return digits ? `${PHONE_DIAL_CODE}${digits}` : '';
}
