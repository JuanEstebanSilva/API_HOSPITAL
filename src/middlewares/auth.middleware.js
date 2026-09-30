const { verificarToken } = require("../utils/jwt.util");

// ========================================
// Autenticar mediante JWT
// ========================================
const autenticarJWT = (req, res, next) => {
  // --------------------------------------
  // Obtener Header (compatible con minúsculas y mayúsculas)
  // --------------------------------------
  const authorization =
    req.get("authorization") || req.get("Authorization");

  if (!authorization) {
    return res.status(401).json({
      mensaje: "Token de autenticación requerido"
    });
  }

  // --------------------------------------
  // Normalizar y extraer el token limpio
  // Evita fallos si Swagger envía "Bearer Bearer <token>" o solo "<token>"
  // --------------------------------------
  let token = authorization.trim();

  // Si incluye 'Bearer', extrae solo la porción del token real
  if (token.toLowerCase().startsWith("bearer")) {
    token = token.replace(/^bearer\s+/i, "").trim();
    // Por si en Swagger pegaron "Bearer" dos veces
    if (token.toLowerCase().startsWith("bearer")) {
      token = token.replace(/^bearer\s+/i, "").trim();
    }
  }

  if (!token) {
    return res.status(401).json({
      mensaje: "Formato de token inválido"
    });
  }

  try {
    // ------------------------------------
    // Verificar firma y expiración
    // ------------------------------------
    const payload = verificarToken(token);

    // ------------------------------------
    // Asociar usuario a la petición
    // ------------------------------------
    req.usuario = {
      id: Number(payload.sub),
      email: payload.email,
      rol: payload.rol
    };

    next();
  } catch (error) {
    // Imprime en terminal la causa exacta (firma inválida, secreto incorrecto, etc.)
    console.error("Fallo al verificar JWT:", error.message);

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        mensaje: "Token expirado"
      });
    }

    return res.status(401).json({
      mensaje: "Token inválido"
    });
  }
};

module.exports = autenticarJWT;