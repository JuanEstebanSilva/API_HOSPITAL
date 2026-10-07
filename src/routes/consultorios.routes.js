const express = require("express");

const router = express.Router();

const consultoriosController = require(
  "../controllers/consultorios.controller"
);

const {
  validarIdConsultorio,
  validarConsultorio,
  validarConsultorioParcial
} = require(
  "../middlewares/consultorios.validator"
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
 *     Consultorio:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         codigo:
 *           type: string
 *           example: CONS-101
 *         nombre:
 *           type: string
 *           example: Consultorio 101
 *         piso:
 *           type: integer
 *           example: 1
 *         ubicacion:
 *           type: string
 *           example: Ala Norte
 *         activo:
 *           type: boolean
 *           example: true
 *
 *     ConsultorioEntrada:
 *       type: object
 *       required:
 *         - codigo
 *         - nombre
 *         - piso
 *         - ubicacion
 *         - activo
 *       properties:
 *         codigo:
 *           type: string
 *           pattern: '^CONS-[0-9]{3,4}$'
 *           example: CONS-402
 *         nombre:
 *           type: string
 *           minLength: 3
 *           maxLength: 100
 *           example: Consultorio 402
 *         piso:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           example: 4
 *         ubicacion:
 *           type: string
 *           example: Torre Oriental
 *         activo:
 *           type: boolean
 *           example: true
 *
 *     ConsultorioParcial:
 *       type: object
 *       properties:
 *         codigo:
 *           type: string
 *           pattern: '^CONS-[0-9]{3,4}$'
 *           example: CONS-402
 *         nombre:
 *           type: string
 *           example: Consultorio Cardiología 402
 *         piso:
 *           type: integer
 *           example: 4
 *         ubicacion:
 *           type: string
 *           example: Torre Oriental
 *         activo:
 *           type: boolean
 *           example: false
 */

/**
 * @openapi
 * /api/consultorios:
 *   get:
 *     tags:
 *       - Consultorios
 *     summary: Obtener todos los consultorios
 *     security:
 *       - ApiKeyAuth: []
 *         BearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de consultorios
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Consultorio'
 *       401:
 *         description: Credenciales de autenticación ausentes o inválidas
 *       403:
 *         description: Usuario sin permisos para realizar la operación
 */
router.get(
  "/",
  autenticarJWT,
  autorizarRoles("administrador", "medico", "paciente"),
  consultoriosController.obtenerConsultorios
);

/**
 * @openapi
 * /api/consultorios/{id}:
 *   get:
 *     tags:
 *       - Consultorios
 *     summary: Obtener consultorio por ID
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
 *         description: Consultorio encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Consultorio'
 *       400:
 *         description: ID inválido
 *       401:
 *         description: Credenciales de autenticación ausentes o inválidas
 *       403:
 *         description: Usuario sin permisos para realizar la operación
 *       404:
 *         description: Consultorio no encontrado
 */
router.get(
  "/:id",
  autenticarJWT,
  autorizarRoles("administrador", "medico", "paciente"),
  validarIdConsultorio,
  validar,
  consultoriosController.obtenerConsultorioPorId
);

/**
 * @openapi
 * /api/consultorios:
 *   post:
 *     tags:
 *       - Consultorios
 *     summary: Crear un consultorio
 *     security:
 *       - ApiKeyAuth: []
 *         BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ConsultorioEntrada'
 *     responses:
 *       201:
 *         description: Consultorio creado correctamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Credenciales de autenticación ausentes o inválidas
 *       403:
 *         description: Usuario sin permisos para realizar la operación
 *       409:
 *         description: Código de consultorio duplicado
 */
router.post(
  "/",
  autenticarJWT,
  autorizarRoles("administrador"),
  validarConsultorio,
  validar,
  consultoriosController.crearConsultorio
);

/**
 * @openapi
 * /api/consultorios/{id}:
 *   put:
 *     tags:
 *       - Consultorios
 *     summary: Actualizar completamente un consultorio
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
 *             $ref: '#/components/schemas/ConsultorioEntrada'
 *     responses:
 *       200:
 *         description: Consultorio actualizado
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Credenciales de autenticación ausentes o inválidas
 *       403:
 *         description: Usuario sin permisos para realizar la operación
 *       404:
 *         description: Consultorio no encontrado
 *       409:
 *         description: Código duplicado
 */
router.put(
  "/:id",
  autenticarJWT,
  autorizarRoles("administrador"),
  validarIdConsultorio,
  validarConsultorio,
  validar,
  consultoriosController.actualizarConsultorio
);

/**
 * @openapi
 * /api/consultorios/{id}:
 *   patch:
 *     tags:
 *       - Consultorios
 *     summary: Actualizar parcialmente un consultorio
 *     description: Permite modificar uno o varios campos del consultorio.
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
 *             $ref: '#/components/schemas/ConsultorioParcial'
 *     responses:
 *       200:
 *         description: Consultorio actualizado parcialmente
 *       400:
 *         description: Datos inválidos o cuerpo vacío
 *       401:
 *         description: Credenciales de autenticación ausentes o inválidas
 *       403:
 *         description: Usuario sin permisos para realizar la operación
 *       404:
 *         description: Consultorio no encontrado
 *       409:
 *         description: Código duplicado
 */
router.patch(
  "/:id",
  autenticarJWT,
  autorizarRoles("administrador"),
  validarIdConsultorio,
  validarConsultorioParcial,
  validar,
  consultoriosController.actualizarConsultorioParcial
);

/**
 * @openapi
 * /api/consultorios/{id}:
 *   delete:
 *     tags:
 *       - Consultorios
 *     summary: Eliminar un consultorio
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
 *         description: Consultorio eliminado
 *       400:
 *         description: ID inválido
 *       401:
 *         description: Credenciales de autenticación ausentes o inválidas
 *       403:
 *         description: Usuario sin permisos para realizar la operación
 *       404:
 *         description: Consultorio no encontrado
 */
router.delete(
  "/:id",
  autenticarJWT,
  autorizarRoles("administrador"),
  validarIdConsultorio,
  validar,
  consultoriosController.eliminarConsultorio
);

module.exports = router;