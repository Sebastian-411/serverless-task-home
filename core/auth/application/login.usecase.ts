import type { AuthServicePort } from '../domain/ports/out/auth-service.port';
import type { UserRepositoryPort } from '../../user/domain/ports/out/user-repository.port';
import { InvalidCredentialsError, UserNotFoundError } from '../domain/auth-errors';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  token: string;
}

export class LoginUseCase {
  constructor(
    private authService: AuthServicePort,
    private userRepository: UserRepositoryPort
  ) {}

  async execute(request: LoginRequest): Promise<LoginResponse> {
    // Step 1: Authenticate with auth service
    const authUser = await this.authService.authenticateUser(
      request.email,
      request.password
    );

    if (!authUser) {
      throw new InvalidCredentialsError();
    }

    // Step 2: Get user data from repository
    const user = await this.userRepository.findByEmail(request.email);
    
    if (!user) {
      throw new UserNotFoundError(request.email);
    }

    // Step 3: Generate token (this would be handled by the auth service in a real implementation)
    const token = await this.generateToken(authUser);

    // Step 4: Return response
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role.toLowerCase()
      },
      token
    };
  }

  private async generateToken(authUser: any): Promise<string> {
    // This would typically be handled by the auth service
    // For now, we'll return a placeholder
    return `token_${authUser.id}`;
  }
} 