# README 11 — Actualización progresiva de la API Hospital Segura

**Guía de trabajo para estudiantes que ya finalizaron el README 8**  
**Tecnologías:** Node.js, Express, Swagger/OpenAPI, PostgreSQL (Supabase), JWT, API Key y bcrypt.  
**Alcance:** actualización de la base de datos, verificación de los mecanismos de cuenta y preparación del backend para React + Vite, hasta la documentación Swagger. **Todavía no se desarrolla el frontend.**

## ¿Qué vamos a conseguir?

Al terminar, conservarás las **siete tablas hospitalarias que ya creaste** y añadirás únicamente:

- `usuarios.version_sesion`: permite invalidar tokens JWT antiguos al cambiar o restablecer una contraseña.
- `password_reset_tokens`: registra recuperaciones autorizadas por un administrador mediante tokens temporales, almacenados como hash.
- `codigos_recuperacion`: conserva hashes de códigos de respaldo de un solo uso.

Tu base debe mostrar **nueve tablas propias en `public`** y una relación ya existente desde `public.usuarios.auth_user_id` hasta `auth.users.id`. La tabla `auth.users` pertenece a Supabase Auth: **no debes crearla**. Tampoco confundas el UUID `auth_user_id` con un hash de contraseña.

> **Punto de partida obligatorio:** conserva la base de datos y los registros del README 8. No ejecutes de nuevo `01_esquema_hospital.sql` ni `02_roles_seguridad.sql`; no hagas `DROP`, `TRUNCATE` ni `RESTART IDENTITY`. Los bloques 9 y 10 quedan reservados para pruebas posteriores a la integración backend–frontend.

## Paso 1. Descomprimir y preparar el proyecto

1. Descomprime el proyecto entregado y copiar solo los directorios relacionados al proyecto en curso y la configuración del .env
2. Desde la raíz, instala las dependencias con `npm ci` (si existe `package-lock.json`; en caso contrario, `npm install`).
3. Crea tu propio `.env` a partir del ejemplo o las indicaciones del proyecto. Configura PostgreSQL/Supabase, JWT, API Key y `ALLOWED_ORIGIN` con valores de **tu entorno**. 
4. En Supabase, abre el **mismo proyecto que utilizaste en el README 8** y accede a **SQL Editor**.
5. Ubica la carpeta `database/`. Los archivos de migración que utilizarás son exactamente estos:

```text
database/
├── 01_esquema_hospital.sql              # referencia: ya aplicado
├── 02_roles_seguridad.sql               # referencia: ya aplicado
├── 03_verificacion.sql                  # diagnóstico, no modifica datos: ya aplicado
├── 11_3_version_sesion.sql              # ejecutar primero
├── 11_4_password_reset_tokens.sql       # ejecutar segundo
└── 11_4_2_codigos_recuperacion.sql       # ejecutar tercero
```

Los tres archivos `11_*` **ya contienen el SQL necesario**: no debes crear las tablas manualmente ni modificar los archivos JavaScript suministrados.

## Paso 2. Comprobar el estado inicial de la base de datos

Antes de cualquier cambio, ejecuta `database/03_verificacion.sql` y luego las siguientes consultas en Supabase SQL Editor. **Todas son de solo lectura.**


Ejecutar en Supabase SQL Editor. Este bloque **solo consulta**, no modifica datos:

```sql
-- BD-00A: siete tablas que provienen del Bloque 8
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
  AND table_name IN (
    'roles', 'usuarios', 'especialidades', 'pacientes',
    'medicos', 'consultorios', 'citas'
  )
ORDER BY table_name;

-- BD-00B: roles ya existentes (NO volver a insertarlos)
SELECT id, nombre, activo FROM public.roles ORDER BY id;

-- BD-00C: usuarios existentes y sus perfiles, sin mostrar hashes
SELECT u.id AS usuario_id, u.email, r.nombre AS rol,
       p.id AS paciente_id, m.id AS medico_id
FROM public.usuarios u
JOIN public.roles r ON r.id = u.rol_id
LEFT JOIN public.pacientes p ON p.usuario_id = u.id
LEFT JOIN public.medicos m ON m.usuario_id = u.id
ORDER BY u.id;

-- BD-00D: comprobar que la relación con auth.users ya existe
SELECT tc.constraint_name, kcu.column_name,
       ccu.table_schema AS esquema_destino,
       ccu.table_name AS tabla_destino,
       ccu.column_name AS columna_destino
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
 AND tc.constraint_schema = kcu.constraint_schema
JOIN information_schema.constraint_column_usage ccu
  ON tc.constraint_name = ccu.constraint_name
 AND tc.constraint_schema = ccu.constraint_schema
WHERE tc.table_schema = 'public'
  AND tc.table_name = 'usuarios'
  AND tc.constraint_type = 'FOREIGN KEY'
  AND kcu.column_name = 'auth_user_id';
```

**Interpretación:** si no aparecen las siete tablas, se está usando una base diferente o falta completar el Bloque 8; no continuar con migraciones sin corregirlo. La consulta de `auth_user_id` debe indicar `auth.users(id)` en el esquema original. Si no aparece, revisar el esquema realmente desplegado antes de alterar tablas: **no inventar ni recrear manualmente `auth.users`**.


**Comprueba:** deben existir las siete tablas `roles`, `usuarios`, `especialidades`, `pacientes`, `medicos`, `consultorios` y `citas`; los roles de negocio deben existir y la relación `usuarios.auth_user_id → auth.users.id` debe aparecer. Si falta algo, revisa el README 8 antes de continuar.

## Paso 3. Agregar el control de versión de sesión

Abre `database/11_3_version_sesion.sql`, copia su contenido completo y ejecútalo en SQL Editor. El script incorpora a `public.usuarios` una columna `version_sesion INTEGER NOT NULL DEFAULT 0`, conservando las cuentas y sus contraseñas existentes.

**¿Para qué sirve?** Cada vez que la API cambia o restablece una contraseña, incrementa la versión de sesión; los JWT emitidos con una versión anterior dejan de ser válidos.

**Verificación inmediata:**

```sql
SELECT u.id, u.email, r.nombre AS rol, u.version_sesion,
       (u.password_hash IS NOT NULL) AS tiene_password_hash
FROM public.usuarios u
JOIN public.roles r ON r.id = u.rol_id
ORDER BY u.id;
```

Al principio las cuentas no modificadas suelen tener `version_sesion = 0`. Si ya hiciste pruebas, el valor puede ser mayor. **No muestres `password_hash` ni contraseñas en las evidencias.**

## Paso 4. Crear la recuperación administrativa

Abre y ejecuta completo `database/11_4_password_reset_tokens.sql`.

Este script crea `public.password_reset_tokens` con `usuario_id` (cuenta que recupera acceso), `administrador_id` (cuenta que autoriza), `token_hash`, `fecha_creacion`, `fecha_expiracion` y `fecha_uso`. Incorpora claves foráneas, índices, restricciones de fechas, RLS y revocación de permisos directos para roles públicos.

**¿Por qué se almacena un hash?** Si alguien accede a la tabla, no debe encontrar el token legible con el que se restablece la contraseña. La fecha de vencimiento limita su vigencia y la fecha de uso impide reutilizarlo.

**Verificación inmediata:**

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'password_reset_tokens'
ORDER BY ordinal_position;
```

Es normal que la tabla esté **vacía**: los registros aparecerán cuando realices las pruebas de recuperación en Swagger.

## Paso 5. Crear los códigos de recuperación

Abre y ejecuta completo `database/11_4_2_codigos_recuperacion.sql`.

Se crea `public.codigos_recuperacion` con `usuario_id`, `codigo_hash`, `fecha_creacion` y `fecha_uso`. El script añade clave foránea, índice por usuario, restricción temporal, RLS y revocaciones de acceso directo.

**¿Para qué sirven?** Son códigos de respaldo que el usuario genera estando autenticado; cada código se utiliza una sola vez para recuperar acceso. La API guarda únicamente su hash.

**Verificación inmediata:**

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'codigos_recuperacion'
ORDER BY ordinal_position;
```

Tampoco necesitas insertar códigos manualmente: se crean mediante los endpoints de la API.

## Paso 6. Verificar que el esquema quedó como el diagrama

Abre **Supabase → Database → Schema Visualizer** y selecciona `public`. Debes observar:

| Elemento | Resultado esperado |
|---|---|
| Tablas originales | Se conservan las siete tablas del README 8 |
| `usuarios` | Tiene `version_sesion` además de `auth_user_id` y `password_hash` |
| `password_reset_tokens` | Se relaciona dos veces con `usuarios` (`usuario_id`, `administrador_id`) |
| `codigos_recuperacion` | Se relaciona con `usuarios` mediante `usuario_id` |
| `auth.users.id` | Se muestra como referencia externa del esquema `auth`, no como tabla nueva en `public` |
| Seguridad de filas | RLS habilitado en las nueve tablas propias |

Ejecuta ahora las consultas siguientes. Te permitirán comprobar **estructura, relaciones, índices, políticas y privilegios**, incluso si el visualizador no muestra todas las líneas.

### Verificación 01
Nueve tablas y RLS habilitado:**

```sql
SELECT c.relname AS tabla, c.relrowsecurity AS rls_habilitado
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind IN ('r','p')
  AND c.relname IN (
    'roles','usuarios','especialidades','pacientes','medicos',
    'consultorios','citas','password_reset_tokens','codigos_recuperacion'
  )
ORDER BY c.relname;
```

**Esperado:** nueve filas, todas con `rls_habilitado = true`. **RLS habilitado no implica RLS aplicado a conexiones con `BYPASSRLS`.**


### Verificación 02
Nueva columna de sesión:**

```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'usuarios'
  AND column_name = 'version_sesion';

SELECT u.id, u.email, r.nombre AS rol, u.version_sesion,
       (u.password_hash IS NOT NULL) AS tiene_password_hash
FROM public.usuarios u
JOIN public.roles r ON r.id = u.rol_id
ORDER BY u.id;
```

**Esperado:** `integer`, `NO`, `0` como valor predeterminado. La versión puede ser mayor que cero si ya se probó un cambio de contraseña.


### Verificación 03
Columnas de las dos nuevas tablas:**

```sql
SELECT table_name, ordinal_position, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('password_reset_tokens','codigos_recuperacion')
ORDER BY table_name, ordinal_position;
```


### Verificación 04
Claves foráneas, incluyendo relación con `auth.users`:**

```sql
SELECT tc.table_name AS tabla_origen, kcu.column_name AS columna_origen,
       ccu.table_schema AS esquema_destino,
       ccu.table_name AS tabla_destino,
       ccu.column_name AS columna_destino
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
 AND tc.constraint_schema = kcu.constraint_schema
JOIN information_schema.constraint_column_usage ccu
  ON tc.constraint_name = ccu.constraint_name
 AND tc.constraint_schema = ccu.constraint_schema
WHERE tc.table_schema = 'public'
  AND tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN ('usuarios','pacientes','medicos',
                       'password_reset_tokens','codigos_recuperacion')
ORDER BY tc.table_name, kcu.column_name;
```

**Esperado:** `usuarios.auth_user_id → auth.users.id` (preexistente); `password_reset_tokens.usuario_id` y `.administrador_id → public.usuarios.id`; `codigos_recuperacion.usuario_id → public.usuarios.id`; además de relaciones de roles y perfiles existentes.


### Verificación 05
Índices y restricciones de las nuevas tablas:**

```sql
SELECT tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('password_reset_tokens','codigos_recuperacion')
ORDER BY tablename, indexname;

SELECT conrelid::regclass AS tabla, conname AS restriccion,
       pg_get_constraintdef(oid) AS definicion
FROM pg_constraint
WHERE connamespace = 'public'::regnamespace
  AND conrelid IN (
    'public.password_reset_tokens'::regclass,
    'public.codigos_recuperacion'::regclass
  )
ORDER BY tabla, restriccion;
```


### Verificación 07
Auditoría de políticas y privilegios RLS:**

```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

SELECT rolname, rolcanlogin, rolbypassrls
FROM pg_roles
WHERE rolname IN ('anon','authenticated','authenticator','postgres','service_role')
ORDER BY rolname;

SELECT grantee, table_name, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND grantee IN ('anon','authenticated','PUBLIC')
ORDER BY grantee, table_name, privilege_type;
```

**Esperado:** no debe existir una política universal `permitir_lectura_usuarios` con `USING (true)`; las consultas pueden devolver cero filas cuando no hay políticas/grants visibles. La conexión docente del backend se identificó como `postgres`, con `BYPASSRLS = true`. **No ejecutar `DROP POLICY` a ciegas**: solo si esa política específica existe y tras confirmar el esquema con el docente.


### Verificación 08
Comprobación de la conexión real del backend:** desde el script `scripts/probar-conexion.js` o el módulo que utiliza el mismo `pg.Pool`, ejecutar esta consulta; **no** tomar el resultado de SQL Editor como identidad del backend:

```sql
SELECT current_user AS usuario,
       session_user AS sesion,
       current_setting('row_security') AS rls_configuracion,
       rolbypassrls AS puede_omitir_rls
FROM pg_roles
WHERE rolname = current_user;
```

**Interpretación:** si `puede_omitir_rls = true`, las consultas del backend no quedan aisladas por RLS. Los controles de acceso deben comprobarse en Express (JWT, RBAC y BOLA/IDOR). Es un hallazgo pendiente para un futuro endurecimiento de PostgreSQL.


> **Importante:** habilitar RLS no demuestra que se aplique a la conexión del backend. En las pruebas docentes, `pg.Pool` utilizó `postgres` con `BYPASSRLS`. El aislamiento comprobado en los endpoints depende de JWT, RBAC y BOLA/IDOR de Express. No agregues políticas permisivas (`USING (true)`) ni cambies los roles de conexión sin una migración controlada.

## Paso 7. Iniciar la API y reconocer los cambios funcionales

1. Ejecuta `npm run dev` desde la raíz del proyecto.
2. Abre `http://localhost:3000/api-docs`.
3. Identifica los endpoints de autenticación y recuperación incluidos en el código suministrado.
4. Prepara cuentas **de prueba** de administrador, médico y al menos dos pacientes; comprueba la asociación `usuarios ↔ pacientes/médicos` antes de probar citas.

Lo que ya incorpora el backend y debes comprender:

| Función | Razón del cambio |
|---|---|
| Cambio de contraseña propia | Comprueba la contraseña actual, guarda un nuevo hash bcrypt e incrementa `version_sesion` |
| Recuperación administrativa | Permite emitir un token temporal de un solo uso, sujeto a autorización del administrador |
| Restablecimiento con token | Consume el token, cambia la contraseña e invalida sesiones anteriores |
| Códigos de recuperación | Genera ocho códigos de respaldo, permite consultar el saldo, regenerarlos y consumir uno |
| RBAC y BOLA/IDOR | Restringen operaciones según rol y evitan acceder a citas ajenas cambiando IDs |
| CORS | Permite el origen de desarrollo `http://localhost:5173` para la futura SPA |
| Login público controlado | Permite iniciar sesión sin exponer una API Key privada en React; mantiene validaciones y rate limit |
| JWT para recursos | Permite consultar recursos autorizados con `BearerAuth` sin API Key del navegador |
| API Key para integraciones privadas | Mantiene protegida `/api/seguridad/cliente` |
| Swagger actualizado | Documenta las credenciales exigidas realmente por cada operación |

**Precisión sobre las rutas:** el login no exige API Key; `GET /api/citas/mis-citas` usa JWT. Algunas operaciones de recuperación aún requieren API Key según el middleware actual, por lo que **no deben considerarse preparadas para React**. Verifica cada ruta en Swagger antes de ejecutarla.

## Paso 8. Ejecutar las pruebas en Swagger, en orden

Usa exclusivamente cuentas de laboratorio. Antes de cada prueba actualiza el esquema **Authorize** correspondiente (`BearerAuth` o `ApiKeyAuth`). Anota el código HTTP y evita capturas con tokens, contraseñas o claves completas.

| Orden | Prueba | Resultado esperado |
|---|---|---|
| 1 | Login válido `POST /api/auth/login` | `200` y JWT |
| 2 | Login con JSON inválido | `400` |
| 3 | Perfil o recurso protegido sin JWT | `401` |
| 4 | Cambio de contraseña con contraseña actual correcta | Éxito; `version_sesion` aumenta |
| 5 | Intento de usar JWT anterior | `401` |
| 6 | Login con contraseña nueva | `200` |
| 7 | Cambio de contraseña con contraseña actual incorrecta | Rechazo; no altera el hash ni la versión |
| 8 | Administrador genera recuperación para una cuenta de prueba | Token temporal emitido; registro en tabla |
| 9 | Restablecimiento mediante token válido | Éxito; token marcado como utilizado |
| 10 | Reutilización o vencimiento del token | Rechazo |
| 11 | Usuario no administrador intenta generar recuperación administrativa | `403` una vez superada la autenticación exigida |
| 12 | Usuario autenticado genera ocho códigos de respaldo | Códigos emitidos una vez; hashes almacenados |
| 13 | Consulta de estado de códigos | `200`; cantidad disponible coherente |
| 14 | Regeneración de códigos | Los anteriores quedan invalidados |
| 15 | Restablecimiento con un código válido | Éxito; código consumido |
| 16 | Reutilización de un código | Rechazo |
| 17 | Paciente consulta `/api/citas/mis-citas` con JWT | `200` |
| 18 | Paciente consulta citas de otro paciente | `403` |
| 19 | Paciente intenta `GET /api/citas` administrativo | `403` |
| 20 | `GET /api/seguridad/cliente` sin API Key | `401` |
| 21 | `GET /api/seguridad/cliente` con API Key válida | `200` |
| 22 | Login sin API Key y cuerpo inválido | `400` (no «API Key requerida») |
| 23 | `mis-citas` sin JWT y sin API Key | `401` |
| 24 | `mis-citas` con JWT y sin API Key | `200` |
| 25 | Swagger: login, recursos y cliente privado | Sin credencial previa / `BearerAuth` / `ApiKeyAuth`, respectivamente |

Los códigos exactos de error para tokens o códigos inválidos deben contrastarse con la respuesta real de los controladores. **No inventes IDs**: usa los identificadores que tenga tu base de datos.

## Paso 9. Volver a Supabase y comprobar lo que hicieron las pruebas

Después de ejecutar los cambios de contraseña y recuperaciones, vuelve al SQL Editor. Comprueba que la base registra las modificaciones **sin consultar hashes completos**.

### Estado de tokens y códigos
Estado de tokens y códigos después de probar Swagger:**

```sql
-- No seleccionar token_hash ni codigo_hash.
SELECT usuario_id, administrador_id, fecha_creacion,
       fecha_expiracion, fecha_uso,
       CASE WHEN fecha_uso IS NOT NULL THEN 'UTILIZADO'
            WHEN fecha_expiracion <= NOW() THEN 'EXPIRADO'
            ELSE 'VIGENTE' END AS estado
FROM public.password_reset_tokens
ORDER BY fecha_creacion DESC;

SELECT usuario_id, COUNT(*) AS total,
       COUNT(*) FILTER (WHERE fecha_uso IS NULL) AS disponibles,
       COUNT(*) FILTER (WHERE fecha_uso IS NOT NULL) AS utilizados
FROM public.codigos_recuperacion
GROUP BY usuario_id
ORDER BY usuario_id;
```

**Esperado:** antes de usar recuperación las tablas pueden estar vacías (es normal). Después de las pruebas, los tokens/códigos consumidos deben mostrar `fecha_uso` o disminuir el conteo disponible. No crear manualmente registros falsos para hacer aparecer datos en el diagrama: las filas se generan por los endpoints.


**Interpretación:** `fecha_uso` debe marcar los tokens y códigos consumidos; el número de códigos disponibles disminuye al usarlos. Si no realizaste todavía una recuperación, es normal obtener cero registros.

## Paso 10. Comprobar CORS desde PowerShell

Con el backend iniciado, ejecuta:

```powershell
curl.exe -i -X OPTIONS "http://localhost:3000/api/auth/login" `
  -H "Origin: http://localhost:5173" `
  -H "Access-Control-Request-Method: POST" `
  -H "Access-Control-Request-Headers: content-type"
```

**Esperado:** HTTP `204 No Content` y `Access-Control-Allow-Origin: http://localhost:5173`. Esta prueba verifica el preflight, no sustituye las pruebas de autenticación.

## Paso 11. Registrar evidencias y cerrar la actividad

Entrega una tabla sencilla con **prueba, endpoint o query, rol, HTTP/resultado, aprobado o pendiente y observación**, acompañada de:

1. Captura del esquema final con nueve tablas y la relación `auth.users.id`.
2. Evidencia de `version_sesion` y de las dos tablas nuevas (sin hashes ni secretos visibles).
3. Evidencia del JWT revocado después del cambio de contraseña.
4. Evidencia de token y código de recuperación consumidos una sola vez.
5. Evidencia de `403` por RBAC/BOLA-IDOR, `204` en CORS y esquemas correctos en Swagger.
6. Conclusión breve: diferencia entre RLS habilitado en PostgreSQL y controles de autorización de Express.

**Pendientes del proyecto:** resolver el uso de `postgres` con `BYPASSRLS` antes de producción; revisar rutas de recuperación para navegador; integrar React + Vite; y posteriormente ejecutar los bloques 9 y 10 de pruebas de seguridad del sistema integrado.

---

**Fin del README 11.** La actividad termina con la base migrada, la API verificada y Swagger alineado con los mecanismos de autenticación. No se exige desarrollar React en este bloque.
