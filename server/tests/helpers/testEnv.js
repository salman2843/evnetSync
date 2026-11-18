// Sets test-only environment values before app.js loads dotenv.
// dotenv does not overwrite existing variables, so these values win.
import os from 'node:os';
import path from 'node:path';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'eventsync-test-secret';
// Keep uploaded test files out of server/uploads.
process.env.UPLOAD_DIR = path.join(os.tmpdir(), `eventsync-test-uploads-${process.pid}`);
