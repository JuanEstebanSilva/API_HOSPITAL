
const {
  verificarToken
} = require("../utils/jwt.util");

const usuariosService =
  require("../services/usuarios.service");

// ========================================
// Autenticar mediante JWT + PostgreSQL
// ========================================

const autenticarJWT = async (req, res, next) => {
  const authorization = req.get("Authorization");

  // ======================================
  // Header ausente
  // ======================================

  if (!authorization) {
    return res.status(401).json({
      mensaje: "Token de autenticación requerido"
    });
  }

  // ======================================
  // Validar formato Bearer
  // ======================================

  const partes = authorization.trim().split(/\s+/);

  if (
    partes.length !== 2 ||
    partes[0] !== "Bearer" ||
    !partes[1]
  ) {
    return res.status(401).json({
      mensaje: "Formato de token inválido"
    });
  }

  try {
    // ====================================
    // Verificar firma y expiración
    // ====================================

    const payload = verificarToken(partes[1]);

    // ====================================
    // Verificar identificador
    // ====================================

    if (
      typeof payload.sub !== "string" ||
      !/^[1-9]\d*$/.test(payload.sub)
    ) {
      return res.status(401).json({
        mensaje: "Token inválido"
      });
    }

    // ====================================
    // Consultar identidad real
    // ====================================

    const usuario =
      await usuariosService.obtenerUsuarioPorId(
        payload.sub
      );

    if (!usuario) {
      return res.status(401).json({
        mensaje:
          "La cuenta asociada al token no existe"
      });
    }

    // ====================================
    // Comprobar estado de cuenta
    // ====================================

    if (!usuario.activo) {
      return res.status(403).json({
        mensaje: "Usuario deshabilitado"
      });
    }

    // ====================================
    // Utilizar rol vigente en PostgreSQL
    // ====================================

    req.usuario = {
      id: String(usuario.id),
      email: usuario.email,
      rol: usuario.rol
    };

    return next();

  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        mensaje: "Token expirado"
      });
    }

    if (
      error.name === "JsonWebTokenError" ||
      error.name === "NotBeforeError"
    ) {
      return res.status(401).json({
        mensaje: "Token inválido"
      });
    }

    return next(error);
  }
};

module.exports = autenticarJWT;
