import { ChangeUserRoleUseCase } from '../../user/application/change-user-role.usecase';
import { CreateUserUseCase } from '../../user/application/create-user.usecase';
import { GetUserByIdUseCase } from '../../user/application/get-user-by-id.usecase';
import { GetUsersUseCase } from '../../user/application/get-users.usecase';
import { UpdateUserUseCase } from '../../user/application/update-user.usecase';
import { DeleteUserUseCaseImpl as DeleteUserUseCase } from '../../user/application/delete-user.usecase';
import { LoginUseCase } from '../../auth/application/login.usecase';
import { UserRepositoryPrisma } from '../../user/infrastructure/adapters/out/user-repository-prisma';
import { SupabaseAuthService } from '../../auth/infrastructure/adapters/out/supabase-auth.service';
import { HttpUserController } from '../../user/infrastructure/adapters/in/http-user-controller';
import { HttpAuthController } from '../../auth/infrastructure/adapters/in/http-auth-controller';
import { PrismaClient } from '../../../lib/generated/prisma';

/**
 * High-performance Dependency Injection Container
 * - Singleton Pattern: O(1) initialization cost
 * - Dependency Inversion: Easy to mock for testing
 * - Single Responsibility: Manages object lifecycle
 */
class DependencyContainer {
  private static instance: DependencyContainer;
  private _prisma: PrismaClient | null = null;
  private _userRepository: UserRepositoryPrisma | null = null;
  private _authService: SupabaseAuthService | null = null;
  private _getUsersUseCase: GetUsersUseCase | null = null;
  private _getUserByIdUseCase: GetUserByIdUseCase | null = null;
  private _createUserUseCase: CreateUserUseCase | null = null;
  private _updateUserUseCase: UpdateUserUseCase | null = null;
  private _deleteUserUseCase: DeleteUserUseCase | null = null;
  private _changeUserRoleUseCase: ChangeUserRoleUseCase | null = null;
  private _loginUseCase: LoginUseCase | null = null;
  private _userController: HttpUserController | null = null;
  private _authController: HttpAuthController | null = null;

  /**
   * Singleton instance - O(1) with lazy initialization
   */
  static getInstance(): DependencyContainer {
    if (!DependencyContainer.instance) {
      DependencyContainer.instance = new DependencyContainer();
    }
    return DependencyContainer.instance;
  }

  /**
   * Ultra-fast Prisma client - Singleton with optimized connection pooling
   */
  get prisma(): PrismaClient {
    if (!this._prisma) {
      this._prisma = new PrismaClient({
        // Performance optimizations
        log: process.env.NODE_ENV === 'development' ? ['error'] : [],
        errorFormat: 'minimal',
        
        // Connection pooling configuration for serverless environments
        datasources: {
          db: {
            url: process.env.DATABASE_URL
          }
        },
        
        // Optimize for serverless/edge functions
        transactionOptions: {
          maxWait: 5000, // 5 seconds max wait
          timeout: 10000, // 10 seconds timeout
        },
      });

      // Connection pooling optimization for serverless
      this._prisma.$connect().catch(console.error);
    }
    return this._prisma;
  }

  /**
   * High-performance user repository - O(1) initialization
   */
  get userRepository(): UserRepositoryPrisma {
    if (!this._userRepository) {
      this._userRepository = new UserRepositoryPrisma(this.prisma);
    }
    return this._userRepository;
  }

  /**
   * Auth service - O(1) initialization
   */
  get authService(): SupabaseAuthService {
    if (!this._authService) {
      this._authService = new SupabaseAuthService({
        url: process.env.SUPABASE_URL!,
        key: process.env.SUPABASE_ANON_KEY!
      });
    }
    return this._authService;
  }

  /**
   * Fast use cases - O(1) initialization with dependency injection
   */
  get getUsersUseCase(): GetUsersUseCase {
    if (!this._getUsersUseCase) {
      this._getUsersUseCase = new GetUsersUseCase(this.userRepository);
    }
    return this._getUsersUseCase;
  }

  get getUserByIdUseCase(): GetUserByIdUseCase {
    if (!this._getUserByIdUseCase) {
      this._getUserByIdUseCase = new GetUserByIdUseCase(this.userRepository);
    }
    return this._getUserByIdUseCase;
  }

  get createUserUseCase(): CreateUserUseCase {
    if (!this._createUserUseCase) {
      this._createUserUseCase = new CreateUserUseCase(this.userRepository, this.authService);
    }
    return this._createUserUseCase;
  }

  get updateUserUseCase(): UpdateUserUseCase {
    if (!this._updateUserUseCase) {
      this._updateUserUseCase = new UpdateUserUseCase(this.userRepository);
    }
    return this._updateUserUseCase;
  }

  get deleteUserUseCase(): DeleteUserUseCase {
    if (!this._deleteUserUseCase) {
      this._deleteUserUseCase = new DeleteUserUseCase(this.userRepository);
    }
    return this._deleteUserUseCase;
  }

  get changeUserRoleUseCase(): ChangeUserRoleUseCase {
    if (!this._changeUserRoleUseCase) {
      this._changeUserRoleUseCase = new ChangeUserRoleUseCase(this.userRepository);
    }
    return this._changeUserRoleUseCase;
  }

  get loginUseCase(): LoginUseCase {
    if (!this._loginUseCase) {
      this._loginUseCase = new LoginUseCase(this.authService, this.userRepository);
    }
    return this._loginUseCase;
  }

  /**
   * HTTP Controllers - O(1) initialization
   */
  get userController(): HttpUserController {
    if (!this._userController) {
      this._userController = new HttpUserController(
        this.createUserUseCase,
        this.getUsersUseCase,
        this.getUserByIdUseCase,
        this.updateUserUseCase,
        this.deleteUserUseCase,
        this.changeUserRoleUseCase
      );
    }
    return this._userController;
  }

  get authController(): HttpAuthController {
    if (!this._authController) {
      this._authController = new HttpAuthController(this.loginUseCase);
    }
    return this._authController;
  }

  /**
   * Cleanup resources - O(1) with proper connection management
   */
  async cleanup(): Promise<void> {
    if (this._prisma) {
      await this._prisma.$disconnect();
      this._prisma = null;
    }
  }
}

// Export singleton instance
export const Dependencies = DependencyContainer.getInstance();

// Export types for better IDE support
export type { AuthContext } from './middlewares/auth.middleware';
export type { UserRepositoryPrisma } from '../../user/infrastructure/adapters/out/user-repository-prisma'; 