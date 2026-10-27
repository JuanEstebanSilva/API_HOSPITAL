const { matchedData } = require("express-validator");

// ========================================
// Servicios
// ========================================

const medicosService = require("../services/medicos.service");

const especialidadesService = require("../services/especialidades.service");

const citasService = require("../services/citas.service");

const usuariosService = require("../services/usuarios.service");

// ========================================
// Utilidades
// ========================================

const mismoId = (a, b) => a != null && b != null && String(a) === String(b);

const datosCuerpo = (req) =>
  matchedData(req, {
    locations: ["body"],
  });

// ========================================
// Manejo de errores PostgreSQL
// ========================================

const manejarErrorBD = (error, res, next) => {
  if (error.code === "23505") {
    return res.status(409).json({
      mensaje: "Ya existe un médico con alguno de los datos únicos",
    });
  }

  if (error.code === "23503") {
    return res.status(409).json({
      mensaje: "La operación incumple una relación de la base de datos",
    });
  }

  if (["23502", "23514", "22P02"].includes(error.code)) {
    return res.status(400).json({
      mensaje: "Los datos del médico no son válidos",
    });
  }

  return next(error);
};

// ========================================
// Validar usuario asociado
// ========================================

const validarUsuarioMedico = async (usuarioId) => {
  // La asociación es opcional.
  if (usuarioId == null) {
    return { valido: true };
  }

  const usuario = await usuariosService.obtenerUsuarioPorId(usuarioId);

  if (!usuario) {
    return {
      valido: false,
      status: 400,
      mensaje: "El usuario asociado no existe",
    };
  }

  if (usuario.rol !== "medico") {
    return {
      valido: false,
      status: 409,
      mensaje: "El usuario asociado no tiene rol médico",
    };
  }

  if (!usuario.activo) {
    return {
      valido: false,
      status: 409,
      mensaje: "El usuario asociado está inactivo",
    };
  }

  const asociado = await medicosService.obtenerMedicoPorUsuarioId(usuarioId);

  return {
    valido: true,
    asociado,
  };
};

// ========================================
// Validar especialidad
// ========================================

const validarEspecialidad = async (especialidadId) => {
  const especialidad =
    await especialidadesService.obtenerEspecialidadPorId(especialidadId);

  if (!especialidad) {
    return {
      status: 400,
      mensaje: "La especialidad indicada no existe",
    };
  }

  if (!especialidad.activa) {
    return {
      status: 409,
      mensaje: "No se puede asignar una especialidad inactiva",
    };
  }

  return null;
};

// ========================================
// Validar duplicados
// ========================================

const validarDuplicados = async (datos, idExcluir = null) => {
  // --------------------------------------
  // Registro médico
  // --------------------------------------

  if (datos.registroMedico !== undefined) {
    const existente = await medicosService.buscarMedicoPorRegistro(
      datos.registroMedico,
    );

    if (existente && (idExcluir == null || !mismoId(existente.id, idExcluir))) {
      return {
        status: 409,
        mensaje: "El registro médico pertenece a otro médico",
      };
    }
  }

  // --------------------------------------
  // Correo electrónico
  // --------------------------------------

  if (datos.email !== undefined) {
    const existente = await medicosService.buscarMedicoPorEmail(datos.email);

    if (existente && (idExcluir == null || !mismoId(existente.id, idExcluir))) {
      return {
        status: 409,
        mensaje: "El correo electrónico pertenece a otro médico",
      };
    }
  }

  // --------------------------------------
  // Usuario asociado
  // --------------------------------------

  if (datos.usuarioId != null) {
    const existente = await medicosService.obtenerMedicoPorUsuarioId(
      datos.usuarioId,
    );

    if (existente && (idExcluir == null || !mismoId(existente.id, idExcluir))) {
      return {
        status: 409,
        mensaje: "El usuario ya está asociado a otro médico",
      };
    }
  }

  return null;
};

// ========================================
// GET /api/medicos
// ========================================

const obtenerMedicos = async (req, res, next) => {
  try {
    const medicos = await medicosService.obtenerMedicos();

    return res.status(200).json(medicos);
  } catch (error) {
    return next(error);
  }
};

// ========================================
// GET /api/medicos/:id
// ========================================

const obtenerMedicoPorId = async (req, res, next) => {
  try {
    const medico = await medicosService.obtenerMedicoPorId(req.params.id);

    if (!medico) {
      return res.status(404).json({
        mensaje: "Médico no encontrado",
      });
    }

    return res.status(200).json(medico);
  } catch (error) {
    return next(error);
  }
};

// ========================================
// GET /api/medicos/especialidad/:especialidadId
// ========================================

const obtenerMedicosPorEspecialidad = async (req, res, next) => {
  try {
    const { especialidadId } = req.params;

    const especialidad =
      await especialidadesService.obtenerEspecialidadPorId(especialidadId);

    if (!especialidad) {
      return res.status(404).json({
        mensaje: "Especialidad no encontrada",
      });
    }

    const medicos =
      await medicosService.obtenerMedicosPorEspecialidad(especialidadId);

    return res.status(200).json(medicos);
  } catch (error) {
    return next(error);
  }
};

// ========================================
// POST /api/medicos
// ========================================

const crearMedico = async (req, res, next) => {
  try {
    const datos = datosCuerpo(req);

    // ------------------------------------
    // Validar especialidad
    // ------------------------------------

    const errorEspecialidad = await validarEspecialidad(datos.especialidadId);

    if (errorEspecialidad) {
      return res.status(errorEspecialidad.status).json({
        mensaje: errorEspecialidad.mensaje,
      });
    }

    // ------------------------------------
    // Validar usuario asociado
    // ------------------------------------

    const validacionUsuario = await validarUsuarioMedico(datos.usuarioId);

    if (!validacionUsuario.valido) {
      return res.status(validacionUsuario.status).json({
        mensaje: validacionUsuario.mensaje,
      });
    }

    // ------------------------------------
    // Validar duplicados
    // ------------------------------------

    const duplicado = await validarDuplicados(datos);

    if (duplicado) {
      return res.status(duplicado.status).json({
        mensaje: duplicado.mensaje,
      });
    }

    // ------------------------------------
    // Crear en PostgreSQL
    // ------------------------------------

    const medico = await medicosService.crearMedico(datos);

    return res.status(201).json({
      mensaje: "Médico creado correctamente",
      medico,
    });
  } catch (error) {
    return manejarErrorBD(error, res, next);
  }
};

// ========================================
// PUT /api/medicos/:id
// ========================================

const actualizarMedico = async (req, res, next) => {
  try {
    const { id } = req.params;
    const datos = datosCuerpo(req);

    // ------------------------------------
    // Verificar existencia
    // ------------------------------------

    const actual = await medicosService.obtenerMedicoPorId(id);

    if (!actual) {
      return res.status(404).json({
        mensaje: "Médico no encontrado",
      });
    }

    // ------------------------------------
    // Validar especialidad
    // ------------------------------------

    const errorEspecialidad = await validarEspecialidad(datos.especialidadId);

    if (errorEspecialidad) {
      return res.status(errorEspecialidad.status).json({
        mensaje: errorEspecialidad.mensaje,
      });
    }

    // ------------------------------------
    // Validar usuario asociado
    // ------------------------------------

    const validacionUsuario = await validarUsuarioMedico(datos.usuarioId);

    if (!validacionUsuario.valido) {
      return res.status(validacionUsuario.status).json({
        mensaje: validacionUsuario.mensaje,
      });
    }

    // ------------------------------------
    // Validar duplicados
    // ------------------------------------

    const duplicado = await validarDuplicados(datos, id);

    if (duplicado) {
      return res.status(duplicado.status).json({
        mensaje: duplicado.mensaje,
      });
    }

    // ------------------------------------
    // Actualizar en PostgreSQL
    // ------------------------------------

    const medico = await medicosService.actualizarMedico(id, datos);

    if (!medico) {
      return res.status(404).json({
        mensaje: "Médico no encontrado",
      });
    }

    return res.status(200).json({
      mensaje: "Médico actualizado correctamente",
      medico,
    });
  } catch (error) {
    return manejarErrorBD(error, res, next);
  }
};

// ========================================
// PATCH /api/medicos/:id
// ========================================

const actualizarMedicoParcial = async (req, res, next) => {
  try {
    const { id } = req.params;
    const datos = datosCuerpo(req);

    // ------------------------------------
    // Verificar campos
    // ------------------------------------

    if (Object.keys(datos).length === 0) {
      return res.status(400).json({
        mensaje: "Debe enviar al menos un campo para actualizar",
      });
    }

    // ------------------------------------
    // Verificar existencia
    // ------------------------------------

    const actual = await medicosService.obtenerMedicoPorId(id);

    if (!actual) {
      return res.status(404).json({
        mensaje: "Médico no encontrado",
      });
    }

    // ------------------------------------
    // Validar especialidad si cambia
    // ------------------------------------

    if (Object.hasOwn(datos, "especialidadId")) {
      const errorEspecialidad = await validarEspecialidad(datos.especialidadId);

      if (errorEspecialidad) {
        return res.status(errorEspecialidad.status).json({
          mensaje: errorEspecialidad.mensaje,
        });
      }
    }

    // ------------------------------------
    // Validar usuario si cambia
    // ------------------------------------

    if (Object.hasOwn(datos, "usuarioId")) {
      const validacionUsuario = await validarUsuarioMedico(datos.usuarioId);

      if (!validacionUsuario.valido) {
        return res.status(validacionUsuario.status).json({
          mensaje: validacionUsuario.mensaje,
        });
      }
    }

    // ------------------------------------
    // Validar duplicados
    // ------------------------------------

    const duplicado = await validarDuplicados(datos, id);

    if (duplicado) {
      return res.status(duplicado.status).json({
        mensaje: duplicado.mensaje,
      });
    }

    // ------------------------------------
    // Actualización parcial
    // ------------------------------------

    const medico = await medicosService.actualizarMedicoParcial(id, datos);

    if (!medico) {
      return res.status(404).json({
        mensaje: "Médico no encontrado",
      });
    }

    return res.status(200).json({
      mensaje: "Médico actualizado parcialmente",
      medico,
    });
  } catch (error) {
    return manejarErrorBD(error, res, next);
  }
};

// ========================================
// DELETE /api/medicos/:id
// ========================================

const eliminarMedico = async (req, res, next) => {
  try {
    const { id } = req.params;

    // ------------------------------------
    // Verificar existencia
    // ------------------------------------

    const medico = await medicosService.obtenerMedicoPorId(id);

    if (!medico) {
      return res.status(404).json({
        mensaje: "Médico no encontrado",
      });
    }

    // ------------------------------------
    // Integridad referencial PostgreSQL
    // ------------------------------------

    const tieneCitas = await citasService.medicoTieneCitas(id);

    if (tieneCitas) {
      return res.status(409).json({
        mensaje: "No se puede eliminar el médico porque tiene citas asociadas",
      });
    }

    // ------------------------------------
    // Eliminar en PostgreSQL
    // ------------------------------------

    const medicoEliminado = await medicosService.eliminarMedico(id);

    if (!medicoEliminado) {
      return res.status(404).json({
        mensaje: "Médico no encontrado",
      });
    }

    return res.status(200).json({
      mensaje: "Médico eliminado correctamente",
      medico: medicoEliminado,
    });
  } catch (error) {
    return manejarErrorBD(error, res, next);
  }
};

// ========================================
// Exportaciones
// ========================================

module.exports = {
  obtenerMedicos,
  obtenerMedicoPorId,
  obtenerMedicosPorEspecialidad,
  crearMedico,
  actualizarMedico,
  actualizarMedicoParcial,
  eliminarMedico,
};
