// config/env.js must load first so PORT and other settings are available.
import { config, validateEnv } from './src/config/env.js';
import mongoose from 'mongoose';
import app from './app.js';
import connectDB from './src/config/db.js';

async function start() {
  try {
    validateEnv();
    await connectDB();

    const server = app.listen(config.port, () => {
      console.log(`EventSync API listening on port ${config.port}`);
    });

    // Close the HTTP server and MongoDB connection cleanly on Ctrl+C or host shutdown.
    async function shutdown(signal) {
      console.log(`${signal} received, shutting down...`);
      server.close(async () => {
        await mongoose.connection.close();
        process.exit(0);
      });
    }
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (error) {
    console.error('Could not start EventSync API:', error.message);
    process.exit(1);
  }
}

start();
