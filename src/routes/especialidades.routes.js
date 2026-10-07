const express = require("express");

const router = express.Router();

const especialidadesController = require(
  "../controllers/especialidades.controller"
);

const {
  validarIdEspecialidad,
  validarEspecialidad,
  validarEspecialidadParcial
} = require(
  "../middlewares/especialidades.validator"
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
 *     Especialidad:
 *       type: object
 *       properties:
 *
 *         id:
 *           type: integer
 *           example: 1
 *
 *         nombre:
 *           type: string
 *           example: Cardiología
 *
 *         descripcion:
 *           type: string
 *           example: Diagnóstico y tratamiento de enfermedades cardiovasculares
 *
 *         activa:
 *           type: boolean
 *           example: true
 *
 *     EspecialidadEntrada:
 *       type: object
 *
 *       required:
 *         - nombre
 *         - descripcion
 *         - activa
 *
 *       properties:
 *
 *         nombre:
 *           type: string
 *           minLength: 3
 *           maxLength: 100
 *           example: Neurología
 *
 *         descripcion:
 *           type: string
 *           minLength: 5
 *           maxLength: 300
 *           example: Diagnóstico y tratamiento de enfermedades del sistema nervioso
 *
 *         activa:
 *           type: boolean
 *           example: true
 *
 *     EspecialidadParcial:
 *       type: object
 *
 *       properties:
 *
 *         nombre:
 *           type: string
 *           minLength: 3
 *           maxLength: 100
 *           example: Neurología Clínica
 *
 *         descripcion:
 *           type: string
 *           minLength: 5
 *           maxLength: 300
 *           example: Atención especializada en enfermedades neurológicas
 *
 *         activa:
 *           type: boolean
 *           example: false
 */

/**
 * @openapi
 * /api/especialidades:
 *   get:
 *     tags:
 *       - Especialidades
 *     summary: Obtener todas las especialidades
 *     security:
 *       - ApiKeyAuth: []
 *         BearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de especialidades
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Especialidad'
 *       401:
 *         description: Credenciales de autenticación ausentes o inválidas
 *       403:
 *         description: Usuario sin permisos para realizar la operación
 */
router.get(
  "/",
  autenticarJWT,
  autorizarRoles("administrador", "medico", "paciente"),
  especialidadesController.obtenerEspecialidades
);

/**
 * @openapi
 * /api/especialidades/{id}:
 *   get:
 *     tags:
 *       - Especialidades
 *     summary: Obtener especialidad por ID
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
 *         description: Especialidad encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Especialidad'
 *       400:
 *         description: ID inválido
 *       401:
 *         description: Credenciales de autenticación ausentes o inválidas
 *       403:
 *         description: Usuario sin permisos para realizar la operación
 *       404:
 *         description: Especialidad no encontrada
 */
router.get(
  "/:id",
  autenticarJWT,
  autorizarRoles("administrador", "medico", "paciente"),
  validarIdEspecialidad,
  validar,
  especialidadesController.obtenerEspecialidadPorId
);

/**
 * @openapi
 * /api/especialidades:
 *   post:
 *     tags:
 *       - Especialidades
 *     summary: Crear una especialidad
 *     security:
 *       - ApiKeyAuth: []
 *         BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EspecialidadEntrada'
 *     responses:
 *       201:
 *         description: Especialidad creada correctamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Credenciales de autenticación ausentes o inválidas
 *       403:
 *         description: Usuario sin permisos para realizar la operación
 *       409:
 *         description: Ya existe una especialidad con ese nombre
 */
router.post(
  "/",
  autenticarJWT,
  autorizarRoles("administrador"),
  validarEspecialidad,
  validar,
  especialidadesController.crearEspecialidad
);

/**
 * @openapi
 * /api/especialidades/{id}:
 *   put:
 *     tags:
 *       - Especialidades
 *     summary: Actualizar completamente una especialidad
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
 *             $ref: '#/components/schemas/EspecialidadEntrada'
 *     responses:
 *       200:
 *         description: Especialidad actualizada
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Credenciales de autenticación ausentes o inválidas
 *       403:
 *         description: Usuario sin permisos para realizar la operación
 *       404:
 *         description: Especialidad no encontrada
 *       409:
 *         description: Nombre duplicado
 */
router.put(
  "/:id",
  autenticarJWT,
  autorizarRoles("administrador"),
  validarIdEspecialidad,
  validarEspecialidad,
  validar,
  especialidadesController.actualizarEspecialidad
);

/**
 * @openapi
 * /api/especialidades/{id}:
 *   patch:
 *     tags:
 *       - Especialidades
 *     summary: Actualizar parcialmente una especialidad
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
 *             $ref: '#/components/schemas/EspecialidadParcial'
 *     responses:
 *       200:
 *         description: Especialidad actualizada parcialmente
 *       400:
 *         description: Datos inválidos o cuerpo vacío
 *       401:
 *         description: Credenciales de autenticación ausentes o inválidas
 *       403:
 *         description: Usuario sin permisos para realizar la operación
 *       404:
 *         description: Especialidad no encontrada
 *       409:
 *         description: Nombre duplicado
 */
router.patch(
  "/:id",
  autenticarJWT,
  autorizarRoles("administrador"),
  validarIdEspecialidad,
  validarEspecialidadParcial,
  validar,
  especialidadesController.actualizarEspecialidadParcial
);

/**
 * @openapi
 * /api/especialidades/{id}:
 *   delete:
 *     tags:
 *       - Especialidades
 *     summary: Eliminar una especialidad
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
 *         description: Especialidad eliminada
 *       400:
 *         description: ID inválido
 *       401:
 *         description: Credenciales de autenticación ausentes o inválidas
 *       403:
 *         description: Usuario sin permisos para realizar la operación
 *       404:
 *         description: Especialidad no encontrada
 */
router.delete(
  "/:id",
  autenticarJWT,
  autorizarRoles("administrador"),
  validarIdEspecialidad,
  validar,
  especialidadesController.eliminarEspecialidad
);

module.exports = router;