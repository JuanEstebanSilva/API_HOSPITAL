const express =
  require("express");


const router =
  express.Router();


const citasController =
  require(
    "../controllers/citas.controller"
  );


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


/**
 * @openapi
 * components:
 *   schemas:
 *
 *     Cita:
 *       type: object
 *
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
 *         Datos requeridos para crear o actualizar una cita. El estado es administrado por la API.
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
 *           pattern: '^([01]\d|2[0-3]):([0-5]\d)$'
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
 *         Actualización parcial de datos. El estado no puede modificarse por este endpoint.
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
 *     responses:
 *
 *       200:
 *         description:
 *           Lista de citas
 */
router.get(
  "/",
  citasController
    .obtenerCitas
);


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
 *     parameters:
 *
 *       - in: path
 *         name: pacienteId
 *         required: true
 *
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
 *       404:
 *         description:
 *           Paciente no encontrado
 */
router.get(
  "/paciente/:pacienteId",

  validarIdPaciente,

  validar,

  citasController
    .obtenerCitasPorPaciente
);


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
 *     parameters:
 *
 *       - in: path
 *         name: medicoId
 *         required: true
 *
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
 *       404:
 *         description:
 *           Médico no encontrado
 */
router.get(
  "/medico/:medicoId",

  validarIdMedico,

  validar,

  citasController
    .obtenerCitasPorMedico
);


/**
 * @openapi
 * /api/citas/{id}:
 *   get:
 *     tags:
 *       - Citas
 *
 *     summary:
 *       Obtener cita por ID
 *
 *     parameters:
 *
 *       - in: path
 *         name: id
 *         required: true
 *
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
 *       404:
 *         description:
 *           Cita no encontrada
 */
router.get(
  "/:id",

  validarIdCita,

  validar,

  citasController
    .obtenerCitaPorId
);


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
 *       Toda nueva cita es creada automáticamente con estado programada.
 *
 *     requestBody:
 *       required: true
 *
 *       content:
 *         application/json:
 *
 *           schema:
 *             $ref: '#/components/schemas/CitaEntrada'
 *
 *     responses:
 *
 *       201:
 *         description:
 *           Cita creada correctamente con estado programada
 *
 *       400:
 *         description:
 *           Datos inválidos o relación inexistente
 *
 *       409:
 *         description:
 *           Conflicto de agenda o recurso inactivo
 */
router.post(
  "/",

  validarCreacionCita,

  validar,

  citasController
    .crearCita
);


/**
 * @openapi
 * /api/citas/{id}:
 *   put:
 *     tags:
 *       - Citas
 *
 *     summary:
 *       Actualizar completamente los datos editables de una cita
 *
 *     description:
 *       El estado actual se conserva y solo puede cambiarse mediante el endpoint especializado.
 *
 *     parameters:
 *
 *       - in: path
 *         name: id
 *         required: true
 *
 *         schema:
 *           type: integer
 *           minimum: 1
 *
 *     requestBody:
 *       required: true
 *
 *       content:
 *         application/json:
 *
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

  validarIdCita,

  validarActualizacionCita,

  validar,

  citasController
    .actualizarCita
);


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
 *       No permite modificar el estado. Para ello debe utilizarse PATCH /api/citas/{id}/estado.
 *
 *     parameters:
 *
 *       - in: path
 *         name: id
 *         required: true
 *
 *         schema:
 *           type: integer
 *           minimum: 1
 *
 *     requestBody:
 *       required: true
 *
 *       content:
 *         application/json:
 *
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

  validarIdCita,

  validarCitaParcial,

  validar,

  citasController
    .actualizarCitaParcial
);


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
 *       Único endpoint autorizado para modificar el estado. Aplica la máquina de estados de la cita.
 *
 *     parameters:
 *
 *       - in: path
 *         name: id
 *         required: true
 *
 *         schema:
 *           type: integer
 *           minimum: 1
 *
 *     requestBody:
 *       required: true
 *
 *       content:
 *         application/json:
 *
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

  validarIdCita,

  validarEstadoCita,

  validar,

  citasController
    .actualizarEstadoCita
);


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
 *     parameters:
 *
 *       - in: path
 *         name: id
 *         required: true
 *
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
 *       404:
 *         description:
 *           Cita no encontrada
 */
router.delete(
  "/:id",

  validarIdCita,

  validar,

  citasController
    .eliminarCita
);


module.exports =
  router;