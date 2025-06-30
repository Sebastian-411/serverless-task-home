import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@supabase/supabase-js';

import type { AuthServicePort, AuthUser, AuthResult } from '../../../domain/ports/out/auth-service.port';

import { SupabaseStorageService } from './supabase-storage.service';

export interface SupabaseConfig {
  url: string;
  key: string;
  serviceRoleKey?: string;
}

export class SupabaseAuthService implements AuthServicePort {
  private client: SupabaseClient | null = null;
  private adminClient: SupabaseClient | null = null;
  private storageService: SupabaseStorageService;

  /**
   * Constructs a new SupabaseAuthService and initializes clients and storage service.
   *
   * @param {SupabaseConfig} config - The Supabase configuration.
   */
  constructor(private config: SupabaseConfig) {
    console.log('[SupabaseAuthService][constructor] Initializing SupabaseAuthService', { url: config.url });
    this.initialize();
    this.storageService = new SupabaseStorageService(config);
  }

  /**
   * Initializes the Supabase client and admin client if service role key is provided.
   */
  private initialize(): void {
    this.client = createClient(this.config.url, this.config.key);
    
    // Crear cliente admin con service role key si está disponible
    if (this.config.serviceRoleKey) {
      this.adminClient = createClient(this.config.url, this.config.serviceRoleKey);
    }
  }

  /**
   * Gets the regular Supabase client.
   *
   * @returns {SupabaseClient} The Supabase client.
   * @throws {Error} If the client is not initialized.
   */
  private getClient(): SupabaseClient {
    if (!this.client) {
      console.error('[SupabaseAuthService][getClient] Supabase client not initialized');
      throw new Error('Supabase client not initialized');
    }
    return this.client;
  }

  /**
   * Gets the admin Supabase client (requires service role key).
   *
   * @returns {SupabaseClient} The admin Supabase client.
   * @throws {Error} If the admin client is not initialized.
   */
  private getAdminClient(): SupabaseClient {
    if (!this.adminClient) {
      console.error('[SupabaseAuthService][getAdminClient] Supabase admin client not initialized');
      throw new Error('Supabase admin client not initialized. Service role key required.');
    }
    return this.adminClient;
  }

  /**
   * Creates a new user in Supabase Auth.
   *
   * @param {string} email - The user's email address.
   * @param {string} password - The user's password.
   * @returns {Promise<AuthUser | null>} The created AuthUser or null if failed.
   * @throws {Error} If the operation fails unexpectedly.
   */
  async createUser(email: string, password: string): Promise<AuthUser | null> {
    console.log('[SupabaseAuthService][createUser] Creating user', { email });
    try {
      const supabase = this.getClient();
      const { data: { user }, error } = await supabase.auth.signUp({
        email,
        password
      });

      if (error || !user) {
        console.warn('[SupabaseAuthService][createUser] Failed to create user', { email, error });
        return null;
      }

      return {
        id: user.id,
        email: user.email ?? '',
        emailVerified: user.email_confirmed_at !== null
      };
    } catch (error) {
      console.error('[SupabaseAuthService][createUser] Unexpected error creating user', { email, error });
      return null;
    }
  }

  /**
   * Authenticates a user with email and password.
   *
   * @param {string} email - The user's email address.
   * @param {string} password - The user's password.
   * @returns {Promise<AuthResult | null>} The authentication result or null if failed.
   * @throws {Error} If the operation fails unexpectedly.
   */
  async authenticateUser(email: string, password: string): Promise<AuthResult | null> {
    console.log('[SupabaseAuthService][authenticateUser] Authenticating user', { email });
    try {
      const supabase = this.getClient();
      const { data: { user, session }, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error || !user || !session) {
        console.warn('[SupabaseAuthService][authenticateUser] Failed to authenticate user', { email, error });
        return null;
      }

      return {
        user: {
          id: user.id,
          email: user.email ?? '',
          emailVerified: user.email_confirmed_at !== null
        },
        token: session.access_token
      };
    } catch (error) {
      console.error('[SupabaseAuthService][authenticateUser] Unexpected error authenticating user', { email, error });
      return null;
    }
  }

  /**
   * Verifies a Supabase Auth token and returns the associated user.
   *
   * @param {string} token - The authentication token.
   * @returns {Promise<AuthUser | null>} The authenticated user or null if invalid.
   * @throws {Error} If the operation fails unexpectedly.
   */
  async verifyToken(token: string): Promise<AuthUser | null> {
    console.log('[SupabaseAuthService][verifyToken] Verifying token');
    try {
      const supabase = this.getClient();
      const { data: { user }, error } = await supabase.auth.getUser(token);

      if (error || !user) {
        console.warn('[SupabaseAuthService][verifyToken] Failed to verify token', { error });
        return null;
      }

      return {
        id: user.id,
        email: user.email ?? '',
        emailVerified: user.email_confirmed_at !== null
      };
    } catch (error) {
      console.error('[SupabaseAuthService][verifyToken] Unexpected error verifying token', { error });
      return null;
    }
  }

  /**
   * Sends a password reset email to the user.
   *
   * @param {string} email - The user's email address.
   * @returns {Promise<boolean>} True if the email was sent, false otherwise.
   * @throws {Error} If the operation fails unexpectedly.
   */
  async resetPassword(email: string): Promise<boolean> {
    console.log('[SupabaseAuthService][resetPassword] Resetting password', { email });
    try {
      const supabase = this.getClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) {
        console.warn('[SupabaseAuthService][resetPassword] Failed to send reset email', { email, error });
      }
      return !error;
    } catch (error) {
      console.error('[SupabaseAuthService][resetPassword] Unexpected error resetting password', { email, error });
      return false;
    }
  }

  /**
   * Updates a user's password (admin only).
   *
   * @param {string} userId - The user ID.
   * @param {string} newPassword - The new password.
   * @returns {Promise<boolean>} True if the password was updated, false otherwise.
   * @throws {Error} If the operation fails unexpectedly.
   */
  async updatePassword(userId: string, newPassword: string): Promise<boolean> {
    console.log('[SupabaseAuthService][updatePassword] Updating user password', { userId });
    try {
      const supabase = this.getAdminClient();
      const { error } = await supabase.auth.admin.updateUserById(userId, {
        password: newPassword
      });
      if (error) {
        console.warn('[SupabaseAuthService][updatePassword] Failed to update password', { userId, error });
      }
      return !error;
    } catch (error) {
      console.error('[SupabaseAuthService][updatePassword] Unexpected error updating password', { userId, error });
      return false;
    }
  }

  /**
   * Deletes a user and all their files from Supabase Auth and Storage.
   *
   * @param {string} userId - The user ID to delete.
   * @returns {Promise<boolean>} True if the user was deleted, false otherwise.
   * @throws {Error} If the operation fails unexpectedly.
   */
  async deleteUser(userId: string): Promise<boolean> {
    console.log('[SupabaseAuthService][deleteUser] Deleting user from Supabase Auth and Storage', { userId });
    try {
      console.log('[SupabaseAuthService][deleteUser] Deleting user files from Storage', { userId });
      const storageDeleted = await this.storageService.deleteUserFiles(userId);
      
      if (!storageDeleted) {
        console.warn('[SupabaseAuthService][deleteUser] Some user files could not be deleted from Storage', { userId });
      } else {
        console.log('[SupabaseAuthService][deleteUser] User files deleted from Storage', { userId });
      }

      console.log('[SupabaseAuthService][deleteUser] Deleting user from Auth', { userId });
      const supabase = this.getAdminClient();
      const { error } = await supabase.auth.admin.deleteUser(userId);
      
      if (error) {
        console.error('[SupabaseAuthService][deleteUser] Error deleting user from Auth', { userId, error });
        return false;
      }

      console.log('[SupabaseAuthService][deleteUser] User deleted from Auth', { userId });
      return true;
    } catch (error) {
      console.error('[SupabaseAuthService][deleteUser] Unexpected error deleting user', { userId, error });
      return false;
    }
  }

  /**
   * Deletes all users and their files from Supabase (for a full reset).
   *
   * @returns {Promise<boolean>} True if all users were deleted, false otherwise.
   * @throws {Error} If the operation fails unexpectedly.
   */
  async deleteAllUsers(): Promise<boolean> {
    console.log('[SupabaseAuthService][deleteAllUsers] Deleting all users and files from Supabase');
    try {
      console.log('[SupabaseAuthService][deleteAllUsers] Deleting all files from Storage');
      const storageDeleted = await this.storageService.deleteAllUserFiles();
      
      if (!storageDeleted) {
        console.warn('[SupabaseAuthService][deleteAllUsers] Some files could not be deleted from Storage');
      } else {
        console.log('[SupabaseAuthService][deleteAllUsers] All files deleted from Storage');
      }

      console.log('[SupabaseAuthService][deleteAllUsers] Deleting all users from Auth');
      const supabase = this.getAdminClient();
      
      // Obtener todos los usuarios (esto requiere permisos de admin)
      const { data: users, error: listError } = await supabase.auth.admin.listUsers();
      
      if (listError) {
        console.error('[SupabaseAuthService][deleteAllUsers] Error listing users from Auth', { error: listError });
        return false;
      }

      let allDeleted = true;
      
      for (const user of users.users) {
        const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
        
        if (deleteError) {
          console.error('[SupabaseAuthService][deleteAllUsers] Error deleting user', { userId: user.id, error: deleteError });
          allDeleted = false;
        } else {
          console.log('[SupabaseAuthService][deleteAllUsers] Deleted user', { email: user.email });
        }
      }

      console.log('[SupabaseAuthService][deleteAllUsers] All users deleted from Auth');
      return allDeleted;
    } catch (error) {
      console.error('[SupabaseAuthService][deleteAllUsers] Unexpected error deleting all users', { error });
      return false;
    }
  }
} 