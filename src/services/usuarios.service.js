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
      usuario.email.toLowerCase() === email.toLowerCase()
  );
};

// ========================================
// Obtener usuario por ID
// ========================================
const obtenerUsuarioPorId = (id) => {
  return usuarios.find(
    (usuario) => usuario.id === Number(id)
  );
};

// ========================================
// Crear usuario (Registro público)
// ========================================
const crearUsuario = async (datos) => {
  const passwordHash = await generarPasswordHash(datos.password);

  const nuevoUsuario = {
    id:
      usuarios.length > 0
        ? Math.max(...usuarios.map((usuario) => usuario.id)) + 1
        : 1,
    nombre: datos.nombre,
    email: datos.email.toLowerCase(),
    passwordHash,
    // ====================================
    // Valores controlados por el servidor
    // ====================================
    rol: "paciente",
    activo: true
  };

  usuarios.push(nuevoUsuario);
  return nuevoUsuario;
};

// ========================================
// Crear usuario desde administración
// ========================================
const crearUsuarioAdministrativo = async (datos) => {
  const passwordHash = await generarPasswordHash(datos.password);

  const nuevoUsuario = {
    id:
      usuarios.length > 0
        ? Math.max(...usuarios.map((usuario) => usuario.id)) + 1
        : 1,
    nombre: datos.nombre,
    email: datos.email.toLowerCase(),
    passwordHash,
    rol: datos.rol,
    activo: true
  };

  usuarios.push(nuevoUsuario);
  return nuevoUsuario;
};

// ========================================
// Verificar credenciales
// ========================================
const verificarCredenciales = async (email, password) => {
  const usuario = obtenerUsuarioPorEmail(email);
  if (!usuario) {
    return null;
  }

  const passwordValida = await verificarPassword(
    password,
    usuario.passwordHash
  );

  if (!passwordValida) {
    return null;
  }

  return usuario;
};

// ========================================
// Crear administrador inicial (Bootstrap)
// ========================================
const crearAdministradorInicial = async () => {
  const nombre = process.env.ADMIN_NOMBRE;
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!nombre || !email || !password) {
    console.warn("Administrador inicial no configurado");
    return null;
  }

  const existente = obtenerUsuarioPorEmail(email);
  if (existente) {
    return existente;
  }

  const passwordHash = await generarPasswordHash(password);

  const administrador = {
    id:
      usuarios.length > 0
        ? Math.max(...usuarios.map((usuario) => usuario.id)) + 1
        : 1,
    nombre,
    email: email.toLowerCase(),
    passwordHash,
    rol: "administrador",
    activo: true
  };

  usuarios.push(administrador);
  console.log("Administrador inicial creado");
  return administrador;
};

module.exports = {
  obtenerUsuarioPorEmail,
  obtenerUsuarioPorId,
  crearUsuario,
  crearUsuarioAdministrativo,
  verificarCredenciales,
  crearAdministradorInicial
};