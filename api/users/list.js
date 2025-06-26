/**
 * GET /api/users/list - Listar usuarios
 * 
 * Requiere autenticación de admin para acceder
 * Soporta paginación, búsqueda y filtros
 */

const { authService, userService } = require('../../lib');
const { 
  authenticate, 
  requireAdmin, 
  validatePagination,
  configureCors, 
  logRequests 
} = require('../../lib/utils/middleware');
const { 
  paginated, 
  badRequest, 
  serverError 
} = require('../../lib/utils/responses');

module.exports = async function handler(req, res) {
  // Apply basic middlewares
  configureCors(req, res, () => {});
  
  if (req.method !== 'GET') {
    return res.status(405).json({
      error: 'Method Not Allowed',
      message: 'Only GET method is allowed'
    });
  }

  logRequests(req, res, () => {});

  try {
    // Verificar autenticación
    await new Promise((resolve, reject) => {
      authenticate(req, res, (error) => {
        if (error) reject(error);
        else resolve();
      });
    });

    // Verificar permisos de admin
    await new Promise((resolve, reject) => {
      requireAdmin(req, res, (error) => {
        if (error) reject(error);
        else resolve();
      });
    });

    // Extraer parámetros de query
    const {
      page = 1,
      limit = 10,
      search = '',
      role = null,
      includeAddress = 'true'
    } = req.query;

    // Validar parámetros
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    if (isNaN(pageNum) || pageNum < 1) {
      return badRequest(res, 'Page must be a positive number');
    }

    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return badRequest(res, 'Limit must be between 1 and 100');
    }

    // Validar role si se proporciona
    if (role && !['admin', 'user'].includes(role.toLowerCase())) {
      return badRequest(res, 'Role filter must be either "admin" or "user"');
    }

    // Preparar opciones de búsqueda
    const options = {
      page: pageNum,
      limit: limitNum,
      search: search.trim(),
      role: role ? role.toLowerCase() : null,
      includeAddress: includeAddress.toLowerCase() === 'true'
    };

    // Obtener usuarios con paginación
    const result = await userService.getUsers(options);

    // Formatear respuesta para no exponer información sensible
    const formattedUsers = result.users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      address: user.address ? {
        id: user.address.id,
        addressLine1: user.address.addressLine1,
        addressLine2: user.address.addressLine2,
        city: user.address.city,
        stateOrProvince: user.address.stateOrProvince,
        postalCode: user.address.postalCode,
        country: user.address.country,
        fullAddress: user.address.getFullAddress()
      } : null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }));

    return paginated(
      res, 
      formattedUsers, 
      result.pagination, 
      `Retrieved ${formattedUsers.length} users successfully`
    );

  } catch (error) {
    console.error('Error listing users:', error);
    
    // Si el error es de autenticación/autorización, ya fue manejado por el middleware
    if (error.status === 401 || error.status === 403) {
      return; // El middleware ya envió la respuesta
    }

    return serverError(res, 'Failed to retrieve users. Please try again.');
  }
} 