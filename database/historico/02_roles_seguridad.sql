BEGIN;

INSERT INTO public.roles
    (nombre, descripcion)
VALUES
    (
        'administrador',
        'Gestiona usuarios, recursos y citas'
    ),
    (
        'medico',
        'Consulta pacientes y sus citas asignadas'
    ),
    (
        'paciente',
        'Consulta sus propias citas'
    );

-- Activar RLS desde el principio.
-- Todavía no creamos políticas de acceso directo.
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.especialidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pacientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultorios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.citas ENABLE ROW LEVEL SECURITY;

-- Impedir acceso directo de los roles de API
-- mientras diseñamos las políticas definitivas.
REVOKE ALL ON TABLE
    public.roles,
    public.usuarios,
    public.especialidades,
    public.pacientes,
    public.medicos,
    public.consultorios,
    public.citas
FROM anon, authenticated;

COMMIT;