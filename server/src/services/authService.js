import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { eventTypeIds } from '../config/eventTypeCatalog.js';

function createToken(userId) {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not configured');
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    businessName: user.businessName,
    plannerProfile: user.plannerProfile || { eventTypeIds: [], onboardingCompletedAt: null, timeZone: '', currency: '' },
    createdAt: user.createdAt
  };
}

export async function savePlannerProfile(userId, profile) {
  const updates = {};
  if (profile.eventTypeIds !== undefined) {
    if (!Array.isArray(profile.eventTypeIds)) {
      const error = new Error('Event type preferences must be a list');
      error.statusCode = 400;
      throw error;
    }
    const invalidTypes = profile.eventTypeIds.filter((id) => !eventTypeIds.includes(id));
    if (invalidTypes.length) {
      const error = new Error(`Unknown event type: ${invalidTypes[0]}`);
      error.statusCode = 400;
      throw error;
    }
    updates['plannerProfile.eventTypeIds'] = [...new Set(profile.eventTypeIds)];
  }
  if (profile.timeZone !== undefined) updates['plannerProfile.timeZone'] = String(profile.timeZone).trim();
  if (profile.currency !== undefined) updates['plannerProfile.currency'] = String(profile.currency).trim().toUpperCase();

  // Mark setup complete once; later settings edits do not reset the completion date.
  if (profile.completeOnboarding === true && !userId.plannerProfile?.onboardingCompletedAt) {
    updates['plannerProfile.onboardingCompletedAt'] = new Date();
  }

  const user = await User.findOneAndUpdate({ _id: userId._id }, { $set: updates }, { new: true, runValidators: true });
  if (!user) {
    const error = new Error('Planner account not found');
    error.statusCode = 404;
    throw error;
  }
  return publicUser(user);
}

export async function registerUser({ name, email, password, businessName }) {
  if (!name || !email || !password) {
    const error = new Error('Name, email, and password are required');
    error.statusCode = 400;
    throw error;
  }
  if (await User.findOne({ email: email.toLowerCase().trim() })) {
    const error = new Error('An account with this email already exists');
    error.statusCode = 409;
    throw error;
  }
  const user = await User.create({ name, email, password, businessName });
  return { user: publicUser(user), token: createToken(user._id) };
}

export async function loginUser({ email, password }) {
  if (!email || !password) {
    const error = new Error('Email and password are required');
    error.statusCode = 400;
    throw error;
  }
  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }
  return { user: publicUser(user), token: createToken(user._id) };
}

export function getPublicUser(user) {
  return publicUser(user);
}
