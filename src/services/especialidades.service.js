const { consultar } = require("../config/database");

// ========================================
// Obtener todas las especialidades
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
// Obtener especialidad por ID
// ========================================
const obtenerEspecialidadPorId = async (id) => {
  const resultado = await consultar(
    `
    SELECT id, nombre, descripcion, activa
    FROM public.especialidades
    WHERE id = $1
    `,
    [id]
  );
  return resultado.rows[0] ?? null;
};

// ========================================
// Buscar especialidad por nombre (Case-Insensitive)
// ========================================
const buscarEspecialidadPorNombre = async (nombre) => {
  const resultado = await consultar(
    `
    SELECT id, nombre, descripcion, activa
    FROM public.especialidades
    WHERE LOWER(nombre) = LOWER($1)
    `,
    [nombre]
  );
  return resultado.rows[0] ?? null;
};

// ========================================
// Crear especialidad
// ========================================
const crearEspecialidad = async (datos) => {
  const activa = datos.activa !== undefined ? datos.activa : true;
  const descripcion = datos.descripcion ?? null;

  const resultado = await consultar(
    `
    INSERT INTO public.especialidades (nombre, descripcion, activa)
    VALUES ($1, $2, $3)
    RETURNING id, nombre, descripcion, activa
    `,
    [datos.nombre, descripcion, activa]
  );
  return resultado.rows[0];
};

// ========================================
// Actualización completa - PUT
// ========================================
const actualizarEspecialidad = async (id, datos) => {
  const activa = datos.activa !== undefined ? datos.activa : true;
  const descripcion = datos.descripcion ?? null;

  const resultado = await consultar(
    `
    UPDATE public.especialidades
    SET nombre = $1, descripcion = $2, activa = $3
    WHERE id = $4
    RETURNING id, nombre, descripcion, activa
    `,
    [datos.nombre, descripcion, activa, id]
  );
  return resultado.rows[0] ?? null;
};

// ========================================
// Actualización parcial - PATCH
// ========================================
const actualizarEspecialidadParcial = async (id, datos) => {
  const asignaciones = [];
  const valores = [];
  let contador = 1;

  if (Object.hasOwn(datos, "nombre")) {
    asignaciones.push(`nombre = $${contador++}`);
    valores.push(datos.nombre);
  }

  if (Object.hasOwn(datos, "descripcion")) {
    asignaciones.push(`descripcion = $${contador++}`);
    valores.push(datos.descripcion);
  }

  if (Object.hasOwn(datos, "activa")) {
    asignaciones.push(`activa = $${contador++}`);
    valores.push(datos.activa);
  }

  if (asignaciones.length === 0) {
    return obtenerEspecialidadPorId(id);
  }

  valores.push(id);
  const sql = `
    UPDATE public.especialidades
    SET ${asignaciones.join(", ")}
    WHERE id = $${contador}
    RETURNING id, nombre, descripcion, activa
  `;

  const resultado = await consultar(sql, valores);
  return resultado.rows[0] ?? null;
};

// ========================================
// Eliminar especialidad
// ========================================
const eliminarEspecialidad = async (id) => {
  const resultado = await consultar(
    `
    DELETE FROM public.especialidades
    WHERE id = $1
    RETURNING id, nombre, descripcion, activa
    `,
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