/**
 * Tests for HttpUserController
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";

import { HttpUserController } from "../../../../../../../core/user/infrastructure/adapters/in/http-user-controller";

// Mocks de dependencias
const mockCreateUserUseCase = { execute: jest.fn() } as any;
const mockGetUsersUseCase = { execute: jest.fn() } as any;
const mockGetUserByIdUseCase = { execute: jest.fn() } as any;
const mockUpdateUserUseCase = { execute: jest.fn() } as any;
const mockDeleteUserUseCase = { execute: jest.fn() } as any;
const mockChangeUserRoleUseCase = { execute: jest.fn() } as any;

jest.mock(
  "../../../../../../../core/common/config/middlewares/validation.middleware",
  () => ({
    validateEmail: jest.fn(),
    validatePassword: jest.fn(),
    validateLength: jest.fn(),
  }),
);
jest.mock(
  "../../../../../../../core/common/config/middlewares/error-handler.middleware",
  () => ({
    handleError: jest.fn((err, req, res) =>
      res.status(500).json({ error: "handled", message: err.message }),
    ),
  }),
);
const mockAuthContext = { user: { id: "user-1", role: "admin" } };
jest.mock(
  "../../../../../../../core/common/config/middlewares/auth.middleware",
  () => ({
    authenticate: jest.fn(() => Promise.resolve(mockAuthContext)),
  }),
);

// Importar los mocks
const {
  authenticate,
} = require("../../../../../../../core/common/config/middlewares/auth.middleware");

describe("HttpUserController", () => {
  let controller: HttpUserController;
  let validateEmail: jest.MockedFunction<any>;
  let validatePassword: jest.MockedFunction<any>;
  let validateLength: jest.MockedFunction<any>;

  beforeEach(() => {
    jest.clearAllMocks();
    // Configurar mocks de validación
    const validationModule = require("../../../../../../../core/common/config/middlewares/validation.middleware");
    validateEmail = validationModule.validateEmail;
    validatePassword = validationModule.validatePassword;
    validateLength = validationModule.validateLength;
    validateEmail.mockImplementation((email) => email && email.includes("@"));
    validatePassword.mockImplementation((pass) => pass && pass.length >= 8);
    validateLength.mockImplementation(
      (val, min, max) => val && val.length >= min && val.length <= max,
    );
    controller = new HttpUserController(
      mockCreateUserUseCase as any,
      mockGetUsersUseCase as any,
      mockGetUserByIdUseCase as any,
      mockUpdateUserUseCase as any,
      mockDeleteUserUseCase as any,
      mockChangeUserRoleUseCase as any,
    );
  });

  describe("getUsers", () => {
    it("valida page inválido", async () => {
      jest.clearAllMocks();
      const req = {
        method: "GET",
        query: { page: "1001" },
        body: {},
      } as unknown as VercelRequest;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      } as unknown as VercelResponse;
      authenticate.mockResolvedValue({ user: { id: "user-1", role: "admin" } });
      // Asegurar que el use case no se ejecute
      mockGetUsersUseCase.execute.mockImplementation(() => {
        throw new Error("Use case should not be called");
      });
      await controller.getUsers(req, res);
      expect(res.status).toHaveBeenNthCalledWith(1, 400);
      expect(mockGetUsersUseCase.execute).not.toHaveBeenCalled();
    });
    it("valida limit inválido", async () => {
      jest.clearAllMocks();
      const req = {
        method: "GET",
        query: { limit: "101" },
        body: {},
      } as unknown as VercelRequest;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      } as unknown as VercelResponse;
      authenticate.mockResolvedValue({ user: { id: "user-1", role: "admin" } });
      // Asegurar que el use case no se ejecute
      mockGetUsersUseCase.execute.mockImplementation(() => {
        throw new Error("Use case should not be called");
      });
      await controller.getUsers(req, res);
      expect(res.status).toHaveBeenNthCalledWith(1, 400);
      expect(mockGetUsersUseCase.execute).not.toHaveBeenCalled();
    });
    it("devuelve usuarios exitosamente", async () => {
      const req = {
        method: "GET",
        query: { page: "1", limit: "2" },
        body: {},
      } as unknown as VercelRequest;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      } as unknown as VercelResponse;
      mockGetUsersUseCase.execute.mockResolvedValue({
        users: [
          {
            id: "1",
            name: "Juan Pérez",
            email: "juan@example.com",
            role: "USER",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        total: 1,
        page: 1,
        limit: 2,
      });
      await controller.getUsers(req, res);
      expect(mockGetUsersUseCase.execute).toHaveBeenCalledWith(
        { user: { id: "user-1", role: "admin" } },
        { page: 1, limit: 2 },
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        data: [
          {
            id: "1",
            name: "Juan Pérez",
            email: "juan@example.com",
            role: "USER",
            createdAt: expect.any(Date),
            updatedAt: expect.any(Date),
          },
        ],
        message: "Users retrieved successfully",
        meta: {
          count: 1,
          total: 1,
          page: 1,
          limit: 2,
          totalPages: 1,
        },
      });
    });
    it("valida método no permitido", async () => {
      const req = {
        method: "POST",
        query: {},
        body: {},
      } as unknown as VercelRequest;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      } as unknown as VercelResponse;
      await controller.getUsers(req, res);
      expect(res.status).toHaveBeenCalledWith(405);
    });
    it("maneja error inesperado", async () => {
      const req = {
        method: "GET",
        query: {},
        body: {},
      } as unknown as VercelRequest;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      } as unknown as VercelResponse;
      mockGetUsersUseCase.execute.mockRejectedValue(new Error("fail"));
      await controller.getUsers(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("createUser", () => {
    beforeEach(() => {});
    it("crea usuario exitosamente", async () => {
      const req = {
        method: "POST",
        body: {
          name: "A",
          email: "a@a.com",
          password: "Abcdefg1",
          phoneNumber: "1234567890",
        },
      } as unknown as VercelRequest;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      } as unknown as VercelResponse;
      mockCreateUserUseCase.execute.mockResolvedValue({ id: "1" });
      await controller.createUser(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true }),
      );
    });
    it("valida método no permitido", async () => {
      const req = { method: "GET", body: {} } as unknown as VercelRequest;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      } as unknown as VercelResponse;
      await controller.createUser(req, res);
      expect(res.status).toHaveBeenCalledWith(405);
    });
    it("valida nombre requerido", async () => {
      const req = {
        method: "POST",
        body: {
          email: "a@a.com",
          password: "Abcdefg1",
          phoneNumber: "1234567890",
        },
      } as unknown as VercelRequest;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      } as unknown as VercelResponse;
      await controller.createUser(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
    it("valida email requerido", async () => {
      const req = {
        method: "POST",
        body: { name: "A", password: "Abcdefg1", phoneNumber: "1234567890" },
      } as unknown as VercelRequest;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      } as unknown as VercelResponse;
      await controller.createUser(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
    it("valida password requerido", async () => {
      const req = {
        method: "POST",
        body: { name: "A", email: "a@a.com", phoneNumber: "1234567890" },
      } as unknown as VercelRequest;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      } as unknown as VercelResponse;
      await controller.createUser(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
    it("valida phoneNumber requerido", async () => {
      const req = {
        method: "POST",
        body: { name: "A", email: "a@a.com", password: "Abcdefg1" },
      } as unknown as VercelRequest;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      } as unknown as VercelResponse;
      await controller.createUser(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
    it("valida role inválido", async () => {
      const req = {
        method: "POST",
        body: {
          name: "A",
          email: "a@a.com",
          password: "Abcdefg1",
          phoneNumber: "1234567890",
          role: "super",
        },
      } as unknown as VercelRequest;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      } as unknown as VercelResponse;
      await controller.createUser(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
    it("maneja error inesperado", async () => {
      const req = {
        method: "POST",
        body: {
          name: "A",
          email: "a@a.com",
          password: "Abcdefg1",
          phoneNumber: "1234567890",
        },
      } as unknown as VercelRequest;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      } as unknown as VercelResponse;
      mockCreateUserUseCase.execute.mockRejectedValue(new Error("fail"));
      await controller.createUser(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("getUserById", () => {
    beforeEach(() => {});
    it("devuelve usuario exitosamente", async () => {
      const req = {
        method: "GET",
        query: { id: "1" },
        body: {},
      } as unknown as VercelRequest;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      } as unknown as VercelResponse;
      mockGetUserByIdUseCase.execute.mockResolvedValue({ id: "1" });
      await controller.getUserById(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ data: { id: "1" } }),
      );
    });
    it("valida método no permitido", async () => {
      const req = {
        method: "POST",
        query: {},
        body: {},
      } as unknown as VercelRequest;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      } as unknown as VercelResponse;
      await controller.getUserById(req, res);
      expect(res.status).toHaveBeenCalledWith(405);
    });
    it("valida id requerido", async () => {
      const req = {
        method: "GET",
        query: {},
        body: {},
      } as unknown as VercelRequest;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      } as unknown as VercelResponse;
      await controller.getUserById(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
    it("maneja error inesperado", async () => {
      const req = {
        method: "GET",
        query: { id: "1" },
        body: {},
      } as unknown as VercelRequest;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      } as unknown as VercelResponse;
      mockGetUserByIdUseCase.execute.mockRejectedValue(new Error("fail"));
      await controller.getUserById(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("updateUser", () => {
    beforeEach(() => {});
    it("actualiza usuario exitosamente", async () => {
      const req = {
        method: "PUT",
        query: { id: "1" },
        body: { name: "Nuevo" },
      } as unknown as VercelRequest;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      } as unknown as VercelResponse;
      mockUpdateUserUseCase.execute.mockResolvedValue({ id: "1" });
      await controller.updateUser(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ data: { id: "1" } }),
      );
    });
    it("valida método no permitido", async () => {
      const req = {
        method: "GET",
        query: { id: "1" },
        body: {},
      } as unknown as VercelRequest;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      } as unknown as VercelResponse;
      await controller.updateUser(req, res);
      expect(res.status).toHaveBeenCalledWith(405);
    });
    it("valida id requerido", async () => {
      const req = {
        method: "PUT",
        query: {},
        body: {},
      } as unknown as VercelRequest;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      } as unknown as VercelResponse;
      await controller.updateUser(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
    it("valida nombre inválido", async () => {
      const req = {
        method: "PUT",
        query: { id: "1" },
        body: { name: "a".repeat(101) },
      } as unknown as VercelRequest;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      } as unknown as VercelResponse;
      validateLength.mockImplementation((val, min, max) =>
        val && val.length <= max ? true : false,
      );
      await controller.updateUser(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
    it("valida email inválido", async () => {
      const req = {
        method: "PUT",
        query: { id: "1" },
        body: { email: "noemail" },
      } as unknown as VercelRequest;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      } as unknown as VercelResponse;
      validateEmail.mockReturnValue(false);
      await controller.updateUser(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
    it("valida phone inválido", async () => {
      const req = {
        method: "PUT",
        query: { id: "1" },
        body: { phoneNumber: "1" },
      } as unknown as VercelRequest;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      } as unknown as VercelResponse;
      validateLength.mockReturnValue(false);
      await controller.updateUser(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
    it("valida role inválido", async () => {
      const req = {
        method: "PUT",
        query: { id: "1" },
        body: { role: "super" },
      } as unknown as VercelRequest;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      } as unknown as VercelResponse;
      await controller.updateUser(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
    it("maneja error inesperado", async () => {
      const req = {
        method: "PUT",
        query: { id: "1" },
        body: {},
      } as unknown as VercelRequest;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      } as unknown as VercelResponse;
      mockUpdateUserUseCase.execute.mockRejectedValue(new Error("fail"));
      await controller.updateUser(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("deleteUser", () => {
    beforeEach(() => {});
    it("elimina usuario exitosamente", async () => {
      const req = {
        method: "DELETE",
        query: { id: "1" },
        body: {},
      } as unknown as VercelRequest;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      } as unknown as VercelResponse;
      mockDeleteUserUseCase.execute.mockResolvedValue({ id: "1" });
      await controller.deleteUser(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "User deleted successfully",
      });
    });
    it("valida método no permitido", async () => {
      const req = {
        method: "GET",
        query: { id: "1" },
        body: {},
      } as unknown as VercelRequest;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      } as unknown as VercelResponse;
      await controller.deleteUser(req, res);
      expect(res.status).toHaveBeenCalledWith(405);
    });
    it("valida id requerido", async () => {
      const req = {
        method: "DELETE",
        query: {},
        body: {},
      } as unknown as VercelRequest;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      } as unknown as VercelResponse;
      await controller.deleteUser(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
    it("maneja error inesperado", async () => {
      const req = {
        method: "DELETE",
        query: { id: "1" },
        body: {},
      } as unknown as VercelRequest;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      } as unknown as VercelResponse;
      mockDeleteUserUseCase.execute.mockRejectedValue(new Error("fail"));
      await controller.deleteUser(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("changeUserRole", () => {
    beforeEach(() => {});
    it("cambia rol exitosamente", async () => {
      const req = {
        method: "PATCH",
        query: { id: "1" },
        body: { role: "admin" },
      } as unknown as VercelRequest;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      } as unknown as VercelResponse;
      mockChangeUserRoleUseCase.execute.mockResolvedValue({
        id: "1",
        role: "admin",
      });
      await controller.changeUserRole(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ data: { id: "1", role: "admin" } }),
      );
    });
    it("valida método no permitido", async () => {
      const req = {
        method: "GET",
        query: { id: "1" },
        body: {},
      } as unknown as VercelRequest;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      } as unknown as VercelResponse;
      await controller.changeUserRole(req, res);
      expect(res.status).toHaveBeenCalledWith(405);
    });
    it("valida id requerido", async () => {
      const req = {
        method: "PATCH",
        query: {},
        body: {},
      } as unknown as VercelRequest;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      } as unknown as VercelResponse;
      await controller.changeUserRole(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
    it("valida role requerido", async () => {
      const req = {
        method: "PATCH",
        query: { id: "1" },
        body: {},
      } as unknown as VercelRequest;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      } as unknown as VercelResponse;
      await controller.changeUserRole(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
    it("valida role inválido", async () => {
      const req = {
        method: "PATCH",
        query: { id: "1" },
        body: { role: "super" },
      } as unknown as VercelRequest;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      } as unknown as VercelResponse;
      await controller.changeUserRole(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
    it("maneja error inesperado", async () => {
      const req = {
        method: "PATCH",
        query: { id: "1" },
        body: { role: "admin" },
      } as unknown as VercelRequest;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      } as unknown as VercelResponse;
      mockChangeUserRoleUseCase.execute.mockRejectedValue(new Error("fail"));
      await controller.changeUserRole(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
