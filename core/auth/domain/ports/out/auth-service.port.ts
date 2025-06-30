export interface AuthUser {
  id: string;
  email: string;
  emailVerified?: boolean;
}

export interface AuthResult {
  user: AuthUser;
  token: string;
}

export interface AuthServicePort {
  createUser(email: string, password: string): Promise<AuthUser | null>;
  authenticateUser(email: string, password: string): Promise<AuthResult | null>;
  verifyToken(token: string): Promise<AuthUser | null>;
  resetPassword(email: string): Promise<boolean>;
  updatePassword(userId: string, newPassword: string): Promise<boolean>;
  deleteUser(userId: string): Promise<boolean>;
} 