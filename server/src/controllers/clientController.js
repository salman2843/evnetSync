import mongoose from 'mongoose';
import Client from '../models/Client.js';

const editableFields = ['name', 'phone', 'email', 'address', 'notes'];

function clientFields(body) {
  return Object.fromEntries(editableFields
    .filter((field) => body[field] !== undefined)
    .map((field) => [field, body[field]]));
}

function validateRequired(fields) {
  if (fields.name !== undefined && (typeof fields.name !== 'string' || !fields.name.trim())) return 'Client name is required';
  if (fields.phone !== undefined && (typeof fields.phone !== 'string' || !fields.phone.trim())) return 'Client phone is required';
  return null;
}

function validId(id) {
  return mongoose.isValidObjectId(id);
}

export async function createClient(req, res, next) {
  try {
    const fields = clientFields(req.body);
    if (typeof fields.name !== 'string' || !fields.name.trim()) {
      return res.status(400).json({ success: false, data: null, message: 'Client name is required' });
    }
    if (typeof fields.phone !== 'string' || !fields.phone.trim()) {
      return res.status(400).json({ success: false, data: null, message: 'Client phone is required' });
    }
    const client = await Client.create({ ...fields, userId: req.user._id });
    return res.status(201).json({ success: true, data: { client }, message: 'Client created successfully' });
  } catch (error) { return next(error); }
}

export async function listClients(req, res, next) {
  try {
    const filter = { userId: req.user._id };
    const search = req.query.search?.trim();
    if (search) {
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const match = new RegExp(escapedSearch, 'i');
      filter.$or = [{ name: match }, { phone: match }];
    }
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
    const validationMessage = validateRequired(fields);
    if (validationMessage) {
      return res.status(400).json({ success: false, data: null, message: validationMessage });
    }
    if (!Object.keys(fields).length) {
      return res.status(400).json({ success: false, data: null, message: 'Provide at least one field to update' });
    }
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
