import mongoose from 'mongoose';
import Client from '../models/Client.js';

const editableFields = ['name', 'phone', 'email', 'address', 'notes', 'status'];
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^\+[1-9]\d{0,3}\d{10}$/;
const clientStatuses = ['New', 'Contacted', 'Booked'];

function clientFields(body) {
  return Object.fromEntries(editableFields
    .filter((field) => body[field] !== undefined)
    .map((field) => [field, typeof body[field] === 'string' ? body[field].trim() : body[field]]));
}

function normalizePhone(phone) {
  return typeof phone === 'string' ? phone.replace(/[\s().-]/g, '') : phone;
}

function validateClientFields(fields, creating = false) {
  if (creating || fields.name !== undefined) {
    if (typeof fields.name !== 'string' || !fields.name) return 'Client name is required';
  }
  if (creating || fields.phone !== undefined) {
    fields.phone = normalizePhone(fields.phone);
    if (typeof fields.phone !== 'string' || !fields.phone) return 'Client phone is required';
    if (!phonePattern.test(fields.phone)) return 'Enter a valid phone number with country code, such as +919876543210';
  }
  if (fields.email !== undefined && fields.email && !emailPattern.test(fields.email)) {
    return 'Enter a valid email address';
  }
  if (fields.status !== undefined && !clientStatuses.includes(fields.status)) {
    return 'Choose a valid client status';
  }
  return null;
}

function validId(id) {
  return mongoose.isValidObjectId(id);
}

export async function createClient(req, res, next) {
  try {
    const fields = clientFields(req.body);
    const validationMessage = validateClientFields(fields, true);
    if (validationMessage) {
      return res.status(400).json({ success: false, data: null, message: validationMessage });
    }
    const client = await Client.create({ ...fields, plannerName: req.user.name, userId: req.user._id });
    return res.status(201).json({ success: true, data: { client }, message: 'Lead captured successfully' });
  } catch (error) { return next(error); }
}

export async function listClients(req, res, next) {
  try {
    if (req.query.status && !clientStatuses.includes(req.query.status)) {
      return res.status(400).json({ success: false, data: null, message: 'Choose a valid client status filter' });
    }
    const filter = { userId: req.user._id };
    const search = req.query.search?.trim();
    if (search) {
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const match = new RegExp(escapedSearch, 'i');
      filter.$or = [{ name: match }, { phone: match }, { email: match }];
    }
    if (req.query.status) filter.status = req.query.status;
    const clients = await Client.find(filter).sort({ createdAt: -1 });
    return res.json({ success: true, data: { clients }, message: 'Clients loaded successfully' });
  } catch (error) { return next(error); }
}

export async function getClient(req, res, next) {
  try {
    if (!validId(req.params.id)) {
      return res.status(400).json({ success: false, data: null, message: 'Invalid client ID' });
    }
    const client = await Client.findOne({ _id: req.params.id, userId: req.user._id });
    if (!client) return res.status(404).json({ success: false, data: null, message: 'Client not found' });
    return res.json({ success: true, data: { client }, message: 'Client loaded successfully' });
  } catch (error) { return next(error); }
}

export async function updateClient(req, res, next) {
  try {
    if (!validId(req.params.id)) {
      return res.status(400).json({ success: false, data: null, message: 'Invalid client ID' });
    }
    const fields = clientFields(req.body);
    const validationMessage = validateClientFields(fields);
    if (validationMessage) {
      return res.status(400).json({ success: false, data: null, message: validationMessage });
    }
    if (!Object.keys(fields).length) {
      return res.status(400).json({ success: false, data: null, message: 'Provide at least one field to update' });
    }
    fields.plannerName = req.user.name;
    const client = await Client.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { $set: fields },
      { new: true, runValidators: true }
    );
    if (!client) return res.status(404).json({ success: false, data: null, message: 'Client not found' });
    return res.json({ success: true, data: { client }, message: 'Client updated successfully' });
  } catch (error) { return next(error); }
}

export async function deleteClient(req, res, next) {
  try {
    if (!validId(req.params.id)) {
      return res.status(400).json({ success: false, data: null, message: 'Invalid client ID' });
    }
    const client = await Client.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!client) return res.status(404).json({ success: false, data: null, message: 'Client not found' });
    return res.json({ success: true, data: { client }, message: 'Client deleted successfully' });
  } catch (error) { return next(error); }
}
