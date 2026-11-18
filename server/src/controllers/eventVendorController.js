import asyncHandler from '../utils/asyncHandler.js';
import { sendCreated, sendSuccess } from '../utils/apiResponse.js';
import {
  createEventVendor,
  deleteEventVendor,
  listEventVendors as listAssignments,
  updateEventVendor as updateAssignment
} from '../services/assignmentService.js';

export const listEventVendors = asyncHandler(async (req, res) => {
  const assignments = await listAssignments(req.user._id, req.params.id);
  return sendSuccess(res, { assignments }, 'Event vendors loaded successfully');
});

export const assignVendor = asyncHandler(async (req, res) => {
  const assignment = await createEventVendor(req.user._id, req.params.id, req.body);
  return sendCreated(res, { assignment }, 'Vendor assigned to the event');
});

export const updateEventVendor = asyncHandler(async (req, res) => {
  const assignment = await updateAssignment(req.user._id, req.params.id, req.params.assignmentId, req.body);
  return sendSuccess(res, { assignment }, 'Vendor assignment updated successfully');
});

export const removeEventVendor = asyncHandler(async (req, res) => {
  const assignment = await deleteEventVendor(req.user._id, req.params.id, req.params.assignmentId);
  return sendSuccess(res, { assignment }, 'Vendor removed from the event');
});
