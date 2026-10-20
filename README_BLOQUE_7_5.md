# Bloque 7.5 — Migración e integración de módulos con PostgreSQL (Supabase)

## Objetivo
Migrar los módulos Usuarios, Pacientes, Médicos, Consultorios y Citas de almacenamiento en memoria a PostgreSQL (Supabase), preservando la arquitectura de la API Hospital, las validaciones, autenticación JWT, autorización RBAC y controles BOLA/IDOR.

> **Estado:** código revisado y preparado para pruebas. No se afirma que las 36 pruebas hayan sido ejecutadas ni aprobadas. La creación de índices, existencia de datos y compatibilidad entre los services deben verificarse en el entorno real.

## Antecedentes
- **7.1:** esquema PostgreSQL; RLS activado y sin políticas públicas. El acceso de la API mediante un rol privilegiado de PostgreSQL no sustituye la autorización en Express.
- **7.2:** conexión `pg` mediante `src/config/database.js`, consultas parametrizadas y TLS.
- **7.3:** migración de Especialidades.
- **7.4:** migración de Médicos (primera etapa).
- **7.5:** integración de Usuarios (7.5.1), Pacientes y Consultorios (7.5.2), Citas y autorizaciones relacionadas (7.5.3).

## Arquitectura
```text
Swagger / Postman
    │ HTTP + X-API-Key + Bearer JWT
    ▼
Express app.js
    ├─ helmet / CORS / rate limit
    ├─ API Key / autenticación JWT / RBAC
    ▼
Routes → express-validator → Controllers
                               ├─ reglas de negocio
                               └─ propiedad BOLA/IDOR
                                   ▼
                              Services (async)
                                   ▼
                       config/database.js → pg Pool
                                   ▼
                        Supabase / PostgreSQL
```

## Archivos principales
| Módulo | Servicio | Controller | Validador |
|---|---|---|---|
| Usuarios | `src/services/usuarios.service.js` | `src/controllers/usuarios.controller.js`, `src/controllers/auth.controller.js` | Validadores de usuarios/autenticación según el proyecto |
| Pacientes | `src/services/pacientes.service.js` | `src/controllers/pacientes.controller.js` | Validador de pacientes |
| Médicos | `src/services/medicos.service.js` | `src/controllers/medicos.controller.js` | `src/middlewares/medicos.validator.js` |
| Consultorios | `src/services/consultorios.service.js` | `src/controllers/consultorios.controller.js` | Validador de consultorios |
| Citas | `src/services/citas.service.js` | `src/controllers/citas.controller.js` | `src/middlewares/citas.validator.js` |
| Propiedad | — | — | `src/middlewares/propiedad.middleware.js` |

## Entidades y relaciones
- `roles (1) → (N) usuarios` mediante `usuarios.rol_id`.
- `usuarios (0..1) ↔ (0..1) pacientes` mediante `pacientes.usuario_id` cuando se asocia.
- `usuarios (0..1) ↔ (0..1) medicos` mediante `medicos.usuario_id` cuando se asocia.
- `especialidades (1) → (N) medicos`.
- `pacientes`, `medicos`, `consultorios` → `citas` por sus respectivas claves foráneas.
- Los IDs PostgreSQL `BIGINT` pueden serializarse como cadenas en Node.js; compararlos como cadenas y no convertir indiscriminadamente a `Number`.

## Requisitos
- Node.js compatible con el proyecto y dependencias instaladas (`npm install`).
- Variables de entorno configuradas localmente; **no publicar** `.env`, secretos, certificados privados ni tokens.
- Base Supabase y esquema de bloques anteriores.
- `src/config/database.js` operativo y certificados TLS según configuración existente.
- Usuario administrador para obtener JWT y una API Key válida.
- Datos reales de especialidad, paciente, médico y consultorio antes de crear citas.

## Ejecución
```powershell
node --check src/services/medicos.service.js
node --check src/services/citas.service.js
node --check src/controllers/medicos.controller.js
node --check src/controllers/citas.controller.js
node --check src/middlewares/medicos.validator.js
node --check src/middlewares/citas.validator.js
node --check src/middlewares/propiedad.middleware.js
npm run dev
```

Abrir `http://localhost:3000/api-docs` si se mantiene el puerto predeterminado y autorizar **X-API-Key** y **Bearer JWT** según los esquemas Swagger configurados.

## Índices para evitar conflictos de agenda
Verificar primero:
```sql
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname='public' AND tablename='citas'
ORDER BY indexname;
```
Si faltan, crear (si no hay datos duplicados incompatibles):
```sql
CREATE UNIQUE INDEX IF NOT EXISTS uq_citas_medico_horario_activo
ON public.citas (medico_id, fecha, hora)
WHERE estado <> 'cancelada';

CREATE UNIQUE INDEX IF NOT EXISTS uq_citas_consultorio_horario_activo
ON public.citas (consultorio_id, fecha, hora)
WHERE estado <> 'cancelada';
```
Estos índices protegen también contra solicitudes concurrentes que superen una validación previa `SELECT EXISTS`.

## Preparación de datos
1. `GET /api/especialidades`: verificar especialidad activa.
2. `GET /api/medicos`: verificar médico activo con especialidad activa.
3. `GET /api/pacientes`: verificar paciente.
4. `GET /api/consultorios`: verificar consultorio activo.
5. `GET /api/citas`: verificar conectividad y situación inicial.
6. Crear recursos faltantes con los POST correspondientes, con JWT de administrador y X-API-Key.
7. Registrar los IDs reales: **no asumir que todos son 1**.

## Ejemplo de creación de cita
`POST /api/citas` — sustituir IDs por los existentes:
```json
{
  "pacienteId": 1,
  "medicoId": 1,
  "consultorioId": 1,
  "fecha": "2026-10-27",
  "hora": "09:00",
  "motivo": "Consulta médica general de seguimiento"
}
```
Resultado esperado: `201`, con estado inicial `programada`. La hora de salida puede normalizarse como `09:00:00`.

## Matriz de pruebas 7.5
| ID | Módulo | Acción | Esperado | Resultado real | Evidencia |
|---|---|---|---|---|---|
| P01 | Usuarios | Registro válido | 201 | Pendiente | — |
| P02 | Usuarios | Correo duplicado | 409 | Pendiente | — |
| P03 | Auth | Login correcto | 200 | Pendiente | — |
| P04 | Auth | Contraseña incorrecta | 401 | Pendiente | — |
| P05 | Auth | Perfil con JWT válido | 200 | Pendiente | — |
| P06 | Auth | Perfil sin JWT | 401 | Pendiente | — |
| P07 | Auth | Solicitar rol administrador en registro público | Sin privilegios de administrador | Pendiente | — |
| P08 | Pacientes | Crear paciente válido | 201 | Pendiente | — |
| P09 | Pacientes | Listar pacientes | 200 | Pendiente | — |
| P10 | Pacientes | Consultar por ID | 200 | Pendiente | — |
| P11 | Pacientes | Documento duplicado | 409 | Pendiente | — |
| P12 | Pacientes | PATCH válido | 200 | Pendiente | — |
| P13 | Pacientes | Asociar usuario con rol distinto de paciente | 409 | Pendiente | — |
| P14 | Pacientes | Eliminar paciente con citas | 409 | Pendiente | — |
| P15 | Médicos | Crear con especialidad activa | 201 | Pendiente | — |
| P16 | Médicos | Registro profesional duplicado | 409 | Pendiente | — |
| P17 | Médicos | Listar por especialidad | 200 | Pendiente | — |
| P18 | Médicos | Asociar usuario médico | 200/201 según operación | Pendiente | — |
| P19 | Médicos | Asociar usuario de otro rol | 409 | Pendiente | — |
| P20 | Médicos | PATCH válido | 200 | Pendiente | — |
| P21 | Médicos | Eliminar médico con citas | 409 | Pendiente | — |
| P22 | Consultorios | Crear consultorio | 201 | Pendiente | — |
| P23 | Consultorios | Código duplicado | 409 | Pendiente | — |
| P24 | Consultorios | PATCH válido | 200 | Pendiente | — |
| P25 | Consultorios | Eliminar con citas | 409 | Pendiente | — |
| P26 | Citas | Crear cita válida | 201 | Pendiente | — |
| P27 | Citas | Médico inexistente | 400 | Pendiente | — |
| P28 | Citas | Médico inactivo | 409 | Pendiente | — |
| P29 | Citas | Médico ocupado a la misma fecha y hora | 409 | Pendiente | — |
| P30 | Citas | Consultorio ocupado a la misma fecha y hora | 409 | Pendiente | — |
| P31 | Citas | programada → confirmada | 200 | Pendiente | — |
| P32 | Citas | confirmada → atendida | 200 | Pendiente | — |
| P33 | Citas | atendida → programada | 409 | Pendiente | — |
| P34 | BOLA/IDOR | Paciente consulta cita ajena | 403 | Pendiente | — |
| P35 | API Key | Acceso sin X-API-Key | Rechazo (verificar código configurado) | Pendiente | — |
| P36 | Persistencia | Reiniciar API y volver a consultar cita | 200 y datos conservados | Pendiente | — |

**Nota:** el código esperado de cada caso supone que la ruta y la autenticación están correctamente configuradas. Anotar cualquier diferencia y analizarla antes de declarar la prueba aprobada.

## Pruebas de estado de citas
`PATCH /api/citas/{id}/estado`:
```json
{"estado":"confirmada"}
```
Luego:
```json
{"estado":"atendida"}
```
Las transiciones implementadas en el servicio son:
- `programada` → `confirmada` o `cancelada`.
- `confirmada` → `atendida` o `cancelada`.
- No se permite cambiar desde `atendida` o `cancelada` mediante ese endpoint.

## Evidencia directa en Supabase
```sql
SELECT id, paciente_id, medico_id, consultorio_id,
       fecha, hora, motivo, estado
FROM public.citas
ORDER BY id DESC;
```
Guardar evidencia del POST en Swagger, del registro en PostgreSQL y de la consulta posterior a reiniciar Node.js.

## Seguridad y control de acceso
- **API Key:** protege las rutas `/api` conforme al middleware configurado.
- **JWT:** identifica al usuario y debe verificar firma, expiración y vigencia del usuario en base de datos.
- **RBAC:** diferencia acciones administrativas de consultas permitidas a pacientes y médicos.
- **BOLA/IDOR:** en consultas individuales o por propietario, compara el usuario autenticado con el perfil y la cita solicitada.
- **RLS:** activado sin políticas públicas según Bloque 7.1. Si el pool usa un rol que elude RLS, la protección efectiva depende de permisos SQL y de Express.
- **SQL parametrizado:** evita concatenar entradas del cliente directamente en los valores de las consultas.
- **FK e índices únicos:** constituyen una segunda línea de protección frente a errores y concurrencia.

## Revisión de consistencia pendiente
- Verificar que `especialidades.service.js` devuelve `activa` y que controllers consultan exactamente esa propiedad.
- Verificar que los validadores estén en la ruta real `src/middlewares/` y se importen correctamente.
- Confirmar la versión instalada de `express-validator` para `.optional({ values: 'null' })`.
- Confirmar que el rol `medico` y `paciente` tenga un perfil asociado antes de probar `/api/citas/mis-citas` y BOLA/IDOR.
- Confirmar los índices de agenda y claves foráneas en PostgreSQL.
- No asumir que la ausencia de errores de sintaxis implica que todas las pruebas funcionales estén aprobadas.

## Criterio de cierre
El Bloque 7.5 se considerará verificado cuando la matriz de pruebas tenga resultados registrados, se haya comprobado la persistencia tras reinicio, los conflictos de agenda estén bloqueados, los perfiles ajenos no puedan consultarse y la integridad referencial se mantenga ante intentos de eliminación.
