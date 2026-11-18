// Load environment variables before any other module reads process.env.
import './src/config/env.js';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { config } from './src/config/env.js';
import authRoutes from './src/routes/authRoutes.js';
import actionRoutes from './src/routes/actionRoutes.js';
import clientRoutes from './src/routes/clientRoutes.js';
import eventRoutes from './src/routes/eventRoutes.js';
import metaRoutes from './src/routes/metaRoutes.js';
import profileRoutes from './src/routes/profileRoutes.js';
import vendorRoutes from './src/routes/vendorRoutes.js';
import { uploadRoot } from './src/services/storageService.js';
import { notFound, errorHandler } from './src/middleware/errorHandler.js';

const app = express();

app.disable('x-powered-by');
app.use(helmet({
  // Allow the React app on another port to display uploaded images.
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
app.use(cors({ origin: config.clientUrls }));
app.use(express.json({ limit: '1mb' }));

// Uploaded logos use unique file names, so they can be cached safely.
app.use('/uploads', express.static(uploadRoot(), { immutable: true, maxAge: '30d' }));

app.get('/api/health', (_req, res) => {
  const databaseConnected = mongoose.connection.readyState === 1;
  res.json({
    success: true,
    data: { status: databaseConnected ? 'ok' : 'degraded', database: databaseConnected ? 'connected' : 'disconnected' },
    message: 'EventSync API is healthy'
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/actions', actionRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/meta', metaRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/vendors', vendorRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
