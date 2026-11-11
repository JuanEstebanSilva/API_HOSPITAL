
const { matchedData } = require("express-validator");

const usuariosService =
  require("../services/usuarios.service");

// ========================================
// Crear usuario administrativo
// ========================================

const crearUsuario = async (req, res, next) => {
  try {
    const datos = matchedData(req, {
      locations: ["body"]
    });

    const usuarioExistente =
      await usuariosService.obtenerUsuarioPorEmail(
        datos.email
      );

    if (usuarioExistente) {
      return res.status(409).json({
        mensaje:
          "Ya existe un usuario con ese correo electrónico"
      });
    }

    const usuario =
      await usuariosService.crearUsuarioAdministrativo(
        datos
      );

    return res.status(201).json({
      mensaje: "Usuario creado correctamente",
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
        activo: usuario.activo
      }
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        mensaje:
          "Ya existe un usuario con ese correo electrónico"
      });
    }

    if (error.codigoAplicacion === "ROL_INVALIDO") {
      return res.status(400).json({
        mensaje: error.message
      });
    }

    return next(error);
  }
};

module.exports = {
  crearUsuario,
  buscarUsuariosRecuperacion: async (req, res, next) => {
    try {
      const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
      if (q.length < 2 || q.length > 100) {
        return res.status(400).json({ mensaje: "Escriba entre 2 y 100 caracteres para buscar." });
      }
      const patron = q.toLowerCase();
      const { consultar } = require("../config/database");
      const resultado = await consultar(
        `SELECT u.id, u.nombre, u.email, r.nombre AS rol
           FROM public.usuarios u
           INNER JOIN public.roles r ON r.id = u.rol_id
          WHERE u.activo = TRUE
            AND (POSITION($1 IN LOWER(u.nombre)) > 0 OR POSITION($1 IN LOWER(u.email)) > 0)
          ORDER BY u.nombre, u.id
          LIMIT 20`,
        [patron]
      );
      res.set("Cache-Control", "no-store");
      return res.status(200).json({ usuarios: resultado.rows });
    } catch (error) {
      return next(error);
    }
  },
  listarUsuarios: async (req, res, next) => {
    try {
      const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
      const rol = typeof req.query.rol === "string" ? req.query.rol : "";
      const activo = typeof req.query.activo === "string" ? req.query.activo : "";
      const pagina = Number(req.query.pagina || 1);
      if (q.length > 100 || !["", "administrador", "medico", "paciente"].includes(rol) ||
        !["", "true", "false"].includes(activo) || !Number.isSafeInteger(pagina) || pagina < 1 || pagina > 100000) {
        return res.status(400).json({ mensaje: "Filtros inválidos" });
      }
      const { consultar } = require("../config/database");
      const parametros = [`%${q.toLowerCase()}%`, rol || null, activo === "" ? null : activo === "true"];
      const filtro = `FROM public.usuarios u JOIN public.roles r ON r.id = u.rol_id
        WHERE (LOWER(u.nombre) LIKE $1 OR LOWER(u.email) LIKE $1)
        AND ($2::text IS NULL OR r.nombre = $2)
        AND ($3::boolean IS NULL OR u.activo = $3)`;
      const total = await consultar(`SELECT COUNT(*)::integer AS total ${filtro}`, parametros);
      const resultado = await consultar(`SELECT u.id, u.nombre, u.email, r.nombre AS rol, u.activo, u.fecha_registro
        ${filtro} ORDER BY u.id DESC LIMIT 20 OFFSET $4`, [...parametros, (pagina - 1) * 20]);
      res.set("Cache-Control", "no-store");
      return res.status(200).json({ usuarios: resultado.rows, total: total.rows[0].total, pagina, porPagina: 20 });
    } catch (error) { return next(error); }
  },
  actualizarUsuario: async (req, res, next) => {
    try {
      if (!/^[1-9]\d*$/.test(req.params.id)) return res.status(400).json({ mensaje: "ID inválido" });
      const { nombre, email } = matchedData(req, { locations: ["body"] });
      const { consultar } = require("../config/database");
      const resultado = await consultar(`UPDATE public.usuarios SET nombre=$1, email=LOWER($2)
        WHERE id=$3 RETURNING id, nombre, email, activo`, [nombre, email, req.params.id]);
      if (!resultado.rowCount) return res.status(404).json({ mensaje: "Usuario no encontrado" });
      res.set("Cache-Control", "no-store");
      return res.json({ mensaje: "Usuario actualizado", usuario: resultado.rows[0] });
    } catch (error) {
      if (error.code === "23505") return res.status(409).json({ mensaje: "El correo ya está registrado" });
      return next(error);
    }
  },
  cambiarEstadoUsuario: async (req, res, next) => {
    if (!/^[1-9]\d*$/.test(req.params.id)) return res.status(400).json({ mensaje: "ID inválido" });
    const { activo } = matchedData(req, { locations: ["body"] });
    if (!activo && String(req.usuario.id) === String(req.params.id)) {
      return res.status(409).json({ mensaje: "No puede desactivar su propia cuenta" });
    }
    const { pool } = require("../config/database");
    const cliente = await pool.connect();
    try {
      await cliente.query("BEGIN");
      await cliente.query("SELECT pg_advisory_xact_lock($1,$2)", [1252, 1]);
      const actual = await cliente.query(`SELECT u.id, u.activo, r.nombre AS rol
        FROM public.usuarios u JOIN public.roles r ON r.id=u.rol_id WHERE u.id=$1 FOR UPDATE OF u`, [req.params.id]);
      if (!actual.rowCount) { await cliente.query("ROLLBACK"); return res.status(404).json({ mensaje: "Usuario no encontrado" }); }
      const usuario = actual.rows[0];
      if (!activo && usuario.rol === "administrador" && usuario.activo) {
        const conteo = await cliente.query(`SELECT COUNT(*)::int AS total FROM public.usuarios u
          JOIN public.roles r ON r.id=u.rol_id WHERE r.nombre='administrador' AND u.activo=TRUE`);
        if (conteo.rows[0].total <= 1) {
          await cliente.query("ROLLBACK");
          return res.status(409).json({ mensaje: "No se puede desactivar al último administrador activo" });
        }
      }
      const resultado = await cliente.query(`UPDATE public.usuarios
        SET activo=$1, version_sesion=version_sesion+CASE WHEN activo IS DISTINCT FROM $1 THEN 1 ELSE 0 END
        WHERE id=$2 RETURNING id, nombre, email, activo`, [activo, req.params.id]);
      await cliente.query("COMMIT");
      res.set("Cache-Control", "no-store");
      return res.json({ mensaje: "Estado actualizado", usuario: resultado.rows[0] });
    } catch (error) { try { await cliente.query("ROLLBACK"); } catch { } return next(error); }
    finally { cliente.release(); }
  }
};
