import mongoose from 'mongoose';
import { vendorCategoryIds } from '../config/vendorCatalog.js';
import { ASSIGNMENT_STATUSES, CURRENCIES } from '../utils/validation.js';

// One vendor booked on one event. The same vendor can be booked on many events,
// and each booking keeps its own status and price.
const eventVendorSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
  serviceCategoryId: { type: String, trim: true, default: '', enum: [...vendorCategoryIds, ''] },
  status: { type: String, enum: ASSIGNMENT_STATUSES, default: 'considering' },
  agreedAmount: { type: Number, min: 0, default: 0 },
  currency: { type: String, trim: true, uppercase: true, default: 'INR', enum: CURRENCIES },
  notes: { type: String, trim: true, default: '', maxlength: 2000 }
}, { timestamps: true });

// A vendor appears at most once per event. The service also checks this first
// so the planner gets a friendly 409 message instead of a raw database error.
eventVendorSchema.index({ userId: 1, eventId: 1, vendorId: 1 }, { unique: true });
eventVendorSchema.index({ userId: 1, eventId: 1 });
eventVendorSchema.index({ userId: 1, vendorId: 1 });

export default mongoose.model('EventVendor', eventVendorSchema);
