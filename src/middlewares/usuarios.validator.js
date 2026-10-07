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
    .withMessage("El nombre debe tener entre 3 y 100 caracteres"),

  body("email")
    .isEmail()
    .withMessage("Debe proporcionar un correo electrónico válido")
    .normalizeEmail(),

  body("password")
    .isString()
    .withMessage("La contraseña debe ser texto")
    .isLength({
      min: 10,
      max: 72
    })
    .withMessage("La contraseña debe tener entre 10 y 72 caracteres"),

  body("rol")
    .isIn(["medico", "administrador"])
    .withMessage("El rol debe ser medico o administrador")
];

module.exports = {
  validarCreacionUsuario
};
