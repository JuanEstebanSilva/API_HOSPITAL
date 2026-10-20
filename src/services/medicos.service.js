const { consultar } = require("../config/database");

// ========================================
// Columnas estándar con alias camelCase
// ========================================
const COLUMNAS_MEDICO = `
  id,
  usuario_id AS "usuarioId",
  especialidad_id AS "especialidadId",
  nombre,
  registro_medico AS "registroMedico",
  email,
  telefono,
  activo
`;

// ========================================
// Verificar si una especialidad tiene médicos
// ========================================
const especialidadTieneMedicos = async (especialidadId) => {
  const resultado = await consultar(
    `SELECT 1 FROM public.medicos WHERE especialidad_id = $1 LIMIT 1`,
    [especialidadId]
  );
  return resultado.rowCount > 0;
};

// ========================================
// Obtener todos los médicos
// ========================================
const obtenerMedicos = async () => {
  const resultado = await consultar(`
    SELECT ${COLUMNAS_MEDICO}
    FROM public.medicos
    ORDER BY id
  `);
  return resultado.rows;
};

// ========================================
// Obtener médico por ID
// ========================================
const obtenerMedicoPorId = async (id) => {
  const resultado = await consultar(
    `
    SELECT ${COLUMNAS_MEDICO}
    FROM public.medicos
    WHERE id = $1
    `,
    [id]
  );
  return resultado.rows[0] ?? null;
};

// ========================================
// Obtener médico por usuario
// ========================================
const obtenerMedicoPorUsuarioId = async (usuarioId) => {
  const resultado = await consultar(
    `
    SELECT ${COLUMNAS_MEDICO}
    FROM public.medicos
    WHERE usuario_id = $1
    `,
    [usuarioId]
  );
  return resultado.rows[0] ?? null;
};

// ========================================
// Obtener médicos por especialidad
// ========================================
const obtenerMedicosPorEspecialidad = async (especialidadId) => {
  const resultado = await consultar(
    `
    SELECT ${COLUMNAS_MEDICO}
    FROM public.medicos
    WHERE especialidad_id = $1
    ORDER BY id
    `,
    [especialidadId]
  );
  return resultado.rows;
};

// ========================================
// Buscar médico por registro médico
// ========================================
const buscarMedicoPorRegistro = async (registroMedico) => {
  const resultado = await consultar(
    `
    SELECT ${COLUMNAS_MEDICO}
    FROM public.medicos
    WHERE LOWER(registro_medico) = LOWER($1)
    `,
    [registroMedico]
  );
  return resultado.rows[0] ?? null;
};

// ========================================
// Buscar médico por email
// ========================================
const buscarMedicoPorEmail = async (email) => {
  const resultado = await consultar(
    `
    SELECT ${COLUMNAS_MEDICO}
    FROM public.medicos
    WHERE LOWER(email) = LOWER($1)
    `,
    [email]
  );
  return resultado.rows[0] ?? null;
};

// ========================================
// Crear médico
// ========================================
const crearMedico = async (datos) => {
  const usuarioId = datos.usuarioId ?? null;
  const telefono = datos.telefono ?? null;
  const activo = datos.activo !== undefined ? datos.activo : true;

  const resultado = await consultar(
    `
    INSERT INTO public.medicos (
      usuario_id,
      especialidad_id,
      nombre,
      registro_medico,
      email,
      telefono,
      activo
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING ${COLUMNAS_MEDICO}
    `,
    [
      usuarioId,
      datos.especialidadId,
      datos.nombre,
      datos.registroMedico,
      datos.email.toLowerCase(),
      telefono,
      activo
    ]
  );
  return resultado.rows[0];
};

// ========================================
// PUT - Actualización completa
// ========================================
const actualizarMedico = async (id, datos) => {
  const usuarioId = datos.usuarioId !== undefined ? (datos.usuarioId ?? null) : null;
  const telefono = datos.telefono ?? null;
  const activo = datos.activo !== undefined ? datos.activo : true;

  const resultado = await consultar(
    `
    UPDATE public.medicos
    SET
      usuario_id = $1,
      especialidad_id = $2,
      nombre = $3,
      registro_medico = $4,
      email = $5,
      telefono = $6,
      activo = $7
    WHERE id = $8
    RETURNING ${COLUMNAS_MEDICO}
    `,
    [
      usuarioId,
      datos.especialidadId,
      datos.nombre,
      datos.registroMedico,
      datos.email.toLowerCase(),
      telefono,
      activo,
      id
    ]
  );
  return resultado.rows[0] ?? null;
};

// ========================================
// PATCH - Actualización parcial
// ========================================
const actualizarMedicoParcial = async (id, datos) => {
  const asignaciones = [];
  const valores = [];
  let contador = 1;

  if (Object.hasOwn(datos, "usuarioId")) {
    asignaciones.push(`usuario_id = $${contador++}`);
    valores.push(datos.usuarioId ?? null);
  }

  if (Object.hasOwn(datos, "especialidadId")) {
    asignaciones.push(`especialidad_id = $${contador++}`);
    valores.push(datos.especialidadId);
  }

  if (Object.hasOwn(datos, "nombre")) {
    asignaciones.push(`nombre = $${contador++}`);
    valores.push(datos.nombre);
  }

  if (Object.hasOwn(datos, "registroMedico")) {
    asignaciones.push(`registro_medico = $${contador++}`);
    valores.push(datos.registroMedico);
  }

  if (Object.hasOwn(datos, "email")) {
    asignaciones.push(`email = $${contador++}`);
    valores.push(datos.email.toLowerCase());
  }

  if (Object.hasOwn(datos, "telefono")) {
    asignaciones.push(`telefono = $${contador++}`);
    valores.push(datos.telefono ?? null);
  }

  if (Object.hasOwn(datos, "activo")) {
    asignaciones.push(`activo = $${contador++}`);
    valores.push(datos.activo);
  }

  if (asignaciones.length === 0) {
    return obtenerMedicoPorId(id);
  }

  valores.push(id);
  const sql = `
    UPDATE public.medicos
    SET ${asignaciones.join(", ")}
    WHERE id = $${contador}
    RETURNING ${COLUMNAS_MEDICO}
  `;

  const resultado = await consultar(sql, valores);
  return resultado.rows[0] ?? null;
};

// ========================================
// Eliminar médico
// ========================================
const eliminarMedico = async (id) => {
  const resultado = await consultar(
    `
    DELETE FROM public.medicos
    WHERE id = $1
    RETURNING ${COLUMNAS_MEDICO}
    `,
    [id]
  );
  return resultado.rows[0] ?? null;
};

module.exports = {
  obtenerMedicos,
  obtenerMedicoPorId,
  obtenerMedicoPorUsuarioId,
  obtenerMedicosPorEspecialidad,
  buscarMedicoPorRegistro,
  buscarMedicoPorEmail,
  especialidadTieneMedicos,
  crearMedico,
  actualizarMedico,
  actualizarMedicoParcial,
  eliminarMedico
};