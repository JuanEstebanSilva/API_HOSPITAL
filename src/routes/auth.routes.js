const express = require("express");
const {
  registrar,
  login
} = require("../controllers/auth.controller");
const {
  validarRegistro,
  validarLogin
} = require("../middlewares/auth.validator");
const validar = require("../middlewares/validar.middleware");
const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     RegistroUsuario:
 *       type: object
 *       required:
 *         - nombre
 *         - email
 *         - password
 *         - rol
 *       properties:
 *         nombre:
 *           type: string
 *           example: Administrador Hospital
 *         email:
 *           type: string
 *           format: email
 *           example: admin@hospital.com
 *         password:
 *           type: string
 *           format: password
 *           example: ClaveSegura2026!
 *         rol:
 *           type: string
 *           enum:
 *             - administrador
 *             - medico
 *             - paciente
 *           example: administrador
 *
 *     LoginUsuario:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: admin@hospital.com
 *         password:
 *           type: string
 *           format: password
 *           example: ClaveSegura2026!
 */

/**
 * @swagger
 * /api/auth/registro:
 *   post:
 *     tags:
 *       - Autenticación
 *     summary: Registrar un usuario
 *     description: Registra un usuario almacenando su contraseña mediante bcrypt.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegistroUsuario'
 *     responses:
 *       201:
 *         description: Usuario registrado correctamente
 *       400:
 *         description: Datos inválidos
 *       409:
 *         description: Correo electrónico ya registrado
 */
router.post(
  "/registro",
  validarRegistro,
  validar,
  registrar
);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags:
 *       - Autenticación
 *     summary: Iniciar sesión
 *     description: Verifica email y contraseña. En este bloque todavía no genera JWT.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginUsuario'
 *     responses:
 *       200:
 *         description: Credenciales correctas
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Credenciales inválidas
 *       403:
 *         description: Usuario deshabilitado
 */
router.post(
  "/login",
  validarLogin,
  validar,
  login
);

module.exports = router;