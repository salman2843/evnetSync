import Client from '../models/Client.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendCreated, sendError, sendSuccess } from '../utils/apiResponse.js';
import { deleteClientForUser } from '../services/clientService.js';
import {
  CLIENT_STATUSES,
  EMAIL_PATTERN,
  PHONE_PATTERN,
  escapeRegex,
  isValidId,
  normalizePhone
} from '../utils/validation.js';
import { paginationMeta, parsePagination } from '../utils/pagination.js';

const editableFields = ['name', 'phone', 'email', 'address', 'notes', 'status'];

// Picks only editable fields from the request body and trims text values.
function clientFields(body) {
  const fields = {};
  for (const field of editableFields) {
    if (body[field] === undefined) continue;
    let value = typeof body[field] === 'string' ? body[field].trim() : body[field];
    if (field === 'phone') value = normalizePhone(value);
    if (field === 'email' && typeof value === 'string') value = value.toLowerCase();
    fields[field] = value;
  }
  return fields;
}

function validateClientFields(fields, { creating = false } = {}) {
  if ((creating || fields.name !== undefined) && (typeof fields.name !== 'string' || !fields.name)) {
    return 'Client name is required';
  }
  if (creating || fields.phone !== undefined) {
    if (typeof fields.phone !== 'string' || !fields.phone) return 'Client phone is required';
    if (!PHONE_PATTERN.test(fields.phone)) return 'Enter a valid phone number with country code, such as +919876543210';
  }
  // Email is optional; when provided it must look like an email address.
  if (fields.email !== undefined && fields.email && !EMAIL_PATTERN.test(fields.email)) {
    return 'Enter a valid email address';
  }
  if (fields.status !== undefined && !CLIENT_STATUSES.includes(fields.status)) {
    return 'Choose a valid client status';
  }
  return null;
}

export const createClient = asyncHandler(async (req, res) => {
  const fields = clientFields(req.body);
  const validationMessage = validateClientFields(fields, { creating: true });
  if (validationMessage) return sendError(res, validationMessage);

  const client = await Client.create({ ...fields, userId: req.user._id });
  return sendCreated(res, { client }, 'Lead captured successfully');
});

export const listClients = asyncHandler(async (req, res) => {
  if (req.query.status && !CLIENT_STATUSES.includes(req.query.status)) {
    return sendError(res, 'Choose a valid client status filter');
  }

  const filter = { userId: req.user._id };
  const search = req.query.search?.trim();
  if (search) {
    const match = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ name: match }, { phone: match }, { email: match }];
  }
  if (req.query.status) filter.status = req.query.status;

  const page = parsePagination(req.query);

  const clientsQuery = Client.find(filter).sort({ createdAt: -1 });
  if (page) clientsQuery.skip(page.skip).limit(page.limit);

  const [clients, total] = await Promise.all([
    clientsQuery,
    page ? Client.countDocuments(filter) : null
  ]);

  return sendSuccess(
    res,
    { clients, ...(page ? { pagination: paginationMeta(total, page) } : {}) },
    'Clients loaded successfully'
  );
});

export const getClient = asyncHandler(async (req, res) => {
  if (!isValidId(req.params.id)) return sendError(res, 'Invalid client ID');

  const client = await Client.findOne({ _id: req.params.id, userId: req.user._id });
  if (!client) return sendError(res, 'Client not found', 404);
  return sendSuccess(res, { client }, 'Client loaded successfully');
});

export const updateClient = asyncHandler(async (req, res) => {
  if (!isValidId(req.params.id)) return sendError(res, 'Invalid client ID');

  const fields = clientFields(req.body);
  const validationMessage = validateClientFields(fields);
  if (validationMessage) return sendError(res, validationMessage);
  if (!Object.keys(fields).length) return sendError(res, 'Provide at least one field to update');

  const client = await Client.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    { $set: fields },
    { new: true, runValidators: true }
  );
  if (!client) return sendError(res, 'Client not found', 404);
  return sendSuccess(res, { client }, 'Client updated successfully');
});

export const deleteClient = asyncHandler(async (req, res) => {
  const client = await deleteClientForUser(req.user._id, req.params.id);
  return sendSuccess(res, { client }, 'Client deleted successfully');
});
