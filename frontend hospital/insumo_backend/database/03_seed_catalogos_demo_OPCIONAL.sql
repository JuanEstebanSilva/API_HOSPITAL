-- SOLO DATOS FICTICIOS para una base nueva o ambiente de pruebas.
-- NO ejecutar en producción sin revisión.
INSERT INTO public.especialidades(nombre, descripcion, activa) VALUES
('Medicina general','Atención primaria',true),
('Pediatría','Atención de población pediátrica',true)
ON CONFLICT (nombre) DO NOTHING;
INSERT INTO public.consultorios(codigo,nombre,piso,ubicacion,activo) VALUES
('DEMO-101','Consultorio de demostración 101',1,'Bloque de pruebas',true),
('DEMO-102','Consultorio de demostración 102',1,'Bloque de pruebas',true)
ON CONFLICT (codigo) DO NOTHING;
