import { SupabaseService } from '../../../shared/auth/supabase.service';
import { CreateUserData } from '../infrastructure/user.repository.prisma';

// Create User Use Case
export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  phoneNumber: string;
  address?: {
    addressLine1: string;
    addressLine2?: string;
    city: string;
    stateOrProvince: string;
    postalCode: string;
    country: string;
  };
  role?: 'admin' | 'user';
}

export interface CreateUserResponse {
  id: string;
  email: string;
  name: string;
  phoneNumber: string;
  role: string;
  address?: any;
  createdAt: Date;
}

export interface AuthContext {
  user?: {
    id: string;
    email: string;
    role: 'admin' | 'user';
  };
  isAuthenticated: boolean;
}

export class CreateUserUseCase {
  constructor(
    private userRepository: any // TODO: Type this properly
  ) {}

  async execute(request: CreateUserRequest, authContext: AuthContext): Promise<CreateUserResponse> {
    // Validar escenarios de autorización
    this.validateAuthorization(request, authContext);

    // Crear usuario en Supabase Auth
    const { user: supabaseUser, error } = await SupabaseService.createUser(
      request.email, 
      request.password
    );

    if (error) {
      throw new Error(`Error creating user in Supabase: ${error.message}`);
    }

    try {
      // Crear entidad de usuario en la base de datos
      const userData: CreateUserData = {
        id: supabaseUser.id, // Usar el ID de Supabase
        name: request.name,
        email: request.email,
        phoneNumber: request.phoneNumber,
        role: this.mapRoleToPrisma(this.determineUserRole(request, authContext)),
        address: request.address ? {
          addressLine1: request.address.addressLine1,
          addressLine2: request.address.addressLine2,
          city: request.address.city,
          stateOrProvince: request.address.stateOrProvince,
          postalCode: request.address.postalCode,
          country: request.address.country
        } : null
      };

      const createdUser = await this.userRepository.create(userData);

      return {
        id: createdUser.id,
        email: createdUser.email,
        name: createdUser.name,
        phoneNumber: createdUser.phoneNumber,
        role: createdUser.role.toLowerCase(), // Devolver en minúsculas para la API
        address: createdUser.address,
        createdAt: createdUser.createdAt
      };

    } catch (dbError) {
      // Si hay error en la DB, intentar eliminar el usuario de Supabase
      // (rollback manual ya que no tenemos transacciones distribuidas)
      console.error('Database error, user created in Supabase but not in DB:', dbError);
      throw new Error('Error creating user in database');
    }
  }

  private validateAuthorization(request: CreateUserRequest, authContext: AuthContext): void {
    // Escenario 1: Admin crea usuario (puede crear admin o user)
    if (authContext.isAuthenticated && authContext.user?.role === 'admin') {
      // Admin puede crear cualquier tipo de usuario
      return;
    }

    // Escenario 2: Self-register (usuario anónimo se registra)
    if (!authContext.isAuthenticated) {
      // Usuario anónimo solo puede crear usuario con rol 'user'
      if (request.role && request.role !== 'user') {
        throw new Error('Anonymous users can only register as regular users');
      }
      return;
    }

    // Escenario 3: Usuario regular intenta crear otro usuario
    if (authContext.isAuthenticated && authContext.user?.role === 'user') {
      throw new Error('Regular users cannot create other users');
    }

    // Cualquier otro caso no autorizado
    throw new Error('Unauthorized to create user');
  }

  private determineUserRole(request: CreateUserRequest, authContext: AuthContext): 'admin' | 'user' {
    // Si es admin creando usuario, puede especificar el rol
    if (authContext.isAuthenticated && authContext.user?.role === 'admin') {
      return request.role || 'user';
    }

    // En cualquier otro caso (self-register), siempre es 'user'
    return 'user';
  }

  private mapRoleToPrisma(role: 'admin' | 'user'): 'ADMIN' | 'USER' {
    return role === 'admin' ? 'ADMIN' : 'USER';
  }
} 