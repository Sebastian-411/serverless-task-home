// GET /users/:id
import { VercelRequest, VercelResponse } from '@vercel/node';
import { Dependencies } from '../../shared/config/dependencies';
import { HandlerContext } from '../../shared/middlewares/request-handler.middleware';

// Ultra-fast handler with built-in validation, auth, and business logic
const handler = Dependencies.createAuthenticatedEndpoint(['GET'])({
  pathParam: { name: 'id', type: 'uuid' }
}, async (context: HandlerContext) => {
  const user = await Dependencies.getUserByIdUseCase.execute(
    context.pathParam!, 
    context.authContext
  );
  
  return {
    data: user,
    message: 'User retrieved successfully'
  };
});

export default handler; 