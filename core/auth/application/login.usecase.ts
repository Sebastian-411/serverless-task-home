import type { AuthServicePort } from '../domain/ports/out/auth-service.port';
import type { UserRepositoryPort } from '../../user/domain/ports/out/user-repository.port';
import { InvalidCredentialsError, UserNotFoundError } from '../domain/auth-errors';

/**
 * Data Transfer Object representing the request to log in.
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Data Transfer Object representing the response from a successful login.
 */
export interface LoginResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  token: string;
}

/**
 * LoginUseCase handles the user login process within the application layer.
 * 
 * This use case adheres to hexagonal architecture by interacting only with abstract ports:
 * - `AuthServicePort`: for credential verification
 * - `UserRepositoryPort`: for retrieving domain-level user data
 * 
 * Business rules:
 * - Credentials must be verified through an external authentication service.
 * - User data must exist in the local domain repository.
 * - A valid token is returned upon successful authentication.
 */
export class LoginUseCase {
  constructor(
    private authService: AuthServicePort,
    private userRepository: UserRepositoryPort
  ) {}

  /**
   * Executes the login process with the provided credentials.
   * 
   * @param request - The login request containing email and password.
   * @returns A `LoginResponse` containing user details and an access token.
   * @throws InvalidCredentialsError - If authentication fails.
   * @throws UserNotFoundError - If the user is not found in the domain.
   */
  async execute(request: LoginRequest): Promise<LoginResponse> {
    const authResult = await this.authService.authenticateUser(
      request.email,
      request.password
    );

    if (!authResult) {
      throw new InvalidCredentialsError();
    }

    const user = await this.userRepository.findByEmail(request.email);

    if (!user) {
      throw new UserNotFoundError(request.email);
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role.toLowerCase() // Ensure role is in lowercase
      },
      token: authResult.token
    };
  }


}
