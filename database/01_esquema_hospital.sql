-- ==============================================================================
-- 01_esquema_hospital.sql
-- Creación de tablas, claves primarias, claves foráneas y restricciones CHECK
-- ==============================================================================

-- 1. Tabla: roles
CREATE TABLE IF NOT EXISTS public.roles (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT,
    activo BOOLEAN NOT NULL DEFAULT TRUE
);

-- 2. Tabla: usuarios
CREATE TABLE IF NOT EXISTS public.usuarios (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    auth_user_id UUID UNIQUE NULL,
    rol_id BIGINT NOT NULL REFERENCES public.roles(id) ON DELETE RESTRICT,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_registro TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Tabla: especialidades
CREATE TABLE IF NOT EXISTS public.especialidades (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    activa BOOLEAN NOT NULL DEFAULT TRUE
);

-- 4. Tabla: medicos
CREATE TABLE IF NOT EXISTS public.medicos (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    usuario_id BIGINT UNIQUE NULL REFERENCES public.usuarios(id) ON DELETE RESTRICT,
    especialidad_id BIGINT NOT NULL REFERENCES public.especialidades(id) ON DELETE RESTRICT,
    nombre VARCHAR(100) NOT NULL,
    registro_medico VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(150) NOT NULL UNIQUE,
    telefono VARCHAR(30),
    activo BOOLEAN NOT NULL DEFAULT TRUE
);

-- 5. Tabla: pacientes
CREATE TABLE IF NOT EXISTS public.pacientes (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    usuario_id BIGINT UNIQUE NULL REFERENCES public.usuarios(id) ON DELETE RESTRICT,
    nombre VARCHAR(100) NOT NULL,
    documento VARCHAR(30) NOT NULL UNIQUE,
    email VARCHAR(150) NOT NULL UNIQUE,
    telefono VARCHAR(30),
    fecha_nacimiento DATE NOT NULL
);

-- 6. Tabla: consultorios
CREATE TABLE IF NOT EXISTS public.consultorios (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    codigo VARCHAR(20) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    piso INTEGER NOT NULL,
    ubicacion VARCHAR(150),
    activo BOOLEAN NOT NULL DEFAULT TRUE
);

-- 7. Tabla: citas
CREATE TABLE IF NOT EXISTS public.citas (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    paciente_id BIGINT NOT NULL REFERENCES public.pacientes(id) ON DELETE RESTRICT,
    medico_id BIGINT NOT NULL REFERENCES public.medicos(id) ON DELETE RESTRICT,
    consultorio_id BIGINT NOT NULL REFERENCES public.consultorios(id) ON DELETE RESTRICT,
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    motivo VARCHAR(300) NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'programada',
    CONSTRAINT ck_citas_estado CHECK (estado IN ('programada', 'confirmada', 'atendida', 'cancelada')),
    CONSTRAINT ck_citas_motivo CHECK (LENGTH(TRIM(motivo)) >= 5 AND LENGTH(TRIM(motivo)) <= 300)
);

-- Índices regulares para optimizar búsquedas por clave foránea y fecha
CREATE INDEX IF NOT EXISTS idx_usuarios_rol ON public.usuarios(rol_id);
CREATE INDEX IF NOT EXISTS idx_medicos_especialidad ON public.medicos(especialidad_id);
CREATE INDEX IF NOT EXISTS idx_citas_paciente ON public.citas(paciente_id);
CREATE INDEX IF NOT EXISTS idx_citas_medico ON public.citas(medico_id);
CREATE INDEX IF NOT EXISTS idx_citas_consultorio ON public.citas(consultorio_id);
CREATE INDEX IF NOT EXISTS idx_citas_fecha ON public.citas(fecha);
