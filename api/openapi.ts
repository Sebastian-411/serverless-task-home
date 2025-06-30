import fs from 'fs';
import path from 'path';

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  const spec = fs.readFileSync(
    path.join(process.cwd(), 'docs/openapi.json'),
    'utf8'
  );

  res.setHeader('Content-Type', 'application/json');
  res.status(200).send(spec);
} 