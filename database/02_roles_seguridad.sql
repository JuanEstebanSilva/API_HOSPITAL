-- ==============================================================================
-- 02_roles_seguridad.sql
-- Datos iniciales de roles, índices de unicidad insensible a mayúsculas y RLS
-- ==============================================================================

-- 1. Inserción de los tres roles fundamentales
INSERT INTO public.roles (nombre, descripcion, activo)
VALUES
    ('administrador', 'Gestiona usuarios, recursos y citas', TRUE),
    ('medico', 'Consulta pacientes y sus citas asignadas', TRUE),
    ('paciente', 'Consulta sus propias citas', TRUE)
ON CONFLICT (nombre) DO NOTHING;

-- 2. Habilitación de Row Level Security (RLS) en todas las tablas
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.especialidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pacientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultorios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.citas ENABLE ROW LEVEL SECURITY;

-- 3. Índices de unicidad insensible a mayúsculas (Case-Insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS uq_usuarios_email_ci
ON public.usuarios (LOWER(email));

CREATE UNIQUE INDEX IF NOT EXISTS uq_especialidades_nombre_ci
ON public.especialidades (LOWER(nombre));

CREATE UNIQUE INDEX IF NOT EXISTS uq_medicos_email_ci
ON public.medicos (LOWER(email));

CREATE UNIQUE INDEX IF NOT EXISTS uq_medicos_registro_ci
ON public.medicos (LOWER(registro_medico));

CREATE UNIQUE INDEX IF NOT EXISTS uq_consultorios_codigo_ci
ON public.consultorios (LOWER(codigo));

-- 4. Índices para prevenir solapamiento de citas médicas y de consultorios
CREATE UNIQUE INDEX IF NOT EXISTS uq_citas_medico_horario_activo
ON public.citas (medico_id, fecha, hora)
WHERE estado <> 'cancelada';

CREATE UNIQUE INDEX IF NOT EXISTS uq_citas_consultorio_horario_activo
ON public.citas (consultorio_id, fecha, hora)
WHERE estado <> 'cancelada';
