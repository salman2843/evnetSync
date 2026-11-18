import Vendor from '../models/Vendor.js';
import EventVendor from '../models/EventVendor.js';
import { vendorCategoryIds } from '../config/vendorCatalog.js';
import httpError from '../utils/httpError.js';
import { paginationMeta, parsePagination } from '../utils/pagination.js';
import {
  EMAIL_PATTERN,
  PHONE_PATTERN,
  escapeRegex,
  isValidId,
  normalizePhone
} from '../utils/validation.js';

const editableFields = ['name', 'serviceCategoryIds', 'phone', 'email', 'website', 'address', 'notes'];
const WEBSITE_PATTERN = /^https?:\/\/\S+\.\S+$/i;

function requireValidId(id) {
  if (!isValidId(id)) throw httpError('Invalid vendor ID');
}

// Picks editable fields, trims text, and normalizes phone and email.
function vendorFields(body) {
  const fields = {};
  for (const field of editableFields) {
    if (body[field] === undefined) continue;
    if (field === 'serviceCategoryIds') {
      fields[field] = body[field];
      continue;
    }
    let value = typeof body[field] === 'string' ? body[field].trim() : body[field];
    if (field === 'phone') value = normalizePhone(value);
    if (field === 'email' && typeof value === 'string') value = value.toLowerCase();
    fields[field] = value;
  }
  return fields;
}

function validateVendorFields(fields, { creating = false } = {}) {
  if (creating || fields.name !== undefined) {
    if (typeof fields.name !== 'string' || !fields.name) return 'Vendor name is required';
    if (fields.name.length > 120) return 'Vendor name must be 120 characters or fewer';
  }

  if (fields.serviceCategoryIds !== undefined) {
    if (!Array.isArray(fields.serviceCategoryIds)) return 'Service categories must be a list';
    const invalid = fields.serviceCategoryIds.find((id) => !vendorCategoryIds.includes(id));
    if (invalid) return `Unknown service category: ${invalid}`;
    fields.serviceCategoryIds = [...new Set(fields.serviceCategoryIds)];
  }

  // Contact details are optional for a vendor, but must be valid when provided.
  if (fields.phone && !PHONE_PATTERN.test(fields.phone)) {
    return 'Enter a valid phone number with country code, such as +919876543210';
  }
  if (fields.email && !EMAIL_PATTERN.test(fields.email)) return 'Enter a valid email address';
  if (fields.website && !WEBSITE_PATTERN.test(fields.website)) {
    return 'Enter a website starting with http:// or https://';
  }
  if (fields.address !== undefined && typeof fields.address !== 'string') return 'Address must be text';
  if (fields.notes !== undefined && typeof fields.notes !== 'string') return 'Notes must be text';
  return null;
}

export async function listVendorsForUser(userId, query = {}) {
  const filter = { userId };

  const search = query.search?.trim();
  if (search) {
    const match = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ name: match }, { phone: match }, { email: match }, { address: match }];
  }

  if (query.category) {
    if (!vendorCategoryIds.includes(query.category)) throw httpError('Choose a valid service category filter');
    filter.serviceCategoryIds = query.category;
  }

  const page = parsePagination(query);
  const vendorsQuery = Vendor.find(filter).sort({ name: 1 });
  if (page) vendorsQuery.skip(page.skip).limit(page.limit);

  const [vendors, total] = await Promise.all([
    vendorsQuery,
    page ? Vendor.countDocuments(filter) : null
  ]);

  return { vendors, pagination: page ? paginationMeta(total, page) : null };
}

export async function getVendorForUser(userId, vendorId) {
  requireValidId(vendorId);
  const vendor = await Vendor.findOne({ _id: vendorId, userId });
  if (!vendor) throw httpError('Vendor not found', 404);
  return vendor;
}

export async function createVendorForUser(userId, body) {
  const fields = vendorFields(body);
  const message = validateVendorFields(fields, { creating: true });
  if (message) throw httpError(message);

  return Vendor.create({ ...fields, userId });
}

export async function updateVendorForUser(userId, vendorId, body) {
  requireValidId(vendorId);

  const fields = vendorFields(body);
  const message = validateVendorFields(fields);
  if (message) throw httpError(message);
  if (!Object.keys(fields).length) throw httpError('Provide at least one field to update');

  const vendor = await Vendor.findOneAndUpdate(
    { _id: vendorId, userId },
    { $set: fields },
    { new: true, runValidators: true }
  );
  if (!vendor) throw httpError('Vendor not found', 404);
  return vendor;
}

export async function deleteVendorForUser(userId, vendorId) {
  requireValidId(vendorId);

  // Do not remove a vendor that is still booked on an event.
  const assignmentCount = await EventVendor.countDocuments({ userId, vendorId });
  if (assignmentCount > 0) {
    throw httpError(
      `This vendor is assigned to ${assignmentCount} event${assignmentCount === 1 ? '' : 's'}. Remove those assignments first.`,
      409
    );
  }

  const vendor = await Vendor.findOneAndDelete({ _id: vendorId, userId });
  if (!vendor) throw httpError('Vendor not found', 404);
  return vendor;
}
