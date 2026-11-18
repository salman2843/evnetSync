import { eventTypeGroups, festivalSubtypes } from '../config/eventTypeCatalog.js';
import { sendSuccess } from '../utils/apiResponse.js';

// Gives the client one source for event-type labels instead of copying the catalog.
export function getEventTypes(_req, res) {
  return sendSuccess(res, { groups: eventTypeGroups, festivalSubtypes }, 'Event types loaded successfully');
}
