import fs from 'fs';
import path from 'path';

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  const html = fs.readFileSync(
    path.join(process.cwd(), 'node_modules/swagger-ui-dist/index.html'),
    'utf8'
  );

  const openapiUrl = '/api/openapi'; // Ruta para el JSON

  // Reemplazar rutas de assets para que apunten a /api/swagger-assets/
  const htmlWithAssets = html
    .replace(/href="([^"]+\.css)"/g, 'href="/api/swagger-assets/$1"')
    .replace(/src="([^"]+\.(js|css|png))"/g, 'src="/api/swagger-assets/$1"')
    .replace('https://petstore.swagger.io/v2/swagger.json', openapiUrl);

  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(htmlWithAssets);
} 