const consultorios =
  require("../data/consultorios");


// ========================================
// Obtener todos
// ========================================

const obtenerConsultorios = () => {
  return consultorios;
};


// ========================================
// Obtener por ID
// ========================================

const obtenerConsultorioPorId = (
  id
) => {

  return consultorios.find(
    consultorio =>
      consultorio.id === Number(id)
  );
};


// ========================================
// Buscar por código
// ========================================

const buscarConsultorioPorCodigo = (
  codigo
) => {

  return consultorios.find(
    consultorio =>
      consultorio.codigo
        .toLowerCase() ===
      codigo
        .toLowerCase()
  );
};


// ========================================
// Crear consultorio
// ========================================

const crearConsultorio = (
  datos
) => {

  const nuevoId =
    consultorios.length > 0
      ? Math.max(
          ...consultorios.map(
            consultorio =>
              consultorio.id
          )
        ) + 1
      : 1;


  const consultorio = {

    id:
      nuevoId,

    codigo:
      datos.codigo,

    nombre:
      datos.nombre,

    piso:
      datos.piso,

    ubicacion:
      datos.ubicacion,

    activo:
      datos.activo
  };


  consultorios.push(
    consultorio
  );


  return consultorio;
};


// ========================================
// PUT
// Actualización completa
// ========================================

const actualizarConsultorio = (
  id,
  datos
) => {

  const indice =
    consultorios.findIndex(
      consultorio =>
        consultorio.id === Number(id)
    );


  if (
    indice === -1
  ) {
    return null;
  }


  consultorios[indice] = {

    id:
      consultorios[indice].id,

    codigo:
      datos.codigo,

    nombre:
      datos.nombre,

    piso:
      datos.piso,

    ubicacion:
      datos.ubicacion,

    activo:
      datos.activo
  };


  return consultorios[indice];
};


// ========================================
// PATCH
// Actualización parcial
// ========================================

const actualizarConsultorioParcial = (
  id,
  datos
) => {

  const indice =
    consultorios.findIndex(
      consultorio =>
        consultorio.id === Number(id)
    );


  if (
    indice === -1
  ) {
    return null;
  }


  const consultorioActual =
    consultorios[indice];


  const consultorioActualizado = {

    id:
      consultorioActual.id,

    codigo:
      datos.codigo ??
      consultorioActual.codigo,

    nombre:
      datos.nombre ??
      consultorioActual.nombre,

    piso:
      datos.piso ??
      consultorioActual.piso,

    ubicacion:
      datos.ubicacion ??
      consultorioActual.ubicacion,

    activo:
      datos.activo ??
      consultorioActual.activo
  };


  consultorios[indice] =
    consultorioActualizado;


  return consultorioActualizado;
};


// ========================================
// Eliminar
// ========================================

const eliminarConsultorio = (
  id
) => {

  const indice =
    consultorios.findIndex(
      consultorio =>
        consultorio.id === Number(id)
    );


  if (
    indice === -1
  ) {
    return null;
  }


  const eliminado =
    consultorios.splice(
      indice,
      1
    );


  return eliminado[0];
};


module.exports = {
  obtenerConsultorios,
  obtenerConsultorioPorId,
  buscarConsultorioPorCodigo,
  crearConsultorio,
  actualizarConsultorio,
  actualizarConsultorioParcial,
  eliminarConsultorio
};