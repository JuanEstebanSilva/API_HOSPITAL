
const { matchedData } = require("express-validator");

const especialidadesService =
  require("../services/especialidades.service");

const { consultar } = require("../config/database");

// ========================================
// Manejo de errores de PostgreSQL
// ========================================

const manejarErrorBD = (error, res, next) => {
  // Violación de restricción UNIQUE
  if (error.code === "23505") {
    return res.status(409).json({
      mensaje: "Ya existe una especialidad con ese nombre"
    });
  }

  // Violación de clave foránea
  if (error.code === "23503") {
    return res.status(409).json({
      mensaje:
        "No se puede eliminar la especialidad porque tiene médicos asociados"
    });
  }

  return next(error);
};

// ========================================
// GET todas
// ========================================

const obtenerEspecialidades = async (req, res, next) => {
  try {
    const especialidades =
      await especialidadesService.obtenerEspecialidades();

    return res.status(200).json(especialidades);
  } catch (error) {
    return next(error);
  }
};

// ========================================
// GET por ID
// ========================================

const obtenerEspecialidadPorId = async (req, res, next) => {
  try {
    const { id } = req.params;

    const especialidad =
      await especialidadesService.obtenerEspecialidadPorId(id);

    if (!especialidad) {
      return res.status(404).json({
        mensaje: "Especialidad no encontrada"
      });
    }

    return res.status(200).json(especialidad);
  } catch (error) {
    return next(error);
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

    const existente =
      await especialidadesService.buscarEspecialidadPorNombre(
        datosPermitidos.nombre
      );

    if (existente) {
      return res.status(409).json({
        mensaje: "Ya existe una especialidad con ese nombre"
      });
    }

    const especialidadCreada =
      await especialidadesService.crearEspecialidad(
        datosPermitidos
      );

    return res.status(201).json({
      mensaje: "Especialidad creada correctamente",
      especialidad: especialidadCreada
    });
  } catch (error) {
    return manejarErrorBD(error, res, next);
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

    const existente =
      await especialidadesService.buscarEspecialidadPorNombre(
        datosPermitidos.nombre
      );

    if (existente && existente.id !== Number(id)) {
      return res.status(409).json({
        mensaje: "Ya existe otra especialidad con ese nombre"
      });
    }

    const especialidadActualizada =
      await especialidadesService.actualizarEspecialidad(
        id,
        datosPermitidos
      );

    if (!especialidadActualizada) {
      return res.status(404).json({
        mensaje: "Especialidad no encontrada"
      });
    }

    return res.status(200).json({
      mensaje: "Especialidad actualizada correctamente",
      especialidad: especialidadActualizada
    });
  } catch (error) {
    return manejarErrorBD(error, res, next);
  }
};

// ========================================
// PATCH
// ========================================

const actualizarEspecialidadParcial = async (
  req,
  res,
  next
) => {
  try {
    const { id } = req.params;

    const datosPermitidos = matchedData(req, {
      locations: ["body"]
    });

    if (Object.keys(datosPermitidos).length === 0) {
      return res.status(400).json({
        mensaje:
          "Debe enviar al menos un campo para actualizar"
      });
    }

    if (datosPermitidos.nombre !== undefined) {
      const existente =
        await especialidadesService.buscarEspecialidadPorNombre(
          datosPermitidos.nombre
        );

      if (existente && existente.id !== Number(id)) {
        return res.status(409).json({
          mensaje: "Ya existe otra especialidad con ese nombre"
        });
      }
    }

    const especialidadActualizada =
      await especialidadesService.actualizarEspecialidadParcial(
        id,
        datosPermitidos
      );

    if (!especialidadActualizada) {
      return res.status(404).json({
        mensaje: "Especialidad no encontrada"
      });
    }

    return res.status(200).json({
      mensaje: "Especialidad actualizada parcialmente",
      especialidad: especialidadActualizada
    });
  } catch (error) {
    return manejarErrorBD(error, res, next);
  }
};

// ========================================
// DELETE
// ========================================

const eliminarEspecialidad = async (req, res, next) => {
  try {
    const { id } = req.params;

    const especialidad =
      await especialidadesService.obtenerEspecialidadPorId(id);

    if (!especialidad) {
      return res.status(404).json({
        mensaje: "Especialidad no encontrada"
      });
    }

    // Comprobar la relación real en PostgreSQL
    const resultado = await consultar(
      `SELECT EXISTS (
         SELECT 1
         FROM public.medicos
         WHERE especialidad_id = $1
       ) AS tiene_medicos`,
      [id]
    );

    if (resultado.rows[0].tiene_medicos) {
      return res.status(409).json({
        mensaje:
          "No se puede eliminar la especialidad porque tiene médicos asociados"
      });
    }

    const especialidadEliminada =
      await especialidadesService.eliminarEspecialidad(id);

    if (!especialidadEliminada) {
      return res.status(404).json({
        mensaje: "Especialidad no encontrada"
      });
    }

    return res.status(200).json({
      mensaje: "Especialidad eliminada correctamente",
      especialidad: especialidadEliminada
    });
  } catch (error) {
    return manejarErrorBD(error, res, next);
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
