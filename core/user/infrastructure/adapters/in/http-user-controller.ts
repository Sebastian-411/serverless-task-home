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

/**
 * HttpUserController handles HTTP-level concerns for user-related operations.
 *
 * Responsibilities:
 * - HTTP method validation
 * - Authentication
 * - Input validation
 * - Delegation to respective UseCases (no business logic in the controller)
 * - Response formatting
 * 
 * All responses follow consistent structure.
 * All errors are delegated to centralized error handler.
 */
export class HttpUserController implements UserControllerPort {
  constructor(
    private createUserUseCase: CreateUserUseCase,
    private getUsersUseCase: GetUsersUseCase,
    private getUserByIdUseCase: GetUserByIdUseCase,
    private updateUserUseCase: UpdateUserUseCase,
    private deleteUserUseCase: DeleteUserUseCase,
    private changeUserRoleUseCase: ChangeUserRoleUseCase
  ) {}

  /**
   * Handles HTTP GET requests to retrieve paginated list of users.
   * Requires authentication and validates query params.
   *
   * @param {VercelRequest} req - Incoming VercelRequest with optional page and limit query.
   * @param {VercelResponse} res - VercelResponse to send paginated user data.
   * @returns {Promise<void>} Sends paginated user data or error response.
   * @throws {Error} If authentication, validation, or use case execution fails.
   */
  async getUsers(req: VercelRequest, res: VercelResponse): Promise<void> {
    console.log('[HttpUserController][getUsers] Handling GET users request', { method: req.method, query: req.query });
    try {
      if (req.method !== 'GET') {
        console.warn('[HttpUserController][getUsers] Method not allowed', { method: req.method });
        res.status(405).json({
          error: 'Method not allowed',
          message: 'Only GET method is allowed'
        });
        return;
      }

      const authContext = await authenticate(req, res);

      const page = parseInt(req.query?.page as string) || 1;
      const limit = parseInt(req.query?.limit as string) || 10;

      if (page < 1 || page > 1000) {
        console.warn('[HttpUserController][getUsers] Validation failed: Invalid page', { page });
        res.status(400).json({
          error: 'Validation error',
          message: 'Page must be between 1 and 1000'
        });
        return;
      }

      if (limit < 1 || limit > 100) {
        console.warn('[HttpUserController][getUsers] Validation failed: Invalid limit', { limit });
        res.status(400).json({
          error: 'Validation error',
          message: 'Limit must be between 1 and 100'
        });
        return;
      }

      const result = await this.getUsersUseCase.execute(authContext, { page, limit });

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
      console.log('[HttpUserController][getUsers] Users retrieved successfully', { count: result.users.length, total: result.total, page, limit });
    } catch (error) {
      console.error('[HttpUserController][getUsers] Unexpected error', { error });
      handleError(error as Error, req, res);
    }
  }

  /**
   * Handles HTTP POST requests to create a new user.
   * Requires authentication and validates request body fields.
   *
   * @param {VercelRequest} req - VercelRequest with user creation payload.
   * @param {VercelResponse} res - VercelResponse with the created user object.
   * @returns {Promise<void>} Sends created user data or error response.
   * @throws {Error} If authentication, validation, or use case execution fails.
   */
  async createUser(req: VercelRequest, res: VercelResponse): Promise<void> {
    console.log('[HttpUserController][createUser] Handling POST create user request', { method: req.method, body: req.body });
    try {
      if (req.method !== 'POST') {
        console.warn('[HttpUserController][createUser] Method not allowed', { method: req.method });
        res.status(405).json({
          error: 'Method not allowed',
          message: 'Only POST method is allowed'
        });
        return;
      }

      const authContext = await authenticate(req, res);

      const { name, email, password, phoneNumber, role, address } = req.body;

      if (!name || !validateLength(name, 1, 100)) {
        console.warn('[HttpUserController][createUser] Validation failed: Invalid name', { name });
        res.status(400).json({
          error: 'Validation error',
          message: 'Name is required and must be between 1 and 100 characters'
        });
        return;
      }

      if (!email || !validateEmail(email)) {
        console.warn('[HttpUserController][createUser] Validation failed: Invalid email', { email });
        res.status(400).json({
          error: 'Validation error',
          message: 'Valid email is required'
        });
        return;
      }

      if (!password || !validatePassword(password)) {
        console.warn('[HttpUserController][createUser] Validation failed: Invalid password');
        res.status(400).json({
          error: 'Validation error',
          message: 'Password must be at least 8 characters with uppercase, lowercase, and number'
        });
        return;
      }

      if (!phoneNumber || !validateLength(phoneNumber, 10, 20)) {
        console.warn('[HttpUserController][createUser] Validation failed: Invalid phone number', { phoneNumber });
        res.status(400).json({
          error: 'Validation error',
          message: 'Phone number is required and must be between 10 and 20 characters'
        });
        return;
      }

      if (role && !['admin', 'user'].includes(role.toLowerCase().trim())) {
        console.warn('[HttpUserController][createUser] Validation failed: Invalid role', { role });
        res.status(400).json({
          error: 'Validation error',
          message: 'Role must be either "admin" or "user"'
        });
        return;
      }

      const user = await this.createUserUseCase.execute(
        { name, email, password, phoneNumber, role: role || 'user', address },
        authContext
      );

      res.status(201).json({
        success: true,
        data: user,
        message: 'User created successfully'
      });
      console.log('[HttpUserController][createUser] User created successfully', { userId: user?.id });
    } catch (error) {
      console.error('[HttpUserController][createUser] Unexpected error', { error });
      handleError(error as Error, req, res);
    }
  }

  /**
   * Handles HTTP GET requests to retrieve a user by ID.
   * Requires authentication and ID must be passed as query param.
   *
   * @param {VercelRequest} req - VercelRequest with user ID in query string.
   * @param {VercelResponse} res - VercelResponse with single user data.
   * @returns {Promise<void>} Sends user data or error response.
   * @throws {Error} If authentication, validation, or use case execution fails.
   */
  async getUserById(req: VercelRequest, res: VercelResponse): Promise<void> {
    console.log('[HttpUserController][getUserById] Handling GET user by ID request', { method: req.method, query: req.query });
    try {
      if (req.method !== 'GET') {
        console.warn('[HttpUserController][getUserById] Method not allowed', { method: req.method });
        res.status(405).json({
          error: 'Method not allowed',
          message: 'Only GET method is allowed'
        });
        return;
      }

      const authContext = await authenticate(req, res);

      const userId = req.query?.id as string;
      if (!userId) {
        console.warn('[HttpUserController][getUserById] Validation failed: User ID is required');
        res.status(400).json({
          error: 'Validation error',
          message: 'User ID is required'
        });
        return;
      }

      const user = await this.getUserByIdUseCase.execute({ id: userId }, authContext);

      res.status(200).json({
        data: user,
        message: 'User retrieved successfully'
      });
      console.log('[HttpUserController][getUserById] User retrieved successfully', { userId });
    } catch (error) {
      console.error('[HttpUserController][getUserById] Unexpected error', { error });
      handleError(error as Error, req, res);
    }
  }

  /**
   * Handles HTTP PUT or PATCH requests to update an existing user.
   * Requires authentication and ID in query string.
   *
   * @param {VercelRequest} req - VercelRequest with partial user update payload.
   * @param {VercelResponse} res - VercelResponse with updated user object.
   * @returns {Promise<void>} Sends updated user data or error response.
   * @throws {Error} If authentication, validation, or use case execution fails.
   */
  async updateUser(req: VercelRequest, res: VercelResponse): Promise<void> {
    console.log('[HttpUserController][updateUser] Handling update user request', { method: req.method, query: req.query, body: req.body });
    try {
      if (req.method !== 'PUT' && req.method !== 'PATCH') {
        console.warn('[HttpUserController][updateUser] Method not allowed', { method: req.method });
        res.status(405).json({
          error: 'Method not allowed',
          message: 'Only PUT and PATCH methods are allowed'
        });
        return;
      }

      const authContext = await authenticate(req, res);

      const userId = req.query?.id as string;
      if (!userId) {
        console.warn('[HttpUserController][updateUser] Validation failed: User ID is required');
        res.status(400).json({
          error: 'Validation error',
          message: 'User ID is required'
        });
        return;
      }

      const { name, email, phoneNumber, role } = req.body;

      if (name && !validateLength(name, 1, 100)) {
        console.warn('[HttpUserController][updateUser] Validation failed: Invalid name', { name });
        res.status(400).json({
          error: 'Validation error',
          message: 'Name must be between 1 and 100 characters'
        });
        return;
      }

      if (email && !validateEmail(email)) {
        console.warn('[HttpUserController][updateUser] Validation failed: Invalid email', { email });
        res.status(400).json({
          error: 'Validation error',
          message: 'Valid email is required'
        });
        return;
      }

      if (phoneNumber && !validateLength(phoneNumber, 10, 20)) {
        console.warn('[HttpUserController][updateUser] Validation failed: Invalid phone number', { phoneNumber });
        res.status(400).json({
          error: 'Validation error',
          message: 'Phone number must be between 10 and 20 characters'
        });
        return;
      }

      if (role && !['admin', 'user'].includes(role.toLowerCase().trim())) {
        console.warn('[HttpUserController][updateUser] Validation failed: Invalid role', { role });
        res.status(400).json({
          error: 'Validation error',
          message: 'Role must be either "admin" or "user"'
        });
        return;
      }

      const updatedUser = await this.updateUserUseCase.execute(
        { id: userId, name, email, phoneNumber, role },
        authContext
      );

      res.status(200).json({
        data: updatedUser,
        message: 'User updated successfully'
      });
      console.log('[HttpUserController][updateUser] User updated successfully', { userId: updatedUser?.id });
    } catch (error) {
      console.error('[HttpUserController][updateUser] Unexpected error', { error });
      handleError(error as Error, req, res);
    }
  }

  /**
   * Handles HTTP DELETE requests to remove a user by ID.
   * Requires authentication and ID must be passed as query param.
   *
   * @param {VercelRequest} req - VercelRequest with user ID in query.
   * @param {VercelResponse} res - VercelResponse with success message.
   * @returns {Promise<void>} Sends success message or error response.
   * @throws {Error} If authentication, validation, or use case execution fails.
   */
  async deleteUser(req: VercelRequest, res: VercelResponse): Promise<void> {
    console.log('[HttpUserController][deleteUser] Handling DELETE user request', { method: req.method, query: req.query });
    try {
      if (req.method !== 'DELETE') {
        console.warn('[HttpUserController][deleteUser] Method not allowed', { method: req.method });
        res.status(405).json({
          error: 'Method not allowed',
          message: 'Only DELETE method is allowed'
        });
        return;
      }

      const authContext = await authenticate(req, res);

      const userId = req.query?.id as string;
      if (!userId) {
        console.warn('[HttpUserController][deleteUser] Validation failed: User ID is required');
        res.status(400).json({
          error: 'Validation error',
          message: 'User ID is required'
        });
        return;
      }

      await this.deleteUserUseCase.execute({ id: userId }, authContext);

      res.status(200).json({
        message: 'User deleted successfully'
      });
      console.log('[HttpUserController][deleteUser] User deleted successfully', { userId });
    } catch (error) {
      console.error('[HttpUserController][deleteUser] Unexpected error', { error });
      handleError(error as Error, req, res);
    }
  }

  /**
   * Handles HTTP PATCH requests to change a user's role.
   * Requires authentication and a valid role in the body.
   *
   * @param {VercelRequest} req - VercelRequest with user ID in query and role in body.
   * @param {VercelResponse} res - VercelResponse with updated user role info.
   * @returns {Promise<void>} Sends updated user role info or error response.
   * @throws {Error} If authentication, validation, or use case execution fails.
   */
  async changeUserRole(req: VercelRequest, res: VercelResponse): Promise<void> {
    console.log('[HttpUserController][changeUserRole] Handling PATCH change user role request', { method: req.method, query: req.query, body: req.body });
    try {
      if (req.method !== 'PATCH') {
        console.warn('[HttpUserController][changeUserRole] Method not allowed', { method: req.method });
        res.status(405).json({
          error: 'Method not allowed',
          message: 'Only PATCH method is allowed'
        });
        return;
      }

      const authContext = await authenticate(req, res);

      const userId = req.query?.id as string;
      if (!userId) {
        console.warn('[HttpUserController][changeUserRole] Validation failed: User ID is required');
        res.status(400).json({
          error: 'Validation error',
          message: 'User ID is required'
        });
        return;
      }

      const { role } = req.body;

      if (!role || !['admin', 'user'].includes(role.toLowerCase().trim())) {
        console.warn('[HttpUserController][changeUserRole] Validation failed: Invalid role', { role });
        res.status(400).json({
          error: 'Validation error',
          message: 'Role must be either "admin" or "user"'
        });
        return;
      }

      const updatedUser = await this.changeUserRoleUseCase.execute(
        { id: userId, role: role.toLowerCase() as 'admin' | 'user' },
        authContext
      );

      res.status(200).json({
        data: updatedUser,
        message: 'User role changed successfully'
      });
      console.log('[HttpUserController][changeUserRole] User role changed successfully', { userId: updatedUser?.id, newRole: updatedUser?.role });
    } catch (error) {
      console.error('[HttpUserController][changeUserRole] Unexpected error', { error });
      handleError(error as Error, req, res);
    }
  }
}
