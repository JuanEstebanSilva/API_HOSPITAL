const { consultar } = require("../config/database");

// ========================================
// Columnas estándar con alias camelCase
// ========================================
const COLUMNAS_PACIENTE = `
  id,
  usuario_id AS "usuarioId",
  nombre,
  documento,
  email,
  telefono,
  TO_CHAR(fecha_nacimiento, 'YYYY-MM-DD') AS "fechaNacimiento"
`;

// ========================================
// Obtener todos los pacientes
// ========================================
const obtenerPacientes = async () => {
  const resultado = await consultar(`
    SELECT ${COLUMNAS_PACIENTE}
    FROM public.pacientes
    ORDER BY id
  `);
  return resultado.rows;
};

// ========================================
// Obtener paciente por ID
// ========================================
const obtenerPacientePorId = async (id) => {
  const resultado = await consultar(
    `
    SELECT ${COLUMNAS_PACIENTE}
    FROM public.pacientes
    WHERE id = $1
    `,
    [id]
  );
  return resultado.rows[0] ?? null;
};

// ========================================
// Obtener paciente por usuario ID
// ========================================
const obtenerPacientePorUsuarioId = async (usuarioId) => {
  const resultado = await consultar(
    `
    SELECT ${COLUMNAS_PACIENTE}
    FROM public.pacientes
    WHERE usuario_id = $1
    `,
    [usuarioId]
  );
  return resultado.rows[0] ?? null;
};

// ========================================
// Buscar paciente por documento
// ========================================
const buscarPacientePorDocumento = async (documento) => {
  const resultado = await consultar(
    `
    SELECT ${COLUMNAS_PACIENTE}
    FROM public.pacientes
    WHERE documento = $1
    `,
    [documento]
  );
  return resultado.rows[0] ?? null;
};

// ========================================
// Buscar paciente por email
// ========================================
const buscarPacientePorEmail = async (email) => {
  const resultado = await consultar(
    `
    SELECT ${COLUMNAS_PACIENTE}
    FROM public.pacientes
    WHERE LOWER(email) = LOWER($1)
    `,
    [email]
  );
  return resultado.rows[0] ?? null;
};

// ========================================
// Crear paciente
// ========================================
const crearPaciente = async (datos) => {
  const usuarioId = datos.usuarioId ?? null;
  const telefono = datos.telefono ?? null;

  const resultado = await consultar(
    `
    INSERT INTO public.pacientes (
      usuario_id,
      nombre,
      documento,
      email,
      telefono,
      fecha_nacimiento
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING ${COLUMNAS_PACIENTE}
    `,
    [
      usuarioId,
      datos.nombre,
      datos.documento,
      datos.email.toLowerCase(),
      telefono,
      datos.fechaNacimiento
    ]
  );
  return resultado.rows[0];
};

// ========================================
// Actualización completa - PUT
// ========================================
const actualizarPaciente = async (id, datos) => {
  const usuarioId = datos.usuarioId !== undefined ? (datos.usuarioId ?? null) : null;
  const telefono = datos.telefono ?? null;

  const resultado = await consultar(
    `
    UPDATE public.pacientes
    SET
      usuario_id = $1,
      nombre = $2,
      documento = $3,
      email = $4,
      telefono = $5,
      fecha_nacimiento = $6
    WHERE id = $7
    RETURNING ${COLUMNAS_PACIENTE}
    `,
    [
      usuarioId,
      datos.nombre,
      datos.documento,
      datos.email.toLowerCase(),
      telefono,
      datos.fechaNacimiento,
      id
    ]
  );
  return resultado.rows[0] ?? null;
};

// ========================================
// Actualización parcial - PATCH
// ========================================
const actualizarPacienteParcial = async (id, datos) => {
  const asignaciones = [];
  const valores = [];
  let contador = 1;

  if (Object.hasOwn(datos, "usuarioId")) {
    asignaciones.push(`usuario_id = $${contador++}`);
    valores.push(datos.usuarioId ?? null);
  }

  if (Object.hasOwn(datos, "nombre")) {
    asignaciones.push(`nombre = $${contador++}`);
    valores.push(datos.nombre);
  }

  if (Object.hasOwn(datos, "documento")) {
    asignaciones.push(`documento = $${contador++}`);
    valores.push(datos.documento);
  }

  if (Object.hasOwn(datos, "email")) {
    asignaciones.push(`email = $${contador++}`);
    valores.push(datos.email.toLowerCase());
  }

  if (Object.hasOwn(datos, "telefono")) {
    asignaciones.push(`telefono = $${contador++}`);
    valores.push(datos.telefono ?? null);
  }

  if (Object.hasOwn(datos, "fechaNacimiento")) {
    asignaciones.push(`fecha_nacimiento = $${contador++}`);
    valores.push(datos.fechaNacimiento);
  }

  if (asignaciones.length === 0) {
    return obtenerPacientePorId(id);
  }

  valores.push(id);
  const sql = `
    UPDATE public.pacientes
    SET ${asignaciones.join(", ")}
    WHERE id = $${contador}
    RETURNING ${COLUMNAS_PACIENTE}
  `;

  const resultado = await consultar(sql, valores);
  return resultado.rows[0] ?? null;
};

// ========================================
// Eliminar paciente
// ========================================
const eliminarPaciente = async (id) => {
  const resultado = await consultar(
    `
    DELETE FROM public.pacientes
    WHERE id = $1
    RETURNING ${COLUMNAS_PACIENTE}
    `,
    [id]
  );
  return resultado.rows[0] ?? null;
};

module.exports = {
  obtenerPacientes,
  obtenerPacientePorId,
  obtenerPacientePorUsuarioId,
  buscarPacientePorDocumento,
  buscarPacientePorEmail,
  crearPaciente,
  actualizarPaciente,
  actualizarPacienteParcial,
  eliminarPaciente
};