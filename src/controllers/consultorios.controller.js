const {
  matchedData
} = require("express-validator");


const consultoriosService =
  require(
    "../services/consultorios.service"
  );

const citasService =
 require("../services/citas.service");

// ========================================
// GET todos
// ========================================

const obtenerConsultorios = (
  req,
  res
) => {

  const consultorios =
    consultoriosService
      .obtenerConsultorios();


  res
    .status(200)
    .json(
      consultorios
    );
};


// ========================================
// GET por ID
// ========================================

const obtenerConsultorioPorId = (
  req,
  res
) => {

  const {
    id
  } = req.params;


  const consultorio =
    consultoriosService
      .obtenerConsultorioPorId(
        id
      );


  if (
    !consultorio
  ) {

    return res
      .status(404)
      .json({
        mensaje:
          "Consultorio no encontrado"
      });
  }


  res
    .status(200)
    .json(
      consultorio
    );
};


// ========================================
// POST
// ========================================

const crearConsultorio = (
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


  // ----------------------------------------
  // Validar código único
  // ----------------------------------------

  const existente =
    consultoriosService
      .buscarConsultorioPorCodigo(
        datosPermitidos.codigo
      );


  if (
    existente
  ) {

    return res
      .status(409)
      .json({
        mensaje:
          "Ya existe un consultorio con ese código"
      });
  }


  const consultorioCreado =
    consultoriosService
      .crearConsultorio(
        datosPermitidos
      );


  res
    .status(201)
    .json({

      mensaje:
        "Consultorio creado correctamente",

      consultorio:
        consultorioCreado
    });
};


// ========================================
// PUT
// ========================================

const actualizarConsultorio = (
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
  // Comprobar que existe
  // ----------------------------------------

  const consultorioActual =
    consultoriosService
      .obtenerConsultorioPorId(
        id
      );


  if (
    !consultorioActual
  ) {

    return res
      .status(404)
      .json({
        mensaje:
          "Consultorio no encontrado"
      });
  }


  // ----------------------------------------
  // Comprobar código duplicado
  // ----------------------------------------

  const codigoExistente =
    consultoriosService
      .buscarConsultorioPorCodigo(
        datosPermitidos.codigo
      );


  if (
    codigoExistente &&
    codigoExistente.id !==
      Number(id)
  ) {

    return res
      .status(409)
      .json({
        mensaje:
          "El código pertenece a otro consultorio"
      });
  }


  const consultorioActualizado =
    consultoriosService
      .actualizarConsultorio(
        id,
        datosPermitidos
      );


  res
    .status(200)
    .json({

      mensaje:
        "Consultorio actualizado correctamente",

      consultorio:
        consultorioActualizado
    });
};


// ========================================
// PATCH
// ========================================

const actualizarConsultorioParcial = (
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


  // ----------------------------------------
  // Comprobar existencia
  // ----------------------------------------

  const consultorioActual =
    consultoriosService
      .obtenerConsultorioPorId(
        id
      );


  if (
    !consultorioActual
  ) {

    return res
      .status(404)
      .json({
        mensaje:
          "Consultorio no encontrado"
      });
  }


  // ----------------------------------------
  // Si cambia código,
  // comprobar que no esté duplicado
  // ----------------------------------------

  if (
    datosPermitidos.codigo
  ) {

    const codigoExistente =
      consultoriosService
        .buscarConsultorioPorCodigo(
          datosPermitidos.codigo
        );


    if (
      codigoExistente &&
      codigoExistente.id !==
        Number(id)
    ) {

      return res
        .status(409)
        .json({
          mensaje:
            "El código pertenece a otro consultorio"
        });
    }
  }


  const consultorioActualizado =
    consultoriosService
      .actualizarConsultorioParcial(
        id,
        datosPermitidos
      );


  res
    .status(200)
    .json({

      mensaje:
        "Consultorio actualizado parcialmente",

      consultorio:
        consultorioActualizado
    });
};


// ========================================
// DELETE
// ========================================

const eliminarConsultorio = (req, res) => {
 const { id } = req.params;
 const consultorio =
 consultoriosService.obtenerConsultorioPorId(id);
 if (!consultorio) {
 return res.status(404).json({
 mensaje: "Consultorio no encontrado"
 });
 }
 const tieneCitas =
 citasService.consultorioTieneCitas(id);
 if (tieneCitas) {
 return res.status(409).json({
 mensaje:
 "No se puede eliminar el consultorio porque tiene citas asociadas"
 });
 }
 const consultorioEliminado =
 consultoriosService.eliminarConsultorio(id);
 return res.status(200).json({
 mensaje: "Consultorio eliminado correctamente",
 consultorio: consultorioEliminado
 });
};


module.exports = {
  obtenerConsultorios,
  obtenerConsultorioPorId,
  crearConsultorio,
  actualizarConsultorio,
  actualizarConsultorioParcial,
  eliminarConsultorio
};