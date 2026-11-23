import api from '../api/axios.js';

// Uploaded files live on the API origin (/uploads/...) while the client runs on
// its own origin in development. Prefix relative paths so an <img> can load
// them. Absolute URLs are left untouched.
export function assetUrl(path) {
  if (!path) return '';
  if (/^(https?:)?\/\//i.test(path) || path.startsWith('data:')) return path;

  try {
    const origin = new URL(api.defaults.baseURL).origin;
    const clean = path.startsWith('/') ? path : `/${path}`;
    return `${origin}${clean}`;
  } catch {
    return path;
  }
}
