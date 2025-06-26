/**
 * POST /api/users - Create a user
 * 
 * Scenarios:
 * - New user (no token): Created as 'user' (normal registration)
 * - Admin (with token): Can create 'admin' or 'user'
 * - Regular user (with token): ❌ Cannot create users
 */

const { authService, userService } = require('../../lib');
const { 
  validateRequest, 
  configureCors, 
  logRequests,
  handleErrors 
} = require('../../lib/utils/middleware');
const { 
  created, 
  badRequest, 
  unauthorized, 
  forbidden, 
  conflict,
  serverError 
} = require('../../lib/utils/responses');

module.exports = async function handler(req, res) {
  // Apply basic middlewares
  configureCors(req, res, () => {});
  
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method Not Allowed',
      message: 'Only POST method is allowed'
    });
  }

  logRequests(req, res, () => {});

  try {
    // Validate request structure
    const validationErrors = [];
    const { name, email, password, role, rol, phoneNumber, address } = req.body;
    
    // Support both 'role' and 'rol' for Spanish compatibility
    const requestedRole = role || rol;

    // Basic validations
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      validationErrors.push('Name is required and must be at least 2 characters long');
    }

    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      validationErrors.push('Valid email is required');
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      validationErrors.push('Password is required and must be at least 6 characters long');
    }

    if (phoneNumber && (typeof phoneNumber !== 'string' || phoneNumber.trim().length === 0)) {
      validationErrors.push('Phone number must be a valid string if provided');
    }

    // Validate role if provided
    if (requestedRole && !['admin', 'user'].includes(requestedRole.toLowerCase())) {
      validationErrors.push('Role must be either "admin" or "user"');
    }

    // Validate address if provided
    if (address) {
      if (typeof address !== 'object') {
        validationErrors.push('Address must be an object');
      } else {
        if (!address.addressLine1 || typeof address.addressLine1 !== 'string') {
          validationErrors.push('Address line 1 is required');
        }
        if (!address.city || typeof address.city !== 'string') {
          validationErrors.push('City is required in address');
        }
        if (!address.country || typeof address.country !== 'string') {
          validationErrors.push('Country is required in address');
        }
      }
    }

    if (validationErrors.length > 0) {
      return badRequest(res, 'Validation failed', validationErrors);
    }

    // Check authentication to determine scenario
    let currentUser = null;
    let isAuthenticated = false;
    let isAdmin = false;

    const authHeader = req.headers.authorization;
    if (authHeader) {
      currentUser = await authService.verifyAuthHeader(authHeader);
      if (currentUser) {
        isAuthenticated = true;
        isAdmin = await authService.isUserAdmin(currentUser.auth.id);
      }
    }

    // Determine final role based on scenario
    let finalRole = 'user'; // Default for new users
    let roleOverridden = false; // Track if we overrode the requested role

    if (isAuthenticated) {
      if (!isAdmin) {
        // Regular user with token: can create users but only as 'user' role
        if (requestedRole && requestedRole.toLowerCase() === 'admin') {
          finalRole = 'user'; // Override admin request to user
          roleOverridden = true;
        } else {
          finalRole = 'user'; // Always user for non-admin creators
        }
      } else {
        // Admin with token: can specify role or use 'user' as default
        finalRole = requestedRole ? requestedRole.toLowerCase() : 'user';
      }
    } else {
      // New user without token: always will be 'user'
      if (requestedRole && requestedRole.toLowerCase() !== 'user') {
        return badRequest(res, 'New user registration can only create regular users. Admin role cannot be self-assigned.');
      }
      finalRole = 'user';
    }

    // Check if email already exists
    const existingUser = await userService.getUserByEmail(email);
    if (existingUser) {
      return conflict(res, 'A user with this email already exists');
    }

    // Prepare user data
    const userData = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: finalRole,
      phoneNumber: phoneNumber?.trim() || '',
      ...(address && { address })
    };

    // Register user using authService (handles Supabase + DB)
    const registrationResult = await authService.registerUser(userData);

    if (!registrationResult.success) {
      return badRequest(res, registrationResult.error);
    }

    // Prepare clean response
    const dbUser = registrationResult.data.dbUser;
    
    const responseData = {
      id: registrationResult.data.user.id,
      name: dbUser?.name || userData.name,
      email: registrationResult.data.user.email,
      phone: dbUser?.phoneNumber || userData.phoneNumber || null,
      role: finalRole,
      address: dbUser?.address ? {
        street: dbUser.address.addressLine1 + (dbUser.address.addressLine2 ? `, ${dbUser.address.addressLine2}` : ''),
        city: dbUser.address.city,
        state: dbUser.address.stateOrProvince,
        zipCode: dbUser.address.postalCode,
        country: dbUser.address.country
      } : null,
      createdAt: dbUser?.createdAt || new Date().toISOString()
    };

    // Custom message based on scenario
    let successMessage = '¡Cuenta creada exitosamente!';
    if (isAuthenticated && isAdmin) {
      successMessage = `¡Usuario ${finalRole} creado exitosamente!`;
    } else if (isAuthenticated && !isAdmin) {
      if (roleOverridden) {
        successMessage = '¡Usuario creado exitosamente como usuario normal! (Solo admins pueden crear usuarios admin)';
      } else {
        successMessage = '¡Usuario creado exitosamente!';
      }
    }

    // Add role override info if applicable
    const response = { user: responseData };
    if (roleOverridden) {
      response.note = 'El rol solicitado (admin) fue cambiado a usuario normal por permisos insuficientes';
    }

    return created(res, response, successMessage);

  } catch (error) {
    console.error('Error creating user:', error);
    
    // Handle specific errors
    if (error.message.includes('email')) {
      return conflict(res, 'Email already exists or is invalid');
    }
    
    if (error.message.includes('password')) {
      return badRequest(res, 'Password does not meet requirements');
    }

    if (error.message.includes('ValidationError')) {
      return badRequest(res, error.message);
    }

    return serverError(res, 'Failed to create user. Please try again.');
  }
} 