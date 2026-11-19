import ActionItem from '../models/ActionItem.js';
import Client from '../models/Client.js';
import Event from '../models/Event.js';
import Vendor from '../models/Vendor.js';
import { toCsv } from './csvService.js';

// Exports are a convenience, not a backup tool, so cap the rows to keep one
// request from loading a whole large account into memory.
const EXPORT_LIMIT = 5000;

const iso = (value) => (value ? new Date(value).toISOString() : '');
const list = (values) => (values || []).join('; ');

const clientColumns = [
  { label: 'Name', value: (row) => row.name },
  { label: 'Company', value: (row) => row.company },
  { label: 'Phone', value: (row) => row.phone },
  { label: 'Email', value: (row) => row.email },
  { label: 'Preferred contact', value: (row) => row.preferredContact },
  { label: 'Source', value: (row) => row.source },
  { label: 'Status', value: (row) => row.status },
  { label: 'Address', value: (row) => row.address },
  { label: 'Notes', value: (row) => row.notes },
  { label: 'Created', value: (row) => iso(row.createdAt) }
];

const eventColumns = [
  { label: 'Title', value: (row) => row.title },
  { label: 'Client', value: (row) => row.clientId?.name || '' },
  { label: 'Event type', value: (row) => row.eventTypeId },
  { label: 'Festival type', value: (row) => row.subEventTypeId },
  { label: 'Status', value: (row) => row.status },
  { label: 'Start', value: (row) => iso(row.startAt) },
  { label: 'Budget', value: (row) => row.budget?.amount ?? 0 },
  { label: 'Spent', value: (row) => row.budget?.spent ?? 0 },
  { label: 'Currency', value: (row) => row.budget?.currency || '' },
  { label: 'Notes', value: (row) => row.notes },
  { label: 'Created', value: (row) => iso(row.createdAt) }
];

const vendorColumns = [
  { label: 'Name', value: (row) => row.name },
  { label: 'Categories', value: (row) => list(row.serviceCategoryIds) },
  { label: 'Phone', value: (row) => row.phone },
  { label: 'Email', value: (row) => row.email },
  { label: 'Website', value: (row) => row.website },
  { label: 'Address', value: (row) => row.address },
  { label: 'Notes', value: (row) => row.notes },
  { label: 'Created', value: (row) => iso(row.createdAt) }
];

const actionColumns = [
  { label: 'Title', value: (row) => row.title },
  { label: 'Status', value: (row) => row.status },
  { label: 'Priority', value: (row) => row.priority },
  { label: 'Type', value: (row) => row.type },
  { label: 'Source', value: (row) => row.source },
  { label: 'Event', value: (row) => row.eventId?.title || '' },
  { label: 'Due', value: (row) => iso(row.dueAt) },
  { label: 'Completed', value: (row) => iso(row.completedAt) },
  { label: 'Created', value: (row) => iso(row.createdAt) }
];

export async function buildClientsCsv(userId) {
  const clients = await Client.find({ userId }).sort({ name: 1 }).limit(EXPORT_LIMIT).lean();
  return toCsv(clients, clientColumns);
}

export async function buildEventsCsv(userId) {
  const events = await Event.find({ userId })
    .populate('clientId', 'name')
    .sort({ startAt: 1 })
    .limit(EXPORT_LIMIT)
    .lean();
  return toCsv(events, eventColumns);
}

export async function buildVendorsCsv(userId) {
  const vendors = await Vendor.find({ userId }).sort({ name: 1 }).limit(EXPORT_LIMIT).lean();
  return toCsv(vendors, vendorColumns);
}

export async function buildActionsCsv(userId) {
  const actions = await ActionItem.find({ userId })
    .populate('eventId', 'title')
    .sort({ createdAt: -1 })
    .limit(EXPORT_LIMIT)
    .lean();
  return toCsv(actions, actionColumns);
}
