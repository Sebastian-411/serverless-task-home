/**
 * Authentication Service
 * Handles user authentication with Supabase integration
 */

const { supabaseService } = require('../config/supabase');
const { User } = require('../../models');
const userService = require('../services/userService');

/**
 * Authentication service class
 * Bridges Supabase auth with our User model
 */
class AuthService {
  constructor() {
    this.supabase = supabaseService;
  }

  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} Registration result
   */
  async registerUser(userData) {
    try {
      const { email, password, ...profileData } = userData;

      // Validate user data with our model
      const userModel = User.create({
        email,
        role: 'user', // Default role
        ...profileData
      });

      // Register with Supabase
      const authResult = await this.supabase.signUp(email, password, {
        name: userModel.name,
        phone: userModel.phoneNumber
      });

      if (!authResult.success) {
        return {
          success: false,
          error: authResult.error
        };
      }

      // Create user in our database
      let dbUser = null;
      if (authResult.data.user && !authResult.data.user.email_confirmed_at) {
        // Email confirmation required - create pending user
        try {
          dbUser = await userService.createUser({
            id: authResult.data.user.id,
            ...userModel.toJSON(),
            email: authResult.data.user.email
          });
        } catch (error) {
          console.error('Failed to create user in database:', error.message);
          // Continue anyway - user exists in Supabase
        }
      }

      return {
        success: true,
        data: {
          user: authResult.data.user,
          session: authResult.data.session,
          dbUser: dbUser,
          requiresEmailConfirmation: !authResult.data.session
        }
      };

    } catch (error) {
      console.error('Registration error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Authenticate user login
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} Login result
   */
  async loginUser(email, password) {
    try {
      // Authenticate with Supabase
      const authResult = await this.supabase.signIn(email, password);

      if (!authResult.success) {
        return {
          success: false,
          error: authResult.error
        };
      }

      const { user, session } = authResult.data;

      // Get or create user in our database
      let dbUser = await userService.getUserById(user.id);
      
      if (!dbUser) {
        // Create user if doesn't exist (e.g., migrated from Supabase only)
        try {
          dbUser = await userService.createUser({
            id: user.id,
            email: user.email,
            name: user.user_metadata?.name || user.email.split('@')[0],
            phoneNumber: user.user_metadata?.phone || '',
            role: 'user'
          });
        } catch (error) {
          console.error('Failed to create user in database:', error.message);
        }
      }

      return {
        success: true,
        data: {
          user,
          session,
          dbUser,
          accessToken: session.access_token,
          refreshToken: session.refresh_token
        }
      };

    } catch (error) {
      console.error('Login error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Logout user
   * @returns {Promise<Object>} Logout result
   */
  async logoutUser() {
    try {
      const result = await this.supabase.signOut();
      return result;
    } catch (error) {
      console.error('Logout error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get current authenticated user
   * @param {string} token - JWT token (optional)
   * @returns {Promise<Object>} User data
   */
  async getCurrentUser(token = null) {
    try {
      let supabaseUser;
      
      if (token) {
        supabaseUser = await this.supabase.verifyToken(token);
      } else {
        supabaseUser = await this.supabase.getCurrentUser();
      }

      if (!supabaseUser) {
        return null;
      }

      // Get complete user data from our database
      const dbUser = await userService.getUserById(supabaseUser.id);

      return {
        auth: supabaseUser,
        profile: dbUser
      };

    } catch (error) {
      console.error('Get current user error:', error.message);
      return null;
    }
  }

  /**
   * Verify and extract user from JWT token
   * @param {string} authHeader - Authorization header
   * @returns {Promise<Object>} User data or null
   */
  async verifyAuthHeader(authHeader) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    return await this.getCurrentUser(token);
  }

  /**
   * Update user profile
   * @param {string} userId - User ID
   * @param {Object} updates - Profile updates
   * @returns {Promise<Object>} Update result
   */
  async updateUserProfile(userId, updates) {
    try {
      // Update in our database
      const updatedUser = await userService.updateUser(userId, updates);

      // Update Supabase metadata if needed
      if (updates.name || updates.phoneNumber) {
        const metadata = {};
        if (updates.name) metadata.name = updates.name;
        if (updates.phoneNumber) metadata.phone = updates.phoneNumber;

        // Note: This would require admin privileges to update another user
        // For now, we'll only update our database
      }

      return {
        success: true,
        data: updatedUser
      };

    } catch (error) {
      console.error('Update profile error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Reset user password
   * @param {string} email - User email
   * @returns {Promise<Object>} Reset result
   */
  async resetPassword(email) {
    try {
      const result = await this.supabase.resetPassword(email);
      return result;
    } catch (error) {
      console.error('Reset password error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Update user password
   * @param {string} newPassword - New password
   * @returns {Promise<Object>} Update result
   */
  async updatePassword(newPassword) {
    try {
      const result = await this.supabase.updatePassword(newPassword);
      return result;
    } catch (error) {
      console.error('Update password error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Check if user is admin
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} True if user is admin
   */
  async isUserAdmin(userId) {
    try {
      const user = await userService.getUserById(userId);
      return user ? user.isAdmin() : false;
    } catch (error) {
      console.error('Check admin error:', error.message);
      return false;
    }
  }

  /**
   * Middleware helper for authentication
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next function
   */
  async authenticateRequest(req, res, next) {
    try {
      const authHeader = req.headers.authorization;
      const user = await this.verifyAuthHeader(authHeader);

      if (!user) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Valid authentication token required'
        });
      }

      req.user = user;
      next();

    } catch (error) {
      console.error('Authentication middleware error:', error.message);
      return res.status(500).json({
        error: 'Authentication Error',
        message: 'Failed to authenticate request'
      });
    }
  }

  /**
   * Middleware helper for admin-only routes
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next function
   */
  async requireAdmin(req, res, next) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication required'
        });
      }

      const isAdmin = await this.isUserAdmin(req.user.auth.id);

      if (!isAdmin) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Admin privileges required'
        });
      }

      next();

    } catch (error) {
      console.error('Admin middleware error:', error.message);
      return res.status(500).json({
        error: 'Authorization Error',
        message: 'Failed to verify admin privileges'
      });
    }
  }
}

// Export singleton instance
const authService = new AuthService();

module.exports = {
  authService,
  AuthService
}; 