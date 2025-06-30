import fs from 'fs';
import path from 'path';

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  const { asset = [] } = req.query;
  const assetPath = Array.isArray(asset) ? asset.join('/') : asset;
  const filePath = path.join(
    process.cwd(),
    'node_modules',
    'swagger-ui-dist',
    assetPath
  );

  console.log('[Swagger Asset]', { asset, assetPath, filePath });

  // Si assetPath es vacío, responde 404
  if (!assetPath || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.status(404).send('Not found');
    return;
  }

  // Content-Type básico
  if (filePath.endsWith('.js')) res.setHeader('Content-Type', 'application/javascript');
  if (filePath.endsWith('.css')) res.setHeader('Content-Type', 'text/css');
  if (filePath.endsWith('.png')) res.setHeader('Content-Type', 'image/png');

  res.status(200).send(fs.readFileSync(filePath));
} 