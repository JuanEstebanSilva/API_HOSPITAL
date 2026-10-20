const { matchedData } = require("express-validator");
const especialidadesService = require("../services/especialidades.service");
const medicosService = require("../services/medicos.service");

// ========================================
// GET todas
// ========================================
const obtenerEspecialidades = async (req, res, next) => {
  try {
    const especialidades = await especialidadesService.obtenerEspecialidades();
    res.status(200).json(especialidades);
  } catch (error) {
    next(error);
  }
};

// ========================================
// GET por ID
// ========================================
const obtenerEspecialidadPorId = async (req, res, next) => {
  try {
    const { id } = req.params;
    const especialidad = await especialidadesService.obtenerEspecialidadPorId(id);

    if (!especialidad) {
      return res.status(404).json({
        mensaje: "Especialidad no encontrada"
      });
    }

    res.status(200).json(especialidad);
  } catch (error) {
    next(error);
  }
};

// ========================================
// POST
// ========================================
const crearEspecialidad = async (req, res, next) => {
  try {
    const datosPermitidos = matchedData(req, {
      locations: ["body"]
    });

    const existente = await especialidadesService.buscarEspecialidadPorNombre(
      datosPermitidos.nombre
    );

    if (existente) {
      return res.status(409).json({
        mensaje: "Ya existe una especialidad con ese nombre"
      });
    }

    const especialidadCreada = await especialidadesService.crearEspecialidad(
      datosPermitidos
    );

    res.status(201).json({
      mensaje: "Especialidad creada correctamente",
      especialidad: especialidadCreada
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        mensaje: "Ya existe una especialidad con ese nombre"
      });
    }
    next(error);
  }
};

// ========================================
// PUT
// ========================================
const actualizarEspecialidad = async (req, res, next) => {
  try {
    const { id } = req.params;
    const datosPermitidos = matchedData(req, {
      locations: ["body"]
    });

    const existente = await especialidadesService.buscarEspecialidadPorNombre(
      datosPermitidos.nombre
    );

    if (existente && String(existente.id) !== String(id)) {
      return res.status(409).json({
        mensaje: "Ya existe otra especialidad con ese nombre"
      });
    }

    const especialidadActualizada = await especialidadesService.actualizarEspecialidad(
      id,
      datosPermitidos
    );

    if (!especialidadActualizada) {
      return res.status(404).json({
        mensaje: "Especialidad no encontrada"
      });
    }

    res.status(200).json({
      mensaje: "Especialidad actualizada correctamente",
      especialidad: especialidadActualizada
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        mensaje: "Ya existe otra especialidad con ese nombre"
      });
    }
    next(error);
  }
};

// ========================================
// PATCH
// ========================================
const actualizarEspecialidadParcial = async (req, res, next) => {
  try {
    const { id } = req.params;
    const datosPermitidos = matchedData(req, {
      locations: ["body"]
    });

    if (Object.keys(datosPermitidos).length === 0) {
      return res.status(400).json({
        mensaje: "Debe enviar al menos un campo para actualizar"
      });
    }

    if (datosPermitidos.nombre) {
      const existente = await especialidadesService.buscarEspecialidadPorNombre(
        datosPermitidos.nombre
      );

      if (existente && String(existente.id) !== String(id)) {
        return res.status(409).json({
          mensaje: "Ya existe otra especialidad con ese nombre"
        });
      }
    }

    const especialidadActualizada = await especialidadesService.actualizarEspecialidadParcial(
      id,
      datosPermitidos
    );

    if (!especialidadActualizada) {
      return res.status(404).json({
        mensaje: "Especialidad no encontrada"
      });
    }

    res.status(200).json({
      mensaje: "Especialidad actualizada parcialmente",
      especialidad: especialidadActualizada
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        mensaje: "Ya existe otra especialidad con ese nombre"
      });
    }
    next(error);
  }
};

// ========================================
// DELETE
// ========================================
const eliminarEspecialidad = async (req, res, next) => {
  try {
    const { id } = req.params;
    const especialidad = await especialidadesService.obtenerEspecialidadPorId(id);
    if (!especialidad) {
      return res.status(404).json({
        mensaje: "Especialidad no encontrada"
      });
    }

    const tieneMedicos = await medicosService.especialidadTieneMedicos(id);
    if (tieneMedicos) {
      return res.status(409).json({
        mensaje: "No se puede eliminar la especialidad porque tiene médicos asociados"
      });
    }

    const especialidadEliminada = await especialidadesService.eliminarEspecialidad(id);
    return res.status(200).json({
      mensaje: "Especialidad eliminada correctamente",
      especialidad: especialidadEliminada
    });
  } catch (error) {
    if (error.code === "23503") {
      return res.status(409).json({
        mensaje: "No se puede eliminar la especialidad porque tiene registros dependientes en la base de datos"
      });
    }
    next(error);
  }
};

module.exports = {
  obtenerEspecialidades,
  obtenerEspecialidadPorId,
  crearEspecialidad,
  actualizarEspecialidad,
  actualizarEspecialidadParcial,
  eliminarEspecialidad
};