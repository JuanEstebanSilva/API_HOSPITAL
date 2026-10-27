
const { matchedData } = require("express-validator");

const consultoriosService =
  require("../services/consultorios.service");

const citasService =
  require("../services/citas.service");

const mismoId = (a, b) =>
  a != null && b != null && String(a) === String(b);

const manejarError = (error, res, next) => {
  if (error.code === "23505") {
    return res.status(409).json({
      mensaje: "Ya existe un consultorio con ese código"
    });
  }

  if (error.code === "23503") {
    return res.status(409).json({
      mensaje:
        "El consultorio tiene registros relacionados"
    });
  }

  if (["23502", "23514", "22P02"].includes(error.code)) {
    return res.status(400).json({
      mensaje: "Datos del consultorio inválidos"
    });
  }

  return next(error);
};

// GET todos
const obtenerConsultorios = async (req, res, next) => {
  try {
    const consultorios =
      await consultoriosService.obtenerConsultorios();

    return res.status(200).json(consultorios);
  } catch (error) {
    return next(error);
  }
};

// GET por ID
const obtenerConsultorioPorId = async (
  req, res, next
) => {
  try {
    const consultorio =
      await consultoriosService.obtenerConsultorioPorId(
        req.params.id
      );

    if (!consultorio) {
      return res.status(404).json({
        mensaje: "Consultorio no encontrado"
      });
    }

    return res.status(200).json(consultorio);
  } catch (error) {
    return manejarError(error, res, next);
  }
};

// POST
const crearConsultorio = async (req, res, next) => {
  try {
    const datos = matchedData(req, {
      locations: ["body"]
    });

    const existente =
      await consultoriosService.buscarConsultorioPorCodigo(
        datos.codigo
      );

    if (existente) {
      return res.status(409).json({
        mensaje:
          "Ya existe un consultorio con ese código"
      });
    }

    const consultorio =
      await consultoriosService.crearConsultorio(datos);

    return res.status(201).json({
      mensaje: "Consultorio creado correctamente",
      consultorio
    });
  } catch (error) {
    return manejarError(error, res, next);
  }
};

// PUT
const actualizarConsultorio = async (
  req, res, next
) => {
  try {
    const { id } = req.params;
    const datos = matchedData(req, {
      locations: ["body"]
    });

    const actual =
      await consultoriosService.obtenerConsultorioPorId(id);

    if (!actual) {
      return res.status(404).json({
        mensaje: "Consultorio no encontrado"
      });
    }

    const existente =
      await consultoriosService.buscarConsultorioPorCodigo(
        datos.codigo
      );

    if (existente && !mismoId(existente.id, id)) {
      return res.status(409).json({
        mensaje: "El código pertenece a otro consultorio"
      });
    }

    const consultorio =
      await consultoriosService.actualizarConsultorio(
        id, datos
      );

    if (!consultorio) {
      return res.status(404).json({
        mensaje: "Consultorio no encontrado"
      });
    }

    return res.status(200).json({
      mensaje: "Consultorio actualizado correctamente",
      consultorio
    });
  } catch (error) {
    return manejarError(error, res, next);
  }
};

// PATCH
const actualizarConsultorioParcial = async (
  req, res, next
) => {
  try {
    const { id } = req.params;
    const datos = matchedData(req, {
      locations: ["body"]
    });

    if (Object.keys(datos).length === 0) {
      return res.status(400).json({
        mensaje:
          "Debe enviar al menos un campo para actualizar"
      });
    }

    const actual =
      await consultoriosService.obtenerConsultorioPorId(id);

    if (!actual) {
      return res.status(404).json({
        mensaje: "Consultorio no encontrado"
      });
    }

    if (Object.hasOwn(datos, "codigo")) {
      const existente =
        await consultoriosService.buscarConsultorioPorCodigo(
          datos.codigo
        );

      if (existente && !mismoId(existente.id, id)) {
        return res.status(409).json({
          mensaje: "El código pertenece a otro consultorio"
        });
      }
    }

    const consultorio =
      await consultoriosService.actualizarConsultorioParcial(
        id, datos
      );

    if (!consultorio) {
      return res.status(404).json({
        mensaje: "Consultorio no encontrado"
      });
    }

    return res.status(200).json({
      mensaje: "Consultorio actualizado parcialmente",
      consultorio
    });
  } catch (error) {
    return manejarError(error, res, next);
  }
};

// DELETE
const eliminarConsultorio = async (req, res, next) => {
  try {
    const { id } = req.params;

    const consultorio =
      await consultoriosService.obtenerConsultorioPorId(id);

    if (!consultorio) {
      return res.status(404).json({
        mensaje: "Consultorio no encontrado"
      });
    }

    // Protección transitoria:
    // Citas todavía utiliza memoria.
    const tieneCitas =
      await citasService.consultorioTieneCitas(id);

    if (tieneCitas) {
      return res.status(409).json({
        mensaje:
          "No se puede eliminar el consultorio porque tiene citas asociadas"
      });
    }

    const eliminado =
      await consultoriosService.eliminarConsultorio(id);

    if (!eliminado) {
      return res.status(404).json({
        mensaje: "Consultorio no encontrado"
      });
    }

    return res.status(200).json({
      mensaje: "Consultorio eliminado correctamente",
      consultorio: eliminado
    });
  } catch (error) {
    return manejarError(error, res, next);
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
