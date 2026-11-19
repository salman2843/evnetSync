import mongoose from 'mongoose';
import { CLIENT_SOURCES, CLIENT_STATUSES, EMAIL_PATTERN, PHONE_PATTERN, PREFERRED_CONTACTS } from '../utils/validation.js';

// A client is a planner-owned contact. Email is optional: many leads arrive by phone.
const clientSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true, match: [PHONE_PATTERN, 'Enter a valid phone number with country code'] },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    default: '',
    validate: {
      validator: (value) => !value || EMAIL_PATTERN.test(value),
      message: 'Enter a valid email address'
    }
  },
  company: { type: String, trim: true, default: '', maxlength: 120 },
  // A short answer to "How did they find you?"; blank is allowed.
  source: {
    type: String,
    trim: true,
    default: '',
    validate: {
      validator: (value) => !value || CLIENT_SOURCES.includes(value),
      message: 'Choose a valid lead source'
    }
  },
  preferredContact: { type: String, enum: PREFERRED_CONTACTS, default: 'WhatsApp' },
  address: { type: String, trim: true, default: '' },
  notes: { type: String, trim: true, default: '' },
  status: { type: String, enum: CLIENT_STATUSES, default: 'New' }
}, { timestamps: true });

clientSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model('Client', clientSchema);
