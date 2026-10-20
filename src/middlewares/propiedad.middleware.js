const pacientesService = require("../services/pacientes.service");
const medicosService = require("../services/medicos.service");
const citasService = require("../services/citas.service");

// ========================================
// Autorizar acceso al paciente solicitado (BOLA / Propiedad)
// ========================================
const autorizarPacientePropio = async (req, res, next) => {
  try {
    if (!req.usuario) {
      return res.status(401).json({
        mensaje: "Usuario no autenticado"
      });
    }

    // Administrador puede continuar
    if (req.usuario.rol === "administrador") {
      return next();
    }

    // Esta regla aplica a pacientes
    if (req.usuario.rol !== "paciente") {
      return res.status(403).json({
        mensaje: "No tiene permisos para acceder a este recurso"
      });
    }

    // Buscar perfil del paciente autenticado
    const pacienteAutenticado = await pacientesService.obtenerPacientePorUsuarioId(
      req.usuario.id
    );

    if (!pacienteAutenticado) {
      return res.status(403).json({
        mensaje: "El usuario no tiene un paciente asociado"
      });
    }

    // Paciente solicitado en URL
    const pacienteIdSolicitado = req.params.pacienteId;

    // Comprobar propiedad de manera segura
    if (String(pacienteAutenticado.id) !== String(pacienteIdSolicitado)) {
      return res.status(403).json({
        mensaje: "No tiene permisos para acceder a este recurso"
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

// ========================================
// Autorizar acceso al médico solicitado (BOLA / Propiedad)
// ========================================
const autorizarMedicoPropio = async (req, res, next) => {
  try {
    if (!req.usuario) {
      return res.status(401).json({
        mensaje: "Usuario no autenticado"
      });
    }

    // Administrador puede continuar
    if (req.usuario.rol === "administrador") {
      return next();
    }

    // Esta regla aplica a médicos
    if (req.usuario.rol !== "medico") {
      return res.status(403).json({
        mensaje: "No tiene permisos para acceder a este recurso"
      });
    }

    // Buscar perfil del médico autenticado
    const medicoAutenticado = await medicosService.obtenerMedicoPorUsuarioId(
      req.usuario.id
    );

    if (!medicoAutenticado) {
      return res.status(403).json({
        mensaje: "El usuario no tiene un médico asociado"
      });
    }

    // Médico solicitado en URL
    const medicoIdSolicitado = req.params.medicoId;

    // Comprobar propiedad de manera segura
    if (String(medicoAutenticado.id) !== String(medicoIdSolicitado)) {
      return res.status(403).json({
        mensaje: "No tiene permisos para acceder a este recurso"
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

// ========================================
// Autorizar acceso a una cita individual (BOLA / Objeto)
// ========================================
const autorizarAccesoCita = async (req, res, next) => {
  try {
    if (!req.usuario) {
      return res.status(401).json({
        mensaje: "Usuario no autenticado"
      });
    }

    // Administrador tiene acceso global
    if (req.usuario.rol === "administrador") {
      return next();
    }

    // Buscar la cita
    const citaId = req.params.id;
    const cita = await citasService.obtenerCitaPorId(citaId);

    if (!cita) {
      return res.status(404).json({
        mensaje: "Cita no encontrada"
      });
    }

    // Paciente: solo puede consultar su propia cita
    if (req.usuario.rol === "paciente") {
      const paciente = await pacientesService.obtenerPacientePorUsuarioId(
        req.usuario.id
      );

      if (!paciente || String(cita.pacienteId) !== String(paciente.id)) {
        return res.status(403).json({
          mensaje: "No tiene permisos para acceder a este recurso"
        });
      }

      return next();
    }

    // Médico: solo puede consultar cita asignada a él
    if (req.usuario.rol === "medico") {
      const medico = await medicosService.obtenerMedicoPorUsuarioId(
        req.usuario.id
      );

      if (!medico || String(cita.medicoId) !== String(medico.id)) {
        return res.status(403).json({
          mensaje: "No tiene permisos para acceder a este recurso"
        });
      }

      return next();
    }

    return res.status(403).json({
      mensaje: "No tiene permisos para acceder a este recurso"
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  autorizarPacientePropio,
  autorizarMedicoPropio,
  autorizarAccesoCita
};
