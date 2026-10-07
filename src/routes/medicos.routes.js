const express = require("express");

const router = express.Router();

const medicosController = require(
  "../controllers/medicos.controller"
);

const {
  validarIdMedico,
  validarIdEspecialidad,
  validarMedico,
  validarMedicoParcial
} = require(
  "../middlewares/medicos.validator"
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
 *     Medico:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         usuarioId:
 *           type: integer
 *           nullable: true
 *           example: 2
 *         nombre:
 *           type: string
 *           example: Carlos Rodríguez
 *         registroMedico:
 *           type: string
 *           example: RM-45871
 *         email:
 *           type: string
 *           format: email
 *           example: carlos.rodriguez@hospital.com
 *         telefono:
 *           type: string
 *           example: "3101234567"
 *         especialidadId:
 *           type: integer
 *           example: 2
 *         activo:
 *           type: boolean
 *           example: true
 *
 *     MedicoEntrada:
 *       type: object
 *       required:
 *         - nombre
 *         - registroMedico
 *         - email
 *         - telefono
 *         - especialidadId
 *         - activo
 *       properties:
 *         usuarioId:
 *           type: integer
 *           nullable: true
 *           example: 2
 *         nombre:
 *           type: string
 *           minLength: 3
 *           maxLength: 100
 *           example: Pedro Martínez
 *         registroMedico:
 *           type: string
 *           example: RM-98765
 *         email:
 *           type: string
 *           format: email
 *           example: pedro.martinez@hospital.com
 *         telefono:
 *           type: string
 *           example: "3114567890"
 *         especialidadId:
 *           type: integer
 *           minimum: 1
 *           example: 2
 *         activo:
 *           type: boolean
 *           example: true
 *
 *     MedicoParcial:
 *       type: object
 *       properties:
 *         usuarioId:
 *           type: integer
 *           nullable: true
 *           example: 2
 *         nombre:
 *           type: string
 *           example: Pedro Martínez Gómez
 *         registroMedico:
 *           type: string
 *           example: RM-98765
 *         email:
 *           type: string
 *           format: email
 *           example: pedro.nuevo@hospital.com
 *         telefono:
 *           type: string
 *           example: "3201112233"
 *         especialidadId:
 *           type: integer
 *           minimum: 1
 *           example: 3
 *         activo:
 *           type: boolean
 *           example: false
 */

/**
 * @openapi
 * /api/medicos:
 *   get:
 *     tags:
 *       - Médicos
 *     summary: Obtener todos los médicos
 *     security:
 *       - ApiKeyAuth: []
 *         BearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de médicos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Medico'
 *       401:
 *         description: Credenciales de autenticación ausentes o inválidas
 *       403:
 *         description: Usuario sin permisos para realizar la operación
 */
router.get(
  "/",
  autenticarJWT,
  autorizarRoles("administrador", "medico", "paciente"),
  medicosController.obtenerMedicos
);

/**
 * @openapi
 * /api/medicos/especialidad/{especialidadId}:
 *   get:
 *     tags:
 *       - Médicos
 *     summary: Obtener médicos por especialidad
 *     security:
 *       - ApiKeyAuth: []
 *         BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: especialidadId
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *     responses:
 *       200:
 *         description: Lista de médicos pertenecientes a la especialidad
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Medico'
 *       400:
 *         description: ID de especialidad inválido
 *       401:
 *         description: Credenciales de autenticación ausentes o inválidas
 *       403:
 *         description: Usuario sin permisos para realizar la operación
 *       404:
 *         description: Especialidad no encontrada
 */
router.get(
  "/especialidad/:especialidadId",
  autenticarJWT,
  autorizarRoles("administrador", "medico", "paciente"),
  validarIdEspecialidad,
  validar,
  medicosController.obtenerMedicosPorEspecialidad
);

/**
 * @openapi
 * /api/medicos/{id}:
 *   get:
 *     tags:
 *       - Médicos
 *     summary: Obtener un médico por ID
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
 *     responses:
 *       200:
 *         description: Médico encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Medico'
 *       400:
 *         description: ID inválido
 *       401:
 *         description: Credenciales de autenticación ausentes o inválidas
 *       403:
 *         description: Usuario sin permisos para realizar la operación
 *       404:
 *         description: Médico no encontrado
 */
router.get(
  "/:id",
  autenticarJWT,
  autorizarRoles("administrador", "medico", "paciente"),
  validarIdMedico,
  validar,
  medicosController.obtenerMedicoPorId
);

/**
 * @openapi
 * /api/medicos:
 *   post:
 *     tags:
 *       - Médicos
 *     summary: Crear un médico
 *     security:
 *       - ApiKeyAuth: []
 *         BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MedicoEntrada'
 *     responses:
 *       201:
 *         description: Médico creado correctamente
 *       400:
 *         description: Datos inválidos o especialidad inexistente
 *       401:
 *         description: Credenciales de autenticación ausentes o inválidas
 *       403:
 *         description: Usuario sin permisos para realizar la operación
 *       409:
 *         description: Conflicto con registro, correo, rol de usuario o especialidad
 */
router.post(
  "/",
  autenticarJWT,
  autorizarRoles("administrador"),
  validarMedico,
  validar,
  medicosController.crearMedico
);

/**
 * @openapi
 * /api/medicos/{id}:
 *   put:
 *     tags:
 *       - Médicos
 *     summary: Actualizar completamente un médico
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MedicoEntrada'
 *     responses:
 *       200:
 *         description: Médico actualizado correctamente
 *       400:
 *         description: Datos inválidos o especialidad inexistente
 *       401:
 *         description: Credenciales de autenticación ausentes o inválidas
 *       403:
 *         description: Usuario sin permisos para realizar la operación
 *       404:
 *         description: Médico no encontrado
 *       409:
 *         description: Conflicto con registro, correo, rol de usuario o especialidad
 */
router.put(
  "/:id",
  autenticarJWT,
  autorizarRoles("administrador"),
  validarIdMedico,
  validarMedico,
  validar,
  medicosController.actualizarMedico
);

/**
 * @openapi
 * /api/medicos/{id}:
 *   patch:
 *     tags:
 *       - Médicos
 *     summary: Actualizar parcialmente un médico
 *     description: Permite modificar uno o varios campos sin reemplazar el recurso completo.
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MedicoParcial'
 *     responses:
 *       200:
 *         description: Médico actualizado parcialmente
 *       400:
 *         description: Datos inválidos, cuerpo vacío o especialidad inexistente
 *       401:
 *         description: Credenciales de autenticación ausentes o inválidas
 *       403:
 *         description: Usuario sin permisos para realizar la operación
 *       404:
 *         description: Médico no encontrado
 *       409:
 *         description: Conflicto con registro, correo, rol de usuario o especialidad
 */
router.patch(
  "/:id",
  autenticarJWT,
  autorizarRoles("administrador"),
  validarIdMedico,
  validarMedicoParcial,
  validar,
  medicosController.actualizarMedicoParcial
);

/**
 * @openapi
 * /api/medicos/{id}:
 *   delete:
 *     tags:
 *       - Médicos
 *     summary: Eliminar un médico
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
 *     responses:
 *       200:
 *         description: Médico eliminado correctamente
 *       400:
 *         description: ID inválido
 *       401:
 *         description: Credenciales de autenticación ausentes o inválidas
 *       403:
 *         description: Usuario sin permisos para realizar la operación
 *       404:
 *         description: Médico no encontrado
 *       409:
 *         description: No se puede eliminar el médico porque tiene citas asociadas
 */
router.delete(
  "/:id",
  autenticarJWT,
  autorizarRoles("administrador"),
  validarIdMedico,
  validar,
  medicosController.eliminarMedico
);

module.exports = router;