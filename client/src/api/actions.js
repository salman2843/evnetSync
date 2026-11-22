import api from './axios.js';

// GET /api/actions?status=&eventId=&due= -> [{ ...action, isOverdue }]
// The server defaults to open actions; pass status: 'all' to include history.
export async function listActions({ status, eventId, due } = {}, signal) {
  const params = {};
  if (status) params.status = status;
  if (eventId) params.eventId = eventId;
  if (due) params.due = due;

  const { data } = await api.get('/actions', { params, signal });
  return data.data.actions;
}

// POST /api/actions/regenerate -> { created, updated, removed, total }
export async function regenerateActions() {
  const { data } = await api.post('/actions/regenerate');
  return data.data;
}

// PATCH /api/actions/:id -> the updated action
export async function updateAction(id, changes) {
  const { data } = await api.patch(`/actions/${id}`, changes);
  return data.data;
}
