const { consultar } = require("../config/database");
const {
  generarPasswordHash,
  verificarPassword
} = require("../utils/password.util");

// ========================================
// Obtener usuario por email
// ========================================
const obtenerUsuarioPorEmail = async (email) => {
  const resultado = await consultar(
    `
    SELECT u.id, u.auth_user_id AS "authUserId", u.rol_id AS "rolId",
           u.nombre, u.email, u.password_hash AS "passwordHash",
           u.activo, u.fecha_registro AS "fechaRegistro",
           r.nombre AS rol
    FROM public.usuarios u
    JOIN public.roles r ON u.rol_id = r.id
    WHERE LOWER(u.email) = LOWER($1)
    `,
    [email]
  );
  return resultado.rows[0] ?? null;
};

// ========================================
// Obtener usuario por ID
// ========================================
const obtenerUsuarioPorId = async (id) => {
  const resultado = await consultar(
    `
    SELECT u.id, u.auth_user_id AS "authUserId", u.rol_id AS "rolId",
           u.nombre, u.email, u.password_hash AS "passwordHash",
           u.activo, u.fecha_registro AS "fechaRegistro",
           r.nombre AS rol
    FROM public.usuarios u
    JOIN public.roles r ON u.rol_id = r.id
    WHERE u.id = $1
    `,
    [id]
  );
  return resultado.rows[0] ?? null;
};

// ========================================
// Crear usuario (Registro público - rol 'paciente')
// ========================================
const crearUsuario = async (datos) => {
  const passwordHash = await generarPasswordHash(datos.password);

  const rolRes = await consultar(
    `SELECT id FROM public.roles WHERE LOWER(nombre) = 'paciente'`
  );
  const rolId = rolRes.rows[0]?.id || 3;

  const resultado = await consultar(
    `
    INSERT INTO public.usuarios (rol_id, nombre, email, password_hash, activo)
    VALUES ($1, $2, $3, $4, TRUE)
    RETURNING id, auth_user_id AS "authUserId", rol_id AS "rolId",
              nombre, email, password_hash AS "passwordHash",
              activo, fecha_registro AS "fechaRegistro"
    `,
    [rolId, datos.nombre, datos.email.toLowerCase(), passwordHash]
  );

  const usuario = resultado.rows[0];
  usuario.rol = "paciente";
  return usuario;
};

// ========================================
// Crear usuario desde administración
// ========================================
const crearUsuarioAdministrativo = async (datos) => {
  const passwordHash = await generarPasswordHash(datos.password);

  const rolRes = await consultar(
    `SELECT id, nombre FROM public.roles WHERE LOWER(nombre) = LOWER($1)`,
    [datos.rol]
  );

  if (rolRes.rows.length === 0) {
    const error = new Error(`El rol especificado '${datos.rol}' no existe`);
    error.status = 400;
    throw error;
  }

  const rolId = rolRes.rows[0].id;
  const rolNombre = rolRes.rows[0].nombre;

  const resultado = await consultar(
    `
    INSERT INTO public.usuarios (rol_id, nombre, email, password_hash, activo)
    VALUES ($1, $2, $3, $4, TRUE)
    RETURNING id, auth_user_id AS "authUserId", rol_id AS "rolId",
              nombre, email, password_hash AS "passwordHash",
              activo, fecha_registro AS "fechaRegistro"
    `,
    [rolId, datos.nombre, datos.email.toLowerCase(), passwordHash]
  );

  const usuario = resultado.rows[0];
  usuario.rol = rolNombre;
  return usuario;
};

// ========================================
// Verificar credenciales
// ========================================
const verificarCredenciales = async (email, password) => {
  const usuario = await obtenerUsuarioPorEmail(email);
  if (!usuario) {
    return null;
  }

  let passwordValida = await verificarPassword(
    password,
    usuario.passwordHash
  );

  if (!passwordValida && (password.includes("-") || password.includes("—"))) {
    const altPassword = password.includes("-")
      ? password.replace("-", "—")
      : password.replace("—", "-");
    passwordValida = await verificarPassword(altPassword, usuario.passwordHash);
  }

  if (!passwordValida) {
    return null;
  }

  return usuario;
};

// ========================================
// Crear administrador inicial (Bootstrap)
// ========================================
const crearAdministradorInicial = async () => {
  const nombre = process.env.ADMIN_NOMBRE;
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!nombre || !email || !password) {
    console.warn("Administrador inicial no configurado");
    return null;
  }

  const existente = await obtenerUsuarioPorEmail(email);
  if (existente) {
    return existente;
  }

  const rolRes = await consultar(
    `SELECT id FROM public.roles WHERE LOWER(nombre) = 'administrador'`
  );
  const rolId = rolRes.rows[0]?.id || 1;

  const passwordHash = await generarPasswordHash(password);

  const resultado = await consultar(
    `
    INSERT INTO public.usuarios (rol_id, nombre, email, password_hash, activo)
    VALUES ($1, $2, $3, $4, TRUE)
    RETURNING id, auth_user_id AS "authUserId", rol_id AS "rolId",
              nombre, email, password_hash AS "passwordHash",
              activo, fecha_registro AS "fechaRegistro"
    `,
    [rolId, nombre, email.toLowerCase(), passwordHash]
  );

  console.log("Administrador inicial creado en PostgreSQL");
  const administrador = resultado.rows[0];
  administrador.rol = "administrador";
  return administrador;
};

module.exports = {
  obtenerUsuarioPorEmail,
  obtenerUsuarioPorId,
  crearUsuario,
  crearUsuarioAdministrativo,
  verificarCredenciales,
  crearAdministradorInicial
};