import User from '../models/User.js';
import httpError from '../utils/httpError.js';
import { isSupportedCurrency, isValidTimeZone } from '../utils/validation.js';
import { PASSWORD_MIN_LENGTH, getPublicUser, issueToken } from './authService.js';
import { removeFile } from './storageService.js';

// Updates the account fields a planner is allowed to change.
export async function updatePlannerProfile(userId, body) {
  const updates = {};

  if (body.name !== undefined) {
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    if (!name) throw httpError('Name is required');
    if (name.length > 80) throw httpError('Name must be 80 characters or fewer');
    updates.name = name;
  }

  if (body.businessName !== undefined) {
    const businessName = typeof body.businessName === 'string' ? body.businessName.trim() : '';
    if (businessName.length > 120) throw httpError('Business name must be 120 characters or fewer');

    // A logo belongs to a business, so the name cannot disappear while the
    // uploaded file is still attached. The planner removes the logo first.
    if (!businessName) {
      const current = await User.findById(userId).select('businessLogo.path');
      if (!current) throw httpError('Planner account not found', 404);
      if (current.businessLogo?.path) {
        throw httpError('Remove your business logo before clearing the business name', 409);
      }
    }

    updates.businessName = businessName;
  }

  if (body.timeZone !== undefined) {
    const timeZone = String(body.timeZone).trim();
    if (timeZone && !isValidTimeZone(timeZone)) throw httpError('Choose a valid time zone, such as Asia/Kolkata');
    updates['plannerProfile.timeZone'] = timeZone;
  }

  if (body.currency !== undefined) {
    const currency = String(body.currency).trim().toUpperCase();
    if (currency && !isSupportedCurrency(currency)) throw httpError('Choose a supported currency');
    updates['plannerProfile.currency'] = currency;
  }

  if (!Object.keys(updates).length) throw httpError('Provide at least one field to update');

  const user = await User.findByIdAndUpdate(userId, { $set: updates }, { new: true, runValidators: true });
  if (!user) throw httpError('Planner account not found', 404);
  return getPublicUser(user);
}

// Changes the password and returns a fresh token so this session stays logged in.
export async function changePlannerPassword(userId, body) {
  const { currentPassword, newPassword } = body;

  if (typeof currentPassword !== 'string' || !currentPassword) throw httpError('Current password is required');
  if (typeof newPassword !== 'string' || !newPassword) throw httpError('New password is required');
  if (newPassword.length < PASSWORD_MIN_LENGTH) {
    throw httpError(`Password must be at least ${PASSWORD_MIN_LENGTH} characters`);
  }

  const user = await User.findById(userId).select('+password');
  if (!user) throw httpError('Planner account not found', 404);

  if (!await user.comparePassword(currentPassword)) throw httpError('Current password is incorrect', 401);
  if (await user.comparePassword(newPassword)) {
    throw httpError('New password must be different from the current password');
  }

  user.password = newPassword;
  user.passwordChangedAt = new Date();
  await user.save();

  return { user: getPublicUser(user), token: issueToken(user._id) };
}

// Stores the new logo path and removes the previous file from disk.
export async function setBusinessLogo(userId, file) {
  const user = await User.findById(userId);
  if (!user) throw httpError('Planner account not found', 404);

  // Uploading is unlocked by the business name. A planner who registered
  // without one gets the logo controls only after saving a name in Settings.
  if (!user.businessName?.trim()) {
    throw httpError('Add a business name before uploading a logo', 409);
  }

  const oldPath = user.businessLogo?.path;
  user.businessLogo = {
    path: file.path,
    mimeType: file.mimeType,
    size: file.size,
    uploadedAt: new Date()
  };
  await user.save();

  if (oldPath && oldPath !== file.path) {
    try {
      await removeFile(oldPath);
    } catch (error) {
      // The new logo is already saved; log the cleanup problem instead of failing the request.
      console.error('Could not delete the previous logo:', error.message);
    }
  }

  return getPublicUser(user);
}

// Clears the logo field and deletes the file. Safe to call when no logo exists.
export async function clearBusinessLogo(userId) {
  const user = await User.findById(userId);
  if (!user) throw httpError('Planner account not found', 404);

  const oldPath = user.businessLogo?.path;
  user.businessLogo = null;
  await user.save();

  if (oldPath) {
    try {
      await removeFile(oldPath);
    } catch (error) {
      console.error('Could not delete the logo file:', error.message);
    }
  }

  return getPublicUser(user);
}
