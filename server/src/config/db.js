import mongoose from 'mongoose';
import { config } from './env.js';

export default async function connectDB() {
  if (!config.mongoUri) throw new Error('MONGO_URI is not configured');
  await mongoose.connect(config.mongoUri);
  console.log('Connected to MongoDB');
}
