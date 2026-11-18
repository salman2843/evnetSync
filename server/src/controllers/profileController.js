import asyncHandler from '../utils/asyncHandler.js';
import { sendCreated, sendError, sendSuccess } from '../utils/apiResponse.js';
import { MIME_EXTENSIONS, detectImageExtension } from '../middleware/upload.js';
import { saveFile, removeFile } from '../services/storageService.js';
import {
  changePlannerPassword,
  clearBusinessLogo,
  setBusinessLogo,
  updatePlannerProfile
} from '../services/profileService.js';

export const updateProfile = asyncHandler(async (req, res) => {
  const user = await updatePlannerProfile(req.user._id, req.body);
  return sendSuccess(res, { user }, 'Profile updated successfully');
});

export const changePassword = asyncHandler(async (req, res) => {
  const data = await changePlannerPassword(req.user._id, req.body);
  return sendSuccess(res, data, 'Password updated successfully');
});

export const uploadLogo = asyncHandler(async (req, res) => {
  if (!req.file) return sendError(res, 'Choose an image to upload');

  // Compare the real file signature with the declared MIME type.
  const extension = detectImageExtension(req.file.buffer);
  if (!extension) return sendError(res, 'Upload a valid PNG, JPEG, or WebP image');
  if (MIME_EXTENSIONS[req.file.mimetype] !== extension) {
    return sendError(res, 'The file content does not match its type');
  }

  let saved;
  try {
    saved = await saveFile(req.file.buffer, {
      folder: 'logos',
      extension,
      prefix: String(req.user._id)
    });
    const user = await setBusinessLogo(req.user._id, {
      ...saved,
      mimeType: req.file.mimetype
    });
    return sendCreated(res, { user }, 'Business logo uploaded');
  } catch (error) {
    // If the database write failed, do not leave an orphan file on disk.
    if (saved) await removeFile(saved.path).catch(() => {});
    throw error;
  }
});

export const deleteLogo = asyncHandler(async (req, res) => {
  const user = await clearBusinessLogo(req.user._id);
  return sendSuccess(res, { user }, 'Business logo removed');
});
