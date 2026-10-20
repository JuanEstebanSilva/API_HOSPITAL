const { matchedData } = require("express-validator");
const usuariosService = require("../services/usuarios.service");

// ========================================
// Crear usuario administrativo
// ========================================
const crearUsuario = async (req, res, next) => {
  try {
    const datos = matchedData(req, {
      locations: ["body"]
    });

    // Verificar email duplicado
    const usuarioExistente = await usuariosService.obtenerUsuarioPorEmail(
      datos.email
    );

    if (usuarioExistente) {
      return res.status(409).json({
        mensaje: "Ya existe un usuario con ese correo electrónico"
      });
    }

    // Crear usuario administrativo
    const usuario = await usuariosService.crearUsuarioAdministrativo(
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
        mensaje: "Ya existe un usuario con ese correo electrónico"
      });
    }
    next(error);
  }
};

module.exports = {
  crearUsuario
};
