const express = require("express");

const {
  crearUsuario,
  buscarUsuariosRecuperacion,
  actualizarUsuario,
  cambiarEstadoUsuario
} = require(
  "../controllers/usuarios.controller"
);

const {
  validarCreacionUsuario,
  validarEdicionUsuario,
  validarEstadoUsuario
} = require(
  "../middlewares/usuarios.validator"
);

const validar =
  require(
    "../middlewares/validar.middleware"
  );

const autenticarJWT =
  require(
    "../middlewares/auth.middleware"
  );

const autorizarRoles =
  require(
    "../middlewares/roles.middleware"
  );

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     UsuarioAdministrativoEntrada:
 *       type: object
 *       required:
 *         - nombre
 *         - email
 *         - password
 *         - rol
 *       properties:
 *         nombre:
 *           type: string
 *           example: Médico Hospital
 *         email:
 *           type: string
 *           format: email
 *           example: medico@hospital.com
 *         password:
 *           type: string
 *           format: password
 *           example: ClaveSegura2026!
 *         rol:
 *           type: string
 *           enum:
 *             - medico
 *             - administrador
 *           example: medico
 */

/**
 * @swagger
 * /api/usuarios:
 *   post:
 *     tags:
 *       - Usuarios
 *     summary: Crear usuario privilegiado
 *     description: >
 *       Permite a un administrador autenticado crear
 *       usuarios con rol medico o administrador.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UsuarioAdministrativoEntrada'
 *     responses:
 *       201:
 *         description: Usuario creado correctamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Usuario no autenticado
 *       403:
 *         description: Usuario sin permisos
 *       409:
 *         description: Correo electrónico ya registrado
 */
/**
 * @swagger
 * /api/usuarios/busqueda-recuperacion:
 *   get:
 *     tags: [Usuarios]
 *     summary: Buscar usuarios activos para recuperación administrativa
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *     responses:
 *       200:
 *         description: Usuarios coincidentes (sin credenciales)
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Sin rol administrador
 */
/**
 * @swagger
 * /api/usuarios:
 *   get:
 *     tags: [Usuarios]
 *     summary: Listar usuarios (administrador)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema: { type: string }
 *       - in: query
 *         name: rol
 *         schema: { type: string, enum: [administrador, medico, paciente] }
 *       - in: query
 *         name: activo
 *         schema: { type: string, enum: [true, false] }
 *     responses:
 *       200: { description: Usuarios sin credenciales }
 *       401: { description: No autenticado }
 *       403: { description: Sin permisos }
 */

/**
 * @swagger
 * /api/usuarios/cuentas-vinculadas-medicos:
 *   get:
 *     tags: [Usuarios]
 *     summary: Consultar cuentas asociadas a fichas médicas (administrador)
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200: { description: Cuentas vinculadas sin información sensible }
 *       401: { description: No autenticado }
 *       403: { description: Sin permisos }
 */
router.get(
  "/cuentas-vinculadas-medicos",
  autenticarJWT,
  autorizarRoles("administrador"),
  async (req, res, next) => {
    try {
      const { consultar } = require("../config/database");
      const resultado = await consultar(`
        SELECT u.id, u.nombre, u.email, u.activo, r.nombre AS rol
        FROM public.usuarios u
        JOIN public.medicos m ON m.usuario_id = u.id
        JOIN public.roles r ON r.id = u.rol_id
        ORDER BY u.nombre, u.id
      `);
      res.set("Cache-Control", "no-store");
      return res.status(200).json({ cuentas: resultado.rows });
    } catch (error) {
      return next(error);
    }
  }
);

/**
 * LAB 12.6.3.1: identidad de las cuentas asociadas a fichas de pacientes.
 * Solo administradores; nunca se devuelven hashes ni credenciales.
 */
router.get(
  "/cuentas-vinculadas-pacientes",
  autenticarJWT,
  autorizarRoles("administrador"),
  async (req, res, next) => {
    try {
      const { consultar } = require("../config/database");
      const resultado = await consultar(`
        SELECT u.id, u.nombre, u.email, u.activo, r.nombre AS rol
        FROM public.usuarios u
        JOIN public.pacientes p ON p.usuario_id = u.id
        JOIN public.roles r ON r.id = u.rol_id
        ORDER BY u.nombre, u.id
      `);
      res.set("Cache-Control", "no-store");
      return res.status(200).json({ cuentas: resultado.rows });
    } catch (error) {
      return next(error);
    }
  }
);

router.get("/", autenticarJWT, autorizarRoles("administrador"), require("../controllers/usuarios.controller").listarUsuarios);

router.get(
  "/busqueda-recuperacion",
  autenticarJWT,
  autorizarRoles("administrador"),
  buscarUsuariosRecuperacion
);

router.post(
  "/",
  autenticarJWT,
  autorizarRoles("administrador"),
  validarCreacionUsuario,
  validar,
  crearUsuario
);

router.patch("/:id/estado", autenticarJWT, autorizarRoles("administrador"), validarEstadoUsuario, validar, cambiarEstadoUsuario);
router.put("/:id", autenticarJWT, autorizarRoles("administrador"), validarEdicionUsuario, validar, actualizarUsuario);

module.exports = router;