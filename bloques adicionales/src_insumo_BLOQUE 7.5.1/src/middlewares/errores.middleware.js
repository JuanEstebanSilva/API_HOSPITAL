const rutaNoEncontrada = (
  req,
  res
) => {
  res.status(404).json({
    mensaje:
      "Ruta no encontrada"
  });
};

const manejarError = (
  error,
  req,
  res,
  next
) => {
  console.error(error);

  res.status(500).json({
    mensaje:
      "Error interno del servidor"
  });
};

module.exports = {
  rutaNoEncontrada,
  manejarError
};