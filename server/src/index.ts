import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { errorHandler } from './middleware/error-handler.js';
import { apiLimiter } from './middleware/rate-limiter.js';
import healthRouter from './routes/health.route.js';
import parseRouter from './routes/parse.route.js';
import routesRouter from './routes/routes.route.js';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: env.CLIENT_ORIGIN,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));

// Body parsing
app.use(express.json({ limit: '10kb' }));

// Rate limiting
app.use('/api', apiLimiter);

// Routes
app.use('/api', healthRouter);
app.use('/api', parseRouter);
app.use('/api', routesRouter);

// Error handling
app.use(errorHandler);

app.listen(env.PORT, () => {
  logger.info(`Serout server running on port ${env.PORT} [${env.NODE_ENV}]`);
  logger.info(`Solana cluster: ${env.SOLANA_CLUSTER}`);
});

export default app;
