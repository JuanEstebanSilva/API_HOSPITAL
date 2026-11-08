const { body, param } = require("express-validator");

// ========================================
// Registro
// ========================================
const validarRegistro = [
  body("nombre")
    .isString()
    .withMessage("El nombre debe ser texto")
    .trim()
    .isLength({
      min: 3,
      max: 100
    })
    .withMessage(
      "El nombre debe tener entre 3 y 100 caracteres"
    ),

  body("email")
    .isEmail()
    .withMessage(
      "Debe proporcionar un correo electrónico válido"
    )
    .normalizeEmail(),

  body("password")
    .isString()
    .withMessage(
      "La contraseña debe ser texto"
    )
    .isLength({
      min: 10,
      max: 72
    })
    .withMessage(
      "La contraseña debe tener entre 10 y 72 caracteres"
    )
];

// ========================================
// Login
// ========================================
const validarLogin = [
  body("email")
    .isEmail()
    .withMessage(
      "Debe proporcionar un correo electrónico válido"
    )
    .normalizeEmail(),

  body("password")
    .isString()
    .withMessage(
      "La contraseña debe ser texto"
    )
    .notEmpty()
    .withMessage(
      "La contraseña es obligatoria"
    )
];

const validarGenerarRecuperacion = [
  param('usuarioId').isInt({ min: 1 }).withMessage('ID de usuario inválido')
];
const validarRestablecimiento = [
  body('token').isString().matches(/^[a-f0-9]{64}$/i).withMessage('Token inválido'),
  body('passwordNueva').isString().isLength({ min: 12, max: 72 })
    .withMessage('La nueva contraseña debe tener entre 12 y 72 caracteres')
    .custom(v => /[a-z]/.test(v) && /[A-Z]/.test(v) && /[0-9]/.test(v))
    .withMessage('Incluya mayúscula, minúscula y número'),
  body('confirmarPassword').isString()
    .custom((v, { req }) => v === req.body.passwordNueva)
    .withMessage('La confirmación no coincide')
];
const validarCambioPassword = [
  body("passwordActual").isString().notEmpty()
    .withMessage("La contraseña actual es obligatoria"),
  body("passwordNueva").isString().isLength({ min: 12, max: 72 })
    .withMessage("La nueva contraseña debe tener entre 12 y 72 caracteres")
    .custom((v) => {
      if (!/[a-z]/.test(v) || !/[A-Z]/.test(v) || !/[0-9]/.test(v)) {
        throw new Error("Incluya mayúscula, minúscula y número");
      }
      return true;
    }),
  body("confirmarPassword").isString()
    .custom((v, { req }) => v === req.body.passwordNueva)
    .withMessage("La confirmación no coincide")
];

const validarGenerarCodigos = [
  body('passwordActual').isString().notEmpty().withMessage('Contraseña actual obligatoria')
];
const validarRestablecerConCodigo = [
  body('email').isEmail().normalizeEmail().withMessage('Correo inválido'),
  body('codigo').isString().matches(/^[a-fA-F0-9]{4}(?:-[a-fA-F0-9]{4}){7}$/)
    .withMessage('Código inválido'),
  body('passwordNueva').isString().isLength({ min: 12, max: 72 })
    .custom(v => /[a-z]/.test(v) && /[A-Z]/.test(v) && /[0-9]/.test(v))
    .withMessage('Contraseña insegura'),
  body('confirmarPassword').isString()
    .custom((v, { req }) => v === req.body.passwordNueva)
    .withMessage('La confirmación no coincide')
];
module.exports = {
  validarRegistro,
  validarLogin,
  validarCambioPassword,
  validarGenerarRecuperacion,
  validarRestablecimiento, validarGenerarCodigos, validarRestablecerConCodigo
};