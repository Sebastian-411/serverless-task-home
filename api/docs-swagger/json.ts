import type { VercelRequest, VercelResponse } from "@vercel/node";
import swaggerJSDoc from "swagger-jsdoc";

import { swaggerSpec } from "../../swagger/swaggerConfig";

const swaggerDefinition = swaggerSpec;

const options = {
  swaggerDefinition,
  apis: ["api/**/*.ts"],
};

const swaggerSpecConfig = swaggerJSDoc(options);

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Content-Type", "application/json");
  return res.status(200).send(swaggerSpecConfig);
}
