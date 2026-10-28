import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export default async function authenticate(req, _res, next) {
  try {
    const authorization = req.headers.authorization;
    if (!authorization?.startsWith('Bearer ')) {
      const error = new Error('Authentication required');
      error.statusCode = 401;
      throw error;
    }
    if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not configured');
    const payload = jwt.verify(authorization.slice(7), process.env.JWT_SECRET);
    const user = await User.findById(payload.id);
    if (!user) {
      const error = new Error('User account no longer exists');
      error.statusCode = 401;
      throw error;
    }
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') error.statusCode = 401;
    next(error);
  }
}
