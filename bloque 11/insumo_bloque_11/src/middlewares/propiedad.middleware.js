const pacientesService = require("../services/pacientes.service");

const medicosService = require("../services/medicos.service");

const citasService = require("../services/citas.service");

// ========================================
// Utilidades
// ========================================

const mismoId = (a, b) => a != null && b != null && String(a) === String(b);

const prohibido = (
  res,
  mensaje = "No tiene permisos para acceder a este recurso",
) => {
  return res.status(403).json({ mensaje });
};

// ========================================
// Autorizar paciente propio
// ========================================

const autorizarPacientePropio = async (req, res, next) => {
  try {
    // ------------------------------------
    // Autenticación
    // ------------------------------------

    if (!req.usuario) {
      return res.status(401).json({
        mensaje: "Usuario no autenticado",
      });
    }

    // ------------------------------------
    // Administrador: acceso global
    // ------------------------------------

    if (req.usuario.rol === "administrador") {
      return next();
    }

    // ------------------------------------
    // Solo pacientes
    // ------------------------------------

    if (req.usuario.rol !== "paciente") {
      return prohibido(res);
    }

    // ------------------------------------
    // Perfil desde PostgreSQL
    // ------------------------------------

    const paciente = await pacientesService.obtenerPacientePorUsuarioId(
      req.usuario.id,
    );

    if (!paciente) {
      return prohibido(res, "El usuario no tiene un paciente asociado");
    }

    // ------------------------------------
    // Comprobar propiedad
    // ------------------------------------

    if (!mismoId(paciente.id, req.params.pacienteId)) {
      return prohibido(res);
    }

    return next();
  } catch (error) {
    return next(error);
  }
};

// ========================================
// Autorizar médico propio
// ========================================

const autorizarMedicoPropio = async (req, res, next) => {
  try {
    if (!req.usuario) {
      return res.status(401).json({
        mensaje: "Usuario no autenticado",
      });
    }

    if (req.usuario.rol === "administrador") {
      return next();
    }

    if (req.usuario.rol !== "medico") {
      return prohibido(res);
    }

    const medico = await medicosService.obtenerMedicoPorUsuarioId(
      req.usuario.id,
    );

    if (!medico) {
      return prohibido(res, "El usuario no tiene un médico asociado");
    }

    if (!mismoId(medico.id, req.params.medicoId)) {
      return prohibido(res);
    }

    return next();
  } catch (error) {
    return next(error);
  }
};

// ========================================
// Autorizar acceso a cita
// ========================================

const autorizarAccesoCita = async (req, res, next) => {
  try {
    // ------------------------------------
    // Verificar autenticación
    // ------------------------------------

    if (!req.usuario) {
      return res.status(401).json({
        mensaje: "Usuario no autenticado",
      });
    }

    // ------------------------------------
    // Consultar cita
    // ------------------------------------

    const cita = await citasService.obtenerCitaPorId(req.params.id);

    if (!cita) {
      return res.status(404).json({
        mensaje: "Cita no encontrada",
      });
    }

    // ------------------------------------
    // Administrador
    // ------------------------------------

    if (req.usuario.rol === "administrador") {
      return next();
    }

    // ====================================
    // Paciente
    // ====================================

    if (req.usuario.rol === "paciente") {
      const paciente = await pacientesService.obtenerPacientePorUsuarioId(
        req.usuario.id,
      );

      if (!paciente || !mismoId(paciente.id, cita.pacienteId)) {
        return prohibido(res, "No tiene permisos para acceder a esta cita");
      }

      return next();
    }

    // ====================================
    // Médico
    // ====================================

    if (req.usuario.rol === "medico") {
      const medico = await medicosService.obtenerMedicoPorUsuarioId(
        req.usuario.id,
      );

      if (!medico || !mismoId(medico.id, cita.medicoId)) {
        return prohibido(res, "No tiene permisos para acceder a esta cita");
      }

      return next();
    }

    // ------------------------------------
    // Otros roles
    // ------------------------------------

    return prohibido(res, "No tiene permisos para acceder a esta cita");
  } catch (error) {
    return next(error);
  }
};

// ========================================
// Exportaciones
// ========================================

module.exports = {
  autorizarPacientePropio,
  autorizarMedicoPropio,
  autorizarAccesoCita,
};
