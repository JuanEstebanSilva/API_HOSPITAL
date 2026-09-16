# API HOSPITAL SEGURA Lab. No.5

Proyecto para el desarrollo y análisis de seguridad de una API REST hospitalaria utilizando Node.js, Express, Swagger/OpenAPI y herramientas de análisis SAST, SCA y DAST.

---

# 1. OBJETIVO DEL PROYECTO

Construir una API REST para gestionar:

- pacientes;
- especialidades;
- médicos;
- consultorios;
- citas médicas.

El proyecto permite formalizar:

- arquitectura de una API REST;
- rutas;
- controllers;
- services;
- middlewares;
- validación de datos;
- relaciones entre recursos;
- reglas de negocio;
- protección contra Mass Assignment;
- documentación OpenAPI;
- Swagger UI;
- análisis SAST;
- análisis SCA;
- análisis DAST.

Los datos se almacenan inicialmente en memoria mediante archivos JavaScript.

Esta arquitectura será posteriormente adaptable a BaaS

# Directorio
mkdir API_HOSPITAL
npm init -y
cd API_HOSPITAL


# INSTALAR EXPRESS
npm install express
# INSTALAR DEPENDENCIAS DE SEGURIDAD Y VALIDACIÓN
npm install helmet cors express-rate-limit express-validator dotenv

## Recordemos que:
- helmet
→ agrega encabezados HTTP de seguridad

- cors
→ controla los orígenes permitidos

- express-rate-limit
→ limita solicitudes repetidas

- express-validator
→ valida parámetros y datos recibidos

- dotenv
→ carga variables de entorno desde .env

# INSTALAR SWAGGER
npm install swagger-ui-express swagger-jsdoc

## Recordemos que estas dependencias permiten:
Swagger UI
→ visualizar y probar la API

OpenAPI
→ describir formalmente los endpoints

# INSTALAR NODEMON
npm install --save-dev nodemon

# CONFIGURAR LOS SCRIPTS

## Abrir:
package.json

## Buscar:

"scripts": {
  "test": "echo \"Error: no test specified\" && exit 1"
}

## y reemplazarlo por:

"scripts": {
  "start": "node src/app.js",
  "dev": "nodemon src/app.js"
}

# CREAR EL ARCHIVO .ENV
# CREAR .ENV.EXAMPLE
# CREAR .GITIGNORE

# copiar el src y validar la estructura:
API_HOSPITAL/
│
├── src/
│   │
│   ├── controllers/
│   │   ├── citas.controller.js
│   │   ├── consultorios.controller.js
│   │   ├── especialidades.controller.js
│   │   ├── medicos.controller.js
│   │   └── pacientes.controller.js
│   │
│   ├── data/
│   │   ├── citas.js
│   │   ├── consultorios.js
│   │   ├── especialidades.js
│   │   ├── medicos.js
│   │   └── pacientes.js
│   │
│   ├── docs/
│   │   └── swagger.js
│   │
│   ├── middlewares/
│   │   ├── citas.validator.js
│   │   ├── consultorios.validator.js
│   │   ├── errores.middleware.js
│   │   ├── especialidades.validator.js
│   │   ├── medicos.validator.js
│   │   ├── pacientes.validator.js
│   │   └── validar.middleware.js
│   │
│   ├── routes/
│   │   ├── citas.routes.js
│   │   ├── consultorios.routes.js
│   │   ├── especialidades.routes.js
│   │   ├── medicos.routes.js
│   │   └── pacientes.routes.js
│   │
│   ├── services/
│   │   ├── citas.service.js
│   │   ├── consultorios.service.js
│   │   ├── especialidades.service.js
│   │   ├── medicos.service.js
│   │   └── pacientes.service.js
│   │
│   └── app.js
│
├── .env
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
└── README.md

# EJECUTAR LA API
npm run dev

---
Servidor ejecutándose en http://localhost:3000

Swagger UI:
http://localhost:3000/api-docs

OpenAPI JSON:
http://localhost:3000/openapi.json
---

# realizar las pruebas y documentar
SAST → Semgrep
SCA  → npm audit
DAST → OWASP ZAP

