// GET /users (list), POST /users (create)
import { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '../../lib/generated/prisma';
import { CreateUserUseCase, CreateUserRequest, AuthContext } from '../../core/user/application/create-user.usecase';
import { UserRepositoryPrisma } from '../../core/user/infrastructure/user.repository.prisma';
import { SupabaseService } from '../../shared/auth/supabase.service';

// Inicializar dependencias
const prisma = new PrismaClient();
const userRepository = new UserRepositoryPrisma(prisma);
const createUserUseCase = new CreateUserUseCase(userRepository);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    switch (req.method) {
      case 'GET':
        // GET /users - Retrieve all users
        return res.status(200).json({ 
          message: "hi, this still in development" 
        });
        
      case 'POST':
        return await handleCreateUser(req, res);
        
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in users endpoint:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function handleCreateUser(req: VercelRequest, res: VercelResponse) {
  try {
    // Extraer token de autenticación si existe
    const token = SupabaseService.extractTokenFromRequest(req);
    let authContext: AuthContext = { isAuthenticated: false };

    // Validar token si existe
    if (token) {
      const supabaseUser = await SupabaseService.validateToken(token, userRepository);
      if (supabaseUser) {
        authContext = {
          isAuthenticated: true,
          user: {
            id: supabaseUser.id,
            email: supabaseUser.email,
            role: supabaseUser.role
          }
        };
      }
    }

    // Validar campos requeridos
    const { name, email, password, phoneNumber, address, role } = req.body;

    if (!name || !email || !password || !phoneNumber) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Name, email, password, and phone number are required'
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

    // Validar longitud de contraseña
    if (password.length < 6) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Password must be at least 6 characters long'
      });
    }

    // Validar dirección si se proporciona
    if (address) {
      const { addressLine1, city, stateOrProvince, postalCode, country } = address;
      if (!addressLine1 || !city || !stateOrProvince || !postalCode || !country) {
        return res.status(400).json({
          error: 'Validation error',
          message: 'If address is provided, addressLine1, city, stateOrProvince, postalCode, and country are required'
        });
      }
    }

    // Preparar request para el caso de uso
    const createUserRequest: CreateUserRequest = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      phoneNumber: phoneNumber.trim(),
      address: address ? {
        addressLine1: address.addressLine1.trim(),
        addressLine2: address.addressLine2?.trim(),
        city: address.city.trim(),
        stateOrProvince: address.stateOrProvince.trim(),
        postalCode: address.postalCode.trim(),
        country: address.country.trim()
      } : undefined,
      role: role as 'admin' | 'user'
    };

    // Ejecutar caso de uso
    const result = await createUserUseCase.execute(createUserRequest, authContext);

    // Respuesta exitosa
    return res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        id: result.id,
        email: result.email,
        name: result.name,
        phoneNumber: result.phoneNumber,
        role: result.role,
        address: result.address,
        createdAt: result.createdAt
      }
    });

  } catch (error) {
    console.error('Error creating user:', error);

    // Manejo específico de errores
    if (error instanceof Error) {
      // Errores de autorización
      if (error.message.includes('Anonymous users can only register') || 
          error.message.includes('Regular users cannot create') ||
          error.message.includes('Unauthorized to create user')) {
        return res.status(403).json({
          error: 'Authorization error',
          message: error.message
        });
      }

      // Error de email ya registrado en Supabase
      if (error.message.includes('User already registered') || 
          error.message.includes('already registered')) {
        return res.status(409).json({
          error: 'Conflict error',
          message: 'A user with this email address already exists'
        });
      }

      // Error de email ya existe en la base de datos
      if (error.message.includes('User with this email already exists')) {
        return res.status(409).json({
          error: 'Conflict error',
          message: 'A user with this email address already exists'
        });
      }

      // Otros errores de validación
      if (error.message.includes('validation')) {
        return res.status(400).json({
          error: 'Validation error',
          message: error.message
        });
      }

      // Otros errores de Supabase (que no sean email duplicado)
      if (error.message.includes('Supabase')) {
        return res.status(400).json({
          error: 'Authentication service error',
          message: 'Error creating user account. Please try again.'
        });
      }
    }

    // Error genérico
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Error creating user. Please try again.'
    });
  }
} 