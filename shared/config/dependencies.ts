import { PrismaClient } from '../../lib/generated/prisma';
import { UserRepositoryPrisma } from '../../core/user/infrastructure/user.repository.prisma';
import { GetUsersUseCase } from '../../core/user/application/get-users.usecase';
import { GetUserByIdUseCase } from '../../core/user/application/get-user-by-id.usecase';
import { CreateUserUseCase } from '../../core/user/application/create-user.usecase';
import { AuthMiddleware } from '../middlewares/auth.middleware';
import { RequestProcessor } from '../middlewares/request-handler.middleware';
import { Cache } from '../cache/cache.service';

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
  private _authMiddleware: AuthMiddleware | null = null;
  private _getUsersUseCase: GetUsersUseCase | null = null;
  private _getUserByIdUseCase: GetUserByIdUseCase | null = null;
  private _createUserUseCase: CreateUserUseCase | null = null;

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
   * Optimized authentication middleware - O(1) with caching
   */
  get authMiddleware(): AuthMiddleware {
    if (!this._authMiddleware) {
      this._authMiddleware = new AuthMiddleware(this.userRepository);
    }
    return this._authMiddleware;
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

  /**
   * High-performance endpoint factories - O(1) creation
   */
  createAuthenticatedEndpoint(
    methods: string[] = ['GET'], 
    allowedRoles?: string[]
  ) {
    return RequestProcessor.createAuthenticatedEndpoint(
      this.authMiddleware, 
      methods, 
      allowedRoles
    );
  }

  createPublicEndpoint(methods: string[] = ['POST']) {
    return RequestProcessor.createPublicEndpoint(this.authMiddleware, methods);
  }

  /**
   * Get cache instance for performance monitoring
   */
  get cache() {
    return Cache;
  }

  /**
   * Cleanup method for graceful shutdown with cache cleanup
   */
  async cleanup(): Promise<void> {
    if (this._prisma) {
      await this._prisma.$disconnect();
    }
    // Clean expired cache entries
    Cache.cleanup();
  }
}

// Export singleton instance for ultra-fast access
export const Dependencies = DependencyContainer.getInstance();

// Export types for better IDE support
export type { AuthMiddleware } from '../middlewares/auth.middleware';
export type { RequestProcessor } from '../middlewares/request-handler.middleware';
export type { UserRepositoryPrisma } from '../../core/user/infrastructure/user.repository.prisma'; 