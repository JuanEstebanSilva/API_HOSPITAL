const { consultar } = require("../config/database");

// ========================================
// Columnas estándar con alias camelCase
// ========================================
const COLUMNAS_CITA = `
  id,
  paciente_id AS "pacienteId",
  medico_id AS "medicoId",
  consultorio_id AS "consultorioId",
  TO_CHAR(fecha, 'YYYY-MM-DD') AS fecha,
  SUBSTRING(hora::text FROM 1 FOR 5) AS hora,
  motivo,
  estado
`;

// ========================================
// Obtener todas las citas
// ========================================
const obtenerCitas = async () => {
  const resultado = await consultar(`
    SELECT ${COLUMNAS_CITA}
    FROM public.citas
    ORDER BY id
  `);
  return resultado.rows;
};

// ========================================
// Obtener por ID
// ========================================
const obtenerCitaPorId = async (id) => {
  const resultado = await consultar(
    `
    SELECT ${COLUMNAS_CITA}
    FROM public.citas
    WHERE id = $1
    `,
    [id]
  );
  return resultado.rows[0] ?? null;
};

// ========================================
// Obtener por paciente
// ========================================
const obtenerCitasPorPaciente = async (pacienteId) => {
  const resultado = await consultar(
    `
    SELECT ${COLUMNAS_CITA}
    FROM public.citas
    WHERE paciente_id = $1
    ORDER BY fecha, hora
    `,
    [pacienteId]
  );
  return resultado.rows;
};

// ========================================
// Obtener por médico
// ========================================
const obtenerCitasPorMedico = async (medicoId) => {
  const resultado = await consultar(
    `
    SELECT ${COLUMNAS_CITA}
    FROM public.citas
    WHERE medico_id = $1
    ORDER BY fecha, hora
    `,
    [medicoId]
  );
  return resultado.rows;
};

// ========================================
// Comprobar conflicto del médico
// ========================================
const medicoTieneConflicto = async (
  medicoId,
  fecha,
  hora,
  citaIdExcluir = null
) => {
  const resultado = await consultar(
    `
    SELECT 1 FROM public.citas
    WHERE medico_id = $1
      AND fecha = $2::date
      AND hora = $3::time
      AND estado <> 'cancelada'
      AND ($4::bigint IS NULL OR id <> $4::bigint)
    LIMIT 1
    `,
    [medicoId, fecha, hora, citaIdExcluir ? Number(citaIdExcluir) : null]
  );
  return resultado.rowCount > 0;
};

// ========================================
// Comprobar conflicto del consultorio
// ========================================
const consultorioTieneConflicto = async (
  consultorioId,
  fecha,
  hora,
  citaIdExcluir = null
) => {
  const resultado = await consultar(
    `
    SELECT 1 FROM public.citas
    WHERE consultorio_id = $1
      AND fecha = $2::date
      AND hora = $3::time
      AND estado <> 'cancelada'
      AND ($4::bigint IS NULL OR id <> $4::bigint)
    LIMIT 1
    `,
    [consultorioId, fecha, hora, citaIdExcluir ? Number(citaIdExcluir) : null]
  );
  return resultado.rowCount > 0;
};

// ========================================
// Integridad referencial
// ========================================
const pacienteTieneCitas = async (pacienteId) => {
  const resultado = await consultar(
    `SELECT 1 FROM public.citas WHERE paciente_id = $1 LIMIT 1`,
    [pacienteId]
  );
  return resultado.rowCount > 0;
};

const medicoTieneCitas = async (medicoId) => {
  const resultado = await consultar(
    `SELECT 1 FROM public.citas WHERE medico_id = $1 LIMIT 1`,
    [medicoId]
  );
  return resultado.rowCount > 0;
};

const consultorioTieneCitas = async (consultorioId) => {
  const resultado = await consultar(
    `SELECT 1 FROM public.citas WHERE consultorio_id = $1 LIMIT 1`,
    [consultorioId]
  );
  return resultado.rowCount > 0;
};

// ========================================
// Crear cita (la API fuerza estado = 'programada')
// ========================================
const crearCita = async (datos) => {
  const resultado = await consultar(
    `
    INSERT INTO public.citas (
      paciente_id,
      medico_id,
      consultorio_id,
      fecha,
      hora,
      motivo,
      estado
    )
    VALUES ($1, $2, $3, $4, $5, $6, 'programada')
    RETURNING ${COLUMNAS_CITA}
    `,
    [
      datos.pacienteId,
      datos.medicoId,
      datos.consultorioId,
      datos.fecha,
      datos.hora,
      datos.motivo
    ]
  );
  return resultado.rows[0];
};

// ========================================
// PUT - Actualizar cita (conserva estado actual)
// ========================================
const actualizarCita = async (id, datos) => {
  const resultado = await consultar(
    `
    UPDATE public.citas
    SET
      paciente_id = $1,
      medico_id = $2,
      consultorio_id = $3,
      fecha = $4,
      hora = $5,
      motivo = $6
    WHERE id = $7
    RETURNING ${COLUMNAS_CITA}
    `,
    [
      datos.pacienteId,
      datos.medicoId,
      datos.consultorioId,
      datos.fecha,
      datos.hora,
      datos.motivo,
      id
    ]
  );
  return resultado.rows[0] ?? null;
};

// ========================================
// PATCH general (no modifica estado)
// ========================================
const actualizarCitaParcial = async (id, datos) => {
  const asignaciones = [];
  const valores = [];
  let contador = 1;

  if (Object.hasOwn(datos, "pacienteId")) {
    asignaciones.push(`paciente_id = $${contador++}`);
    valores.push(datos.pacienteId);
  }

  if (Object.hasOwn(datos, "medicoId")) {
    asignaciones.push(`medico_id = $${contador++}`);
    valores.push(datos.medicoId);
  }

  if (Object.hasOwn(datos, "consultorioId")) {
    asignaciones.push(`consultorio_id = $${contador++}`);
    valores.push(datos.consultorioId);
  }

  if (Object.hasOwn(datos, "fecha")) {
    asignaciones.push(`fecha = $${contador++}`);
    valores.push(datos.fecha);
  }

  if (Object.hasOwn(datos, "hora")) {
    asignaciones.push(`hora = $${contador++}`);
    valores.push(datos.hora);
  }

  if (Object.hasOwn(datos, "motivo")) {
    asignaciones.push(`motivo = $${contador++}`);
    valores.push(datos.motivo);
  }

  if (asignaciones.length === 0) {
    return obtenerCitaPorId(id);
  }

  valores.push(id);
  const sql = `
    UPDATE public.citas
    SET ${asignaciones.join(", ")}
    WHERE id = $${contador}
    RETURNING ${COLUMNAS_CITA}
  `;

  const resultado = await consultar(sql, valores);
  return resultado.rows[0] ?? null;
};

// ========================================
// PATCH especializado de estado
// ========================================
const actualizarEstadoCita = async (id, nuevoEstado) => {
  const resultado = await consultar(
    `
    UPDATE public.citas
    SET estado = $1
    WHERE id = $2
    RETURNING ${COLUMNAS_CITA}
    `,
    [nuevoEstado, id]
  );
  return resultado.rows[0] ?? null;
};

// ========================================
// DELETE
// ========================================
const eliminarCita = async (id) => {
  const resultado = await consultar(
    `
    DELETE FROM public.citas
    WHERE id = $1
    RETURNING ${COLUMNAS_CITA}
    `,
    [id]
  );
  return resultado.rows[0] ?? null;
};

module.exports = {
  obtenerCitas,
  obtenerCitaPorId,
  obtenerCitasPorPaciente,
  obtenerCitasPorMedico,
  medicoTieneConflicto,
  consultorioTieneConflicto,
  pacienteTieneCitas,
  medicoTieneCitas,
  consultorioTieneCitas,
  crearCita,
  actualizarCita,
  actualizarCitaParcial,
  actualizarEstadoCita,
  eliminarCita
};