import { PrismaClient } from '../../lib/generated/prisma';
import { UserRepositoryPrisma } from '../../core/user/infrastructure/user.repository.prisma';
import { GetUsersUseCase } from '../../core/user/application/get-users.usecase';
import { GetUserByIdUseCase } from '../../core/user/application/get-user-by-id.usecase';
import { CreateUserUseCase } from '../../core/user/application/create-user.usecase';
import { ChangeUserRoleUseCase } from '../../core/user/application/change-user-role.usecase';
import { LoginUseCase } from '../../core/user/application/login.usecase';
import { authenticate, authorize, type AuthContext } from '../middlewares/auth.middleware';
import { createAuthenticatedEndpoint, createPublicEndpoint } from '../middlewares/request-handler.middleware';
import * as CacheService from '../cache/cache.service';

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
  private _getUsersUseCase: GetUsersUseCase | null = null;
  private _getUserByIdUseCase: GetUserByIdUseCase | null = null;
  private _createUserUseCase: CreateUserUseCase | null = null;
  private _changeUserRoleUseCase: ChangeUserRoleUseCase | null = null;
  private _loginUseCase: LoginUseCase | null = null;

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
      this._createUserUseCase = new CreateUserUseCase(this.userRepository);
    }
    return this._createUserUseCase;
  }

  get changeUserRoleUseCase(): ChangeUserRoleUseCase {
    if (!this._changeUserRoleUseCase) {
      this._changeUserRoleUseCase = new ChangeUserRoleUseCase(this.userRepository, this.prisma);
    }
    return this._changeUserRoleUseCase;
  }

  get loginUseCase(): LoginUseCase {
    if (!this._loginUseCase) {
      this._loginUseCase = new LoginUseCase(this.userRepository);
    }
    return this._loginUseCase;
  }

  /**
   * High-performance endpoint factories - O(1) creation
   */
  createAuthenticatedEndpoint = (
    methods: string[] = ['GET'],
    allowedRoles?: string[]
  ) => {
    return createAuthenticatedEndpoint(
      async (request, response, context) => {
        // TODO: Implement method and role validation
        return { success: true };
      },
      'resource',
      'action'
    );
  };

  createPublicEndpoint = (methods: string[] = ['POST']) => {
    return createPublicEndpoint(async (request, response, context) => {
      // TODO: Implement method validation
      return { success: true };
    });
  };

  /**
   * Get cache instance for performance monitoring
   */
  get cache() {
    return CacheService;
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
export type { AuthContext } from '../middlewares/auth.middleware';
export type { UserRepositoryPrisma } from '../../core/user/infrastructure/user.repository.prisma'; 