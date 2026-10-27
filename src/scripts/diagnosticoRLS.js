require("dotenv").config();

const {
  pool,
  cerrarPool
} = require("../config/database");

async function diagnosticarRLS() {
  try {
    const resultado = await pool.query(`
      SELECT
        current_user AS usuario_sql,
        session_user AS usuario_sesion,
        current_setting('role', true) AS rol_configurado,
        current_setting('request.jwt.claim.sub', true) AS jwt_sub,
        (
          SELECT rolbypassrls
          FROM pg_roles
          WHERE rolname = current_user
        ) AS puede_omitir_rls
    `);

    console.table(resultado.rows);

  } catch (error) {
    console.error(
      "Error en diagnóstico:",
      error.message
    );

    process.exitCode = 1;

  } finally {
    await cerrarPool();
  }
}

diagnosticarRLS();