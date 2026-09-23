const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "API Hospital Segura",
      version: "1.0.0",
      description: "API REST para la gestión hospitalaria desarrollada con Node.js, Express, prácticas seguras y documentación OpenAPI."
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Servidor local"
      }
    ],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: "apiKey",
          in: "header",
          name: "X-API-Key",
          description: "API Key requerida para consumir los endpoints protegidos."
        }
      }
    },
    security: [
      {
        ApiKeyAuth: []
      }
    ],
    tags: [
      {
        name: "Autenticación",
        description:
          "Registro e inicio de sesión de usuarios"
      },
      {
        name: "Seguridad",
        description: "Endpoints relacionados con autenticación y seguridad de la API"
      },
      {
        name: "Pacientes",
        description: "Gestión de pacientes"
      },
      {
        name: "Especialidades",
        description: "Gestión de especialidades médicas"
      },
      {
        name: "Médicos",
        description: "Gestión de médicos y asociación con especialidades"
      },
      {
        name: "Consultorios",
        description: "Gestión de consultorios del hospital"
      },
      {
        name: "Citas",
        description: "Programación, modificación y gestión del estado de las citas médicas"
      }
    ]
  },
  apis: [
    "./src/routes/*.js"
  ]
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;