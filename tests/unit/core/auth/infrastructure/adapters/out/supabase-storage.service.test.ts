import type { SupabaseConfig } from "../../../../../../../core/auth/infrastructure/adapters/out/supabase-storage.service";
import { SupabaseStorageService } from "../../../../../../../core/auth/infrastructure/adapters/out/supabase-storage.service";

const mockListBuckets = jest.fn();
const mockList = jest.fn();
const mockRemove = jest.fn();
const mockFrom = jest.fn(() => ({ list: mockList, remove: mockRemove }));
const mockStorage = { listBuckets: mockListBuckets, from: mockFrom };
const mockSupabaseClient = { storage: mockStorage };

const createClient = jest.fn(() => mockSupabaseClient);

jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn(function () {
    // eslint-disable-next-line prefer-rest-params
    return createClient.apply(this, arguments as any);
  }),
}));

describe("SupabaseStorageService", () => {
  const config: SupabaseConfig = {
    url: "https://test.supabase.co",
    key: "anon-key",
    serviceRoleKey: "service-role-key",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("inicializa correctamente con y sin serviceRoleKey", () => {
    new SupabaseStorageService(config);
    expect(createClient).toHaveBeenCalledWith(config.url, config.key);
    expect(createClient).toHaveBeenCalledWith(
      config.url,
      config.serviceRoleKey,
    );

    const configSinRole: SupabaseConfig = { url: "url", key: "key" };
    new SupabaseStorageService(configSinRole);
    expect(createClient).toHaveBeenCalledWith("url", "key");
  });

  it("getClient retorna el cliente si está inicializado", () => {
    const service = new SupabaseStorageService(config);
    expect((service as any).getClient()).toBe(mockSupabaseClient);
  });

  it("getClient lanza error si no está inicializado", () => {
    const service = new SupabaseStorageService(config);
    (service as any).client = null;
    expect(() => (service as any).getClient()).toThrow(
      "Supabase client not initialized",
    );
  });

  it("getAdminClient retorna el admin si está inicializado", () => {
    const service = new SupabaseStorageService(config);
    expect((service as any).getAdminClient()).toBe(mockSupabaseClient);
  });

  it("getAdminClient lanza error si no está inicializado", () => {
    const service = new SupabaseStorageService({ url: "url", key: "key" });
    (service as any).adminClient = null;
    expect(() => (service as any).getAdminClient()).toThrow(
      "Supabase admin client not initialized. Service role key required.",
    );
  });

  describe("deleteUserFiles", () => {
    it("elimina todos los archivos del usuario exitosamente", async () => {
      mockListBuckets.mockResolvedValue({
        data: [{ name: "bucket1" }],
        error: null,
      });
      mockList.mockResolvedValue({
        data: [{ name: "file1" }, { name: "file2" }],
        error: null,
      });
      mockRemove.mockResolvedValue({ error: null });
      const service = new SupabaseStorageService(config);
      const result = await service.deleteUserFiles("user1");
      expect(result).toBe(true);
      expect(mockRemove).toHaveBeenCalledWith(["user1/file1", "user1/file2"]);
    });

    it("devuelve false si hay error al listar buckets", async () => {
      mockListBuckets.mockResolvedValue({ data: null, error: "error" });
      const service = new SupabaseStorageService(config);
      const result = await service.deleteUserFiles("user1");
      expect(result).toBe(false);
    });

    it("continúa si hay error al listar archivos de un bucket", async () => {
      mockListBuckets.mockResolvedValue({
        data: [{ name: "bucket1" }, { name: "bucket2" }],
        error: null,
      });
      mockList
        .mockResolvedValueOnce({ data: null, error: "error" })
        .mockResolvedValueOnce({ data: [{ name: "file1" }], error: null });
      mockRemove.mockResolvedValue({ error: null });
      const service = new SupabaseStorageService(config);
      const result = await service.deleteUserFiles("user1");
      expect(result).toBe(true);
      expect(mockRemove).toHaveBeenCalledWith(["user1/file1"]);
    });

    it("devuelve false si hay error al borrar archivos", async () => {
      mockListBuckets.mockResolvedValue({
        data: [{ name: "bucket1" }],
        error: null,
      });
      mockList.mockResolvedValue({ data: [{ name: "file1" }], error: null });
      mockRemove.mockResolvedValue({ error: "delete error" });
      const service = new SupabaseStorageService(config);
      const result = await service.deleteUserFiles("user1");
      expect(result).toBe(false);
    });

    it("devuelve true si no hay archivos para borrar", async () => {
      mockListBuckets.mockResolvedValue({
        data: [{ name: "bucket1" }],
        error: null,
      });
      mockList.mockResolvedValue({ data: [], error: null });
      const service = new SupabaseStorageService(config);
      const result = await service.deleteUserFiles("user1");
      expect(result).toBe(true);
    });

    it("devuelve false si ocurre un error inesperado", async () => {
      mockListBuckets.mockImplementation(() => {
        throw new Error("fail");
      });
      const service = new SupabaseStorageService(config);
      const result = await service.deleteUserFiles("user1");
      expect(result).toBe(false);
    });
  });

  describe("deleteAllUserFiles", () => {
    it("elimina todos los archivos de todos los usuarios exitosamente", async () => {
      mockListBuckets.mockResolvedValue({
        data: [{ name: "bucket1" }],
        error: null,
      });
      mockList.mockResolvedValue({
        data: [{ name: "file1" }, { name: "file2" }],
        error: null,
      });
      mockRemove.mockResolvedValue({ error: null });
      const service = new SupabaseStorageService(config);
      const result = await service.deleteAllUserFiles();
      expect(result).toBe(true);
      expect(mockRemove).toHaveBeenCalledWith(["file1", "file2"]);
    });

    it("devuelve false si hay error al listar buckets", async () => {
      mockListBuckets.mockResolvedValue({ data: null, error: "error" });
      const service = new SupabaseStorageService(config);
      const result = await service.deleteAllUserFiles();
      expect(result).toBe(false);
    });

    it("continúa si hay error al listar archivos de un bucket", async () => {
      mockListBuckets.mockResolvedValue({
        data: [{ name: "bucket1" }, { name: "bucket2" }],
        error: null,
      });
      mockList
        .mockResolvedValueOnce({ data: null, error: "error" })
        .mockResolvedValueOnce({ data: [{ name: "file1" }], error: null });
      mockRemove.mockResolvedValue({ error: null });
      const service = new SupabaseStorageService(config);
      const result = await service.deleteAllUserFiles();
      expect(result).toBe(true);
      expect(mockRemove).toHaveBeenCalledWith(["file1"]);
    });

    it("devuelve false si hay error al borrar archivos", async () => {
      mockListBuckets.mockResolvedValue({
        data: [{ name: "bucket1" }],
        error: null,
      });
      mockList.mockResolvedValue({ data: [{ name: "file1" }], error: null });
      mockRemove.mockResolvedValue({ error: "delete error" });
      const service = new SupabaseStorageService(config);
      const result = await service.deleteAllUserFiles();
      expect(result).toBe(false);
    });

    it("devuelve true si no hay archivos para borrar", async () => {
      mockListBuckets.mockResolvedValue({
        data: [{ name: "bucket1" }],
        error: null,
      });
      mockList.mockResolvedValue({ data: [], error: null });
      const service = new SupabaseStorageService(config);
      const result = await service.deleteAllUserFiles();
      expect(result).toBe(true);
    });

    it("devuelve false si ocurre un error inesperado", async () => {
      mockListBuckets.mockImplementation(() => {
        throw new Error("fail");
      });
      const service = new SupabaseStorageService(config);
      const result = await service.deleteAllUserFiles();
      expect(result).toBe(false);
    });
  });

  describe("listUserFiles", () => {
    it("lista todos los archivos del usuario exitosamente", async () => {
      mockListBuckets.mockResolvedValue({
        data: [{ name: "bucket1" }],
        error: null,
      });
      mockList.mockResolvedValue({
        data: [{ name: "file1" }, { name: "file2" }],
        error: null,
      });
      const service = new SupabaseStorageService(config);
      const result = await service.listUserFiles("user1");
      expect(result).toEqual(["bucket1/user1/file1", "bucket1/user1/file2"]);
    });

    it("devuelve [] si hay error al listar buckets", async () => {
      mockListBuckets.mockResolvedValue({ data: null, error: "error" });
      const service = new SupabaseStorageService(config);
      const result = await service.listUserFiles("user1");
      expect(result).toEqual([]);
    });

    it("continúa si hay error al listar archivos de un bucket", async () => {
      mockListBuckets.mockResolvedValue({
        data: [{ name: "bucket1" }, { name: "bucket2" }],
        error: null,
      });
      mockList
        .mockResolvedValueOnce({ data: null, error: "error" })
        .mockResolvedValueOnce({ data: [{ name: "file1" }], error: null });
      const service = new SupabaseStorageService(config);
      const result = await service.listUserFiles("user1");
      expect(result).toEqual(["bucket2/user1/file1"]);
    });

    it("devuelve [] si no hay archivos", async () => {
      mockListBuckets.mockResolvedValue({
        data: [{ name: "bucket1" }],
        error: null,
      });
      mockList.mockResolvedValue({ data: [], error: null });
      const service = new SupabaseStorageService(config);
      const result = await service.listUserFiles("user1");
      expect(result).toEqual([]);
    });

    it("devuelve [] si ocurre un error inesperado", async () => {
      mockListBuckets.mockImplementation(() => {
        throw new Error("fail");
      });
      const service = new SupabaseStorageService(config);
      const result = await service.listUserFiles("user1");
      expect(result).toEqual([]);
    });
  });
});
