-- Índices observados en capturas, adicionales a los del esquema inicial.
-- OPCIONAL: antes de ejecutar, revisar pg_indexes para evitar redundancia.
-- Los índices UNIQUE simples (email, documento, etc.) ya nacen de restricciones UNIQUE.
-- Los índices parciales activos del esquema base ya impiden doble reserva.
-- No se crean aquí índices duplicados ni restricciones que puedan bloquear datos existentes.
-- Consulta de inspección:
SELECT indexname,indexdef FROM pg_indexes WHERE schemaname='public' AND tablename='citas';
