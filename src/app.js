require(
  "dotenv"
).config();

const validarApiKey =
 require("./middlewares/apiKey.middleware")

const express =
  require(
    "express"
  );


const helmet =
  require(
    "helmet"
  );


const cors =
  require(
    "cors"
  );


const {
  rateLimit
} = require(
  "express-rate-limit"
);


const swaggerUi =
  require(
    "swagger-ui-express"
  );


const swaggerSpec =
  require(
    "./docs/swagger"
  );


// ========================================
// Rutas
// ========================================

const pacientesRoutes =
  require(
    "./routes/pacientes.routes"
  );


const especialidadesRoutes =
  require(
    "./routes/especialidades.routes"
  );


const medicosRoutes =
  require(
    "./routes/medicos.routes"
  );


const consultoriosRoutes =
  require(
    "./routes/consultorios.routes"
  );


const citasRoutes =
  require(
    "./routes/citas.routes"
  );


// ========================================
// Middleware de errores
// ========================================

const {
  rutaNoEncontrada,
  manejarError
} = require(
  "./middlewares/errores.middleware"
);


// ========================================
// Aplicación
// ========================================

const app =
  express();


const PORT =
  process.env.PORT ||
  3000;


// ========================================
// Seguridad
// ========================================

app.disable(
  "x-powered-by"
);


app.use(
  helmet()
);


// ========================================
// CORS
// ========================================

app.use(
  cors({

    origin:
      process.env
        .ALLOWED_ORIGIN,

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE"
    ]
  })
);


// ========================================
// Limitar tamaño JSON
// ========================================

app.use(
  express.json({

    limit:
      "10kb"
  })
);


// ========================================
// Rate Limiting
// ========================================

const limiter =
  rateLimit({

    windowMs:
      15 *
      60 *
      1000,

    limit:
      100,

    standardHeaders:
      "draft-8",

    legacyHeaders:
      false,

    message: {

      mensaje:
        "Demasiadas solicitudes. Intente nuevamente más tarde."
    }
  });


app.use(
  "/api",
  limiter
);

// ========================================
// Autenticación mediante API Key
// ========================================
app.use("/api", validarApiKey);

// ========================================
// Ruta principal
// ========================================

app.get(
  "/",

  (
    req,
    res
  ) => {

    res
      .status(200)
      .json({

        mensaje:
          "API Hospital funcionando"
      });
  }
);


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
// Swagger
// ========================================

app.use(
  "/api-docs",

  swaggerUi.serve,

  swaggerUi.setup(
    swaggerSpec
  )
);


// ========================================
// OpenAPI JSON
// ========================================

app.get(
  "/openapi.json",

  (
    req,
    res
  ) => {

    res.json(
      swaggerSpec
    );
  }
);


// ========================================
// Ruta no encontrada
// ========================================

app.use(
  rutaNoEncontrada
);


// ========================================
// Manejo global de errores
// ========================================

app.use(
  manejarError
);


// ========================================
// Servidor
// ========================================

app.listen(
  PORT,

  () => {

    console.log(
      `Servidor ejecutándose en http://localhost:${PORT}`
    );

    console.log(
      `Swagger UI: http://localhost:${PORT}/api-docs`
    );

    console.log(
      `OpenAPI JSON: http://localhost:${PORT}/openapi.json`
    );
  }
);