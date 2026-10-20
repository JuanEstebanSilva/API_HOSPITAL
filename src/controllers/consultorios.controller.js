const { matchedData } = require("express-validator");
const consultoriosService = require("../services/consultorios.service");
const citasService = require("../services/citas.service");

// ========================================
// GET todos
// ========================================
const obtenerConsultorios = async (req, res, next) => {
  try {
    const consultorios = await consultoriosService.obtenerConsultorios();
    res.status(200).json(consultorios);
  } catch (error) {
    next(error);
  }
};

// ========================================
// GET por ID
// ========================================
const obtenerConsultorioPorId = async (req, res, next) => {
  try {
    const { id } = req.params;
    const consultorio = await consultoriosService.obtenerConsultorioPorId(id);

    if (!consultorio) {
      return res.status(404).json({
        mensaje: "Consultorio no encontrado"
      });
    }

    res.status(200).json(consultorio);
  } catch (error) {
    next(error);
  }
};

// ========================================
// POST - Crear consultorio
// ========================================
const crearConsultorio = async (req, res, next) => {
  try {
    const datosPermitidos = matchedData(req, {
      locations: ["body"]
    });

    const existente = await consultoriosService.buscarConsultorioPorCodigo(
      datosPermitidos.codigo
    );

    if (existente) {
      return res.status(409).json({
        mensaje: "Ya existe un consultorio con ese código"
      });
    }

    const consultorioCreado = await consultoriosService.crearConsultorio(
      datosPermitidos
    );

    res.status(201).json({
      mensaje: "Consultorio creado correctamente",
      consultorio: consultorioCreado
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        mensaje: "Ya existe un consultorio con ese código"
      });
    }
    next(error);
  }
};

// ========================================
// PUT - Actualización completa
// ========================================
const actualizarConsultorio = async (req, res, next) => {
  try {
    const { id } = req.params;
    const datosPermitidos = matchedData(req, {
      locations: ["body"]
    });

    const consultorioActual = await consultoriosService.obtenerConsultorioPorId(id);
    if (!consultorioActual) {
      return res.status(404).json({
        mensaje: "Consultorio no encontrado"
      });
    }

    const codigoExistente = await consultoriosService.buscarConsultorioPorCodigo(
      datosPermitidos.codigo
    );

    if (codigoExistente && String(codigoExistente.id) !== String(id)) {
      return res.status(409).json({
        mensaje: "El código pertenece a otro consultorio"
      });
    }

    const consultorioActualizado = await consultoriosService.actualizarConsultorio(
      id,
      datosPermitidos
    );

    res.status(200).json({
      mensaje: "Consultorio actualizado correctamente",
      consultorio: consultorioActualizado
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        mensaje: "El código pertenece a otro consultorio"
      });
    }
    next(error);
  }
};

// ========================================
// PATCH - Actualización parcial
// ========================================
const actualizarConsultorioParcial = async (req, res, next) => {
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

    const consultorioActual = await consultoriosService.obtenerConsultorioPorId(id);
    if (!consultorioActual) {
      return res.status(404).json({
        mensaje: "Consultorio no encontrado"
      });
    }

    if (datosPermitidos.codigo) {
      const codigoExistente = await consultoriosService.buscarConsultorioPorCodigo(
        datosPermitidos.codigo
      );

      if (codigoExistente && String(codigoExistente.id) !== String(id)) {
        return res.status(409).json({
          mensaje: "El código pertenece a otro consultorio"
        });
      }
    }

    const consultorioActualizado = await consultoriosService.actualizarConsultorioParcial(
      id,
      datosPermitidos
    );

    res.status(200).json({
      mensaje: "Consultorio actualizado parcialmente",
      consultorio: consultorioActualizado
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        mensaje: "El código pertenece a otro consultorio"
      });
    }
    next(error);
  }
};

// ========================================
// DELETE
// ========================================
const eliminarConsultorio = async (req, res, next) => {
  try {
    const { id } = req.params;
    const consultorio = await consultoriosService.obtenerConsultorioPorId(id);
    if (!consultorio) {
      return res.status(404).json({
        mensaje: "Consultorio no encontrado"
      });
    }

    const tieneCitas = await citasService.consultorioTieneCitas(id);
    if (tieneCitas) {
      return res.status(409).json({
        mensaje: "No se puede eliminar el consultorio porque tiene citas asociadas"
      });
    }

    const consultorioEliminado = await consultoriosService.eliminarConsultorio(id);
    return res.status(200).json({
      mensaje: "Consultorio eliminado correctamente",
      consultorio: consultorioEliminado
    });
  } catch (error) {
    if (error.code === "23503") {
      return res.status(409).json({
        mensaje: "No se puede eliminar el consultorio porque tiene citas u otros registros asociados en la base de datos"
      });
    }
    next(error);
  }
};

module.exports = {
  obtenerConsultorios,
  obtenerConsultorioPorId,
  crearConsultorio,
  actualizarConsultorio,
  actualizarConsultorioParcial,
  eliminarConsultorio
};