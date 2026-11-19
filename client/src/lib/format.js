// Dates, money and time words shared by the dashboard and the event lists.
// Keeping them here means every screen says "Due tomorrow" the same way.

const DAY_MS = 24 * 60 * 60 * 1000;
const LOCALE_BY_CURRENCY = { INR: 'en-IN', USD: 'en-US', EUR: 'de-DE', GBP: 'en-GB' };

const monthShort = new Intl.DateTimeFormat('en-GB', { month: 'short' });

// Local midnight, so "today" means today for the planner, not UTC.
function startOfDay(value) {
  const date = new Date(value);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function formatMoney(amount, currency = 'INR') {
  const code = LOCALE_BY_CURRENCY[currency] ? currency : 'INR';
  return new Intl.NumberFormat(LOCALE_BY_CURRENCY[code], {
    style: 'currency',
    currency: code,
    maximumFractionDigits: 0
  }).format(Number(amount) || 0);
}

// "19" + "Nov" for the little date block beside an event title.
export function eventDateParts(value) {
  const date = new Date(value);
  return { day: String(date.getDate()).padStart(2, '0'), month: monthShort.format(date) };
}

export function formatEventDate(value) {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(new Date(value));
}

export function formatShortDate(value) {
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' }).format(new Date(value));
}

// "12 Mar", with a year only when it is not the current one. Used for the next
// event line on a client card.
export function formatUpcomingDate(value, now = new Date()) {
  const date = new Date(value);
  const options = { day: 'numeric', month: 'short' };
  if (date.getFullYear() !== now.getFullYear()) options.year = 'numeric';
  return new Intl.DateTimeFormat('en-GB', options).format(date);
}

export function formatToday(value = new Date()) {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  }).format(value);
}

// Due wording plus the tone the badge should use. Overdue is the only state
// that earns red; everything else stays quiet.
export function describeDue(dueAt, now = new Date()) {
  if (!dueAt) return { text: 'No date', tone: 'muted' };

  const days = Math.round((startOfDay(dueAt) - startOfDay(now)) / DAY_MS);
  if (days < 0) {
    const count = Math.abs(days);
    return { text: `Overdue by ${count} day${count === 1 ? '' : 's'}`, tone: 'danger' };
  }
  if (days === 0) return { text: 'Due today', tone: 'warning' };
  if (days === 1) return { text: 'Due tomorrow', tone: 'muted' };
  if (days <= 7) return { text: `Due in ${days} days`, tone: 'muted' };
  return { text: `Due ${formatShortDate(dueAt)}`, tone: 'muted' };
}

export function timeGreeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function firstNameOf(name) {
  return String(name || '').trim().split(/\s+/)[0] || 'there';
}

export function initialsOf(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  const letters = parts.slice(0, 2).map((part) => part[0].toUpperCase());
  return letters.join('') || 'ES';
}

export function formatCount(count, singular, plural) {
  return `${count} ${count === 1 ? singular : plural}`;
}
