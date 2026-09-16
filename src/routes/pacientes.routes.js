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
 */
router.get(
  "/",
  pacientesController.obtenerPacientes
);

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
 *       404:
 *         description:
 *           Paciente no encontrado
 */
router.get(
  "/:id",

  validarIdPaciente,

  validar,

  pacientesController.obtenerPacientePorId
);

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
 *       409:
 *         description:
 *           Ya existe un paciente con ese documento
 */
router.post(
  "/",

  validarPaciente,

  validar,

  pacientesController.crearPaciente
);

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

  validarIdPaciente,

  validarPaciente,

  validar,

  pacientesController.actualizarPaciente
);

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

  validarIdPaciente,

  validarPacienteParcial,

  validar,

  pacientesController.actualizarPacienteParcial
);

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
 *       404:
 *         description:
 *           Paciente no encontrado
 */
router.delete(
  "/:id",

  validarIdPaciente,

  validar,

  pacientesController.eliminarPaciente
);

module.exports = router;