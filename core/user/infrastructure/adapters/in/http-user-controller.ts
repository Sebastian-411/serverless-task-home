import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { UserControllerPort } from '../../../domain/ports/in/user-controller.port';
import type { CreateUserUseCase } from '../../../application/create-user.usecase';
import type { GetUsersUseCase } from '../../../application/get-users.usecase';
import type { GetUserByIdUseCase } from '../../../application/get-user-by-id.usecase';
import type { UpdateUserUseCase } from '../../../application/update-user.usecase';
import type { DeleteUserUseCase } from '../../../application/delete-user.usecase';
import type { ChangeUserRoleUseCase } from '../../../application/change-user-role.usecase';
import { validateEmail, validatePassword, validateLength } from '../../../../common/config/middlewares/validation.middleware';
import { handleError } from '../../../../common/config/middlewares/error-handler.middleware';
import { authenticate } from '../../../../common/config/middlewares/auth.middleware';

export class HttpUserController implements UserControllerPort {
  constructor(
    private createUserUseCase: CreateUserUseCase,
    private getUsersUseCase: GetUsersUseCase,
    private getUserByIdUseCase: GetUserByIdUseCase,
    private updateUserUseCase: UpdateUserUseCase,
    private deleteUserUseCase: DeleteUserUseCase,
    private changeUserRoleUseCase: ChangeUserRoleUseCase
  ) {}

  async getUsers(req: VercelRequest, res: VercelResponse): Promise<void> {
    try {
      // Step 1: Method validation
      if (req.method !== 'GET') {
        res.status(405).json({
          error: 'Method not allowed',
          message: 'Only GET method is allowed'
        });
        return;
      }

      // Step 2: Authentication
      const authContext = await authenticate(req, res);

      // Step 3: Parse pagination parameters
      const page = parseInt(req.query?.page as string) || 1;
      const limit = parseInt(req.query?.limit as string) || 10;
      
      // Step 4: Validate pagination parameters
      if (page < 1 || page > 1000) {
        res.status(400).json({
          error: 'Validation error',
          message: 'Page must be between 1 and 1000'
        });
        return;
      }
      
      if (limit < 1 || limit > 100) {
        res.status(400).json({
          error: 'Validation error',
          message: 'Limit must be between 1 and 100'
        });
        return;
      }
      
      // Step 5: Execute use case - all business logic is handled there
      const result = await this.getUsersUseCase.execute(authContext, { page, limit });
      
      // Step 6: Success response
      res.status(200).json({
        data: result.users,
        message: 'Users retrieved successfully',
        meta: { 
          count: result.users.length,
          total: result.total,
          page,
          limit,
          totalPages: Math.ceil(result.total / limit)
        }
      });
    } catch (error) {
      handleError(error as Error, req, res);
    }
  }

  async createUser(req: VercelRequest, res: VercelResponse): Promise<void> {
    try {
      // Step 1: Method validation
      if (req.method !== 'POST') {
        res.status(405).json({
          error: 'Method not allowed',
          message: 'Only POST method is allowed'
        });
        return;
      }

      // Step 2: Authentication
      const authContext = await authenticate(req, res);

      // Step 3: Body validation
      const { name, email, password, phoneNumber, role, address } = req.body;
      
      if (!name || !validateLength(name, 1, 100)) {
        res.status(400).json({
          error: 'Validation error',
          message: 'Name is required and must be between 1 and 100 characters'
        });
        return;
      }
      
      if (!email || !validateEmail(email)) {
        res.status(400).json({
          error: 'Validation error',
          message: 'Valid email is required'
        });
        return;
      }
      
      if (!password || !validatePassword(password)) {
        res.status(400).json({
          error: 'Validation error',
          message: 'Password must be at least 8 characters with uppercase, lowercase, and number'
        });
        return;
      }
      
      if (!phoneNumber || !validateLength(phoneNumber, 10, 20)) {
        res.status(400).json({
          error: 'Validation error',
          message: 'Phone number is required and must be between 10 and 20 characters'
        });
        return;
      }
      
      if (role && !['admin', 'user'].includes(role.toLowerCase().trim())) {
        res.status(400).json({
          error: 'Validation error',
          message: 'Role must be either "admin" or "user"'
        });
        return;
      }

      // Step 4: Execute use case - all business logic is handled there
      const user = await this.createUserUseCase.execute(
        { name, email, password, phoneNumber, role: role || 'user', address }, 
        authContext
      );
      
      // Step 5: Success response
      res.status(201).json({
        success: true,
        data: user,
        message: 'User created successfully'
      });

    } catch (error) {
      handleError(error as Error, req, res);
    }
  }

  async getUserById(req: VercelRequest, res: VercelResponse): Promise<void> {
    try {
      // Step 1: Method validation
      if (req.method !== 'GET') {
        res.status(405).json({
          error: 'Method not allowed',
          message: 'Only GET method is allowed'
        });
        return;
      }

      // Step 2: Authentication
      const authContext = await authenticate(req, res);

      // Step 3: Get user ID from URL
      const userId = req.query?.id as string;
      if (!userId) {
        res.status(400).json({
          error: 'Validation error',
          message: 'User ID is required'
        });
        return;
      }

      // Step 4: Execute use case - all business logic is handled there
      const user = await this.getUserByIdUseCase.execute({ id: userId }, authContext);
      
      // Step 5: Success response
      res.status(200).json({
        data: user,
        message: 'User retrieved successfully'
      });

    } catch (error) {
      handleError(error as Error, req, res);
    }
  }

  async updateUser(req: VercelRequest, res: VercelResponse): Promise<void> {
    try {
      // Step 1: Method validation
      if (req.method !== 'PUT' && req.method !== 'PATCH') {
        res.status(405).json({
          error: 'Method not allowed',
          message: 'Only PUT and PATCH methods are allowed'
        });
        return;
      }

      // Step 2: Authentication
      const authContext = await authenticate(req, res);

      // Step 3: Get user ID from URL
      const userId = req.query?.id as string;
      if (!userId) {
        res.status(400).json({
          error: 'Validation error',
          message: 'User ID is required'
        });
        return;
      }

      // Step 4: Body validation
      const { name, email, phoneNumber, role } = req.body;
      
      if (name && !validateLength(name, 1, 100)) {
        res.status(400).json({
          error: 'Validation error',
          message: 'Name must be between 1 and 100 characters'
        });
        return;
      }
      
      if (email && !validateEmail(email)) {
        res.status(400).json({
          error: 'Validation error',
          message: 'Valid email is required'
        });
        return;
      }
      
      if (phoneNumber && !validateLength(phoneNumber, 10, 20)) {
        res.status(400).json({
          error: 'Validation error',
          message: 'Phone number must be between 10 and 20 characters'
        });
        return;
      }
      
      if (role && !['admin', 'user'].includes(role.toLowerCase().trim())) {
        res.status(400).json({
          error: 'Validation error',
          message: 'Role must be either "admin" or "user"'
        });
        return;
      }

      // Step 5: Execute use case - all business logic is handled there
      const updatedUser = await this.updateUserUseCase.execute(
        { id: userId, name, email, phoneNumber, role },
        authContext
      );
      
      // Step 6: Success response
      res.status(200).json({
        data: updatedUser,
        message: 'User updated successfully'
      });

    } catch (error) {
      handleError(error as Error, req, res);
    }
  }

  async deleteUser(req: VercelRequest, res: VercelResponse): Promise<void> {
    try {
      // Step 1: Method validation
      if (req.method !== 'DELETE') {
        res.status(405).json({
          error: 'Method not allowed',
          message: 'Only DELETE method is allowed'
        });
        return;
      }

      // Step 2: Authentication
      const authContext = await authenticate(req, res);

      // Step 3: Get user ID from URL
      const userId = req.query?.id as string;
      if (!userId) {
        res.status(400).json({
          error: 'Validation error',
          message: 'User ID is required'
        });
        return;
      }

      // Step 4: Execute use case - all business logic is handled there
      await this.deleteUserUseCase.execute({ id: userId }, authContext);
      
      // Step 5: Success response
      res.status(200).json({
        message: 'User deleted successfully'
      });

    } catch (error) {
      handleError(error as Error, req, res);
    }
  }

  async changeUserRole(req: VercelRequest, res: VercelResponse): Promise<void> {
    try {
      // Step 1: Method validation
      if (req.method !== 'PATCH') {
        res.status(405).json({
          error: 'Method not allowed',
          message: 'Only PATCH method is allowed'
        });
        return;
      }

      // Step 2: Authentication
      const authContext = await authenticate(req, res);

      // Step 3: Get user ID from URL
      const userId = req.query?.id as string;
      if (!userId) {
        res.status(400).json({
          error: 'Validation error',
          message: 'User ID is required'
        });
        return;
      }

      // Step 4: Body validation
      const { role } = req.body;
      
      if (!role || !['admin', 'user'].includes(role.toLowerCase().trim())) {
        res.status(400).json({
          error: 'Validation error',
          message: 'Role must be either "admin" or "user"'
        });
        return;
      }

      // Step 5: Execute use case - all business logic is handled there
      const updatedUser = await this.changeUserRoleUseCase.execute(
        { id: userId, role: role.toLowerCase() as 'admin' | 'user' },
        authContext
      );
      
      // Step 6: Success response
      res.status(200).json({
        data: updatedUser,
        message: 'User role changed successfully'
      });

    } catch (error) {
      handleError(error as Error, req, res);
    }
  }
} 