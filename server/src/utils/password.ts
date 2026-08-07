/**
 * Password hashing and comparison utilities using bcrypt.
 */
import bcrypt from 'bcryptjs';
import config from '../config';

/**
 * Hashes a plaintext password using bcrypt.
 * @param password - The plaintext password to hash.
 * @returns The bcrypt hash string.
 */
export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, config.security.bcryptSaltRounds);
}

/**
 * Compares a plaintext password against a bcrypt hash.
 * @param password - The plaintext password to check.
 * @param hash - The bcrypt hash to compare against.
 * @returns True if the password matches the hash.
 */
export function comparePassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

/**
 * Validates password strength.
 * Must be at least 8 characters, containing at least 1 letter and 1 number.
 * @param password - The password to validate.
 * @returns True if the password meets the policy.
 */
export function validatePasswordStrength(password: string): boolean {
  const regex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;
  return regex.test(password);
}
