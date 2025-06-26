/**
 * Supabase Client Configuration
 * Handles authentication and database operations
 */

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables. Please check SUPABASE_URL and SUPABASE_ANON_KEY');
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
});

/**
 * Signs up a new user with Supabase Auth
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {Object} metadata - Additional user metadata
 * @returns {Promise<Object>}
 */
async function signUpUser(email, password, metadata = {}) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    });

    if (error) {
      throw new Error(`Supabase signup error: ${error.message}`);
    }

    return {
      user: data.user,
      session: data.session,
      success: true
    };
  } catch (error) {
    return {
      user: null,
      session: null,
      success: false,
      error: error.message
    };
  }
}

/**
 * Signs in a user with Supabase Auth
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>}
 */
async function signInUser(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      throw new Error(`Supabase signin error: ${error.message}`);
    }

    return {
      user: data.user,
      session: data.session,
      success: true
    };
  } catch (error) {
    return {
      user: null,
      session: null,
      success: false,
      error: error.message
    };
  }
}

/**
 * Signs out the current user
 * @returns {Promise<Object>}
 */
async function signOutUser() {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      throw new Error(`Supabase signout error: ${error.message}`);
    }

    return {
      success: true
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Gets the current user session
 * @returns {Promise<Object>}
 */
async function getCurrentSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      throw new Error(`Session error: ${error.message}`);
    }

    return {
      session,
      success: true
    };
  } catch (error) {
    return {
      session: null,
      success: false,
      error: error.message
    };
  }
}

/**
 * Verifies a JWT token
 * @param {string} token - JWT token to verify
 * @returns {Promise<Object>}
 */
async function verifyToken(token) {
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error) {
      throw new Error(`Token verification error: ${error.message}`);
    }

    return {
      user,
      success: true,
      valid: !!user
    };
  } catch (error) {
    return {
      user: null,
      success: false,
      valid: false,
      error: error.message
    };
  }
}

module.exports = {
  supabase,
  signUpUser,
  signInUser,
  signOutUser,
  getCurrentSession,
  verifyToken
}; 