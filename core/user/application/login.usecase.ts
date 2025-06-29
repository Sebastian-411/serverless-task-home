import { SupabaseService } from '../../../shared/auth/supabase.service';
import type { UserRepository } from '../domain/user.entity';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: 'admin' | 'user';
  };
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export class LoginUseCase {
  constructor(
    private userRepository: UserRepository
  ) {}

  async execute(request: LoginRequest): Promise<LoginResponse> {
    try {
      // Step 1: Normalize input data
      const normalizedEmail = request.email.trim().toLowerCase();
      const normalizedPassword = request.password;

      // Step 2: Authenticate with Supabase
      const loginResult = await SupabaseService.signIn(normalizedEmail, normalizedPassword);

      if (loginResult.error || !loginResult.data) {
        throw new Error('Invalid credentials');
      }

      const { user: supabaseUser, session } = loginResult.data;

      // Step 3: Get user details from database
      const userDetails = await this.userRepository.findByEmail(supabaseUser.email!);

      if (!userDetails) {
        throw new Error('User not found in database');
      }

      // Step 4: Return formatted response
      return {
        user: {
          id: userDetails.id,
          email: userDetails.email,
          name: userDetails.name,
          role: userDetails.role.toLowerCase() as 'admin' | 'user'
        },
        accessToken: session.access_token,
        refreshToken: session.refresh_token,
        expiresAt: session.expires_at
      };

    } catch (error) {
      console.error('Login error:', error);
      
      // Re-throw specific errors to preserve their messages
      if (error instanceof Error) {
        if (error.message === 'Invalid credentials' ||
            error.message === 'User not found in database') {
          throw error;
        }
      }
      
      throw new Error('Authentication failed');
    }
  }
} 