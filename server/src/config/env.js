// Loads server/.env exactly once, before any other module reads process.env.
// app.js imports this file first, so CORS and JWT settings are ready at startup.
import dotenv from 'dotenv';

dotenv.config();

function toList(value, fallback) {
  return String(value || fallback)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

// Getters are used so values are read when needed (tests can set env vars first).
export const config = {
  get nodeEnv() { return process.env.NODE_ENV || 'development'; },
  get isProduction() { return this.nodeEnv === 'production'; },
  get port() { return Number(process.env.PORT) || 5000; },
  get mongoUri() { return process.env.MONGO_URI || ''; },
  get jwtSecret() { return process.env.JWT_SECRET || ''; },
  get clientUrls() { return toList(process.env.CLIENT_URL, 'http://localhost:5173'); },
  get uploadDir() { return process.env.UPLOAD_DIR || 'uploads'; },
  get maxUploadBytes() { return 2 * 1024 * 1024; }
};

// Fail fast at boot with one clear message instead of a 500 on the first request.
export function validateEnv() {
  const missing = ['MONGO_URI', 'JWT_SECRET'].filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}. ` +
      'Copy server/.env.example to server/.env and fill in the values.'
    );
  }
}
