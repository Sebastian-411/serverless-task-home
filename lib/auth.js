/**
 * Authentication Service
 * Bridges Supabase auth with our User model
 */

const { User, ValidationError } = require('../models');
const { signUpUser, signInUser, signOutUser, verifyToken } = require('./supabase');
const { createUser, findUserByEmail, emailExists } = require('./userService');

/**
 * Registers a new user
 * @param {Object} userData - User registration data
 * @returns {Promise<Object>}
 */
async function registerUser(userData) {
  try {
    const { email, password, name, phoneNumber, address, role = 'user' } = userData;

    // Validate required fields
    if (!email || !password || !name || !phoneNumber || !address) {
      throw new ValidationError('registration', 'Missing required fields: email, password, name, phoneNumber, address');
    }

    if (password.length < 6) {
      throw new ValidationError('password', 'Password must be at least 6 characters long');
    }

    // Check if email already exists
    const existingEmail = await emailExists(email);
    if (existingEmail) {
      throw new Error('User with this email already exists');
    }

    // Create user with our model first to validate data
    const newUserData = {
      name,
      email,
      phoneNumber,
      address,
      role
    };

    // Save user to database
    const dbResult = await createUser(newUserData);
    if (!dbResult.success) {
      throw new Error(dbResult.error);
    }

    // Register with Supabase Auth
    const authResult = await signUpUser(email, password, {
      name,
      phoneNumber,
      role,
      custom_user_id: dbResult.user.id
    });

    if (!authResult.success) {
      throw new Error(authResult.error);
    }

    // Return success response
    return {
      success: true,
      user: dbResult.user,
      session: authResult.session,
      message: 'User registered successfully'
    };

  } catch (error) {
    return {
      success: false,
      user: null,
      session: null,
      error: error.message || 'Registration failed'
    };
  }
}

/**
 * Logs in a user
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>}
 */
async function loginUser(email, password) {
  try {
    // Validate input
    if (!email || !password) {
      throw new ValidationError('login', 'Email and password are required');
    }

    // Sign in with Supabase
    const authResult = await signInUser(email, password);

    if (!authResult.success) {
      throw new Error(authResult.error);
    }

    // Get user metadata from Supabase
    const supabaseUser = authResult.user;
    const metadata = supabaseUser.user_metadata || {};

    // Get user from database
    let userModel = null;
    
    if (metadata.custom_user_id) {
      // Try to get user from database first
      const dbUser = await findUserByEmail(supabaseUser.email);
      if (dbUser.success && dbUser.user) {
        userModel = dbUser.user;
      } else {
        // If not found in DB, create minimal user object from metadata
        userModel = {
          id: metadata.custom_user_id,
          name: metadata.name || 'Unknown User',
          email: supabaseUser.email,
          role: metadata.role || 'user'
        };
      }
    } else {
      // Try to find user by email
      const dbUser = await findUserByEmail(supabaseUser.email);
      if (dbUser.success && dbUser.user) {
        userModel = dbUser.user;
      } else {
        // Legacy user or external auth - create minimal user object
        userModel = {
          id: supabaseUser.id,
          name: metadata.name || supabaseUser.email.split('@')[0],
          email: supabaseUser.email,
          role: metadata.role || 'user'
        };
      }
    }

    return {
      success: true,
      user: userModel,
      session: authResult.session,
      token: authResult.session.access_token,
      message: 'Login successful'
    };

  } catch (error) {
    return {
      success: false,
      user: null,
      session: null,
      token: null,
      error: error.message || 'Login failed'
    };
  }
}

/**
 * Logs out a user
 * @returns {Promise<Object>}
 */
async function logoutUser() {
  try {
    const result = await signOutUser();
    
    if (!result.success) {
      throw new Error(result.error);
    }

    return {
      success: true,
      message: 'Logout successful'
    };

  } catch (error) {
    return {
      success: false,
      error: error.message || 'Logout failed'
    };
  }
}

/**
 * Validates an authentication token and returns user data
 * @param {string} token - JWT token
 * @returns {Promise<Object>}
 */
async function validateAuthToken(token) {
  try {
    if (!token) {
      throw new Error('Token is required');
    }

    const result = await verifyToken(token);
    
    if (!result.success || !result.valid) {
      throw new Error(result.error || 'Invalid token');
    }

    const supabaseUser = result.user;
    const metadata = supabaseUser.user_metadata || {};

    // Create user object from token data
    const userModel = {
      id: metadata.custom_user_id || supabaseUser.id,
      name: metadata.name || supabaseUser.email.split('@')[0],
      email: supabaseUser.email,
      role: metadata.role || 'user'
    };

    return {
      success: true,
      valid: true,
      user: userModel,
      message: 'Token is valid'
    };

  } catch (error) {
    return {
      success: false,
      valid: false,
      user: null,
      error: error.message || 'Token validation failed'
    };
  }
}

/**
 * Middleware to authenticate requests
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
async function authenticateRequest(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Missing or invalid authorization header'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const validation = await validateAuthToken(token);

    if (!validation.success) {
      return res.status(401).json({
        success: false,
        error: validation.error
      });
    }

    // Add user to request object
    req.user = validation.user;
    next();

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Authentication middleware error'
    });
  }
}

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  validateAuthToken,
  authenticateRequest
}; 