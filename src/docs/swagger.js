const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.3",

    info: {
      title: "API Hospital Segura",

      version: "1.0.0",

      description:
        "API REST para la gestión hospitalaria desarrollada con Node.js y Express, incorporando prácticas seguras, autenticación mediante API Key y JWT, autorización basada en roles (RBAC) y documentación OpenAPI.",
    },

    servers: [
      {
        url: "http://localhost:3000",

        description: "Servidor local",
      },
    ],

    // ========================================
    // Esquemas de seguridad
    // ========================================

    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: "apiKey",
          in: "header",
          name: "X-API-Key",
          description:
            "API Key requerida para consumir los endpoints protegidos.",
        },

        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description:
            "JWT obtenido mediante el endpoint de login.",
        },
      },
    },

    // ========================================
    // Seguridad global
    // ========================================

    security: [
      {
        ApiKeyAuth: [],
      },
    ],

    // ========================================
    // Tags
    // ========================================

    tags: [
      {
        name: "Pacientes",

        description: "Gestión de pacientes",
      },

      {
        name: "Especialidades",

        description:
          "Gestión de especialidades médicas",
      },

      {
        name: "Médicos",

        description:
          "Gestión de médicos y asociación con especialidades",
      },

      {
        name: "Consultorios",

        description:
          "Gestión de consultorios del hospital",
      },

      {
        name: "Citas",

        description:
          "Programación, modificación y gestión del estado de las citas médicas",
      },

      // ========================================
      // Usuarios
      // ========================================

      {
        name: "Usuarios",

        description:
          "Gestión administrativa de usuarios del sistema",
      },

      // ========================================
      // Seguridad
      // ========================================

      {
        name: "Seguridad",

        description:
          "Endpoints relacionados con autenticación y seguridad de la API",
      },

      // ========================================
      // Autenticación
      // ========================================

      {
        name: "Autenticación",

        description:
          "Registro e inicio de sesión de usuarios",
      },
    ],
  },

  // ========================================
  // Archivos que contienen documentación
  // OpenAPI / Swagger
  // ========================================

  apis: ["./src/routes/*.js"],
};

const swaggerSpec =
  swaggerJsdoc(options);

module.exports =
  swaggerSpec;