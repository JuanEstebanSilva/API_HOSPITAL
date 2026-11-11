-- Habilita RLS en las 9 tablas del esquema hospitalario.
-- No crea políticas: acceso directo denegado por defecto a roles sujetos a RLS.
-- IMPORTANTE: un rol con BYPASSRLS (p. ej. postgres) omite las políticas.
DO $$ DECLARE t text; BEGIN
 FOR t IN SELECT unnest(ARRAY['roles','usuarios','especialidades','pacientes','medicos','consultorios','citas','password_reset_tokens','codigos_recuperacion']) LOOP
   EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);
   EXECUTE format('REVOKE ALL ON TABLE public.%I FROM PUBLIC, anon, authenticated',t);
 END LOOP;
END $$;
