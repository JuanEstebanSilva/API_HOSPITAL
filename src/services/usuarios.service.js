const usuarios = require("../data/usuarios");
const {
  generarPasswordHash,
  verificarPassword
} = require("../utils/password.util");

// ========================================
// Obtener usuario por email
// ========================================
const obtenerUsuarioPorEmail = (email) => {
  return usuarios.find(
    (usuario) =>
      usuario.email.toLowerCase() ===
      email.toLowerCase()
  );
};

// ========================================
// Obtener usuario por ID
// ========================================
const obtenerUsuarioPorId = (id) => {
  return usuarios.find(
    (usuario) =>
      usuario.id === Number(id)
  );
};

// ========================================
// Crear usuario
// ========================================
const crearUsuario = async (datos) => {
  const passwordHash =
    await generarPasswordHash(datos.password);
  
  const nuevoUsuario = {
    id:
      usuarios.length > 0
        ? Math.max(
            ...usuarios.map(
              (usuario) => usuario.id
            )
          ) + 1
        : 1,
    nombre: datos.nombre,
    email: datos.email.toLowerCase(),
    passwordHash,
    rol: datos.rol,
    activo: true
  };

  // Aquí está ubicado correctamente dentro del ámbito de la función
  console.log(
    "Hash generado:",
    nuevoUsuario.passwordHash
  );

  usuarios.push(nuevoUsuario);
  return nuevoUsuario;
};

// ========================================
// Verificar credenciales
// ========================================
const verificarCredenciales = async (
  email,
  password
) => {
  const usuario =
    obtenerUsuarioPorEmail(email);
  
  if (!usuario) {
    return null;
  }

  const passwordValida =
    await verificarPassword(
      password,
      usuario.passwordHash
    );

  if (!passwordValida) {
    return null;
  }

  return usuario;
};

module.exports = {
  obtenerUsuarioPorEmail,
  obtenerUsuarioPorId,
  crearUsuario,
  verificarCredenciales
};