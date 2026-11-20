import api from './axios.js';

// GET /api/vendors -> { vendors, pagination? }
export async function listVendors({ search, category, page, limit } = {}, signal) {
  const params = {};
  if (search) params.search = search;
  if (category) params.category = category;
  if (page) params.page = page;
  if (limit) params.limit = limit;

  const { data } = await api.get('/vendors', { params, signal });
  return data.data;
}

// POST /api/vendors -> the new vendor
export async function createVendor(values) {
  const { data } = await api.post('/vendors', values);
  return data.data.vendor;
}

// PUT /api/vendors/:id -> the updated vendor
export async function updateVendor(id, changes) {
  const { data } = await api.put(`/vendors/${id}`, changes);
  return data.data.vendor;
}

// DELETE /api/vendors/:id -> the deleted vendor
export async function deleteVendor(id) {
  const { data } = await api.delete(`/vendors/${id}`);
  return data.data.vendor;
}
