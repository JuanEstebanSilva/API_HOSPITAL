const { pool, consultar } = require("../src/config/database");

async function check() {
  try {
    console.log("=== VERIFICACION 01: 9 Tablas y RLS ===");
    const rls = await consultar(`
      SELECT c.relname AS tabla, c.relrowsecurity AS rls_habilitado
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
        AND c.relkind IN ('r','p')
        AND c.relname IN (
          'roles','usuarios','especialidades','pacientes','medicos',
          'consultorios','citas','password_reset_tokens','codigos_recuperacion'
        )
      ORDER BY c.relname;
    `);
    console.table(rls.rows);

    console.log("=== VERIFICACION 02: version_sesion en usuarios ===");
    const vSesion = await consultar(`
      SELECT u.id, u.email, r.nombre AS rol, u.version_sesion,
             (u.password_hash IS NOT NULL) AS tiene_password_hash
      FROM public.usuarios u
      JOIN public.roles r ON r.id = u.rol_id
      ORDER BY u.id;
    `);
    console.table(vSesion.rows);

    console.log("=== VERIFICACION 03: Columnas de tablas nuevas ===");
    const colNuevas = await consultar(`
      SELECT table_name, ordinal_position, column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name IN ('password_reset_tokens','codigos_recuperacion')
      ORDER BY table_name, ordinal_position;
    `);
    console.table(colNuevas.rows);

    console.log("=== VERIFICACION 08: Diagnóstico conexión actual ===");
    const diag = await consultar(`
      SELECT current_user AS usuario,
             session_user AS sesion,
             current_setting('row_security') AS rls_configuracion,
             rolbypassrls AS puede_omitir_rls
      FROM pg_roles
      WHERE rolname = current_user;
    `);
    console.table(diag.rows);

  } catch (err) {
    console.error("Error en verificación:", err);
  } finally {
    await pool.end();
  }
}

check();

