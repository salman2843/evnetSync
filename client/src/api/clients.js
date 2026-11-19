import api from './axios.js';

// GET /api/clients -> { clients, pagination? }
export async function listClients({ search, status, sort, page, limit } = {}, signal) {
  const params = {};
  if (search) params.search = search;
  if (status) params.status = status;
  if (sort) params.sort = sort;
  if (page) params.page = page;
  if (limit) params.limit = limit;

  const { data } = await api.get('/clients', { params, signal });
  return data.data;
}

// POST /api/clients -> the new client
export async function createClient(values) {
  const { data } = await api.post('/clients', values);
  return data.data.client;
}

// PUT /api/clients/:id -> the updated client
export async function updateClient(id, changes) {
  const { data } = await api.put(`/clients/${id}`, changes);
  return data.data.client;
}

// DELETE /api/clients/:id -> the deleted client
export async function deleteClient(id) {
  const { data } = await api.delete(`/clients/${id}`);
  return data.data.client;
}
