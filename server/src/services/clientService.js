import Client from '../models/Client.js';
import Event from '../models/Event.js';
import httpError from '../utils/httpError.js';
import { isValidId } from '../utils/validation.js';

// Adds the event summary a client card shows. One query for the whole page keeps
// the list cheap: count every event and remember the next one that has not been
// cancelled and has not started yet.
export async function attachClientEventStats(clients, userId) {
  if (clients.length === 0) return clients;

  const events = await Event.find({
    userId,
    clientId: { $in: clients.map((client) => client._id) }
  })
    .select('clientId startAt status')
    .lean();

  const now = Date.now();
  const stats = new Map();

  for (const event of events) {
    const key = String(event.clientId);
    const entry = stats.get(key) || { eventCount: 0, nextEventAt: null };
    entry.eventCount += 1;

    const startAt = new Date(event.startAt);
    const isNext = event.status !== 'cancelled' && startAt.getTime() >= now;
    if (isNext && (!entry.nextEventAt || startAt < entry.nextEventAt)) {
      entry.nextEventAt = startAt;
    }
    stats.set(key, entry);
  }

  return clients.map((client) => ({
    ...client,
    ...(stats.get(String(client._id)) || { eventCount: 0, nextEventAt: null })
  }));
}

// Deleting a client that still has events would leave those events with a dead
// clientId and break every list that populates the client. Block it with 409.
export async function deleteClientForUser(userId, clientId) {
  if (!isValidId(clientId)) throw httpError('Invalid client ID', 400);

  const eventCount = await Event.countDocuments({ userId, clientId });
  if (eventCount > 0) {
    throw httpError(
      `This client has ${eventCount} event${eventCount === 1 ? '' : 's'}. Delete or move those events first.`,
      409
    );
  }

  const client = await Client.findOneAndDelete({ _id: clientId, userId });
  if (!client) throw httpError('Client not found', 404);
  return client;
}
