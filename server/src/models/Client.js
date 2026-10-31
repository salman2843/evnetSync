import mongoose from 'mongoose';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^\+[1-9]\d{0,3}\d{10}$/;
const clientStatuses = ['New', 'Contacted', 'Booked'];

const clientSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  plannerName: { type: String, trim: true, default: '' },
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true, match: [phonePattern, 'Enter a valid phone number with country code'] },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    default: '',
    validate: { validator: (value) => !value || emailPattern.test(value), message: 'Enter a valid email address' }
  },
  address: { type: String, trim: true, default: '' },
  notes: { type: String, trim: true, default: '' },
  status: { type: String, enum: clientStatuses, default: 'New' },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Client', clientSchema);
