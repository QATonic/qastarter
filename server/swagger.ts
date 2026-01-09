import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';
import { apiConfig } from './config';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'QAStarter API',
      version: apiConfig.version,
      description: 'API documentation for QAStarter - QA Automation Framework Generator',
      contact: {
        name: 'QAStarter Team',
        url: 'https://github.com/qastarter/qastarter',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: '/',
        description: 'Current server',
      },
    ],
    tags: [
      { name: 'Projects', description: 'Project generation endpoints' },
      { name: 'Metadata', description: 'Configuration metadata endpoints' },
      { name: 'Analytics', description: 'Usage analytics endpoints' },
      { name: 'Health', description: 'Health check endpoints' },
    ],
  },
  apis: ['./server/routes.ts', './server/swagger-schemas.ts'],
};

const swaggerSpec = swaggerJsdoc(options);

export function setupSwagger(app: Express): void {
  // Serve swagger UI
  app.use(
    '/api/docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'QAStarter API Documentation',
    })
  );

  // Serve swagger spec as JSON
  app.get('/api/docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
}

export { swaggerSpec };
