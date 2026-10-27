
const { Pool } = require("pg");
const fs = require("node:fs");
const path = require("node:path");

require("dotenv").config();

// ========================================
// Validar configuración
// ========================================

if (!process.env.DATABASE_URL) {
  throw new Error(
    "Falta DATABASE_URL en el archivo .env"
  );
}

// ========================================
// Certificado SSL de Supabase
// ========================================

const rutaCertificado = path.resolve(
  __dirname,
  "../../certs/prod-ca-2021.crt"
);

if (!fs.existsSync(rutaCertificado)) {
  throw new Error(
    "No se encontró el certificado SSL de Supabase"
  );
}

const certificado = fs.readFileSync(
  rutaCertificado,
  "utf8"
);

// ========================================
// Pool PostgreSQL
// ========================================

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,

  ssl: {
    ca: certificado,
    rejectUnauthorized: true,
  },

  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 20000,
});

// ========================================
// Manejo de errores del Pool
// ========================================

pool.on("error", (error) => {
  console.error(
    "Error en conexión PostgreSQL inactiva:",
    error.message
  );
});

// ========================================
// Consultas parametrizadas
// ========================================

const consultar = async (sql, parametros = []) => {
  try {
    return await pool.query(sql, parametros);
  } catch (error) {
    if (error.message?.includes("Connection terminated") || error.message?.includes("timeout")) {
      return await pool.query(sql, parametros);
    }
    throw error;
  }
};

// ========================================
// Cierre controlado de conexiones
// ========================================

const cerrarPool = async () => {
  await pool.end();
};

// ========================================
// Exportaciones
// ========================================

module.exports = {
  pool,
  consultar,
  cerrarPool,
};
