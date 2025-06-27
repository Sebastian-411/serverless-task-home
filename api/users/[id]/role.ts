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
  const { role } = context.validatedBody;

  // Execute use case - all business logic is handled there
  const result = await Dependencies.changeUserRoleUseCase.execute(
    {
      targetUserId,
      newRole: role.toLowerCase().trim()
    },
    context.authContext
  );

  return {
    data: result,
    message: `User role successfully changed to ${result.role}`
  };
});

export default handler; 