import mongoose from 'mongoose';

const eventStatuses = ['inquiry', 'planning', 'confirmed', 'completed', 'cancelled'];

const eventSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  title: { type: String, required: true, trim: true, maxlength: 120 },
  eventTypeId: { type: String, required: true, trim: true },
  subEventTypeId: { type: String, trim: true, default: '' },
  surpriseFor: { type: String, trim: true, default: '', maxlength: 120 },
  status: { type: String, enum: eventStatuses, default: 'inquiry' },
  startAt: { type: Date, required: true },
  budget: {
    amount: { type: Number, min: 0, default: 0 },
    spent: { type: Number, min: 0, default: 0 },
    currency: { type: String, trim: true, default: 'INR', enum: ['INR', 'USD', 'EUR', 'GBP'] }
  },
  notes: { type: String, trim: true, default: '', maxlength: 2000 }
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

eventSchema.virtual('tasks', { ref: 'Task', localField: '_id', foreignField: 'eventId' });

eventSchema.index({ userId: 1, startAt: 1 });
eventSchema.index({ userId: 1, status: 1, startAt: 1 });
eventSchema.index({ userId: 1, clientId: 1 });

export default mongoose.model('Event', eventSchema);
