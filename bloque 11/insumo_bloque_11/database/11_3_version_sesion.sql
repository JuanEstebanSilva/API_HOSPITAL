-- LAB 11.3: ejecutar UNA VEZ en Supabase SQL Editor.
-- Conserva usuarios, roles, perfiles y hashes existentes.
ALTER TABLE public.usuarios
  ADD COLUMN IF NOT EXISTS version_sesion INTEGER NOT NULL DEFAULT 0;

SELECT id, email, version_sesion FROM public.usuarios ORDER BY id;
