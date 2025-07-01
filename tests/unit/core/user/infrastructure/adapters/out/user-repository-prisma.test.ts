import { UserRepositoryPrisma } from "../../../../../../../core/user/infrastructure/adapters/out/user-repository-prisma";
import {
  set,
  remove,
  getOrSet,
  invalidatePattern,
  Keys,
} from "../../../../../../../core/common/config/cache/cache.service";

// Mock del cache service
jest.mock(
  "../../../../../../../core/common/config/cache/cache.service",
  () => ({
    get: jest.fn(),
    set: jest.fn(),
    remove: jest.fn(),
    getOrSet: jest.fn(),
    invalidatePattern: jest.fn(),
    Keys: {
      user: jest.fn((id: string) => `user:${id}`),
      userByEmail: jest.fn((email: string) => `user:email:${email}`),
      users: jest.fn(() => "users:list:all"),
    },
  }),
);

// Mock de PrismaClient
const mockPrismaClient = {
  user: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

describe("UserRepositoryPrisma", () => {
  let repository: UserRepositoryPrisma;
  let mockPrisma: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma = { ...mockPrismaClient };
    repository = new UserRepositoryPrisma(mockPrisma);
  });

  describe("constructor", () => {
    it("inicializa correctamente con PrismaClient", () => {
      expect(repository).toBeInstanceOf(UserRepositoryPrisma);
    });
  });

  describe("create", () => {
    const userData = {
      id: "user-1",
      name: "Test User",
      email: "test@example.com",
      phoneNumber: "123456789",
      role: "USER" as const,
      address: {
        addressLine1: "Test Street 123",
        city: "Test City",
        stateOrProvince: "Test State",
        postalCode: "12345",
        country: "Test Country",
      },
    };

    it("crea usuario exitosamente con dirección", async () => {
      const createdUser = { ...userData, createdAt: new Date() };

      // Mock findByEmail para que retorne null (usuario no existe)
      jest.spyOn(repository, "findByEmail").mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue(createdUser);

      const result = await repository.create(userData);

      expect(result).toEqual(createdUser);
      expect(repository.findByEmail).toHaveBeenCalledWith(userData.email);
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          id: userData.id,
          name: userData.name,
          email: userData.email,
          phoneNumber: userData.phoneNumber,
          role: userData.role,
          address: { create: userData.address },
        },
        include: { address: true },
      });
      expect(set).toHaveBeenCalledWith(
        Keys.user(createdUser.id),
        createdUser,
        3 * 60 * 1000,
      );
      expect(set).toHaveBeenCalledWith(
        Keys.userByEmail(createdUser.email),
        createdUser,
        5 * 60 * 1000,
      );
      expect(invalidatePattern).toHaveBeenCalledWith("users:list.*");
    });

    it("crea usuario exitosamente sin dirección", async () => {
      const userDataSinAddress = { ...userData };
      delete userDataSinAddress.address;
      const createdUser = { ...userDataSinAddress, createdAt: new Date() };

      // Mock findByEmail para que retorne null (usuario no existe)
      jest.spyOn(repository, "findByEmail").mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue(createdUser);

      const result = await repository.create(userDataSinAddress);

      expect(result).toEqual(createdUser);
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          id: userDataSinAddress.id,
          name: userDataSinAddress.name,
          email: userDataSinAddress.email,
          phoneNumber: userDataSinAddress.phoneNumber,
          role: userDataSinAddress.role,
          address: undefined,
        },
        include: { address: true },
      });
    });

    it("lanza error si usuario ya existe", async () => {
      const existingUser = { id: "existing-user", email: userData.email };

      // Mock findByEmail para que retorne un usuario existente
      jest.spyOn(repository, "findByEmail").mockResolvedValue(existingUser);

      await expect(repository.create(userData)).rejects.toThrow(
        "User with this email already exists",
      );
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });

    it("lanza error si falla la operación de DB", async () => {
      // Mock findByEmail para que retorne null (usuario no existe)
      jest.spyOn(repository, "findByEmail").mockResolvedValue(null);
      mockPrisma.user.create.mockRejectedValue(new Error("DB Error"));

      await expect(repository.create(userData)).rejects.toThrow("DB Error");
    });
  });

  describe("findById", () => {
    const userId = "user-1";
    const user = { id: userId, name: "Test User", email: "test@example.com" };

    it("encuentra usuario exitosamente desde cache", async () => {
      (getOrSet as jest.Mock).mockResolvedValue(user);

      const result = await repository.findById(userId);

      expect(result).toEqual(user);
      expect(getOrSet).toHaveBeenCalledWith(
        Keys.user(userId),
        expect.any(Function),
        3 * 60 * 1000,
      );
    });

    it("encuentra usuario exitosamente desde DB", async () => {
      (getOrSet as jest.Mock).mockImplementation(async (key, fn) => {
        return await fn();
      });
      mockPrisma.user.findUnique.mockResolvedValue(user);

      const result = await repository.findById(userId);

      expect(result).toEqual(user);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        include: { address: true },
      });
    });

    it("retorna null si usuario no existe", async () => {
      (getOrSet as jest.Mock).mockImplementation(async (key, fn) => {
        return await fn();
      });
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await repository.findById(userId);

      expect(result).toBeNull();
    });

    it("lanza error si falla la búsqueda", async () => {
      (getOrSet as jest.Mock).mockRejectedValue(new Error("Cache/DB Error"));

      await expect(repository.findById(userId)).rejects.toThrow(
        "Cache/DB Error",
      );
    });
  });

  describe("findByEmail", () => {
    const email = "test@example.com";
    const user = { id: "user-1", name: "Test User", email };

    it("encuentra usuario exitosamente desde cache", async () => {
      (getOrSet as jest.Mock).mockResolvedValue(user);

      const result = await repository.findByEmail(email);

      expect(result).toEqual(user);
      expect(getOrSet).toHaveBeenCalledWith(
        Keys.userByEmail(email),
        expect.any(Function),
        5 * 60 * 1000,
      );
    });

    it("encuentra usuario exitosamente desde DB", async () => {
      (getOrSet as jest.Mock).mockImplementation(async (key, fn) => {
        return await fn();
      });
      mockPrisma.user.findUnique.mockResolvedValue(user);

      const result = await repository.findByEmail(email);

      expect(result).toEqual(user);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email },
        include: { address: true },
      });
    });

    it("retorna null si usuario no existe", async () => {
      (getOrSet as jest.Mock).mockImplementation(async (key, fn) => {
        return await fn();
      });
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await repository.findByEmail(email);

      expect(result).toBeNull();
    });

    it("lanza error si falla la búsqueda", async () => {
      (getOrSet as jest.Mock).mockRejectedValue(new Error("Cache/DB Error"));

      await expect(repository.findByEmail(email)).rejects.toThrow(
        "Cache/DB Error",
      );
    });
  });

  describe("findAll", () => {
    const users = [
      { id: "user-1", name: "User 1" },
      { id: "user-2", name: "User 2" },
    ];

    it("retorna todos los usuarios desde cache", async () => {
      (getOrSet as jest.Mock).mockResolvedValue(users);

      const result = await repository.findAll();

      expect(result).toEqual(users);
      expect(getOrSet).toHaveBeenCalledWith(
        Keys.users(),
        expect.any(Function),
        2 * 60 * 1000,
      );
    });

    it("retorna todos los usuarios desde DB", async () => {
      (getOrSet as jest.Mock).mockImplementation(async (key, fn) => {
        return await fn();
      });
      mockPrisma.user.findMany.mockResolvedValue(users);

      const result = await repository.findAll();

      expect(result).toEqual(users);
      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        include: { address: true },
        orderBy: { createdAt: "desc" },
      });
    });

    it("lanza error si falla la consulta", async () => {
      (getOrSet as jest.Mock).mockRejectedValue(new Error("Cache/DB Error"));

      await expect(repository.findAll()).rejects.toThrow("Cache/DB Error");
    });
  });

  describe("findAllPaginated", () => {
    const users = [
      { id: "user-1", name: "User 1" },
      { id: "user-2", name: "User 2" },
    ];

    it("retorna usuarios paginados exitosamente", async () => {
      mockPrisma.user.findMany.mockResolvedValue(users);

      const result = await repository.findAllPaginated(0, 10);

      expect(result).toEqual(users);
      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        include: { address: true },
        orderBy: { createdAt: "desc" },
        skip: 0,
        take: 10,
      });
    });

    it("retorna usuarios con offset y limit diferentes", async () => {
      mockPrisma.user.findMany.mockResolvedValue(users);

      const result = await repository.findAllPaginated(5, 20);

      expect(result).toEqual(users);
      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        include: { address: true },
        orderBy: { createdAt: "desc" },
        skip: 5,
        take: 20,
      });
    });

    it("lanza error si falla la consulta paginada", async () => {
      mockPrisma.user.findMany.mockRejectedValue(new Error("DB Error"));

      await expect(repository.findAllPaginated(0, 10)).rejects.toThrow(
        "DB Error",
      );
    });
  });

  describe("count", () => {
    it("cuenta usuarios exitosamente", async () => {
      mockPrisma.user.count.mockResolvedValue(10);

      const result = await repository.count();

      expect(result).toBe(10);
      expect(mockPrisma.user.count).toHaveBeenCalled();
    });

    it("lanza error si falla el conteo", async () => {
      mockPrisma.user.count.mockRejectedValue(new Error("DB Error"));

      await expect(repository.count()).rejects.toThrow("DB Error");
    });
  });

  describe("update", () => {
    const userId = "user-1";
    const updateData = {
      name: "Updated Name",
      email: "updated@example.com",
      address: {
        addressLine1: "Updated Street 456",
        city: "Updated City",
        stateOrProvince: "Updated State",
        postalCode: "54321",
        country: "Updated Country",
      },
    };

    it("actualiza usuario exitosamente con dirección", async () => {
      const updatedUser = { id: userId, ...updateData };
      mockPrisma.user.update.mockResolvedValue(updatedUser);

      const result = await repository.update(userId, updateData);

      expect(result).toEqual(updatedUser);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          ...updateData,
          address: {
            upsert: {
              create: updateData.address,
              update: updateData.address,
            },
          },
        },
        include: { address: true },
      });
      expect(set).toHaveBeenCalledWith(
        Keys.user(userId),
        updatedUser,
        3 * 60 * 1000,
      );
      expect(set).toHaveBeenCalledWith(
        Keys.userByEmail(updatedUser.email),
        updatedUser,
        5 * 60 * 1000,
      );
      expect(invalidatePattern).toHaveBeenCalledWith("users:list.*");
    });

    it("actualiza usuario exitosamente sin dirección", async () => {
      const updateDataSinAddress = {
        name: "Updated Name",
        email: "updated@example.com",
      };
      const updatedUser = { id: userId, ...updateDataSinAddress };
      mockPrisma.user.update.mockResolvedValue(updatedUser);

      const result = await repository.update(userId, updateDataSinAddress);

      expect(result).toEqual(updatedUser);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: updateDataSinAddress,
        include: { address: true },
      });
    });

    it("lanza error si falla la actualización", async () => {
      mockPrisma.user.update.mockRejectedValue(new Error("DB Error"));

      await expect(repository.update(userId, updateData)).rejects.toThrow(
        "DB Error",
      );
    });
  });

  describe("delete", () => {
    const userId = "user-1";
    const user = { id: userId, email: "test@example.com" };

    it("elimina usuario exitosamente", async () => {
      // Mock findById para que retorne el usuario
      jest.spyOn(repository, "findById").mockResolvedValue(user);
      mockPrisma.user.delete.mockResolvedValue(undefined);

      await repository.delete(userId);

      expect(repository.findById).toHaveBeenCalledWith(userId);
      expect(mockPrisma.user.delete).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(remove).toHaveBeenCalledWith(Keys.user(userId));
      expect(remove).toHaveBeenCalledWith(Keys.userByEmail(user.email));
      expect(invalidatePattern).toHaveBeenCalledWith("users:list.*");
    });

    it("lanza error si falla la eliminación", async () => {
      // Mock findById para que retorne el usuario
      jest.spyOn(repository, "findById").mockResolvedValue(user);
      mockPrisma.user.delete.mockRejectedValue(new Error("DB Error"));

      await expect(repository.delete(userId)).rejects.toThrow("DB Error");
    });
  });

  describe("findByIdMinimal", () => {
    const userId = "user-1";
    const minimalUser = { id: userId, role: "USER", name: "Test User" };

    it("retorna datos mínimos desde cache", async () => {
      (getOrSet as jest.Mock).mockResolvedValue(minimalUser);

      const result = await repository.findByIdMinimal(userId);

      expect(result).toEqual(minimalUser);
      expect(getOrSet).toHaveBeenCalledWith(
        Keys.user(userId),
        expect.any(Function),
        5 * 60 * 1000,
      );
    });

    it("retorna datos mínimos desde DB", async () => {
      (getOrSet as jest.Mock).mockImplementation(async (key, fn) => {
        return await fn();
      });
      mockPrisma.user.findUnique.mockResolvedValue(minimalUser);

      const result = await repository.findByIdMinimal(userId);

      expect(result).toEqual(minimalUser);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        select: { id: true, role: true, name: true },
      });
    });

    it("retorna null si usuario no existe", async () => {
      (getOrSet as jest.Mock).mockImplementation(async (key, fn) => {
        return await fn();
      });
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await repository.findByIdMinimal(userId);

      expect(result).toBeNull();
    });

    it("lanza error si falla la búsqueda", async () => {
      (getOrSet as jest.Mock).mockRejectedValue(new Error("Cache/DB Error"));

      await expect(repository.findByIdMinimal(userId)).rejects.toThrow(
        "Cache/DB Error",
      );
    });
  });

  describe("validateUsersForAssignment", () => {
    const assigneeId = "assignee-1";
    const assignedById = "assigned-by-1";
    const assignee = { id: assigneeId, role: "USER", name: "Assignee" };
    const assignedBy = { id: assignedById, role: "ADMIN", name: "Assigned By" };

    it("valida usuarios exitosamente", async () => {
      jest
        .spyOn(repository, "findByIdMinimal")
        .mockResolvedValueOnce(assignee)
        .mockResolvedValueOnce(assignedBy);

      const result = await repository.validateUsersForAssignment(
        assigneeId,
        assignedById,
      );

      expect(result).toEqual({ assignee, assignedBy });
      expect(repository.findByIdMinimal).toHaveBeenCalledWith(assigneeId);
      expect(repository.findByIdMinimal).toHaveBeenCalledWith(assignedById);
    });

    it("retorna null para assignee si no existe", async () => {
      jest
        .spyOn(repository, "findByIdMinimal")
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(assignedBy);

      const result = await repository.validateUsersForAssignment(
        assigneeId,
        assignedById,
      );

      expect(result).toEqual({ assignee: null, assignedBy });
    });

    it("retorna null para assignedBy si no existe", async () => {
      jest
        .spyOn(repository, "findByIdMinimal")
        .mockResolvedValueOnce(assignee)
        .mockResolvedValueOnce(null);

      const result = await repository.validateUsersForAssignment(
        assigneeId,
        assignedById,
      );

      expect(result).toEqual({ assignee, assignedBy: null });
    });

    it("retorna null para ambos si no existen", async () => {
      jest
        .spyOn(repository, "findByIdMinimal")
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      const result = await repository.validateUsersForAssignment(
        assigneeId,
        assignedById,
      );

      expect(result).toEqual({ assignee: null, assignedBy: null });
    });

    it("lanza error si falla la validación", async () => {
      jest
        .spyOn(repository, "findByIdMinimal")
        .mockRejectedValue(new Error("Validation Error"));

      await expect(
        repository.validateUsersForAssignment(assigneeId, assignedById),
      ).rejects.toThrow("Validation Error");
    });
  });
});
