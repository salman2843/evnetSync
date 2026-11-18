import api from './axios.js';

// GET /api/dashboard/summary -> the whole dashboard in one request.
export async function getSummary(signal) {
  const { data } = await api.get('/dashboard/summary', { signal });
  return data.data;
}
