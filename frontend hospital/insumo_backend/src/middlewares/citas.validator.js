
const { body, param } = require("express-validator");

// ========================================
// Utilidades
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
// Validar fecha YYYY-MM-DD
// ========================================

const esFechaValida = (valor) => {
  if (typeof valor !== "string") {
    return false;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    return false;
  }

  const [anio, mes, dia] =
    valor.split("-").map(Number);

  if (
    anio < 1 ||
    mes < 1 ||
    mes > 12 ||
    dia < 1 ||
    dia > 31
  ) {
    return false;
  }

  const diasMes = [
    31,
    (anio % 4 === 0 &&
      (anio % 100 !== 0 || anio % 400 === 0))
      ? 29
      : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31
  ];

  return dia <= diasMes[mes - 1];
};

// ========================================
// Validar hora HH:MM
// ========================================

const esHoraValida = (valor) =>
  typeof valor === "string" &&
  /^([01]\d|2[0-3]):([0-5]\d)$/.test(valor);

// ========================================
// IDs de rutas
// ========================================

const validarIdCita = [
  param("id")
    .custom(esIdValido)
    .withMessage(
      "El id debe ser un entero positivo válido"
    )
];

const validarIdPaciente = [
  param("pacienteId")
    .custom(esIdValido)
    .withMessage(
      "El pacienteId debe ser un entero positivo válido"
    )
];

const validarIdMedico = [
  param("medicoId")
    .custom(esIdValido)
    .withMessage(
      "El medicoId debe ser un entero positivo válido"
    )
];

// ========================================
// Campos obligatorios para POST y PUT
// ========================================

const camposCita = [
  body("pacienteId")
    .custom(esIdValido)
    .withMessage(
      "El pacienteId debe ser un entero positivo válido"
    ),

  body("medicoId")
    .custom(esIdValido)
    .withMessage(
      "El medicoId debe ser un entero positivo válido"
    ),

  body("consultorioId")
    .custom(esIdValido)
    .withMessage(
      "El consultorioId debe ser un entero positivo válido"
    ),

  body("fecha")
    .custom(esFechaValida)
    .withMessage(
      "La fecha debe tener formato YYYY-MM-DD y existir en el calendario"
    ),

  body("hora")
    .custom(esHoraValida)
    .withMessage(
      "La hora debe tener formato HH:MM"
    ),

  body("motivo")
    .isString()
    .withMessage(
      "El motivo debe ser texto"
    )
    .bail()
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
// POST
// ========================================

const validarCreacionCita = [...camposCita];

// ========================================
// PUT
// ========================================

const validarActualizacionCita = [...camposCita];

// ========================================
// PATCH general
// ========================================

const validarCitaParcial = [
  body("pacienteId")
    .optional()
    .custom(esIdValido)
    .withMessage(
      "El pacienteId debe ser un entero positivo válido"
    ),

  body("medicoId")
    .optional()
    .custom(esIdValido)
    .withMessage(
      "El medicoId debe ser un entero positivo válido"
    ),

  body("consultorioId")
    .optional()
    .custom(esIdValido)
    .withMessage(
      "El consultorioId debe ser un entero positivo válido"
    ),

  body("fecha")
    .optional()
    .custom(esFechaValida)
    .withMessage(
      "La fecha debe tener formato YYYY-MM-DD y existir en el calendario"
    ),

  body("hora")
    .optional()
    .custom(esHoraValida)
    .withMessage(
      "La hora debe tener formato HH:MM"
    ),

  body("motivo")
    .optional()
    .isString()
    .withMessage(
      "El motivo debe ser texto"
    )
    .bail()
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

// ========================================
// Exportaciones
// ========================================

module.exports = {
  validarIdCita,
  validarIdPaciente,
  validarIdMedico,
  validarCreacionCita,
  validarActualizacionCita,
  validarCitaParcial,
  validarEstadoCita
};
