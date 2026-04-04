import jwt from 'jsonwebtoken';
import { config } from './config.js';

export interface JwtPayload {
  sub: string;
  roomId?: string;
  iat?: number;
  exp?: number;
}

/**
 * Verify a JWT token and return its payload.
 * Throws if the token is invalid or expired.
 */
export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, config.jwtSecret) as JwtPayload;
}

/**
 * Issue a JWT token (useful for dev/testing; production should use a
 * separate auth service to sign tokens).
 */
export function issueToken(payload: Omit<JwtPayload, 'iat' | 'exp'>, expiresIn = '8h'): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return jwt.sign(payload as any, config.jwtSecret, { expiresIn } as any);
}
