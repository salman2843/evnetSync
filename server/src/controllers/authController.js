import { getPublicUser, loginUser, registerUser, savePlannerProfile as saveProfile } from '../services/authService.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendCreated, sendSuccess } from '../utils/apiResponse.js';

export const register = asyncHandler(async (req, res) => {
  const data = await registerUser(req.body);
  return sendCreated(res, data, 'Account created successfully');
});

export const login = asyncHandler(async (req, res) => {
  const data = await loginUser(req.body);
  return sendSuccess(res, data, 'Logged in successfully');
});

export function me(req, res) {
  return sendSuccess(res, { user: getPublicUser(req.user) }, 'Current user loaded');
}

export const savePlannerProfile = asyncHandler(async (req, res) => {
  const user = await saveProfile(req.user, req.body);
  return sendSuccess(res, { user }, 'Planner settings saved');
});
