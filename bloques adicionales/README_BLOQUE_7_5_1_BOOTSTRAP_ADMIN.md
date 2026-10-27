# Bloque 7.5.1 — Inicialización segura del administrador mediante script independiente (Bootstrap)

## Objetivo

Separar la creación del **primer usuario administrador** del arranque habitual de la **API Hospital** (Node.js, Express y Supabase/PostgreSQL). El bootstrap se ejecuta de forma explícita mediante `npm run seed:admin`, mientras que `npm run dev` y `npm start` solo inician el servicio HTTP.

> **Estado:** implementación propuesta y revisada a partir de los archivos compartidos; **pruebas BA01–BA09 pendientes de ejecución y registro de evidencias**. Este bloque complementa el README del **Bloque 7.5 — Migración e integración de módulos con PostgreSQL (Supabase)**; no lo sustituye.

## Antecedentes y alcance

En el Bloque 7.5, `src/app.js` ejecutaba `usuariosService.crearAdministradorInicial()` antes de `app.listen()`. Las credenciales iniciales (`ADMIN_NOMBRE`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`) se obtenían de `.env`.

El nuevo diseño mantiene el registro público con rol fijo `paciente`, la autenticación JWT, la autorización RBAC, la API Key global, el hash de contraseñas mediante `generarPasswordHash()` y el acceso PostgreSQL con TLS. **No modifica** las tablas ni los CRUD de pacientes, médicos, consultorios o citas.

## Metáfora: instalación frente a operación

El bootstrap equivale a entregar la primera llave maestra durante la instalación de un hospital. No tendría sentido fabricar una nueva llave maestra cada vez que se enciende el edificio. Una vez creado el primer administrador, la gestión de otros administradores corresponde a operaciones autorizadas dentro del sistema.

## Arquitectura: antes y después

### Antes (acoplado al arranque)

```text
npm run dev / npm start
          │
          ▼
       src/app.js
          │
          ├── crearAdministradorInicial()
          │        └── PostgreSQL
          ▼
      app.listen()
          │
          ▼
     API Hospital
```

### Después (responsabilidades separadas)

```text
INICIALIZACIÓN CONTROLADA              OPERACIÓN NORMAL

npm run seed:admin                     npm run dev / npm start
          │                                      │
          ▼                                      ▼
src/scripts/crearAdmin.js                    src/app.js
          │                                      │
          ▼                                      ▼
usuarios.service.js                 Helmet / CORS / rate limit
          │                           API Key / JWT / RBAC
          ▼                                      │
Transacción + bloqueo                         ▼
Verificar rol y administrador           Routes → Controllers
Hash bcrypt + INSERT                          │
          │                                      ▼
          └───────────► Supabase PostgreSQL ◄── Services
```

## Archivos intervenidos

| Archivo | Cambio | Propósito |
|---|---|---|
| `src/services/usuarios.service.js` | **Actualizar** `crearAdministradorInicial()` | Crear exclusivamente el primer administrador; impedir duplicación, sobrescritura y elevación accidental de privilegios. |
| `src/config/database.js` | **Agregar** `cerrarPool()` | Finalizar conexiones PostgreSQL al terminar el script. |
| `src/scripts/crearAdmin.js` | **Crear/completar** | Validar configuración, invocar bootstrap, informar resultado y cerrar el pool. |
| `src/app.js` | **Actualizar** | Eliminar la llamada automática al bootstrap y su importación; conservar Express, rutas, seguridad y Swagger. |
| `package.json` | **Actualizar** `scripts` | Exponer `npm run seed:admin`. |
| `.env` | **Uso temporal** de `ADMIN_*` | Suministrar credenciales solo durante la inicialización. |
| `.gitignore` | **Verificar** exclusión | Evitar que `.env` llegue al repositorio. |

## Estructura de referencia

```text
API_HOSPITAL/
├── .env                         # No versionar
├── .gitignore
├── package.json
├── certs/
│   └── prod-ca-2021.crt
└── src/
    ├── app.js
    ├── config/
    │   └── database.js
    ├── scripts/
    │   └── crearAdmin.js
    ├── services/
    │   └── usuarios.service.js
    ├── utils/
    │   └── password.util.js
    ├── routes/
    ├── controllers/
    └── middlewares/
```

## Reglas de negocio del bootstrap

1. Requiere `ADMIN_NOMBRE`, `ADMIN_EMAIL` y `ADMIN_PASSWORD` no vacíos.
2. Rechaza contraseñas iniciales de menos de **12 caracteres** y valida el formato básico del correo desde el script.
3. Genera el hash mediante `generarPasswordHash()`; **no almacena contraseñas en texto plano**.
4. Obtiene una conexión del `pool`, inicia transacción y usa `pg_advisory_xact_lock(7505, 1)` para serializar ejecuciones de este mismo bootstrap.
5. Si **ya existe cualquier usuario con rol `administrador`**, incluso inactivo, termina sin insertar ni modificar cuentas.
6. Si el correo inicial ya pertenece a un usuario de otro rol y no existe administrador, rechaza la operación; **no eleva privilegios**.
7. Si no existe administrador, exige que el rol `administrador` esté activo y crea el primer usuario.
8. Ejecuta `COMMIT` al completar la operación o `ROLLBACK` ante errores; libera el cliente PostgreSQL.
9. El script informa si creó o no un administrador y cierra el Pool mediante `cerrarPool()`.
10. **No** reinicia contraseñas, activa cuentas existentes ni crea administradores adicionales.

> **Límite de concurrencia:** el bloqueo asesor coordina ejecuciones que utilizan esa misma clave de bloqueo. No bloquea automáticamente otros endpoints o scripts que inserten administradores. Estos deben mantener autorización y controles propios.

## Requisitos previos

- Node.js y dependencias instaladas (`npm install`).
- Supabase/PostgreSQL accesible mediante `DATABASE_URL`.
- Certificado TLS disponible en la ruta esperada por `src/config/database.js`.
- Tablas `public.roles` y `public.usuarios` existentes.
- Rol `administrador` creado y activo para una base de datos sin administradores.
- `src/utils/password.util.js` operativo.
- Acceso autorizado a la terminal y a la configuración del entorno.

## Configuración de `package.json`

Agregar el script sin eliminar otros scripts o dependencias:

```json
{
  "scripts": {
    "dev": "nodemon src/app.js",
    "start": "node src/app.js",
    "seed:admin": "node src/scripts/crearAdmin.js"
  }
}
```

> Las rutas de `dev` y `start` son ejemplos: conservar las existentes si el proyecto utiliza otra ruta de entrada.

## Variables de entorno

Mantener las variables ya utilizadas por el proyecto, incluidas `DATABASE_URL`, `JWT_SECRET`, `API_KEY` y `ALLOWED_ORIGIN`. Solo para el bootstrap, suministrar:

```dotenv
ADMIN_NOMBRE=Administrador Hospital
ADMIN_EMAIL=admin@hospital.com
ADMIN_PASSWORD=REEMPLAZAR_POR_CONTRASENA_UNICA_DE_12_O_MAS_CARACTERES
```

El valor anterior de `ADMIN_PASSWORD` es un **marcador de posición, no una contraseña recomendada**. No publicar credenciales reales ni pegarlas en evidencias. En producción, preferir un gestor de secretos o suministro temporal protegido, y retirar estas variables una vez concluida la inicialización.

Verificar `.gitignore`:

```gitignore
.env
.env.*
!.env.example
```

Si `.env` fue versionado anteriormente, agregarlo a `.gitignore` no borra el historial: retirar su seguimiento y **rotar los secretos expuestos**.

## Procedimiento paso a paso

### Paso 1 — Inspeccionar el estado inicial en Supabase

Ejecutar en SQL Editor:

```sql
SELECT
  u.id,
  u.nombre,
  u.email,
  r.nombre AS rol,
  u.activo
FROM public.usuarios u
INNER JOIN public.roles r ON r.id = u.rol_id
WHERE r.nombre = 'administrador'
ORDER BY u.id;
```

Guardar la cantidad de administradores y sus identificadores **sin exponer hashes**. En el proyecto actual ya se había creado un administrador; por tanto, la primera ejecución del nuevo script debería detectar una cuenta existente y **no modificarla**.

### Paso 2 — Guardar los archivos actualizados

- Reemplazar `usuarios.service.js` por la versión que verifica cualquier administrador y usa transacción.
- Agregar `cerrarPool()` a `database.js` sin cambiar `consultar()` ni `pool`.
- Completar `src/scripts/crearAdmin.js` con `validarConfiguracion()`, `main()` y cierre en `finally`.
- Retirar de `src/app.js` la importación de `usuariosService` y la llamada `await usuariosService.crearAdministradorInicial()`.
- Agregar `seed:admin` a `package.json`.

### Paso 3 — Verificar sintaxis

```powershell
node --check src/services/usuarios.service.js
node --check src/config/database.js
node --check src/scripts/crearAdmin.js
node --check src/app.js
```

La ausencia de errores de sintaxis **no equivale** a pruebas funcionales aprobadas.

### Paso 4 — Ejecutar bootstrap explícito

```powershell
npm run seed:admin
```

**Escenario A: ya existe administrador** (esperado en la base actual):

```text
Iniciando bootstrap administrativo...
Ya existe una cuenta administradora.
No se realizaron modificaciones.
Bootstrap finalizado correctamente.
```

**Escenario B: base de prueba sin administradores**:

```text
Iniciando bootstrap administrativo...
Administrador inicial creado correctamente.
ID del administrador: <ID_ASIGNADO>
Bootstrap finalizado correctamente.
```

No borrar administradores de producción para reproducir el escenario B.

### Paso 5 — Verificar persistencia

Repetir la consulta SQL del Paso 1. En la base actual deben permanecer los mismos administradores y no deben aparecer duplicados.

### Paso 6 — Iniciar la API normalmente

```powershell
npm run dev
```

Comprobar:

- `GET http://localhost:3000/` devuelve la respuesta habitual de salud básica.
- Swagger UI: `http://localhost:3000/api-docs`.
- OpenAPI JSON: `http://localhost:3000/openapi.json`.
- El arranque **no** imprime mensajes de bootstrap ni crea cuentas.

### Paso 7 — Probar inicio de sesión

En Swagger, enviar las credenciales **actuales** del administrador a `POST /api/auth/login` con `X-API-Key` válida. Resultado esperado: autenticación exitosa y JWT, sujeto al comportamiento real del controller.

> Si el administrador ya existía, el script **no cambió su contraseña**. La contraseña configurada temporalmente en `ADMIN_PASSWORD` no reemplaza la contraseña del administrador existente.

### Paso 8 — Retirar secretos temporales

Una vez confirmado el acceso, retirar `ADMIN_NOMBRE`, `ADMIN_EMAIL` y `ADMIN_PASSWORD` del entorno operativo. Reiniciar la API y comprobar que sigue funcionando. El script `seed:admin`, en cambio, debe rechazar su ejecución sin estas variables.

## Matriz de pruebas 7.5.1

| ID | Escenario | Resultado esperado | Resultado real | Evidencia |
|---|---|---|---|---|
| BA01 | Ejecutar bootstrap con administrador existente | No inserta ni modifica usuarios | Pendiente | — |
| BA02 | Ejecutar bootstrap por segunda vez | No duplica administradores | Pendiente | — |
| BA03 | Consultar administradores antes y después | Mismos registros en la base actual | Pendiente | — |
| BA04 | Iniciar sesión con el administrador existente | `200` y JWT si las credenciales son correctas | Pendiente | — |
| BA05 | Iniciar API sin variables `ADMIN_*` | Express arranca normalmente | Pendiente | — |
| BA06 | Consultar recurso protegido con API Key y JWT | Respuesta según permisos RBAC | Pendiente | — |
| BA07 | Ejecutar `seed:admin` sin `ADMIN_*` | Error controlado y código de salida distinto de cero | Pendiente | — |
| BA08 | En base **de prueba** sin administradores, ejecutar bootstrap válido | Crea exactamente el primer administrador | Pendiente | — |
| BA09 | En base **de prueba** sin administradores, usar correo existente de paciente | Rechaza elevación de privilegios | Pendiente | — |

### Evidencias recomendadas

- Captura de la consulta SQL inicial (sin hashes).
- Salida de `npm run seed:admin` con administrador existente.
- Consulta SQL posterior que demuestre ausencia de duplicados.
- Inicio normal de Express sin mensajes de bootstrap.
- Inicio de sesión correcto desde Swagger (ocultando contraseñas, API Keys y JWT).
- Resultados BA08 y BA09 únicamente en una base de pruebas aislada.

## Primer administrador frente a administradores posteriores

| Operación | Mecanismo | Quién puede ejecutarla |
|---|---|---|
| Crear **primer** administrador | `npm run seed:admin` | Operador autorizado con acceso administrativo al entorno |
| Crear administrador **adicional** | API de gestión de usuarios, si el endpoint está habilitado | Administrador autenticado y autorizado mediante JWT/RBAC |
| Registrar paciente | Registro público de la API | Cliente autorizado por los controles aplicables; el rol se fija a `paciente` |
| Recuperar acceso administrativo | Procedimiento de recuperación separado | Personal autorizado; **no** se usa bootstrap para restablecer contraseñas |

En `usuarios.service.js`, `crearUsuarioAdministrativo()` permite los roles `medico` y `administrador`. **Esto no demuestra por sí solo que el endpoint sea seguro**: verificar en `usuarios.routes.js` y `usuarios.controller.js` que se apliquen `autenticarJWT` y `autorizarRoles("administrador")`, además de la API Key global.

Para una evolución futura puede separarse el rol `superadministrador` del rol `administrador`, de modo que la concesión de privilegios administrativos sea más restrictiva. **Ese rol adicional no se implementa en este bloque**.

## Seguridad y decisiones de diseño

- **Separación de responsabilidades:** el arranque HTTP no ejecuta operaciones de inicialización privilegiada.
- **Idempotencia:** una nueva ejecución no crea cuentas si ya existe algún administrador.
- **No elevación de privilegios:** el bootstrap no transforma cuentas de paciente o médico en administrador.
- **Hash de contraseña:** la contraseña se procesa con la utilidad del proyecto antes del `INSERT`.
- **Transacción:** evita inserciones parciales del bootstrap y permite `ROLLBACK` ante errores.
- **Bloqueo asesor:** coordina instancias del mismo bootstrap; no sustituye restricciones ni autorizaciones en otras rutas.
- **Cierre de conexiones:** `cerrarPool()` llama a `pool.end()` al finalizar el proceso independiente.
- **Secretos temporales:** las credenciales iniciales no deben quedar configuradas indefinidamente en el servicio desplegado.
- **TLS:** se conserva el certificado CA y `rejectUnauthorized: true` en PostgreSQL.
- **RBAC:** la creación posterior de administradores debe quedar restringida a endpoints administrativos autenticados.

## Consideraciones si posteriormente llevamos el proyecto a despliegue para Render y producción

1. Configurar `DATABASE_URL`, `JWT_SECRET`, API Key y demás secretos mediante las opciones seguras del entorno de despliegue; no subir `.env`.
2. Ejecutar el bootstrap como **tarea administrativa puntual** y autorizada, no en el comando normal de inicio del servicio.
3. No agregar `npm run seed:admin` al `start` ni a un script de despliegue que se ejecute en cada publicación.
4. Retirar las variables `ADMIN_*` después de la inicialización y verificar el login del administrador creado.
5. Aplicar mínimos privilegios a las credenciales PostgreSQL y mantener controles de autorización en Express.
6. Proteger las rutas de gestión de usuarios con JWT, RBAC y, cuando proceda, auditoría de quién creó cuentas privilegiadas.
7. Preparar por separado un procedimiento seguro de recuperación de acceso; el bootstrap no debe actuar como restablecedor de contraseñas.

