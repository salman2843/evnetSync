import ActionItem from '../models/ActionItem.js';
import Client from '../models/Client.js';
import Event from '../models/Event.js';
import EventVendor from '../models/EventVendor.js';
import Task from '../models/Task.js';
import { eventTypeGroups, isValidSubtype } from '../config/eventTypeCatalog.js';
import { duplicateEventForUser } from '../services/eventService.js';
import { buildTasksForEvent } from '../services/taskTemplateService.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendCreated, sendError, sendSuccess } from '../utils/apiResponse.js';
import {
  CURRENCIES,
  EVENT_STATUSES,
  TASK_PRIORITIES,
  TASK_STATUSES,
  escapeRegex,
  isValidId
} from '../utils/validation.js';
import { paginationMeta, parsePagination } from '../utils/pagination.js';

const eventTypeIds = new Set(eventTypeGroups.flatMap((group) => group.types.map((type) => type.id)));
const currencies = new Set(CURRENCIES);
const editableFields = [
  'clientId',
  'title',
  'eventTypeId',
  'customEventType',
  'subEventTypeId',
  'surpriseFor',
  'status',
  'startAt',
  'venue',
  'budget',
  'notes'
];

function inputFields(body) {
  const fields = {};
  for (const field of editableFields) {
    if (body[field] === undefined) continue;
    fields[field] = typeof body[field] === 'string' ? body[field].trim() : body[field];
  }
  return fields;
}

// Validates event input. `currentEventTypeId` and `currentStartAt` let a partial
// update check the sub-type against the stored type, and let an event that has
// already happened keep its date when the planner edits something else.
function validateEventFields(
  fields,
  { creating = false, currentEventTypeId = '', currentStartAt = null } = {}
) {
  if ((creating || fields.clientId !== undefined) && !isValidId(fields.clientId)) return 'Choose a client';

  if (creating || fields.title !== undefined) {
    if (typeof fields.title !== 'string' || !fields.title) return 'Event name is required';
    if (fields.title.length > 120) return 'Event name must be 120 characters or fewer';
  }
  if ((creating || fields.eventTypeId !== undefined) && !eventTypeIds.has(fields.eventTypeId)) {
    return 'Choose a valid event type';
  }

  const effectiveType = fields.eventTypeId || currentEventTypeId;

  // A sub-type only exists for some types (a wedding's mehndi, a festival's
  // Diwali), so it is checked against the type that will be stored.
  if (fields.subEventTypeId !== undefined && fields.subEventTypeId) {
    if (!isValidSubtype(effectiveType, fields.subEventTypeId)) {
      return 'Choose a valid sub-type for this event type';
    }
  }

  // "Other" needs a name so the calendar never shows a blank event type.
  if (fields.customEventType !== undefined) {
    if (typeof fields.customEventType !== 'string') return 'Event type name must be text';
    fields.customEventType = fields.customEventType.trim();
    if (fields.customEventType.length > 80) {
      return 'Event type name must be 80 characters or fewer';
    }
  }
  if (effectiveType === 'other') {
    // Required on create, when moving to Other, or when the name is sent. An
    // unrelated edit keeps the stored name.
    const needsName =
      creating || fields.eventTypeId !== undefined || fields.customEventType !== undefined;
    if (needsName && !fields.customEventType) return 'Type the event type name';
  } else if (fields.customEventType) {
    // The custom name belongs to Other only.
    fields.customEventType = '';
  }

  if (fields.status !== undefined && !EVENT_STATUSES.includes(fields.status)) return 'Choose a valid event status';

  // A start date is required; events are never created without one.
  if (creating && !fields.startAt) return 'Event date is required';
  if (fields.startAt !== undefined) {
    if (fields.startAt === '' || fields.startAt === null) return 'Event date is required';
    const date = new Date(fields.startAt);
    if (Number.isNaN(date.getTime())) return 'Enter a valid event date';
    fields.startAt = date;

    // New events must start in the future. On update, an event that already
    // happened may keep its date, but it cannot be moved to a different past
    // date. The minute of tolerance absorbs the seconds a form drops.
    const oneMinuteAgo = Date.now() - 60 * 1000;
    if (date.getTime() < oneMinuteAgo) {
      const stored = currentStartAt ? new Date(currentStartAt).getTime() : NaN;
      const unchanged = Number.isFinite(stored) && Math.abs(date.getTime() - stored) < 60 * 1000;
      if (creating || !unchanged) return 'Choose today or a later date';
    }
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

  // Venue is optional. When sent, keep only the two text fields so nothing else
  // can be stored on the nested object.
  if (fields.venue !== undefined) {
    const venue = fields.venue;
    if (!venue || typeof venue !== 'object' || Array.isArray(venue)) return 'Enter a valid venue';
    const name = typeof venue.name === 'string' ? venue.name.trim() : '';
    const address = typeof venue.address === 'string' ? venue.address.trim() : '';
    if (name.length > 120) return 'Venue name must be 120 characters or fewer';
    if (address.length > 300) return 'Venue address must be 300 characters or fewer';
    fields.venue = { name, address };
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

  const scope = req.query.scope || 'all';
  if (!['upcoming', 'past', 'all'].includes(scope)) {
    return sendError(res, 'Choose a valid event scope filter');
  }

  const filter = { userId: req.user._id };
  if (req.query.status) filter.status = req.query.status;
  // The client card and the future client detail screen need one client's
  // events. Ownership still comes from userId, so a foreign id returns nothing.
  if (req.query.clientId) {
    if (!isValidId(req.query.clientId)) return sendError(res, 'Invalid client ID');
    filter.clientId = req.query.clientId;
  }

  // Scope splits the calendar at local midnight, so "today" means today for the
  // planner. An archive (past) reads newest first; upcoming reads soonest first.
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  if (scope === 'upcoming') filter.startAt = { $gte: todayStart };
  if (scope === 'past') filter.startAt = { $lt: todayStart };

  // Search covers the event name and the client's name in one box.
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
  if (search) {
    const pattern = new RegExp(escapeRegex(search), 'i');
    const clients = await Client.find({ userId: req.user._id, name: pattern }).select('_id').lean();
    filter.$or = [
      { title: pattern },
      { clientId: { $in: clients.map((client) => client._id) } }
    ];
  }

  const page = parsePagination(req.query);
  const sortDirection = scope === 'upcoming' ? 1 : -1;

  const eventsQuery = Event.find(filter)
    .populate('clientId', 'name')
    .sort({ startAt: sortDirection, createdAt: -1 });
  if (page) eventsQuery.skip(page.skip).limit(page.limit);

  const [events, total] = await Promise.all([
    eventsQuery.lean(),
    page ? Event.countDocuments(filter) : null
  ]);

  const counts = await Task.aggregate([
    { $match: { userId: req.user._id, eventId: { $in: events.map((event) => event._id) } } },
    { $group: { _id: '$eventId', total: { $sum: 1 }, completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } } } }
  ]);
  const countByEvent = new Map(counts.map((item) => [String(item._id), item]));
  events.forEach((event) => {
    event.taskSummary = countByEvent.get(String(event._id)) || { total: 0, completed: 0 };
  });

  return sendSuccess(
    res,
    { events, ...(page ? { pagination: paginationMeta(total, page) } : {}) },
    'Events loaded successfully'
  );
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

// Adds the suggested checklist to an existing event. Titles already on the
// event are skipped, so a planner can click this twice without duplicates and
// can restore steps they deleted.
export const addSuggestedTasks = asyncHandler(async (req, res) => {
  if (!isValidId(req.params.id)) return sendError(res, 'Invalid event ID');

  const event = await Event.findOne({ _id: req.params.id, userId: req.user._id });
  if (!event) return sendError(res, 'Event not found', 404);

  const existing = await Task.find({ eventId: event._id, userId: req.user._id })
    .select('title')
    .lean();
  const takenTitles = new Set(existing.map((task) => task.title.trim().toLowerCase()));

  const drafts = buildTasksForEvent(event).filter(
    (draft) => !takenTitles.has(draft.title.trim().toLowerCase())
  );

  const tasks = drafts.length
    ? await Task.insertMany(drafts.map((draft) => ({
        ...draft,
        userId: req.user._id,
        eventId: event._id
      })))
    : [];

  const message = tasks.length
    ? `Added ${tasks.length} suggested ${tasks.length === 1 ? 'task' : 'tasks'}`
    : 'The suggested checklist is already in place';
  return sendCreated(res, { tasks }, message);
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

  // Suggested tasks are on by default; a planner can opt out and build the
  // checklist later from the event screen.
  const generateTasks = req.body.generateTasks === undefined ? true : req.body.generateTasks;
  if (typeof generateTasks !== 'boolean') return sendError(res, 'generateTasks must be true or false');

  if (!await ownsClient(values.clientId, req.user._id)) {
    return sendError(res, 'Choose one of your clients');
  }

  const event = await Event.create({ ...values, userId: req.user._id });

  const drafts = generateTasks ? buildTasksForEvent(event) : [];
  const tasks = drafts.length
    ? await Task.insertMany(drafts.map((draft) => ({
        ...draft,
        userId: req.user._id,
        eventId: event._id
      })))
    : [];

  await event.populate('clientId', 'name');
  const message = tasks.length
    ? `Event created with ${tasks.length} suggested tasks`
    : 'Event created successfully';
  return sendCreated(res, { event, tasks }, message);
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

  const validationMessage = validateEventFields(values, {
    currentEventTypeId: existing.eventTypeId,
    currentStartAt: existing.startAt
  });
  if (validationMessage) return sendError(res, validationMessage);
  if (!Object.keys(values).length) return sendError(res, 'Provide at least one field to update');

  if (values.clientId && !await ownsClient(values.clientId, req.user._id)) {
    return sendError(res, 'Choose one of your clients');
  }

  // Changing type clears choices that belonged to the old one, so a wedding
  // never keeps a festival's Diwali or a custom "Other" label.
  if (values.eventTypeId && values.eventTypeId !== existing.eventTypeId) {
    if (values.subEventTypeId === undefined) values.subEventTypeId = '';
    if (values.eventTypeId !== 'other' && values.customEventType === undefined) {
      values.customEventType = '';
    }
  }

  const event = await Event.findByIdAndUpdate(
    existing._id,
    { $set: values },
    { new: true, runValidators: true }
  ).populate('clientId', 'name');
  return sendSuccess(res, { event }, 'Event updated successfully');
});

export const duplicateEvent = asyncHandler(async (req, res) => {
  const { event, copiedTasks } = await duplicateEventForUser(req.user._id, req.params.id, req.body);
  return sendCreated(res, { event, copiedTasks }, 'Event duplicated successfully');
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
