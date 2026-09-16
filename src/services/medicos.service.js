const medicos =
  require("../data/medicos");

  const especialidadTieneMedicos = (especialidadId) => {
 return medicos.some(
 medico =>
 medico.especialidadId === Number(especialidadId)
 );
};



// ========================================
// Obtener todos los médicos
// ========================================

const obtenerMedicos = () => {
  return medicos;
};


// ========================================
// Obtener médico por ID
// ========================================

const obtenerMedicoPorId = (
  id
) => {

  return medicos.find(
    medico =>
      medico.id === Number(id)
  );
};


// ========================================
// Obtener médicos por especialidad
// ========================================

const obtenerMedicosPorEspecialidad = (
  especialidadId
) => {

  return medicos.filter(
    medico =>
      medico.especialidadId ===
      Number(especialidadId)
  );
};


// ========================================
// Buscar médico por registro médico
// ========================================

const buscarMedicoPorRegistro = (
  registroMedico
) => {

  return medicos.find(
    medico =>
      medico.registroMedico
        .toLowerCase() ===
      registroMedico
        .toLowerCase()
  );
};


// ========================================
// Buscar médico por email
// ========================================

const buscarMedicoPorEmail = (
  email
) => {

  return medicos.find(
    medico =>
      medico.email
        .toLowerCase() ===
      email
        .toLowerCase()
  );
};


// ========================================
// Crear médico
// ========================================

const crearMedico = (
  datos
) => {

  const nuevoId =
    medicos.length > 0
      ? Math.max(
          ...medicos.map(
            medico =>
              medico.id
          )
        ) + 1
      : 1;


  const medico = {

    id:
      nuevoId,

    nombre:
      datos.nombre,

    registroMedico:
      datos.registroMedico,

    email:
      datos.email,

    telefono:
      datos.telefono,

    especialidadId:
      datos.especialidadId,

    activo:
      datos.activo
  };


  medicos.push(
    medico
  );


  return medico;
};


// ========================================
// PUT
// Actualización completa
// ========================================

const actualizarMedico = (
  id,
  datos
) => {

  const indice =
    medicos.findIndex(
      medico =>
        medico.id === Number(id)
    );


  if (
    indice === -1
  ) {
    return null;
  }


  medicos[indice] = {

    id:
      medicos[indice].id,

    nombre:
      datos.nombre,

    registroMedico:
      datos.registroMedico,

    email:
      datos.email,

    telefono:
      datos.telefono,

    especialidadId:
      datos.especialidadId,

    activo:
      datos.activo
  };


  return medicos[indice];
};


// ========================================
// PATCH
// Actualización parcial
// ========================================

const actualizarMedicoParcial = (
  id,
  datos
) => {

  const indice =
    medicos.findIndex(
      medico =>
        medico.id === Number(id)
    );


  if (
    indice === -1
  ) {
    return null;
  }


  const medicoActual =
    medicos[indice];


  const medicoActualizado = {

    id:
      medicoActual.id,

    nombre:
      datos.nombre ??
      medicoActual.nombre,

    registroMedico:
      datos.registroMedico ??
      medicoActual.registroMedico,

    email:
      datos.email ??
      medicoActual.email,

    telefono:
      datos.telefono ??
      medicoActual.telefono,

    especialidadId:
      datos.especialidadId ??
      medicoActual.especialidadId,

    activo:
      datos.activo ??
      medicoActual.activo
  };


  medicos[indice] =
    medicoActualizado;


  return medicoActualizado;
};


// ========================================
// Eliminar médico
// ========================================

const eliminarMedico = (
  id
) => {

  const indice =
    medicos.findIndex(
      medico =>
        medico.id === Number(id)
    );


  if (
    indice === -1
  ) {
    return null;
  }


  const eliminado =
    medicos.splice(
      indice,
      1
    );


  return eliminado[0];
};


module.exports = {
  obtenerMedicos,
  obtenerMedicoPorId,
  obtenerMedicosPorEspecialidad,
  buscarMedicoPorRegistro, 
  buscarMedicoPorEmail,    
  especialidadTieneMedicos,
  crearMedico,
  actualizarMedico,
  actualizarMedicoParcial,
  eliminarMedico
};