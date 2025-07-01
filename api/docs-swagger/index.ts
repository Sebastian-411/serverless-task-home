import type { VercelRequest, VercelResponse } from "@vercel/node";

import { swaggerSpec } from "../../swagger/swaggerConfig";

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
