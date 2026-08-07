/**
 * Express application setup.
 * Configures middleware and routes in the correct order.
 */
import express, { Express } from 'express';
import 'express-async-errors'; // Patch Express 4 to forward async errors to errorHandler.
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import config from './config';
import { requestLogger } from './middleware/requestLogger';
import { notFoundHandler } from './middleware/notFound';
import { errorHandler } from './middleware/errorHandler';
import routes from './routes';

/**
 * Creates and configures the Express application.
 * Middleware order: cors → helmet → express.json → requestLogger → routes → notFound → errorHandler
 */
export function createApp(): Express {
  const app = express();

  // Security and parsing middleware (order: cors → helmet → express.json).
  app.use(
    cors({
      origin: [config.server.clientUrl, 'http://localhost:5173', 'http://localhost:80'],
      credentials: true,
    }),
  );
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'blob:'],
        },
      },
    }),
  );
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Static file serving for uploaded files (image preview thumbnails).
  app.use('/uploads', express.static(path.resolve(config.upload.dir)));

  // Request logging.
  app.use(requestLogger);

  // Health check endpoint.
  app.get('/health', (_req, res) => {
    res.status(200).json({ code: 200, message: 'ok', data: { status: 'healthy' } });
  });

  // API routes.
  app.use('/api', routes);

  // 404 handler (must be after routes).
  app.use(notFoundHandler);

  // Global error handler (must be last).
  app.use(errorHandler);

  return app;
}
