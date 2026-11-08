const {
  body,
  param
} = require("express-validator");

// ========================================
// Validar ID
// ========================================

const validarIdEspecialidad = [
  param("id")
    .isInt({
      min: 1
    })
    .withMessage(
      "El id debe ser un número entero positivo"
    )
];

// ========================================
// POST y PUT
// ========================================

const validarEspecialidad = [
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

  body("descripcion")
    .isString()
    .withMessage(
      "La descripción debe ser texto"
    )
    .trim()
    .notEmpty()
    .withMessage(
      "La descripción es obligatoria"
    )
    .isLength({
      min: 5,
      max: 300
    })
    .withMessage(
      "La descripción debe tener entre 5 y 300 caracteres"
    ),

  body("activa")
    .isBoolean()
    .withMessage(
      "El campo activa debe ser verdadero o falso"
    )
    .toBoolean()
];

// ========================================
// PATCH
// Todos los campos son opcionales
// ========================================

const validarEspecialidadParcial = [
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

  body("descripcion")
    .optional()
    .isString()
    .withMessage(
      "La descripción debe ser texto"
    )
    .trim()
    .notEmpty()
    .withMessage(
      "La descripción no puede estar vacía"
    )
    .isLength({
      min: 5,
      max: 300
    })
    .withMessage(
      "La descripción debe tener entre 5 y 300 caracteres"
    ),

  body("activa")
    .optional()
    .isBoolean()
    .withMessage(
      "El campo activa debe ser verdadero o falso"
    )
    .toBoolean()
];

module.exports = {
  validarIdEspecialidad,
  validarEspecialidad,
  validarEspecialidadParcial
};