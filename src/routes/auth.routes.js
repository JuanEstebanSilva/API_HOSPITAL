const express = require("express");

const {
  registrar,
  login,
  cambiarPassword,
  generarRecuperacionAdmin,
  restablecerPassword,
  generarCodigos,
  estadoCodigos,
  restablecerConCodigo,
} = require("../controllers/auth.controller");

const {
  validarRegistro,
  validarLogin,
  validarCambioPassword,
  validarGenerarRecuperacion,
  validarRestablecimiento,
  validarGenerarCodigos,
  validarRestablecerConCodigo,
} = require("../middlewares/auth.validator");

const validar = require("../middlewares/validar.middleware");

// Middleware para validar JWT
const autenticarJWT = require("../middlewares/auth.middleware");

const autorizarRoles = require("../middlewares/roles.middleware");
const { rateLimit } = require("express-rate-limit");
const limiteReset = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false,
});
const router = express.Router();

// Límite de intentos de inicio de sesión
const limiteLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  // Solo los rechazos de credenciales consumen intentos.
  // No penalizar accesos válidos ni errores de Supabase (503).
  skipSuccessfulRequests: true,
  requestWasSuccessful: (_req, res) => res.statusCode !== 401,
  message: {
    mensaje: "Demasiados intentos fallidos. Espere antes de volver a intentar.",
  },
});

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
 *     security:
 *       - ApiKeyAuth: []
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
 *     security: []
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
router.post("/login", limiteLogin, validarLogin, validar, login);
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
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Usuario autenticado correctamente
 *       401:
 *         description: Credenciales de autenticación ausentes o inválidas
 */
router.get("/perfil", autenticarJWT, (req, res) => {
  return res.status(200).json({
    mensaje: "Usuario autenticado mediante JWT",

    usuario: req.usuario,

    clienteApi: req.clienteApi,
  });
});

/**
 * @swagger
 * /api/auth/cambiar-password:
 *   patch:
 *     tags: [Autenticación]
 *     summary: Cambiar la contraseña propia y revocar JWT anteriores
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [passwordActual, passwordNueva, confirmarPassword]
 *             properties:
 *               passwordActual:
 *                 type: string
 *                 format: password
 *               passwordNueva:
 *                 type: string
 *                 format: password
 *               confirmarPassword:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Contraseña cambiada y tokens anteriores revocados
 *       400:
 *         description: Datos inválidos o contraseña reutilizada
 *       401:
 *         description: JWT inválido o contraseña actual incorrecta
 *       409:
 *         description: Cambio concurrente de contraseña
 */
router.patch(
  "/cambiar-password",
  autenticarJWT,
  validarCambioPassword,
  validar,
  cambiarPassword,
);

/**
 * @swagger
 * /api/auth/recuperacion/admin/{usuarioId}:
 *   post:
 *     tags: [Autenticación]
 *     summary: Administrador autoriza recuperación y emite token de un solo uso
 *     description: Verificar previamente la identidad por un procedimiento externo autorizado. El token solo se devuelve una vez.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: usuarioId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       201:
 *         description: Token temporal generado
 *       401:
 *         description: JWT ausente o inválido
 *       403:
 *         description: Rol no autorizado
 *       404:
 *         description: Usuario inexistente o inactivo
 */
router.post(
  "/recuperacion/admin/:usuarioId",
  autenticarJWT,
  autorizarRoles("administrador"),
  limiteReset,
  validarGenerarRecuperacion,
  validar,
  generarRecuperacionAdmin,
);

/**
 * @swagger
 * /api/auth/restablecer-password:
 *   post:
 *     tags: [Autenticación]
 *     summary: Restablecer contraseña usando token temporal
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, passwordNueva, confirmarPassword]
 *             properties:
 *               token:
 *                 type: string
 *               passwordNueva:
 *                 type: string
 *                 format: password
 *               confirmarPassword:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Contraseña restablecida y sesiones previas revocadas
 *       400:
 *         description: Token inválido o datos incorrectos
 *       429:
 *         description: Demasiados intentos
 */
router.post(
  "/restablecer-password",
  limiteReset,
  validarRestablecimiento,
  validar,
  restablecerPassword,
);

/**
 * @swagger
 * /api/auth/codigos-recuperacion:
 *   post:
 *     tags: [Autenticación]
 *     summary: Generar ocho códigos de respaldo (invalida códigos anteriores)
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [passwordActual]
 *             properties:
 *               passwordActual:
 *                 type: string
 *                 format: password
 *     responses:
 *       201:
 *         description: Ocho códigos visibles una sola vez
 *       401:
 *         description: JWT o contraseña actual inválidos
 */
router.post(
  "/codigos-recuperacion",
  autenticarJWT,
  limiteReset,
  validarGenerarCodigos,
  validar,
  generarCodigos,
);
/**
 * @swagger
 * /api/auth/codigos-recuperacion/estado:
 *   get:
 *     tags: [Autenticación]
 *     summary: Consultar cantidad de códigos de respaldo disponibles
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Cantidad disponible
 */
router.get("/codigos-recuperacion/estado", autenticarJWT, estadoCodigos);
/**
 * @swagger
 * /api/auth/codigos-recuperacion/regenerar:
 *   post:
 *     tags: [Autenticación]
 *     summary: Revocar códigos anteriores y generar ocho nuevos
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [passwordActual]
 *             properties:
 *               passwordActual:
 *                 type: string
 *                 format: password
 *     responses:
 *       201:
 *         description: Nuevos códigos generados
 */
router.post(
  "/codigos-recuperacion/regenerar",
  autenticarJWT,
  limiteReset,
  validarGenerarCodigos,
  validar,
  generarCodigos,
);
/**
 * @swagger
 * /api/auth/restablecer-con-codigo:
 *   post:
 *     tags: [Autenticación]
 *     summary: Recuperar contraseña con un código de respaldo de un solo uso
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, codigo, passwordNueva, confirmarPassword]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               codigo:
 *                 type: string
 *               passwordNueva:
 *                 type: string
 *                 format: password
 *               confirmarPassword:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Contraseña restablecida
 *       400:
 *         description: Código o datos inválidos
 *       429:
 *         description: Demasiados intentos
 */
router.post(
  "/restablecer-con-codigo",
  limiteReset,
  validarRestablecerConCodigo,
  validar,
  restablecerConCodigo,
);
module.exports = router;
