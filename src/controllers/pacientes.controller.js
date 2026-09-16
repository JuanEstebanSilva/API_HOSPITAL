const {
  matchedData
} = require(
  "express-validator"
);

const pacientesService =
  require(
    "../services/pacientes.service"
  );

// Movido aquí arriba para que sea accesible en todo el archivo
const citasService =
  require(
    "../services/citas.service"
  );

const obtenerPacientes = (
  req,
  res
) => {
  const pacientes =
    pacientesService
      .obtenerPacientes();

  res
    .status(200)
    .json(
      pacientes
    );
};

const obtenerPacientePorId = (
  req,
  res
) => {
  const {
    id
  } = req.params;

  const paciente =
    pacientesService
      .obtenerPacientePorId(
        id
      );

  if (!paciente) {
    return res
      .status(404)
      .json({
        mensaje:
          "Paciente no encontrado"
      });
  }

  res
    .status(200)
    .json(
      paciente
    );
};

const crearPaciente = (
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

  const existente =
    pacientesService
      .buscarPacientePorDocumento(
        datosPermitidos.documento
      );

  if (existente) {
    return res
      .status(409)
      .json({
        mensaje:
          "Ya existe un paciente con ese documento"
      });
  }

  const pacienteCreado =
    pacientesService
      .crearPaciente(
        datosPermitidos
      );

  res
    .status(201)
    .json({
      mensaje:
        "Paciente creado correctamente",

      paciente:
        pacienteCreado
    });
};

const actualizarPaciente = (
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

  const existente =
    pacientesService
      .buscarPacientePorDocumento(
        datosPermitidos.documento
      );

  if (
    existente &&
    existente.id !==
      Number(id)
  ) {
    return res
      .status(409)
      .json({
        mensaje:
          "El documento pertenece a otro paciente"
      });
  }

  const pacienteActualizado =
    pacientesService
      .actualizarPaciente(
        id,
        datosPermitidos
      );

  if (
    !pacienteActualizado
  ) {
    return res
      .status(404)
      .json({
        mensaje:
          "Paciente no encontrado"
      });
  }

  res
    .status(200)
    .json({
      mensaje:
        "Paciente actualizado correctamente",

      paciente:
        pacienteActualizado
    });
};

const actualizarPacienteParcial = (
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

  if (
    datosPermitidos.documento
  ) {
    const existente =
      pacientesService
        .buscarPacientePorDocumento(
          datosPermitidos.documento
        );

    if (
      existente &&
      existente.id !==
        Number(id)
    ) {
      return res
        .status(409)
        .json({
          mensaje:
            "El documento pertenece a otro paciente"
        });
    }
  }

  const pacienteActualizado =
    pacientesService
      .actualizarPacienteParcial(
        id,
        datosPermitidos
      );

  if (
    !pacienteActualizado
  ) {
    return res
      .status(404)
      .json({
        mensaje:
          "Paciente no encontrado"
      });
  }

  res
    .status(200)
    .json({
      mensaje:
        "Paciente actualizado parcialmente",

      paciente:
        pacienteActualizado
    });
};

const eliminarPaciente = (req, res) => {
  const { id } = req.params;
  const paciente =
    pacientesService.obtenerPacientePorId(id);
  
  if (!paciente) {
    return res.status(404).json({
      mensaje: "Paciente no encontrado"
    });
  }

  const tieneCitas =
    citasService.pacienteTieneCitas(id);
  
  if (tieneCitas) {
    return res.status(409).json({
      mensaje:
        "No se puede eliminar el paciente porque tiene citas asociadas"
    });
  }

  const pacienteEliminado =
    pacientesService.eliminarPaciente(id);
  
  return res.status(200).json({
    mensaje: "Paciente eliminado correctamente",
    paciente: pacienteEliminado
  });
};

module.exports = {
  obtenerPacientes,
  obtenerPacientePorId,
  crearPaciente,
  actualizarPaciente,
  actualizarPacienteParcial,
  eliminarPaciente
};