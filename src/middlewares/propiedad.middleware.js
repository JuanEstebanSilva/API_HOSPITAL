const pacientesService = require("../services/pacientes.service");
const medicosService = require("../services/medicos.service");
const citasService = require("../services/citas.service");

// ========================================
// Autorizar acceso al paciente solicitado (BOLA / Propiedad)
// ========================================
const autorizarPacientePropio = (req, res, next) => {
  // --------------------------------------
  // Requiere autenticación previa
  // --------------------------------------
  if (!req.usuario) {
    return res.status(401).json({
      mensaje: "Usuario no autenticado"
    });
  }

  // --------------------------------------
  // Administrador puede continuar
  // --------------------------------------
  if (req.usuario.rol === "administrador") {
    return next();
  }

  // --------------------------------------
  // Esta regla aplica a pacientes
  // --------------------------------------
  if (req.usuario.rol !== "paciente") {
    return res.status(403).json({
      mensaje: "No tiene permisos para acceder a este recurso"
    });
  }

  // --------------------------------------
  // Buscar perfil del usuario autenticado
  // --------------------------------------
  const pacienteAutenticado = pacientesService.obtenerPacientePorUsuarioId(
    req.usuario.id
  );

  if (!pacienteAutenticado) {
    return res.status(403).json({
      mensaje: "El usuario no tiene un paciente asociado"
    });
  }

  // --------------------------------------
  // Paciente solicitado en URL
  // --------------------------------------
  const pacienteIdSolicitado = Number(req.params.pacienteId);

  // --------------------------------------
  // Comprobar propiedad
  // --------------------------------------
  if (pacienteAutenticado.id !== pacienteIdSolicitado) {
    return res.status(403).json({
      mensaje: "No tiene permisos para acceder a este recurso"
    });
  }

  // --------------------------------------
  // Es su propio recurso
  // --------------------------------------
  next();
};

// ========================================
// Autorizar acceso al médico solicitado (BOLA / Propiedad)
// ========================================
const autorizarMedicoPropio = (req, res, next) => {
  // --------------------------------------
  // Requiere autenticación previa
  // --------------------------------------
  if (!req.usuario) {
    return res.status(401).json({
      mensaje: "Usuario no autenticado"
    });
  }

  // --------------------------------------
  // Administrador puede continuar
  // --------------------------------------
  if (req.usuario.rol === "administrador") {
    return next();
  }

  // --------------------------------------
  // Esta regla aplica a médicos
  // --------------------------------------
  if (req.usuario.rol !== "medico") {
    return res.status(403).json({
      mensaje: "No tiene permisos para acceder a este recurso"
    });
  }

  // --------------------------------------
  // Buscar perfil del médico autenticado
  // --------------------------------------
  const medicoAutenticado = medicosService.obtenerMedicoPorUsuarioId(
    req.usuario.id
  );

  if (!medicoAutenticado) {
    return res.status(403).json({
      mensaje: "El usuario no tiene un médico asociado"
    });
  }

  // --------------------------------------
  // Médico solicitado en URL
  // --------------------------------------
  const medicoIdSolicitado = Number(req.params.medicoId);

  // --------------------------------------
  // Comprobar propiedad
  // --------------------------------------
  if (medicoAutenticado.id !== medicoIdSolicitado) {
    return res.status(403).json({
      mensaje: "No tiene permisos para acceder a este recurso"
    });
  }

  // --------------------------------------
  // Es su propio recurso
  // --------------------------------------
  next();
};

// ========================================
// Autorizar acceso a una cita individual (BOLA / Objeto)
// ========================================
const autorizarAccesoCita = (req, res, next) => {
  // --------------------------------------
  // Requiere autenticación previa
  // --------------------------------------
  if (!req.usuario) {
    return res.status(401).json({
      mensaje: "Usuario no autenticado"
    });
  }

  // --------------------------------------
  // Administrador tiene acceso global
  // --------------------------------------
  if (req.usuario.rol === "administrador") {
    return next();
  }

  // --------------------------------------
  // Buscar la cita
  // --------------------------------------
  const citaId = Number(req.params.id);
  const cita = citasService.obtenerCitaPorId(citaId);

  if (!cita) {
    return res.status(404).json({
      mensaje: "Cita no encontrada"
    });
  }

  // --------------------------------------
  // Paciente: solo puede consultar su propia cita
  // --------------------------------------
  if (req.usuario.rol === "paciente") {
    const paciente = pacientesService.obtenerPacientePorUsuarioId(
      req.usuario.id
    );

    if (!paciente || cita.pacienteId !== paciente.id) {
      return res.status(403).json({
        mensaje: "No tiene permisos para acceder a este recurso"
      });
    }

    return next();
  }

  // --------------------------------------
  // Médico: solo puede consultar cita asignada a él
  // --------------------------------------
  if (req.usuario.rol === "medico") {
    const medico = medicosService.obtenerMedicoPorUsuarioId(
      req.usuario.id
    );

    if (!medico || cita.medicoId !== medico.id) {
      return res.status(403).json({
        mensaje: "No tiene permisos para acceder a este recurso"
      });
    }

    return next();
  }

  return res.status(403).json({
    mensaje: "No tiene permisos para acceder a este recurso"
  });
};

module.exports = {
  autorizarPacientePropio,
  autorizarMedicoPropio,
  autorizarAccesoCita
};
