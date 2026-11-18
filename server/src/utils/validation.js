import mongoose from 'mongoose';

// One source of truth for patterns and enums shared by models and controllers.
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// E.164: a "+", a country code that does not start with 0, and 8-15 digits in total.
export const PHONE_PATTERN = /^\+[1-9]\d{7,14}$/;

export const CLIENT_STATUSES = ['New', 'Contacted', 'Booked'];
export const EVENT_STATUSES = ['inquiry', 'planning', 'confirmed', 'completed', 'cancelled'];
export const TASK_STATUSES = ['open', 'completed'];
export const TASK_PRIORITIES = ['low', 'normal', 'high'];
export const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP'];

export function normalizePhone(value) {
  return typeof value === 'string' ? value.replace(/[\s().-]/g, '') : value;
}

export function normalizeEmail(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : value;
}

export function isValidId(value) {
  return mongoose.isValidObjectId(value);
}

export function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

export function isSupportedCurrency(value) {
  return CURRENCIES.includes(value);
}

// Checks a time zone name such as "Asia/Kolkata" using the built-in Intl API.
export function isValidTimeZone(value) {
  if (!isNonEmptyString(value)) return false;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value });
    return true;
  } catch {
    return false;
  }
}
