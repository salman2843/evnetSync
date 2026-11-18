import mongoose from 'mongoose';
import { ACTION_STATUSES, TASK_PRIORITIES } from '../utils/validation.js';

// One piece of next work. Rule actions are regenerated from the action engine;
// manual actions are created by the planner.
const actionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', default: null },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', default: null },
  dedupeKey: { type: String, required: true },
  source: { type: String, enum: ['rule', 'manual'], default: 'manual' },
  type: { type: String, trim: true, default: 'manual' },
  title: { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, trim: true, default: '', maxlength: 1000 },
  priority: { type: String, enum: TASK_PRIORITIES, default: 'normal' },
  status: { type: String, enum: ACTION_STATUSES, default: 'open' },
  dueAt: { type: Date, default: null },
  completedAt: { type: Date, default: null }
}, { timestamps: true });

// One action per planner per rule target; regeneration upserts on this pair.
actionSchema.index({ userId: 1, dedupeKey: 1 }, { unique: true });
actionSchema.index({ userId: 1, status: 1, dueAt: 1 });

export default mongoose.model('ActionItem', actionSchema);
