const {
  matchedData
} = require("express-validator");


const citasService =
  require(
    "../services/citas.service"
  );


const pacientesService =
  require(
    "../services/pacientes.service"
  );


const medicosService =
  require(
    "../services/medicos.service"
  );


const consultoriosService =
  require(
    "../services/consultorios.service"
  );


const especialidadesService =
  require(
    "../services/especialidades.service"
  );


// ========================================
// Validar relaciones de la cita
// ========================================

const validarRelacionesCita = (
  datos
) => {

  const paciente =
    pacientesService
      .obtenerPacientePorId(
        datos.pacienteId
      );


  if (
    !paciente
  ) {

    return {
      status: 400,
      mensaje:
        "El paciente indicado no existe"
    };
  }


  const medico =
    medicosService
      .obtenerMedicoPorId(
        datos.medicoId
      );


  if (
    !medico
  ) {

    return {
      status: 400,
      mensaje:
        "El médico indicado no existe"
    };
  }


  if (
    !medico.activo
  ) {

    return {
      status: 409,
      mensaje:
        "No se pueden programar citas con un médico inactivo"
    };
  }


  const especialidad =
    especialidadesService
      .obtenerEspecialidadPorId(
        medico.especialidadId
      );


  if (
    !especialidad
  ) {

    return {
      status: 409,
      mensaje:
        "La especialidad asociada al médico no existe"
    };
  }


  if (
    !especialidad.activa
  ) {

    return {
      status: 409,
      mensaje:
        "La especialidad del médico se encuentra inactiva"
    };
  }


  const consultorio =
    consultoriosService
      .obtenerConsultorioPorId(
        datos.consultorioId
      );


  if (
    !consultorio
  ) {

    return {
      status: 400,
      mensaje:
        "El consultorio indicado no existe"
    };
  }


  if (
    !consultorio.activo
  ) {

    return {
      status: 409,
      mensaje:
        "El consultorio se encuentra inactivo"
    };
  }


  return null;
};


// ========================================
// Validar disponibilidad
// ========================================

const validarDisponibilidad = (
  datos,
  citaIdExcluir = null
) => {

  const conflictoMedico =
    citasService
      .medicoTieneConflicto(
        datos.medicoId,
        datos.fecha,
        datos.hora,
        citaIdExcluir
      );


  if (
    conflictoMedico
  ) {

    return {
      status: 409,
      mensaje:
        "El médico ya tiene una cita programada en esa fecha y hora"
    };
  }


  const conflictoConsultorio =
    citasService
      .consultorioTieneConflicto(
        datos.consultorioId,
        datos.fecha,
        datos.hora,
        citaIdExcluir
      );


  if (
    conflictoConsultorio
  ) {

    return {
      status: 409,
      mensaje:
        "El consultorio ya está ocupado en esa fecha y hora"
    };
  }


  return null;
};


// ========================================
// GET todas
// ========================================

const obtenerCitas = (
  req,
  res
) => {

  const citas =
    citasService
      .obtenerCitas();


  res
    .status(200)
    .json(
      citas
    );
};


// ========================================
// GET por ID
// ========================================

const obtenerCitaPorId = (
  req,
  res
) => {

  const {
    id
  } = req.params;


  const cita =
    citasService
      .obtenerCitaPorId(
        id
      );


  if (
    !cita
  ) {

    return res
      .status(404)
      .json({
        mensaje:
          "Cita no encontrada"
      });
  }


  res
    .status(200)
    .json(
      cita
    );
};


// ========================================
// GET por paciente
// ========================================

const obtenerCitasPorPaciente = (
  req,
  res
) => {

  const {
    pacienteId
  } = req.params;


  const paciente =
    pacientesService
      .obtenerPacientePorId(
        pacienteId
      );


  if (
    !paciente
  ) {

    return res
      .status(404)
      .json({
        mensaje:
          "Paciente no encontrado"
      });
  }


  const citas =
    citasService
      .obtenerCitasPorPaciente(
        pacienteId
      );


  res
    .status(200)
    .json(
      citas
    );
};


// ========================================
// GET por médico
// ========================================

const obtenerCitasPorMedico = (
  req,
  res
) => {

  const {
    medicoId
  } = req.params;


  const medico =
    medicosService
      .obtenerMedicoPorId(
        medicoId
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


  const citas =
    citasService
      .obtenerCitasPorMedico(
        medicoId
      );


  res
    .status(200)
    .json(
      citas
    );
};


// ========================================
// POST
// La cita siempre nace programada
// ========================================

const crearCita = (
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


  const errorRelacion =
    validarRelacionesCita(
      datosPermitidos
    );


  if (
    errorRelacion
  ) {

    return res
      .status(
        errorRelacion.status
      )
      .json({
        mensaje:
          errorRelacion.mensaje
      });
  }


  const errorDisponibilidad =
    validarDisponibilidad(
      datosPermitidos
    );


  if (
    errorDisponibilidad
  ) {

    return res
      .status(
        errorDisponibilidad.status
      )
      .json({
        mensaje:
          errorDisponibilidad.mensaje
      });
  }


  const citaCreada =
    citasService
      .crearCita(
        datosPermitidos
      );


  res
    .status(201)
    .json({

      mensaje:
        "Cita creada correctamente",

      cita:
        citaCreada
    });
};


// ========================================
// PUT
// Reemplaza los datos editables,
// pero conserva el estado
// ========================================

const actualizarCita = (
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


  const citaActual =
    citasService
      .obtenerCitaPorId(
        id
      );


  if (
    !citaActual
  ) {

    return res
      .status(404)
      .json({
        mensaje:
          "Cita no encontrada"
      });
  }


  const citaPropuesta = {

    ...datosPermitidos,

    estado:
      citaActual.estado
  };


  const errorRelacion =
    validarRelacionesCita(
      citaPropuesta
    );


  if (
    errorRelacion
  ) {

    return res
      .status(
        errorRelacion.status
      )
      .json({
        mensaje:
          errorRelacion.mensaje
      });
  }


  const errorDisponibilidad =
    validarDisponibilidad(
      citaPropuesta,
      id
    );


  if (
    errorDisponibilidad
  ) {

    return res
      .status(
        errorDisponibilidad.status
      )
      .json({
        mensaje:
          errorDisponibilidad.mensaje
      });
  }


  const citaActualizada =
    citasService
      .actualizarCita(
        id,
        datosPermitidos
      );


  res
    .status(200)
    .json({

      mensaje:
        "Cita actualizada correctamente",

      cita:
        citaActualizada
    });
};


// ========================================
// PATCH general
// No modifica estado
// ========================================

const actualizarCitaParcial = (
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


  const citaActual =
    citasService
      .obtenerCitaPorId(
        id
      );


  if (
    !citaActual
  ) {

    return res
      .status(404)
      .json({
        mensaje:
          "Cita no encontrada"
      });
  }


  const citaPropuesta = {

    pacienteId:
      datosPermitidos.pacienteId ??
      citaActual.pacienteId,

    medicoId:
      datosPermitidos.medicoId ??
      citaActual.medicoId,

    consultorioId:
      datosPermitidos.consultorioId ??
      citaActual.consultorioId,

    fecha:
      datosPermitidos.fecha ??
      citaActual.fecha,

    hora:
      datosPermitidos.hora ??
      citaActual.hora,

    motivo:
      datosPermitidos.motivo ??
      citaActual.motivo,

    estado:
      citaActual.estado
  };


  const errorRelacion =
    validarRelacionesCita(
      citaPropuesta
    );


  if (
    errorRelacion
  ) {

    return res
      .status(
        errorRelacion.status
      )
      .json({
        mensaje:
          errorRelacion.mensaje
      });
  }


  const errorDisponibilidad =
    validarDisponibilidad(
      citaPropuesta,
      id
    );


  if (
    errorDisponibilidad
  ) {

    return res
      .status(
        errorDisponibilidad.status
      )
      .json({
        mensaje:
          errorDisponibilidad.mensaje
      });
  }


  const citaActualizada =
    citasService
      .actualizarCitaParcial(
        id,
        datosPermitidos
      );


  res
    .status(200)
    .json({

      mensaje:
        "Cita actualizada parcialmente",

      cita:
        citaActualizada
    });
};


// ========================================
// PATCH especializado de estado
// ========================================

const actualizarEstadoCita = (
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


  const citaActual =
    citasService
      .obtenerCitaPorId(
        id
      );


  if (
    !citaActual
  ) {

    return res
      .status(404)
      .json({
        mensaje:
          "Cita no encontrada"
      });
  }


  const nuevoEstado =
    datosPermitidos.estado;


  const transicionesPermitidas = {

    programada: [
      "confirmada",
      "cancelada"
    ],

    confirmada: [
      "atendida",
      "cancelada"
    ],

    atendida: [],

    cancelada: []
  };


  const estadoActual =
    citaActual.estado;


  const permitidos =
    transicionesPermitidas[
      estadoActual
    ];


  if (
    !permitidos.includes(
      nuevoEstado
    )
  ) {

    return res
      .status(409)
      .json({

        mensaje:
          `No se permite cambiar una cita de ${estadoActual} a ${nuevoEstado}`
      });
  }


  const citaActualizada =
    citasService
      .actualizarEstadoCita(
        id,
        nuevoEstado
      );


  res
    .status(200)
    .json({

      mensaje:
        "Estado de la cita actualizado correctamente",

      cita:
        citaActualizada
    });
};


// ========================================
// DELETE
// ========================================

const eliminarCita = (
  req,
  res
) => {

  const {
    id
  } = req.params;


  const citaEliminada =
    citasService
      .eliminarCita(
        id
      );


  if (
    !citaEliminada
  ) {

    return res
      .status(404)
      .json({
        mensaje:
          "Cita no encontrada"
      });
  }


  res
    .status(200)
    .json({

      mensaje:
        "Cita eliminada correctamente",

      cita:
        citaEliminada
    });
};


module.exports = {
  obtenerCitas,
  obtenerCitaPorId,
  obtenerCitasPorPaciente,
  obtenerCitasPorMedico,
  crearCita,
  actualizarCita,
  actualizarCitaParcial,
  actualizarEstadoCita,
  eliminarCita
};