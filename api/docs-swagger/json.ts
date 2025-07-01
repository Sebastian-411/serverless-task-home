import type { VercelRequest, VercelResponse } from "@vercel/node";
import swaggerJSDoc from "swagger-jsdoc";

const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "Serverless Task API",
    version: "1.0.0",
    description:
      "Documentación de la API de tareas con Vercel Functions y Supabase",
  },
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
      },
    },
  },
  security: [{ BearerAuth: [] }],
};

const options = {
  swaggerDefinition,
  apis: ["api/**/*.ts"],
};

const swaggerSpec = swaggerJSDoc(options);

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Content-Type", "application/json");
  return res.status(200).send(swaggerSpec);
}
