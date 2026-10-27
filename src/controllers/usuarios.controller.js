
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
  crearUsuario
};
