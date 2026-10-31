import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { eventTypeIds } from '../config/eventTypeCatalog.js';

const plannerProfileSchema = new mongoose.Schema({
  eventTypeIds: { type: [{ type: String, enum: eventTypeIds }], default: [] },
  onboardingCompletedAt: { type: Date, default: null },
  timeZone: { type: String, trim: true, default: '' },
  currency: { type: String, trim: true, uppercase: true, default: '' }
}, { _id: false });

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, select: false },
  businessName: { type: String, trim: true, default: '' },
  plannerProfile: { type: plannerProfileSchema, default: () => ({}) },
  createdAt: { type: Date, default: Date.now }
});

userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = function comparePassword(password) {
  return bcrypt.compare(password, this.password);
};

export default mongoose.model('User', userSchema);
