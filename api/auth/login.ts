// POST /auth/login
import { VercelRequest, VercelResponse } from '@vercel/node';
import { Dependencies } from '../../shared/config/dependencies';
import { HandlerContext } from '../../shared/middlewares/request-handler.middleware';
import { ValidationRule } from '../../shared/middlewares/validation.middleware';
import { SupabaseService } from '../../shared/auth/supabase.service';

// Ultra-fast validation rules
const LOGIN_VALIDATION: ValidationRule[] = [
  { field: 'email', required: true, type: 'email', maxLength: 255 },
  { field: 'password', required: true, type: 'string', minLength: 1, maxLength: 100 }
];

// High-performance public endpoint
const handler = Dependencies.createPublicEndpoint(['POST'])({
  bodyValidation: LOGIN_VALIDATION
}, async (context: HandlerContext) => {
  const { email, password } = context.validatedBody;
  const normalizedEmail = email.trim().toLowerCase();

  // Fast authentication - O(1) network call
  const { data, error } = await SupabaseService.signIn(normalizedEmail, password);

  if (error) {
    if (error.message.includes('Invalid login credentials') || 
        error.message.includes('Email not confirmed') ||
        error.message.includes('Password')) {
      throw new Error('Invalid email or password');
    }
    throw new Error('Login failed. Please try again.');
  }

  if (!data.session || !data.user) {
    throw new Error('Login failed. Invalid credentials.');
  }

  // Ultra-fast user profile lookup - O(1) with index
  const userProfile = await Dependencies.userRepository.findById(data.user.id);
  if (!userProfile) {
    throw new Error('User profile not found');
  }

  return {
    data: {
      user: {
        id: userProfile.id,
        email: userProfile.email,
        name: userProfile.name,
        role: userProfile.role.toLowerCase(),
        phoneNumber: userProfile.phoneNumber,
        address: userProfile.address,
        createdAt: userProfile.createdAt
      },
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
        expires_in: data.session.expires_in
      }
    },
    message: 'Login successful'
  };
});

export default handler; 