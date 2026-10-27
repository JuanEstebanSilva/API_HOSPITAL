# LABORATORIO 8 — Validación integral de la API Hospital

> **Estado:** laboratorio preparado para ejecución. No se considera aprobada ninguna prueba sin resultado real y evidencia verificable.  
> **Origen:** `README_BLOQUE_7_5.md` (P01–P36) y `README_BLOQUE_7_5_1_BOOTSTRAP_ADMIN.md` (BA01–BA09).

## 1. Objetivo

Ejecutar y documentar pruebas funcionales, de integración, seguridad y persistencia de la API Hospital (Node.js, Express, PostgreSQL/Supabase), comprobando los controles JWT, API Key, RBAC, BOLA/IDOR, validaciones, restricciones SQL y reglas de agenda.

**Metáfora:** el laboratorio 7.5 construyó e integró las instalaciones del hospital; el laboratorio 8 inspecciona puertas, permisos, agendas y registros para demostrar que operan como fueron diseñados.

## 2. Alcance y criterios

- **P01–P36:** pruebas originales del bloque 7.5, sin renumerarlas ni cambiar sus resultados esperados.
- **BA01–BA09:** pruebas del bootstrap del administrador; BA08 y BA09 se realizan **solo en base de pruebas aislada**.
- **SEG-01–SEG-08:** comprobaciones complementarias de acceso de pacientes, médicos y administradores. Estas no sustituyen P34 ni BA.
- **No incluido:** implementación nueva de CRUD, frontend React, pruebas XSS/CSRF y fuzzing (se desarrollarán en bloques posteriores).

La prueba se aprueba solo cuando la solicitud, el código HTTP, el cuerpo de respuesta y el estado de los datos coinciden con el resultado esperado. Los resultados pueden ser **APROBADA**, **FALLIDA**, **BLOQUEADA** (precondición ausente) o **PENDIENTE**. Una prueba que recibe un 403 por falta de API Key, cuando debía comprobar BOLA, **no** demuestra BOLA: deben cumplirse previamente las credenciales de la capa correspondiente.

## 3. Arquitectura bajo prueba

```text
Swagger / Postman
  │ X-API-Key + JWT Bearer cuando corresponda
  ▼
Express: helmet, CORS, rate limit
  ▼
Routes → Validadores → JWT / RBAC / propiedad BOLA-IDOR
  ▼
Controllers → Services (consultas parametrizadas)
  ▼
pg Pool → Supabase / PostgreSQL
  ▼
FK, UNIQUE, CHECK e índices de agenda
```

**Importante:** tener RLS habilitado no demuestra que una conexión privilegiada de `pg` aplique políticas por usuario final. La autorización se debe comprobar en los middlewares del backend.

## 4. Requisitos y preparación

1. Instalar dependencias con `npm install` y configurar las variables de entorno existentes **sin publicar `.env`**.
2. Iniciar la API con `npm run dev` y abrir `http://localhost:3000/api-docs`.
3. Disponer de `X-API-Key` válida y JWT independientes para administrador, paciente A, paciente B, médico A y médico B (cuando aplique).
4. Verificar que `usuarios.rol_id`, `pacientes.usuario_id` y `medicos.usuario_id` vinculan correctamente cada identidad. No basta con que exista un médico en `medicos`: debe estar asociado a una cuenta para probar su agenda autenticada.
5. Preparar especialidades, consultorios, pacientes, médicos y citas de prueba; registrar los IDs reales, **sin asumir que son 1**.
6. Crear un respaldo o utilizar una base de pruebas para los casos que crean, actualizan, eliminan o alteran estados. **No ejecutar TRUNCATE** sobre la base actual.
7. Comprobar la existencia de índices de agenda y claves foráneas antes de P29/P30.

### 4.1 Consultas SQL de preparación

```sql
-- Cuentas, roles y asociaciones (sin mostrar hashes)
SELECT u.id AS usuario_id, u.email, r.nombre AS rol,
       p.id AS paciente_id, m.id AS medico_id
FROM public.usuarios u
JOIN public.roles r ON r.id = u.rol_id
LEFT JOIN public.pacientes p ON p.usuario_id = u.id
LEFT JOIN public.medicos m ON m.usuario_id = u.id
ORDER BY u.id;

-- Citas y propietarios
SELECT c.id AS cita_id, c.paciente_id, p.usuario_id AS paciente_usuario_id,
       c.medico_id, m.usuario_id AS medico_usuario_id,
       c.consultorio_id, c.fecha, c.hora, c.estado
FROM public.citas c
JOIN public.pacientes p ON p.id = c.paciente_id
JOIN public.medicos m ON m.id = c.medico_id
ORDER BY c.id;

-- Índices de agenda
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public' AND tablename = 'citas'
ORDER BY indexname;
```

## 5. Método de ejecución en Swagger

Para **cada** prueba:

1. Leer precondiciones, cuenta/rol y resultado esperado.
2. En Swagger, configurar `X-API-Key` y, si la ruta lo requiere, `Bearer JWT` del actor indicado. Para P35 retirar solo la API Key; para P06 retirar solo el JWT, manteniendo la API Key.
3. Ejecutar la petición con datos válidos o inválidos según el caso.
4. Anotar el **código HTTP real**, el mensaje, los IDs devueltos y el efecto sobre PostgreSQL.
5. Comparar con el contrato esperado. Guardar captura **sin tokens, API Keys, contraseñas ni hashes**.
6. Si falla, documentar causa, archivo corregido y repetición de la prueba. No cambiar el resultado esperado solo para hacer coincidir una respuesta incorrecta.

### 5.1 Plantilla individual

```text
ID: P__ / BA__ / SEG-__
Título:
Precondiciones:
Actor / rol:
Método y endpoint:
Datos enviados:
Resultado HTTP esperado:
Resultado HTTP real:
Verificación SQL / contenido de respuesta:
Estado: PENDIENTE | APROBADA | FALLIDA | BLOQUEADA
Evidencia: evidencias/<archivo>
Observaciones / incidencia / corrección:
```

## 6. Matriz P01–P36 (conservada del Lab 7.5)

**Nota:** el resultado esperado de P35 depende del código configurado por el middleware de API Key. P18 acepta 200 o 201 según se trate de asociación/actualización o creación. No se debe asumir que todas las rutas usan los mismos códigos ante recursos inexistentes.

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

### 6.1 Orden sugerido

- **8.1 Usuarios y Auth:** P01–P07. Para P07, comprobar el rol persistido en PostgreSQL; no basta con un código HTTP exitoso.
- **8.2 Pacientes:** P08–P14. P14 requiere un paciente con cita relacionada y comprobar que no se eliminó.
- **8.3 Médicos:** P15–P21. P18/P19 requieren cuentas de los roles apropiados.
- **8.4 Consultorios:** P22–P25. P25 requiere un consultorio referenciado por citas.
- **8.5 Citas:** P26–P33. Preparar médico activo, consultorio activo, pacientes y horarios diferenciados. No reutilizar sin control una cita cuyo estado se cambió.
- **8.6 Seguridad:** P34–P35. En P34 usar JWT de un paciente distinto del propietario de la cita; mantener API Key válida.
- **8.7 Persistencia:** P36. Registrar la cita, detener Node.js, reiniciar la API y consultarla; comparar ID, paciente, médico, consultorio, fecha, hora y estado.

### 6.2 Secuencia de estados P31–P33

Endpoint: `PATCH /api/citas/{id}/estado` (con cuenta autorizada).

```json
{"estado":"confirmada"}
```

Después:

```json
{"estado":"atendida"}
```

Intentar luego volver a `programada` debe producir el rechazo esperado. **Utilizar una cita de prueba específica**: el cambio a `atendida` puede ser irreversible mediante este endpoint.

## 7. Matriz complementaria de seguridad SEG-01–SEG-08

Para las pruebas médicas, crear/vincular **dos cuentas con rol `medico`** y **dos perfiles `medicos`**, con citas de cada uno. Registrar `medico_id` y `usuario_id` de ambos. Los resultados son **requisitos que se deben verificar**, no afirmaciones de pruebas ya superadas.

| ID | Actor y acción | Endpoint de referencia | Esperado | Real | Estado |
|---|---|---|---|---|---|
| SEG-01 | Paciente consulta cita propia | `GET /api/citas/{idPropia}` | 200 | — | PENDIENTE |
| SEG-02 | Paciente consulta cita ajena | `GET /api/citas/{idAjena}` | 403 | — | PENDIENTE |
| SEG-03 | Paciente consulta sus citas | `GET /api/citas/mis-citas` | 200, solo propias | — | PENDIENTE |
| SEG-04 | Médico consulta sus citas | `GET /api/citas/mis-citas` | 200, solo asignadas | — | PENDIENTE |
| SEG-05 | Médico A consulta agenda del médico B | `GET /api/citas/medico/{medicoBId}` | 403 | — | PENDIENTE |
| SEG-06 | Médico A consulta cita del médico B | `GET /api/citas/{citaMedicoBId}` | 403 | — | PENDIENTE |
| SEG-07 | Médico intenta crear cita de uso administrativo | `POST /api/citas` | 403 si ruta reservada a admin | — | PENDIENTE |
| SEG-08 | Administrador consulta cita | `GET /api/citas/{id}` | 200 | — | PENDIENTE |

**Atención:** si la API no implementa una restricción prevista, registrar **FALLIDA** y crear una incidencia; no suponer que la regla está aplicada por el mero hecho de existir JWT. Verificar además la respuesta del cuerpo, para detectar filtraciones aunque el código HTTP sea 200.

## 8. Matriz BA01–BA09 (conservada del bootstrap 7.5.1)

Comando del bootstrap: `npm run seed:admin`. No confundir con el framework CSS Bootstrap. El bootstrap aquí es un proceso explícito de inicialización del primer administrador; **no** debe ejecutarse automáticamente con `npm run dev`.

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

### 8.1 Precauciones para BA08–BA09

Realizar ambas pruebas únicamente en una **base de datos aislada**, con credenciales distintas y datos sintéticos. No eliminar administradores ni vaciar tablas de la base de trabajo para simular el primer arranque. Registrar cantidad de administradores antes y después y comprobar que una cuenta de paciente existente no recibe privilegios administrativos.

Consulta útil:

```sql
SELECT u.id, u.email, r.nombre AS rol
FROM public.usuarios u
JOIN public.roles r ON r.id = u.rol_id
WHERE r.nombre = 'administrador'
ORDER BY u.id;
```

## 9. Evidencias y trazabilidad

Estructura sugerida:

```text
laboratorio-8/
├── README_BLOQUE_8.md
└── evidencias/
    ├── P01_registro_valido.png
    ├── P34_cita_ajena_403.png
    ├── P36_persistencia_tras_reinicio.png
    ├── SEG-05_agenda_medico_ajeno.png
    ├── BA01_bootstrap_existente.png
    └── informe_incidencias.md
```

Los nombres son **ejemplos**, no archivos de evidencia ya generados. Si se usan capturas anteriores, verificar que muestran exactamente la solicitud y el resultado de la prueba correspondiente. Una captura de `GET /api/citas/paciente/1` con 403 **no sustituye** P34, que exige consultar una cita individual ajena.

### 9.1 Registro de incidencias

| Incidencia | Prueba | Resultado observado | Causa confirmada | Corrección | Reprueba |
|---|---|---|---|---|---|
| INC-001 | — | — | — | — | PENDIENTE |

## 10. Informe de cierre

Registrar las pruebas realizadas


