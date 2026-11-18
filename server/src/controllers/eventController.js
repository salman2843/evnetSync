import ActionItem from '../models/ActionItem.js';
import Client from '../models/Client.js';
import Event from '../models/Event.js';
import EventVendor from '../models/EventVendor.js';
import Task from '../models/Task.js';
import { eventTypeGroups, festivalSubtypeIds } from '../config/eventTypeCatalog.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendCreated, sendError, sendSuccess } from '../utils/apiResponse.js';
import {
  CURRENCIES,
  EVENT_STATUSES,
  TASK_PRIORITIES,
  TASK_STATUSES,
  isValidId
} from '../utils/validation.js';

const eventTypeIds = new Set(eventTypeGroups.flatMap((group) => group.types.map((type) => type.id)));
const festivalTypes = new Set(festivalSubtypeIds);
const currencies = new Set(CURRENCIES);
const editableFields = ['clientId', 'title', 'eventTypeId', 'subEventTypeId', 'surpriseFor', 'status', 'startAt', 'budget', 'notes'];

function inputFields(body) {
  const fields = {};
  for (const field of editableFields) {
    if (body[field] === undefined) continue;
    fields[field] = typeof body[field] === 'string' ? body[field].trim() : body[field];
  }
  return fields;
}

// Validates event input. `currentEventTypeId` lets a partial update check the
// festival sub-type against the type already stored on the event.
function validateEventFields(fields, { creating = false, currentEventTypeId = '' } = {}) {
  if ((creating || fields.clientId !== undefined) && !isValidId(fields.clientId)) return 'Choose a client';

  if (creating || fields.title !== undefined) {
    if (typeof fields.title !== 'string' || !fields.title) return 'Event name is required';
    if (fields.title.length > 120) return 'Event name must be 120 characters or fewer';
  }
  if ((creating || fields.eventTypeId !== undefined) && !eventTypeIds.has(fields.eventTypeId)) {
    return 'Choose a valid event type';
  }

  if (fields.subEventTypeId !== undefined && fields.subEventTypeId) {
    if (!festivalTypes.has(fields.subEventTypeId)) return 'Choose a valid festival type';
    const effectiveType = fields.eventTypeId || currentEventTypeId;
    if (effectiveType !== 'festival') return 'Festival type only applies to festival events';
  }

  if (fields.status !== undefined && !EVENT_STATUSES.includes(fields.status)) return 'Choose a valid event status';

  // A start date is required; events are never created without one.
  if (creating && !fields.startAt) return 'Event date is required';
  if (fields.startAt !== undefined) {
    if (fields.startAt === '' || fields.startAt === null) return 'Event date is required';
    const date = new Date(fields.startAt);
    if (Number.isNaN(date.getTime())) return 'Enter a valid event date';
    fields.startAt = date;
  }

  if (fields.budget !== undefined) {
    const budget = fields.budget;
    if (!budget || typeof budget !== 'object' || Array.isArray(budget)) return 'Enter a valid budget';
    const amount = Number(budget.amount);
    const spent = Number(budget.spent || 0);
    if (!Number.isFinite(amount) || amount < 0 || !Number.isFinite(spent) || spent < 0) {
      return 'Budget values must be zero or greater';
    }
    const currency = typeof budget.currency === 'string' ? budget.currency.trim().toUpperCase() : 'INR';
    if (!currencies.has(currency)) return 'Choose a supported budget currency';
    fields.budget = { amount, spent, currency };
  }

  if (fields.notes !== undefined && typeof fields.notes !== 'string') return 'Notes must be text';
  if (fields.surpriseFor !== undefined && typeof fields.surpriseFor !== 'string') return 'Surprise name must be text';
  return null;
}

function ownsClient(clientId, userId) {
  return Client.exists({ _id: clientId, userId });
}

// Undated tasks go last, then by due date, then by creation time.
function sortTasks(tasks) {
  return tasks.sort((a, b) => {
    if (a.dueAt && b.dueAt) return new Date(a.dueAt) - new Date(b.dueAt);
    if (a.dueAt) return -1;
    if (b.dueAt) return 1;
    return new Date(a.createdAt) - new Date(b.createdAt);
  });
}

function parseDueAt(value) {
  if (value === undefined || value === null || value === '') return { value: null };
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { error: 'Enter a valid task due date' };
  return { value: date };
}

export const listEvents = asyncHandler(async (req, res) => {
  if (req.query.status && !EVENT_STATUSES.includes(req.query.status)) {
    return sendError(res, 'Choose a valid event status filter');
  }

  const filter = { userId: req.user._id };
  if (req.query.status) filter.status = req.query.status;

  const events = await Event.find(filter)
    .populate('clientId', 'name')
    .sort({ startAt: 1, createdAt: -1 })
    .lean();

  const counts = await Task.aggregate([
    { $match: { userId: req.user._id, eventId: { $in: events.map((event) => event._id) } } },
    { $group: { _id: '$eventId', total: { $sum: 1 }, completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } } } }
  ]);
  const countByEvent = new Map(counts.map((item) => [String(item._id), item]));
  events.forEach((event) => {
    event.taskSummary = countByEvent.get(String(event._id)) || { total: 0, completed: 0 };
  });

  return sendSuccess(res, { events }, 'Events loaded successfully');
});

export const getEvent = asyncHandler(async (req, res) => {
  if (!isValidId(req.params.id)) return sendError(res, 'Invalid event ID');

  const event = await Event.findOne({ _id: req.params.id, userId: req.user._id })
    .populate('clientId', 'name phone email')
    .lean();
  if (!event) return sendError(res, 'Event not found', 404);

  const tasks = await Task.find({ eventId: event._id, userId: req.user._id }).lean();
  return sendSuccess(res, { event, tasks: sortTasks(tasks) }, 'Event details loaded successfully');
});

export const createTask = asyncHandler(async (req, res) => {
  if (!isValidId(req.params.id)) return sendError(res, 'Invalid event ID');

  const event = await Event.findOne({ _id: req.params.id, userId: req.user._id });
  if (!event) return sendError(res, 'Event not found', 404);

  const title = typeof req.body.title === 'string' ? req.body.title.trim() : '';
  if (!title) return sendError(res, 'Task name is required');
  if (title.length > 160) return sendError(res, 'Task name must be 160 characters or fewer');

  const due = parseDueAt(req.body.dueAt);
  if (due.error) return sendError(res, due.error);

  if (req.body.priority !== undefined && !TASK_PRIORITIES.includes(req.body.priority)) {
    return sendError(res, 'Choose a valid task priority');
  }

  const task = await Task.create({
    userId: req.user._id,
    eventId: event._id,
    title,
    dueAt: due.value ?? null,
    priority: req.body.priority || 'normal'
  });
  return sendCreated(res, { task }, 'Task added successfully');
});

export const updateTask = asyncHandler(async (req, res) => {
  if (!isValidId(req.params.id) || !isValidId(req.params.taskId)) {
    return sendError(res, 'Invalid event or task ID');
  }

  const event = await Event.findOne({ _id: req.params.id, userId: req.user._id });
  if (!event) return sendError(res, 'Event not found', 404);

  const values = {};

  if (req.body.title !== undefined) {
    const title = typeof req.body.title === 'string' ? req.body.title.trim() : '';
    if (!title) return sendError(res, 'Task name is required');
    if (title.length > 160) return sendError(res, 'Task name must be 160 characters or fewer');
    values.title = title;
  }
  if (req.body.status !== undefined) {
    if (!TASK_STATUSES.includes(req.body.status)) return sendError(res, 'Choose a valid task status');
    values.status = req.body.status;
  }
  if (req.body.priority !== undefined) {
    if (!TASK_PRIORITIES.includes(req.body.priority)) return sendError(res, 'Choose a valid task priority');
    values.priority = req.body.priority;
  }
  if (req.body.dueAt !== undefined) {
    const due = parseDueAt(req.body.dueAt);
    if (due.error) return sendError(res, due.error);
    values.dueAt = due.value;
  }

  if (!Object.keys(values).length) return sendError(res, 'Provide at least one field to update');

  const task = await Task.findOneAndUpdate(
    { _id: req.params.taskId, eventId: event._id, userId: req.user._id },
    { $set: values },
    { new: true, runValidators: true }
  );
  if (!task) return sendError(res, 'Task not found', 404);
  return sendSuccess(res, { task }, 'Task updated successfully');
});

export const deleteTask = asyncHandler(async (req, res) => {
  if (!isValidId(req.params.id) || !isValidId(req.params.taskId)) {
    return sendError(res, 'Invalid event or task ID');
  }

  const task = await Task.findOneAndDelete({
    _id: req.params.taskId,
    eventId: req.params.id,
    userId: req.user._id
  });
  if (!task) return sendError(res, 'Task not found', 404);
  // Remove the rule action that pointed at this task.
  await ActionItem.deleteOne({ userId: req.user._id, dedupeKey: `task:${task._id}` });
  return sendSuccess(res, { task }, 'Task deleted successfully');
});

export const createEvent = asyncHandler(async (req, res) => {
  const values = inputFields(req.body);
  const validationMessage = validateEventFields(values, { creating: true });
  if (validationMessage) return sendError(res, validationMessage);

  if (!await ownsClient(values.clientId, req.user._id)) {
    return sendError(res, 'Choose one of your clients');
  }

  const event = await Event.create({ ...values, userId: req.user._id });
  await event.populate('clientId', 'name');
  return sendCreated(res, { event }, 'Event created successfully');
});

export const updateEvent = asyncHandler(async (req, res) => {
  if (!isValidId(req.params.id)) return sendError(res, 'Invalid event ID');

  // Load first: a partial update needs the stored event type and budget to validate correctly.
  const existing = await Event.findOne({ _id: req.params.id, userId: req.user._id });
  if (!existing) return sendError(res, 'Event not found', 404);

  const values = inputFields(req.body);

  // Merge a partial budget with the stored one instead of resetting missing values.
  if (values.budget && typeof values.budget === 'object' && !Array.isArray(values.budget)) {
    values.budget = {
      amount: existing.budget?.amount ?? 0,
      spent: existing.budget?.spent ?? 0,
      currency: existing.budget?.currency ?? 'INR',
      ...values.budget
    };
  }

  const validationMessage = validateEventFields(values, { currentEventTypeId: existing.eventTypeId });
  if (validationMessage) return sendError(res, validationMessage);
  if (!Object.keys(values).length) return sendError(res, 'Provide at least one field to update');

  if (values.clientId && !await ownsClient(values.clientId, req.user._id)) {
    return sendError(res, 'Choose one of your clients');
  }

  // Leaving the festival type clears any festival sub-type still stored.
  if (values.eventTypeId && values.eventTypeId !== 'festival' && values.subEventTypeId === undefined) {
    values.subEventTypeId = '';
  }

  const event = await Event.findByIdAndUpdate(
    existing._id,
    { $set: values },
    { new: true, runValidators: true }
  ).populate('clientId', 'name');
  return sendSuccess(res, { event }, 'Event updated successfully');
});

export const deleteEvent = asyncHandler(async (req, res) => {
  if (!isValidId(req.params.id)) return sendError(res, 'Invalid event ID');

  const event = await Event.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!event) return sendError(res, 'Event not found', 404);

  await Task.deleteMany({ eventId: event._id, userId: req.user._id });
  await EventVendor.deleteMany({ eventId: event._id, userId: req.user._id });
  await ActionItem.deleteMany({ eventId: event._id, userId: req.user._id });
  return sendSuccess(res, { event }, 'Event deleted successfully');
});
