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

    // ------------------------------------
    // Verificar email duplicado
    // ------------------------------------
    const usuarioExistente = usuariosService.obtenerUsuarioPorEmail(
      datos.email
    );
    if (usuarioExistente) {
      return res.status(409).json({
        mensaje: "Ya existe un usuario con ese correo electrónico"
      });
    }

    // ------------------------------------
    // Crear usuario
    // ------------------------------------
    const usuario = await usuariosService.crearUsuarioAdministrativo(
      datos
    );

    // ------------------------------------
    // Respuesta segura
    // ------------------------------------
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
    next(error);
  }
};

module.exports = {
  crearUsuario
};
