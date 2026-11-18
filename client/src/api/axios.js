import axios from 'axios';

export const TOKEN_KEY = 'eventsync_token';

// One Axios instance for every request. The token is read at request time, so a
// login or logout is picked up without recreating the instance.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// A 401 on a normal request means the token expired or was revoked. Drop it so
// the app falls back to the login screen. A failed login attempt (401) must keep
// its message, so auth endpoints are skipped.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';
    if (status === 401 && !url.startsWith('/auth/login') && !url.startsWith('/auth/register')) {
      localStorage.removeItem(TOKEN_KEY);
    }
    return Promise.reject(error);
  }
);

export default api;
