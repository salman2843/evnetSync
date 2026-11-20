// Pure helpers for the events screen. Keeping the date maths and grouping here
// means the page and its components stay small and easy to scan.

const DAY_MS = 24 * 60 * 60 * 1000;
const ACTIVE_STATUSES = ['inquiry', 'planning', 'confirmed'];

const monthFormatter = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' });

export function startOfDay(value) {
  const date = new Date(value);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

// Whole days from today to the event date. 0 means today.
export function countdownDays(startAt, now = new Date()) {
  return Math.round((startOfDay(startAt) - startOfDay(now)) / DAY_MS);
}

// The one event worth a hero: active, today or later, soonest first.
export function nextUpcomingEvent(events, now = new Date()) {
  return (
    events
      .filter(
        (event) =>
          ACTIVE_STATUSES.includes(event.status) &&
          startOfDay(event.startAt).getTime() >= startOfDay(now).getTime()
      )
      .sort((a, b) => new Date(a.startAt) - new Date(b.startAt))[0] || null
  );
}

// The server sorts the list; this keeps that order and only inserts month
// headings. Each group is { key, label, events }.
export function groupEventsByMonth(events) {
  const groups = new Map();

  for (const event of events) {
    const date = new Date(event.startAt);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!groups.has(key)) {
      groups.set(key, { key, label: monthFormatter.format(date), events: [] });
    }
    groups.get(key).events.push(event);
  }

  return [...groups.values()];
}

export function taskProgress(event) {
  const total = Number(event.taskSummary?.total || 0);
  const completed = Number(event.taskSummary?.completed || 0);
  return {
    total,
    completed,
    percent: total ? Math.round((completed / total) * 100) : 0
  };
}

export function budgetProgress(event) {
  const amount = Number(event.budget?.amount || 0);
  const spent = Number(event.budget?.spent || 0);
  return {
    amount,
    spent,
    currency: event.budget?.currency || 'INR',
    percent: amount ? Math.min(100, Math.round((spent / amount) * 100)) : 0,
    remaining: Math.max(amount - spent, 0)
  };
}
