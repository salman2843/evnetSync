import asyncHandler from '../utils/asyncHandler.js';
import { sendCreated, sendSuccess } from '../utils/apiResponse.js';
import {
  createManualActionForUser,
  listActionsForUser,
  regenerateActionsForUser,
  updateActionForUser
} from '../services/actionService.js';

export const listActions = asyncHandler(async (req, res) => {
  const actions = await listActionsForUser(req.user._id, req.query);
  return sendSuccess(res, { actions }, 'Actions loaded successfully');
});

export const createAction = asyncHandler(async (req, res) => {
  const action = await createManualActionForUser(req.user._id, req.body);
  return sendCreated(res, { action }, 'Action added successfully');
});

export const updateAction = asyncHandler(async (req, res) => {
  const action = await updateActionForUser(req.user._id, req.params.id, req.body);
  return sendSuccess(res, { action }, 'Action updated successfully');
});

export const regenerateActions = asyncHandler(async (req, res) => {
  const summary = await regenerateActionsForUser(req.user._id);
  return sendSuccess(res, summary, 'Actions regenerated successfully');
});
