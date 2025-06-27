// POST /auth/login
import { VercelRequest, VercelResponse } from '@vercel/node';
import { SupabaseService } from '../../shared/auth/supabase.service';
import { PrismaClient } from '../../lib/generated/prisma';
import { UserRepositoryPrisma } from '../../core/user/infrastructure/user.repository.prisma';

// Inicializar dependencias
const prisma = new PrismaClient();
const userRepository = new UserRepositoryPrisma(prisma);

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      phoneNumber: string;
      address?: any;
    };
    session: {
      access_token: string;
      refresh_token: string;
      expires_in: number;
      token_type: string;
    };
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ 
        error: 'Method not allowed',
        message: 'Only POST method is allowed'
      });
    }

    return await handleLogin(req, res);

  } catch (error) {
    console.error('Error in login endpoint:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function handleLogin(req: VercelRequest, res: VercelResponse) {
  try {
    // Validar campos requeridos
    const { email, password }: LoginRequest = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Email and password are required'
      });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Invalid email format'
      });
    }

    // Autenticar con Supabase
    const { data, error } = await SupabaseService.signIn(email.trim().toLowerCase(), password);

    if (error) {
      // Manejar errores específicos de autenticación
      if (error.message?.includes('Invalid login credentials') || 
          error.message?.includes('invalid credentials') ||
          error.message?.includes('Email not confirmed')) {
        return res.status(401).json({
          error: 'Authentication failed',
          message: 'Invalid email or password'
        });
      }

      // Otros errores de Supabase
      return res.status(400).json({
        error: 'Authentication service error',
        message: 'Unable to authenticate. Please try again.'
      });
    }

    if (!data.user || !data.session) {
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Invalid email or password'
      });
    }

    // Buscar información adicional del usuario en la base de datos
    const dbUser = await userRepository.findById(data.user.id);
    
    if (!dbUser) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User account not found in the system'
      });
    }

    // Respuesta exitosa
    const response: LoginResponse = {
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: dbUser.id,
          email: dbUser.email,
          name: dbUser.name,
          role: dbUser.role.toLowerCase(),
          phoneNumber: dbUser.phoneNumber,
          address: dbUser.address
        },
        session: {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token || '',
          expires_in: data.session.expires_in || 3600,
          token_type: data.session.token_type || 'bearer'
        }
      }
    };

    return res.status(200).json(response);

  } catch (error) {
    console.error('Error during login:', error);

    // Manejo específico de errores
    if (error instanceof Error) {
      // Error de base de datos
      if (error.message.includes('database') || error.message.includes('prisma')) {
        return res.status(500).json({
          error: 'Database error',
          message: 'Unable to retrieve user information'
        });
      }

      // Error de Supabase
      if (error.message.includes('Supabase')) {
        return res.status(400).json({
          error: 'Authentication service error',
          message: 'Authentication service temporarily unavailable'
        });
      }
    }

    // Error genérico
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Login failed. Please try again.'
    });
  }
} 