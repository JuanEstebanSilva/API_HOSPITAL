const { consultar, pool } = require("../config/database");

const {
  generarPasswordHash,
  verificarPassword,
} = require("../utils/password.util");

// ========================================
// Columnas compatibles con la API
// ========================================

const columnasUsuario = `
  u.id,
  u.nombre,
  u.email,
  u.password_hash AS "passwordHash",
  r.nombre AS rol,
  u.activo
`;

// ========================================
// Obtener usuario por email
// ========================================

const obtenerUsuarioPorEmail = async (email) => {
  const resultado = await consultar(
    `SELECT ${columnasUsuario}
     FROM public.usuarios u
     INNER JOIN public.roles r
       ON r.id = u.rol_id
     WHERE LOWER(u.email) = LOWER($1)
     LIMIT 1`,
    [email],
  );

  return resultado.rows[0] ?? null;
};

// ========================================
// Obtener usuario por ID
// ========================================

const obtenerUsuarioPorId = async (id) => {
  const resultado = await consultar(
    `SELECT ${columnasUsuario}
     FROM public.usuarios u
     INNER JOIN public.roles r
       ON r.id = u.rol_id
     WHERE u.id = $1`,
    [id],
  );

  return resultado.rows[0] ?? null;
};

// ========================================
// Inserción controlada de usuario
// ========================================

const insertarUsuario = async ({ nombre, email, password, rol }) => {
  const passwordHash = await generarPasswordHash(password);

  const resultado = await consultar(
    `WITH insertado AS (
       INSERT INTO public.usuarios (
         nombre,
         email,
         password_hash,
         rol_id,
         activo
       )
       SELECT
         $1,
         LOWER($2),
         $3,
         r.id,
         TRUE
       FROM public.roles r
       WHERE r.nombre = $4
         AND r.activo = TRUE
       RETURNING *
     )
     SELECT
       i.id,
       i.nombre,
       i.email,
       i.password_hash AS "passwordHash",
       r.nombre AS rol,
       i.activo
     FROM insertado i
     INNER JOIN public.roles r
       ON r.id = i.rol_id`,
    [nombre, email, passwordHash, rol],
  );

  if (resultado.rows.length === 0) {
    const error = new Error("El rol solicitado no existe o está inactivo");

    error.codigoAplicacion = "ROL_INVALIDO";
    throw error;
  }

  return resultado.rows[0];
};

// ========================================
// Registro público
// El cliente NO decide el rol
// ========================================

const crearUsuario = async (datos) => {
  return insertarUsuario({
    nombre: datos.nombre,
    email: datos.email,
    password: datos.password,
    rol: "paciente",
  });
};

// ========================================
// Creación administrativa
// ========================================

const crearUsuarioAdministrativo = async (datos) => {
  const rolesPermitidos = ["medico", "administrador"];

  if (!rolesPermitidos.includes(datos.rol)) {
    const error = new Error("Rol no permitido para esta operación");

    error.codigoAplicacion = "ROL_INVALIDO";
    throw error;
  }

  return insertarUsuario({
    nombre: datos.nombre,
    email: datos.email,
    password: datos.password,
    rol: datos.rol,
  });
};

// ========================================
// Verificar credenciales
// ========================================

const verificarCredenciales = async (email, password) => {
  const usuario = await obtenerUsuarioPorEmail(email);

  if (!usuario || !usuario.passwordHash) {
    return null;
  }

  const passwordValida = await verificarPassword(
    password,
    usuario.passwordHash,
  );

  if (!passwordValida) {
    return null;
  }

  return usuario;
};

// ========================================
// Bootstrap administrativo
//
// Solo se ejecuta mediante el script.
//
// Reglas:
// 1. No modificar administradores existentes.
// 2. No convertir pacientes o médicos en admin.
// 3. No crear un segundo administrador inicial.
// 4. Usar transacción y bloqueo.
// 5. No devolver contraseñas ni hashes.
// ========================================

const crearAdministradorInicial = async () => {
  const nombre = process.env.ADMIN_NOMBRE?.trim();
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!nombre || !email || !password) {
    throw new Error(
      "Faltan las variables ADMIN_NOMBRE, " + "ADMIN_EMAIL o ADMIN_PASSWORD",
    );
  }

  if (password.length < 12) {
    throw new Error(
      "La contraseña inicial debe tener " + "al menos 12 caracteres",
    );
  }

  // El hash se calcula antes de abrir
  // la transacción para reducir el tiempo
  // que mantenemos bloqueos en PostgreSQL.

  const passwordHash = await generarPasswordHash(password);

  const cliente = await pool.connect();

  let transaccionIniciada = false;

  try {
    await cliente.query("BEGIN");
    transaccionIniciada = true;

    // Bloqueo exclusivo para ejecuciones
    // simultáneas de este mismo bootstrap.

    await cliente.query("SELECT pg_advisory_xact_lock($1, $2)", [7505, 1]);

    // Comprobar si existe cualquier cuenta
    // con rol administrador, incluso inactiva.

    const administradores = await cliente.query(
      `SELECT
         u.id,
         u.nombre,
         u.email,
         u.activo
       FROM public.usuarios u
       INNER JOIN public.roles r
         ON r.id = u.rol_id
       WHERE r.nombre = 'administrador'
       ORDER BY u.id
       LIMIT 1`,
    );

    if (administradores.rows.length > 0) {
      await cliente.query("COMMIT");
      transaccionIniciada = false;

      return {
        creado: false,
        motivo: "ADMINISTRADOR_EXISTENTE",
      };
    }

    // Evitar que una cuenta de otro rol
    // sea convertida en administrador.

    const correoExistente = await cliente.query(
      `SELECT id
       FROM public.usuarios
       WHERE LOWER(email) = LOWER($1)
       LIMIT 1`,
      [email],
    );

    if (correoExistente.rows.length > 0) {
      throw new Error(
        "El correo de bootstrap ya pertenece " +
          "a otro usuario. No se elevarán privilegios.",
      );
    }

    // Verificar rol administrativo activo.

    const rolResultado = await cliente.query(
      `SELECT id
       FROM public.roles
       WHERE nombre = 'administrador'
         AND activo = TRUE
       LIMIT 1`,
    );

    if (rolResultado.rows.length === 0) {
      throw new Error("No existe un rol administrador activo");
    }

    const rolId = rolResultado.rows[0].id;

    // Crear exclusivamente el primer admin.

    const resultado = await cliente.query(
      `INSERT INTO public.usuarios (
         nombre,
         email,
         password_hash,
         rol_id,
         activo
       )
       VALUES ($1, $2, $3, $4, TRUE)
       RETURNING id, nombre, email, activo`,
      [nombre, email, passwordHash, rolId],
    );

    await cliente.query("COMMIT");
    transaccionIniciada = false;

    return {
      creado: true,
      motivo: "ADMINISTRADOR_CREADO",
      usuario: resultado.rows[0],
    };
  } catch (error) {
    if (transaccionIniciada) {
      try {
        await cliente.query("ROLLBACK");
      } catch (rollbackError) {
        console.error("Error al revertir bootstrap:", rollbackError.message);
      }
    }

    throw error;
  } finally {
    cliente.release();
  }
};

// ========================================
// Exportaciones
// ========================================

module.exports = {
  obtenerUsuarioPorEmail,
  obtenerUsuarioPorId,
  crearUsuario,
  crearUsuarioAdministrativo,
  verificarCredenciales,
  crearAdministradorInicial,
};
