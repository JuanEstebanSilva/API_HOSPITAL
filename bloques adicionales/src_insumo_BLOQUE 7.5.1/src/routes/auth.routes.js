const express = require("express");

const { registrar, login } = require("../controllers/auth.controller");

const {
  validarRegistro,
  validarLogin,
} = require("../middlewares/auth.validator");

const validar = require("../middlewares/validar.middleware");

// Middleware para validar JWT
const autenticarJWT = require("../middlewares/auth.middleware");

const router = express.Router();

// ========================================
// SCHEMAS DE AUTENTICACIÓN
// ========================================

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
 *       properties:
 *         nombre:
 *           type: string
 *           example: Paciente Hospital
 *         email:
 *           type: string
 *           format: email
 *           example: paciente@hospital.com
 *         password:
 *           type: string
 *           format: password
 *           example: ClaveSegura2026!
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
 *           example: paciente@hospital.com
 *         password:
 *           type: string
 *           format: password
 *           example: ClaveSegura2026!
 */

// ========================================
// REGISTRO DE USUARIO
// ========================================

/**
 * @swagger
 * /api/auth/registro:
 *   post:
 *     tags:
 *       - Autenticación
 *     summary: Registrar un nuevo usuario
 *     description: >
 *       Registra un nuevo usuario utilizando bcrypt para proteger
 *       la contraseña. El rol es asignado por el servidor y no puede
 *       ser definido por el cliente.
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
router.post("/registro", validarRegistro, validar, registrar);

// ========================================
// INICIO DE SESIÓN
// ========================================

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags:
 *       - Autenticación
 *     summary: Iniciar sesión
 *     description: >
 *       Verifica el email y la contraseña del usuario.
 *       Si las credenciales son correctas, genera un JWT
 *       que puede utilizarse para acceder a rutas protegidas.
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
router.post("/login", validarLogin, validar, login);

// ========================================
// PERFIL DEL USUARIO AUTENTICADO
// ========================================

/**
 * @swagger
 * /api/auth/perfil:
 *   get:
 *     tags:
 *       - Autenticación
 *     summary: Obtener perfil del usuario autenticado
 *     description: Requiere API Key y un JWT válido.
 *     security:
 *       - ApiKeyAuth: []
 *         BearerAuth: []
 *     responses:
 *       200:
 *         description: Usuario autenticado correctamente
 *       401:
 *         description: Credenciales de autenticación ausentes o inválidas
 */
router.get(
  "/perfil",
  autenticarJWT,
  (req, res) => {
    return res.status(200).json({
      mensaje: "Usuario autenticado mediante JWT",

      usuario: req.usuario,

      clienteApi: req.clienteApi,
    });
  }
);

module.exports = router;
