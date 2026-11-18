import Client from '../models/Client.js';
import Event from '../models/Event.js';
import httpError from '../utils/httpError.js';
import { isValidId } from '../utils/validation.js';

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
