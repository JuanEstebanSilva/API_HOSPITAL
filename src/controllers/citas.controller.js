const { matchedData } = require("express-validator");

const citasService = require("../services/citas.service");
const pacientesService = require("../services/pacientes.service");
const medicosService = require("../services/medicos.service");
const consultoriosService = require("../services/consultorios.service");
const especialidadesService = require("../services/especialidades.service");

// ========================================
// Utilidades
// ========================================

const datosCuerpo = (req) => matchedData(req, { locations: ["body"] });

const responderValidacion = (res, error) =>
  res.status(error.status).json({
    mensaje: error.mensaje,
  });

// ========================================
// Errores PostgreSQL
// ========================================

const responderErrorSQL = (error, res, next) => {
  if (error.code === "23505") {
    const restriccionesHorario = [
      "uq_citas_medico_horario_activo",
      "uq_citas_consultorio_horario_activo",
    ];

    const esConflictoHorario = restriccionesHorario.includes(error.constraint);

    return res.status(409).json({
      mensaje: esConflictoHorario
        ? "El médico o consultorio ya tiene una cita en ese horario"
        : "Existe un conflicto de unicidad al guardar la cita",
    });
  }

  if (error.code === "23503") {
    return res.status(400).json({
      mensaje: "La cita referencia un recurso inexistente",
    });
  }

  if (["23502", "23514", "22007", "22008", "22P02"].includes(error.code)) {
    return res.status(400).json({
      mensaje:
        "Los datos de la cita no cumplen las restricciones de PostgreSQL",
    });
  }

  return next(error);
};

// ========================================
// Validar relaciones
// ========================================

const validarRelacionesCita = async (datos) => {
  const paciente = await pacientesService.obtenerPacientePorId(
    datos.pacienteId,
  );

  if (!paciente) {
    return {
      status: 400,
      mensaje: "El paciente indicado no existe",
    };
  }

  const medico = await medicosService.obtenerMedicoPorId(datos.medicoId);

  if (!medico) {
    return {
      status: 400,
      mensaje: "El médico indicado no existe",
    };
  }

  if (!medico.activo) {
    return {
      status: 409,
      mensaje: "No se pueden programar citas con un médico inactivo",
    };
  }

  const especialidad = await especialidadesService.obtenerEspecialidadPorId(
    medico.especialidadId,
  );

  if (!especialidad) {
    return {
      status: 409,
      mensaje: "La especialidad asociada al médico no existe",
    };
  }

  if (!especialidad.activa) {
    return {
      status: 409,
      mensaje: "La especialidad del médico se encuentra inactiva",
    };
  }

  const consultorio = await consultoriosService.obtenerConsultorioPorId(
    datos.consultorioId,
  );

  if (!consultorio) {
    return {
      status: 400,
      mensaje: "El consultorio indicado no existe",
    };
  }

  if (!consultorio.activo) {
    return {
      status: 409,
      mensaje: "El consultorio se encuentra inactivo",
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
    citaIdExcluir,
  );

  if (conflictoMedico) {
    return {
      status: 409,
      mensaje: "El médico ya tiene una cita programada en esa fecha y hora",
    };
  }

  const conflictoConsultorio = await citasService.consultorioTieneConflicto(
    datos.consultorioId,
    datos.fecha,
    datos.hora,
    citaIdExcluir,
  );

  if (conflictoConsultorio) {
    return {
      status: 409,
      mensaje: "El consultorio ya está ocupado en esa fecha y hora",
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
    return res.status(200).json(citas);
  } catch (error) {
    return next(error);
  }
};

// ========================================
// GET por ID
// ========================================

const obtenerCitaPorId = async (req, res, next) => {
  try {
    const cita = await citasService.obtenerCitaPorId(req.params.id);

    if (!cita) {
      return res.status(404).json({
        mensaje: "Cita no encontrada",
      });
    }

    return res.status(200).json(cita);
  } catch (error) {
    return next(error);
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
        mensaje: "Paciente no encontrado",
      });
    }

    const citas = await citasService.obtenerCitasPorPaciente(pacienteId);

    return res.status(200).json(citas);
  } catch (error) {
    return next(error);
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
        mensaje: "Médico no encontrado",
      });
    }

    const citas = await citasService.obtenerCitasPorMedico(medicoId);

    return res.status(200).json(citas);
  } catch (error) {
    return next(error);
  }
};

// ========================================
// GET mis citas
// ========================================

const obtenerMisCitas = async (req, res, next) => {
  try {
    if (req.usuario.rol === "paciente") {
      const paciente = await pacientesService.obtenerPacientePorUsuarioId(
        req.usuario.id,
      );

      if (!paciente) {
        return res.status(403).json({
          mensaje: "El usuario no tiene un paciente asociado",
        });
      }

      const citas = await citasService.obtenerCitasPorPaciente(paciente.id);

      return res.status(200).json(citas);
    }

    if (req.usuario.rol === "medico") {
      const medico = await medicosService.obtenerMedicoPorUsuarioId(
        req.usuario.id,
      );

      if (!medico) {
        return res.status(403).json({
          mensaje: "El usuario no tiene un médico asociado",
        });
      }

      const citas = await citasService.obtenerCitasPorMedico(medico.id);

      return res.status(200).json(citas);
    }

    return res.status(403).json({
      mensaje: "No tiene permisos para utilizar este recurso",
    });
  } catch (error) {
    return next(error);
  }
};

// ========================================
// POST
// ========================================

const crearCita = async (req, res, next) => {
  try {
    const datos = datosCuerpo(req);

    const relacion = await validarRelacionesCita(datos);

    if (relacion) {
      return responderValidacion(res, relacion);
    }

    const disponibilidad = await validarDisponibilidad(datos);

    if (disponibilidad) {
      return responderValidacion(res, disponibilidad);
    }

    const cita = await citasService.crearCita(datos);

    return res.status(201).json({
      mensaje: "Cita creada correctamente",
      cita,
    });
  } catch (error) {
    return responderErrorSQL(error, res, next);
  }
};

// ========================================
// PUT
// ========================================

const actualizarCita = async (req, res, next) => {
  try {
    const { id } = req.params;
    const datos = datosCuerpo(req);

    const actual = await citasService.obtenerCitaPorId(id);

    if (!actual) {
      return res.status(404).json({
        mensaje: "Cita no encontrada",
      });
    }

    const relacion = await validarRelacionesCita(datos);

    if (relacion) {
      return responderValidacion(res, relacion);
    }

    const disponibilidad = await validarDisponibilidad(datos, id);

    if (disponibilidad) {
      return responderValidacion(res, disponibilidad);
    }

    const cita = await citasService.actualizarCita(id, datos);

    if (!cita) {
      return res.status(404).json({
        mensaje: "Cita no encontrada",
      });
    }

    return res.status(200).json({
      mensaje: "Cita actualizada correctamente",
      cita,
    });
  } catch (error) {
    return responderErrorSQL(error, res, next);
  }
};

// ========================================
// PATCH general
// ========================================

const actualizarCitaParcial = async (req, res, next) => {
  try {
    const { id } = req.params;
    const datos = datosCuerpo(req);

    if (Object.keys(datos).length === 0) {
      return res.status(400).json({
        mensaje: "Debe enviar al menos un campo para actualizar",
      });
    }

    const actual = await citasService.obtenerCitaPorId(id);

    if (!actual) {
      return res.status(404).json({
        mensaje: "Cita no encontrada",
      });
    }

    const propuesta = {
      pacienteId: datos.pacienteId ?? actual.pacienteId,
      medicoId: datos.medicoId ?? actual.medicoId,
      consultorioId: datos.consultorioId ?? actual.consultorioId,
      fecha: datos.fecha ?? actual.fecha,
      hora: datos.hora ?? actual.hora,
      motivo: datos.motivo ?? actual.motivo,
    };

    const relacion = await validarRelacionesCita(propuesta);

    if (relacion) {
      return responderValidacion(res, relacion);
    }

    const disponibilidad = await validarDisponibilidad(propuesta, id);

    if (disponibilidad) {
      return responderValidacion(res, disponibilidad);
    }

    const cita = await citasService.actualizarCitaParcial(id, datos);

    if (!cita) {
      return res.status(404).json({
        mensaje: "Cita no encontrada",
      });
    }

    return res.status(200).json({
      mensaje: "Cita actualizada parcialmente",
      cita,
    });
  } catch (error) {
    return responderErrorSQL(error, res, next);
  }
};

// ========================================
// PATCH estado
// ========================================

const actualizarEstadoCita = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { estado } = datosCuerpo(req);

    const actual = await citasService.obtenerCitaPorId(id);

    if (!actual) {
      return res.status(404).json({
        mensaje: "Cita no encontrada",
      });
    }

    const permitidos = {
      programada: ["confirmada", "cancelada"],
      confirmada: ["atendida", "cancelada"],
      atendida: [],
      cancelada: [],
    };

    if (!(permitidos[actual.estado] || []).includes(estado)) {
      return res.status(409).json({
        mensaje: `No se permite cambiar una cita de ${actual.estado} a ${estado}`,
      });
    }

    const cita = await citasService.actualizarEstadoCita(id, estado);

    if (!cita) {
      return res.status(409).json({
        mensaje: "La cita cambió de estado; consulte su estado actual",
      });
    }

    return res.status(200).json({
      mensaje: "Estado de la cita actualizado correctamente",
      cita,
    });
  } catch (error) {
    return responderErrorSQL(error, res, next);
  }
};

// ========================================
// DELETE
// ========================================

const eliminarCita = async (req, res, next) => {
  try {
    const cita = await citasService.eliminarCita(req.params.id);

    if (!cita) {
      return res.status(404).json({
        mensaje: "Cita no encontrada",
      });
    }

    return res.status(200).json({
      mensaje: "Cita eliminada correctamente",
      cita,
    });
  } catch (error) {
    return responderErrorSQL(error, res, next);
  }
};

// ========================================
// Exportaciones
// ========================================

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
  eliminarCita,
};
