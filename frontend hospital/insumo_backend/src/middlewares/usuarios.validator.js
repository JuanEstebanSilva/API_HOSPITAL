const { body } = require("express-validator");

// ========================================
// Crear usuario desde administración
// ========================================
const validarCreacionUsuario = [
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
      min: 12,
      max: 72
    })
    .withMessage(
      "La contraseña debe tener entre 12 y 72 caracteres"
    ),

  body("rol")
    .isIn([
      "medico",
      "administrador"
    ])
    .withMessage(
      "El rol debe ser medico o administrador"
    )
];

// Editar exclusivamente nombre y correo; no permitir cambios de rol o contraseña.
const validarEdicionUsuario = [
  body("nombre")
    .isString().withMessage("El nombre debe ser texto")
    .trim().isLength({ min: 3, max: 100 })
    .withMessage("El nombre debe tener entre 3 y 100 caracteres"),
  body("email")
    .isEmail().withMessage("Debe proporcionar un correo electrónico válido")
    .normalizeEmail()
];

// El estado debe ser un booleano JSON real: true o false.
const validarEstadoUsuario = [
  body("activo")
    .isBoolean({ strict: true })
    .withMessage("activo debe ser true o false (booleano)")
];

module.exports = {
  validarCreacionUsuario,
  validarEdicionUsuario,
  validarEstadoUsuario
};