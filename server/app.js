import express from 'express';
import cors from 'cors';
import authRoutes from './src/routes/authRoutes.js';
import { notFound, errorHandler } from './src/middleware/errorHandler.js';

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok' }, message: 'EventSync API is healthy' });
});
app.use('/api/auth', authRoutes);
app.use(notFound);
app.use(errorHandler);

export default app;
