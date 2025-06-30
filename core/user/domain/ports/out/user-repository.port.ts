import type { UserData, CreateUserData, UpdateUserData } from '../../entities/user.entity';

export interface UserRepositoryPort {
  create(userData: CreateUserData): Promise<UserData>;
  findById(id: string): Promise<UserData | null>;
  findByEmail(email: string): Promise<UserData | null>;
  findAll(): Promise<UserData[]>;
  findAllPaginated(offset: number, limit: number): Promise<UserData[]>;
  count(): Promise<number>;
  update(id: string, data: UpdateUserData): Promise<UserData>;
  delete(id: string): Promise<void>;
  findByIdMinimal(id: string): Promise<{ id: string; role: string; name: string } | null>;
  validateUsersForAssignment(assigneeId: string, assignedById: string): Promise<{
    assignee: { id: string; role: string; name: string } | null;
    assignedBy: { id: string; role: string; name: string } | null;
  }>;
} 