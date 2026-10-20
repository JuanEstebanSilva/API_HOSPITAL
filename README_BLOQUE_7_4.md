# API Hospital — Bloque 7.4

## Migración del módulo Médicos a Supabase PostgreSQL

**Estado:** implementación del servicio y controlador propuesta; creación de un médico reportada como exitosa; pendiente validación integral de dependencias, autorización y persistencia de todos los recursos.

## 1. Objetivo

Sustituir el arreglo `src/data/medicos.js` por la tabla `public.medicos`, conservando los endpoints REST, validaciones de negocio, JWT, API Key, RBAC y protecciones BOLA/IDOR. Preparar la migración de Usuarios, Pacientes, Consultorios y Citas.

## 2. Punto de partida

- PostgreSQL en Supabase, conectado mediante `pg` y TLS con certificado CA y `rejectUnauthorized: true`.
- RLS activado en las tablas; **sin políticas públicas**. Importante: la conexión privilegiada del servidor puede omitir RLS; la autorización debe continuar en Express.
- `public.especialidades` ya es fuente persistente.
- Antes del bloque, Médicos, Usuarios, Pacientes, Consultorios y Citas utilizaban arreglos JavaScript.
- Roles de aplicación: `administrador`, `medico`, `paciente`.

## 3. Arquitectura

```text
Swagger / Postman
      |
      v
X-API-Key + JWT + RBAC + validadores
      |
      v
medicos.routes.js
      |
      v
medicos.controller.js  (async/await)
      |
      v
medicos.service.js     (SQL parametrizado)
      |
      v
src/config/database.js (pg.Pool, TLS)
      |
      v
Supabase: public.medicos
      |                  |
      v                  v
public.especialidades  public.usuarios
```

## 4. Tabla y restricciones

```sql
SELECT id, usuario_id, nombre, registro_medico, email,
       telefono, especialidad_id, activo
FROM public.medicos ORDER BY id;
```

Columnas principales: `id BIGINT GENERATED ALWAYS AS IDENTITY`, `usuario_id BIGINT UNIQUE NULL REFERENCES public.usuarios(id) ON DELETE RESTRICT`, `nombre VARCHAR(100) NOT NULL`, `registro_medico VARCHAR(50) NOT NULL UNIQUE`, `email VARCHAR(150) NOT NULL UNIQUE`, `telefono VARCHAR(30)`, `especialidad_id BIGINT NOT NULL REFERENCES public.especialidades(id) ON DELETE RESTRICT`, `activo BOOLEAN NOT NULL DEFAULT TRUE`.

Comprobar claves foráneas:

```sql
SELECT tc.constraint_name, kcu.column_name,
       ccu.table_name AS tabla_referenciada
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
 AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage ccu
  ON tc.constraint_name = ccu.constraint_name
 AND tc.table_schema = ccu.table_schema
WHERE tc.table_schema = 'public'
  AND tc.table_name = 'medicos'
  AND tc.constraint_type = 'FOREIGN KEY';
```

### Unicidad sin distinguir mayúsculas

Primero detectar duplicados:

```sql
SELECT LOWER(email), COUNT(*) FROM public.medicos
GROUP BY LOWER(email) HAVING COUNT(*) > 1;

SELECT LOWER(registro_medico), COUNT(*) FROM public.medicos
GROUP BY LOWER(registro_medico) HAVING COUNT(*) > 1;
```

Si no hay conflictos:

```sql
CREATE UNIQUE INDEX IF NOT EXISTS uq_medicos_email_ci
ON public.medicos (LOWER(email));

CREATE UNIQUE INDEX IF NOT EXISTS uq_medicos_registro_ci
ON public.medicos (LOWER(registro_medico));
```

## 5. Archivos trabajados

| Archivo | Responsabilidad | Cambio |
|---|---|---|
| `src/services/medicos.service.js` | Persistencia | Reemplazar `find/filter/push/splice` por `SELECT/INSERT/UPDATE/DELETE` parametrizados. |
| `src/controllers/medicos.controller.js` | Reglas de negocio y HTTP | `async/await`, validación de especialidad, manejo de errores SQL. |
| `src/controllers/citas.controller.js` | Operaciones sobre citas | Esperar las consultas de Médicos y Especialidades en las validaciones de relaciones. |
| `src/middlewares/propiedad.middleware.js` | Autorización por propiedad | Esperar `obtenerMedicoPorUsuarioId()` y comparar identificadores de forma segura. |
| `src/services/citas.service.js` | Citas | **Sigue en memoria hasta el Bloque 7.5**. |

### Contrato de `medicos.service.js`

Se conservan las once exportaciones: `obtenerMedicos`, `obtenerMedicoPorId`, `obtenerMedicoPorUsuarioId`, `obtenerMedicosPorEspecialidad`, `buscarMedicoPorRegistro`, `buscarMedicoPorEmail`, `crearMedico`, `actualizarMedico`, `actualizarMedicoParcial`, `eliminarMedico`, `especialidadTieneMedicos`.

**Todas son asíncronas.** Cada consumidor debe usar `await` y manejar errores. Las consultas devuelven columnas camelCase mediante alias, por ejemplo `usuario_id AS "usuarioId"` y `registro_medico AS "registroMedico"`.

### PATCH

Usar `Object.hasOwn(datos, "campo")` para diferenciar campo omitido de valor explícito (`false` o `null`). No concatenar valores del usuario en SQL.

### PUT y asociaciones

Durante la transición, `usuarioId` se restringe porque Usuarios sigue en memoria. **No vincular un ID de usuario de memoria a un ID de PostgreSQL sin comprobar identidad y correspondencia.** Para PUT, conservar el `usuario_id` existente si se omite el campo. Para PATCH, definir explícitamente si `null` desvincula, y verificar impacto sobre autorizaciones.

## 6. Prueba de creación reportada

El siguiente cuerpo fue aceptado en el entorno de prueba del proyecto:

```json
{
  "nombre": "Laura Martínez",
  "registroMedico": "RM-45871",
  "email": "laura.martinez@example.com",
  "telefono": "3001234567",
  "especialidadId": 1,
  "activo": true
}
```

El formato de registro médico `RM-45871` fue reportado como válido. La aceptación HTTP no sustituye la comprobación de persistencia en PostgreSQL:

```sql
SELECT m.id, m.nombre, m.registro_medico, m.email,
       e.nombre AS especialidad, m.activo
FROM public.medicos m
JOIN public.especialidades e ON e.id = m.especialidad_id
WHERE m.email = 'laura.martinez@example.com';
```

**No volver a ejecutar POST con el mismo registro o correo:** el resultado correcto sería `409 Conflict`.

## 7. Errores PostgreSQL y respuestas

| Código SQLSTATE | Interpretación | Respuesta sugerida |
|---|---|---|
| `23505` | Valor único duplicado | 409 Conflict |
| `23503` | Violación de clave foránea | 409 Conflict (o 400 para referencia inválida, según operación) |
| `23502` | Campo obligatorio nulo | 400 Bad Request |
| `23514` | CHECK incumplido | 400 Bad Request |

No devolver detalles internos SQL, secretos ni cadenas de conexión al cliente. Los errores desconocidos deben pasar al middleware global.

## 8. Integración con Citas y BOLA

- `validarRelacionesCita()` se convierte en `async` y espera Médicos y Especialidades.
- `obtenerCitasPorMedico()` y `obtenerMisCitas()` esperan el perfil médico.
- `autorizarMedicoPropio()` y `autorizarAccesoCita()` esperan las consultas antes de comparar propietarios.
- Los IDs `BIGINT` pueden recibirse como cadenas; comparar identificadores válidos mediante `String(a) === String(b)` cuando ambos sean no nulos.
- La ausencia de perfil asociado debe denegar acceso (403), no permitirlo.
- **Citas continúa en memoria:** un `medicoId` histórico puede no referirse al mismo médico en PostgreSQL. No se deben asumir equivalencias sin una tabla de correspondencia o migración controlada.
- Mientras se migra Usuarios, médicos con `usuario_id NULL` no pueden usar el acceso a citas basado en identidad del JWT.

## 9. Matriz de pruebas

| ID | Caso | Resultado esperado | Estado |
|---|---|---|---|
| M01 | GET médicos con credenciales | 200 | Verificar nuevamente contra PostgreSQL |
| M02 | GET médico inexistente | 404 | Pendiente |
| M03 | POST médico válido | 201 | Usuario reportó creación exitosa |
| M04 | POST registro duplicado | 409 | Pendiente |
| M05 | POST correo duplicado | 409 | Pendiente |
| M06 | POST especialidad inexistente | 400 | Pendiente |
| M07 | POST especialidad inactiva | 409 | Pendiente |
| M08 | PUT médico válido | 200 | Pendiente |
| M09 | PATCH `activo: false` | 200 | Pendiente |
| M10 | DELETE médico con citas | 409 | Pendiente |
| M11 | Reiniciar servidor, GET médico | Datos persisten | Pendiente |
| M12 | Paciente intenta POST médico | 403 | Pendiente |
| M13 | GET mis citas sin perfil asociado | 403 | Pendiente |
| M14 | Acceso a cita ajena | 403 | Pendiente |
| M15 | Consulta SQL directa del registro | Registro visible | Pendiente |

La autorización debe probarse con distintos tokens y sin API Key. Un GET 200 con credenciales válidas **no demuestra por sí solo** que RBAC y BOLA estén correctos.

## 10. Seguridad y RLS

RLS está activado sin políticas públicas, pero el backend usa una conexión privilegiada. No confiar exclusivamente en RLS para proteger rutas Express; mantener autenticación JWT, autorización por roles y propiedad del recurso. No exponer `DATABASE_URL` ni la clave privilegiada al frontend. No subir `.env` al repositorio. TLS con CA validada debe permanecer activo.

## 11. Riesgos y trabajo pendiente

1. Migrar Usuarios **antes** de asociar perfiles médicos a identidades persistentes.
2. Migrar Pacientes y Consultorios antes de Citas.
3. Migrar Citas preservando correspondencia de IDs, claves foráneas y estados.
4. Mover comprobación de disponibilidad de citas a restricciones/operaciones transaccionales PostgreSQL.
5. Revisar todas las llamadas a servicios convertidos a `async` (controllers, middlewares y otros services).
6. Probar la eliminación de Médicos y Especialidades con relaciones reales en PostgreSQL.
7. Confirmar que el bootstrap del administrador persiste y no crea cuentas repetidas al reiniciar.
8. No borrar `src/data/` hasta completar migración, pruebas y respaldo.

## 12. Criterios para cerrar 7.4

- CRUD de Médicos consulta y modifica `public.medicos`.
- La creación de un médico se verifica por SQL y persiste tras reiniciar Node.js.
- Se preservan validaciones de Especialidades y restricciones de unicidad.
- Todos los consumidores de `medicosService` esperan correctamente las promesas.
- Las pruebas negativas de JWT, RBAC y BOLA no permiten accesos indebidos.
- Se documentan explícitamente las dependencias aún en memoria.

## 13. Próximo bloque: 7.5 — Persistencia integral

Orden recomendado: **Usuarios → Pacientes → Consultorios → Citas → auditoría de dependencias**.

### Inventario inicial

```sql
SELECT 'roles' AS tabla, COUNT(*) AS registros FROM public.roles
UNION ALL SELECT 'usuarios', COUNT(*) FROM public.usuarios
UNION ALL SELECT 'especialidades', COUNT(*) FROM public.especialidades
UNION ALL SELECT 'medicos', COUNT(*) FROM public.medicos
UNION ALL SELECT 'pacientes', COUNT(*) FROM public.pacientes
UNION ALL SELECT 'consultorios', COUNT(*) FROM public.consultorios
UNION ALL SELECT 'citas', COUNT(*) FROM public.citas;
```

Antes de modificar Usuarios, revisar `usuarios.service.js`, `usuarios.controller.js`, `auth.controller.js`, rutas y middlewares de autenticación, así como la función de bootstrap del administrador. Se debe conservar el contrato del JWT (`sub`, `email`, `rol`) y las contraseñas almacenadas con hash bcrypt. La migración de datos debe ser reversible, con respaldo y comprobaciones de integridad.

---

**Nota de estado:** esta guía documenta el código propuesto y las pruebas reportadas en la conversación. No afirma que se hayan ejecutado todas las pruebas de seguridad o persistencia.
