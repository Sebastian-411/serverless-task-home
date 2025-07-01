/**
 * Tests for DeleteUserUseCaseImpl
 */
import {
  DeleteUserUseCaseImpl,
  type DeleteUserCommand,
} from "../../../../../core/user/application/delete-user.usecase";
import { UnauthorizedError } from "../../../../../core/common/domain/exceptions/unauthorized.error";
import { EntityNotFoundError } from "../../../../../core/common/domain/exceptions/entity-not-found.error";
import type { AuthContext } from "../../../../../core/common/config/middlewares/auth.middleware";

describe("DeleteUserUseCaseImpl", () => {
  let mockUserRepo: any;
  let mockAuthService: any;
  let usecase: DeleteUserUseCaseImpl;
  let authContext: AuthContext;

  beforeEach(() => {
    mockUserRepo = {
      findById: jest.fn(),
      delete: jest.fn(),
    };
    mockAuthService = {
      deleteUser: jest.fn(),
    };
    usecase = new DeleteUserUseCaseImpl(mockUserRepo, mockAuthService);
    authContext = {
      isAuthenticated: true,
      user: {
        id: "admin-1",
        email: "admin@test.com",
        role: "admin",
      },
    };
  });

  const command: DeleteUserCommand = {
    id: "user-to-delete",
  };

  it("elimina exitosamente un usuario como ADMIN", async () => {
    const existingUser = { id: "user-to-delete", name: "Test User" };
    mockUserRepo.findById.mockResolvedValue(existingUser);
    mockAuthService.deleteUser.mockResolvedValue(true);
    mockUserRepo.delete.mockResolvedValue(undefined);

    await expect(
      usecase.execute(command, authContext),
    ).resolves.toBeUndefined();

    expect(mockUserRepo.findById).toHaveBeenCalledWith("user-to-delete");
    expect(mockAuthService.deleteUser).toHaveBeenCalledWith("user-to-delete");
    expect(mockUserRepo.delete).toHaveBeenCalledWith("user-to-delete");
  });

  it("falla si no está autenticado", async () => {
    const unauthenticatedContext: AuthContext = {
      isAuthenticated: false,
    };

    await expect(
      usecase.execute(command, unauthenticatedContext),
    ).rejects.toThrow(UnauthorizedError);
    await expect(
      usecase.execute(command, unauthenticatedContext),
    ).rejects.toThrow("Authentication required");
    expect(mockUserRepo.findById).not.toHaveBeenCalled();
  });

  it("falla si no es ADMIN", async () => {
    const userContext: AuthContext = {
      isAuthenticated: true,
      user: {
        id: "user-1",
        email: "user@test.com",
        role: "user",
      },
    };

    await expect(usecase.execute(command, userContext)).rejects.toThrow(
      UnauthorizedError,
    );
    await expect(usecase.execute(command, userContext)).rejects.toThrow(
      "Only administrators can delete users",
    );
    expect(mockUserRepo.findById).not.toHaveBeenCalled();
  });

  it("falla si intenta eliminarse a sí mismo", async () => {
    const selfDeleteCommand: DeleteUserCommand = {
      id: "admin-1",
    };

    await expect(
      usecase.execute(selfDeleteCommand, authContext),
    ).rejects.toThrow(UnauthorizedError);
    await expect(
      usecase.execute(selfDeleteCommand, authContext),
    ).rejects.toThrow("Administrators cannot delete their own account");
    expect(mockUserRepo.findById).not.toHaveBeenCalled();
  });

  it("falla si el usuario no existe", async () => {
    mockUserRepo.findById.mockResolvedValue(null);
    await expect(usecase.execute(command, authContext)).rejects.toThrow(
      EntityNotFoundError,
    );
    await expect(usecase.execute(command, authContext)).rejects.toThrow(
      `User with identifier 'user-to-delete' not found`,
    );
    expect(mockAuthService.deleteUser).not.toHaveBeenCalled();
    expect(mockUserRepo.delete).not.toHaveBeenCalled();
  });

  it("falla si el servicio de auth falla", async () => {
    const existingUser = { id: "user-to-delete", name: "Test User" };
    mockUserRepo.findById.mockResolvedValue(existingUser);
    mockAuthService.deleteUser.mockRejectedValue(
      new Error("Auth service error"),
    );

    await expect(usecase.execute(command, authContext)).rejects.toThrow(
      "Auth service error",
    );
    expect(mockUserRepo.findById).toHaveBeenCalledWith("user-to-delete");
    expect(mockAuthService.deleteUser).toHaveBeenCalledWith("user-to-delete");
    expect(mockUserRepo.delete).not.toHaveBeenCalled();
  });

  it("falla si el repositorio falla", async () => {
    const existingUser = { id: "user-to-delete", name: "Test User" };
    mockUserRepo.findById.mockResolvedValue(existingUser);
    mockAuthService.deleteUser.mockResolvedValue(true);
    mockUserRepo.delete.mockRejectedValue(new Error("Repository error"));

    await expect(usecase.execute(command, authContext)).rejects.toThrow(
      "Repository error",
    );
    expect(mockUserRepo.findById).toHaveBeenCalledWith("user-to-delete");
    expect(mockAuthService.deleteUser).toHaveBeenCalledWith("user-to-delete");
    expect(mockUserRepo.delete).toHaveBeenCalledWith("user-to-delete");
  });

  it("continúa aunque el auth service no pueda eliminar el usuario", async () => {
    const existingUser = { id: "user-to-delete", name: "Test User" };
    mockUserRepo.findById.mockResolvedValue(existingUser);
    mockAuthService.deleteUser.mockResolvedValue(false); // Auth service falla
    mockUserRepo.delete.mockResolvedValue(undefined);

    await expect(
      usecase.execute(command, authContext),
    ).resolves.toBeUndefined();

    expect(mockUserRepo.findById).toHaveBeenCalledWith("user-to-delete");
    expect(mockAuthService.deleteUser).toHaveBeenCalledWith("user-to-delete");
    expect(mockUserRepo.delete).toHaveBeenCalledWith("user-to-delete");
  });
});
