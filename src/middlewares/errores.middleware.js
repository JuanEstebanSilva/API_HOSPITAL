const rutaNoEncontrada = (req, res) => {
  res.status(404).json({ mensaje: "Ruta no encontrada" });
};

const manejarError = (error, req, res, next) => {
  if (res.headersSent) return next(error);

  const codigo = String(error?.code || "");
  const mensaje = String(error?.message || "");
  const errorConexion = ["28P01", "08000", "08001", "08003", "08004", "08006", "08007", "08P01", "57P01", "57P02", "57P03"].includes(codigo)
    || /ECIRCUITBREAKER|too many authentication failures|new connections are temporarily blocked/i.test(mensaje);

  if (errorConexion) {
    console.error(`[PostgreSQL] Fallo de conexión (${codigo || "sin código"}). Verificar DATABASE_URL y estado de Supabase.`);
    res.set("Cache-Control", "no-store");
    return res.status(503).json({
      mensaje: "El servicio de base de datos no está disponible. Contacte al administrador o intente más tarde."
    });
  }

  console.error(error);
  return res.status(500).json({ mensaje: "Error interno del servidor" });
};

module.exports = { rutaNoEncontrada, manejarError };