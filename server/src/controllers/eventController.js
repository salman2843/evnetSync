import mongoose from 'mongoose';
import Client from '../models/Client.js';
import Event from '../models/Event.js';
import Task from '../models/Task.js';
import { eventTypeGroups } from '../config/eventTypeCatalog.js';

const statuses = ['inquiry', 'planning', 'confirmed', 'completed', 'cancelled'];
const eventTypeIds = new Set(eventTypeGroups.flatMap((group) => group.types.map((type) => type.id)));
const festivalSubtypes = new Set(['diwali', 'holi', 'navratri', 'ganesh_chaturthi', 'durga_puja', 'onam']);
const currencies = new Set(['INR', 'USD', 'EUR', 'GBP']);
const fields = ['clientId', 'title', 'eventTypeId', 'subEventTypeId', 'surpriseFor', 'status', 'startAt', 'budget', 'notes'];

function inputFields(body) {
  return Object.fromEntries(fields.filter((field) => body[field] !== undefined).map((field) => [
    field,
    typeof body[field] === 'string' ? body[field].trim() : body[field]
  ]));
}

function validate(fields, creating = false) {
  if ((creating || fields.clientId !== undefined) && !mongoose.isValidObjectId(fields.clientId)) return 'Choose a client';
  if ((creating || fields.title !== undefined) && (typeof fields.title !== 'string' || !fields.title)) return 'Event name is required';
  if ((creating || fields.eventTypeId !== undefined) && !eventTypeIds.has(fields.eventTypeId)) return 'Choose a valid event type';
  if (fields.subEventTypeId !== undefined && fields.subEventTypeId && (!festivalSubtypes.has(fields.subEventTypeId) || fields.eventTypeId !== 'festival')) return 'Choose a valid festival type';
  if (fields.status !== undefined && !statuses.includes(fields.status)) return 'Choose a valid event status';
  if (creating && !fields.startAt) return 'Event date is required';
  if (fields.startAt !== undefined && fields.startAt === '') return 'Event date is required';
  if (fields.startAt !== undefined && fields.startAt !== null && fields.startAt !== '') {
    const date = new Date(fields.startAt);
    if (Number.isNaN(date.getTime())) return 'Enter a valid event date';
    fields.startAt = date;
  }
  if (fields.budget !== undefined) {
    const budget = fields.budget;
    if (!budget || typeof budget !== 'object' || Array.isArray(budget)) return 'Enter a valid budget';
    const amount = Number(budget.amount);
    const spent = Number(budget.spent || 0);
    if (!Number.isFinite(amount) || amount < 0 || !Number.isFinite(spent) || spent < 0) return 'Budget values must be zero or greater';
    const currency = typeof budget.currency === 'string' ? budget.currency.trim().toUpperCase() : 'INR';
    if (!currencies.has(currency)) return 'Choose a supported budget currency';
    fields.budget = { amount, spent, currency };
  }
  if (fields.notes !== undefined && typeof fields.notes !== 'string') return 'Notes must be text';
  return null;
}

async function ownsClient(clientId, userId) {
  return Client.exists({ _id: clientId, userId });
}

export async function listEvents(req, res, next) {
  try {
    const filter = { userId: req.user._id };
    if (req.query.status && !statuses.includes(req.query.status)) return res.status(400).json({ success: false, data: null, message: 'Choose a valid event status filter' });
    if (req.query.status) filter.status = req.query.status;
    const events = await Event.find(filter)
      .populate('clientId', 'name')
      .sort({ startAt: 1, createdAt: -1 }).lean();
    const counts = await Task.aggregate([
      { $match: { userId: req.user._id, eventId: { $in: events.map((event) => event._id) } } },
      { $group: { _id: '$eventId', total: { $sum: 1 }, completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } } } }
    ]);
    const countByEvent = new Map(counts.map((item) => [String(item._id), item]));
    events.forEach((event) => { event.taskSummary = countByEvent.get(String(event._id)) || { total: 0, completed: 0 }; });
    return res.json({ success: true, data: { events }, message: 'Events loaded successfully' });
  } catch (error) { return next(error); }
}

export async function getEvent(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, data: null, message: 'Invalid event ID' });
    const event = await Event.findOne({ _id: req.params.id, userId: req.user._id })
      .populate('clientId', 'name phone email')
      .populate({ path: 'tasks', match: { userId: req.user._id }, options: { sort: { dueAt: 1, createdAt: 1 } } });
    if (!event) return res.status(404).json({ success: false, data: null, message: 'Event not found' });
    return res.json({ success: true, data: { event, tasks: event.tasks }, message: 'Event details loaded successfully' });
  } catch (error) { return next(error); }
}

export async function createTask(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, data: null, message: 'Invalid event ID' });
    const event = await Event.findOne({ _id: req.params.id, userId: req.user._id });
    if (!event) return res.status(404).json({ success: false, data: null, message: 'Event not found' });
    const title = typeof req.body.title === 'string' ? req.body.title.trim() : '';
    if (!title) return res.status(400).json({ success: false, data: null, message: 'Task name is required' });
    if (title.length > 160) return res.status(400).json({ success: false, data: null, message: 'Task name must be 160 characters or fewer' });
    const dueAt = req.body.dueAt ? new Date(req.body.dueAt) : null;
    if (dueAt && Number.isNaN(dueAt.getTime())) return res.status(400).json({ success: false, data: null, message: 'Enter a valid task due date' });
    const task = await Task.create({ userId: req.user._id, eventId: event._id, title, dueAt, priority: ['low', 'normal', 'high'].includes(req.body.priority) ? req.body.priority : 'normal' });
    return res.status(201).json({ success: true, data: { task }, message: 'Task added successfully' });
  } catch (error) { return next(error); }
}

export async function updateTask(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id) || !mongoose.isValidObjectId(req.params.taskId)) return res.status(400).json({ success: false, data: null, message: 'Invalid event or task ID' });
    const event = await Event.findOne({ _id: req.params.id, userId: req.user._id });
    if (!event) return res.status(404).json({ success: false, data: null, message: 'Event not found' });
    const values = {};
    if (req.body.status !== undefined) {
      if (!['open', 'completed'].includes(req.body.status)) return res.status(400).json({ success: false, data: null, message: 'Choose a valid task status' });
      values.status = req.body.status;
    }
    if (req.body.title !== undefined) {
      values.title = typeof req.body.title === 'string' ? req.body.title.trim() : '';
      if (!values.title) return res.status(400).json({ success: false, data: null, message: 'Task name is required' });
      if (values.title.length > 160) return res.status(400).json({ success: false, data: null, message: 'Task name must be 160 characters or fewer' });
    }
    const task = await Task.findOneAndUpdate({ _id: req.params.taskId, eventId: event._id, userId: req.user._id }, { $set: values }, { new: true, runValidators: true });
    if (!task) return res.status(404).json({ success: false, data: null, message: 'Task not found' });
    return res.json({ success: true, data: { task }, message: 'Task updated successfully' });
  } catch (error) { return next(error); }
}

export async function deleteTask(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id) || !mongoose.isValidObjectId(req.params.taskId)) return res.status(400).json({ success: false, data: null, message: 'Invalid event or task ID' });
    const task = await Task.findOneAndDelete({ _id: req.params.taskId, eventId: req.params.id, userId: req.user._id });
    if (!task) return res.status(404).json({ success: false, data: null, message: 'Task not found' });
    return res.json({ success: true, data: { task }, message: 'Task deleted successfully' });
  } catch (error) { return next(error); }
}

export async function createEvent(req, res, next) {
  try {
    const values = inputFields(req.body);
    const error = validate(values, true);
    if (error) return res.status(400).json({ success: false, data: null, message: error });
    if (!await ownsClient(values.clientId, req.user._id)) {
      return res.status(400).json({ success: false, data: null, message: 'Choose one of your clients' });
    }
    const event = await Event.create({ ...values, userId: req.user._id });
    await event.populate('clientId', 'name');
    return res.status(201).json({ success: true, data: { event }, message: 'Event created successfully' });
  } catch (error) { return next(error); }
}

export async function updateEvent(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, data: null, message: 'Invalid event ID' });
    const values = inputFields(req.body);
    const error = validate(values);
    if (error) return res.status(400).json({ success: false, data: null, message: error });
    if (!Object.keys(values).length) return res.status(400).json({ success: false, data: null, message: 'Provide at least one field to update' });
    if (values.clientId && !await ownsClient(values.clientId, req.user._id)) {
      return res.status(400).json({ success: false, data: null, message: 'Choose one of your clients' });
    }
    const event = await Event.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id }, { $set: values }, { new: true, runValidators: true }
    ).populate('clientId', 'name');
    if (!event) return res.status(404).json({ success: false, data: null, message: 'Event not found' });
    return res.json({ success: true, data: { event }, message: 'Event updated successfully' });
  } catch (error) { return next(error); }
}

export async function deleteEvent(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, data: null, message: 'Invalid event ID' });
    const event = await Event.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!event) return res.status(404).json({ success: false, data: null, message: 'Event not found' });
    await Task.deleteMany({ eventId: event._id, userId: req.user._id });
    return res.json({ success: true, data: { event }, message: 'Event deleted successfully' });
  } catch (error) { return next(error); }
}
