import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { eventTypeIds } from '../config/eventTypeCatalog.js';
import { CURRENCIES } from '../utils/validation.js';

const plannerProfileSchema = new mongoose.Schema({
  eventTypeIds: { type: [{ type: String, enum: eventTypeIds }], default: [] },
  onboardingCompletedAt: { type: Date, default: null },
  timeZone: { type: String, trim: true, default: '' },
  currency: { type: String, trim: true, uppercase: true, default: '', enum: [...CURRENCIES, ''] }
}, { _id: false });

const businessLogoSchema = new mongoose.Schema({
  path: { type: String, required: true },
  mimeType: { type: String, required: true },
  size: { type: Number, required: true, min: 0 },
  uploadedAt: { type: Date, default: Date.now }
}, { _id: false });

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, select: false },
  businessName: { type: String, trim: true, default: '' },
  businessLogo: { type: businessLogoSchema, default: null },
  plannerProfile: { type: plannerProfileSchema, default: () => ({}) },
  createdAt: { type: Date, default: Date.now },
  // Tokens issued before this moment stop working after a password change.
  passwordChangedAt: { type: Date, default: null }
});

userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = function comparePassword(password) {
  return bcrypt.compare(password, this.password);
};

export default mongoose.model('User', userSchema);
