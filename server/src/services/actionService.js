import crypto from 'node:crypto';
import ActionItem from '../models/ActionItem.js';
import Event from '../models/Event.js';
import EventVendor from '../models/EventVendor.js';
import Task from '../models/Task.js';
import { buildActions } from './actionEngine.js';
import httpError from '../utils/httpError.js';
import { ACTION_STATUSES, TASK_PRIORITIES, isValidId } from '../utils/validation.js';

const DAY_MS = 24 * 60 * 60 * 1000;

function addDays(value, days) {
  return new Date(new Date(value).getTime() + days * DAY_MS);
}

function parseDueAt(value) {
  if (value === null || value === '') return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw httpError('Enter a valid due date');
  return date;
}

// Priority first, then the nearest due date; undated actions go last.
function compareActions(a, b) {
  const rank = { high: 0, normal: 1, low: 2 };
  const priorityDifference = (rank[a.priority] ?? 1) - (rank[b.priority] ?? 1);
  if (priorityDifference !== 0) return priorityDifference;

  const dueA = a.dueAt ? new Date(a.dueAt).getTime() : Infinity;
  const dueB = b.dueAt ? new Date(b.dueAt).getTime() : Infinity;
  if (dueA < dueB) return -1;
  if (dueA > dueB) return 1;
  return new Date(b.createdAt) - new Date(a.createdAt);
}

function decorate(action, now = new Date()) {
  return {
    ...action,
    isOverdue: Boolean(action.dueAt && action.status === 'open' && new Date(action.dueAt) < now)
  };
}

export async function listActionsForUser(userId, query = {}) {
  const filter = { userId };

  if (query.status === 'all') {
    // no status filter
  } else if (query.status !== undefined) {
    if (!ACTION_STATUSES.includes(query.status)) throw httpError('Choose a valid action status filter');
    filter.status = query.status;
  } else {
    filter.status = 'open';
  }

  if (query.eventId) {
    if (!isValidId(query.eventId)) throw httpError('Invalid event ID');
    filter.eventId = query.eventId;
  }

  const now = new Date();
  if (query.due) {
    if (!['overdue', 'today', 'week'].includes(query.due)) throw httpError('Choose a valid due filter');
    if (query.due === 'overdue') {
      filter.dueAt = { $lt: now };
    } else if (query.due === 'today') {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const end = addDays(start, 1);
      filter.dueAt = { $gte: start, $lt: end };
    } else {
      filter.dueAt = { $lte: addDays(now, 7) };
    }
  }

  const actions = await ActionItem.find(filter)
    .populate('eventId', 'title startAt status')
    .lean();

  return actions.map((action) => decorate(action, now)).sort(compareActions);
}

export async function createManualActionForUser(userId, body) {
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  if (!title) throw httpError('Action title is required');
  if (title.length > 200) throw httpError('Action title must be 200 characters or fewer');

  const values = {
    title,
    description: '',
    priority: 'normal',
    dueAt: null,
    eventId: null
  };

  if (body.description !== undefined) {
    if (typeof body.description !== 'string') throw httpError('Description must be text');
    values.description = body.description.trim();
  }
  if (body.priority !== undefined) {
    if (!TASK_PRIORITIES.includes(body.priority)) throw httpError('Choose a valid priority');
    values.priority = body.priority;
  }
  if (body.dueAt !== undefined) values.dueAt = parseDueAt(body.dueAt);

  if (body.eventId !== undefined && body.eventId !== null && body.eventId !== '') {
    if (!isValidId(body.eventId)) throw httpError('Invalid event ID');
    const event = await Event.exists({ _id: body.eventId, userId });
    if (!event) throw httpError('Event not found', 404);
    values.eventId = body.eventId;
  }

  const action = await ActionItem.create({
    userId,
    dedupeKey: `manual:${crypto.randomUUID()}`,
    source: 'manual',
    type: 'manual',
    status: 'open',
    ...values
  });
  await action.populate('eventId', 'title startAt status');
  return action;
}

export async function updateActionForUser(userId, actionId, body) {
  if (!isValidId(actionId)) throw httpError('Invalid action ID');

  const values = {};

  if (body.status !== undefined) {
    if (!ACTION_STATUSES.includes(body.status)) throw httpError('Choose a valid action status');
    values.status = body.status;
    values.completedAt = body.status === 'done' ? new Date() : null;
  }
  if (body.title !== undefined) {
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    if (!title) throw httpError('Action title is required');
    if (title.length > 200) throw httpError('Action title must be 200 characters or fewer');
    values.title = title;
  }
  if (body.description !== undefined) {
    if (typeof body.description !== 'string') throw httpError('Description must be text');
    values.description = body.description.trim();
  }
  if (body.priority !== undefined) {
    if (!TASK_PRIORITIES.includes(body.priority)) throw httpError('Choose a valid priority');
    values.priority = body.priority;
  }
  if (body.dueAt !== undefined) values.dueAt = parseDueAt(body.dueAt);

  if (!Object.keys(values).length) throw httpError('Provide at least one field to update');

  const action = await ActionItem.findOneAndUpdate(
    { _id: actionId, userId },
    { $set: values },
    { new: true, runValidators: true }
  ).populate('eventId', 'title startAt status');

  if (!action) throw httpError('Action not found', 404);
  return action;
}

// Reads planner data, runs the pure engine, then upserts by dedupeKey.
// Open rule actions whose condition has disappeared are removed, so running
// this repeatedly never duplicates the Action Center.
export async function regenerateActionsForUser(userId) {
  const [events, tasks, assignments] = await Promise.all([
    Event.find({ userId }).lean(),
    // Include completed tasks so an event with a finished task list does not
    // look "task-less"; the engine ignores completed tasks in its due rule.
    Task.find({ userId }).lean(),
    EventVendor.find({ userId }).populate('vendorId', 'name').lean()
  ]);

  const normalizedAssignments = assignments.map((assignment) => ({
    ...assignment,
    vendorName: assignment.vendorId?.name || 'Vendor'
  }));

  const suggestions = buildActions({
    events,
    tasks,
    assignments: normalizedAssignments,
    today: new Date()
  });

  let created = 0;
  let updated = 0;

  if (suggestions.length) {
    const operations = suggestions.map((suggestion) => ({
      updateOne: {
        filter: { userId, dedupeKey: suggestion.dedupeKey },
        update: {
          $set: {
            eventId: suggestion.eventId || null,
            clientId: suggestion.clientId || null,
            type: suggestion.type,
            title: suggestion.title,
            description: suggestion.description,
            priority: suggestion.priority,
            dueAt: suggestion.dueAt || null,
            source: 'rule'
          },
          // Never reopen an action the planner already completed or dismissed.
          $setOnInsert: { userId, dedupeKey: suggestion.dedupeKey, status: 'open' }
        },
        upsert: true
      }
    }));

    const result = await ActionItem.bulkWrite(operations);
    created = result.upsertedCount;
    updated = result.modifiedCount;
  }

  // Remove only untouched rule actions; completed/dismissed history is kept.
  const stale = await ActionItem.deleteMany({
    userId,
    source: 'rule',
    status: 'open',
    dedupeKey: { $nin: suggestions.map((suggestion) => suggestion.dedupeKey) }
  });

  return { created, updated, removed: stale.deletedCount, total: suggestions.length };
}
