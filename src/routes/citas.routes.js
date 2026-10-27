const express =
  require("express");

const router =
  express.Router();


// ========================================
// Controller
// ========================================

const citasController =
  require(
    "../controllers/citas.controller"
  );


// ========================================
// Validadores
// ========================================

const {
  validarIdCita,
  validarIdPaciente,
  validarIdMedico,
  validarCreacionCita,
  validarActualizacionCita,
  validarCitaParcial,
  validarEstadoCita
} = require(
  "../middlewares/citas.validator"
);


const validar =
  require(
    "../middlewares/validar.middleware"
  );


// ========================================
// Seguridad
// ========================================

const autenticarJWT =
  require(
    "../middlewares/auth.middleware"
  );


const autorizarRoles =
  require(
    "../middlewares/roles.middleware"
  );


const {
  autorizarPacientePropio,
  autorizarMedicoPropio,
  autorizarAccesoCita
} = require(
  "../middlewares/propiedad.middleware"
);


// ========================================
// Schemas Swagger
// ========================================

/**
 * @openapi
 * components:
 *   schemas:
 *
 *     Cita:
 *       type: object
 *       properties:
 *
 *         id:
 *           type: integer
 *           example: 1
 *
 *         pacienteId:
 *           type: integer
 *           example: 1
 *
 *         medicoId:
 *           type: integer
 *           example: 1
 *
 *         consultorioId:
 *           type: integer
 *           example: 2
 *
 *         fecha:
 *           type: string
 *           format: date
 *           example: "2026-09-15"
 *
 *         hora:
 *           type: string
 *           example: "10:30"
 *
 *         motivo:
 *           type: string
 *           example: Consulta de control
 *
 *         estado:
 *           type: string
 *           enum:
 *             - programada
 *             - confirmada
 *             - atendida
 *             - cancelada
 *           example: programada
 *
 *
 *     CitaEntrada:
 *       type: object
 *
 *       description:
 *         Datos requeridos para crear o actualizar una cita.
 *         El estado es administrado por la API.
 *
 *       required:
 *         - pacienteId
 *         - medicoId
 *         - consultorioId
 *         - fecha
 *         - hora
 *         - motivo
 *
 *       properties:
 *
 *         pacienteId:
 *           type: integer
 *           minimum: 1
 *           example: 1
 *
 *         medicoId:
 *           type: integer
 *           minimum: 1
 *           example: 1
 *
 *         consultorioId:
 *           type: integer
 *           minimum: 1
 *           example: 2
 *
 *         fecha:
 *           type: string
 *           format: date
 *           example: "2026-09-20"
 *
 *         hora:
 *           type: string
 *           example: "14:30"
 *
 *         motivo:
 *           type: string
 *           minLength: 5
 *           maxLength: 300
 *           example: Consulta médica de seguimiento
 *
 *
 *     CitaParcial:
 *       type: object
 *
 *       description:
 *         Actualización parcial de datos.
 *         El estado no puede modificarse por este endpoint.
 *
 *       properties:
 *
 *         pacienteId:
 *           type: integer
 *           minimum: 1
 *
 *         medicoId:
 *           type: integer
 *           minimum: 1
 *
 *         consultorioId:
 *           type: integer
 *           minimum: 1
 *
 *         fecha:
 *           type: string
 *           format: date
 *
 *         hora:
 *           type: string
 *           example: "15:00"
 *
 *         motivo:
 *           type: string
 *           example: Nuevo motivo de consulta
 *
 *
 *     EstadoCita:
 *       type: object
 *
 *       required:
 *         - estado
 *
 *       properties:
 *
 *         estado:
 *           type: string
 *           enum:
 *             - programada
 *             - confirmada
 *             - atendida
 *             - cancelada
 *           example: confirmada
 */


// ========================================
// GET
// Obtener todas las citas
// SOLO ADMINISTRADOR
// ========================================

/**
 * @openapi
 * /api/citas:
 *   get:
 *     tags:
 *       - Citas
 *
 *     summary:
 *       Obtener todas las citas
 *
 *     description:
 *       Operación disponible únicamente para administradores.
 *
 *     security:
 *       - ApiKeyAuth: []
 *         BearerAuth: []
 *
 *     responses:
 *
 *       200:
 *         description:
 *           Lista de citas
 *
 *       401:
 *         description:
 *           Usuario no autenticado
 *
 *       403:
 *         description:
 *           Usuario sin permisos para consultar todas las citas
 */

router.get(
  "/",

  autenticarJWT,

  autorizarRoles(
    "administrador"
  ),

  citasController
    .obtenerCitas
);


// ========================================
// GET
// Obtener mis citas
// PACIENTE O MÉDICO
// ========================================

/**
 * @openapi
 * /api/citas/mis-citas:
 *   get:
 *     tags:
 *       - Citas
 *
 *     summary:
 *       Obtener las citas del usuario autenticado
 *
 *     description: >
 *       Obtiene automáticamente las citas asociadas
 *       al paciente o médico autenticado utilizando
 *       la identidad contenida en el JWT.
 *       No requiere enviar pacienteId ni medicoId.
 *
 *     security:
 *       - ApiKeyAuth: []
 *         BearerAuth: []
 *
 *     responses:
 *
 *       200:
 *         description:
 *           Citas del usuario autenticado
 *
 *       401:
 *         description:
 *           Usuario no autenticado
 *
 *       403:
 *         description:
 *           Usuario sin perfil asociado o sin permisos
 */

router.get(
  "/mis-citas",

  autenticarJWT,

  autorizarRoles(
    "paciente",
    "medico"
  ),

  citasController
    .obtenerMisCitas
);


// ========================================
// GET
// Obtener citas por paciente
// Protección BOLA / IDOR
// ========================================

/**
 * @openapi
 * /api/citas/paciente/{pacienteId}:
 *   get:
 *     tags:
 *       - Citas
 *
 *     summary:
 *       Obtener citas de un paciente
 *
 *     description:
 *       El administrador puede consultar cualquier paciente.
 *       Un paciente solamente puede consultar sus propias citas.
 *
 *     security:
 *       - ApiKeyAuth: []
 *         BearerAuth: []
 *
 *     parameters:
 *
 *       - in: path
 *         name: pacienteId
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *
 *     responses:
 *
 *       200:
 *         description:
 *           Lista de citas del paciente
 *
 *       400:
 *         description:
 *           ID inválido
 *
 *       401:
 *         description:
 *           Usuario no autenticado
 *
 *       403:
 *         description:
 *           Usuario sin autorización sobre este paciente
 *
 *       404:
 *         description:
 *           Paciente no encontrado
 */

router.get(
  "/paciente/:pacienteId",

  autenticarJWT,

  autorizarRoles(
    "administrador",
    "paciente"
  ),

  validarIdPaciente,

  validar,

  autorizarPacientePropio,

  citasController
    .obtenerCitasPorPaciente
);


// ========================================
// GET
// Obtener citas por médico
// Protección BOLA / IDOR
// ========================================

/**
 * @openapi
 * /api/citas/medico/{medicoId}:
 *   get:
 *     tags:
 *       - Citas
 *
 *     summary:
 *       Obtener citas de un médico
 *
 *     description:
 *       El administrador puede consultar cualquier médico.
 *       Un médico solamente puede consultar sus propias citas.
 *
 *     security:
 *       - ApiKeyAuth: []
 *         BearerAuth: []
 *
 *     parameters:
 *
 *       - in: path
 *         name: medicoId
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *
 *     responses:
 *
 *       200:
 *         description:
 *           Lista de citas del médico
 *
 *       400:
 *         description:
 *           ID inválido
 *
 *       401:
 *         description:
 *           Usuario no autenticado
 *
 *       403:
 *         description:
 *           Usuario sin autorización sobre este médico
 *
 *       404:
 *         description:
 *           Médico no encontrado
 */

router.get(
  "/medico/:medicoId",

  autenticarJWT,

  autorizarRoles(
    "administrador",
    "medico"
  ),

  validarIdMedico,

  validar,

  autorizarMedicoPropio,

  citasController
    .obtenerCitasPorMedico
);


// ========================================
// GET
// Obtener cita por ID
// Protección BOLA / IDOR
// DEJAR DESPUÉS DE RUTAS ESPECÍFICAS
// ========================================

/**
 * @openapi
 * /api/citas/{id}:
 *   get:
 *     tags:
 *       - Citas
 *
 *     summary:
 *       Obtener una cita por ID
 *
 *     description:
 *       El administrador puede consultar cualquier cita.
 *       Médicos y pacientes únicamente pueden consultar
 *       citas asociadas a su propio perfil.
 *
 *     security:
 *       - ApiKeyAuth: []
 *         BearerAuth: []
 *
 *     parameters:
 *
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *
 *     responses:
 *
 *       200:
 *         description:
 *           Cita encontrada
 *
 *       400:
 *         description:
 *           ID inválido
 *
 *       401:
 *         description:
 *           Usuario no autenticado
 *
 *       403:
 *         description:
 *           Acceso no autorizado a la cita
 *
 *       404:
 *         description:
 *           Cita no encontrada
 */

router.get(
  "/:id",

  autenticarJWT,

  autorizarRoles(
    "administrador",
    "medico",
    "paciente"
  ),

  validarIdCita,

  validar,

  autorizarAccesoCita,

  citasController
    .obtenerCitaPorId
);


// ========================================
// POST
// Crear cita
// SOLO ADMINISTRADOR
// ========================================

/**
 * @openapi
 * /api/citas:
 *   post:
 *     tags:
 *       - Citas
 *
 *     summary:
 *       Crear una cita
 *
 *     description:
 *       Operación disponible únicamente para administradores.
 *       Toda nueva cita se crea con estado programada.
 *
 *     security:
 *       - ApiKeyAuth: []
 *         BearerAuth: []
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CitaEntrada'
 *
 *     responses:
 *
 *       201:
 *         description:
 *           Cita creada correctamente
 *
 *       400:
 *         description:
 *           Datos inválidos o relación inexistente
 *
 *       401:
 *         description:
 *           Usuario no autenticado
 *
 *       403:
 *         description:
 *           Operación permitida únicamente al administrador
 *
 *       409:
 *         description:
 *           Conflicto de agenda o recurso inactivo
 */

router.post(
  "/",

  autenticarJWT,

  autorizarRoles(
    "administrador"
  ),

  validarCreacionCita,

  validar,

  citasController
    .crearCita
);


// ========================================
// PUT
// Actualización completa
// SOLO ADMINISTRADOR
// ========================================

/**
 * @openapi
 * /api/citas/{id}:
 *   put:
 *     tags:
 *       - Citas
 *
 *     summary:
 *       Actualizar completamente una cita
 *
 *     description:
 *       Operación disponible únicamente para administradores.
 *
 *     security:
 *       - ApiKeyAuth: []
 *         BearerAuth: []
 *
 *     parameters:
 *
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CitaEntrada'
 *
 *     responses:
 *
 *       200:
 *         description:
 *           Cita actualizada
 *
 *       400:
 *         description:
 *           Datos inválidos
 *
 *       401:
 *         description:
 *           Usuario no autenticado
 *
 *       403:
 *         description:
 *           Operación permitida únicamente al administrador
 *
 *       404:
 *         description:
 *           Cita no encontrada
 *
 *       409:
 *         description:
 *           Conflicto de agenda o recurso inactivo
 */

router.put(
  "/:id",

  autenticarJWT,

  autorizarRoles(
    "administrador"
  ),

  validarIdCita,

  validarActualizacionCita,

  validar,

  citasController
    .actualizarCita
);


// ========================================
// PATCH
// Actualización parcial
// SOLO ADMINISTRADOR
// ========================================

/**
 * @openapi
 * /api/citas/{id}:
 *   patch:
 *     tags:
 *       - Citas
 *
 *     summary:
 *       Actualizar parcialmente una cita
 *
 *     description:
 *       Operación disponible únicamente para administradores.
 *       No permite modificar el estado.
 *
 *     security:
 *       - ApiKeyAuth: []
 *         BearerAuth: []
 *
 *     parameters:
 *
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CitaParcial'
 *
 *     responses:
 *
 *       200:
 *         description:
 *           Cita actualizada parcialmente
 *
 *       400:
 *         description:
 *           Datos inválidos o cuerpo sin campos permitidos
 *
 *       401:
 *         description:
 *           Usuario no autenticado
 *
 *       403:
 *         description:
 *           Operación permitida únicamente al administrador
 *
 *       404:
 *         description:
 *           Cita no encontrada
 *
 *       409:
 *         description:
 *           Conflicto de agenda o recurso inactivo
 */

router.patch(
  "/:id",

  autenticarJWT,

  autorizarRoles(
    "administrador"
  ),

  validarIdCita,

  validarCitaParcial,

  validar,

  citasController
    .actualizarCitaParcial
);


// ========================================
// PATCH
// Cambiar estado
// SOLO ADMINISTRADOR
// ========================================

/**
 * @openapi
 * /api/citas/{id}/estado:
 *   patch:
 *     tags:
 *       - Citas
 *
 *     summary:
 *       Cambiar el estado de una cita
 *
 *     description:
 *       Operación disponible únicamente para administradores.
 *       Aplica la máquina de estados de la cita.
 *
 *     security:
 *       - ApiKeyAuth: []
 *         BearerAuth: []
 *
 *     parameters:
 *
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EstadoCita'
 *
 *     responses:
 *
 *       200:
 *         description:
 *           Estado actualizado correctamente
 *
 *       400:
 *         description:
 *           Estado o ID inválido
 *
 *       401:
 *         description:
 *           Usuario no autenticado
 *
 *       403:
 *         description:
 *           Operación permitida únicamente al administrador
 *
 *       404:
 *         description:
 *           Cita no encontrada
 *
 *       409:
 *         description:
 *           Transición de estado no permitida
 */

router.patch(
  "/:id/estado",

  autenticarJWT,

  autorizarRoles(
    "administrador"
  ),

  validarIdCita,

  validarEstadoCita,

  validar,

  citasController
    .actualizarEstadoCita
);


// ========================================
// DELETE
// Eliminar cita
// SOLO ADMINISTRADOR
// ========================================

/**
 * @openapi
 * /api/citas/{id}:
 *   delete:
 *     tags:
 *       - Citas
 *
 *     summary:
 *       Eliminar una cita
 *
 *     description:
 *       Operación disponible únicamente para administradores.
 *
 *     security:
 *       - ApiKeyAuth: []
 *         BearerAuth: []
 *
 *     parameters:
 *
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *
 *     responses:
 *
 *       200:
 *         description:
 *           Cita eliminada
 *
 *       400:
 *         description:
 *           ID inválido
 *
 *       401:
 *         description:
 *           Usuario no autenticado
 *
 *       403:
 *         description:
 *           Operación permitida únicamente al administrador
 *
 *       404:
 *         description:
 *           Cita no encontrada
 */

router.delete(
  "/:id",

  autenticarJWT,

  autorizarRoles(
    "administrador"
  ),

  validarIdCita,

  validar,

  citasController
    .eliminarCita
);


// ========================================
// Exportar router
// ========================================

module.exports =
  router;