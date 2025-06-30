import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@supabase/supabase-js';
import type { AuthServicePort, AuthUser } from '../../../domain/ports/out/auth-service.port';

export interface SupabaseConfig {
  url: string;
  key: string;
}

export class SupabaseAuthService implements AuthServicePort {
  private client: SupabaseClient | null = null;

  constructor(private config: SupabaseConfig) {
    this.initialize();
  }

  private initialize(): void {
    this.client = createClient(this.config.url, this.config.key);
  }

  private getClient(): SupabaseClient {
    if (!this.client) {
      throw new Error('Supabase client not initialized');
    }
    return this.client;
  }

  async createUser(email: string, password: string): Promise<AuthUser | null> {
    try {
      const supabase = this.getClient();
      const { data: { user }, error } = await supabase.auth.signUp({
        email,
        password
      });

      if (error || !user) {
        return null;
      }

      return {
        id: user.id,
        email: user.email ?? '',
        emailVerified: user.email_confirmed_at !== null
      };
    } catch (error) {
      console.error('Error creating user in Supabase:', error);
      return null;
    }
  }

  async authenticateUser(email: string, password: string): Promise<AuthUser | null> {
    try {
      const supabase = this.getClient();
      const { data: { user }, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error || !user) {
        return null;
      }

      return {
        id: user.id,
        email: user.email ?? '',
        emailVerified: user.email_confirmed_at !== null
      };
    } catch (error) {
      console.error('Error authenticating user in Supabase:', error);
      return null;
    }
  }

  async verifyToken(token: string): Promise<AuthUser | null> {
    try {
      const supabase = this.getClient();
      const { data: { user }, error } = await supabase.auth.getUser(token);

      if (error || !user) {
        return null;
      }

      return {
        id: user.id,
        email: user.email ?? '',
        emailVerified: user.email_confirmed_at !== null
      };
    } catch (error) {
      console.error('Error verifying token in Supabase:', error);
      return null;
    }
  }

  async resetPassword(email: string): Promise<boolean> {
    try {
      const supabase = this.getClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      return !error;
    } catch (error) {
      console.error('Error resetting password in Supabase:', error);
      return false;
    }
  }

  async updatePassword(userId: string, newPassword: string): Promise<boolean> {
    try {
      const supabase = this.getClient();
      const { error } = await supabase.auth.admin.updateUserById(userId, {
        password: newPassword
      });
      return !error;
    } catch (error) {
      console.error('Error updating password in Supabase:', error);
      return false;
    }
  }

  async deleteUser(userId: string): Promise<boolean> {
    try {
      const supabase = this.getClient();
      const { error } = await supabase.auth.admin.deleteUser(userId);
      return !error;
    } catch (error) {
      console.error('Error deleting user in Supabase:', error);
      return false;
    }
  }
} 