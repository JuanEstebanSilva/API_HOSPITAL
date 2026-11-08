
const { pool, consultar } =
  require("../src/config/database");

async function probarConexion() {
  try {
    console.log("Conectando con Supabase...");

    // ========================================
// LAB 11.5 - RLS05
// Diagnóstico del rol PostgreSQL
// ========================================

const seguridad = await consultar(`
  SELECT
    current_user AS usuario,
    session_user AS sesion,
    current_setting('row_security') AS rls_configuracion,
    rolbypassrls AS puede_omitir_rls
  FROM pg_roles
  WHERE rolname = current_user
`);

console.log("LAB 11.5 - Seguridad PostgreSQL:");
console.table(seguridad.rows);

    const resultado = await consultar(`
      SELECT
        current_database() AS base_datos,
        current_user AS usuario,
        NOW() AS fecha_servidor
    `);

    console.table(resultado.rows);

    const roles = await consultar(`
      SELECT id, nombre, activo
      FROM public.roles
      ORDER BY id
    `);

    console.log("Roles registrados:");
    console.table(roles.rows);

    console.log(
      "Conexión PostgreSQL exitosa"
    );

  } catch (error) {
    console.error(
      "Error de conexión:",
      error.message
    );

    process.exitCode = 1;

  } finally {
    await pool.end();
  }
}

probarConexion();
