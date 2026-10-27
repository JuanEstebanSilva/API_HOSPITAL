
const { body, param } = require("express-validator");

// ========================================
// Validación de identificadores BIGINT
// ========================================

const MAX_BIGINT = 9223372036854775807n;

const esIdValido = (valor) => {
  if (
    typeof valor !== "string" &&
    typeof valor !== "number"
  ) {
    return false;
  }

  const texto = String(valor);

  if (!/^[1-9][0-9]*$/.test(texto)) {
    return false;
  }

  if (
    typeof valor === "number" &&
    !Number.isSafeInteger(valor)
  ) {
    return false;
  }

  try {
    return BigInt(texto) <= MAX_BIGINT;
  } catch {
    return false;
  }
};

// ========================================
// ID del médico
// ========================================

const validarIdMedico = [
  param("id")
    .custom(esIdValido)
    .withMessage(
      "El id debe ser un entero positivo válido"
    )
];

// ========================================
// ID de especialidad
// ========================================

const validarIdEspecialidad = [
  param("especialidadId")
    .custom(esIdValido)
    .withMessage(
      "El id de especialidad debe ser un entero positivo válido"
    )
];

// ========================================
// POST y PUT
// ========================================

const validarMedico = [
  body("usuarioId")
    .optional({ values: "null" })
    .custom(esIdValido)
    .withMessage(
      "El usuarioId debe ser un entero positivo válido"
    ),

  body("nombre")
    .isString()
    .withMessage("El nombre debe ser texto")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("El nombre es obligatorio")
    .isLength({ min: 3, max: 100 })
    .withMessage(
      "El nombre debe tener entre 3 y 100 caracteres"
    ),

  body("registroMedico")
    .isString()
    .withMessage(
      "El registro médico debe ser texto"
    )
    .bail()
    .trim()
    .matches(/^RM-[0-9]{4,10}$/)
    .withMessage(
      "El registro médico debe tener un formato como RM-45871"
    ),

  body("email")
    .isEmail()
    .withMessage(
      "El correo electrónico no es válido"
    )
    .bail()
    .normalizeEmail(),

  body("telefono")
    .optional({ values: "null" })
    .isString()
    .withMessage(
      "El teléfono debe ser texto"
    )
    .bail()
    .trim()
    .matches(/^[0-9]{7,15}$/)
    .withMessage(
      "El teléfono debe contener entre 7 y 15 dígitos"
    ),

  body("especialidadId")
    .custom(esIdValido)
    .withMessage(
      "La especialidad debe ser un entero positivo válido"
    ),

  body("activo")
    .isBoolean()
    .withMessage(
      "El campo activo debe ser verdadero o falso"
    )
    .toBoolean()
];

// ========================================
// PATCH
// ========================================

const validarMedicoParcial = [
  body("usuarioId")
    .optional({ values: "null" })
    .custom(esIdValido)
    .withMessage(
      "El usuarioId debe ser un entero positivo válido"
    ),

  body("nombre")
    .optional()
    .isString()
    .withMessage("El nombre debe ser texto")
    .bail()
    .trim()
    .notEmpty()
    .withMessage(
      "El nombre no puede estar vacío"
    )
    .isLength({ min: 3, max: 100 })
    .withMessage(
      "El nombre debe tener entre 3 y 100 caracteres"
    ),

  body("registroMedico")
    .optional()
    .isString()
    .withMessage(
      "El registro médico debe ser texto"
    )
    .bail()
    .trim()
    .matches(/^RM-[0-9]{4,10}$/)
    .withMessage(
      "El registro médico debe tener un formato como RM-45871"
    ),

  body("email")
    .optional()
    .isEmail()
    .withMessage(
      "El correo electrónico no es válido"
    )
    .bail()
    .normalizeEmail(),

  body("telefono")
    .optional({ values: "null" })
    .isString()
    .withMessage(
      "El teléfono debe ser texto"
    )
    .bail()
    .trim()
    .matches(/^[0-9]{7,15}$/)
    .withMessage(
      "El teléfono debe contener entre 7 y 15 dígitos"
    ),

  body("especialidadId")
    .optional()
    .custom(esIdValido)
    .withMessage(
      "La especialidad debe ser un entero positivo válido"
    ),

  body("activo")
    .optional()
    .isBoolean()
    .withMessage(
      "El campo activo debe ser verdadero o falso"
    )
    .toBoolean()
];

// ========================================
// Exportaciones
// ========================================

module.exports = {
  validarIdMedico,
  validarIdEspecialidad,
  validarMedico,
  validarMedicoParcial
};
