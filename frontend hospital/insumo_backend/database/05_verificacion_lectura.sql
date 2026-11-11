-- SOLO LECTURA: verificar esquema, índices, políticas y usuario de conexión.
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname='public' ORDER BY tablename;
SELECT tablename, policyname, roles, cmd, qual FROM pg_policies WHERE schemaname='public' ORDER BY tablename;
SELECT tablename, indexname, indexdef FROM pg_indexes WHERE schemaname='public' ORDER BY tablename,indexname;
SELECT current_user, session_user, current_setting('row_security') AS row_security,
 (SELECT rolbypassrls FROM pg_roles WHERE rolname=current_user) AS bypassrls;
SELECT 'roles' AS tabla, count(*) FROM public.roles UNION ALL
SELECT 'usuarios', count(*) FROM public.usuarios UNION ALL
SELECT 'citas', count(*) FROM public.citas;
