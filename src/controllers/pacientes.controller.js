const { matchedData } = require("express-validator");
const pacientesService = require("../services/pacientes.service");
const usuariosService = require("../services/usuarios.service");
const citasService = require("../services/citas.service");

// ========================================
// Validar reglas de asociación usuario <-> paciente
// ========================================
const validarUsuarioPaciente = async (usuarioId, pacienteIdExcluir = null) => {
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

  if (usuario.rol !== "paciente") {
    return {
      valido: false,
      status: 409,
      mensaje: "El usuario asociado no tiene rol paciente"
    };
  }

  const pacienteAsociado = await pacientesService.obtenerPacientePorUsuarioId(usuarioId);
  if (pacienteAsociado && (!pacienteIdExcluir || String(pacienteAsociado.id) !== String(pacienteIdExcluir))) {
    return {
      valido: false,
      status: 409,
      mensaje: "El usuario ya está asociado a un paciente"
    };
  }

  return { valido: true };
};

// ========================================
// GET todos
// ========================================
const obtenerPacientes = async (req, res, next) => {
  try {
    const pacientes = await pacientesService.obtenerPacientes();
    res.status(200).json(pacientes);
  } catch (error) {
    next(error);
  }
};

// ========================================
// GET por ID
// ========================================
const obtenerPacientePorId = async (req, res, next) => {
  try {
    const { id } = req.params;
    const paciente = await pacientesService.obtenerPacientePorId(id);

    if (!paciente) {
      return res.status(404).json({
        mensaje: "Paciente no encontrado"
      });
    }

    res.status(200).json(paciente);
  } catch (error) {
    next(error);
  }
};

// ========================================
// POST - Crear paciente
// ========================================
const crearPaciente = async (req, res, next) => {
  try {
    const datosPermitidos = matchedData(req, {
      locations: ["body"]
    });

    const validacionUsuario = await validarUsuarioPaciente(datosPermitidos.usuarioId);
    if (!validacionUsuario.valido) {
      return res.status(validacionUsuario.status).json({
        mensaje: validacionUsuario.mensaje
      });
    }

    const existente = await pacientesService.buscarPacientePorDocumento(
      datosPermitidos.documento
    );

    if (existente) {
      return res.status(409).json({
        mensaje: "Ya existe un paciente con ese documento"
      });
    }

    if (datosPermitidos.email) {
      const emailExistente = await pacientesService.buscarPacientePorEmail(
        datosPermitidos.email
      );
      if (emailExistente) {
        return res.status(409).json({
          mensaje: "Ya existe un paciente con ese correo electrónico"
        });
      }
    }

    const pacienteCreado = await pacientesService.crearPaciente(datosPermitidos);

    res.status(201).json({
      mensaje: "Paciente creado correctamente",
      paciente: pacienteCreado
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        mensaje: "Ya existe un paciente con ese documento o correo electrónico"
      });
    }
    if (error.code === "23503") {
      return res.status(400).json({
        mensaje: "Clave foránea inválida (el usuario indicado no existe)"
      });
    }
    next(error);
  }
};

// ========================================
// PUT - Actualización completa
// ========================================
const actualizarPaciente = async (req, res, next) => {
  try {
    const { id } = req.params;
    const datosPermitidos = matchedData(req, {
      locations: ["body"]
    });

    const validacionUsuario = await validarUsuarioPaciente(datosPermitidos.usuarioId, id);
    if (!validacionUsuario.valido) {
      return res.status(validacionUsuario.status).json({
        mensaje: validacionUsuario.mensaje
      });
    }

    const pacienteActual = await pacientesService.obtenerPacientePorId(id);
    if (!pacienteActual) {
      return res.status(404).json({
        mensaje: "Paciente no encontrado"
      });
    }

    const existente = await pacientesService.buscarPacientePorDocumento(
      datosPermitidos.documento
    );

    if (existente && String(existente.id) !== String(id)) {
      return res.status(409).json({
        mensaje: "El documento pertenece a otro paciente"
      });
    }

    if (datosPermitidos.email) {
      const emailExistente = await pacientesService.buscarPacientePorEmail(
        datosPermitidos.email
      );
      if (emailExistente && String(emailExistente.id) !== String(id)) {
        return res.status(409).json({
          mensaje: "El correo electrónico pertenece a otro paciente"
        });
      }
    }

    const pacienteActualizado = await pacientesService.actualizarPaciente(
      id,
      datosPermitidos
    );

    res.status(200).json({
      mensaje: "Paciente actualizado correctamente",
      paciente: pacienteActualizado
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        mensaje: "Ya existe un paciente con ese documento o correo electrónico"
      });
    }
    if (error.code === "23503") {
      return res.status(400).json({
        mensaje: "Clave foránea inválida (el usuario indicado no existe)"
      });
    }
    next(error);
  }
};

// ========================================
// PATCH - Actualización parcial
// ========================================
const actualizarPacienteParcial = async (req, res, next) => {
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
      const validacionUsuario = await validarUsuarioPaciente(datosPermitidos.usuarioId, id);
      if (!validacionUsuario.valido) {
        return res.status(validacionUsuario.status).json({
          mensaje: validacionUsuario.mensaje
        });
      }
    }

    const pacienteActual = await pacientesService.obtenerPacientePorId(id);
    if (!pacienteActual) {
      return res.status(404).json({
        mensaje: "Paciente no encontrado"
      });
    }

    if (datosPermitidos.documento) {
      const existente = await pacientesService.buscarPacientePorDocumento(
        datosPermitidos.documento
      );

      if (existente && String(existente.id) !== String(id)) {
        return res.status(409).json({
          mensaje: "El documento pertenece a otro paciente"
        });
      }
    }

    if (datosPermitidos.email) {
      const emailExistente = await pacientesService.buscarPacientePorEmail(
        datosPermitidos.email
      );
      if (emailExistente && String(emailExistente.id) !== String(id)) {
        return res.status(409).json({
          mensaje: "El correo electrónico pertenece a otro paciente"
        });
      }
    }

    const pacienteActualizado = await pacientesService.actualizarPacienteParcial(
      id,
      datosPermitidos
    );

    res.status(200).json({
      mensaje: "Paciente actualizado parcialmente",
      paciente: pacienteActualizado
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        mensaje: "Ya existe un paciente con ese documento o correo electrónico"
      });
    }
    if (error.code === "23503") {
      return res.status(400).json({
        mensaje: "Clave foránea inválida (el usuario indicado no existe)"
      });
    }
    next(error);
  }
};

// ========================================
// DELETE
// ========================================
const eliminarPaciente = async (req, res, next) => {
  try {
    const { id } = req.params;
    const paciente = await pacientesService.obtenerPacientePorId(id);

    if (!paciente) {
      return res.status(404).json({
        mensaje: "Paciente no encontrado"
      });
    }

    const tieneCitas = await citasService.pacienteTieneCitas(id);
    if (tieneCitas) {
      return res.status(409).json({
        mensaje: "No se puede eliminar el paciente porque tiene citas asociadas"
      });
    }

    const pacienteEliminado = await pacientesService.eliminarPaciente(id);

    return res.status(200).json({
      mensaje: "Paciente eliminado correctamente",
      paciente: pacienteEliminado
    });
  } catch (error) {
    if (error.code === "23503") {
      return res.status(409).json({
        mensaje: "No se puede eliminar el paciente porque tiene citas u otros registros asociados en la base de datos"
      });
    }
    next(error);
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