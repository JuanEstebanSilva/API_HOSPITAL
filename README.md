# API Hospital Segura — Sistema Hospitalario Full-Stack Desacoplado

**React 19 + Vite 8 (SPA) | Node.js + Express 5 (API REST) | PostgreSQL / Supabase**

---

## 1. Visión General del Proyecto

**API Hospital Segura** es una solución integral y desacoplada para la gestión médica y hospitalaria, diseñada con un enfoque riguroso de ciberseguridad, control de acceso basado en roles (RBAC), prevención de vulnerabilidades de acceso a objetos (BOLA/IDOR), revocación inmediata de sesiones mediante versionado de tokens JWT, recuperación segura de contraseñas y auditoría relacional.

La arquitectura se divide en dos capas completamente independientes:
1. **Frontend (SPA):** Desarrollada con **React 19, Vite 8, React Router 7 y Bootstrap 5.3**, alojada en `api-hospital-frontend/` (puerto `5173`).
2. **Backend (API REST):** Desarrollada con **Node.js y Express 5 (CommonJS)**, alojada en el directorio raíz (puerto `3000`), documentada con **OpenAPI 3.0 / Swagger UI** y conectada a **PostgreSQL** (compatible tanto con Supabase en la nube como con instancias locales).

```text
                                ARQUITECTURA DEL SISTEMA

     [ Navegador Web / Cliente ]
                  │
                  ▼
   ┌──────────────────────────────┐
   │ React 19 + Vite 8 SPA        │ (http://localhost:5173)
   │ React Router 7 + Bootstrap 5 │
   └──────────────┬───────────────┘
                  │  fetch HTTP / JSON + JWT (Bearer)
                  ▼
   ┌──────────────────────────────┐
   │ Node.js + Express 5 REST API │ (http://localhost:3000)
   │ ──────────────────────────── │
   │ • Middlewares de Seguridad   │ (Helmet, CORS, Rate Limit, API Key)
   │ • Autenticación & Versión    │ (JWT, version_sesion, bcrypt)
   │ • Control RBAC & BOLA/IDOR   │ (Roles, propiedad de recursos)
   │ • Documentación Swagger      │ (/api-docs, /openapi.json)
   └──────────────┬───────────────┘
                  │  pg.Pool (TLS/CA o Conexión Directa)
                  ▼
   ┌──────────────────────────────┐
   │ Base de Datos PostgreSQL     │ (Supabase Cloud o Local :5432)
   │ ──────────────────────────── │
   │ • 9 Tablas Consolidadas      │
   │ • Row Level Security (RLS)   │
   │ • Índices Parciales Únicos   │ (Anti-conflicto de horarios)
   └──────────────────────────────┘
```

---

## 2. Características de Seguridad Implementadas

- **Autenticación Robusta con JWT y Revocación Dinámica:**
  - Emisión de tokens firmados con expiración estricta (`1h`).
  - Control de versión de sesión (`usuarios.version_sesion`): cualquier cambio de contraseña o restablecimiento incrementa la versión en base de datos, invalidando de inmediato todos los tokens emitidos previamente.
- **Control de Acceso Basado en Roles (RBAC):**
  - `administrador`: Gestión global de usuarios, roles, catálogo de especialidades, médicos, consultorios, citas y generación administrativa de tokens de recuperación.
  - `medico`: Consulta de su propio contexto profesional, consulta de su agenda médica y atención/confirmación de citas exclusivamente asignadas.
  - `paciente`: Consulta de su propio contexto clínico, solicitud de citas médicas, consulta de citas propias y cancelación de sus citas programadas.
- **Prevención de BOLA / IDOR (Broken Object Level Authorization):**
  - Validación de propiedad en endpoints de citas (`/api/citas/:id`) y recursos personales mediante `propiedad.middleware.js`.
  - Imposibilidad de consultar, alterar o cancelar citas de otros pacientes o médicos manipulando identificadores en la URL.
- **Recuperación Administrativa de Contraseñas:**
  - Endpoint `POST /api/auth/recuperacion/admin/:id`: emisión de tokens temporales de un solo uso con caducidad de 15 minutos, almacenando exclusivamente su hash SHA-256 (`password_reset_tokens`).
  - Restablecimiento seguro mediante `POST /api/auth/restablecer-password`.
- **Códigos de Respaldo de Un Solo Uso:**
  - Generación (`POST /api/auth/codigos-recuperacion`) y regeneración (`POST /api/auth/codigos-recuperacion/regenerar`) de 8 códigos de emergencia formateados (`XXXX-XXXX`).
  - Almacenamiento exclusivo del hash en `codigos_recuperacion`. Consumo transaccional atómico y no reutilizable.
- **Autenticación Multi-Cliente por API Key:**
  - Protección de endpoints de gestión externa o integración B2B mediante cabecera `X-API-Key`.
  - Exclusión deliberada de endpoints públicos o consumidos por navegadores (evitando la exposición de secretos en el cliente).
- **Protección de Red y Servidor:**
  - Encabezados de seguridad HTTP con `helmet`.
  - Política restrictiva de CORS (`ALLOWED_ORIGIN=http://localhost:3000,http://localhost:5173`).
  - Limitador de tasa (`express-rate-limit`) con exclusión en peticiones exitosas para mitigar ataques de fuerza bruta en login.

---

## 3. Modelo de Datos Relacional (9 Tablas)

La base de datos en PostgreSQL gestiona las siguientes 9 tablas en el esquema `public`:

| Tabla | Descripción | Claves y Relaciones Principales |
|---|---|---|
| `roles` | Catálogo de perfiles (`administrador`, `medico`, `paciente`). | `PRIMARY KEY (id)` |
| `usuarios` | Cuentas de usuario, credenciales, `version_sesion` y estado. | `rol_id → roles.id`, `auth_user_id → auth.users.id` |
| `especialidades` | Catálogo clínico hospitalario. | `PRIMARY KEY (id)`, `UNIQUE (nombre)` |
| `pacientes` | Fichas personales y documentos de identidad. | `usuario_id → usuarios.id`, `UNIQUE (documento)` |
| `medicos` | Registro médico y asignación de especialidad. | `usuario_id → usuarios.id`, `especialidad_id → especialidades.id` |
| `consultorios` | Espacios físicos y disponibilidad hospitalaria. | `PRIMARY KEY (id)`, `UNIQUE (codigo)` |
| `citas` | Agenda médica, horario, motivo y estado de atención. | `paciente_id → pacientes.id`, `medico_id → medicos.id`, `consultorio_id → consultorios.id` |
| `password_reset_tokens` | Tokens temporales hash de recuperación administrativa. | `usuario_id → usuarios.id`, `administrador_id → usuarios.id` |
| `codigos_recuperacion` | Hashes de códigos de respaldo de un solo uso. | `usuario_id → usuarios.id` |

### Integridad y Control de Conflictos
- **Índices de unicidad parcial en `citas`:**
  - Evitan que un mismo médico tenga dos citas en el mismo día y hora salvo que el estado sea `'cancelada'`.
  - Evitan que un mismo consultorio sea asignado dos veces en la misma franja horaria salvo que esté `'cancelada'`.
- **Transiciones de estado atómicas:** `programada → confirmada → atendida`, o `cancelada` desde estados vigentes.

---

## 4. Estructura del Repositorio

```text
API_HOSPITAL/
├── api-hospital-frontend/          # Aplicación SPA React 19 + Vite 8
│   ├── src/
│   │   ├── assets/                 # Recursos gráficos (hero, equipo de salud)
│   │   ├── components/             # Componentes de negocio (Gestión, Agenda, Resumen, etc.)
│   │   ├── context/                # AuthContext para sesión y expiración JWT
│   │   ├── hooks/                  # useAuth, useDashboardData
│   │   ├── pages/                  # LoginPage, DashboardPage, RecuperarPasswordPage, RestablecerTokenPage
│   │   ├── services/               # Clientes HTTP modularizados (citas, usuarios, etc.)
│   │   ├── App.jsx                 # Enrutamiento declarativo con React Router 7
│   │   └── main.jsx                # Montaje de la aplicación React
│   ├── .env                        # Variables del cliente (VITE_API_URL=http://localhost:3000)
│   ├── package.json                # Dependencias del frontend
│   └── vite.config.js              # Configuración de empaquetado Vite
│
├── certs/
│   └── prod-ca-2021.crt            # Certificado CA para conexiones TLS a Supabase
│
├── database/                       # Scripts SQL de base de datos
│   ├── 01_esquema_hospital.sql     # DDL consolidado de las 9 tablas e índices
│   ├── 02_seed_roles.sql           # Inserción de roles base
│   ├── 03_seed_catalogos_demo_OPCIONAL.sql # Especialidades y consultorios demo
│   ├── 04_seguridad_rls.sql        # Habilitación de Row Level Security
│   ├── 05_verificacion_lectura.sql # Consultas de auditoría e inspección
│   └── 06_indices_adicionales_OPCIONAL.sql # Índices de optimización y unicidad
│
├── extraible/                      # [IGNORADO EN GIT] Archivo histórico y documentación previa
│   ├── bloque_7/                   # Guías, scripts de validación e insumos de Bloques 7.2 a 7.5.1
│   ├── bloque_8/                   # Guías, scripts de validación y diagramas del Bloque 8
│   ├── bloque_10/                  # Colección Postman del Bloque 10
│   ├── bloque_11/                  # Guía, scripts de validación, Postman y migraciones del Bloque 11
│   ├── bloque_12_frontend/         # PDFs de requerimientos, insumos BE y FE originales
│   ├── evidencias_e_informes/      # Informes Word .docx, capturas reales y scripts generadores
│   └── README.md                   # Documentación explicativa de la carpeta extraíble
│
├── scripts/                        # Suites de pruebas y utilidades de automatización
│   ├── setup_local_db.js           # Inicialización y migración completa de BD PostgreSQL
│   ├── seed_comprehensive_demo.js  # Carga de datos de prueba para todas las suites
│   ├── probar-conexion.js          # Diagnóstico de conexión y rol PostgreSQL
│   ├── test_api.js                 # Suite completa de integración de endpoints de la API Hospital
│   ├── test_seguridad.js           # Batería de 26 pruebas de seguridad: JWT, sesión, RBAC, BOLA y CORS
│   ├── test_swagger.js             # Verificación nativa rápida de Swagger UI y OpenAPI 3.0.3
│   ├── test_swagger_functional.py  # Validación automatizada de Swagger UI en navegador (Playwright/Edge)
│   └── test_e2e_browser.py         # Pruebas End-to-End en navegador real (Playwright/Edge)
│
├── src/                            # Código fuente del Backend Express
│   ├── config/
│   │   └── database.js             # Pool de PostgreSQL con detección automática SSL
│   ├── controllers/                # Controladores HTTP (auth, citas, usuarios, etc.)
│   ├── docs/
│   │   └── swagger.js              # Especificación OpenAPI 3.0.0
│   ├── middlewares/                # Auth JWT, Roles RBAC, Propiedad BOLA, API Key, Errores
│   ├── routes/                     # Definición de rutas y endpoints
│   ├── scripts/
│   │   └── crearAdmin.js           # Bootstrap administrativo idempotente
│   ├── services/                   # Lógica de negocio y consultas SQL parametrizadas
│   ├── utils/                      # Criptografía, generación de hashes y JWT
│   └── app.js                      # Inicializador Express y montaje general
│
├── .env.example                    # Plantilla de variables de entorno del backend
├── package.json                    # Dependencias y scripts NPM del backend
└── README.md                       # Documentación técnica general
```

### 4.1 Sobre la Carpeta `extraible/` (Aislada y Segura para Extracción)

Para mantener el repositorio de producción 100% limpio y libre de archivos temporales o insumos de laboratorios pasados, se consolidó la carpeta `extraible/`:
- **Propósito:** Contener ordenadamente todos los archivos `.md` de bloques previos, colecciones Postman históricas, PDFs de enunciados, scripts generadores de informes académicos y capturas de evidencias.
- **Aislamiento en Git:** La carpeta se encuentra configurada en `.gitignore`, por lo que **no forma parte del control de versiones**.
- **Independencia Operativa:** Esta carpeta no afecta en lo absoluto el procesamiento, ejecución, dependencias ni pruebas de la aplicación. **Puede ser extraída, comprimida o eliminada en cualquier momento sin alterar el correcto funcionamiento del sistema.**

---

## 5. Guía de Instalación y Puesta en Marcha

### 5.1 Requisitos Previos
- **Node.js:** Versión 18 o superior (verificar con `node -v`).
- **npm:** Versión 9 o superior (verificar con `npm -v`).
- **PostgreSQL:** Instancia local activa en puerto `5432` o proyecto en Supabase con certificado TLS.
- **Python (Opcional para E2E):** Versión 3.10+ con `playwright` instalado.

### 5.2 Configuración del Backend

1. **Instalar dependencias:**
   ```powershell
   npm install
   ```

2. **Configurar el archivo `.env`:**
   Crear el archivo `.env` en la raíz tomando como referencia `.env.example`:
   ```dotenv
   PORT=3000
   ALLOWED_ORIGIN=http://localhost:3000,http://localhost:5173

   API_KEY_POSTMAN=2d06b37d2bb5286e3b024067042652d30a030d67ac0b9d40b0f46be13cc03b
   API_KEY_ADMIN=29ec6e65fea95debfcf21d05fe5fef0864b3571c8d3303e9b829e7b17f57dc47
   API_KEY_MOVIL=c9e6ff90defda6a46de3adb392b15afb0785e76b83e3d591f607cf9798358e06

   JWT_SECRET=6ab7e94c7b775d79db246898dcd7c9562440113d9cc7ce9ef9796ebdc6f6a667213ae5b8a1d3882a27f19a7e302e7a3f560a93fee7386703ed8ec1e844f3cd6e
   JWT_EXPIRES_IN=1h

   ADMIN_NOMBRE=Administrador Hospital
   ADMIN_EMAIL=admin@hospital.com
   ADMIN_PASSWORD=SANTOTO_2026--2

   # PostgreSQL local activo o Supabase:
   DATABASE_URL=postgresql://postgres:admin123@localhost:5432/hospital
   ```

3. **Preparar la Base de Datos:**
   ```powershell
   npm run db:setup      # Crea las 9 tablas, esquemas, índices y catálogos
   npm run seed:admin    # Ejecuta el bootstrap administrativo (crea admin@hospital.com)
   npm run seed:demo     # Carga pacientes, médicos y citas de prueba para desarrollo
   ```

4. **Iniciar el Backend:**
   ```powershell
   npm run dev           # Modo desarrollo con nodemon en http://localhost:3000
   ```
   - **Documentación Swagger UI interactiva:** `http://localhost:3000/api-docs`
   - **Especificación OpenAPI en JSON:** `http://localhost:3000/openapi.json`

---

### 5.3 Configuración del Frontend

1. **Navegar e instalar dependencias:**
   ```powershell
   cd api-hospital-frontend
   npm install
   ```

2. **Verificar variables de entorno (`api-hospital-frontend/.env`):**
   ```dotenv
   VITE_API_URL=http://localhost:3000
   ```

3. **Iniciar el servidor de desarrollo Vite:**
   ```powershell
   npm run dev
   ```
   La aplicación estará disponible de inmediato en `http://localhost:5173`.

---

## 6. Credenciales de Demostración para Pruebas

| Rol | Correo Electrónico | Contraseña | Capacidades en el Sistema |
|---|---|---|---|
| **Administrador** | `admin@hospital.com` | `SANTOTO_2026--2` | Dashboard con métricas globales, gestión de usuarios, recuperación administrativa, catálogo de especialidades, médicos, pacientes, consultorios y todas las citas. |
| **Médico** | `medico.a@hospital.com` | `ClaveSegura2026*` | Mi Contexto Profesional, agenda médica interactiva, confirmación y atención de citas asignadas. |
| **Paciente** | `paciente.a@example.com` | `ClaveSegura2026*` | Mi Ficha de Paciente, solicitud directa de citas médicas, consulta de citas propias y cancelación de citas programadas. |

---

## 7. Baterías de Pruebas y Validación Integral

El proyecto dispone de un conjunto exhaustivo de scripts de prueba automatizados:

| Comando | Script | Cobertura y Objetivo |
|---|---|---|
| `npm run test:db` | `scripts/probar-conexion.js` | Diagnóstico de conexión a PostgreSQL, usuario actual y verificación de RLS. |
| `npm test` / `npm run test:api` | `scripts/test_api.js` | Suite completa de pruebas funcionales y de integración de los endpoints de la API Hospital. |
| `npm run test:seguridad` | `scripts/test_seguridad.js` | Suite de 26 pruebas de seguridad: JWT, versionado de sesión, tokens de recuperación, códigos de respaldo, RBAC, BOLA y CORS. |
| `npm run test:swagger` | `scripts/test_swagger.js` | Verificación nativa rápida de especificación OpenAPI 3.0.3 (38 rutas, 59 operaciones) y Swagger UI. |
| `npm run test:swagger:browser` | `scripts/test_swagger_functional.py` | Auditoría funcional interactiva de Swagger UI en navegador real (Edge/Playwright). |
| `npm run test:e2e` | `scripts/test_e2e_browser.py` | Pruebas End-to-End con Playwright navegando en navegador real (Login Admin/Médico/Paciente, Dashboard y navegación). |
| `npm --prefix api-hospital-frontend run lint` | Oxlint | Análisis estático de código del frontend (0 advertencias, 0 errores en 35 archivos). |
| `npm --prefix api-hospital-frontend run build` | Vite build | Compilación y empaquetado de producción de la SPA (59 módulos transformados exitosamente). |

---

## 8. Licencia y Autoría

- **Autor:** Juan Esteban Silva
- **Curso / Módulo:** Seguridad en APIs, Desarrollo Web y Bases de Datos
- **Licencia:** ISC
