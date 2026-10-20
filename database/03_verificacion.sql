-- ==============================================================================
-- 03_verificacion.sql
-- Consultas de verificación del esquema, roles, tablas, RLS y restricciones
-- ==============================================================================

-- 1. Verificar existencia y conteo de tablas del esquema público
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. Conteo de registros por tabla
SELECT 'roles' AS tabla, COUNT(*) AS registros FROM public.roles
UNION ALL SELECT 'usuarios', COUNT(*) FROM public.usuarios
UNION ALL SELECT 'especialidades', COUNT(*) FROM public.especialidades
UNION ALL SELECT 'medicos', COUNT(*) FROM public.medicos
UNION ALL SELECT 'pacientes', COUNT(*) FROM public.pacientes
UNION ALL SELECT 'consultorios', COUNT(*) FROM public.consultorios
UNION ALL SELECT 'citas', COUNT(*) FROM public.citas;

-- 3. Verificar estado de RLS en todas las tablas
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 4. Verificar claves foráneas configuradas
SELECT
    tc.table_name AS tabla_origen,
    kcu.column_name AS columna_origen,
    ccu.table_name AS tabla_destino,
    ccu.column_name AS columna_destino,
    rc.delete_rule AS regla_eliminacion
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
    ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- 5. Verificar roles registrados
SELECT id, nombre, descripcion, activo
FROM public.roles
ORDER BY id;
