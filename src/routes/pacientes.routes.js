// ========================================
// Importaciones
// ========================================

const express = require("express");

const router = express.Router();

const pacientesController = require("../controllers/pacientes.controller");

const autenticarJWT = require("../middlewares/auth.middleware");

const autorizarRoles = require("../middlewares/roles.middleware");

const {
  validarIdPaciente,
  validarPaciente,
  validarPacienteParcial,
} = require("../middlewares/pacientes.validator");

const validar = require("../middlewares/validar.middleware");


// ========================================
// Swagger - Schemas
// ========================================

/**
 * @openapi
 * components:
 *   schemas:
 *
 *     Paciente:
 *       type: object
 *       properties:
 *
 *         id:
 *           type: integer
 *           example: 1
 *
 *         nombre:
 *           type: string
 *           example: Laura Gómez
 *
 *         documento:
 *           type: string
 *           example: "1020304050"
 *
 *         email:
 *           type: string
 *           format: email
 *           example: laura@correo.com
 *
 *         telefono:
 *           type: string
 *           example: "3001234567"
 *
 *         fechaNacimiento:
 *           type: string
 *           format: date
 *           example: "1990-05-15"
 *
 *
 *     PacienteEntrada:
 *       type: object
 *
 *       required:
 *         - nombre
 *         - documento
 *         - email
 *         - telefono
 *         - fechaNacimiento
 *
 *       properties:
 *
 *         nombre:
 *           type: string
 *           minLength: 3
 *           maxLength: 100
 *           example: María Rodríguez
 *
 *         documento:
 *           type: string
 *           pattern: '^[0-9]{6,15}$'
 *           example: "1056789012"
 *
 *         email:
 *           type: string
 *           format: email
 *           example: maria@correo.com
 *
 *         telefono:
 *           type: string
 *           pattern: '^[0-9]{7,15}$'
 *           example: "3151234567"
 *
 *         fechaNacimiento:
 *           type: string
 *           format: date
 *           example: "1995-08-20"
 *
 *
 *     PacienteActualizacionParcial:
 *       type: object
 *
 *       description:
 *         Permite actualizar uno o varios campos del paciente.
 *
 *       properties:
 *
 *         nombre:
 *           type: string
 *           minLength: 3
 *           maxLength: 100
 *           example: Laura Gómez Pérez
 *
 *         documento:
 *           type: string
 *           pattern: '^[0-9]{6,15}$'
 *           example: "1020304050"
 *
 *         email:
 *           type: string
 *           format: email
 *           example: laura.gomez@correo.com
 *
 *         telefono:
 *           type: string
 *           pattern: '^[0-9]{7,15}$'
 *           example: "3101112233"
 *
 *         fechaNacimiento:
 *           type: string
 *           format: date
 *           example: "1990-05-15"
 */


// ========================================
// GET /api/pacientes
// Administrador y médico
// ========================================

/**
 * @openapi
 * /api/pacientes:
 *   get:
 *
 *     tags:
 *       - Pacientes
 *
 *     summary:
 *       Obtener todos los pacientes
 *
 *     description:
 *       Retorna la lista completa de pacientes.
 *       Solo puede ser consultada por usuarios con rol
 *       administrador o médico.
 *
 *     security:
 *       - ApiKeyAuth: []
 *         BearerAuth: []
 *
 *     responses:
 *
 *       200:
 *         description:
 *           Lista de pacientes
 *
 *         content:
 *           application/json:
 *
 *             schema:
 *               type: array
 *
 *               items:
 *                 $ref: '#/components/schemas/Paciente'
 *
 *       401:
 *         description:
 *           Token ausente, inválido o expirado
 *
 *       403:
 *         description:
 *           El usuario no tiene permisos para acceder
 */
router.get(
  "/",

  autenticarJWT,

  autorizarRoles(
    "administrador",
    "medico"
  ),

  pacientesController.obtenerPacientes
);


// ========================================
// GET /api/pacientes/:id
// Administrador y médico
// ========================================

/**
 * @openapi
 * /api/pacientes/{id}:
 *   get:
 *
 *     tags:
 *       - Pacientes
 *
 *     summary:
 *       Obtener paciente por ID
 *
 *     description:
 *       Permite consultar un paciente específico.
 *       Solo los administradores y médicos pueden acceder.
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
 *
 *         schema:
 *           type: integer
 *           minimum: 1
 *
 *         description:
 *           Identificador único del paciente
 *
 *     responses:
 *
 *       200:
 *         description:
 *           Paciente encontrado
 *
 *         content:
 *           application/json:
 *
 *             schema:
 *               $ref: '#/components/schemas/Paciente'
 *
 *       400:
 *         description:
 *           ID inválido
 *
 *       401:
 *         description:
 *           Token ausente, inválido o expirado
 *
 *       403:
 *         description:
 *           El usuario no tiene permisos para acceder
 *
 *       404:
 *         description:
 *           Paciente no encontrado
 */
router.get(
  "/:id",

  autenticarJWT,

  autorizarRoles(
    "administrador",
    "medico"
  ),

  validarIdPaciente,

  validar,

  pacientesController.obtenerPacientePorId
);


// ========================================
// POST /api/pacientes
// Solo administrador
// ========================================

/**
 * @openapi
 * /api/pacientes:
 *   post:
 *
 *     tags:
 *       - Pacientes
 *
 *     summary:
 *       Crear un paciente
 *
 *     description:
 *       Crea un nuevo paciente utilizando únicamente
 *       los campos permitidos por la API.
 *       Solo un administrador puede realizar esta operación.
 *
 *     security:
 *       - ApiKeyAuth: []
 *         BearerAuth: []
 *
 *     requestBody:
 *       required: true
 *
 *       content:
 *         application/json:
 *
 *           schema:
 *             $ref: '#/components/schemas/PacienteEntrada'
 *
 *     responses:
 *
 *       201:
 *         description:
 *           Paciente creado correctamente
 *
 *       400:
 *         description:
 *           Datos inválidos
 *
 *       401:
 *         description:
 *           Token ausente, inválido o expirado
 *
 *       403:
 *         description:
 *           Solo un administrador puede crear pacientes
 *
 *       409:
 *         description:
 *           Ya existe un paciente con ese documento
 */
router.post(
  "/",

  autenticarJWT,

  autorizarRoles(
    "administrador"
  ),

  validarPaciente,

  validar,

  pacientesController.crearPaciente
);


// ========================================
// PUT /api/pacientes/:id
// Solo administrador
// ========================================

/**
 * @openapi
 * /api/pacientes/{id}:
 *   put:
 *
 *     tags:
 *       - Pacientes
 *
 *     summary:
 *       Actualizar completamente un paciente
 *
 *     description:
 *       Actualiza todos los campos editables del paciente.
 *       Solo un administrador puede realizar esta operación.
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
 *
 *         schema:
 *           type: integer
 *           minimum: 1
 *
 *         description:
 *           Identificador del paciente
 *
 *     requestBody:
 *       required: true
 *
 *       content:
 *         application/json:
 *
 *           schema:
 *             $ref: '#/components/schemas/PacienteEntrada'
 *
 *     responses:
 *
 *       200:
 *         description:
 *           Paciente actualizado correctamente
 *
 *       400:
 *         description:
 *           Datos inválidos
 *
 *       401:
 *         description:
 *           Token ausente, inválido o expirado
 *
 *       403:
 *         description:
 *           Solo un administrador puede actualizar pacientes
 *
 *       404:
 *         description:
 *           Paciente no encontrado
 *
 *       409:
 *         description:
 *           El documento pertenece a otro paciente
 */
router.put(
  "/:id",

  autenticarJWT,

  autorizarRoles(
    "administrador"
  ),

  validarIdPaciente,

  validarPaciente,

  validar,

  pacientesController.actualizarPaciente
);


// ========================================
// PATCH /api/pacientes/:id
// Solo administrador
// ========================================

/**
 * @openapi
 * /api/pacientes/{id}:
 *   patch:
 *
 *     tags:
 *       - Pacientes
 *
 *     summary:
 *       Actualizar parcialmente un paciente
 *
 *     description:
 *       Permite actualizar uno o varios campos del paciente
 *       sin necesidad de enviar el recurso completo.
 *       Solo un administrador puede realizar esta operación.
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
 *
 *         schema:
 *           type: integer
 *           minimum: 1
 *
 *         description:
 *           Identificador del paciente
 *
 *     requestBody:
 *       required: true
 *
 *       content:
 *         application/json:
 *
 *           schema:
 *             $ref: '#/components/schemas/PacienteActualizacionParcial'
 *
 *           examples:
 *
 *             actualizarNombre:
 *               summary:
 *                 Actualizar solamente el nombre
 *
 *               value:
 *                 nombre: Laura Gómez Pérez
 *
 *             actualizarContacto:
 *               summary:
 *                 Actualizar correo y teléfono
 *
 *               value:
 *                 email: laura.gomez@correo.com
 *                 telefono: "3101112233"
 *
 *     responses:
 *
 *       200:
 *         description:
 *           Paciente actualizado parcialmente
 *
 *       400:
 *         description:
 *           Datos inválidos o no se enviaron campos válidos
 *
 *       401:
 *         description:
 *           Token ausente, inválido o expirado
 *
 *       403:
 *         description:
 *           Solo un administrador puede actualizar pacientes
 *
 *       404:
 *         description:
 *           Paciente no encontrado
 *
 *       409:
 *         description:
 *           El documento pertenece a otro paciente
 */
router.patch(
  "/:id",

  autenticarJWT,

  autorizarRoles(
    "administrador"
  ),

  validarIdPaciente,

  validarPacienteParcial,

  validar,

  pacientesController.actualizarPacienteParcial
);


// ========================================
// DELETE /api/pacientes/:id
// Solo administrador
// ========================================

/**
 * @openapi
 * /api/pacientes/{id}:
 *   delete:
 *
 *     tags:
 *       - Pacientes
 *
 *     summary:
 *       Eliminar paciente
 *
 *     description:
 *       Elimina un paciente del sistema.
 *       Solo un administrador puede realizar esta operación.
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
 *
 *         schema:
 *           type: integer
 *           minimum: 1
 *
 *         description:
 *           Identificador del paciente
 *
 *     responses:
 *
 *       200:
 *         description:
 *           Paciente eliminado correctamente
 *
 *       400:
 *         description:
 *           ID inválido
 *
 *       401:
 *         description:
 *           Token ausente, inválido o expirado
 *
 *       403:
 *         description:
 *           Solo un administrador puede eliminar pacientes
 *
 *       404:
 *         description:
 *           Paciente no encontrado
 */
router.delete(
  "/:id",

  autenticarJWT,

  autorizarRoles(
    "administrador"
  ),

  validarIdPaciente,

  validar,

  pacientesController.eliminarPaciente
);


// ========================================
// Exportar router
// ========================================

module.exports = router;