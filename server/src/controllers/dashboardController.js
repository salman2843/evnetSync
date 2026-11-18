import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { getDashboardSummary } from '../services/dashboardService.js';

export const getSummary = asyncHandler(async (req, res) => {
  const summary = await getDashboardSummary(req.user._id);
  return sendSuccess(res, summary, 'Dashboard loaded successfully');
});
