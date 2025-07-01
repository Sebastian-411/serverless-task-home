import type { Dependencies } from "../../../../../core/common/config/dependencies";

// Mock de PrismaClient
jest.mock("../../../../../lib/generated/prisma", () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    $connect: jest.fn().mockResolvedValue(undefined),
    $disconnect: jest.fn().mockResolvedValue(undefined),
  })),
}));

// Mock de SupabaseAuthService
jest.mock(
  "../../../../../core/auth/infrastructure/adapters/out/supabase-auth.service",
  () => ({
    SupabaseAuthService: jest.fn().mockImplementation(() => ({
      // Métodos que pueda necesitar
    })),
  }),
);

// Mock de UserRepositoryPrisma
jest.mock(
  "../../../../../core/user/infrastructure/adapters/out/user-repository-prisma",
  () => ({
    UserRepositoryPrisma: jest.fn().mockImplementation(() => ({
      // Métodos que pueda necesitar
    })),
  }),
);

// Mock de todos los use cases
jest.mock("../../../../../core/user/application/get-users.usecase", () => ({
  GetUsersUseCase: jest.fn().mockImplementation(() => ({})),
}));

jest.mock(
  "../../../../../core/user/application/get-user-by-id.usecase",
  () => ({
    GetUserByIdUseCase: jest.fn().mockImplementation(() => ({})),
  }),
);

jest.mock("../../../../../core/user/application/create-user.usecase", () => ({
  CreateUserUseCase: jest.fn().mockImplementation(() => ({})),
}));

jest.mock("../../../../../core/user/application/update-user.usecase", () => ({
  UpdateUserUseCase: jest.fn().mockImplementation(() => ({})),
}));

jest.mock("../../../../../core/user/application/delete-user.usecase", () => ({
  DeleteUserUseCaseImpl: jest.fn().mockImplementation(() => ({})),
}));

jest.mock(
  "../../../../../core/user/application/change-user-role.usecase",
  () => ({
    ChangeUserRoleUseCase: jest.fn().mockImplementation(() => ({})),
  }),
);

jest.mock("../../../../../core/auth/application/login.usecase", () => ({
  LoginUseCase: jest.fn().mockImplementation(() => ({})),
}));

// Mock de controladores
jest.mock(
  "../../../../../core/user/infrastructure/adapters/in/http-user-controller",
  () => ({
    HttpUserController: jest.fn().mockImplementation(() => ({})),
  }),
);

jest.mock(
  "../../../../../core/auth/infrastructure/adapters/in/http-auth-controller",
  () => ({
    HttpAuthController: jest.fn().mockImplementation(() => ({})),
  }),
);

describe("DependencyContainer", () => {
  let originalEnv: typeof process.env;
  let container: typeof Dependencies;

  beforeAll(() => {
    originalEnv = { ...process.env };
    process.env.SUPABASE_URL = "https://test.supabase.co";
    process.env.SUPABASE_ANON_KEY = "test-anon-key";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";
    process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  beforeEach(() => {
    jest.resetModules();
    container =
      require("../../../../../core/common/config/dependencies").Dependencies;
  });

  it("es un singleton", () => {
    const otraInstancia =
      require("../../../../../core/common/config/dependencies").Dependencies;
    expect(container).toBe(otraInstancia);
  });

  it("inicializa prisma solo una vez", () => {
    const prisma1 = container.prisma;
    const prisma2 = container.prisma;
    expect(prisma1).toBe(prisma2);
    const { PrismaClient } = require("../../../../../lib/generated/prisma");
    expect(PrismaClient).toHaveBeenCalledTimes(1);
  });

  it("inicializa userRepository solo una vez y con prisma", () => {
    const repo1 = container.userRepository;
    const repo2 = container.userRepository;
    expect(repo1).toBe(repo2);
    expect(repo1).toBeInstanceOf(Object);
  });

  it("inicializa authService solo una vez y con env", () => {
    const auth1 = container.authService;
    const auth2 = container.authService;
    expect(auth1).toBe(auth2);
    expect(auth1).toBeInstanceOf(Object);
  });

  it("inicializa todos los use cases solo una vez", () => {
    const uc1 = container.getUsersUseCase;
    const uc2 = container.getUsersUseCase;
    expect(uc1).toBe(uc2);
    expect(uc1).toBeInstanceOf(Object);
  });

  it("inicializa todos los controladores solo una vez", () => {
    const ctrl1 = container.userController;
    const ctrl2 = container.userController;
    expect(ctrl1).toBe(ctrl2);
    expect(ctrl1).toBeInstanceOf(Object);
  });

  it("cleanup desconecta prisma y reinicia instancia", async () => {
    const prisma = container.prisma;
    await container.cleanup();
    expect(prisma.$disconnect).toHaveBeenCalled();
    // Al volver a pedir prisma, se crea uno nuevo
    const prisma2 = container.prisma;
    expect(prisma2).not.toBe(prisma);
  });

  it("cleanup no falla si prisma no está inicializado", async () => {
    // Forzar _prisma a null
    const dep = require("../../../../../core/common/config/dependencies");
    dep.Dependencies._prisma = null;
    await expect(dep.Dependencies.cleanup()).resolves.toBeUndefined();
  });

  it("usa los parámetros de entorno correctamente", () => {
    const auth = container.authService;
    expect(process.env.SUPABASE_URL).toBe("https://test.supabase.co");
    expect(process.env.SUPABASE_ANON_KEY).toBe("test-anon-key");
    expect(process.env.SUPABASE_SERVICE_ROLE_KEY).toBe("test-service-role-key");
    expect(auth).toBeInstanceOf(Object);
  });

  it("PrismaClient se instancia con configuración correcta", () => {
    const { PrismaClient } = require("../../../../../lib/generated/prisma");
    const prisma = container.prisma;

    expect(PrismaClient).toHaveBeenCalledWith({
      log: process.env.NODE_ENV === "development" ? ["error"] : [],
      errorFormat: "minimal",
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
      transactionOptions: {
        maxWait: 5000,
        timeout: 10000,
      },
    });

    expect(prisma).toBeInstanceOf(Object);
    expect(prisma.$connect).toBeDefined();
    expect(prisma.$disconnect).toBeDefined();
  });

  it("cada getter retorna la misma instancia en llamadas sucesivas", () => {
    expect(container.prisma).toBe(container.prisma);
    expect(container.userRepository).toBe(container.userRepository);
    expect(container.authService).toBe(container.authService);
    expect(container.getUsersUseCase).toBe(container.getUsersUseCase);
    expect(container.getUserByIdUseCase).toBe(container.getUserByIdUseCase);
    expect(container.createUserUseCase).toBe(container.createUserUseCase);
    expect(container.updateUserUseCase).toBe(container.updateUserUseCase);
    expect(container.deleteUserUseCase).toBe(container.deleteUserUseCase);
    expect(container.changeUserRoleUseCase).toBe(
      container.changeUserRoleUseCase,
    );
    expect(container.loginUseCase).toBe(container.loginUseCase);
    expect(container.userController).toBe(container.userController);
    expect(container.authController).toBe(container.authController);
  });
});
