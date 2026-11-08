
const { matchedData } = require("express-validator");

const usuariosService =
  require("../services/usuarios.service");

const { generarToken } =
  require("../utils/jwt.util");

// ========================================
// Manejo de errores
// ========================================

const manejarErrorUsuario = (error, res, next) => {
  if (error.code === "23505") {
    return res.status(409).json({
      mensaje:
        "Ya existe un usuario con ese correo electrónico"
    });
  }

  if (error.codigoAplicacion === "ROL_INVALIDO") {
    return res.status(400).json({
      mensaje: error.message
    });
  }

  return next(error);
};

// ========================================
// Registro público
// ========================================

const registrar = async (req, res, next) => {
  try {
    const datos = matchedData(req, {
      locations: ["body"]
    });

    const usuarioExistente =
      await usuariosService.obtenerUsuarioPorEmail(
        datos.email
      );

    if (usuarioExistente) {
      return res.status(409).json({
        mensaje:
          "Ya existe un usuario con ese correo electrónico"
      });
    }

    const usuario =
      await usuariosService.crearUsuario(datos);

    return res.status(201).json({
      mensaje: "Usuario registrado correctamente",
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
        activo: usuario.activo
      }
    });
  } catch (error) {
    return manejarErrorUsuario(error, res, next);
  }
};

// ========================================
// Login
// ========================================

const login = async (req, res, next) => {
  try {
    const datos = matchedData(req, {
      locations: ["body"]
    });

    const usuario =
      await usuariosService.verificarCredenciales(
        datos.email,
        datos.password
      );

    if (!usuario) {
      return res.status(401).json({
        mensaje: "Credenciales inválidas"
      });
    }

    if (!usuario.activo) {
      return res.status(403).json({
        mensaje: "Usuario deshabilitado"
      });
    }

    const token = generarToken(usuario);

    return res.status(200).json({
      mensaje: "Autenticación correcta",
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol
      },
      token
    });
  } catch (error) {
    return next(error);
  }
};

const cambiarPassword = async (req, res, next) => {
  try {
    const datos = matchedData(req, { locations: ["body"] });
    const resultado = await usuariosService.cambiarPasswordPropio(
      req.usuario.id, datos.passwordActual, datos.passwordNueva
    );
    if (resultado.estado === "CLAVE_INCORRECTA" || resultado.estado === "NO_AUTORIZADO") {
      return res.status(401).json({ mensaje: "Contraseña actual inválida" });
    }
    if (resultado.estado === "MISMA_CLAVE") {
      return res.status(400).json({ mensaje: "La nueva contraseña debe ser diferente" });
    }
    if (resultado.estado === "CONFLICTO") {
      return res.status(409).json({ mensaje: "La contraseña cambió durante la operación; inténtelo nuevamente" });
    }
    return res.status(200).json({ mensaje: "Contraseña actualizada. Inicie sesión nuevamente." });
  } catch (error) { return next(error); }
};

const passwordResetService = require('../services/passwordReset.service');
const generarRecuperacionAdmin = async (req, res, next) => {
  try {
    const { usuarioId } = matchedData(req, { locations: ['params'] });
    const resultado = await passwordResetService.generarRecuperacion(usuarioId, req.usuario.id);
    if (resultado.estado === 'NO_ENCONTRADO') return res.status(404).json({ mensaje: 'Usuario no encontrado o inactivo' });
    res.set('Cache-Control', 'no-store');
    return res.status(201).json({
      mensaje: 'Token generado. Entréguelo únicamente al titular verificado.',
      token: resultado.token,
      expiraEn: resultado.expiraEn
    });
  } catch (error) { return next(error); }
};
const restablecerPassword = async (req, res, next) => {
  try {
    const { token, passwordNueva } = matchedData(req, { locations: ['body'] });
    const resultado = await passwordResetService.restablecerPassword(token, passwordNueva);
    if (resultado.estado === 'TOKEN_INVALIDO') return res.status(400).json({ mensaje: 'Token inválido, utilizado o expirado' });
    if (resultado.estado === 'MISMA_CLAVE') return res.status(400).json({ mensaje: 'La nueva contraseña debe ser diferente' });
    return res.status(200).json({ mensaje: 'Contraseña restablecida. Inicie sesión nuevamente.' });
  } catch (error) { return next(error); }
};
const codigosService = require('../services/codigosRecuperacion.service');
const generarCodigos = async (req, res, next) => {
  try {
    const { passwordActual } = matchedData(req, { locations: ['body'] });
    const resultado = await codigosService.generar(req.usuario.id, passwordActual);
    if (resultado.estado !== 'OK') return res.status(401).json({ mensaje: 'Reautenticación incorrecta' });
    res.set('Cache-Control', 'no-store');
    return res.status(201).json({ mensaje: 'Guarde estos códigos. No se mostrarán nuevamente.', codigos: resultado.codigos });
  } catch (e) { return next(e); }
};
const estadoCodigos = async (req, res, next) => {
  try { return res.status(200).json({ disponibles: await codigosService.estado(req.usuario.id) }); }
  catch (e) { return next(e); }
};
const restablecerConCodigo = async (req, res, next) => {
  try {
    const { email, codigo, passwordNueva } = matchedData(req, { locations: ['body'] });
    const resultado = await codigosService.restablecer(email, codigo, passwordNueva);
    if (resultado.estado === 'MISMA_CLAVE') return res.status(400).json({ mensaje: 'La nueva contraseña debe ser diferente' });
    if (resultado.estado !== 'OK') return res.status(400).json({ mensaje: 'Código o cuenta inválidos' });
    return res.status(200).json({ mensaje: 'Contraseña restablecida. Inicie sesión nuevamente.' });
  } catch (e) { return next(e); }
};
module.exports = {
  registrar,
  login,
  cambiarPassword,
  generarRecuperacionAdmin,
  restablecerPassword,
  generarCodigos, estadoCodigos, restablecerConCodigo
};
