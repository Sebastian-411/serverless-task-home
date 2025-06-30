import type { VercelRequest, VercelResponse } from '@vercel/node';
const { swaggerSpec } = require('../../swagger/swaggerConfig');

/**
 * @openapi
 * /api/docs:
 *   get:
 *     tags:
 *       - Documentation
 *     summary: Get API documentation
 *     description: Returns the OpenAPI specification in JSON format
 *     responses:
 *       200:
 *         description: OpenAPI specification
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      error: 'Method not allowed',
      message: 'Only GET method is allowed'
    });
  }

  try {
    // Set CORS headers for Swagger UI
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return res.status(200).json(swaggerSpec);
  } catch (error) {
    console.error('Error serving Swagger documentation:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to generate API documentation'
    });
  }
} 