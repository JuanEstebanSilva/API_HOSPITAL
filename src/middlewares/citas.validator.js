const {
  body,
  param
} = require("express-validator");


// ========================================
// ID de cita
// ========================================

const validarIdCita = [
  param("id")
    .isInt({
      min: 1
    })
    .withMessage(
      "El id debe ser un número entero positivo"
    )
];


// ========================================
// ID de paciente
// ========================================

const validarIdPaciente = [
  param("pacienteId")
    .isInt({
      min: 1
    })
    .withMessage(
      "El id del paciente debe ser un número entero positivo"
    )
];


// ========================================
// ID de médico
// ========================================

const validarIdMedico = [
  param("medicoId")
    .isInt({
      min: 1
    })
    .withMessage(
      "El id del médico debe ser un número entero positivo"
    )
];


// ========================================
// POST
// El cliente NO envía estado
// ========================================

const validarCreacionCita = [

  body("pacienteId")
    .isInt({
      min: 1
    })
    .withMessage(
      "El pacienteId debe ser un número entero positivo"
    )
    .toInt(),


  body("medicoId")
    .isInt({
      min: 1
    })
    .withMessage(
      "El medicoId debe ser un número entero positivo"
    )
    .toInt(),


  body("consultorioId")
    .isInt({
      min: 1
    })
    .withMessage(
      "El consultorioId debe ser un número entero positivo"
    )
    .toInt(),


  body("fecha")
    .isISO8601({
      strict: true
    })
    .withMessage(
      "La fecha debe tener formato YYYY-MM-DD"
    ),


  body("hora")
    .matches(
      /^([01]\d|2[0-3]):([0-5]\d)$/
    )
    .withMessage(
      "La hora debe tener formato HH:MM"
    ),


  body("motivo")
    .isString()
    .withMessage(
      "El motivo debe ser texto"
    )
    .trim()
    .notEmpty()
    .withMessage(
      "El motivo es obligatorio"
    )
    .isLength({
      min: 5,
      max: 300
    })
    .withMessage(
      "El motivo debe tener entre 5 y 300 caracteres"
    )
];


// ========================================
// PUT
// Tampoco permite modificar estado
// ========================================

const validarActualizacionCita = [

  body("pacienteId")
    .isInt({
      min: 1
    })
    .withMessage(
      "El pacienteId debe ser un número entero positivo"
    )
    .toInt(),


  body("medicoId")
    .isInt({
      min: 1
    })
    .withMessage(
      "El medicoId debe ser un número entero positivo"
    )
    .toInt(),


  body("consultorioId")
    .isInt({
      min: 1
    })
    .withMessage(
      "El consultorioId debe ser un número entero positivo"
    )
    .toInt(),


  body("fecha")
    .isISO8601({
      strict: true
    })
    .withMessage(
      "La fecha debe tener formato YYYY-MM-DD"
    ),


  body("hora")
    .matches(
      /^([01]\d|2[0-3]):([0-5]\d)$/
    )
    .withMessage(
      "La hora debe tener formato HH:MM"
    ),


  body("motivo")
    .isString()
    .withMessage(
      "El motivo debe ser texto"
    )
    .trim()
    .notEmpty()
    .withMessage(
      "El motivo es obligatorio"
    )
    .isLength({
      min: 5,
      max: 300
    })
    .withMessage(
      "El motivo debe tener entre 5 y 300 caracteres"
    )
];


// ========================================
// PATCH general
// Estado NO permitido
// ========================================

const validarCitaParcial = [

  body("pacienteId")
    .optional()
    .isInt({
      min: 1
    })
    .withMessage(
      "El pacienteId debe ser un número entero positivo"
    )
    .toInt(),


  body("medicoId")
    .optional()
    .isInt({
      min: 1
    })
    .withMessage(
      "El medicoId debe ser un número entero positivo"
    )
    .toInt(),


  body("consultorioId")
    .optional()
    .isInt({
      min: 1
    })
    .withMessage(
      "El consultorioId debe ser un número entero positivo"
    )
    .toInt(),


  body("fecha")
    .optional()
    .isISO8601({
      strict: true
    })
    .withMessage(
      "La fecha debe tener formato YYYY-MM-DD"
    ),


  body("hora")
    .optional()
    .matches(
      /^([01]\d|2[0-3]):([0-5]\d)$/
    )
    .withMessage(
      "La hora debe tener formato HH:MM"
    ),


  body("motivo")
    .optional()
    .isString()
    .withMessage(
      "El motivo debe ser texto"
    )
    .trim()
    .notEmpty()
    .withMessage(
      "El motivo no puede estar vacío"
    )
    .isLength({
      min: 5,
      max: 300
    })
    .withMessage(
      "El motivo debe tener entre 5 y 300 caracteres"
    )
];


// ========================================
// PATCH especializado de estado
// ========================================

const validarEstadoCita = [

  body("estado")
    .isIn([
      "programada",
      "confirmada",
      "atendida",
      "cancelada"
    ])
    .withMessage(
      "El estado debe ser programada, confirmada, atendida o cancelada"
    )
];


module.exports = {
  validarIdCita,
  validarIdPaciente,
  validarIdMedico,
  validarCreacionCita,
  validarActualizacionCita,
  validarCitaParcial,
  validarEstadoCita
};