const {
  body,
  param
} = require("express-validator");


// ========================================
// Validar ID del médico
// ========================================

const validarIdMedico = [
  param("id")
    .isInt({
      min: 1
    })
    .withMessage(
      "El id debe ser un número entero positivo"
    )
];


// ========================================
// Validar ID de especialidad
// utilizado en búsquedas
// ========================================

const validarIdEspecialidad = [
  param("especialidadId")
    .isInt({
      min: 1
    })
    .withMessage(
      "El id de la especialidad debe ser un número entero positivo"
    )
];


// ========================================
// POST y PUT
// Todos los campos son obligatorios
// ========================================

const validarMedico = [

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


  body("registroMedico")
    .isString()
    .withMessage(
      "El registro médico debe ser texto"
    )
    .trim()
    .notEmpty()
    .withMessage(
      "El registro médico es obligatorio"
    )
    .matches(/^RM-[0-9]{4,10}$/)
    .withMessage(
      "El registro médico debe tener un formato como RM-45871"
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


  body("especialidadId")
    .isInt({
      min: 1
    })
    .withMessage(
      "La especialidad debe ser un número entero positivo"
    )
    .toInt(),


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

const validarMedicoParcial = [

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


  body("registroMedico")
    .optional()
    .isString()
    .withMessage(
      "El registro médico debe ser texto"
    )
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


  body("especialidadId")
    .optional()
    .isInt({
      min: 1
    })
    .withMessage(
      "La especialidad debe ser un número entero positivo"
    )
    .toInt(),


  body("activo")
    .optional()
    .isBoolean()
    .withMessage(
      "El campo activo debe ser verdadero o falso"
    )
    .toBoolean()
];


module.exports = {
  validarIdMedico,
  validarIdEspecialidad,
  validarMedico,
  validarMedicoParcial
};