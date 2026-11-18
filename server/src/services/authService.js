import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { eventTypeIds } from '../config/eventTypeCatalog.js';
import { config } from '../config/env.js';
import httpError from '../utils/httpError.js';
import {
  EMAIL_PATTERN,
  isNonEmptyString,
  isSupportedCurrency,
  isValidTimeZone,
  normalizeEmail
} from '../utils/validation.js';

export const PASSWORD_MIN_LENGTH = 8;

// Signs a login token. Exported so a password change can issue a fresh token.
export function issueToken(userId) {
  if (!config.jwtSecret) throw new Error('JWT_SECRET is not configured');
  return jwt.sign({ id: userId }, config.jwtSecret, { expiresIn: '7d' });
}

function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    businessName: user.businessName,
    businessLogo: user.businessLogo?.path
      ? { url: user.businessLogo.path, uploadedAt: user.businessLogo.uploadedAt }
      : null,
    plannerProfile: user.plannerProfile || { eventTypeIds: [], onboardingCompletedAt: null, timeZone: '', currency: '' },
    createdAt: user.createdAt
  };
}

// `user` is the authenticated User document from the auth middleware.
export async function savePlannerProfile(user, profile) {
  const updates = {};

  if (profile.eventTypeIds !== undefined) {
    if (!Array.isArray(profile.eventTypeIds)) throw httpError('Event type preferences must be a list');
    const invalidTypes = profile.eventTypeIds.filter((id) => !eventTypeIds.includes(id));
    if (invalidTypes.length) throw httpError(`Unknown event type: ${invalidTypes[0]}`);
    updates['plannerProfile.eventTypeIds'] = [...new Set(profile.eventTypeIds)];
  }

  if (profile.timeZone !== undefined) {
    const timeZone = String(profile.timeZone).trim();
    if (timeZone && !isValidTimeZone(timeZone)) throw httpError('Choose a valid time zone, such as Asia/Kolkata');
    updates['plannerProfile.timeZone'] = timeZone;
  }

  if (profile.currency !== undefined) {
    const currency = String(profile.currency).trim().toUpperCase();
    if (currency && !isSupportedCurrency(currency)) throw httpError('Choose a supported currency');
    updates['plannerProfile.currency'] = currency;
  }

  // Mark setup complete once; later settings edits do not reset the completion date.
  if (profile.completeOnboarding === true && !user.plannerProfile?.onboardingCompletedAt) {
    updates['plannerProfile.onboardingCompletedAt'] = new Date();
  }

  const updated = await User.findByIdAndUpdate(user._id, { $set: updates }, { new: true, runValidators: true });
  if (!updated) throw httpError('Planner account not found', 404);
  return publicUser(updated);
}

export async function registerUser({ name, email, password, businessName }) {
  if (!isNonEmptyString(name) || !isNonEmptyString(email) || !isNonEmptyString(password)) {
    throw httpError('Name, email, and password are required');
  }

  const cleanName = name.trim();
  const cleanEmail = normalizeEmail(email);

  if (!EMAIL_PATTERN.test(cleanEmail)) throw httpError('Enter a valid email address');
  if (password.length < PASSWORD_MIN_LENGTH) {
    throw httpError(`Password must be at least ${PASSWORD_MIN_LENGTH} characters`);
  }
  if (await User.exists({ email: cleanEmail })) throw httpError('An account with this email already exists', 409);

  const user = await User.create({
    name: cleanName,
    email: cleanEmail,
    password,
    businessName: typeof businessName === 'string' ? businessName.trim() : ''
  });
  return { user: publicUser(user), token: issueToken(user._id) };
}

export async function loginUser({ email, password }) {
  if (!isNonEmptyString(email) || !isNonEmptyString(password)) {
    throw httpError('Email and password are required');
  }

  const user = await User.findOne({ email: normalizeEmail(email) }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw httpError('Invalid email or password', 401);
  }
  return { user: publicUser(user), token: issueToken(user._id) };
}

export function getPublicUser(user) {
  return publicUser(user);
}
