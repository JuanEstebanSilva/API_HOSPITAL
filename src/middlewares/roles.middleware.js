// ========================================
// Autorizar roles
// ========================================
const autorizarRoles = (...rolesPermitidos) => {
  return (req, res, next) => {
    // ------------------------------------
    // Debe existir usuario autenticado
    // ------------------------------------
    if (!req.usuario) {
      return res.status(401).json({
        mensaje: "Usuario no autenticado"
      });
    }

    // ------------------------------------
    // Verificar rol
    // ------------------------------------
    if (!rolesPermitidos.includes(req.usuario.rol)) {
      return res.status(403).json({
        mensaje: "No tiene permisos para realizar esta operación"
      });
    }

    next();
  };
};

module.exports = autorizarRoles;
