import asyncHandler from '../utils/asyncHandler.js';
import {
  buildActionsCsv,
  buildClientsCsv,
  buildEventsCsv,
  buildVendorsCsv
} from '../services/exportService.js';

// CSV is downloaded by a browser, so it cannot use the { success, data, message }
// JSON envelope. The BOM at the start tells Excel the file is UTF-8.
function sendCsv(res, baseName, csv) {
  const today = new Date().toISOString().slice(0, 10);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${baseName}-${today}.csv"`);
  return res.send(`\uFEFF${csv}`);
}

export const exportClients = asyncHandler(async (req, res) => {
  sendCsv(res, 'clients', await buildClientsCsv(req.user._id));
});

export const exportEvents = asyncHandler(async (req, res) => {
  sendCsv(res, 'events', await buildEventsCsv(req.user._id));
});

export const exportVendors = asyncHandler(async (req, res) => {
  sendCsv(res, 'vendors', await buildVendorsCsv(req.user._id));
});

export const exportActions = asyncHandler(async (req, res) => {
  sendCsv(res, 'actions', await buildActionsCsv(req.user._id));
});
