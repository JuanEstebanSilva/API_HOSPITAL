-- Ejecutar solo tras 01_esquema_hospital.sql en una base NUEVA.
-- Idempotente por nombre; no crea cuentas ni contraseñas.
INSERT INTO public.roles (nombre, descripcion, activo) VALUES
('administrador','Gestiona usuarios, recursos y citas',true),
('medico','Consulta y atiende sus citas asignadas',true),
('paciente','Consulta y solicita sus propias citas',true)
ON CONFLICT (nombre) DO NOTHING;
