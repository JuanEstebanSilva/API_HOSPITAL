const pacientes =
  require(
    "../data/pacientes"
  );

const obtenerPacientes = () => {
  return pacientes;
};

const obtenerPacientePorId = (
  id
) => {
  return pacientes.find(
    paciente =>
      paciente.id === Number(id)
  );
};

const buscarPacientePorDocumento = (
  documento
) => {
  return pacientes.find(
    paciente =>
      paciente.documento ===
      documento
  );
};

const crearPaciente = (
  datos
) => {
  const nuevoId =
    pacientes.length > 0
      ? Math.max(
          ...pacientes.map(
            paciente =>
              paciente.id
          )
        ) + 1
      : 1;

  const paciente = {
    id:
      nuevoId,

    nombre:
      datos.nombre,

    documento:
      datos.documento,

    email:
      datos.email,

    telefono:
      datos.telefono,

    fechaNacimiento:
      datos.fechaNacimiento
  };

  pacientes.push(
    paciente
  );

  return paciente;
};

const actualizarPaciente = (
  id,
  datos
) => {
  const indice =
    pacientes.findIndex(
      paciente =>
        paciente.id ===
        Number(id)
    );

  if (
    indice === -1
  ) {
    return null;
  }

  pacientes[indice] = {
    id:
      pacientes[indice].id,

    nombre:
      datos.nombre,

    documento:
      datos.documento,

    email:
      datos.email,

    telefono:
      datos.telefono,

    fechaNacimiento:
      datos.fechaNacimiento
  };

  return pacientes[indice];
};

const eliminarPaciente = (
  id
) => {
  const indice =
    pacientes.findIndex(
      paciente =>
        paciente.id ===
        Number(id)
    );

  if (
    indice === -1
  ) {
    return null;
  }

  const eliminado =
    pacientes.splice(
      indice,
      1
    );

  return eliminado[0];
};

const actualizarPacienteParcial = (
  id,
  datos
) => {
  const indice =
    pacientes.findIndex(
      paciente =>
        paciente.id === Number(id)
    );

  if (
    indice === -1
  ) {
    return null;
  }

  const pacienteActual =
    pacientes[indice];

  const pacienteActualizado = {
    id:
      pacienteActual.id,

    nombre:
      datos.nombre ??
      pacienteActual.nombre,

    documento:
      datos.documento ??
      pacienteActual.documento,

    email:
      datos.email ??
      pacienteActual.email,

    telefono:
      datos.telefono ??
      pacienteActual.telefono,

    fechaNacimiento:
      datos.fechaNacimiento ??
      pacienteActual.fechaNacimiento
  };

  pacientes[indice] =
    pacienteActualizado;

  return pacienteActualizado;
};

module.exports = {
  obtenerPacientes,
  obtenerPacientePorId,
  buscarPacientePorDocumento,
  crearPaciente,
  actualizarPaciente,
  actualizarPacienteParcial,
  eliminarPaciente
};