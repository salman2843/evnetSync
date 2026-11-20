import api from './axios.js';

// GET /api/meta/vendor-categories -> [{ id, label }]
// Labels live on the server so a renamed category never needs a frontend edit.
export async function getVendorCategories(signal) {
  const { data } = await api.get('/meta/vendor-categories', { signal });
  return data.data.categories;
}
