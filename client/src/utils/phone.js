export const countryCodes = ['+1', '+44', '+61', '+65', '+91', '+971'];

export function normalizePhoneDigits(value) {
  return String(value || '').replace(/\D/g, '').slice(0, 10);
}

export function splitStoredPhone(value) {
  const phone = String(value || '').replace(/[\s().-]/g, '');
  const match = phone.match(/^(\+[1-9]\d{0,3})(\d{10})$/);
  return match ? { countryCode: match[1], number: match[2] } : { countryCode: '+91', number: normalizePhoneDigits(phone) };
}

export function formatPhoneForDisplay(value) {
  const { countryCode, number } = splitStoredPhone(value);
  return `${countryCode} ${number}`.trim();
}

export function isValidPhoneNumber(countryCode, number) {
  return /^\+[1-9]\d{0,3}$/.test(countryCode) && /^\d{10}$/.test(number);
}
