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

// ---- Tasks ----------------------------------------------------------------
// POST /api/events/:id/tasks -> the new task
export async function createTask(eventId, values) {
  const { data } = await api.post(`/events/${eventId}/tasks`, values);
  return data.data.task;
}

// PUT /api/events/:id/tasks/:taskId -> the updated task
export async function updateTask(eventId, taskId, changes) {
  const { data } = await api.put(`/events/${eventId}/tasks/${taskId}`, changes);
  return data.data.task;
}

// DELETE /api/events/:id/tasks/:taskId -> the deleted task
export async function deleteTask(eventId, taskId) {
  const { data } = await api.delete(`/events/${eventId}/tasks/${taskId}`);
  return data.data.task;
}

// POST /api/events/:id/tasks/suggested -> { tasks } (skips titles already there)
export async function addSuggestedTasks(eventId) {
  const { data } = await api.post(`/events/${eventId}/tasks/suggested`);
  return { tasks: data.data.tasks, message: data.message };
}

// ---- Vendors assigned to one event ----------------------------------------
// GET /api/events/:id/vendors -> [{ vendorId: {...}, status, agreedAmount, ... }]
export async function listEventVendors(eventId, signal) {
  const { data } = await api.get(`/events/${eventId}/vendors`, { signal });
  return data.data.assignments;
}

// POST /api/events/:id/vendors -> the new assignment
export async function assignVendor(eventId, values) {
  const { data } = await api.post(`/events/${eventId}/vendors`, values);
  return data.data.assignment;
}

// PUT /api/events/:id/vendors/:assignmentId -> the updated assignment
export async function updateEventVendor(eventId, assignmentId, changes) {
  const { data } = await api.put(`/events/${eventId}/vendors/${assignmentId}`, changes);
  return data.data.assignment;
}

// DELETE /api/events/:id/vendors/:assignmentId -> the removed assignment
export async function removeEventVendor(eventId, assignmentId) {
  const { data } = await api.delete(`/events/${eventId}/vendors/${assignmentId}`);
  return data.data.assignment;
}
