const { matchedData } = require("express-validator");
const citasService = require("../services/citas.service");
const pacientesService = require("../services/pacientes.service");
const medicosService = require("../services/medicos.service");
const consultoriosService = require("../services/consultorios.service");
const especialidadesService = require("../services/especialidades.service");

// ========================================
// Validar relaciones de la cita
// ========================================
const validarRelacionesCita = async (datos) => {
  const paciente = await pacientesService.obtenerPacientePorId(datos.pacienteId);
  if (!paciente) {
    return {
      status: 400,
      mensaje: "El paciente indicado no existe"
    };
  }

  const medico = await medicosService.obtenerMedicoPorId(datos.medicoId);
  if (!medico) {
    return {
      status: 400,
      mensaje: "El médico indicado no existe"
    };
  }

  if (!medico.activo) {
    return {
      status: 409,
      mensaje: "No se pueden programar citas con un médico inactivo"
    };
  }

  const especialidad = await especialidadesService.obtenerEspecialidadPorId(
    medico.especialidadId
  );

  if (!especialidad) {
    return {
      status: 409,
      mensaje: "La especialidad asociada al médico no existe"
    };
  }

  if (!especialidad.activa) {
    return {
      status: 409,
      mensaje: "La especialidad del médico se encuentra inactiva"
    };
  }

  const consultorio = await consultoriosService.obtenerConsultorioPorId(
    datos.consultorioId
  );

  if (!consultorio) {
    return {
      status: 400,
      mensaje: "El consultorio indicado no existe"
    };
  }

  if (!consultorio.activo) {
    return {
      status: 409,
      mensaje: "El consultorio se encuentra inactivo"
    };
  }

  return null;
};

// ========================================
// Validar disponibilidad
// ========================================
const validarDisponibilidad = async (datos, citaIdExcluir = null) => {
  const conflictoMedico = await citasService.medicoTieneConflicto(
    datos.medicoId,
    datos.fecha,
    datos.hora,
    citaIdExcluir
  );

  if (conflictoMedico) {
    return {
      status: 409,
      mensaje: "El médico ya tiene una cita programada en esa fecha y hora"
    };
  }

  const conflictoConsultorio = await citasService.consultorioTieneConflicto(
    datos.consultorioId,
    datos.fecha,
    datos.hora,
    citaIdExcluir
  );

  if (conflictoConsultorio) {
    return {
      status: 409,
      mensaje: "El consultorio ya está ocupado en esa fecha y hora"
    };
  }

  return null;
};

// ========================================
// GET todas
// ========================================
const obtenerCitas = async (req, res, next) => {
  try {
    const citas = await citasService.obtenerCitas();
    res.status(200).json(citas);
  } catch (error) {
    next(error);
  }
};

// ========================================
// GET por ID
// ========================================
const obtenerCitaPorId = async (req, res, next) => {
  try {
    const { id } = req.params;
    const cita = await citasService.obtenerCitaPorId(id);

    if (!cita) {
      return res.status(404).json({
        mensaje: "Cita no encontrada"
      });
    }

    res.status(200).json(cita);
  } catch (error) {
    next(error);
  }
};

// ========================================
// GET por paciente
// ========================================
const obtenerCitasPorPaciente = async (req, res, next) => {
  try {
    const { pacienteId } = req.params;
    const paciente = await pacientesService.obtenerPacientePorId(pacienteId);

    if (!paciente) {
      return res.status(404).json({
        mensaje: "Paciente no encontrado"
      });
    }

    const citas = await citasService.obtenerCitasPorPaciente(pacienteId);
    res.status(200).json(citas);
  } catch (error) {
    next(error);
  }
};

// ========================================
// GET por médico
// ========================================
const obtenerCitasPorMedico = async (req, res, next) => {
  try {
    const { medicoId } = req.params;
    const medico = await medicosService.obtenerMedicoPorId(medicoId);

    if (!medico) {
      return res.status(404).json({
        mensaje: "Médico no encontrado"
      });
    }

    const citas = await citasService.obtenerCitasPorMedico(medicoId);
    res.status(200).json(citas);
  } catch (error) {
    next(error);
  }
};

// ========================================
// POST - Crear cita
// ========================================
const crearCita = async (req, res, next) => {
  try {
    const datosPermitidos = matchedData(req, {
      locations: ["body"]
    });

    const errorRelacion = await validarRelacionesCita(datosPermitidos);
    if (errorRelacion) {
      return res.status(errorRelacion.status).json({
        mensaje: errorRelacion.mensaje
      });
    }

    const errorDisponibilidad = await validarDisponibilidad(datosPermitidos);
    if (errorDisponibilidad) {
      return res.status(errorDisponibilidad.status).json({
        mensaje: errorDisponibilidad.mensaje
      });
    }

    const citaCreada = await citasService.crearCita(datosPermitidos);

    res.status(201).json({
      mensaje: "Cita creada correctamente",
      cita: citaCreada
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        mensaje: "Conflicto de horario: médico o consultorio ya ocupado en esa fecha y hora"
      });
    }
    if (error.code === "23503") {
      return res.status(400).json({
        mensaje: "Clave foránea inválida (paciente, médico o consultorio inexistente)"
      });
    }
    next(error);
  }
};

// ========================================
// PUT - Actualizar cita completa
// ========================================
const actualizarCita = async (req, res, next) => {
  try {
    const { id } = req.params;
    const datosPermitidos = matchedData(req, {
      locations: ["body"]
    });

    const citaActual = await citasService.obtenerCitaPorId(id);
    if (!citaActual) {
      return res.status(404).json({
        mensaje: "Cita no encontrada"
      });
    }

    const citaPropuesta = {
      ...datosPermitidos,
      estado: citaActual.estado
    };

    const errorRelacion = await validarRelacionesCita(citaPropuesta);
    if (errorRelacion) {
      return res.status(errorRelacion.status).json({
        mensaje: errorRelacion.mensaje
      });
    }

    const errorDisponibilidad = await validarDisponibilidad(citaPropuesta, id);
    if (errorDisponibilidad) {
      return res.status(errorDisponibilidad.status).json({
        mensaje: errorDisponibilidad.mensaje
      });
    }

    const citaActualizada = await citasService.actualizarCita(
      id,
      datosPermitidos
    );

    res.status(200).json({
      mensaje: "Cita actualizada correctamente",
      cita: citaActualizada
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        mensaje: "Conflicto de horario: médico o consultorio ya ocupado en esa fecha y hora"
      });
    }
    if (error.code === "23503") {
      return res.status(400).json({
        mensaje: "Clave foránea inválida (paciente, médico o consultorio inexistente)"
      });
    }
    next(error);
  }
};

// ========================================
// PATCH - Actualización parcial
// ========================================
const actualizarCitaParcial = async (req, res, next) => {
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

    const citaActual = await citasService.obtenerCitaPorId(id);
    if (!citaActual) {
      return res.status(404).json({
        mensaje: "Cita no encontrada"
      });
    }

    const citaPropuesta = {
      pacienteId: datosPermitidos.pacienteId ?? citaActual.pacienteId,
      medicoId: datosPermitidos.medicoId ?? citaActual.medicoId,
      consultorioId: datosPermitidos.consultorioId ?? citaActual.consultorioId,
      fecha: datosPermitidos.fecha ?? citaActual.fecha,
      hora: datosPermitidos.hora ?? citaActual.hora,
      motivo: datosPermitidos.motivo ?? citaActual.motivo,
      estado: citaActual.estado
    };

    const errorRelacion = await validarRelacionesCita(citaPropuesta);
    if (errorRelacion) {
      return res.status(errorRelacion.status).json({
        mensaje: errorRelacion.mensaje
      });
    }

    const errorDisponibilidad = await validarDisponibilidad(citaPropuesta, id);
    if (errorDisponibilidad) {
      return res.status(errorDisponibilidad.status).json({
        mensaje: errorDisponibilidad.mensaje
      });
    }

    const citaActualizada = await citasService.actualizarCitaParcial(
      id,
      datosPermitidos
    );

    res.status(200).json({
      mensaje: "Cita actualizada parcialmente",
      cita: citaActualizada
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        mensaje: "Conflicto de horario: médico o consultorio ya ocupado en esa fecha y hora"
      });
    }
    if (error.code === "23503") {
      return res.status(400).json({
        mensaje: "Clave foránea inválida (paciente, médico o consultorio inexistente)"
      });
    }
    next(error);
  }
};

// ========================================
// PATCH especializado de estado
// ========================================
const actualizarEstadoCita = async (req, res, next) => {
  try {
    const { id } = req.params;
    const datosPermitidos = matchedData(req, {
      locations: ["body"]
    });

    const citaActual = await citasService.obtenerCitaPorId(id);
    if (!citaActual) {
      return res.status(404).json({
        mensaje: "Cita no encontrada"
      });
    }

    const nuevoEstado = datosPermitidos.estado;
    const transicionesPermitidas = {
      programada: ["confirmada", "cancelada"],
      confirmada: ["atendida", "cancelada"],
      atendida: [],
      cancelada: []
    };

    const estadoActual = citaActual.estado;
    const permitidos = transicionesPermitidas[estadoActual] || [];

    if (!permitidos.includes(nuevoEstado)) {
      return res.status(409).json({
        mensaje: `No se permite cambiar una cita de ${estadoActual} a ${nuevoEstado}`
      });
    }

    const citaActualizada = await citasService.actualizarEstadoCita(
      id,
      nuevoEstado
    );

    res.status(200).json({
      mensaje: "Estado de la cita actualizado correctamente",
      cita: citaActualizada
    });
  } catch (error) {
    next(error);
  }
};

// ========================================
// DELETE
// ========================================
const eliminarCita = async (req, res, next) => {
  try {
    const { id } = req.params;
    const citaEliminada = await citasService.eliminarCita(id);

    if (!citaEliminada) {
      return res.status(404).json({
        mensaje: "Cita no encontrada"
      });
    }

    res.status(200).json({
      mensaje: "Cita eliminada correctamente",
      cita: citaEliminada
    });
  } catch (error) {
    next(error);
  }
};

// ========================================
// GET mis-citas (Identidad derivada del JWT)
// ========================================
const obtenerMisCitas = async (req, res, next) => {
  try {
    const { rol, id: usuarioId } = req.usuario;

    if (rol === "administrador") {
      return res.status(403).json({
        mensaje: "Endpoint restringido a perfiles"
      });
    }

    if (rol === "paciente") {
      const paciente = await pacientesService.obtenerPacientePorUsuarioId(usuarioId);
      if (!paciente) {
        return res.status(403).json({
          mensaje: "El usuario no tiene un paciente asociado"
        });
      }

      const misCitas = await citasService.obtenerCitasPorPaciente(paciente.id);
      return res.status(200).json(misCitas);
    }

    if (rol === "medico") {
      const medico = await medicosService.obtenerMedicoPorUsuarioId(usuarioId);
      if (!medico) {
        return res.status(403).json({
          mensaje: "El usuario no tiene un médico asociado"
        });
      }

      const misCitas = await citasService.obtenerCitasPorMedico(medico.id);
      return res.status(200).json(misCitas);
    }

    return res.status(403).json({
      mensaje: "No tiene permisos para acceder a este recurso"
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  obtenerCitas,
  obtenerCitaPorId,
  obtenerCitasPorPaciente,
  obtenerCitasPorMedico,
  obtenerMisCitas,
  crearCita,
  actualizarCita,
  actualizarCitaParcial,
  actualizarEstadoCita,
  eliminarCita
};