
const { matchedData } = require("express-validator");

const pacientesService =
  require("../services/pacientes.service");

const citasService =
  require("../services/citas.service");

const usuariosService =
  require("../services/usuarios.service");

const mismoId = (a, b) =>
  a != null && b != null && String(a) === String(b);

const manejarError = (error, res, next) => {
  if (error.code === "23505") {
    return res.status(409).json({
      mensaje:
        "El documento, correo o usuario ya está asociado"
    });
  }

  if (error.code === "23503") {
    return res.status(409).json({
      mensaje:
        "La operación incumple una relación de la base de datos"
    });
  }

  if (["23502", "23514", "22P02"].includes(error.code)) {
    return res.status(400).json({
      mensaje: "Datos del paciente inválidos"
    });
  }

  return next(error);
};

// ========================================
// Validar usuario asociado
// ========================================

const validarUsuarioPaciente = async (usuarioId) => {
  if (usuarioId == null) {
    return { valido: true };
  }

  const usuario =
    await usuariosService.obtenerUsuarioPorId(usuarioId);

  if (!usuario) {
    return {
      valido: false,
      status: 400,
      mensaje: "El usuario asociado no existe"
    };
  }

  if (usuario.rol !== "paciente") {
    return {
      valido: false,
      status: 409,
      mensaje:
        "El usuario asociado no tiene rol paciente"
    };
  }

  if (!usuario.activo) {
    return {
      valido: false,
      status: 409,
      mensaje:
        "El usuario asociado está inactivo"
    };
  }

  return { valido: true };
};

// ========================================
// Validar duplicados
// ========================================

const validarDuplicados = async (
  datos,
  idExcluir = null
) => {
  if (datos.usuarioId != null) {
    const asociado =
      await pacientesService.obtenerPacientePorUsuarioId(
        datos.usuarioId
      );

    if (
      asociado &&
      (idExcluir == null ||
       !mismoId(asociado.id, idExcluir))
    ) {
      return {
        status: 409,
        mensaje:
          "El usuario ya está asociado a otro paciente"
      };
    }
  }

  if (datos.documento !== undefined) {
    const existente =
      await pacientesService.buscarPacientePorDocumento(
        datos.documento
      );

    if (
      existente &&
      (idExcluir == null ||
       !mismoId(existente.id, idExcluir))
    ) {
      return {
        status: 409,
        mensaje:
          "El documento pertenece a otro paciente"
      };
    }
  }

  return null;
};

// GET todos
const obtenerPacientes = async (req, res, next) => {
  try {
    const pacientes =
      await pacientesService.obtenerPacientes();

    return res.status(200).json(pacientes);
  } catch (error) {
    return next(error);
  }
};

// GET por ID
const obtenerPacientePorId = async (
  req, res, next
) => {
  try {
    const paciente =
      await pacientesService.obtenerPacientePorId(
        req.params.id
      );

    if (!paciente) {
      return res.status(404).json({
        mensaje: "Paciente no encontrado"
      });
    }

    return res.status(200).json(paciente);
  } catch (error) {
    return manejarError(error, res, next);
  }
};

// POST
const crearPaciente = async (req, res, next) => {
  try {
    const datos = matchedData(req, {
      locations: ["body"]
    });

    const validacion =
      await validarUsuarioPaciente(datos.usuarioId);

    if (!validacion.valido) {
      return res.status(validacion.status).json({
        mensaje: validacion.mensaje
      });
    }

    const duplicado =
      await validarDuplicados(datos);

    if (duplicado) {
      return res.status(duplicado.status).json({
        mensaje: duplicado.mensaje
      });
    }

    const paciente =
      await pacientesService.crearPaciente(datos);

    return res.status(201).json({
      mensaje: "Paciente creado correctamente",
      paciente
    });
  } catch (error) {
    return manejarError(error, res, next);
  }
};

// PUT
const actualizarPaciente = async (
  req, res, next
) => {
  try {
    const { id } = req.params;
    const datos = matchedData(req, {
      locations: ["body"]
    });

    const actual =
      await pacientesService.obtenerPacientePorId(id);

    if (!actual) {
      return res.status(404).json({
        mensaje: "Paciente no encontrado"
      });
    }

    const validacion =
      await validarUsuarioPaciente(datos.usuarioId);

    if (!validacion.valido) {
      return res.status(validacion.status).json({
        mensaje: validacion.mensaje
      });
    }

    const duplicado =
      await validarDuplicados(datos, id);

    if (duplicado) {
      return res.status(duplicado.status).json({
        mensaje: duplicado.mensaje
      });
    }

    const paciente =
      await pacientesService.actualizarPaciente(
        id, datos
      );

    if (!paciente) {
      return res.status(404).json({
        mensaje: "Paciente no encontrado"
      });
    }

    return res.status(200).json({
      mensaje: "Paciente actualizado correctamente",
      paciente
    });
  } catch (error) {
    return manejarError(error, res, next);
  }
};

// PATCH
const actualizarPacienteParcial = async (
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
      await pacientesService.obtenerPacientePorId(id);

    if (!actual) {
      return res.status(404).json({
        mensaje: "Paciente no encontrado"
      });
    }

    if (Object.hasOwn(datos, "usuarioId")) {
      const validacion =
        await validarUsuarioPaciente(datos.usuarioId);

      if (!validacion.valido) {
        return res.status(validacion.status).json({
          mensaje: validacion.mensaje
        });
      }
    }

    const duplicado =
      await validarDuplicados(datos, id);

    if (duplicado) {
      return res.status(duplicado.status).json({
        mensaje: duplicado.mensaje
      });
    }

    const paciente =
      await pacientesService.actualizarPacienteParcial(
        id, datos
      );

    if (!paciente) {
      return res.status(404).json({
        mensaje: "Paciente no encontrado"
      });
    }

    return res.status(200).json({
      mensaje: "Paciente actualizado parcialmente",
      paciente
    });
  } catch (error) {
    return manejarError(error, res, next);
  }
};

// DELETE
const eliminarPaciente = async (req, res, next) => {
  try {
    const { id } = req.params;

    const paciente =
      await pacientesService.obtenerPacientePorId(id);

    if (!paciente) {
      return res.status(404).json({
        mensaje: "Paciente no encontrado"
      });
    }

// ========================================
// Integridad referencial PostgreSQL
// Impedir eliminar registros con citas
// ========================================
    const tieneCitas =
      await citasService.pacienteTieneCitas(id);

    if (tieneCitas) {
      return res.status(409).json({
        mensaje:
          "No se puede eliminar el paciente porque tiene citas asociadas"
      });
    }

    const eliminado =
      await pacientesService.eliminarPaciente(id);

    if (!eliminado) {
      return res.status(404).json({
        mensaje: "Paciente no encontrado"
      });
    }

    return res.status(200).json({
      mensaje: "Paciente eliminado correctamente",
      paciente: eliminado
    });
  } catch (error) {
    return manejarError(error, res, next);
  }
};

module.exports = {
  obtenerPacientes,
  obtenerPacientePorId,
  crearPaciente,
  actualizarPaciente,
  actualizarPacienteParcial,
  eliminarPaciente
};
