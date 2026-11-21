import api from './axios.js';

// GET /api/meta/vendor-categories -> [{ id, label }]
// Labels live on the server so a renamed category never needs a frontend edit.
export async function getVendorCategories(signal) {
  const { data } = await api.get('/meta/vendor-categories', { signal });
  return data.data.categories;
}

// GET /api/meta/event-types -> { groups, festivalSubtypes }
// Each type in a group carries its own `subtypes` (a wedding's mehndi, a
// festival's Diwali), so the form shows a second picker only when needed.
export async function getEventTypes(signal) {
  const { data } = await api.get('/meta/event-types', { signal });
  return data.data;
}
