/**
 * JWT utility functions for signing and verifying tokens.
 */
import jwt from 'jsonwebtoken';
import config from '../config';

/** JWT payload structure. */
export interface JwtPayload {
  userId: number;
  roleId: number;
  username: string;
}

/**
 * Signs a JWT token with the given payload.
 * @param payload - The data to encode in the token.
 * @returns The signed JWT string.
 */
export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  } as jwt.SignOptions);
}

/**
 * Verifies a JWT token and returns the decoded payload.
 * @param token - The JWT string to verify.
 * @returns The decoded payload or null if invalid.
 */
export function verifyToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
    return decoded;
  } catch {
    return null;
  }
}
