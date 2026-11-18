// Rule-based Next-Action Engine.
// Pure functions only: data goes in, a list of suggested actions comes out.
// No database calls live in this file, which makes every rule unit-testable.
//
// Each action has a stable dedupeKey so regeneration can upsert instead of
// creating duplicates.

const DAY_MS = 24 * 60 * 60 * 1000;
const ACTIVE_EVENT_STATUSES = ['inquiry', 'planning', 'confirmed'];
const INACTIVE_EVENT_STATUSES = ['completed', 'cancelled'];

function toDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfDay(value) {
  const date = toDate(value);
  if (!date) return null;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(value, days) {
  return new Date(new Date(value).getTime() + days * DAY_MS);
}

// Whole days between two dates (positive when `to` is in the future).
function daysUntil(from, to) {
  const start = startOfDay(from);
  const end = startOfDay(to);
  if (!start || !end) return Infinity;
  return Math.round((end.getTime() - start.getTime()) / DAY_MS);
}

// Events that are still active and start within the given number of days.
function upcomingEvents(events, today, horizonDays) {
  return events.filter((event) => {
    if (!event.startAt || !ACTIVE_EVENT_STATUSES.includes(event.status)) return false;
    const days = daysUntil(today, event.startAt);
    return days >= 0 && days <= horizonDays;
  });
}

// Rule 1: reaction to open tasks that are overdue or due within 7 days.
export function taskDueRule({ tasks = [], events = [], today = new Date() }) {
  const now = toDate(today) || new Date();
  const horizon = addDays(now, 7);
  const closedEventIds = new Set(
    events.filter((event) => INACTIVE_EVENT_STATUSES.includes(event.status)).map((event) => String(event._id))
  );

  return tasks.flatMap((task) => {
    if (task.status === 'completed' || !task.dueAt) return [];
    if (closedEventIds.has(String(task.eventId))) return [];

    const dueAt = toDate(task.dueAt);
    if (!dueAt || dueAt > horizon) return [];

    const overdue = dueAt < now;
    return [{
      dedupeKey: `task:${String(task._id)}`,
      eventId: task.eventId || null,
      clientId: task.clientId || null,
      type: 'task',
      title: overdue ? `Overdue task: ${task.title}` : `Finish task: ${task.title}`,
      description: overdue
        ? 'This task is past its due date.'
        : 'This task is due within the next 7 days.',
      priority: overdue || task.priority === 'high' ? 'high' : 'normal',
      dueAt
    }];
  });
}

// Rule 2: an event starting soon that is still only an inquiry or in planning.
export function eventConfirmationRule({ events = [], today = new Date() }) {
  return upcomingEvents(events, today, 30).flatMap((event) => {
    if (!['inquiry', 'planning'].includes(event.status)) return [];

    const days = daysUntil(today, event.startAt);
    return [{
      dedupeKey: `event-confirm:${String(event._id)}`,
      eventId: event._id,
      clientId: event.clientId || null,
      type: 'event',
      title: `Confirm details for ${event.title}`,
      description: `${event.title} starts in ${days} day${days === 1 ? '' : 's'} and is still ${event.status}.`,
      priority: days <= 7 ? 'high' : 'normal',
      dueAt: startOfDay(event.startAt)
    }];
  });
}

// Rule 3: an upcoming event with no vendors assigned at all.
export function missingVendorRule({ events = [], assignments = [], today = new Date() }) {
  const assignedEventIds = new Set(assignments.map((assignment) => String(assignment.eventId)));

  return upcomingEvents(events, today, 45).flatMap((event) => {
    if (assignedEventIds.has(String(event._id))) return [];

    return [{
      dedupeKey: `event-vendors:${String(event._id)}`,
      eventId: event._id,
      clientId: event.clientId || null,
      type: 'vendor',
      title: `Add vendors for ${event.title}`,
      description: 'No vendors are assigned to this event yet.',
      priority: 'normal',
      dueAt: addDays(today, 7)
    }];
  });
}

// Rule 4: a vendor still considering/contacted when the event is close.
export function vendorConfirmationRule({ events = [], assignments = [], today = new Date() }) {
  const eventById = new Map(events.map((event) => [String(event._id), event]));

  return assignments.flatMap((assignment) => {
    if (!['considering', 'contacted'].includes(assignment.status)) return [];

    const event = eventById.get(String(assignment.eventId));
    if (!event || !ACTIVE_EVENT_STATUSES.includes(event.status)) return [];

    const days = daysUntil(today, event.startAt);
    if (days < 0 || days > 14) return [];

    const vendorName = assignment.vendorName || assignment.vendor?.name || 'this vendor';
    return [{
      dedupeKey: `event-vendor:${String(assignment._id)}`,
      eventId: event._id,
      clientId: event.clientId || null,
      type: 'vendor',
      title: `Confirm ${vendorName} for ${event.title}`,
      description: `The vendor is still ${assignment.status} and the event starts in ${days} day${days === 1 ? '' : 's'}.`,
      priority: days <= 7 ? 'high' : 'normal',
      dueAt: startOfDay(event.startAt)
    }];
  });
}

// Rule 5: the event has already spent more than its budget.
export function budgetRule({ events = [] }) {
  return events.flatMap((event) => {
    if (INACTIVE_EVENT_STATUSES.includes(event.status)) return [];

    const amount = Number(event.budget?.amount || 0);
    const spent = Number(event.budget?.spent || 0);
    if (amount <= 0 || spent <= amount) return [];

    const currency = event.budget?.currency || 'INR';
    return [{
      dedupeKey: `event-budget:${String(event._id)}`,
      eventId: event._id,
      clientId: event.clientId || null,
      type: 'budget',
      title: `Review budget for ${event.title}`,
      description: `Spent ${spent} of ${amount} ${currency}.`,
      priority: 'high',
      dueAt: null
    }];
  });
}

// Rule 6: an upcoming event with no task list yet.
export function missingTasksRule({ events = [], tasks = [], today = new Date() }) {
  const eventIdsWithTasks = new Set(tasks.map((task) => String(task.eventId)));

  return upcomingEvents(events, today, 30).flatMap((event) => {
    if (eventIdsWithTasks.has(String(event._id))) return [];

    return [{
      dedupeKey: `event-tasks:${String(event._id)}`,
      eventId: event._id,
      clientId: event.clientId || null,
      type: 'event',
      title: `Plan tasks for ${event.title}`,
      description: 'This event has no tasks yet.',
      priority: 'normal',
      dueAt: addDays(today, 3)
    }];
  });
}

// Runs every rule and returns one combined, deterministic list.
export function buildActions({ events = [], tasks = [], assignments = [], today = new Date() } = {}) {
  const context = { events, tasks, assignments, today: toDate(today) || new Date() };
  return [
    ...taskDueRule(context),
    ...eventConfirmationRule(context),
    ...missingVendorRule(context),
    ...vendorConfirmationRule(context),
    ...budgetRule(context),
    ...missingTasksRule(context)
  ];
}
