/**
 * Server entry point.
 * Starts the Express server and connects to the database.
 */
import { createApp } from './app';
import config from './config';
import prisma from './utils/prisma';

/**
 * Starts the server.
 * Verifies database connectivity before listening for requests.
 */
async function startServer(): Promise<void> {
  const app = createApp();

  try {
    // Verify database connection.
    await prisma.$connect();
    console.log('✓ Database connected successfully');
  } catch (error) {
    console.error('✗ Failed to connect to database:', error);
    process.exit(1);
  }

  const server = app.listen(config.server.port, () => {
    console.log(`✓ Server running on http://localhost:${config.server.port}`);
    console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
  });

  // Graceful shutdown.
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully...');
    server.close(async () => {
      await prisma.$disconnect();
      console.log('Server closed.');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully...');
    server.close(async () => {
      await prisma.$disconnect();
      console.log('Server closed.');
      process.exit(0);
    });
  });
}

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
