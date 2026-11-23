import api from './axios.js';

// PATCH /api/profile -> the updated user
export async function updateProfile(changes) {
  const { data } = await api.patch('/profile', changes);
  return data.data.user;
}

// PUT /api/profile/password -> { user, token }; the fresh token keeps this
// session signed in after older tokens stop working.
export async function changePassword(values) {
  const { data } = await api.put('/profile/password', values);
  return data.data;
}

// POST /api/profile/logo (multipart) -> the updated user
export async function uploadLogo(file) {
  const form = new FormData();
  form.append('logo', file);
  const { data } = await api.post('/profile/logo', form);
  return data.data.user;
}

// DELETE /api/profile/logo -> the updated user
export async function removeLogo() {
  const { data } = await api.delete('/profile/logo');
  return data.data.user;
}
