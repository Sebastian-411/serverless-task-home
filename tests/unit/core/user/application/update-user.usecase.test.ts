/**
 * Tests for UpdateUserUseCase
 */
import {
  UpdateUserUseCase,
  type UpdateUserCommand,
  type UpdateUserResponse,
} from "../../../../../core/user/application/update-user.usecase";
import { UnauthorizedError } from "../../../../../core/common/domain/exceptions/unauthorized.error";
import { EntityNotFoundError } from "../../../../../core/common/domain/exceptions/entity-not-found.error";
import type { AuthContext } from "../../../../../core/common/config/middlewares/auth.middleware";

describe("UpdateUserUseCase", () => {
  let mockUserRepo: any;
  let usecase: UpdateUserUseCase;
  let authContext: AuthContext;
  let existingUser: any;

  beforeEach(() => {
    existingUser = {
      id: "user-1",
      email: "user@test.com",
      name: "Test User",
      phoneNumber: "123456789",
      role: "USER",
      address: {
        addressLine1: "123 Main St",
        city: "Test City",
        stateOrProvince: "TS",
        postalCode: "12345",
        country: "US",
      },
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
    };

    mockUserRepo = {
      findById: jest.fn(),
      update: jest.fn(),
    };
    usecase = new UpdateUserUseCase(mockUserRepo);
    authContext = {
      isAuthenticated: true,
      user: {
        id: "admin-1",
        email: "admin@test.com",
        role: "admin",
      },
    };
  });

  it("actualiza exitosamente un usuario como ADMIN", async () => {
    const command: UpdateUserCommand = {
      id: "user-1",
      name: "Updated Name",
      email: "updated@test.com",
    };

    const updatedUser = { ...existingUser, ...command };
    mockUserRepo.findById.mockResolvedValue(existingUser);
    mockUserRepo.update.mockResolvedValue(updatedUser);

    const result = await usecase.execute(command, authContext);

    expect(mockUserRepo.findById).toHaveBeenCalledWith("user-1");
    expect(mockUserRepo.update).toHaveBeenCalledWith("user-1", {
      name: "Updated Name",
      email: "updated@test.com",
    });
    expect(result.name).toBe("Updated Name");
    expect(result.email).toBe("updated@test.com");
  });

  it("actualiza exitosamente su propio perfil como USER", async () => {
    const userAuthContext: AuthContext = {
      isAuthenticated: true,
      user: {
        id: "user-1",
        email: "user@test.com",
        role: "user",
      },
    };

    const command: UpdateUserCommand = {
      id: "user-1",
      phoneNumber: "987654321",
    };

    const updatedUser = { ...existingUser, phoneNumber: "987654321" };
    mockUserRepo.findById.mockResolvedValue(existingUser);
    mockUserRepo.update.mockResolvedValue(updatedUser);

    const result = await usecase.execute(command, userAuthContext);

    expect(mockUserRepo.findById).toHaveBeenCalledWith("user-1");
    expect(mockUserRepo.update).toHaveBeenCalledWith("user-1", {
      phoneNumber: "987654321",
    });
    expect(result.phoneNumber).toBe("987654321");
  });

  it("permite a ADMIN cambiar roles de usuario", async () => {
    const command: UpdateUserCommand = {
      id: "user-1",
      role: "admin",
    };

    const updatedUser = { ...existingUser, role: "ADMIN" };
    mockUserRepo.findById.mockResolvedValue(existingUser);
    mockUserRepo.update.mockResolvedValue(updatedUser);

    const result = await usecase.execute(command, authContext);

    expect(mockUserRepo.update).toHaveBeenCalledWith("user-1", {
      role: "ADMIN",
    });
    expect(result.role).toBe("admin");
  });

  it("falla si no está autenticado", async () => {
    const unauthenticatedContext: AuthContext = {
      isAuthenticated: false,
    };

    const command: UpdateUserCommand = {
      id: "user-1",
      name: "Updated Name",
    };

    await expect(
      usecase.execute(command, unauthenticatedContext),
    ).rejects.toThrow(UnauthorizedError);
    await expect(
      usecase.execute(command, unauthenticatedContext),
    ).rejects.toThrow("Authentication required");
    expect(mockUserRepo.findById).not.toHaveBeenCalled();
  });

  it("falla si USER intenta actualizar otro perfil", async () => {
    const userAuthContext: AuthContext = {
      isAuthenticated: true,
      user: {
        id: "user-1",
        email: "user@test.com",
        role: "user",
      },
    };

    const command: UpdateUserCommand = {
      id: "user-2",
      name: "Updated Name",
    };

    await expect(usecase.execute(command, userAuthContext)).rejects.toThrow(
      UnauthorizedError,
    );
    await expect(usecase.execute(command, userAuthContext)).rejects.toThrow(
      "You can only update your own profile",
    );
    expect(mockUserRepo.findById).not.toHaveBeenCalled();
  });

  it("falla si el usuario no existe", async () => {
    const command: UpdateUserCommand = {
      id: "non-existent",
      name: "Updated Name",
    };

    mockUserRepo.findById.mockResolvedValue(null);

    await expect(usecase.execute(command, authContext)).rejects.toThrow(
      EntityNotFoundError,
    );
    await expect(usecase.execute(command, authContext)).rejects.toThrow(
      "User with identifier 'non-existent' not found",
    );
    expect(mockUserRepo.update).not.toHaveBeenCalled();
  });

  it("falla si USER intenta cambiar roles", async () => {
    const userAuthContext: AuthContext = {
      isAuthenticated: true,
      user: {
        id: "user-1",
        email: "user@test.com",
        role: "user",
      },
    };

    const command: UpdateUserCommand = {
      id: "user-1",
      role: "admin",
    };

    mockUserRepo.findById.mockResolvedValue(existingUser);

    await expect(usecase.execute(command, userAuthContext)).rejects.toThrow(
      UnauthorizedError,
    );
    await expect(usecase.execute(command, userAuthContext)).rejects.toThrow(
      "Only administrators can change user roles",
    );
    expect(mockUserRepo.update).not.toHaveBeenCalled();
  });

  it("falla si el repositorio falla", async () => {
    const command: UpdateUserCommand = {
      id: "user-1",
      name: "Updated Name",
    };

    mockUserRepo.findById.mockResolvedValue(existingUser);
    mockUserRepo.update.mockRejectedValue(new Error("Repository error"));

    await expect(usecase.execute(command, authContext)).rejects.toThrow(
      "Repository error",
    );
    expect(mockUserRepo.findById).toHaveBeenCalledWith("user-1");
    expect(mockUserRepo.update).toHaveBeenCalledWith("user-1", {
      name: "Updated Name",
    });
  });

  it("retorna respuesta formateada correctamente", async () => {
    const command: UpdateUserCommand = {
      id: "user-1",
      name: "Updated Name",
    };

    const updatedUser = { ...existingUser, name: "Updated Name" };
    mockUserRepo.findById.mockResolvedValue(existingUser);
    mockUserRepo.update.mockResolvedValue(updatedUser);

    const result = await usecase.execute(command, authContext);

    expect(result).toMatchObject({
      id: "user-1",
      email: "user@test.com",
      name: "Updated Name",
      phoneNumber: "123456789",
      role: "user",
      address: {
        addressLine1: "123 Main St",
        city: "Test City",
        stateOrProvince: "TS",
        postalCode: "12345",
        country: "US",
      },
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
    });
  });
});
