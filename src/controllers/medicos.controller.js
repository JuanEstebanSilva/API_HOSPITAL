const {
  matchedData
} = require("express-validator");


const medicosService =
  require(
    "../services/medicos.service"
  );

const citasService =
 require("../services/citas.service");

const especialidadesService =
  require(
    "../services/especialidades.service"
  );

const usuariosService =
  require(
    "../services/usuarios.service"
  );

// ========================================
// Validar reglas de asociación usuario <-> médico
// ========================================
const validarUsuarioMedico = (usuarioId, medicoIdExcluir = null) => {
  if (!usuarioId) {
    return { valido: true };
  }

  const usuario = usuariosService.obtenerUsuarioPorId(usuarioId);
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

  const medicoAsociado = medicosService.obtenerMedicoPorUsuarioId(usuarioId);
  if (medicoAsociado && (!medicoIdExcluir || medicoAsociado.id !== Number(medicoIdExcluir))) {
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

const obtenerMedicos = (
  req,
  res
) => {

  const medicos =
    medicosService
      .obtenerMedicos();


  res
    .status(200)
    .json(
      medicos
    );
};


// ========================================
// GET por ID
// ========================================

const obtenerMedicoPorId = (
  req,
  res
) => {

  const {
    id
  } = req.params;


  const medico =
    medicosService
      .obtenerMedicoPorId(
        id
      );


  if (
    !medico
  ) {

    return res
      .status(404)
      .json({
        mensaje:
          "Médico no encontrado"
      });
  }


  res
    .status(200)
    .json(
      medico
    );
};


// ========================================
// GET médicos por especialidad
// ========================================

const obtenerMedicosPorEspecialidad = (
  req,
  res
) => {

  const {
    especialidadId
  } = req.params;


  const especialidad =
    especialidadesService
      .obtenerEspecialidadPorId(
        especialidadId
      );


  if (
    !especialidad
  ) {

    return res
      .status(404)
      .json({
        mensaje:
          "Especialidad no encontrada"
      });
  }


  const medicos =
    medicosService
      .obtenerMedicosPorEspecialidad(
        especialidadId
      );


  res
    .status(200)
    .json(
      medicos
    );
};


// ========================================
// POST
// Crear médico
// ========================================

const crearMedico = (
  req,
  res
) => {

  const datosPermitidos =
    matchedData(
      req,
      {
        locations: [
          "body"
        ]
      }
    );

  const validacionUsuario = validarUsuarioMedico(datosPermitidos.usuarioId);
  if (!validacionUsuario.valido) {
    return res.status(validacionUsuario.status).json({
      mensaje: validacionUsuario.mensaje
    });
  }


  // ----------------------------------------
  // Validar que la especialidad exista
  // ----------------------------------------

  const especialidad =
    especialidadesService
      .obtenerEspecialidadPorId(
        datosPermitidos
          .especialidadId
      );


  if (
    !especialidad
  ) {

    return res
      .status(400)
      .json({
        mensaje:
          "La especialidad indicada no existe"
      });
  }


  // ----------------------------------------
  // Validar que la especialidad esté activa
  // ----------------------------------------

  if (
    !especialidad.activa
  ) {

    return res
      .status(409)
      .json({
        mensaje:
          "No se puede asignar una especialidad inactiva"
      });
  }


  // ----------------------------------------
  // Registro médico único
  // ----------------------------------------

  const registroExistente =
    medicosService
      .buscarMedicoPorRegistro(
        datosPermitidos
          .registroMedico
      );


  if (
    registroExistente
  ) {

    return res
      .status(409)
      .json({
        mensaje:
          "Ya existe un médico con ese registro médico"
      });
  }


  // ----------------------------------------
  // Email único
  // ----------------------------------------

  const emailExistente =
    medicosService
      .buscarMedicoPorEmail(
        datosPermitidos.email
      );


  if (
    emailExistente
  ) {

    return res
      .status(409)
      .json({
        mensaje:
          "Ya existe un médico con ese correo electrónico"
      });
  }


  const medicoCreado =
    medicosService
      .crearMedico(
        datosPermitidos
      );


  res
    .status(201)
    .json({

      mensaje:
        "Médico creado correctamente",

      medico:
        medicoCreado
    });
};


// ========================================
// PUT
// Actualización completa
// ========================================

const actualizarMedico = (
  req,
  res
) => {

  const {
    id
  } = req.params;


  const datosPermitidos =
    matchedData(
      req,
      {
        locations: [
          "body"
        ]
      }
    );

  const validacionUsuario = validarUsuarioMedico(datosPermitidos.usuarioId, id);
  if (!validacionUsuario.valido) {
    return res.status(validacionUsuario.status).json({
      mensaje: validacionUsuario.mensaje
    });
  }


  // ----------------------------------------
  // Comprobar que el médico existe
  // ----------------------------------------

  const medicoActual =
    medicosService
      .obtenerMedicoPorId(
        id
      );


  if (
    !medicoActual
  ) {

    return res
      .status(404)
      .json({
        mensaje:
          "Médico no encontrado"
      });
  }


  // ----------------------------------------
  // Comprobar especialidad
  // ----------------------------------------

  const especialidad =
    especialidadesService
      .obtenerEspecialidadPorId(
        datosPermitidos
          .especialidadId
      );


  if (
    !especialidad
  ) {

    return res
      .status(400)
      .json({
        mensaje:
          "La especialidad indicada no existe"
      });
  }


  if (
    !especialidad.activa
  ) {

    return res
      .status(409)
      .json({
        mensaje:
          "No se puede asignar una especialidad inactiva"
      });
  }


  // ----------------------------------------
  // Comprobar registro médico duplicado
  // ----------------------------------------

  const registroExistente =
    medicosService
      .buscarMedicoPorRegistro(
        datosPermitidos
          .registroMedico
      );


  if (
    registroExistente &&
    registroExistente.id !==
      Number(id)
  ) {

    return res
      .status(409)
      .json({
        mensaje:
          "El registro médico pertenece a otro médico"
      });
  }


  // ----------------------------------------
  // Comprobar email duplicado
  // ----------------------------------------

  const emailExistente =
    medicosService
      .buscarMedicoPorEmail(
        datosPermitidos.email
      );


  if (
    emailExistente &&
    emailExistente.id !==
      Number(id)
  ) {

    return res
      .status(409)
      .json({
        mensaje:
          "El correo electrónico pertenece a otro médico"
      });
  }


  const medicoActualizado =
    medicosService
      .actualizarMedico(
        id,
        datosPermitidos
      );


  res
    .status(200)
    .json({

      mensaje:
        "Médico actualizado correctamente",

      medico:
        medicoActualizado
    });
};


// ========================================
// PATCH
// Actualización parcial
// ========================================

const actualizarMedicoParcial = (
  req,
  res
) => {

  const {
    id
  } = req.params;


  const datosPermitidos =
    matchedData(
      req,
      {
        locations: [
          "body"
        ]
      }
    );


  // ----------------------------------------
  // Evitar PATCH vacío
  // ----------------------------------------

  if (
    Object.keys(
      datosPermitidos
    ).length === 0
  ) {

    return res
      .status(400)
      .json({
        mensaje:
          "Debe enviar al menos un campo para actualizar"
      });
  }

  if (datosPermitidos.usuarioId !== undefined) {
    const validacionUsuario = validarUsuarioMedico(datosPermitidos.usuarioId, id);
    if (!validacionUsuario.valido) {
      return res.status(validacionUsuario.status).json({
        mensaje: validacionUsuario.mensaje
      });
    }
  }


  // ----------------------------------------
  // Comprobar médico
  // ----------------------------------------

  const medicoActual =
    medicosService
      .obtenerMedicoPorId(
        id
      );


  if (
    !medicoActual
  ) {

    return res
      .status(404)
      .json({
        mensaje:
          "Médico no encontrado"
      });
  }


  // ----------------------------------------
  // Si cambia especialidadId
  // validar relación
  // ----------------------------------------

  if (
    datosPermitidos
      .especialidadId !==
    undefined
  ) {

    const especialidad =
      especialidadesService
        .obtenerEspecialidadPorId(
          datosPermitidos
            .especialidadId
        );


    if (
      !especialidad
    ) {

      return res
        .status(400)
        .json({
          mensaje:
            "La especialidad indicada no existe"
        });
    }


    if (
      !especialidad.activa
    ) {

      return res
        .status(409)
        .json({
          mensaje:
            "No se puede asignar una especialidad inactiva"
        });
    }
  }


  // ----------------------------------------
  // Si cambia registro médico
  // comprobar duplicado
  // ----------------------------------------

  if (
    datosPermitidos
      .registroMedico
  ) {

    const registroExistente =
      medicosService
        .buscarMedicoPorRegistro(
          datosPermitidos
            .registroMedico
        );


    if (
      registroExistente &&
      registroExistente.id !==
        Number(id)
    ) {

      return res
        .status(409)
        .json({
          mensaje:
            "El registro médico pertenece a otro médico"
        });
    }
  }


  // ----------------------------------------
  // Si cambia email
  // comprobar duplicado
  // ----------------------------------------

  if (
    datosPermitidos.email
  ) {

    const emailExistente =
      medicosService
        .buscarMedicoPorEmail(
          datosPermitidos.email
        );


    if (
      emailExistente &&
      emailExistente.id !==
        Number(id)
    ) {

      return res
        .status(409)
        .json({
          mensaje:
            "El correo electrónico pertenece a otro médico"
        });
    }
  }


  const medicoActualizado =
    medicosService
      .actualizarMedicoParcial(
        id,
        datosPermitidos
      );


  res
    .status(200)
    .json({

      mensaje:
        "Médico actualizado parcialmente",

      medico:
        medicoActualizado
    });
};


// ========================================
// DELETE
// ========================================
const eliminarMedico = (req, res) => {
 const { id } = req.params;
 const medico =
 medicosService.obtenerMedicoPorId(id);
 if (!medico) {
 return res.status(404).json({
 mensaje: "Médico no encontrado"
 });
 }
 const tieneCitas =
 citasService.medicoTieneCitas(id);
 if (tieneCitas) {
 return res.status(409).json({
 mensaje:
 "No se puede eliminar el médico porque tiene citas asociadas"
 });
 }
 const medicoEliminado =
 medicosService.eliminarMedico(id);
 return res.status(200).json({
 mensaje: "Médico eliminado correctamente",
 medico: medicoEliminado
 });
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