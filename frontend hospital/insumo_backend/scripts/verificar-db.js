// Diagnóstico local: nunca muestra la cadena de conexión ni su contraseña.
const { pool } = require("../src/config/database");
(async () => {
  try {
    const { rows } = await pool.query("SELECT current_database() AS base_datos, current_user AS usuario, NOW() AS fecha_servidor");
    console.table(rows);
    console.log("OK: conexión a PostgreSQL/Supabase comprobada.");
  } catch (error) {
    console.error("FALLO PostgreSQL:", error.code || "sin código", error.message);
    process.exitCode = 1;
  } finally { await pool.end(); }
})();
