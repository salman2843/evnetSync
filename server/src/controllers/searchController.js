import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { globalSearch } from '../services/searchService.js';

export const search = asyncHandler(async (req, res) => {
  const data = await globalSearch(req.user._id, req.query.q);
  return sendSuccess(res, data, 'Search completed successfully');
});
