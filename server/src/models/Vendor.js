import mongoose from 'mongoose';
import { vendorCategoryIds } from '../config/vendorCatalog.js';
import { EMAIL_PATTERN, PHONE_PATTERN } from '../utils/validation.js';

// A vendor is a reusable, planner-owned directory entry. It is never shared
// between planner accounts and is not a public listing.
const vendorSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true, maxlength: 120 },
  serviceCategoryIds: { type: [{ type: String, enum: vendorCategoryIds }], default: [] },
  phone: {
    type: String,
    trim: true,
    default: '',
    validate: {
      validator: (value) => !value || PHONE_PATTERN.test(value),
      message: 'Enter a valid phone number with country code'
    }
  },
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
  website: { type: String, trim: true, default: '', maxlength: 300 },
  address: { type: String, trim: true, default: '', maxlength: 300 },
  notes: { type: String, trim: true, default: '', maxlength: 2000 }
}, { timestamps: true });

vendorSchema.index({ userId: 1, name: 1 });

export default mongoose.model('Vendor', vendorSchema);
