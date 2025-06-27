// User Repository Prisma Implementation
import { PrismaClient, User as PrismaUser, Address as PrismaAddress } from '../../../lib/generated/prisma';

export interface CreateUserData {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  role: 'ADMIN' | 'USER';
  address?: {
    addressLine1: string;
    addressLine2?: string;
    city: string;
    stateOrProvince: string;
    postalCode: string;
    country: string;
  } | null;
}

export interface UserRepository {
  create(user: CreateUserData): Promise<any>;
  findById(id: string): Promise<any | null>;
  findByEmail(email: string): Promise<any | null>;
  update(id: string, data: any): Promise<any>;
  delete(id: string): Promise<void>;
}

export class UserRepositoryPrisma implements UserRepository {
  constructor(private prisma: PrismaClient) {}

  async create(userData: CreateUserData): Promise<any> {
    try {
      // Verificar si el email ya existe
      const existingUser = await this.findByEmail(userData.email);
      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Crear usuario con dirección si se proporciona
      const user = await this.prisma.user.create({
        data: {
          id: userData.id,
          name: userData.name,
          email: userData.email,
          phoneNumber: userData.phoneNumber,
          role: userData.role,
          address: userData.address ? {
            create: {
              addressLine1: userData.address.addressLine1,
              addressLine2: userData.address.addressLine2,
              city: userData.address.city,
              stateOrProvince: userData.address.stateOrProvince,
              postalCode: userData.address.postalCode,
              country: userData.address.country,
            }
          } : undefined
        },
        include: {
          address: true
        }
      });

      return user;
    } catch (error) {
      console.error('Error creating user in database:', error);
      throw error;
    }
  }

  async findById(id: string): Promise<any | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
        include: {
          address: true
        }
      });
      return user;
    } catch (error) {
      console.error('Error finding user by ID:', error);
      throw error;
    }
  }

  async findByEmail(email: string): Promise<any | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email },
        include: {
          address: true
        }
      });
      return user;
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw error;
    }
  }

  async update(id: string, data: any): Promise<any> {
    try {
      const user = await this.prisma.user.update({
        where: { id },
        data,
        include: {
          address: true
        }
      });
      return user;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prisma.user.delete({
        where: { id }
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }
} 