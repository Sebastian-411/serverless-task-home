import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { AuthControllerPort } from '../../../domain/ports/in/auth-controller.port';
import type { LoginUseCase } from '../../../application/login.usecase';
import { validateEmail, validatePassword } from '../../../../common/config/middlewares/validation.middleware';
import { handleError } from '../../../../common/config/middlewares/error-handler.middleware';

export class HttpAuthController implements AuthControllerPort {
  constructor(private readonly loginUseCase: LoginUseCase) {}

  async login(req: VercelRequest, res: VercelResponse): Promise<void> {
    try {
      // Step 1: Method validation
      if (req.method !== 'POST') {
        res.status(405).json({
          error: 'Method not allowed',
          message: 'Only POST method is allowed'
        });
        return;
      }

      // Step 2: Body validation
      const { email, password } = req.body;
      
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

      // Step 3: Execute use case - all business logic is handled there
      const loginResult = await this.loginUseCase.execute({ email, password });
      
      // Step 4: Success response
      res.status(200).json({
        message: 'Login successful',
        user: loginResult.user,
        token: loginResult.token
      });

    } catch (error) {
      handleError(error as Error, req, res);
    }
  }
} 