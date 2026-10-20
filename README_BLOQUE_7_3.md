# BLOQUE 7.3 — Migración de Especialidades a Supabase PostgreSQL

**Proyecto:** API Hospital Segura (Node.js / Express / PostgreSQL)  
**Etapa:** Persistencia del recurso Especialidades y adaptación temporal del módulo Médicos  
**Prerrequisito:** Bloque 7.2: conexión PostgreSQL mediante `pg`, TLS y certificado CA de Supabase.

## 1. Objetivo

Migrar el CRUD de **Especialidades** desde un arreglo JavaScript a la tabla `public.especialidades` de Supabase PostgreSQL, conservando rutas, respuestas HTTP, validaciones, API Key, JWT y autorización por roles (RBAC). Adaptar las consultas de Especialidades utilizadas por el módulo Médicos sin migrar todavía la persistencia de los médicos.

## 2. Arquitectura del bloque

```text
Swagger / Postman
  └── X-API-Key + Authorization: Bearer <JWT>
       └── Express: rutas, validadores, middlewares JWT y RBAC
            └── especialidades.controller.js (async/await)
                 └── especialidades.service.js
                      └── src/config/database.js (pg Pool + TLS)
                           └── Supabase PostgreSQL: public.especialidades

medicos.controller.js ──await──> especialidades.service.js (PostgreSQL)
         └─────────────────────> medicos.service.js (memoria, temporal)
```

> **Importante:** Durante el Bloque 7.3, **Especialidades persiste en PostgreSQL**, pero **Médicos continúa en memoria**. No interpretar un `200 OK` en `GET /api/medicos` como prueba de persistencia de médicos.

## 3. Archivos involucrados

| Archivo | Función | Acción |
|---|---|---|
| `src/config/database.js` | Pool PostgreSQL con TLS y certificado CA | Reutilizar del bloque 7.2 |
| `src/services/especialidades.service.js` | CRUD SQL parametrizado | Sustituir acceso al arreglo por consultas SQL |
| `src/controllers/especialidades.controller.js` | Respuestas HTTP, validaciones de negocio, errores SQL | Convertir a `async/await` |
| `src/controllers/medicos.controller.js` | Validar especialidades al consultar, crear o modificar médicos | Agregar `await` y manejo de errores en cuatro funciones |
| `src/services/medicos.service.js` | CRUD de médicos en memoria | Conservar temporalmente; ajustar tratamiento de `usuarioId` |
| `src/routes/especialidades.routes.js` | Rutas, validadores, JWT y RBAC | Mantener contratos existentes |
| `src/data/especialidades.js` | Datos originales en memoria | Conservar como referencia hasta terminar migración |

## 4. Verificar datos en Supabase

Abrir **Supabase → SQL Editor** y ejecutar:

```sql
SELECT id, nombre, descripcion, activa
FROM public.especialidades
ORDER BY id;
```

Si la tabla está vacía y se trata de una base de laboratorio nueva, cargar datos iniciales:

```sql
INSERT INTO public.especialidades (nombre, descripcion, activa)
VALUES
  ('Medicina General', 'Atención médica general', TRUE),
  ('Cardiología', 'Diagnóstico y tratamiento cardiovascular', TRUE),
  ('Pediatría', 'Atención médica infantil', TRUE),
  ('Dermatología', 'Atención de enfermedades de la piel', TRUE)
ON CONFLICT (nombre) DO NOTHING;
```

**Precaución:** los IDs generados pueden no coincidir con los del arreglo original si la tabla ya contiene datos o se realizaron inserciones anteriores. Comparar los IDs reales antes de probar médicos que referencian `especialidadId`.

## 5. Garantizar nombres únicos sin distinguir mayúsculas

Verificar primero si existen nombres equivalentes:

```sql
SELECT LOWER(nombre) AS nombre_normalizado, COUNT(*) AS cantidad
FROM public.especialidades
GROUP BY LOWER(nombre)
HAVING COUNT(*) > 1;
```

Si no hay duplicados, crear el índice:

```sql
CREATE UNIQUE INDEX IF NOT EXISTS uq_especialidades_nombre_ci
ON public.especialidades (LOWER(nombre));
```

Así se evita registrar nombres equivalentes como `Cardiología` y `cardiología`, incluso ante solicitudes simultáneas. El índice original `UNIQUE(nombre)` por sí solo no asegura esta regla sin distinción de mayúsculas.

## 6. Service de Especialidades: funciones y SQL

Mantener las siete exportaciones originales, ahora asíncronas:

| Función | Operación SQL | Retorno esperado |
|---|---|---|
| `obtenerEspecialidades()` | `SELECT ... ORDER BY id` | Arreglo de filas |
| `obtenerEspecialidadPorId(id)` | `SELECT ... WHERE id=$1` | Objeto o `null` |
| `buscarEspecialidadPorNombre(nombre)` | `SELECT ... WHERE LOWER(nombre)=LOWER($1)` | Objeto o `null` |
| `crearEspecialidad(datos)` | `INSERT ... RETURNING` | Objeto creado |
| `actualizarEspecialidad(id, datos)` | `UPDATE ... RETURNING` | Objeto o `null` |
| `actualizarEspecialidadParcial(id, datos)` | `UPDATE` selectivo `... RETURNING` | Objeto o `null` |
| `eliminarEspecialidad(id)` | `DELETE ... RETURNING` | Objeto o `null` |

Ejemplo de consulta parametrizada:

```js
const { consultar } = require('../config/database');

const obtenerEspecialidadPorId = async (id) => {
  const resultado = await consultar(
    `SELECT id, nombre, descripcion, activa
     FROM public.especialidades WHERE id = $1`,
    [id]
  );
  return resultado.rows[0] ?? null;
};
```

**Conceptos clave:**

- `async/await`: esperar resultados de la base de datos.
- `$1`, `$2`, etc.: parámetros separados del SQL para evitar inyección por concatenación.
- `RETURNING`: recuperar el registro afectado por INSERT, UPDATE o DELETE.
- `resultado.rows`: filas retornadas por `pg`.
- `Object.hasOwn(datos, 'campo')`: distinguir un campo omitido de un valor explícito, especialmente en PATCH.

## 7. Controller de Especialidades

Actualizar los seis handlers HTTP (`GET` lista, `GET` ID, `POST`, `PUT`, `PATCH`, `DELETE`) para esperar los services con `await` y capturar errores mediante `try/catch` y `next(error)`.

Conservar:

- `matchedData(req, { locations: ['body'] })` para operar únicamente sobre campos validados.
- `404` cuando no exista el ID.
- `400` para PATCH sin campos permitidos.
- `409` cuando exista una especialidad con nombre equivalente.
- `201` para creación y `200` para consultas, actualizaciones y eliminación correctas.

**Errores de PostgreSQL relevantes:**

| Código | Significado | Tratamiento |
|---|---|---|
| `23505` | Violación de unicidad | `409 Conflict` |
| `23503` | Violación de clave foránea | `409 Conflict` al eliminar una especialidad referenciada |

El controller puede comprobar si hay médicos asociados en `public.medicos`, pero la **clave foránea** es la protección definitiva frente a concurrencia.

## 8. Adaptación temporal del controller de Médicos

`medicos.controller.js` invoca `especialidadesService.obtenerEspecialidadPorId()` en **cuatro funciones**:

1. `obtenerMedicosPorEspecialidad`
2. `crearMedico`
3. `actualizarMedico` (PUT)
4. `actualizarMedicoParcial` (PATCH)

Estas funciones pasan a `async (req, res, next) => { ... }`, y la consulta debe usar `await`:

```js
const especialidad =
  await especialidadesService.obtenerEspecialidadPorId(
    datosPermitidos.especialidadId
  );
```

Conservar la validación de especialidad inexistente y especialidad inactiva. El resto de llamadas a `medicosService` siguen siendo síncronas porque sus datos permanecen en memoria.

En `medicos.service.js`, se ajustó `usuarioId` en PUT y PATCH para diferenciar entre un campo omitido y uno proporcionado explícitamente. La desvinculación de usuarios requiere revisar su impacto en la autorización de acceso a citas.

### Advertencia sobre DELETE

Mientras los médicos permanezcan en memoria, una consulta a `public.medicos` **no ve esos registros**. **No eliminar especialidades referenciadas por médicos en memoria**. La protección integral se completará cuando Médicos también se migre a PostgreSQL (Bloque 7.4).

## 9. Seguridad conservada

| Control | Estado en esta fase |
|---|---|
| `X-API-Key` | Sigue aplicado a `/api` |
| JWT Bearer | Sigue aplicado mediante middleware de autenticación |
| RBAC | Lecturas: administrador, médico y paciente; escrituras: administrador |
| Validación | `express-validator` + `matchedData()` |
| Inyección SQL | Consultas parametrizadas |
| Unicidad | Índice único sobre `LOWER(nombre)` (si se ejecutó el paso 5) |
| Integridad referencial | FK PostgreSQL para médicos persistidos |
| RLS | Activado en Supabase; **no sustituye** RBAC/BOLA en Express si el backend se conecta como usuario privilegiado |
| TLS | Configurado con certificado CA y `rejectUnauthorized: true` desde el bloque 7.2 |

## 10. Pruebas con Swagger o Postman

Arrancar el proyecto:

```bash
npm run dev
```

Abrir `http://localhost:3000/api-docs`, autorizar `X-API-Key` y JWT Bearer, y ejecutar:

| ID | Operación | Caso | Esperado |
|---|---|---|---|
| E01 | GET `/api/especialidades` | Listar | 200 |
| E02 | GET `/api/especialidades/1` | ID existente | 200 |
| E03 | GET `/api/especialidades/9999` | ID inexistente | 404 |
| E04 | POST `/api/especialidades` | Crear válida como admin | 201 |
| E05 | POST | Nombre duplicado | 409 |
| E06 | POST | Nombre con distinta capitalización | 409, si índice CI creado |
| E07 | PUT `/api/especialidades/:id` | Actualización completa | 200 |
| E08 | PATCH `/api/especialidades/:id` | `{"activa":false}` | 200 |
| E09 | PATCH | Objeto vacío | 400 |
| E10 | DELETE | Sin médicos asociados en ambas fuentes | 200 |
| E11 | DELETE | Con médicos persistidos asociados | 409 |
| E12 | POST | JWT de paciente | 403 |
| E13 | GET | Sin JWT | 401 |
| M01 | GET `/api/medicos` | Listar médicos en memoria | 200 |
| M02 | GET médicos por especialidad existente | Especialidad consultada en PostgreSQL | 200 |
| M03 | GET médicos por especialidad inexistente | ID 9999 | 404 |
| M04 | POST médico | Especialidad válida y activa | 201 |
| M05 | POST médico | Especialidad inexistente | 400 |
| M06 | PATCH médico | Especialidad inactiva | 409 |

**Evidencia compartida:** se observó `GET /api/medicos` con respuesta `200 OK` y arreglo JSON en Swagger. El usuario indicó que las demás pruebas funcionan; **no se adjuntaron capturas ni registros individuales para certificarlas aquí**.

### Comprobación de persistencia

Crear una especialidad desde la API, verificarla en Supabase:

```sql
SELECT id, nombre, descripcion, activa
FROM public.especialidades
ORDER BY id DESC;
```

Reiniciar Node.js y volver a consultarla desde Swagger. Si permanece, confirma persistencia real del recurso Especialidades. Este procedimiento no demuestra persistencia de Médicos.

## 11. Problemas frecuentes

**`especialidad.activa` es `undefined` o las validaciones no funcionan:** revisar que se utilizó `await` en las cuatro funciones del controller de Médicos.

**Error `23505`:** el nombre ya existe o coincide sin distinción de mayúsculas con otro registro (si está creado el índice correspondiente).

**Error `23503`:** la especialidad está referenciada por registros en `public.medicos`.

**Un médico en memoria apunta a una especialidad equivocada:** comprobar que `especialidadId` corresponde al ID real en Supabase.

**El servidor devuelve error de conexión:** revisar el Bloque 7.2: `DATABASE_URL`, certificado CA, configuración TLS y SSL obligatorio.

**No se pueden eliminar especialidades con médicos en memoria:** posponer DELETE hasta migrar Médicos o aplicar una verificación transitoria sobre ambas fuentes; nunca eliminar relaciones sin revisar.

## 12. Criterios de cierre y siguiente bloque

Para cerrar formalmente el Bloque 7.3:

- [ ] Verificar consultas de Especialidades contra PostgreSQL.
- [ ] Verificar POST, PUT, PATCH y DELETE con restricciones.
- [ ] Confirmar persistencia después de reiniciar Node.js.
- [ ] Verificar los cuatro handlers de Médicos adaptados a `await`.
- [ ] Comprobar RBAC y respuestas 401/403/404/409.
- [ ] Confirmar que no se eliminaron especialidades usadas por médicos en memoria.

**Siguiente:** **Bloque 7.4 — Migración completa del CRUD Médicos a PostgreSQL**, con mapeo de columnas `snake_case` ↔ `camelCase`, manejo de FK hacia Especialidades, unicidad de registro médico/email, relación con usuarios y compatibilidad con citas y controles BOLA.

---

*Guía de laboratorio del proyecto API Hospital. Los resultados de prueba no adjuntos deben validarse en el entorno antes de dar el bloque por cerrado formalmente.*
