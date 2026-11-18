import Event from '../models/Event.js';
import EventVendor from '../models/EventVendor.js';
import Vendor from '../models/Vendor.js';
import { vendorCategoryIds } from '../config/vendorCatalog.js';
import httpError from '../utils/httpError.js';
import { ASSIGNMENT_STATUSES, CURRENCIES, isValidId } from '../utils/validation.js';

const editableFields = ['serviceCategoryId', 'status', 'agreedAmount', 'currency', 'notes'];

// Fields the planner can set on an assignment. vendorId is fixed after creation.
function assignmentFields(body) {
  const fields = {};
  for (const field of editableFields) {
    if (body[field] === undefined) continue;
    if (field === 'agreedAmount') {
      fields[field] = Number(body[field]);
    } else {
      fields[field] = typeof body[field] === 'string' ? body[field].trim() : body[field];
    }
  }
  if (typeof fields.currency === 'string') fields.currency = fields.currency.toUpperCase();
  return fields;
}

function validateAssignmentFields(fields) {
  if (fields.serviceCategoryId && !vendorCategoryIds.includes(fields.serviceCategoryId)) {
    return 'Choose a valid service category';
  }
  if (fields.status !== undefined && !ASSIGNMENT_STATUSES.includes(fields.status)) {
    return 'Choose a valid assignment status';
  }
  if (fields.agreedAmount !== undefined && (!Number.isFinite(fields.agreedAmount) || fields.agreedAmount < 0)) {
    return 'Agreed amount must be zero or greater';
  }
  if (fields.currency !== undefined && !CURRENCIES.includes(fields.currency)) {
    return 'Choose a supported currency';
  }
  if (fields.notes !== undefined && typeof fields.notes !== 'string') return 'Notes must be text';
  return null;
}

export async function listEventVendors(userId, eventId) {
  if (!isValidId(eventId)) throw httpError('Invalid event ID');

  const event = await Event.exists({ _id: eventId, userId });
  if (!event) throw httpError('Event not found', 404);

  return EventVendor.find({ userId, eventId })
    .populate('vendorId', 'name phone email serviceCategoryIds')
    .sort({ createdAt: 1 })
    .lean();
}

export async function createEventVendor(userId, eventId, body) {
  if (!isValidId(eventId)) throw httpError('Invalid event ID');
  if (!isValidId(body.vendorId)) throw httpError('Choose a vendor');

  // Both records must belong to the logged-in planner.
  const [event, vendor] = await Promise.all([
    Event.exists({ _id: eventId, userId }),
    Vendor.findOne({ _id: body.vendorId, userId })
  ]);
  if (!event) throw httpError('Event not found', 404);
  if (!vendor) throw httpError('Vendor not found', 404);

  const fields = assignmentFields(body);
  const message = validateAssignmentFields(fields);
  if (message) throw httpError(message);

  // Default to the vendor's first category when the planner did not pick one.
  if (!fields.serviceCategoryId && vendor.serviceCategoryIds.length) {
    fields.serviceCategoryId = vendor.serviceCategoryIds[0];
  }

  if (await EventVendor.exists({ userId, eventId, vendorId: vendor._id })) {
    throw httpError('This vendor is already assigned to the event', 409);
  }

  const assignment = await EventVendor.create({
    userId,
    eventId,
    vendorId: vendor._id,
    ...fields
  });
  await assignment.populate('vendorId', 'name phone email serviceCategoryIds');
  return assignment;
}

export async function updateEventVendor(userId, eventId, assignmentId, body) {
  if (!isValidId(eventId) || !isValidId(assignmentId)) throw httpError('Invalid event or assignment ID');

  const fields = assignmentFields(body);
  const message = validateAssignmentFields(fields);
  if (message) throw httpError(message);
  if (!Object.keys(fields).length) throw httpError('Provide at least one field to update');

  const assignment = await EventVendor.findOneAndUpdate(
    { _id: assignmentId, eventId, userId },
    { $set: fields },
    { new: true, runValidators: true }
  ).populate('vendorId', 'name phone email serviceCategoryIds');

  if (!assignment) throw httpError('Assignment not found', 404);
  return assignment;
}

export async function deleteEventVendor(userId, eventId, assignmentId) {
  if (!isValidId(eventId) || !isValidId(assignmentId)) throw httpError('Invalid event or assignment ID');

  const assignment = await EventVendor.findOneAndDelete({ _id: assignmentId, eventId, userId });
  if (!assignment) throw httpError('Assignment not found', 404);
  return assignment;
}
