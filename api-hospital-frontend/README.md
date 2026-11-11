# README — API Hospital Segura: React + Vite, Express y Supabase/PostgreSQL

**Guía de cierre**

## 1. Objetivo y arquitectura

API Hospital es una aplicación web cliente-servidor desacoplada. El frontend es una SPA en **React 19 + Vite 8 + React Router 7 + Bootstrap 5.3**. El backend es una API REST con **Node.js, Express 5 (CommonJS)** y PostgreSQL administrado en Supabase. La comunicación es HTTP/JSON, con JWT para autenticación y autorización mediante RBAC y controles de propiedad (BOLA/IDOR). El backend documenta endpoints mediante Swagger/OpenAPI.

```text
Navegador → React/Vite (localhost:5173)
          → fetch / HTTP JSON + JWT
          → Express (localhost:3000)
          → rutas → middlewares → controladores → servicios
          → pg.Pool + TLS → PostgreSQL (Supabase)
```

## 2. Requisitos previos

- Node.js y npm compatibles con las versiones de Vite/React del `package.json` (revisar `node --version`; Vite 8 exige una versión reciente de Node).
- VS Code, terminal PowerShell, navegador, Postman (opcional), proyecto Supabase y certificado CA configurado para PostgreSQL.
- Mantener secretos en `.env` locales; **no** subir `.env` a GitHub ni incorporar contraseñas al frontend.

## 3. Crear React desde la terminal (PowerShell)

```powershell
node --version
npm --version
npm create vite@latest api-hospital-frontend -- --template react
cd api-hospital-frontend
npm install
npm install react-router-dom bootstrap
npm run dev
```

En el asistente de Vite, elegir React + JavaScript si solicita opciones. 

## 4. Anatomía del frontend

| Ruta | Responsabilidad |
|---|---|
| `index.html` | Documento raíz del navegador; contiene el nodo de montaje de React y carga el módulo de entrada. |
| `src/main.jsx` | Punto de entrada de React; monta `App`, importa estilos y proveedores globales. |
| `src/App.jsx` | Configura la navegación y las vistas de la SPA. |
| `src/App.css`, `src/index.css` | Estilos del layout, componentes y apariencia global. |
| `public/` | Recursos estáticos servidos sin importación de módulos. |
| `src/assets/` | Imágenes y recursos importados por los componentes. |
| `src/pages/` | Páginas de login, dashboard y recuperación de contraseña. |
| `src/components/` | Módulos visuales reutilizables de gestión hospitalaria. |
| `src/context/AuthContext.jsx` | Estado global de autenticación, inicio/cierre de sesión y control de expiración JWT. |
| `src/context/auth-context.js` | Definición compartida del contexto React. |
| `src/hooks/useAuth.js` | Acceso al contexto de autenticación desde los componentes. |
| `src/hooks/useDashboardData.js` | Obtención y tratamiento de datos para indicadores. |
| `src/services/api.js` | Solicitud de login al backend; usa `VITE_API_URL`. |
| `src/services/*.service.js` | Funciones HTTP separadas por recurso (citas, pacientes, médicos, etc.). |
| `src/services/sesion-expirada.js` | Señalización del fin de sesión ante tokens inválidos o expirados. |
| `src/components/RutaProtegida.jsx` | Restringe navegación según autenticación/rol; **no sustituye** la validación en el backend. |
| `.env` | Configuración local del cliente. Variables `VITE_` quedan expuestas en el navegador. |
| `.env.example` | Ejemplo publicable de configuración sin secretos. |
| `vite.config.js` | Configuración de Vite y plugin React. |
| `eslint.config.js` | Reglas de análisis estático y buenas prácticas. |
| `package.json` | Dependencias y scripts del proyecto. |
| `package-lock.json` | Versiones resueltas para instalaciones reproducibles. |

### 4.1 Componentes de negocio del frontend

| Componente | Función |
|---|---|
| `GestionUsuarios.jsx` | Gestión de cuentas y roles. |
| `GestionEspecialidades.jsx` | Catálogo de especialidades. |
| `GestionMedicos.jsx` / `GestionProfesionales.jsx` | Directorio médico y vinculación con cuentas. |
| `GestionPacientes.jsx` | Fichas de pacientes y cuentas asociadas. |
| `GestionConsultorios.jsx` | Espacios de atención hospitalaria. |
| `GestionCitas.jsx` | Solicitud, consulta y gestión de citas según permisos. |
| `AgendaInteractiva.jsx` y `.css` | Vista interactiva de agenda médica. |
| `ResumenHospital.jsx` | Indicadores y datos del dashboard. |
| `PerfilPropio.jsx` | Información de la cuenta autenticada y ficha vinculada. |
| `CodigosRecuperacion.jsx` | Generación y regeneración de códigos de respaldo. |
| `RecuperacionAdministrativa.jsx` | Flujo de recuperación autorizado por administrador. |
| `CambiarPassword.jsx` | Cambio de contraseña de la cuenta propia. |

### 4.2 Variables del frontend

Crear `.env` a partir de `.env.example`:

```dotenv
VITE_API_URL=http://localhost:3000
```

`import.meta.env.VITE_API_URL` se evalúa en el cliente. **Nunca** colocar aquí `DATABASE_URL`, `JWT_SECRET`, contraseñas, claves privadas o API keys confidenciales.

## 5. Crear e iniciar el backend

Para un proyecto desde cero:

```powershell
mkdir api-hospital-backend
cd api-hospital-backend
npm init -y
npm install express pg dotenv cors helmet express-rate-limit express-validator bcrypt jsonwebtoken swagger-jsdoc swagger-ui-express
npm install -D nodemon
```

El backend adjunto **ya existe**. Para instalarlo con las versiones resueltas:

```powershell
cd API_HOSPITAL
npm ci
npm run dev
```

Alternativamente `npm start`. El script `npm run seed:admin` ejecuta `src/scripts/crearAdmin.js` y requiere `ADMIN_NOMBRE`, `ADMIN_EMAIL` y `ADMIN_PASSWORD` en el `.env`; usarlo únicamente en una instalación inicial controlada.

### 5.1 Estructura del backend

| Ruta | Función |
|---|---|
| `src/app.js` | Inicialización Express, Helmet, CORS, JSON, rate limiting, Swagger y montaje de rutas. |
| `src/config/database.js` | Pool de PostgreSQL con `pg`, conexión TLS y CA, consultas parametrizadas. |
| `src/routes/` | Define endpoints HTTP y enlaza validaciones/autorizaciones con controladores. |
| `src/controllers/` | Interpreta peticiones, coordina servicios y construye respuestas HTTP. |
| `src/services/` | Consultas SQL y reglas de negocio para recursos hospitalarios, usuarios y recuperación. |
| `src/middlewares/auth.middleware.js` | Verifica JWT y la identidad de la petición. |
| `src/middlewares/roles.middleware.js` | Control RBAC según el rol autenticado. |
| `src/middlewares/propiedad.middleware.js` | Control de propiedad BOLA/IDOR para evitar acceder a recursos ajenos. |
| `src/middlewares/*.validator.js` | Validación de parámetros, cuerpos y campos. |
| `src/middlewares/apiKey.middleware.js` | Validación de API Key en rutas que la exigen. |
| `src/middlewares/errores.middleware.js` | Respuestas centralizadas ante errores y rutas inexistentes. |
| `src/docs/swagger.js` | Especificación OpenAPI y documentación Swagger. |
| `src/utils/jwt.util.js` | Emisión/verificación de tokens y expiración configurada. |
| `src/utils/password.util.js` | Tratamiento de contraseñas con bcrypt. |
| `src/utils/crypto.util.js` | Operaciones criptográficas auxiliares. |
| `src/scripts/crearAdmin.js` | Creación controlada de cuenta administrativa inicial. |
| `scripts/probar-conexion.js` | Diagnóstico de conexión a PostgreSQL. |
| `certs/prod-ca-2021.crt` | Certificado CA que utiliza la configuración TLS adjunta; verificar vigencia y origen. |
| `database/` | SQL de estructura, migraciones y comprobaciones. |

### 5.2 Configuración segura del backend

Revisar `.env.example` del backend y el `.env` local. Variables relevantes: `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `ALLOWED_ORIGIN`, `PORT` y las variables `ADMIN_*` para bootstrap. No publicar valores reales. En `src/config/database.js`, el pool usa `max: 5`, TLS con CA y `rejectUnauthorized: true`.

El backend permite orígenes CORS incluidos en `ALLOWED_ORIGIN` y emplea JWT en los recursos web. El navegador **no debe contener una API Key privada**.

## 6. Autenticación y control de acceso

1. El usuario envía credenciales a `POST /api/auth/login`.
2. El backend valida credenciales y emite un JWT de duración limitada.
3. React guarda la sesión en `sessionStorage` y envía `Authorization: Bearer <token>` a los endpoints autorizados.
4. El backend comprueba token, rol y propiedad del recurso en cada operación protegida.
5. Al expirar o revocarse el token, el frontend invalida la sesión y solicita nuevo inicio de sesión.

**RBAC:** administrador gestiona recursos y usuarios; médico consulta y atiende citas asignadas; paciente solicita y consulta citas propias, con las operaciones permitidas por el backend. **BOLA/IDOR:** cambiar manualmente un identificador no debe permitir acceder a una cita de otro usuario.

**Estados de cita:** `programada → confirmada → atendida`, o cancelación desde estados permitidos. El servicio `actualizarEstadoCita` aplica transiciones atómicas en PostgreSQL. El control de horario se apoya en índices únicos parciales para médico y consultorio cuando el estado no es `cancelada`.

## 7. Base de datos: modelo y orden de instalación

El diagrama suministrado muestra **9 tablas del esquema `public`**: `roles`, `usuarios`, `especialidades`, `pacientes`, `medicos`, `consultorios`, `citas`, `password_reset_tokens` y `codigos_recuperacion`. `usuarios.auth_user_id` puede referenciar `auth.users`, aunque el backend adjunto autentica con contraseñas propias y JWT. Las tablas de recuperación guardan **hashes**, no códigos o tokens en texto plano.



### 7.1 Tablas y relaciones de la Base de Datos

| Tabla | Propósito | Relaciones principales |
|---|---|---|
| `roles` | Catálogo de perfiles de acceso | `usuarios.rol_id → roles.id` |
| `usuarios` | Cuentas, hash de contraseña, estado y versión de sesión | `auth_user_id → auth.users.id` (opcional) |
| `especialidades` | Catálogo clínico | `medicos.especialidad_id → especialidades.id` |
| `pacientes` | Fichas y documentos | `usuario_id → usuarios.id` (opcional) |
| `medicos` | Profesionales y registros médicos | `usuario_id → usuarios.id` (opcional) |
| `consultorios` | Ubicaciones y disponibilidad | Referenciada por `citas` |
| `citas` | Agenda, horario, motivo y estado | FK a pacientes, médicos y consultorios |
| `password_reset_tokens` | Recuperación administrativa con token de un solo uso | FK a usuario y administrador |
| `codigos_recuperacion` | Códigos de respaldo de un solo uso | FK a usuario |

### 7.2 Índices, restricciones y duplicados

Las restricciones `PRIMARY KEY` y `UNIQUE` crean índices automáticamente. Las capturas incluyen índices simples (`idx_citas_fecha`, `idx_citas_medico`, etc.), índices de unicidad insensibles a mayúsculas (`uq_..._ci`) y pares de índices para horarios (`uq_citas_medico_horario` y `uq_citas_medico_horario_activo`, y equivalentes para consultorios). **No hay que recrearlos a ciegas**: podrían ser redundantes o tener condiciones distintas. Para identificar la definición exacta, ejecutar `05_verificacion_lectura.sql` y comparar `indexdef`.



### 7.3 RLS y Data API


La función `rls_auto_enable` visible en Supabase es una función de seguridad/automatización del proyecto. 

## 8. Pruebas finales sugeridas

| Prueba | Resultado esperado |
|---|---|
| Login correcto | JWT y usuario autenticado |
| Login con contraseña incorrecta | Acceso rechazado |
| Paciente consulta citas propias | `200`, únicamente citas autorizadas |
| Paciente consulta cita ajena | `403` o `404` según política del endpoint, nunca datos ajenos |
| Médico consulta citas asignadas | `200`, únicamente citas autorizadas |
| Médico intenta atender cita ajena | Operación rechazada |
| Administrador consulta dashboard | Indicadores y nombres relacionados |
| Crear cita en horario ocupado | Conflicto rechazado por lógica y/o índice único |
| JWT expirado o revocado | `401` y cierre de sesión controlado |
| Cambiar contraseña | Revoca tokens anteriores mediante `version_sesion` |
| Código de recuperación utilizado | No puede reutilizarse |
| `npm run build` y `npm run lint` en FE | Finalización sin errores |

## 9. Comandos de verificación

**Terminal backend:**

```powershell
npm ci
node scripts/probar-conexion.js
npm run dev
```

**Terminal frontend:**

```powershell
npm ci
npm run lint
npm run build
npm run dev
```

Accesos locales habituales: frontend `http://localhost:5173`; API `http://localhost:3000`; Swagger `http://localhost:3000/api-docs` (verificar el montaje en `src/app.js`).

## 10. Alcance y cierre

Frontend SPA, backend REST, persistencia relacional, autenticación JWT, RBAC, BOLA/IDOR, citas, agenda, recuperación y dashboard; documentar las pruebas con fecha, rol, entrada, respuesta HTTP y evidencia.
