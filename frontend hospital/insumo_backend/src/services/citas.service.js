
const { consultar } = require("../config/database");

// ========================================
// Columnas y formato de salida
// ========================================

const columnas = `
  id,
  paciente_id AS "pacienteId",
  medico_id AS "medicoId",
  consultorio_id AS "consultorioId",
  TO_CHAR(fecha, 'YYYY-MM-DD') AS fecha,
  TO_CHAR(hora, 'HH24:MI:SS') AS hora,
  motivo,
  estado
`;

// ========================================
// Consultas
// ========================================

// LAB 12.10: enriquecer únicamente el listado administrativo con datos
// de presentación. Se conservan los identificadores y el contrato existente.
const obtenerCitas = async () => {
  const resultado = await consultar(`
    SELECT c.id, c.paciente_id AS "pacienteId",
      c.medico_id AS "medicoId", c.consultorio_id AS "consultorioId",
      TO_CHAR(c.fecha, 'YYYY-MM-DD') AS fecha,
      TO_CHAR(c.hora, 'HH24:MI:SS') AS hora,
      c.motivo, c.estado,
      p.nombre AS "pacienteNombre", m.nombre AS "medicoNombre",
      co.nombre AS "consultorioNombre", co.codigo AS "consultorioCodigo"
    FROM public.citas AS c
    LEFT JOIN public.pacientes AS p ON p.id = c.paciente_id
    LEFT JOIN public.medicos AS m ON m.id = c.medico_id
    LEFT JOIN public.consultorios AS co ON co.id = c.consultorio_id
    ORDER BY c.fecha, c.hora, c.id
  `);
  return resultado.rows;
};

const obtenerCitaPorId = async (id) => {
  const resultado = await consultar(
    `SELECT ${columnas}
     FROM public.citas
     WHERE id = $1`,
    [id]
  );

  return resultado.rows[0] ?? null;
};

const obtenerCitasPorPaciente = async (pacienteId) => {
  const resultado = await consultar(
    `SELECT c.id, c.paciente_id AS "pacienteId", c.medico_id AS "medicoId",
       c.consultorio_id AS "consultorioId", TO_CHAR(c.fecha, 'YYYY-MM-DD') AS fecha,
       TO_CHAR(c.hora, 'HH24:MI:SS') AS hora, c.motivo, c.estado,
       p.nombre AS "pacienteNombre", m.nombre AS "medicoNombre", co.nombre AS "consultorioNombre", co.codigo AS "consultorioCodigo"
     FROM public.citas c
     JOIN public.pacientes p ON p.id = c.paciente_id
     JOIN public.medicos m ON m.id = c.medico_id
     JOIN public.consultorios co ON co.id = c.consultorio_id
     WHERE c.paciente_id = $1
     ORDER BY c.fecha, c.hora`,
    [pacienteId]
  );

  return resultado.rows;
};

const obtenerCitasPorMedico = async (medicoId) => {
  const resultado = await consultar(
    `SELECT c.id, c.paciente_id AS "pacienteId", c.medico_id AS "medicoId",
       c.consultorio_id AS "consultorioId", TO_CHAR(c.fecha, 'YYYY-MM-DD') AS fecha,
       TO_CHAR(c.hora, 'HH24:MI:SS') AS hora, c.motivo, c.estado,
       p.nombre AS "pacienteNombre", m.nombre AS "medicoNombre", co.nombre AS "consultorioNombre", co.codigo AS "consultorioCodigo"
     FROM public.citas c
     JOIN public.pacientes p ON p.id = c.paciente_id
     JOIN public.medicos m ON m.id = c.medico_id
     JOIN public.consultorios co ON co.id = c.consultorio_id
     WHERE c.medico_id = $1
     ORDER BY c.fecha, c.hora`,
    [medicoId]
  );

  return resultado.rows;
};

// ========================================
// Disponibilidad
// ========================================

const medicoTieneConflicto = async (
  medicoId,
  fecha,
  hora,
  citaIdExcluir = null
) => {
  const resultado = await consultar(
    `SELECT EXISTS (
       SELECT 1
       FROM public.citas
       WHERE medico_id = $1
         AND fecha = $2
         AND hora = $3
         AND estado <> 'cancelada'
         AND ($4::bigint IS NULL OR id <> $4::bigint)
     ) AS conflicto`,
    [medicoId, fecha, hora, citaIdExcluir]
  );

  return resultado.rows[0].conflicto;
};

const consultorioTieneConflicto = async (
  consultorioId,
  fecha,
  hora,
  citaIdExcluir = null
) => {
  const resultado = await consultar(
    `SELECT EXISTS (
       SELECT 1
       FROM public.citas
       WHERE consultorio_id = $1
         AND fecha = $2
         AND hora = $3
         AND estado <> 'cancelada'
         AND ($4::bigint IS NULL OR id <> $4::bigint)
     ) AS conflicto`,
    [consultorioId, fecha, hora, citaIdExcluir]
  );

  return resultado.rows[0].conflicto;
};

// ========================================
// Crear cita
// ========================================

const crearCita = async (datos) => {
  const resultado = await consultar(
    `INSERT INTO public.citas (
       paciente_id,
       medico_id,
       consultorio_id,
       fecha,
       hora,
       motivo,
       estado
     )
     VALUES ($1, $2, $3, $4, $5, $6, 'programada')
     RETURNING ${columnas}`,
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
// PUT: conservar estado
// ========================================

const actualizarCita = async (id, datos) => {
  const resultado = await consultar(
    `UPDATE public.citas
     SET paciente_id = $2,
         medico_id = $3,
         consultorio_id = $4,
         fecha = $5,
         hora = $6,
         motivo = $7
     WHERE id = $1
     RETURNING ${columnas}`,
    [
      id,
      datos.pacienteId,
      datos.medicoId,
      datos.consultorioId,
      datos.fecha,
      datos.hora,
      datos.motivo
    ]
  );

  return resultado.rows[0] ?? null;
};

// ========================================
// PATCH general: conservar estado
// ========================================

const actualizarCitaParcial = async (id, datos) => {
  const campos = {
    pacienteId: "paciente_id",
    medicoId: "medico_id",
    consultorioId: "consultorio_id",
    fecha: "fecha",
    hora: "hora",
    motivo: "motivo"
  };

  const cambios = Object.entries(datos)
    .filter(([campo]) => Object.hasOwn(campos, campo));

  if (cambios.length === 0) return null;

  const asignaciones = cambios.map(
    ([campo], indice) =>
      `${campos[campo]} = $${indice + 2}`
  );

  const parametros = [
    id,
    ...cambios.map(([, valor]) => valor)
  ];

  const resultado = await consultar(
    `UPDATE public.citas
     SET ${asignaciones.join(", ")}
     WHERE id = $1
     RETURNING ${columnas}`,
    parametros
  );

  return resultado.rows[0] ?? null;
};

// ========================================
// PATCH de estado
// Validación atómica en PostgreSQL
// ========================================

const actualizarEstadoCita = async (id, nuevoEstado) => {
  const resultado = await consultar(
    `UPDATE public.citas
     SET estado = $2
     WHERE id = $1
       AND (
         (estado = 'programada'
          AND $2 IN ('confirmada', 'cancelada'))
         OR
         (estado = 'confirmada'
          AND $2 IN ('atendida', 'cancelada'))
       )
     RETURNING ${columnas}`,
    [id, nuevoEstado]
  );

  return resultado.rows[0] ?? null;
};

// ========================================
// Eliminar cita
// ========================================

const eliminarCita = async (id) => {
  const resultado = await consultar(
    `DELETE FROM public.citas
     WHERE id = $1
     RETURNING ${columnas}`,
    [id]
  );

  return resultado.rows[0] ?? null;
};

// ========================================
// Integridad referencial
// ========================================

const pacienteTieneCitas = async (pacienteId) => {
  const resultado = await consultar(
    `SELECT EXISTS (
       SELECT 1 FROM public.citas
       WHERE paciente_id = $1
     ) AS existe`,
    [pacienteId]
  );

  return resultado.rows[0].existe;
};

const medicoTieneCitas = async (medicoId) => {
  const resultado = await consultar(
    `SELECT EXISTS (
       SELECT 1 FROM public.citas
       WHERE medico_id = $1
     ) AS existe`,
    [medicoId]
  );

  return resultado.rows[0].existe;
};

const consultorioTieneCitas = async (consultorioId) => {
  const resultado = await consultar(
    `SELECT EXISTS (
       SELECT 1 FROM public.citas
       WHERE consultorio_id = $1
     ) AS existe`,
    [consultorioId]
  );

  return resultado.rows[0].existe;
};

// LAB 12.7: cambios de estado limitados por la vinculación real de PostgreSQL.
const cambiarEstadoPropio = async ({ citaId, usuarioId, rol, estado }) => {
  const esPaciente = rol === "paciente";
  const tabla = esPaciente ? "pacientes" : "medicos";
  const columna = esPaciente ? "paciente_id" : "medico_id";
  const origen = esPaciente ? ["programada", "confirmada"] : estado === "confirmada" ? ["programada"] : ["confirmada"];
  const resultado = await consultar(
    `UPDATE public.citas AS c SET estado = $3
     WHERE c.id = $1 AND c.estado = ANY($4::text[])
       AND EXISTS (SELECT 1 FROM public.${tabla} AS p WHERE p.id = c.${columna} AND p.usuario_id = $2)
     RETURNING ${columnas}`,
    [citaId, usuarioId, estado, origen]
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
  eliminarCita,
  cambiarEstadoPropio
};
