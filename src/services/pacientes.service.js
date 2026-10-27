
const { consultar } = require("../config/database");

const columnas = `
  id,
  usuario_id AS "usuarioId",
  nombre,
  documento,
  email,
  telefono,
  fecha_nacimiento AS "fechaNacimiento"
`;

const obtenerPacientes = async () => {
  const resultado = await consultar(`
    SELECT ${columnas}
    FROM public.pacientes
    ORDER BY id
  `);
  return resultado.rows;
};

const obtenerPacientePorId = async (id) => {
  const resultado = await consultar(
    `SELECT ${columnas}
     FROM public.pacientes
     WHERE id = $1`,
    [id]
  );
  return resultado.rows[0] ?? null;
};

const obtenerPacientePorUsuarioId = async (usuarioId) => {
  if (usuarioId == null) return null;

  const resultado = await consultar(
    `SELECT ${columnas}
     FROM public.pacientes
     WHERE usuario_id = $1`,
    [usuarioId]
  );
  return resultado.rows[0] ?? null;
};

const buscarPacientePorDocumento = async (documento) => {
  const resultado = await consultar(
    `SELECT ${columnas}
     FROM public.pacientes
     WHERE documento = $1
     LIMIT 1`,
    [documento]
  );
  return resultado.rows[0] ?? null;
};

const crearPaciente = async (datos) => {
  const resultado = await consultar(
    `INSERT INTO public.pacientes (
      usuario_id, nombre, documento,
      email, telefono, fecha_nacimiento
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING ${columnas}`,
    [
      datos.usuarioId ?? null,
      datos.nombre,
      datos.documento,
      datos.email,
      datos.telefono ?? null,
      datos.fechaNacimiento ?? null
    ]
  );

  return resultado.rows[0];
};

const actualizarPaciente = async (id, datos) => {
  const resultado = await consultar(
    `UPDATE public.pacientes
     SET usuario_id = $1,
         nombre = $2,
         documento = $3,
         email = $4,
         telefono = $5,
         fecha_nacimiento = $6
     WHERE id = $7
     RETURNING ${columnas}`,
    [
      datos.usuarioId ?? null,
      datos.nombre,
      datos.documento,
      datos.email,
      datos.telefono ?? null,
      datos.fechaNacimiento ?? null,
      id
    ]
  );

  return resultado.rows[0] ?? null;
};

const actualizarPacienteParcial = async (id, datos) => {
  const campos = {
    usuarioId: "usuario_id",
    nombre: "nombre",
    documento: "documento",
    email: "email",
    telefono: "telefono",
    fechaNacimiento: "fecha_nacimiento"
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
    `UPDATE public.pacientes
     SET ${asignaciones.join(", ")}
     WHERE id = $1
     RETURNING ${columnas}`,
    parametros
  );

  return resultado.rows[0] ?? null;
};

const eliminarPaciente = async (id) => {
  const resultado = await consultar(
    `DELETE FROM public.pacientes
     WHERE id = $1
     RETURNING ${columnas}`,
    [id]
  );
  return resultado.rows[0] ?? null;
};

module.exports = {
  obtenerPacientes,
  obtenerPacientePorId,
  obtenerPacientePorUsuarioId,
  buscarPacientePorDocumento,
  crearPaciente,
  actualizarPaciente,
  actualizarPacienteParcial,
  eliminarPaciente
};
