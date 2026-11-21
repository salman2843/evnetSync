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

// GET /api/events/:id -> { event, tasks }
export async function getEvent(id, signal) {
  const { data } = await api.get(`/events/${id}`, { signal });
  return data.data;
}

// POST /api/events -> { event, tasks } (tasks are the suggested checklist)
export async function createEvent(values) {
  const { data } = await api.post('/events', values);
  return data.data;
}

// PUT /api/events/:id -> the updated event
export async function updateEvent(id, changes) {
  const { data } = await api.put(`/events/${id}`, changes);
  return data.data.event;
}

// POST /api/events/:id/duplicate -> { event, copiedTasks }
export async function duplicateEvent(id) {
  const { data } = await api.post(`/events/${id}/duplicate`);
  return data.data;
}

// DELETE /api/events/:id -> the deleted event
export async function deleteEvent(id) {
  const { data } = await api.delete(`/events/${id}`);
  return data.data.event;
}
