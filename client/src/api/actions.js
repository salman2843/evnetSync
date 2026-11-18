import api from './axios.js';

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
