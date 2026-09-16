const citas =
  require("../data/citas");


// ========================================
// Obtener todas
// ========================================

const obtenerCitas = () => {
  return citas;
};


// ========================================
// Obtener por ID
// ========================================

const obtenerCitaPorId = (
  id
) => {

  return citas.find(
    cita =>
      cita.id === Number(id)
  );
};


// ========================================
// Obtener por paciente
// ========================================

const obtenerCitasPorPaciente = (
  pacienteId
) => {

  return citas.filter(
    cita =>
      cita.pacienteId ===
      Number(pacienteId)
  );
};


// ========================================
// Obtener por médico
// ========================================

const obtenerCitasPorMedico = (
  medicoId
) => {

  return citas.filter(
    cita =>
      cita.medicoId ===
      Number(medicoId)
  );
};


// ========================================
// Comprobar conflicto del médico
// ========================================

const medicoTieneConflicto = (
  medicoId,
  fecha,
  hora,
  citaIdExcluir = null
) => {

  return citas.some(
    cita =>
      cita.medicoId ===
        Number(medicoId) &&

      cita.fecha === fecha &&

      cita.hora === hora &&

      cita.estado !==
        "cancelada" &&

      cita.id !==
        Number(citaIdExcluir)
  );
};


// ========================================
// Comprobar conflicto del consultorio
// ========================================

const consultorioTieneConflicto = (
  consultorioId,
  fecha,
  hora,
  citaIdExcluir = null
) => {

  return citas.some(
    cita =>
      cita.consultorioId ===
        Number(consultorioId) &&

      cita.fecha === fecha &&

      cita.hora === hora &&

      cita.estado !==
        "cancelada" &&

      cita.id !==
        Number(citaIdExcluir)
  );
};


// ========================================
// Crear
// La API fuerza estado = programada
// ========================================

const crearCita = (
  datos
) => {

  const nuevoId =
    citas.length > 0
      ? Math.max(
          ...citas.map(
            cita =>
              cita.id
          )
        ) + 1
      : 1;


  const cita = {

    id:
      nuevoId,

    pacienteId:
      datos.pacienteId,

    medicoId:
      datos.medicoId,

    consultorioId:
      datos.consultorioId,

    fecha:
      datos.fecha,

    hora:
      datos.hora,

    motivo:
      datos.motivo,

    estado:
      "programada"
  };


  citas.push(
    cita
  );


  return cita;
};


// ========================================
// PUT
// Actualiza los datos,
// pero conserva el estado actual
// ========================================

const actualizarCita = (
  id,
  datos
) => {

  const indice =
    citas.findIndex(
      cita =>
        cita.id === Number(id)
    );


  if (
    indice === -1
  ) {
    return null;
  }


  const estadoActual =
    citas[indice].estado;


  citas[indice] = {

    id:
      citas[indice].id,

    pacienteId:
      datos.pacienteId,

    medicoId:
      datos.medicoId,

    consultorioId:
      datos.consultorioId,

    fecha:
      datos.fecha,

    hora:
      datos.hora,

    motivo:
      datos.motivo,

    estado:
      estadoActual
  };


  return citas[indice];
};


// ========================================
// PATCH general
// Conserva estado
// ========================================

const actualizarCitaParcial = (
  id,
  datos
) => {

  const indice =
    citas.findIndex(
      cita =>
        cita.id === Number(id)
    );


  if (
    indice === -1
  ) {
    return null;
  }


  const citaActual =
    citas[indice];


  const citaActualizada = {

    id:
      citaActual.id,

    pacienteId:
      datos.pacienteId ??
      citaActual.pacienteId,

    medicoId:
      datos.medicoId ??
      citaActual.medicoId,

    consultorioId:
      datos.consultorioId ??
      citaActual.consultorioId,

    fecha:
      datos.fecha ??
      citaActual.fecha,

    hora:
      datos.hora ??
      citaActual.hora,

    motivo:
      datos.motivo ??
      citaActual.motivo,

    estado:
      citaActual.estado
  };


  citas[indice] =
    citaActualizada;


  return citaActualizada;
};


// ========================================
// PATCH especializado de estado
// ========================================

const actualizarEstadoCita = (
  id,
  nuevoEstado
) => {

  const indice =
    citas.findIndex(
      cita =>
        cita.id === Number(id)
    );


  if (
    indice === -1
  ) {
    return null;
  }


  citas[indice].estado =
    nuevoEstado;


  return citas[indice];
};


// ========================================
// DELETE
// ========================================

const eliminarCita = (
  id
) => {

  const indice =
    citas.findIndex(
      cita =>
        cita.id === Number(id)
    );


  if (
    indice === -1
  ) {
    return null;
  }


  const eliminada =
    citas.splice(
      indice,
      1
    );


  return eliminada[0];
};

// ========================================
// Integridad referencial
// ========================================
const pacienteTieneCitas = (pacienteId) => {
 return citas.some(
 cita =>
 cita.pacienteId === Number(pacienteId)
 );
};
const medicoTieneCitas = (medicoId) => {
 return citas.some(
 cita =>
 cita.medicoId === Number(medicoId)
 );
};
const consultorioTieneCitas = (consultorioId) => {
 return citas.some(
 cita =>
 cita.consultorioId === Number(consultorioId)
 );
};

module.exports = {
 obtenerCitas,
 obtenerCitaPorId,
 obtenerCitasPorPaciente,
 obtenerCitasPorMedico,
 medicoTieneConflicto,
 consultorioTieneConflicto,
 pacienteTieneCitas,
 medicoTieneCitas,
 consultorioTieneCitas,
 crearCita,
 actualizarCita,
 actualizarCitaParcial,
 actualizarEstadoCita,
 eliminarCita
};