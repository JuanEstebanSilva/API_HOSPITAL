const {
  body,
  param
} = require("express-validator");


// ========================================
// Validar ID
// ========================================

const validarIdConsultorio = [
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
// Todos los campos son obligatorios
// ========================================

const validarConsultorio = [

  body("codigo")
    .isString()
    .withMessage(
      "El código debe ser texto"
    )
    .trim()
    .notEmpty()
    .withMessage(
      "El código es obligatorio"
    )
    .matches(/^CONS-[0-9]{3,4}$/)
    .withMessage(
      "El código debe tener un formato como CONS-101"
    ),


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


  body("piso")
    .isInt({
      min: 1,
      max: 100
    })
    .withMessage(
      "El piso debe ser un número entero entre 1 y 100"
    )
    .toInt(),


  body("ubicacion")
    .isString()
    .withMessage(
      "La ubicación debe ser texto"
    )
    .trim()
    .notEmpty()
    .withMessage(
      "La ubicación es obligatoria"
    )
    .isLength({
      min: 3,
      max: 100
    })
    .withMessage(
      "La ubicación debe tener entre 3 y 100 caracteres"
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
// Todos los campos son opcionales
// ========================================

const validarConsultorioParcial = [

  body("codigo")
    .optional()
    .isString()
    .withMessage(
      "El código debe ser texto"
    )
    .trim()
    .notEmpty()
    .withMessage(
      "El código no puede estar vacío"
    )
    .matches(/^CONS-[0-9]{3,4}$/)
    .withMessage(
      "El código debe tener un formato como CONS-101"
    ),


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


  body("piso")
    .optional()
    .isInt({
      min: 1,
      max: 100
    })
    .withMessage(
      "El piso debe ser un número entero entre 1 y 100"
    )
    .toInt(),


  body("ubicacion")
    .optional()
    .isString()
    .withMessage(
      "La ubicación debe ser texto"
    )
    .trim()
    .notEmpty()
    .withMessage(
      "La ubicación no puede estar vacía"
    )
    .isLength({
      min: 3,
      max: 100
    })
    .withMessage(
      "La ubicación debe tener entre 3 y 100 caracteres"
    ),


  body("activo")
    .optional()
    .isBoolean()
    .withMessage(
      "El campo activo debe ser verdadero o falso"
    )
    .toBoolean()
];


module.exports = {
  validarIdConsultorio,
  validarConsultorio,
  validarConsultorioParcial
};