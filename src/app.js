
// ========================================
// Variables de entorno
// ========================================

require("dotenv").config();

// ========================================
// Importaciones
// ========================================

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");

const { rateLimit } = require(
  "express-rate-limit"
);

const swaggerUi = require(
  "swagger-ui-express"
);

const swaggerSpec = require("./docs/swagger");

// ========================================
// Middleware API Key
// ========================================

const validarApiKey = require(
  "./middlewares/apiKey.middleware"
);

// ========================================
// Rutas
// ========================================

const pacientesRoutes = require(
  "./routes/pacientes.routes"
);

const especialidadesRoutes = require(
  "./routes/especialidades.routes"
);

const medicosRoutes = require(
  "./routes/medicos.routes"
);

const consultoriosRoutes = require(
  "./routes/consultorios.routes"
);

const citasRoutes = require(
  "./routes/citas.routes"
);

const usuariosRoutes = require(
  "./routes/usuarios.routes"
);

// ========================================
// Rutas de seguridad
// ========================================

const seguridadRoutes = require(
  "./routes/seguridad.routes"
);

// ========================================
// Rutas de autenticación
// ========================================

const authRoutes = require(
  "./routes/auth.routes"
);

// ========================================
// Middleware de errores
// ========================================

const {
  rutaNoEncontrada,
  manejarError,
} = require("./middlewares/errores.middleware");

// ========================================
// Aplicación
// ========================================

const app = express();

const PORT = process.env.PORT || 3000;

// ========================================
// Seguridad
// ========================================

app.disable("x-powered-by");

app.use(helmet());

// ========================================
// CORS
// ========================================



const origenesPermitidos = (
  process.env.ALLOWED_ORIGIN || ""
)
  .split(",")
  .map((origen) => origen.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        origenesPermitidos.includes(origin)
      ) {
        return callback(null, true);
      }

      return callback(
        new Error("Origen CORS no autorizado")
      );
    },

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-API-Key",
    ],
  })
);

// ========================================
// Limitar tamaño JSON
// ========================================

app.use(
  express.json({
    limit: "10kb",
  }),
);

// ========================================
// Rate Limiting
// ========================================

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: "draft-8",
  // El login tiene su propio limitador: evitar doble contabilización.
  skip: (req) => req.path === "/auth/login",
  legacyHeaders: false,

  message: {
    mensaje:
      "Demasiadas solicitudes. " +
      "Intente nuevamente más tarde.",
  },
});

app.use("/api", limiter);

// ========================================
// API Key global
// ========================================
// ========================================
// LAB 11.6.3 - Clientes web y privados
// ========================================

const rutasRecursosJWT = new Set([
  "/pacientes",
  "/especialidades",
  "/medicos",
  "/consultorios",
  "/citas",
  "/usuarios",
  "/estadisticas"
]);

const rutasAuthJWT = new Set([
  "/auth/perfil",
  "/auth/cambiar-password",
  "/auth/recuperacion/admin",
  "/auth/codigos-recuperacion"
]);

app.use("/api", (req, res, next) => {

  // La emisión del token exige JWT y rol administrador dentro de auth.routes.
  // No colocar una API Key privada en el navegador.
  if (req.method === "POST" && /^\/auth\/recuperacion\/admin\/[1-9]\d*$/.test(req.path)) {
    return next();
  }

  // Token temporal administrativo: el titular lo usa sin sesión ni API Key.
  if (req.method === "POST" && req.path === "/auth/restablecer-password") {
    return next();
  }

  // Recuperación pública mediante código de respaldo (rate limit en auth.routes).
  if (req.method === "POST" && req.path === "/auth/restablecer-con-codigo") {
    return next();
  }

  // Login público, con validaciones y rate limit
  if (
    req.method === "POST" &&
    req.path === "/auth/login"
  ) {
    return next();
  }

  // Recursos protegidos por JWT en sus routers
  const recurso = "/" + req.path.split("/")[1];

  if (rutasRecursosJWT.has(recurso)) {
    return next();
  }

  // Rutas de autenticación protegidas por JWT
  const esRutaAuthJWT = Array.from(rutasAuthJWT).some(
    (ruta) => req.path === ruta || req.path.startsWith(ruta + "/")
  );

  if (esRutaAuthJWT) {
    return next();
  }

  // Integraciones privadas y otras rutas
  return validarApiKey(req, res, next);
});

// ========================================
// Ruta principal
// ========================================

app.get("/", (req, res) => {
  res.status(200).json({
    mensaje: "API Hospital funcionando",
  });
});

// ========================================
// Autenticación
// Registro y login requieren API Key
// ========================================

app.use("/api/auth", authRoutes);

// ========================================
// Recursos
// ========================================

app.use(
  "/api/pacientes",
  pacientesRoutes
);

app.use(
  "/api/especialidades",
  especialidadesRoutes
);

app.use(
  "/api/medicos",
  medicosRoutes
);

app.use(
  "/api/consultorios",
  consultoriosRoutes
);

app.use(
  "/api/citas",
  citasRoutes
);

// ========================================
// Gestión administrativa de usuarios
// ========================================

// API Key global.
// JWT y RBAC en usuarios.routes.js.

app.use(
  "/api/usuarios",
  usuariosRoutes
);

// LAB 12.3.3 - Totales administrativos protegidos por JWT
app.use("/api/estadisticas", require("./routes/estadisticas.routes"));

// ========================================
// Seguridad
// ========================================

app.use(
  "/api/seguridad",
  seguridadRoutes
);

// ========================================
// Swagger
// ========================================

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec)
);

// ========================================
// OpenAPI JSON
// ========================================

app.get("/openapi.json", (req, res) => {
  res.json(swaggerSpec);
});

// ========================================
// Ruta no encontrada
// ========================================

app.use(rutaNoEncontrada);

// ========================================
// Manejo global de errores
// ========================================

app.use(manejarError);

// ========================================
// Inicio normal de la API
// ========================================

// No se crean usuarios ni administradores
// durante el arranque del servidor.

const iniciarServidor = () => {
  return new Promise((resolve, reject) => {
    const servidor = app.listen(PORT, () => {
      console.log(
        `Servidor ejecutándose en http://localhost:${PORT}`
      );

      console.log(
        `Swagger UI: http://localhost:${PORT}/api-docs`
      );

      console.log(
        `OpenAPI JSON: http://localhost:${PORT}/openapi.json`
      );
      resolve(servidor);
    });

    servidor.on("error", (error) => {
      console.error(
        "Error al iniciar servidor:",
        error.message
      );

      process.exitCode = 1;
      reject(error);
    });
  });
};

// ========================================
// Ejecutar
// ========================================

if (require.main === module) {
  iniciarServidor();
}

module.exports = { app, iniciarServidor };
