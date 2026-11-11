
require("dotenv").config();

const usuariosService = require(
  "../services/usuarios.service"
);

const { cerrarPool } = require(
  "../config/database"
);

// ========================================
// Validación de variables
// ========================================

const validarConfiguracion = () => {
  const nombre = process.env.ADMIN_NOMBRE?.trim();
  const email = process.env.ADMIN_EMAIL?.trim();
  const password = process.env.ADMIN_PASSWORD;

  if (!nombre || !email || !password) {
    throw new Error(
      "Faltan ADMIN_NOMBRE, " +
      "ADMIN_EMAIL o ADMIN_PASSWORD"
    );
  }

  if (password.length < 12) {
    throw new Error(
      "ADMIN_PASSWORD debe tener " +
      "al menos 12 caracteres"
    );
  }

  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    throw new Error(
      "ADMIN_EMAIL no tiene un formato válido"
    );
  }
};

// ========================================
// Ejecución administrativa
// ========================================

const main = async () => {
  try {
    validarConfiguracion();

    console.log(
      "Iniciando bootstrap administrativo..."
    );

    const resultado =
      await usuariosService.crearAdministradorInicial();

    if (resultado.creado) {
      console.log(
        "Administrador inicial creado correctamente."
      );

      console.log(
        "ID del administrador:",
        resultado.usuario.id
      );
    } else {
      console.log(
        "Ya existe una cuenta administradora."
      );

      console.log(
        "No se realizaron modificaciones."
      );
    }

    console.log(
      "Bootstrap finalizado correctamente."
    );
  } catch (error) {
    console.error(
      "Error en bootstrap administrativo:",
      error.message
    );

    process.exitCode = 1;
  } finally {
    try {
      await cerrarPool();
    } catch (error) {
      console.error(
        "No se pudo cerrar el Pool:",
        error.message
      );

      process.exitCode = 1;
    }
  }
};

// ========================================
// Ejecutar
// ========================================

main();
