// Mirrors the rules in server/src/utils/validation.js. The server re-checks
// everything; this copy only exists so the planner sees the problem before a
// round trip.
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// E.164: a "+", a country code that does not start with 0, 8-15 digits in total.
export const PHONE_PATTERN = /^\+[1-9]\d{7,14}$/;

export function normalizePhone(value) {
  return typeof value === 'string' ? value.replace(/[\s().-]/g, '') : value;
}
