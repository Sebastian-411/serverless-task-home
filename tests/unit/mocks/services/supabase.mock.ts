/**
 * Mock for SupabaseService
 * Provides comprehensive mocking for all Supabase operations
 */

export const mockSupabaseUser = {
  id: 'supabase-user-1',
  email: 'test@example.com',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  confirmed_at: '2024-01-01T00:00:00Z'
};

export const mockSupabaseSession = {
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_in: 3600,
  expires_at: Date.now() + 3600000,
  token_type: 'bearer',
  user: mockSupabaseUser
};

export const createMockSupabaseService = () => {
  const mockSupabaseService = {
    createUser: jest.fn(),
    signIn: jest.fn(),
    signOut: jest.fn(),
    getUser: jest.fn(),
    updateUser: jest.fn(),
    deleteUser: jest.fn(),
    verifyToken: jest.fn(),
    refreshSession: jest.fn(),
    resetPassword: jest.fn(),
    updatePassword: jest.fn()
  };

  // Default successful implementations
  mockSupabaseService.createUser.mockResolvedValue({
    user: mockSupabaseUser,
    error: null
  });

  mockSupabaseService.signIn.mockResolvedValue({
    user: mockSupabaseUser,
    session: mockSupabaseSession,
    error: null
  });

  mockSupabaseService.signOut.mockResolvedValue({
    error: null
  });

  mockSupabaseService.getUser.mockResolvedValue({
    user: mockSupabaseUser,
    error: null
  });

  mockSupabaseService.updateUser.mockResolvedValue({
    user: { ...mockSupabaseUser, updated_at: new Date().toISOString() },
    error: null
  });

  mockSupabaseService.deleteUser.mockResolvedValue({
    user: mockSupabaseUser,
    error: null
  });

  mockSupabaseService.verifyToken.mockResolvedValue({
    user: mockSupabaseUser,
    error: null
  });

  mockSupabaseService.refreshSession.mockResolvedValue({
    session: mockSupabaseSession,
    error: null
  });

  mockSupabaseService.resetPassword.mockResolvedValue({
    error: null
  });

  mockSupabaseService.updatePassword.mockResolvedValue({
    user: mockSupabaseUser,
    error: null
  });

  return mockSupabaseService;
};

export const mockSupabaseService = createMockSupabaseService();

// Mock the actual SupabaseService module
jest.mock('../../../shared/auth/supabase.service', () => ({
  SupabaseService: mockSupabaseService
})); 