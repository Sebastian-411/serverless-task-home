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
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <title>Swagger Docs</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist/swagger-ui.css" />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist/swagger-ui-bundle.js"></script>
    <script>
      window.onload = function () {
        SwaggerUIBundle({
          url: '/api/docs-swagger/json',
          dom_id: '#swagger-ui',
          deepLinking: true,
          layout: "BaseLayout",
        });
      };
    </script>
  </body>
  </html>`;
  res.setHeader("Content-Type", "text/html");
  return res.status(200).send(html);
}
