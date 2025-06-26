/**
 * Supabase Configuration and Client
 * Handles authentication and real-time features
 */

const { createClient } = require('@supabase/supabase-js');

/**
 * Validates required Supabase environment variables
 * @throws {Error} If required variables are missing
 */
function validateSupabaseConfig() {
  const requiredVars = {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY
  };

  const missingVars = Object.entries(requiredVars)
    .filter(([key, value]) => !value)
    .map(([key]) => key);

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required Supabase environment variables: ${missingVars.join(', ')}\n` +
      'Please check your .env file and ensure these variables are set.'
    );
  }

  // Validate URL format
  try {
    new URL(requiredVars.SUPABASE_URL);
  } catch (error) {
    throw new Error('SUPABASE_URL must be a valid URL');
  }

  return requiredVars;
}

/**
 * Creates configured Supabase client with optimizations
 * @returns {SupabaseClient} Configured Supabase client
 */
function createSupabaseClient() {
  const config = validateSupabaseConfig();
  
  return createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY, {
    auth: {
      // Configure auth persistence
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false, // Disable for server-side usage
      
      // Storage configuration for server environments
      storage: {
        getItem: (key) => {
          // In serverless environments, use in-memory storage
          return global[`sb-${key}`] || null;
        },
        setItem: (key, value) => {
          global[`sb-${key}`] = value;
        },
        removeItem: (key) => {
          delete global[`sb-${key}`];
        }
      }
    },
    
    // Database configuration
    db: {
      schema: 'public'
    },
    
    // Global headers
    global: {
      headers: {
        'X-Client-Info': 'serverless-task-app'
      }
    },
    
    // Realtime configuration (disabled for serverless)
    realtime: {
      disabled: true // Disable realtime for server-side usage
    }
  });
}

/**
 * Singleton Supabase client instance
 */
let supabaseInstance = null;

/**
 * Gets or creates the singleton Supabase client
 * @returns {SupabaseClient} Supabase client instance
 */
function getSupabaseClient() {
  if (!supabaseInstance) {
    supabaseInstance = createSupabaseClient();
  }
  return supabaseInstance;
}

/**
 * Supabase service class with common operations
 */
class SupabaseService {
  constructor() {
    this.client = getSupabaseClient();
  }

  /**
   * Sign up a new user
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {Object} metadata - Additional user data
   * @returns {Promise<Object>} Auth response
   */
  async signUp(email, password, metadata = {}) {
    try {
      const { data, error } = await this.client.auth.signUp({
        email,
        password,
        options: {
          data: metadata
        }
      });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Supabase signUp error:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Sign in user with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} Auth response
   */
  async signIn(email, password) {
    try {
      const { data, error } = await this.client.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Supabase signIn error:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Sign out current user
   * @returns {Promise<Object>} Response
   */
  async signOut() {
    try {
      const { error } = await this.client.auth.signOut();
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Supabase signOut error:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get current user
   * @returns {Promise<Object>} User data or null
   */
  async getCurrentUser() {
    try {
      const { data: { user }, error } = await this.client.auth.getUser();
      if (error) throw error;
      return user;
    } catch (error) {
      console.error('Supabase getCurrentUser error:', error.message);
      return null;
    }
  }

  /**
   * Verify JWT token and get user
   * @param {string} token - JWT token
   * @returns {Promise<Object>} User data or null
   */
  async verifyToken(token) {
    try {
      const { data: { user }, error } = await this.client.auth.getUser(token);
      if (error) throw error;
      return user;
    } catch (error) {
      console.error('Supabase token verification error:', error.message);
      return null;
    }
  }

  /**
   * Reset password
   * @param {string} email - User email
   * @returns {Promise<Object>} Response
   */
  async resetPassword(email) {
    try {
      const { error } = await this.client.auth.resetPasswordForEmail(email);
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Supabase resetPassword error:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update user password
   * @param {string} newPassword - New password
   * @returns {Promise<Object>} Response
   */
  async updatePassword(newPassword) {
    try {
      const { error } = await this.client.auth.updateUser({
        password: newPassword
      });
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Supabase updatePassword error:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Health check for Supabase connection
   * @returns {Promise<boolean>} True if Supabase is accessible
   */
  async healthCheck() {
    try {
      // Simple query to test connection
      const { data, error } = await this.client
        .from('users')
        .select('count')
        .limit(1);
      
      return !error;
    } catch (error) {
      console.error('Supabase health check failed:', error.message);
      return false;
    }
  }
}

// Export singleton instance
const supabaseService = new SupabaseService();

module.exports = {
  getSupabaseClient,
  createSupabaseClient,
  validateSupabaseConfig,
  supabaseService,
  SupabaseService
}; 