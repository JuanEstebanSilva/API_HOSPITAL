const {
  body,
  param
} = require(
  "express-validator"
);


// ========================================
// Validar ID de paciente
// ========================================

const validarIdPaciente = [
  param("id")
    .isInt({
      min: 1
    })
    .withMessage(
      "El id debe ser un número entero positivo"
    )
];


// ========================================
// POST / PUT
// Validación completa de paciente
// ========================================

const validarPaciente = [

  // ========================================
  // Relación usuario ↔ paciente
  // ========================================

  body("usuarioId")
    .optional({
      nullable: true
    })
    .isInt({
      min: 1
    })
    .withMessage(
      "El usuarioId debe ser un entero positivo"
    )
    .toInt(),

  body("nombre")
    .isString()
    .withMessage(
      "El nombre debe ser texto"
    )
    .trim()
    .notEmpty()
    .withMessage(
      "El nombre es obligatorio"
    )
    .isLength({
      min: 3,
      max: 100
    })
    .withMessage(
      "El nombre debe tener entre 3 y 100 caracteres"
    ),

  body("documento")
    .isString()
    .withMessage(
      "El documento debe ser texto"
    )
    .trim()
    .notEmpty()
    .withMessage(
      "El documento es obligatorio"
    )
    .matches(/^[0-9]{6,15}$/)
    .withMessage(
      "El documento debe contener entre 6 y 15 dígitos"
    ),

  body("email")
    .isEmail()
    .withMessage(
      "El correo electrónico no es válido"
    )
    .normalizeEmail(),

  body("telefono")
    .isString()
    .withMessage(
      "El teléfono debe ser texto"
    )
    .trim()
    .matches(/^[0-9]{7,15}$/)
    .withMessage(
      "El teléfono debe contener entre 7 y 15 dígitos"
    ),

  body("fechaNacimiento")
    .isISO8601({
      strict: true
    })
    .withMessage(
      "La fecha de nacimiento debe tener formato YYYY-MM-DD"
    )
];


// ========================================
// PATCH
// Todos los campos son opcionales
// ========================================

const validarPacienteParcial = [

  // ========================================
  // Relación usuario ↔ paciente
  // ========================================

  body("usuarioId")
    .optional()
    .isInt({
      min: 1
    })
    .withMessage(
      "El usuarioId debe ser un entero positivo"
    )
    .toInt(),

  body("nombre")
    .optional()
    .isString()
    .withMessage(
      "El nombre debe ser texto"
    )
    .trim()
    .notEmpty()
    .withMessage(
      "El nombre no puede estar vacío"
    )
    .isLength({
      min: 3,
      max: 100
    })
    .withMessage(
      "El nombre debe tener entre 3 y 100 caracteres"
    ),

  body("documento")
    .optional()
    .isString()
    .withMessage(
      "El documento debe ser texto"
    )
    .trim()
    .matches(/^[0-9]{6,15}$/)
    .withMessage(
      "El documento debe contener entre 6 y 15 dígitos"
    ),

  body("email")
    .optional()
    .isEmail()
    .withMessage(
      "El correo electrónico no es válido"
    )
    .normalizeEmail(),

  body("telefono")
    .optional()
    .isString()
    .withMessage(
      "El teléfono debe ser texto"
    )
    .trim()
    .matches(/^[0-9]{7,15}$/)
    .withMessage(
      "El teléfono debe contener entre 7 y 15 dígitos"
    ),

  body("fechaNacimiento")
    .optional()
    .isISO8601({
      strict: true
    })
    .withMessage(
      "La fecha de nacimiento debe tener formato YYYY-MM-DD"
    )
];


// ========================================
// Exportaciones
// ========================================

module.exports = {
  validarIdPaciente,
  validarPaciente,
  validarPacienteParcial
};