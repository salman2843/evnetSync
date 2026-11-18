import rateLimit from 'express-rate-limit';

// Slows down password guessing on register/login: 20 attempts per IP per 15 minutes.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    data: null,
    message: 'Too many attempts. Please wait 15 minutes and try again.'
  }
});
