import type { VercelRequest, VercelResponse } from '@vercel/node';

import type { AuthControllerPort } from '../../../domain/ports/in/auth-controller.port';
import type { LoginUseCase } from '../../../application/login.usecase';
import { validateEmail, validatePassword } from '../../../../common/config/middlewares/validation.middleware';
import { handleError } from '../../../../common/config/middlewares/error-handler.middleware';

/**
 * HttpAuthController handles HTTP-specific concerns related to authentication.
 *
 * It is an infrastructure-layer adapter that:
 * - Receives HTTP requests
 * - Validates inputs
 * - Delegates business logic to the application layer (`LoginUseCase`)
 * - Constructs HTTP responses (including error responses)
 *
 * This controller adheres to hexagonal architecture by implementing
 * `AuthControllerPort` and avoiding any domain or business logic directly.
 */
export class HttpAuthController implements AuthControllerPort {
  constructor(private readonly loginUseCase: LoginUseCase) {}

  /**
   * Handles the login HTTP request using the POST method.
   *
   * @param req - Incoming Vercel HTTP request object.
   * @param res - Outgoing Vercel HTTP response object.
   *
   * @returns A structured JSON response with user info and JWT on success.
   *
   * @throws Returns appropriate HTTP codes on:
   * - Unsupported method (405)
   * - Input validation failure (400)
   * - Application/domain errors (handled via centralized error handler)
   */
  async login(req: VercelRequest, res: VercelResponse): Promise<void> {
    try {
      console.log('[HttpAuthController] Received login request', {
        method: req.method,
        path: req.url
      });

      if (req.method !== 'POST') {
        console.warn('[HttpAuthController] Method not allowed', {
          method: req.method
        });

        res.status(405).json({
          error: 'Method not allowed',
          message: 'Only POST method is allowed'
        });
        return;
      }

      const { email, password } = req.body;

      if (!email || !validateEmail(email)) {
        console.warn('[HttpAuthController] Email validation failed', { email });

        res.status(400).json({
          error: 'Validation error',
          message: 'Valid email is required'
        });
        return;
      }

      if (!password || !validatePassword(password)) {
        console.warn('[HttpAuthController] Password validation failed');

        res.status(400).json({
          error: 'Validation error',
          message: 'Password must be at least 8 characters with uppercase, lowercase, and number'
        });
        return;
      }

      console.log('[HttpAuthController] Credentials validated. Executing use case.', { email });

      const loginResult = await this.loginUseCase.execute({ email, password });

      console.log('[HttpAuthController] Login successful', {
        userId: loginResult.user.id,
        email: loginResult.user.email,
        role: loginResult.user.role
      });

      res.status(200).json({
        message: 'Login successful',
        user: loginResult.user,
        token: loginResult.token
      });

    } catch (error) {
      console.error('[HttpAuthController] Unexpected error occurred during login', {
        error: (error as Error).message,
        path: req.url
      });

      handleError(error as Error, req, res);
    }
  }
}
