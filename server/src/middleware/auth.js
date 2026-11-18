import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { config } from '../config/env.js';
import asyncHandler from '../utils/asyncHandler.js';
import httpError from '../utils/httpError.js';

// Verifies the Bearer token and loads the logged-in user onto req.user.
export default asyncHandler(async (req, _res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization?.startsWith('Bearer ')) throw httpError('Authentication required', 401);
  if (!config.jwtSecret) throw new Error('JWT_SECRET is not configured');

  let payload;
  try {
    payload = jwt.verify(authorization.slice(7), config.jwtSecret);
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      throw httpError('Your session has expired. Please log in again.', 401);
    }
    throw error;
  }

  const user = await User.findById(payload.id);
  if (!user) throw httpError('User account no longer exists', 401);

  req.user = user;
  next();
});
