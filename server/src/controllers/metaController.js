import { eventTypeGroups, festivalSubtypes } from '../config/eventTypeCatalog.js';
import { vendorCategories } from '../config/vendorCatalog.js';
import { sendSuccess } from '../utils/apiResponse.js';

// Gives the client one source for catalog labels instead of copying them.
export function getEventTypes(_req, res) {
  return sendSuccess(res, { groups: eventTypeGroups, festivalSubtypes }, 'Event types loaded successfully');
}

export function getVendorCategories(_req, res) {
  return sendSuccess(res, { categories: vendorCategories }, 'Vendor categories loaded successfully');
}
