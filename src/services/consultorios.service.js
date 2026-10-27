
const { consultar } = require("../config/database");

const columnas = `
  id, codigo, nombre, piso, ubicacion, activo
`;

const obtenerConsultorios = async () => {
  const resultado = await consultar(`
    SELECT ${columnas}
    FROM public.consultorios
    ORDER BY id
  `);
  return resultado.rows;
};

const obtenerConsultorioPorId = async (id) => {
  const resultado = await consultar(
    `SELECT ${columnas}
     FROM public.consultorios
     WHERE id = $1`,
    [id]
  );
  return resultado.rows[0] ?? null;
};

const buscarConsultorioPorCodigo = async (codigo) => {
  const resultado = await consultar(
    `SELECT ${columnas}
     FROM public.consultorios
     WHERE LOWER(codigo) = LOWER($1)
     LIMIT 1`,
    [codigo]
  );
  return resultado.rows[0] ?? null;
};

const crearConsultorio = async (datos) => {
  const resultado = await consultar(
    `INSERT INTO public.consultorios (
      codigo, nombre, piso, ubicacion, activo
    )
    VALUES ($1, $2, $3, $4, $5)
    RETURNING ${columnas}`,
    [
      datos.codigo,
      datos.nombre,
      datos.piso,
      datos.ubicacion,
      datos.activo ?? true
    ]
  );
  return resultado.rows[0];
};

const actualizarConsultorio = async (id, datos) => {
  const resultado = await consultar(
    `UPDATE public.consultorios
     SET codigo = $1,
         nombre = $2,
         piso = $3,
         ubicacion = $4,
         activo = $5
     WHERE id = $6
     RETURNING ${columnas}`,
    [
      datos.codigo,
      datos.nombre,
      datos.piso,
      datos.ubicacion,
      datos.activo,
      id
    ]
  );
  return resultado.rows[0] ?? null;
};

const actualizarConsultorioParcial = async (id, datos) => {
  const campos = {
    codigo: "codigo",
    nombre: "nombre",
    piso: "piso",
    ubicacion: "ubicacion",
    activo: "activo"
  };

  const cambios = Object.entries(datos)
    .filter(([campo]) =>
      Object.hasOwn(campos, campo)
    );

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
    `UPDATE public.consultorios
     SET ${asignaciones.join(", ")}
     WHERE id = $1
     RETURNING ${columnas}`,
    parametros
  );

  return resultado.rows[0] ?? null;
};

const eliminarConsultorio = async (id) => {
  const resultado = await consultar(
    `DELETE FROM public.consultorios
     WHERE id = $1
     RETURNING ${columnas}`,
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
