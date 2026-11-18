// Sets test-only environment values before app.js loads dotenv.
// dotenv does not overwrite existing variables, so these values win.
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'eventsync-test-secret';
