import { templateForEventType } from '../config/taskTemplates.js';

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(value) {
  const date = new Date(value);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

// Pure: event in, task drafts out. No database calls, so the rules are easy to
// read and test. The controller adds userId and eventId before inserting.
export function buildTasksForEvent(event, today = new Date()) {
  const startAt = new Date(event.startAt);
  if (Number.isNaN(startAt.getTime())) return [];

  // Nothing should be born overdue: a template step that falls in the past is
  // clamped to today, and the planner can reschedule it later.
  const todayStart = startOfDay(today);

  return templateForEventType(event.eventTypeId).map((template) => {
    const dueAt = startOfDay(new Date(startAt.getTime() - template.dueOffsetDays * DAY_MS));
    return {
      title: template.title,
      dueAt: dueAt < todayStart ? todayStart : dueAt,
      priority: template.priority || 'normal'
    };
  });
}
