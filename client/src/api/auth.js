import api from './axios.js';

// POST /api/auth/login -> { success, data: { user, token }, message }
export async function loginRequest(credentials) {
  const { data } = await api.post('/auth/login', credentials);
  return data.data;
}

// POST /api/auth/register -> { success, data: { user, token }, message }
// A new planner is signed in straight away, so the caller gets the same shape
// as a login.
export async function registerRequest(details) {
  const { data } = await api.post('/auth/register', details);
  return data.data;
}

// GET /api/auth/me -> { success, data: { user }, message }
export async function meRequest() {
  const { data } = await api.get('/auth/me');
  return data.data.user;
}
