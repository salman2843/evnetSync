import ActionItem from '../models/ActionItem.js';
import Client from '../models/Client.js';
import Event from '../models/Event.js';
import Task from '../models/Task.js';
import Vendor from '../models/Vendor.js';
import httpError from '../utils/httpError.js';
import { escapeRegex } from '../utils/validation.js';

// At most five hits per group keeps the dropdown readable and the query cheap.
const LIMIT = 5;
const MAX_QUERY_LENGTH = 60;

const subtitle = (...parts) => parts.filter(Boolean).join(' · ');

// One search across every planner-owned collection. Each group is independent
// and always filtered by userId, so a planner can never see another's records.
export async function globalSearch(userId, rawQuery) {
  const query = typeof rawQuery === 'string' ? rawQuery.trim() : '';
  if (!query) throw httpError('Enter a search term');
  if (query.length > MAX_QUERY_LENGTH) {
    throw httpError(`Search term must be ${MAX_QUERY_LENGTH} characters or fewer`);
  }

  // escapeRegex keeps a search like "(" from breaking the regular expression.
  const match = new RegExp(escapeRegex(query), 'i');

  const [clients, events, vendors, actions, tasks] = await Promise.all([
    Client.find({ userId, $or: [{ name: match }, { phone: match }, { email: match }] })
      .sort({ name: 1 })
      .limit(LIMIT)
      .lean(),
    Event.find({ userId, $or: [{ title: match }, { notes: match }, { surpriseFor: match }] })
      .populate('clientId', 'name')
      .sort({ startAt: 1 })
      .limit(LIMIT)
      .lean(),
    Vendor.find({
      userId,
      $or: [{ name: match }, { phone: match }, { email: match }, { address: match }]
    })
      .sort({ name: 1 })
      .limit(LIMIT)
      .lean(),
    ActionItem.find({ userId, $or: [{ title: match }, { description: match }] })
      .populate('eventId', 'title')
      .sort({ status: 1, dueAt: 1 })
      .limit(LIMIT)
      .lean(),
    Task.find({ userId, title: match })
      .populate('eventId', 'title')
      .sort({ dueAt: 1 })
      .limit(LIMIT)
      .lean()
  ]);

  const results = {
    clients: clients.map((client) => ({
      _id: client._id,
      title: client.name,
      subtitle: subtitle(client.phone, client.email)
    })),
    events: events.map((event) => ({
      _id: event._id,
      title: event.title,
      subtitle: subtitle(event.clientId?.name, event.status),
      startAt: event.startAt
    })),
    vendors: vendors.map((vendor) => ({
      _id: vendor._id,
      title: vendor.name,
      subtitle: subtitle(vendor.phone, vendor.email, vendor.address)
    })),
    actions: actions.map((action) => ({
      _id: action._id,
      title: action.title,
      subtitle: subtitle(action.status, action.eventId?.title),
      eventId: action.eventId?._id || null
    })),
    tasks: tasks.map((task) => ({
      _id: task._id,
      title: task.title,
      subtitle: subtitle(task.status, task.eventId?.title),
      eventId: task.eventId?._id || null
    }))
  };

  const total = Object.values(results).reduce((sum, items) => sum + items.length, 0);
  return { query, total, results };
}
