import type { UserId } from '../domain/value-objects/types';

// JWT Authentication utilities
export interface JWTPayload {
  userId: UserId;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

export function generateToken(_payload: JWTPayload): string {
  // TODO: Implement JWT token generation
  return 'mock-jwt-token';
}

export function verifyToken(_token: string): JWTPayload {
  // TODO: Implement JWT token verification
  throw new Error('JWT verification not implemented');
}

export function extractTokenFromHeader(authHeader: string): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
} 