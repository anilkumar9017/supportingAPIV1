const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'DCC Logistics Suite APIs',
      version: '1.0.0',
      description: 'Swagger documentation for the DCC Logistics Suite backend APIs.'
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3001}`,
        description: 'Local development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [{ bearerAuth: [] }]
  },
  apis: ['./module/subcon/routes/*.js', './server.js']
};

const specs = swaggerJsdoc(options);

module.exports = {
  specs,
  swaggerUi
};
