import ActionItem from '../models/ActionItem.js';
import Client from '../models/Client.js';
import Event from '../models/Event.js';
import EventVendor from '../models/EventVendor.js';
import Vendor from '../models/Vendor.js';
import { listActionsForUser } from './actionService.js';
import { ASSIGNMENT_STATUSES, EVENT_STATUSES } from '../utils/validation.js';

// Events that still need attention. Completed and cancelled events are left out
// of upcoming lists and budget totals.
const ACTIVE_EVENT_STATUSES = ['inquiry', 'planning', 'confirmed'];
const DAY_MS = 24 * 60 * 60 * 1000;
const NEXT_LIMIT = 5;

// Builds the whole dashboard in one request so the client does not have to make
// five round trips. Every query is filtered by the logged-in planner.
export async function getDashboardSummary(userId) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(startOfToday.getTime() + DAY_MS);

  const [
    statusRows,
    upcomingEvents,
    budgetRows,
    openActions,
    doneCount,
    dismissedCount,
    clientCount,
    vendorCount,
    assignmentRows
  ] = await Promise.all([
    Event.aggregate([
      { $match: { userId } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]),
    Event.find({
      userId,
      status: { $in: ACTIVE_EVENT_STATUSES },
      startAt: { $gte: startOfToday }
    })
      .sort({ startAt: 1 })
      .populate('clientId', 'name phone')
      .lean(),
    // Money is grouped by currency because the planner can mix currencies.
    Event.aggregate([
      { $match: { userId, status: { $ne: 'cancelled' } } },
      {
        $group: {
          _id: '$budget.currency',
          planned: { $sum: '$budget.amount' },
          spent: { $sum: '$budget.spent' },
          events: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]),
    // Reuses the Action Center ordering (priority, then nearest due date).
    listActionsForUser(userId, { status: 'open' }),
    ActionItem.countDocuments({ userId, status: 'done' }),
    ActionItem.countDocuments({ userId, status: 'dismissed' }),
    Client.countDocuments({ userId }),
    Vendor.countDocuments({ userId }),
    EventVendor.aggregate([
      { $match: { userId } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ])
  ]);

  const eventsByStatus = Object.fromEntries(EVENT_STATUSES.map((status) => [status, 0]));
  for (const row of statusRows) {
    if (row._id in eventsByStatus) eventsByStatus[row._id] = row.count;
  }

  const assignmentsByStatus = Object.fromEntries(ASSIGNMENT_STATUSES.map((status) => [status, 0]));
  let assignmentTotal = 0;
  for (const row of assignmentRows) {
    if (row._id in assignmentsByStatus) assignmentsByStatus[row._id] = row.count;
    assignmentTotal += row.count;
  }

  const dueToday = openActions.filter(
    (action) => action.dueAt && new Date(action.dueAt) >= startOfToday && new Date(action.dueAt) < endOfToday
  ).length;

  const budgets = budgetRows.map((row) => {
    const currency = row._id || 'INR';
    const planned = row.planned || 0;
    const spent = row.spent || 0;
    return { currency, planned, spent, remaining: planned - spent, events: row.events };
  });

  return {
    generatedAt: now,
    events: {
      total: Object.values(eventsByStatus).reduce((sum, count) => sum + count, 0),
      upcoming: upcomingEvents.length,
      byStatus: eventsByStatus,
      next: upcomingEvents.slice(0, NEXT_LIMIT).map((event) => ({
        _id: event._id,
        title: event.title,
        status: event.status,
        startAt: event.startAt,
        eventTypeId: event.eventTypeId,
        customEventType: event.customEventType,
        client: event.clientId ? { _id: event.clientId._id, name: event.clientId.name, phone: event.clientId.phone } : null
      }))
    },
    actions: {
      open: openActions.length,
      overdue: openActions.filter((action) => action.isOverdue).length,
      dueToday,
      done: doneCount,
      dismissed: dismissedCount,
      next: openActions.slice(0, NEXT_LIMIT)
    },
    budget: {
      byCurrency: budgets
    },
    vendors: {
      total: vendorCount,
      assignments: { ...assignmentsByStatus, total: assignmentTotal }
    },
    clients: {
      total: clientCount
    }
  };
}
