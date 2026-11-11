-- Comprobar roles
SELECT id, nombre, activo
FROM public.roles
ORDER BY id;

-- Comprobar tablas
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'roles',
    'usuarios',
    'pacientes',
    'medicos',
    'especialidades',
    'consultorios',
    'citas'
  )
ORDER BY table_name;

-- Comprobar RLS
SELECT
    relname AS tabla,
    relrowsecurity AS rls_habilitado
FROM pg_class
WHERE relnamespace = 'public'::regnamespace
  AND relname IN (
    'roles',
    'usuarios',
    'pacientes',
    'medicos',
    'especialidades',
    'consultorios',
    'citas'
  )
ORDER BY relname;