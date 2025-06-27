// PATCH /users/:id/role - Change user role (Admin only)
import { VercelRequest, VercelResponse } from '@vercel/node';
import { Dependencies } from '../../../shared/config/dependencies';
import { HandlerContext } from '../../../shared/middlewares/request-handler.middleware';
import { ValidationRule } from '../../../shared/middlewares/validation.middleware';

// Ultra-fast validation rule
const ROLE_VALIDATION: ValidationRule[] = [{
  field: 'role', 
  required: true, 
  type: 'string',
  customValidator: (value: any) => ['admin', 'user'].includes(value.toLowerCase().trim()),
  errorMessage: 'Invalid role'
}];

// High-performance admin-only endpoint
const handler = Dependencies.createAuthenticatedEndpoint(['PATCH'], ['admin'])({
  pathParam: { name: 'id', type: 'uuid' },
  bodyValidation: ROLE_VALIDATION
}, async (context: HandlerContext) => {
  const targetUserId = context.pathParam!;
  const { role: rawRole } = context.validatedBody;
  const role = rawRole.toLowerCase().trim();

  // Fast user existence check - O(1) with database index
  const targetUser = await Dependencies.userRepository.findById(targetUserId);
  if (!targetUser) {
    throw new Error('User not found');
  }

  // Prevent last admin from removing their own role - O(1) count with index
  if (context.authContext.user.id === targetUserId && 
      targetUser.role.toLowerCase() === 'admin' && 
      role === 'user') {
    const adminCount = await Dependencies.prisma.user.count({ where: { role: 'ADMIN' } });
    if (adminCount <= 1) {
      throw new Error('Cannot remove admin role from the last administrator in the system');
    }
  }

  // Ultra-fast role update - O(1) with index
  const updatedUser = await Dependencies.userRepository.update(targetUserId, {
    role: role.toUpperCase()
  });

  return {
    data: {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      role: updatedUser.role.toLowerCase(),
      updatedAt: updatedUser.updatedAt
    },
    message: `User role successfully changed to ${role}`
  };
});

export default handler; 