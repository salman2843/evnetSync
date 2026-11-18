import { config } from '../config/env.js';

export function notFound(req, _res, next) {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
}

// Turns Mongoose / JWT / upload errors into one predictable JSON error shape.
export function errorHandler(error, _req, res, _next) {
  let status = error.statusCode || 500;
  let message = error.message || 'Something went wrong';

  if (error.name === 'ValidationError') {
    // First schema validation message, e.g. "Enter a valid phone number with country code".
    status = 400;
    message = Object.values(error.errors)[0]?.message || 'Validation failed';
  } else if (error.name === 'CastError') {
    status = 400;
    message = `Invalid value for ${error.path}`;
  } else if (error.code === 11000) {
    status = 409;
    const keyFields = Object.keys(error.keyPattern || error.keyValue || {});
    const field = keyFields[0];
    if (field === 'email') {
      message = 'An account with this email already exists';
    } else if (keyFields.includes('eventId') && keyFields.includes('vendorId')) {
      message = 'This vendor is already assigned to this event';
    } else {
      message = `${field || 'Record'} already exists`;
    }
  } else if (error.code === 'LIMIT_FILE_SIZE') {
    status = 400;
    message = 'Image must be 2 MB or smaller';
  } else if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    status = 400;
    message = 'Upload a single image in the "logo" field';
  }

  if (status >= 500) {
    // Keep the stack in the server log, but never leak internals to the client in production.
    console.error(error);
    if (config.isProduction) message = 'Something went wrong. Please try again.';
  }

  return res.status(status).json({ success: false, data: null, message });
}
