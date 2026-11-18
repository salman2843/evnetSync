// Load environment variables before any other module reads process.env.
import './src/config/env.js';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { config } from './src/config/env.js';
import authRoutes from './src/routes/authRoutes.js';
import clientRoutes from './src/routes/clientRoutes.js';
import eventRoutes from './src/routes/eventRoutes.js';
import { notFound, errorHandler } from './src/middleware/errorHandler.js';

const app = express();

app.disable('x-powered-by');
app.use(helmet({
  // Allow the React app on another port to display uploaded images.
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
app.use(cors({ origin: config.clientUrls }));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => {
  const databaseConnected = mongoose.connection.readyState === 1;
  res.json({
    success: true,
    data: { status: databaseConnected ? 'ok' : 'degraded', database: databaseConnected ? 'connected' : 'disconnected' },
    message: 'EventSync API is healthy'
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/events', eventRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
