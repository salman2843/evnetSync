import { getPublicUser, loginUser, registerUser, savePlannerProfile as saveProfile } from '../services/authService.js';

export async function register(req, res, next) {
  try {
    const data = await registerUser(req.body);
    res.status(201).json({ success: true, data, message: 'Account created successfully' });
  } catch (error) { next(error); }
}

export async function login(req, res, next) {
  try {
    const data = await loginUser(req.body);
    res.json({ success: true, data, message: 'Logged in successfully' });
  } catch (error) { next(error); }
}

export function me(req, res) {
  res.json({ success: true, data: { user: getPublicUser(req.user) }, message: 'Current user loaded' });
}

export async function savePlannerProfile(req, res, next) {
  try {
    const user = await saveProfile(req.user, req.body);
    res.json({ success: true, data: { user }, message: 'Planner settings saved' });
  } catch (error) { next(error); }
}
