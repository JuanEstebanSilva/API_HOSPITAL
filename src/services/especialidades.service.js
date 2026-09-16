const especialidades =
  require("../data/especialidades");

// ========================================
// Obtener todas
// ========================================

const obtenerEspecialidades = () => {
  return especialidades;
};

// ========================================
// Obtener por ID
// ========================================

const obtenerEspecialidadPorId = (
  id
) => {
  return especialidades.find(
    especialidad =>
      especialidad.id === Number(id)
  );
};

// ========================================
// Buscar por nombre
// ========================================

const buscarEspecialidadPorNombre = (
  nombre
) => {
  return especialidades.find(
    especialidad =>
      especialidad.nombre.toLowerCase() ===
      nombre.toLowerCase()
  );
};

// ========================================
// Crear
// ========================================

const crearEspecialidad = (
  datos
) => {
  const nuevoId =
    especialidades.length > 0
      ? Math.max(
          ...especialidades.map(
            especialidad =>
              especialidad.id
          )
        ) + 1
      : 1;

  const especialidad = {
    id: nuevoId,

    nombre:
      datos.nombre,

    descripcion:
      datos.descripcion,

    activa:
      datos.activa
  };

  especialidades.push(
    especialidad
  );

  return especialidad;
};

// ========================================
// Actualización completa - PUT
// ========================================

const actualizarEspecialidad = (
  id,
  datos
) => {
  const indice =
    especialidades.findIndex(
      especialidad =>
        especialidad.id ===
        Number(id)
    );

  if (indice === -1) {
    return null;
  }

  especialidades[indice] = {
    id:
      especialidades[indice].id,

    nombre:
      datos.nombre,

    descripcion:
      datos.descripcion,

    activa:
      datos.activa
  };

  return especialidades[indice];
};

// ========================================
// Actualización parcial - PATCH
// ========================================

const actualizarEspecialidadParcial = (
  id,
  datos
) => {
  const indice =
    especialidades.findIndex(
      especialidad =>
        especialidad.id ===
        Number(id)
    );

  if (indice === -1) {
    return null;
  }

  const especialidadActual =
    especialidades[indice];

  const especialidadActualizada = {
    id:
      especialidadActual.id,

    nombre:
      datos.nombre ??
      especialidadActual.nombre,

    descripcion:
      datos.descripcion ??
      especialidadActual.descripcion,

    activa:
      datos.activa ??
      especialidadActual.activa
  };

  especialidades[indice] =
    especialidadActualizada;

  return especialidadActualizada;
};

// ========================================
// Eliminar
// ========================================

const eliminarEspecialidad = (
  id
) => {
  const indice =
    especialidades.findIndex(
      especialidad =>
        especialidad.id ===
        Number(id)
    );

  if (indice === -1) {
    return null;
  }

  const eliminada =
    especialidades.splice(
      indice,
      1
    );

  return eliminada[0];
};

module.exports = {
  obtenerEspecialidades,
  obtenerEspecialidadPorId,
  buscarEspecialidadPorNombre,
  crearEspecialidad,
  actualizarEspecialidad,
  actualizarEspecialidadParcial,
  eliminarEspecialidad
};