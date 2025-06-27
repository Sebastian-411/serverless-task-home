import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface SupabaseUser {
  id: string;
  email: string;
  role: 'admin' | 'user';
}

export class SupabaseService {
  private static client: SupabaseClient;

  static getClient(): SupabaseClient {
    if (!this.client) {
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase configuration is missing');
      }

      this.client = createClient(supabaseUrl, supabaseKey);
    }
    return this.client;
  }

  static async createUser(email: string, password: string): Promise<{ user: any; error: any }> {
    const supabase = this.getClient();
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    return { user: data.user, error };
  }

  static async signIn(email: string, password: string): Promise<{ data: any; error: any }> {
    const supabase = this.getClient();
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { data, error };
  }

  static async validateToken(token: string, userRepository?: any): Promise<SupabaseUser | null> {
    try {
      const supabase = this.getClient();
      
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (error || !user) {
        return null;
      }

      // If repository is provided, get the real role from the database
      let role: 'admin' | 'user' = 'user';
      
      if (userRepository) {
        try {
          const dbUser = await userRepository.findById(user.id);
          if (dbUser && dbUser.role) {
            role = dbUser.role.toLowerCase() as 'admin' | 'user';
          }
        } catch (dbError) {
          console.warn('Could not fetch user role from database, defaulting to user');
        }
      }

      return {
        id: user.id,
        email: user.email!,
        role: role
      };
    } catch (error) {
      console.error('Error validating token:', error);
      return null;
    }
  }

  static extractTokenFromRequest(req: any): string | null {
    const authHeader = req.headers?.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }
} 