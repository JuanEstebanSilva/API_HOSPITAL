const { consultar } = require("../config/database");

// ========================================
// Columnas de salida
// ========================================

const columnas = `
  id,
  usuario_id AS "usuarioId",
  nombre,
  registro_medico AS "registroMedico",
  email,
  telefono,
  especialidad_id AS "especialidadId",
  activo
`;

// ========================================
// GET - Todos los médicos
// ========================================

const obtenerMedicos = async () => {
  const resultado = await consultar(`
    SELECT ${columnas}
    FROM public.medicos
    ORDER BY id
  `);

  return resultado.rows;
};

// ========================================
// GET - Médico por ID
// ========================================

const obtenerMedicoPorId = async (id) => {
  const resultado = await consultar(
    `SELECT ${columnas}
     FROM public.medicos
     WHERE id = $1`,
    [id],
  );

  return resultado.rows[0] ?? null;
};

// ========================================
// GET - Médico asociado a usuario
// ========================================

const obtenerMedicoPorUsuarioId = async (usuarioId) => {
  if (usuarioId == null) return null;

  const resultado = await consultar(
    `SELECT ${columnas}
     FROM public.medicos
     WHERE usuario_id = $1`,
    [usuarioId],
  );

  return resultado.rows[0] ?? null;
};

// ========================================
// GET - Médicos por especialidad
// ========================================

const obtenerMedicosPorEspecialidad = async (especialidadId) => {
  const resultado = await consultar(
    `SELECT ${columnas}
     FROM public.medicos
     WHERE especialidad_id = $1
     ORDER BY id`,
    [especialidadId],
  );

  return resultado.rows;
};

// ========================================
// Buscar por registro médico
// ========================================

const buscarMedicoPorRegistro = async (registroMedico) => {
  const resultado = await consultar(
    `SELECT ${columnas}
     FROM public.medicos
     WHERE LOWER(registro_medico) = LOWER($1)
     LIMIT 1`,
    [registroMedico],
  );

  return resultado.rows[0] ?? null;
};

// ========================================
// Buscar por correo
// ========================================

const buscarMedicoPorEmail = async (email) => {
  const resultado = await consultar(
    `SELECT ${columnas}
     FROM public.medicos
     WHERE LOWER(email) = LOWER($1)
     LIMIT 1`,
    [email],
  );

  return resultado.rows[0] ?? null;
};

// ========================================
// POST - Crear médico
// ========================================

const crearMedico = async (datos) => {
  const resultado = await consultar(
    `INSERT INTO public.medicos (
       usuario_id,
       nombre,
       registro_medico,
       email,
       telefono,
       especialidad_id,
       activo
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING ${columnas}`,
    [
      datos.usuarioId ?? null,
      datos.nombre,
      datos.registroMedico,
      datos.email,
      datos.telefono ?? null,
      datos.especialidadId,
      datos.activo ?? true,
    ],
  );

  return resultado.rows[0];
};

// ========================================
// PUT - Actualización completa
// ========================================

const actualizarMedico = async (id, datos) => {
  const resultado = await consultar(
    `UPDATE public.medicos
     SET usuario_id = $1,
         nombre = $2,
         registro_medico = $3,
         email = $4,
         telefono = $5,
         especialidad_id = $6,
         activo = $7
     WHERE id = $8
     RETURNING ${columnas}`,
    [
      datos.usuarioId ?? null,
      datos.nombre,
      datos.registroMedico,
      datos.email,
      datos.telefono ?? null,
      datos.especialidadId,
      datos.activo,
      id,
    ],
  );

  return resultado.rows[0] ?? null;
};

// ========================================
// PATCH - Actualización parcial
// ========================================

const actualizarMedicoParcial = async (id, datos) => {
  const campos = {
    usuarioId: "usuario_id",
    nombre: "nombre",
    registroMedico: "registro_medico",
    email: "email",
    telefono: "telefono",
    especialidadId: "especialidad_id",
    activo: "activo",
  };

  const cambios = Object.entries(datos).filter(([campo]) =>
    Object.hasOwn(campos, campo),
  );

  if (cambios.length === 0) {
    return null;
  }

  const asignaciones = cambios.map(
    ([campo], indice) => `${campos[campo]} = $${indice + 2}`,
  );

  const parametros = [id, ...cambios.map(([, valor]) => valor)];

  const resultado = await consultar(
    `UPDATE public.medicos
     SET ${asignaciones.join(", ")}
     WHERE id = $1
     RETURNING ${columnas}`,
    parametros,
  );

  return resultado.rows[0] ?? null;
};

// ========================================
// DELETE - Eliminar médico
// ========================================

const eliminarMedico = async (id) => {
  const resultado = await consultar(
    `DELETE FROM public.medicos
     WHERE id = $1
     RETURNING ${columnas}`,
    [id],
  );

  return resultado.rows[0] ?? null;
};

// ========================================
// Integridad referencial
// Especialidad con médicos asociados
// ========================================

const especialidadTieneMedicos = async (especialidadId) => {
  const resultado = await consultar(
    `SELECT EXISTS (
       SELECT 1
       FROM public.medicos
       WHERE especialidad_id = $1
     ) AS tiene_medicos`,
    [especialidadId],
  );

  return resultado.rows[0].tiene_medicos;
};

// ========================================
// Exportaciones
// ========================================

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
  eliminarMedico,
};
