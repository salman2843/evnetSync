import Client from '../models/Client.js';
import Event from '../models/Event.js';
import Task from '../models/Task.js';
import httpError from '../utils/httpError.js';
import { isValidId } from '../utils/validation.js';

// Copies an event and its task list. Task due dates move by the same number of
// days as the event, so a wedding planned for next year keeps its timeline.
// Vendor assignments and actions are not copied: they are decisions, not data.
export async function duplicateEventForUser(userId, eventId, body = {}) {
  if (!isValidId(eventId)) throw httpError('Invalid event ID');

  const original = await Event.findOne({ _id: eventId, userId }).lean();
  if (!original) throw httpError('Event not found', 404);

  let clientId = original.clientId;
  if (body.clientId !== undefined) {
    if (!isValidId(body.clientId)) throw httpError('Choose a client');
    clientId = body.clientId;
  }
  const client = await Client.exists({ _id: clientId, userId });
  if (!client) throw httpError('Choose one of your clients');

  let title = `${original.title} (copy)`;
  if (body.title !== undefined) {
    if (typeof body.title !== 'string' || !body.title.trim()) throw httpError('Event name is required');
    title = body.title.trim();
  }
  if (title.length > 120) title = title.slice(0, 120);

  let startAt = new Date(original.startAt);
  if (body.startAt !== undefined) {
    startAt = new Date(body.startAt);
    if (Number.isNaN(startAt.getTime())) throw httpError('Enter a valid event date');
  }
  const shiftMs = startAt.getTime() - new Date(original.startAt).getTime();

  const event = await Event.create({
    userId,
    clientId,
    title,
    eventTypeId: original.eventTypeId,
    subEventTypeId: original.subEventTypeId,
    surpriseFor: original.surpriseFor,
    // A copy is a fresh lead, not a confirmed booking.
    status: 'inquiry',
    startAt,
    budget: {
      amount: original.budget?.amount ?? 0,
      spent: 0,
      currency: original.budget?.currency ?? 'INR'
    },
    notes: original.notes
  });

  const originalTasks = await Task.find({ userId, eventId: original._id }).lean();
  let copiedTasks = 0;
  if (originalTasks.length) {
    const tasks = originalTasks.map((task) => ({
      userId,
      eventId: event._id,
      title: task.title,
      priority: task.priority,
      // Copied tasks start open, even if the originals were completed.
      status: 'open',
      dueAt: task.dueAt ? new Date(new Date(task.dueAt).getTime() + shiftMs) : null
    }));
    const inserted = await Task.insertMany(tasks);
    copiedTasks = inserted.length;
  }

  await event.populate('clientId', 'name');
  return { event, copiedTasks };
}
