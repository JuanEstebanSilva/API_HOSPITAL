const {
  matchedData
} = require("express-validator");

const especialidadesService =
  require(
    "../services/especialidades.service"
  );

const medicosService =
 require("../services/medicos.service");


// ========================================
// GET todas
// ========================================

const obtenerEspecialidades = (
  req,
  res
) => {
  const especialidades =
    especialidadesService
      .obtenerEspecialidades();

  res
    .status(200)
    .json(especialidades);
};

// ========================================
// GET por ID
// ========================================

const obtenerEspecialidadPorId = (
  req,
  res
) => {
  const { id } =
    req.params;

  const especialidad =
    especialidadesService
      .obtenerEspecialidadPorId(id);

  if (!especialidad) {
    return res
      .status(404)
      .json({
        mensaje:
          "Especialidad no encontrada"
      });
  }

  res
    .status(200)
    .json(especialidad);
};

// ========================================
// POST
// ========================================

const crearEspecialidad = (
  req,
  res
) => {
  const datosPermitidos =
    matchedData(
      req,
      {
        locations: ["body"]
      }
    );

  const existente =
    especialidadesService
      .buscarEspecialidadPorNombre(
        datosPermitidos.nombre
      );

  if (existente) {
    return res
      .status(409)
      .json({
        mensaje:
          "Ya existe una especialidad con ese nombre"
      });
  }

  const especialidadCreada =
    especialidadesService
      .crearEspecialidad(
        datosPermitidos
      );

  res
    .status(201)
    .json({
      mensaje:
        "Especialidad creada correctamente",

      especialidad:
        especialidadCreada
    });
};

// ========================================
// PUT
// ========================================

const actualizarEspecialidad = (
  req,
  res
) => {
  const { id } =
    req.params;

  const datosPermitidos =
    matchedData(
      req,
      {
        locations: ["body"]
      }
    );

  const existente =
    especialidadesService
      .buscarEspecialidadPorNombre(
        datosPermitidos.nombre
      );

  if (
    existente &&
    existente.id !== Number(id)
  ) {
    return res
      .status(409)
      .json({
        mensaje:
          "Ya existe otra especialidad con ese nombre"
      });
  }

  const especialidadActualizada =
    especialidadesService
      .actualizarEspecialidad(
        id,
        datosPermitidos
      );

  if (!especialidadActualizada) {
    return res
      .status(404)
      .json({
        mensaje:
          "Especialidad no encontrada"
      });
  }

  res
    .status(200)
    .json({
      mensaje:
        "Especialidad actualizada correctamente",

      especialidad:
        especialidadActualizada
    });
};

// ========================================
// PATCH
// ========================================

const actualizarEspecialidadParcial = (
  req,
  res
) => {
  const { id } =
    req.params;

  const datosPermitidos =
    matchedData(
      req,
      {
        locations: ["body"]
      }
    );

  if (
    Object.keys(
      datosPermitidos
    ).length === 0
  ) {
    return res
      .status(400)
      .json({
        mensaje:
          "Debe enviar al menos un campo para actualizar"
      });
  }

  if (datosPermitidos.nombre) {
    const existente =
      especialidadesService
        .buscarEspecialidadPorNombre(
          datosPermitidos.nombre
        );

    if (
      existente &&
      existente.id !== Number(id)
    ) {
      return res
        .status(409)
        .json({
          mensaje:
            "Ya existe otra especialidad con ese nombre"
        });
    }
  }

  const especialidadActualizada =
    especialidadesService
      .actualizarEspecialidadParcial(
        id,
        datosPermitidos
      );

  if (!especialidadActualizada) {
    return res
      .status(404)
      .json({
        mensaje:
          "Especialidad no encontrada"
      });
  }

  res
    .status(200)
    .json({
      mensaje:
        "Especialidad actualizada parcialmente",

      especialidad:
        especialidadActualizada
    });
};

// ========================================
// DELETE
// ========================================

const eliminarEspecialidad = (req, res) => {
 const { id } = req.params;
 const especialidad =
 especialidadesService.obtenerEspecialidadPorId(id);
 if (!especialidad) {
 return res.status(404).json({
 mensaje: "Especialidad no encontrada"
 });
 }
 const tieneMedicos =
 medicosService.especialidadTieneMedicos(id);
 if (tieneMedicos) {
 return res.status(409).json({
 mensaje:
 "No se puede eliminar la especialidad porque tiene médicos asociados"
 });
 }
 const especialidadEliminada =
 especialidadesService.eliminarEspecialidad(id);
 return res.status(200).json({
 mensaje: "Especialidad eliminada correctamente",
 especialidad: especialidadEliminada
 });
};


module.exports = {
  obtenerEspecialidades,
  obtenerEspecialidadPorId,
  crearEspecialidad,
  actualizarEspecialidad,
  actualizarEspecialidadParcial,
  eliminarEspecialidad
};