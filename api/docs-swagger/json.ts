import type { VercelRequest, VercelResponse } from "@vercel/node";

import { swaggerSpec } from "../../swagger/swaggerConfig";

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Content-Type", "application/json");
  return res.status(200).send(swaggerSpec);
}
