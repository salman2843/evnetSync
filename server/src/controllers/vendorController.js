import asyncHandler from '../utils/asyncHandler.js';
import { sendCreated, sendSuccess } from '../utils/apiResponse.js';
import {
  createVendorForUser,
  deleteVendorForUser,
  getVendorForUser,
  listVendorsForUser,
  updateVendorForUser
} from '../services/vendorService.js';

export const listVendors = asyncHandler(async (req, res) => {
  const vendors = await listVendorsForUser(req.user._id, req.query);
  return sendSuccess(res, { vendors }, 'Vendors loaded successfully');
});

export const getVendor = asyncHandler(async (req, res) => {
  const vendor = await getVendorForUser(req.user._id, req.params.id);
  return sendSuccess(res, { vendor }, 'Vendor loaded successfully');
});

export const createVendor = asyncHandler(async (req, res) => {
  const vendor = await createVendorForUser(req.user._id, req.body);
  return sendCreated(res, { vendor }, 'Vendor added successfully');
});

export const updateVendor = asyncHandler(async (req, res) => {
  const vendor = await updateVendorForUser(req.user._id, req.params.id, req.body);
  return sendSuccess(res, { vendor }, 'Vendor updated successfully');
});

export const deleteVendor = asyncHandler(async (req, res) => {
  const vendor = await deleteVendorForUser(req.user._id, req.params.id);
  return sendSuccess(res, { vendor }, 'Vendor deleted successfully');
});
