# Base de datos — API Hospital

**Proyecto:** API Hospital  
**Tecnología:** Supabase + PostgreSQL  
**Módulo:** Bloque 7 — Persistencia y modelo relacional  
**Estado:** estructura inicial creada y verificada; integración con Express pendiente.

## 1. Objetivo

Documentar la creación y configuración inicial de la base de datos PostgreSQL de **API Hospital** en Supabase. El propósito es sustituir progresivamente los arreglos de datos en memoria por persistencia real, **sin perder** los mecanismos de autenticación, autorización por roles (RBAC), control de propiedad (BOLA/IDOR) y validación desarrollados en Node.js/Express.

> **Alcance actual:** se han comprobado la existencia de las siete tablas, los tres roles de negocio, la activación de RLS en las siete tablas y ocho relaciones de clave foránea. La conexión con Express, las políticas RLS y las pruebas de permisos SQL aún no se han confirmado como completadas.

## 2. Estructura del directorio

```text
API_HOSPITAL/
└── database/
    ├── README.md
    ├── 01_esquema_hospital.sql
    ├── 02_roles_seguridad.sql
    └── 03_verificacion.sql
```

| Archivo | Responsabilidad |
|---|---|
| `01_esquema_hospital.sql` | Crear tablas, relaciones, restricciones e índices. |
| `02_roles_seguridad.sql` | Insertar roles de negocio, habilitar RLS y restringir permisos SQL para `anon` y `authenticated`. |
| `03_verificacion.sql` | Consultar roles, tablas y estado de RLS; complementarlo con las consultas de verificación de este README. |
| `README.md` | Registrar procedimiento, diseño, evidencias y próximos pasos. |

## 3. Creación del proyecto Supabase

1. Entrar a [Supabase Dashboard](https://supabase.com/dashboard) e iniciar sesión.
2. Seleccionar **New project** y la organización correspondiente.
3. Indicar como nombre del proyecto **`hospitalsoft`**.
4. Definir una **contraseña robusta y única para PostgreSQL**, distinta de las contraseñas de los usuarios del hospital.
5. Seleccionar la región apropiada.
6. En la sección **Seguridad** del formulario, configurar las tres opciones según la tabla siguiente.
7. Pulsar **Crear nuevo proyecto** y esperar a que esté disponible.
8. Reconocer las secciones **SQL Editor**, **Table Editor**, **Authentication**, **Database** y **Connect**.

### Configuración del formulario: contraseña, región y seguridad

| Campo u opción | Configuración para API Hospital | Justificación |
|---|---|---|
| **Contraseña de la base de datos** | Contraseña robusta, única y privada | Protege el usuario de conexión a PostgreSQL; no es la contraseña del administrador de la aplicación. |
| **Región** | Elegir una región cercana al backend previsto y disponible en el plan | Reduce la latencia de las consultas. La región mostrada en una captura puede variar según el proyecto. |
| **Habilitar la API de datos** | **Activado** | Permite usar la API de datos de Supabase cuando sea pertinente; no significa que todas las tablas sean accesibles sin permisos. |
| **Exponer automáticamente nuevas tablas** | **Desactivado** | Evita otorgar privilegios automáticos sobre tablas nuevas; permite revisar los permisos de forma explícita. |
| **Habilitar RLS automático** | **Activado** | Ayuda a habilitar Row Level Security en tablas nuevas del esquema público. Igualmente verificamos RLS mediante SQL. |

**Interpretación de las opciones:**

- **API de datos activada** no implica acceso público indiscriminado: también intervienen los privilegios SQL, las políticas RLS y la configuración de exposición de esquemas.
- **No exponer automáticamente nuevas tablas** no sustituye la auditoría de permisos existentes. El script `02_roles_seguridad.sql` contiene `REVOKE` explícitos para nuestras siete tablas.
- **RLS automático** no crea por sí solo políticas de lectura/escritura por paciente o médico. Las políticas se diseñarán y probarán cuando definamos la integración con Supabase Auth.
- **Los roles de negocio** (`administrador`, `medico`, `paciente`) se almacenan en `public.roles`; son distintos de los roles de acceso a la API de Supabase (`anon`, `authenticated` y `service_role`).
- **No es necesario habilitar el complemento IPv4** para crear tablas y ejecutar scripts desde SQL Editor. El método de conexión PostgreSQL se elegirá al integrar Express.

**Estado comprobado en el proyecto:** las siete tablas existen; los tres roles de negocio están activos; RLS figura habilitado en las siete tablas; se observaron ocho claves foráneas. Estas evidencias **no prueban por sí solas** la configuración original exacta de cada casilla del formulario de creación ni confirman que ya se hayan probado los permisos SQL.

**Seguridad:** nunca almacenar contraseñas de base de datos, URI completas con credenciales, claves secretas ni `service_role` en Git o en el frontend.

## 4. Orden de ejecución de los scripts

> **Requisito:** ejecutar estos scripts sobre un proyecto nuevo o una base que no contenga ya estas tablas. `01_esquema_hospital.sql` contiene instrucciones `CREATE TABLE` y no es idempotente; repetirlo puede generar errores por objetos existentes.

### Paso 1 — Esquema relacional

1. Abrir **SQL Editor → New query**.
2. Copiar el contenido de `01_esquema_hospital.sql`.
3. Confirmar que se está trabajando en el proyecto correcto.
4. Pulsar **Run**.
5. Verificar en **Table Editor** que existan siete tablas en el esquema `public`.

Tablas creadas:

- `roles`
- `usuarios`
- `especialidades`
- `pacientes`
- `medicos`
- `consultorios`
- `citas`

### Paso 2 — Roles y seguridad inicial

1. Abrir otra consulta en SQL Editor.
2. Ejecutar `02_roles_seguridad.sql`.
3. Verificar que existan los roles `administrador`, `medico` y `paciente`.
4. Verificar que RLS esté habilitado en las siete tablas.

**Importante:** los roles de negocio del hospital **no son** los roles internos de PostgreSQL/Supabase (`anon`, `authenticated`, `service_role`).

### Paso 3 — Verificación

1. Ejecutar `03_verificacion.sql`.
2. Confirmar siete tablas y tres roles.
3. Confirmar `rls_habilitado = true` en las siete tablas.
4. Ejecutar las consultas adicionales de claves foráneas y permisos que se presentan más adelante.

## 5. Modelo de datos

| Tabla | Finalidad | Relaciones principales |
|---|---|---|
| `roles` | Catálogo de roles de negocio. | Uno a muchos con `usuarios`. |
| `usuarios` | Cuenta, rol, estado y vínculo futuro con Supabase Auth. | `rol_id → roles.id`; `auth_user_id → auth.users.id`. |
| `pacientes` | Información del paciente. | `usuario_id → usuarios.id` (opcional, único). |
| `especialidades` | Especialidades médicas. | Una especialidad puede tener varios médicos. |
| `medicos` | Información profesional. | `especialidad_id → especialidades.id`; `usuario_id → usuarios.id` (opcional, único). |
| `consultorios` | Espacios de atención. | Uno a muchos con `citas`. |
| `citas` | Agenda de atención médica. | `paciente_id`, `medico_id` y `consultorio_id` son claves foráneas. |

### Relaciones verificadas

Se observaron **ocho claves foráneas** en las consultas realizadas en Supabase:

```text
usuarios.auth_user_id ──→ auth.users.id
usuarios.rol_id       ──→ roles.id
pacientes.usuario_id  ──→ usuarios.id
medicos.usuario_id    ──→ usuarios.id
medicos.especialidad_id ──→ especialidades.id
citas.paciente_id     ──→ pacientes.id
citas.medico_id       ──→ medicos.id
citas.consultorio_id  ──→ consultorios.id
```

### Restricciones diseñadas en el primer script

- `PRIMARY KEY`: identificación única de registros.
- `UNIQUE`: evita duplicados en campos definidos como únicos (por ejemplo, documento y registro médico).
- `FOREIGN KEY`: impide referencias a registros inexistentes.
- `CHECK`: limita los valores permitidos para roles, estados y longitud de `motivo`.
- `ON DELETE RESTRICT`: impide eliminar registros que siguen siendo referenciados.
- Índices para búsquedas y relaciones frecuentes.
- Índices únicos parciales para evitar que un mismo médico o consultorio tenga dos citas **no canceladas** con idéntica fecha y hora.

> La creación de las tablas y sus FK se comprobó visualmente. Para confirmar cada índice y restricción específica, ejecutar las consultas de inspección de este documento.

## 6. Roles y permisos de la API Hospital

La autorización de negocio se mantiene en **Express**, mediante JWT, RBAC y controles BOLA/IDOR. La tabla `roles` conserva los nombres utilizados por el backend.

| Operación | Administrador | Médico | Paciente |
|---|:---:|:---:|:---:|
| Gestionar usuarios y crear cuentas privilegiadas permitidas | Sí | No | No |
| Crear, modificar o eliminar pacientes | Sí | No | No |
| Consultar listado de pacientes | Sí | Sí | No |
| Gestionar médicos, especialidades y consultorios | Sí | No | No |
| Consultar catálogos médicos | Sí | Sí | Sí |
| Crear, modificar o eliminar citas | Sí | No | No |
| Consultar todas las citas | Sí | No | No |
| Consultar citas propias o asignadas | No aplica | Sí | Sí |
| Consultar cita individual | Todas | Asignadas | Propias |
| Cambiar estado de cita | Sí | No | No |

**Regla esencial:** `GET /api/citas/mis-citas` debe obtener la identidad del JWT verificado, resolver el perfil de paciente o médico asociado y filtrar las citas desde el servidor. Nunca debe confiar en un ID de paciente o médico suministrado arbitrariamente por el cliente.

**Registro público:** crea exclusivamente cuentas con rol `paciente`. Los campos privilegiados no deben poder establecerse desde el cuerpo de la solicitud.

**Validación adicional pendiente:** la FK `pacientes.usuario_id` o `medicos.usuario_id` comprueba que el usuario exista, pero **no garantiza que su rol corresponda al perfil**. Esa comprobación debe mantenerse en la lógica de negocio y podrá reforzarse en PostgreSQL.

## 7. Row Level Security (RLS)

RLS permite definir qué filas puede consultar o modificar un rol de base de datos, según las políticas establecidas. **RLS y los permisos SQL (`GRANT`/`REVOKE`) son controles distintos y complementarios.**

En `02_roles_seguridad.sql` se incluyeron:

```sql
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.especialidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pacientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultorios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.citas ENABLE ROW LEVEL SECURITY;
```

Y restricciones iniciales para los roles `anon` y `authenticated`:

```sql
REVOKE ALL ON TABLE
    public.roles,
    public.usuarios,
    public.especialidades,
    public.pacientes,
    public.medicos,
    public.consultorios,
    public.citas
FROM anon, authenticated;
```

**Estado verificado:** RLS aparece habilitado (`true`) en las siete tablas. **Estado pendiente:** comprobar la ausencia de políticas públicas y confirmar los privilegios SQL mediante las consultas siguientes.

No se han implementado aún políticas RLS para pacientes o médicos. No se debe afirmar que RLS ya está aplicando nuestras reglas BOLA: esas políticas serán parte del bloque de identidad y autorización con Supabase.

> **Advertencia:** conexiones con privilegios elevados o roles que omiten RLS pueden eludir estas políticas. Las credenciales privilegiadas deben quedar exclusivamente en el servidor, donde se aplican los controles de autorización de Express.

## 8. Consultas de verificación

### 8.1. Listar tablas

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

**Resultado observado:** siete tablas.

### 8.2. Consultar roles

```sql
SELECT id, nombre, descripcion, activo
FROM public.roles
ORDER BY id;
```

**Resultado observado:**

| id | nombre | activo |
|---:|---|---|
| 1 | administrador | true |
| 2 | medico | true |
| 3 | paciente | true |

### 8.3. Verificar RLS

```sql
SELECT
    relname AS tabla,
    relrowsecurity AS rls_habilitado
FROM pg_class
WHERE relnamespace = 'public'::regnamespace
  AND relname IN (
    'roles', 'usuarios', 'pacientes', 'medicos',
    'especialidades', 'consultorios', 'citas'
  )
ORDER BY relname;
```

**Resultado observado:** siete filas con `rls_habilitado = true`.

### 8.4. Verificar claves foráneas

```sql
SELECT
    conrelid::regclass AS tabla,
    conname AS restriccion,
    confrelid::regclass AS tabla_referenciada
FROM pg_constraint
WHERE contype = 'f'
  AND connamespace = 'public'::regnamespace
ORDER BY tabla, restriccion;
```

**Resultado observado:** ocho claves foráneas, incluidas las tres referencias de `citas`.

### 8.5. Verificar políticas RLS (pendiente de confirmar)

```sql
SELECT schemaname, tablename, policyname, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'roles', 'usuarios', 'pacientes', 'medicos',
    'especialidades', 'consultorios', 'citas'
  )
ORDER BY tablename, policyname;
```

**Resultado esperado en esta fase:** cero filas (sin políticas creadas).

### 8.6. Verificar permisos SQL 

```sql
SELECT table_name, grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name IN (
    'roles', 'usuarios', 'pacientes', 'medicos',
    'especialidades', 'consultorios', 'citas'
  )
  AND grantee IN ('anon', 'authenticated')
ORDER BY table_name, grantee, privilege_type;
```

**Resultado esperado:** cero filas si los `REVOKE` se aplicaron como se diseñó. Si aparecen filas, revisar antes de habilitar accesos.

### 8.7. Revisar restricciones e índices

```sql
SELECT
    conrelid::regclass AS tabla,
    conname AS restriccion,
    pg_get_constraintdef(oid) AS definicion
FROM pg_constraint
WHERE connamespace = 'public'::regnamespace
ORDER BY tabla, restriccion;
```

```sql
SELECT tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN (
    'roles', 'usuarios', 'pacientes', 'medicos',
    'especialidades', 'consultorios', 'citas'
  )
ORDER BY tablename, indexname;
```

Estas consultas permiten revisar la creación efectiva de restricciones, índices y reglas de unicidad parcial.

## 9. Connect y conexión futura con Express

Identificar en Supabase **Connect → Direct → Transaction pooler**, con puerto **6543**. Esta pantalla proporciona la URI y parámetros de conexión, pero **no todavía no es necesario copiarlos para crear o verificar el esquema desde SQL Editor**.

Para conectar Node.js se evaluará la modalidad adecuada al entorno de despliegue:

- **Direct connection:** conexiones persistentes cuando la red lo permita.
- **Session pooler:** alternativa cuando se necesita compatibilidad IPv4 o una conexión de sesión.
- **Transaction pooler:** conexiones cortas, frecuentes en escenarios serverless; requiere considerar compatibilidad con características de sesión y consultas preparadas.

La cadena de conexión completa debe guardarse exclusivamente en variables de entorno del backend, nunca en código fuente público ni en React.

## 10. Arquitectura objetivo

```text
Frontend React + Vite (posterior)
          |
          v
API REST Node.js + Express
          |
          v
Autenticación + RBAC + BOLA
          |
          v
Routes → Validators → Controllers → Services
          |
          v
Conexión PostgreSQL de servidor
          |
          v
Supabase / PostgreSQL
```

En el backend, la migración será gradual. Se conservarán las rutas y los contratos JSON existentes; los services dejarán de leer arreglos en memoria y pasarán a realizar consultas asíncronas. Las propiedades JavaScript en `camelCase` se mapearán a columnas SQL en `snake_case`.

### Identidad y contraseñas

- En la fase inicial, el esquema incluye `usuarios.password_hash` para compatibilidad transitoria con bcrypt.
- `usuarios.auth_user_id` es una FK opcional a `auth.users(id)` que permitirá vincular identidades al incorporar Supabase Auth.
- **No se deben mantener indefinidamente dos sistemas de contraseñas.** La migración a Supabase Auth requiere una decisión explícita sobre creación, vinculación y acceso de usuarios.
- La existencia de una FK no reemplaza las comprobaciones de autorización en Express.

## 11. Evidencias y estado de avance

| Verificación | Resultado | Estado |
|---|---|---|
| Proyecto Supabase `hospitalsoft` | Creado | Confirmado |
| Siete tablas en `public` | 7 resultados | Confirmado |
| Roles de negocio | 3 activos | Confirmado |
| RLS habilitado | `true` en 7 tablas | Confirmado |
| Relaciones FK | 8 restricciones | Confirmado |
| Ausencia de políticas públicas | Consultar `pg_policies` | Pendiente de evidenciar |
| Privilegios de `anon` y `authenticated` | Consultar `role_table_grants` | Pendiente de evidenciar |
| Índices y CHECK específicos | Inspección de catálogo | Pendiente de evidenciar |
| Conexión Node.js → PostgreSQL | No configurada | Pendiente |
| Migración de services | Arreglos en memoria | Pendiente |
| Supabase Auth y políticas por fila | No implementadas | Pendiente |
| Frontend React + Vite | No integrado | Pendiente |

## 12. Próximos pasos

1. Confirmar consultas de políticas RLS y permisos SQL.
2. Seleccionar y configurar la conexión PostgreSQL de servidor.
3. Preparar variables de entorno sin publicar credenciales.
4. Migrar services progresivamente: especialidades, consultorios, usuarios/roles, pacientes, médicos y citas.
5. Conservar los controles JWT, RBAC, BOLA y la ruta `/api/citas/mis-citas`.
6. Integrar identidad persistente y posteriormente Supabase Auth, con una estrategia de migración definida.
7. Implementar y probar políticas RLS acordes con la arquitectura de acceso elegida.
8. Construir frontend React + Vite y realizar auditoría integral.

## 13. Recomendaciones para el repositorio

- Versionar los scripts SQL y este README.
- No versionar `.env` ni cadenas de conexión con credenciales.
- Evitar volver a ejecutar scripts `CREATE TABLE` sobre un esquema ya creado.
- Documentar futuros cambios como migraciones SQL numeradas y reproducibles.
- No utilizar claves privilegiadas de Supabase en código ejecutado en el navegador.
- Verificar permisos y políticas antes de exponer nuevas rutas de acceso a datos.

---

**Siguiente actividad:** conexión de API Hospital desde VS Code a Supabase/PostgreSQL, manteniendo la arquitectura por capas y las reglas de autorización existentes.


## Limpieza general de registros de la base de datos

Durante el desarrollo y las pruebas de la API Hospital, puede ser necesario eliminar los registros almacenados en PostgreSQL (Supabase) para reiniciar el entorno de pruebas.

El siguiente script elimina los registros de las siete tablas del sistema, conserva su estructura, relaciones, restricciones e índices y reinicia los identificadores autoincrementales.



```sql
-- ==========================================
-- API HOSPITAL
-- LIMPIEZA GENERAL DE REGISTROS
-- ==========================================

BEGIN;

TRUNCATE TABLE
    public.citas,
    public.pacientes,
    public.medicos,
    public.consultorios,
    public.especialidades,
    public.usuarios,
    public.roles
RESTART IDENTITY
RESTRICT;

COMMIT;
```