const { consultar } = require("../config/database");

// ========================================
// Columnas estándar
// ========================================
const COLUMNAS_CONSULTORIO = `
  id,
  codigo,
  nombre,
  piso,
  ubicacion,
  activo
`;

// ========================================
// Obtener todos
// ========================================
const obtenerConsultorios = async () => {
  const resultado = await consultar(`
    SELECT ${COLUMNAS_CONSULTORIO}
    FROM public.consultorios
    ORDER BY id
  `);
  return resultado.rows;
};

// ========================================
// Obtener por ID
// ========================================
const obtenerConsultorioPorId = async (id) => {
  const resultado = await consultar(
    `
    SELECT ${COLUMNAS_CONSULTORIO}
    FROM public.consultorios
    WHERE id = $1
    `,
    [id]
  );
  return resultado.rows[0] ?? null;
};

// ========================================
// Buscar por código (Case-Insensitive)
// ========================================
const buscarConsultorioPorCodigo = async (codigo) => {
  const resultado = await consultar(
    `
    SELECT ${COLUMNAS_CONSULTORIO}
    FROM public.consultorios
    WHERE LOWER(codigo) = LOWER($1)
    `,
    [codigo]
  );
  return resultado.rows[0] ?? null;
};

// ========================================
// Crear consultorio
// ========================================
const crearConsultorio = async (datos) => {
  const ubicacion = datos.ubicacion ?? null;
  const activo = datos.activo !== undefined ? datos.activo : true;

  const resultado = await consultar(
    `
    INSERT INTO public.consultorios (
      codigo,
      nombre,
      piso,
      ubicacion,
      activo
    )
    VALUES ($1, $2, $3, $4, $5)
    RETURNING ${COLUMNAS_CONSULTORIO}
    `,
    [datos.codigo, datos.nombre, datos.piso, ubicacion, activo]
  );
  return resultado.rows[0];
};

// ========================================
// PUT - Actualización completa
// ========================================
const actualizarConsultorio = async (id, datos) => {
  const ubicacion = datos.ubicacion ?? null;
  const activo = datos.activo !== undefined ? datos.activo : true;

  const resultado = await consultar(
    `
    UPDATE public.consultorios
    SET
      codigo = $1,
      nombre = $2,
      piso = $3,
      ubicacion = $4,
      activo = $5
    WHERE id = $6
    RETURNING ${COLUMNAS_CONSULTORIO}
    `,
    [datos.codigo, datos.nombre, datos.piso, ubicacion, activo, id]
  );
  return resultado.rows[0] ?? null;
};

// ========================================
// PATCH - Actualización parcial
// ========================================
const actualizarConsultorioParcial = async (id, datos) => {
  const asignaciones = [];
  const valores = [];
  let contador = 1;

  if (Object.hasOwn(datos, "codigo")) {
    asignaciones.push(`codigo = $${contador++}`);
    valores.push(datos.codigo);
  }

  if (Object.hasOwn(datos, "nombre")) {
    asignaciones.push(`nombre = $${contador++}`);
    valores.push(datos.nombre);
  }

  if (Object.hasOwn(datos, "piso")) {
    asignaciones.push(`piso = $${contador++}`);
    valores.push(datos.piso);
  }

  if (Object.hasOwn(datos, "ubicacion")) {
    asignaciones.push(`ubicacion = $${contador++}`);
    valores.push(datos.ubicacion ?? null);
  }

  if (Object.hasOwn(datos, "activo")) {
    asignaciones.push(`activo = $${contador++}`);
    valores.push(datos.activo);
  }

  if (asignaciones.length === 0) {
    return obtenerConsultorioPorId(id);
  }

  valores.push(id);
  const sql = `
    UPDATE public.consultorios
    SET ${asignaciones.join(", ")}
    WHERE id = $${contador}
    RETURNING ${COLUMNAS_CONSULTORIO}
  `;

  const resultado = await consultar(sql, valores);
  return resultado.rows[0] ?? null;
};

// ========================================
// Eliminar consultorio
// ========================================
const eliminarConsultorio = async (id) => {
  const resultado = await consultar(
    `
    DELETE FROM public.consultorios
    WHERE id = $1
    RETURNING ${COLUMNAS_CONSULTORIO}
    `,
    [id]
  );
  return resultado.rows[0] ?? null;
};

module.exports = {
  obtenerConsultorios,
  obtenerConsultorioPorId,
  buscarConsultorioPorCodigo,
  crearConsultorio,
  actualizarConsultorio,
  actualizarConsultorioParcial,
  eliminarConsultorio
};