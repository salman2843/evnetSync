import api from './axios.js';

// GET /api/events -> { events, pagination? }
// search matches the event title or the client name. scope is
// upcoming | past | all; the server returns the matching set already sorted.
export async function listEvents({ search, status, scope } = {}, signal) {
  const params = {};
  if (search) params.search = search;
  if (status) params.status = status;
  if (scope) params.scope = scope;

  const { data } = await api.get('/events', { params, signal });
  return data.data;
}
