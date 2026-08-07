/**
 * Application configuration.
 * Loads and validates environment variables.
 */
import dotenv from 'dotenv';

dotenv.config();

/** Configuration object with all environment variables. */
export const config = {
  database: {
    url: process.env.DATABASE_URL || 'mysql://root:password@localhost:3306/workorder_db',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'default-dev-secret-key-change-in-production-32chars',
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  },
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
    clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  },
  security: {
    bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10),
    loginMaxAttempts: parseInt(process.env.LOGIN_MAX_ATTEMPTS || '5', 10),
    lockDurationMinutes: parseInt(process.env.LOCK_DURATION_MINUTES || '30', 10),
  },
  upload: {
    dir: process.env.UPLOAD_DIR || 'uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10),
    allowedTypes: process.env.ALLOWED_FILE_TYPES?.split(',').map((t) => t.trim()) || [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/pdf',
    ],
    maxFilesPerOrder: 20,
  },
} as const;

export default config;
