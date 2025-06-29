// POST /auth/login
import type { VercelRequest, VercelResponse } from '@vercel/node';

import { Dependencies } from '../../shared/config/dependencies';
import { validateEmail, validatePassword } from '../../shared/middlewares/validation.middleware';
import { handleError } from '../../shared/middlewares/error-handler.middleware';

// High-performance login endpoint - O(1) initialization
const handleLogin = async (req: VercelRequest, res: VercelResponse) => {
  try {
    // Step 1: Method validation
    if (req.method !== 'POST') {
      return res.status(405).json({
        error: 'Method not allowed',
        message: 'Only POST method is allowed'
      });
    }

    // Step 2: Body validation
    const { email, password } = req.body;
    
    if (!email || !validateEmail(email)) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Valid email is required'
      });
    }
    
    if (!password || !validatePassword(password)) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Valid password is required'
      });
    }

    // Step 3: Execute use case - all business logic is handled there
    const loginResult = await Dependencies.loginUseCase.execute({ email, password });
    
    // Step 4: Success response
    return res.status(200).json({
      message: 'Login successful',
      user: loginResult.user,
      accessToken: loginResult.accessToken,
      refreshToken: loginResult.refreshToken,
      expiresAt: loginResult.expiresAt
    });

  } catch (error) {
    handleError(error as Error, req, res);
  }
};

export default handleLogin; 