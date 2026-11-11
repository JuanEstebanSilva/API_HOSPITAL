
const { consultar } = require("../config/database");

// ========================================
// Obtener todas
// ========================================

const obtenerEspecialidades = async () => {
  const resultado = await consultar(`
    SELECT id, nombre, descripcion, activa
    FROM public.especialidades
    ORDER BY id
  `);

  return resultado.rows;
};

// ========================================
// Obtener por ID
// ========================================

const obtenerEspecialidadPorId = async (id) => {
  const resultado = await consultar(
    `SELECT id, nombre, descripcion, activa
     FROM public.especialidades
     WHERE id = $1`,
    [id]
  );

  return resultado.rows[0] ?? null;
};

// ========================================
// Buscar por nombre
// ========================================

const buscarEspecialidadPorNombre = async (nombre) => {
  const resultado = await consultar(
    `SELECT id, nombre, descripcion, activa
     FROM public.especialidades
     WHERE LOWER(nombre) = LOWER($1)
     LIMIT 1`,
    [nombre]
  );

  return resultado.rows[0] ?? null;
};

// ========================================
// Crear
// ========================================

const crearEspecialidad = async (datos) => {
  const resultado = await consultar(
    `INSERT INTO public.especialidades
       (nombre, descripcion, activa)
     VALUES ($1, $2, $3)
     RETURNING id, nombre, descripcion, activa`,
    [
      datos.nombre,
      datos.descripcion ?? null,
      datos.activa ?? true
    ]
  );

  return resultado.rows[0];
};

// ========================================
// Actualización completa - PUT
// ========================================

const actualizarEspecialidad = async (id, datos) => {
  const resultado = await consultar(
    `UPDATE public.especialidades
     SET nombre = $1,
         descripcion = $2,
         activa = $3
     WHERE id = $4
     RETURNING id, nombre, descripcion, activa`,
    [
      datos.nombre,
      datos.descripcion ?? null,
      datos.activa,
      id
    ]
  );

  return resultado.rows[0] ?? null;
};

// ========================================
// Actualización parcial - PATCH
// ========================================

const actualizarEspecialidadParcial = async (id, datos) => {
  const resultado = await consultar(
    `UPDATE public.especialidades
     SET nombre = CASE
           WHEN $2::boolean THEN $3
           ELSE nombre
         END,
         descripcion = CASE
           WHEN $4::boolean THEN $5
           ELSE descripcion
         END,
         activa = CASE
           WHEN $6::boolean THEN $7
           ELSE activa
         END
     WHERE id = $1
     RETURNING id, nombre, descripcion, activa`,
    [
      id,
      Object.hasOwn(datos, "nombre"),
      datos.nombre ?? null,
      Object.hasOwn(datos, "descripcion"),
      datos.descripcion ?? null,
      Object.hasOwn(datos, "activa"),
      datos.activa ?? null
    ]
  );

  return resultado.rows[0] ?? null;
};

// ========================================
// Eliminar
// ========================================

const eliminarEspecialidad = async (id) => {
  const resultado = await consultar(
    `DELETE FROM public.especialidades
     WHERE id = $1
     RETURNING id, nombre, descripcion, activa`,
    [id]
  );

  return resultado.rows[0] ?? null;
};

module.exports = {
  obtenerEspecialidades,
  obtenerEspecialidadPorId,
  buscarEspecialidadPorNombre,
  crearEspecialidad,
  actualizarEspecialidad,
  actualizarEspecialidadParcial,
  eliminarEspecialidad
};
