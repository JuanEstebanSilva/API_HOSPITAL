const { matchedData } = require("express-validator");
const medicosService = require("../services/medicos.service");
const citasService = require("../services/citas.service");
const especialidadesService = require("../services/especialidades.service");
const usuariosService = require("../services/usuarios.service");

// ========================================
// Validar reglas de asociación usuario <-> médico
// ========================================
const validarUsuarioMedico = async (usuarioId, medicoIdExcluir = null) => {
  if (!usuarioId) {
    return { valido: true };
  }

  const usuario = await usuariosService.obtenerUsuarioPorId(usuarioId);
  if (!usuario) {
    return {
      valido: false,
      status: 400,
      mensaje: "El usuario asociado no existe"
    };
  }

  if (usuario.rol !== "medico") {
    return {
      valido: false,
      status: 409,
      mensaje: "El usuario asociado no tiene rol medico"
    };
  }

  const medicoAsociado = await medicosService.obtenerMedicoPorUsuarioId(usuarioId);
  if (medicoAsociado && (!medicoIdExcluir || String(medicoAsociado.id) !== String(medicoIdExcluir))) {
    return {
      valido: false,
      status: 409,
      mensaje: "El usuario ya está asociado a un médico"
    };
  }

  return { valido: true };
};

// ========================================
// GET todos
// ========================================
const obtenerMedicos = async (req, res, next) => {
  try {
    const medicos = await medicosService.obtenerMedicos();
    res.status(200).json(medicos);
  } catch (error) {
    next(error);
  }
};

// ========================================
// GET por ID
// ========================================
const obtenerMedicoPorId = async (req, res, next) => {
  try {
    const { id } = req.params;
    const medico = await medicosService.obtenerMedicoPorId(id);

    if (!medico) {
      return res.status(404).json({
        mensaje: "Médico no encontrado"
      });
    }

    res.status(200).json(medico);
  } catch (error) {
    next(error);
  }
};

// ========================================
// GET médicos por especialidad
// ========================================
const obtenerMedicosPorEspecialidad = async (req, res, next) => {
  try {
    const { especialidadId } = req.params;
    const especialidad = await especialidadesService.obtenerEspecialidadPorId(especialidadId);

    if (!especialidad) {
      return res.status(404).json({
        mensaje: "Especialidad no encontrada"
      });
    }

    const medicos = await medicosService.obtenerMedicosPorEspecialidad(especialidadId);
    res.status(200).json(medicos);
  } catch (error) {
    next(error);
  }
};

// ========================================
// POST - Crear médico
// ========================================
const crearMedico = async (req, res, next) => {
  try {
    const datosPermitidos = matchedData(req, {
      locations: ["body"]
    });

    const validacionUsuario = await validarUsuarioMedico(datosPermitidos.usuarioId);
    if (!validacionUsuario.valido) {
      return res.status(validacionUsuario.status).json({
        mensaje: validacionUsuario.mensaje
      });
    }

    // Validar especialidad existente
    const especialidad = await especialidadesService.obtenerEspecialidadPorId(
      datosPermitidos.especialidadId
    );

    if (!especialidad) {
      return res.status(400).json({
        mensaje: "La especialidad indicada no existe"
      });
    }

    // Validar especialidad activa
    if (!especialidad.activa) {
      return res.status(409).json({
        mensaje: "No se puede asignar una especialidad inactiva"
      });
    }

    // Registro médico único
    const registroExistente = await medicosService.buscarMedicoPorRegistro(
      datosPermitidos.registroMedico
    );

    if (registroExistente) {
      return res.status(409).json({
        mensaje: "Ya existe un médico con ese registro médico"
      });
    }

    // Email único
    const emailExistente = await medicosService.buscarMedicoPorEmail(
      datosPermitidos.email
    );

    if (emailExistente) {
      return res.status(409).json({
        mensaje: "Ya existe un médico con ese correo electrónico"
      });
    }

    const medicoCreado = await medicosService.crearMedico(datosPermitidos);

    res.status(201).json({
      mensaje: "Médico creado correctamente",
      medico: medicoCreado
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        mensaje: "Violación de unicidad en registro médico o email"
      });
    }
    if (error.code === "23503") {
      return res.status(400).json({
        mensaje: "Clave foránea inválida (especialidad o usuario no existente)"
      });
    }
    next(error);
  }
};

// ========================================
// PUT - Actualización completa
// ========================================
const actualizarMedico = async (req, res, next) => {
  try {
    const { id } = req.params;
    const datosPermitidos = matchedData(req, {
      locations: ["body"]
    });

    const validacionUsuario = await validarUsuarioMedico(datosPermitidos.usuarioId, id);
    if (!validacionUsuario.valido) {
      return res.status(validacionUsuario.status).json({
        mensaje: validacionUsuario.mensaje
      });
    }

    const medicoActual = await medicosService.obtenerMedicoPorId(id);
    if (!medicoActual) {
      return res.status(404).json({
        mensaje: "Médico no encontrado"
      });
    }

    const especialidad = await especialidadesService.obtenerEspecialidadPorId(
      datosPermitidos.especialidadId
    );

    if (!especialidad) {
      return res.status(400).json({
        mensaje: "La especialidad indicada no existe"
      });
    }

    if (!especialidad.activa) {
      return res.status(409).json({
        mensaje: "No se puede asignar una especialidad inactiva"
      });
    }

    const registroExistente = await medicosService.buscarMedicoPorRegistro(
      datosPermitidos.registroMedico
    );

    if (registroExistente && String(registroExistente.id) !== String(id)) {
      return res.status(409).json({
        mensaje: "El registro médico pertenece a otro médico"
      });
    }

    const emailExistente = await medicosService.buscarMedicoPorEmail(
      datosPermitidos.email
    );

    if (emailExistente && String(emailExistente.id) !== String(id)) {
      return res.status(409).json({
        mensaje: "El correo electrónico pertenece a otro médico"
      });
    }

    const medicoActualizado = await medicosService.actualizarMedico(
      id,
      datosPermitidos
    );

    res.status(200).json({
      mensaje: "Médico actualizado correctamente",
      medico: medicoActualizado
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        mensaje: "Violación de unicidad en registro médico o email"
      });
    }
    if (error.code === "23503") {
      return res.status(400).json({
        mensaje: "Clave foránea inválida (especialidad o usuario no existente)"
      });
    }
    next(error);
  }
};

// ========================================
// PATCH - Actualización parcial
// ========================================
const actualizarMedicoParcial = async (req, res, next) => {
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

    if (datosPermitidos.usuarioId !== undefined) {
      const validacionUsuario = await validarUsuarioMedico(datosPermitidos.usuarioId, id);
      if (!validacionUsuario.valido) {
        return res.status(validacionUsuario.status).json({
          mensaje: validacionUsuario.mensaje
        });
      }
    }

    const medicoActual = await medicosService.obtenerMedicoPorId(id);
    if (!medicoActual) {
      return res.status(404).json({
        mensaje: "Médico no encontrado"
      });
    }

    if (datosPermitidos.especialidadId !== undefined) {
      const especialidad = await especialidadesService.obtenerEspecialidadPorId(
        datosPermitidos.especialidadId
      );

      if (!especialidad) {
        return res.status(400).json({
          mensaje: "La especialidad indicada no existe"
        });
      }

      if (!especialidad.activa) {
        return res.status(409).json({
          mensaje: "No se puede asignar una especialidad inactiva"
        });
      }
    }

    if (datosPermitidos.registroMedico) {
      const registroExistente = await medicosService.buscarMedicoPorRegistro(
        datosPermitidos.registroMedico
      );

      if (registroExistente && String(registroExistente.id) !== String(id)) {
        return res.status(409).json({
          mensaje: "El registro médico pertenece a otro médico"
        });
      }
    }

    if (datosPermitidos.email) {
      const emailExistente = await medicosService.buscarMedicoPorEmail(
        datosPermitidos.email
      );

      if (emailExistente && String(emailExistente.id) !== String(id)) {
        return res.status(409).json({
          mensaje: "El correo electrónico pertenece a otro médico"
        });
      }
    }

    const medicoActualizado = await medicosService.actualizarMedicoParcial(
      id,
      datosPermitidos
    );

    res.status(200).json({
      mensaje: "Médico actualizado parcialmente",
      medico: medicoActualizado
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        mensaje: "Violación de unicidad en registro médico o email"
      });
    }
    if (error.code === "23503") {
      return res.status(400).json({
        mensaje: "Clave foránea inválida (especialidad o usuario no existente)"
      });
    }
    next(error);
  }
};

// ========================================
// DELETE
// ========================================
const eliminarMedico = async (req, res, next) => {
  try {
    const { id } = req.params;
    const medico = await medicosService.obtenerMedicoPorId(id);
    if (!medico) {
      return res.status(404).json({
        mensaje: "Médico no encontrado"
      });
    }

    const tieneCitas = await citasService.medicoTieneCitas(id);
    if (tieneCitas) {
      return res.status(409).json({
        mensaje: "No se puede eliminar el médico porque tiene citas asociadas"
      });
    }

    const medicoEliminado = await medicosService.eliminarMedico(id);
    return res.status(200).json({
      mensaje: "Médico eliminado correctamente",
      medico: medicoEliminado
    });
  } catch (error) {
    if (error.code === "23503") {
      return res.status(409).json({
        mensaje: "No se puede eliminar el médico porque tiene citas u otros registros asociados en la base de datos"
      });
    }
    next(error);
  }
};

module.exports = {
  obtenerMedicos,
  obtenerMedicoPorId,
  obtenerMedicosPorEspecialidad,
  crearMedico,
  actualizarMedico,
  actualizarMedicoParcial,
  eliminarMedico
};