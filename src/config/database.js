const { Pool } = require("pg");
const fs = require("node:fs");
const path = require("node:path");
require("dotenv").config();

if (!process.env.DATABASE_URL) {
  throw new Error("Falta DATABASE_URL en el archivo .env");
}

const rutaCertificado = path.resolve(
  __dirname,
  "../../certs/prod-ca-2021.crt"
);

if (!fs.existsSync(rutaCertificado)) {
  throw new Error(`No se encontró el certificado SSL en: ${rutaCertificado}`);
}

const certificado = fs.readFileSync(rutaCertificado, "utf8");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    ca: certificado,
    rejectUnauthorized: true
  },
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
});

pool.on("error", (error) => {
  console.error("Error en conexión PostgreSQL inactiva:", error.message);
});

const consultar = (sql, parametros = []) => pool.query(sql, parametros);

module.exports = { pool, consultar };
