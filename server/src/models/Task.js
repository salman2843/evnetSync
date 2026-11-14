import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  title: { type: String, required: true, trim: true, maxlength: 160 },
  dueAt: { type: Date, default: null },
  status: { type: String, enum: ['open', 'completed'], default: 'open' },
  priority: { type: String, enum: ['low', 'normal', 'high'], default: 'normal' }
}, { timestamps: true });

taskSchema.index({ userId: 1, eventId: 1, status: 1 });

export default mongoose.model('Task', taskSchema);
