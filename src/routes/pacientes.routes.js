const express = require("express");

const router = express.Router();

const pacientesController = require(
  "../controllers/pacientes.controller"
);

const {
  validarIdPaciente,
  validarPaciente,
  validarPacienteParcial
} = require(
  "../middlewares/pacientes.validator"
);

const validar = require(
  "../middlewares/validar.middleware"
);

const autenticarJWT = require(
  "../middlewares/auth.middleware"
);

const autorizarRoles = require(
  "../middlewares/roles.middleware"
);

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
 *         usuarioId:
 *           type: integer
 *           nullable: true
 *           example: 2
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
 *         usuarioId:
 *           type: integer
 *           nullable: true
 *           example: 2
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
 *     PacienteActualizacionParcial:
 *       type: object
 *
 *       description:
 *         Permite actualizar uno o varios campos del paciente.
 *
 *       properties:
 *
 *         usuarioId:
 *           type: integer
 *           nullable: true
 *           example: 2
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

/**
 * @openapi
 * /api/pacientes:
 *   get:
 *     tags:
 *       - Pacientes
 *     summary: Obtener todos los pacientes
 *     security:
 *       - ApiKeyAuth: []
 *         BearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de pacientes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Paciente'
 *       401:
 *         description: Credenciales de autenticación ausentes o inválidas
 *       403:
 *         description: Usuario sin permisos para realizar la operación
 */
router.get(
  "/",
  autenticarJWT,
  autorizarRoles("administrador", "medico"),
  pacientesController.obtenerPacientes
);

/**
 * @openapi
 * /api/pacientes/{id}:
 *   get:
 *     tags:
 *       - Pacientes
 *     summary: Obtener paciente por ID
 *     security:
 *       - ApiKeyAuth: []
 *         BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Identificador único del paciente
 *     responses:
 *       200:
 *         description: Paciente encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Paciente'
 *       400:
 *         description: ID inválido
 *       401:
 *         description: Credenciales de autenticación ausentes o inválidas
 *       403:
 *         description: Usuario sin permisos para realizar la operación
 *       404:
 *         description: Paciente no encontrado
 */
router.get(
  "/:id",
  autenticarJWT,
  autorizarRoles("administrador", "medico"),
  validarIdPaciente,
  validar,
  pacientesController.obtenerPacientePorId
);

/**
 * @openapi
 * /api/pacientes:
 *   post:
 *     tags:
 *       - Pacientes
 *     summary: Crear un paciente
 *     description: >
 *       Crea un nuevo paciente utilizando únicamente
 *       los campos permitidos por la API.
 *     security:
 *       - ApiKeyAuth: []
 *         BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PacienteEntrada'
 *     responses:
 *       201:
 *         description: Paciente creado correctamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Credenciales de autenticación ausentes o inválidas
 *       403:
 *         description: Usuario sin permisos para realizar la operación
 *       409:
 *         description: Conflicto de unicidad o rol de usuario incorrecto
 */
router.post(
  "/",
  autenticarJWT,
  autorizarRoles("administrador"),
  validarPaciente,
  validar,
  pacientesController.crearPaciente
);

/**
 * @openapi
 * /api/pacientes/{id}:
 *   put:
 *     tags:
 *       - Pacientes
 *     summary: Actualizar completamente un paciente
 *     description: Actualiza todos los campos editables del paciente.
 *     security:
 *       - ApiKeyAuth: []
 *         BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Identificador del paciente
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PacienteEntrada'
 *     responses:
 *       200:
 *         description: Paciente actualizado correctamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Credenciales de autenticación ausentes o inválidas
 *       403:
 *         description: Usuario sin permisos para realizar la operación
 *       404:
 *         description: Paciente no encontrado
 *       409:
 *         description: Conflicto de unicidad o rol de usuario incorrecto
 */
router.put(
  "/:id",
  autenticarJWT,
  autorizarRoles("administrador"),
  validarIdPaciente,
  validarPaciente,
  validar,
  pacientesController.actualizarPaciente
);

/**
 * @openapi
 * /api/pacientes/{id}:
 *   patch:
 *     tags:
 *       - Pacientes
 *     summary: Actualizar parcialmente un paciente
 *     description: >
 *       Permite actualizar uno o varios campos del paciente
 *       sin necesidad de enviar el recurso completo.
 *     security:
 *       - ApiKeyAuth: []
 *         BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Identificador del paciente
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PacienteActualizacionParcial'
 *     responses:
 *       200:
 *         description: Paciente actualizado parcialmente
 *       400:
 *         description: Datos inválidos o no se enviaron campos válidos
 *       401:
 *         description: Credenciales de autenticación ausentes o inválidas
 *       403:
 *         description: Usuario sin permisos para realizar la operación
 *       404:
 *         description: Paciente no encontrado
 *       409:
 *         description: Conflicto de unicidad o rol de usuario incorrecto
 */
router.patch(
  "/:id",
  autenticarJWT,
  autorizarRoles("administrador"),
  validarIdPaciente,
  validarPacienteParcial,
  validar,
  pacientesController.actualizarPacienteParcial
);

/**
 * @openapi
 * /api/pacientes/{id}:
 *   delete:
 *     tags:
 *       - Pacientes
 *     summary: Eliminar paciente
 *     security:
 *       - ApiKeyAuth: []
 *         BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Identificador del paciente
 *     responses:
 *       200:
 *         description: Paciente eliminado correctamente
 *       400:
 *         description: ID inválido
 *       401:
 *         description: Credenciales de autenticación ausentes o inválidas
 *       403:
 *         description: Usuario sin permisos para realizar la operación
 *       404:
 *         description: Paciente no encontrado
 *       409:
 *         description: No se puede eliminar el paciente porque tiene citas asociadas
 */
router.delete(
  "/:id",
  autenticarJWT,
  autorizarRoles("administrador"),
  validarIdPaciente,
  validar,
  pacientesController.eliminarPaciente
);

module.exports = router;