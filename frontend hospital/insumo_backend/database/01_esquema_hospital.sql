-- INSTALACION NUEVA UNICAMENTE. NO EJECUTAR SOBRE hospitalsoft EXISTENTE.
-- Modelo consolidado a partir de los SQL adjuntos (bloques 7, 11.3 y 11.4).
-- No incluye políticas RLS ni la función rls_auto_enable, que pertenece a la configuración del proyecto.
BEGIN;

-- ========================================
-- ROLES
-- ========================================
CREATE TABLE public.roles (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(30) NOT NULL UNIQUE,
    descripcion VARCHAR(200),
    activo BOOLEAN NOT NULL DEFAULT TRUE,

    CONSTRAINT ck_roles_nombre
    CHECK (
        nombre IN (
            'administrador',
            'medico',
            'paciente'
        )
    )
);

-- ========================================
-- USUARIOS
-- ========================================
CREATE TABLE public.usuarios (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    auth_user_id UUID UNIQUE
        REFERENCES auth.users(id)
        ON DELETE RESTRICT,

    rol_id BIGINT NOT NULL
        REFERENCES public.roles(id)
        ON DELETE RESTRICT,

    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,

    password_hash TEXT,

    activo BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_registro TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version_sesion INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT ck_usuarios_nombre
        CHECK (LENGTH(TRIM(nombre)) >= 3)
);

-- ========================================
-- ESPECIALIDADES
-- ========================================
CREATE TABLE public.especialidades (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion VARCHAR(300),
    activa BOOLEAN NOT NULL DEFAULT TRUE
);

-- ========================================
-- PACIENTES
-- ========================================
CREATE TABLE public.pacientes (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    usuario_id BIGINT UNIQUE
        REFERENCES public.usuarios(id)
        ON DELETE RESTRICT,

    nombre VARCHAR(100) NOT NULL,
    documento VARCHAR(30) NOT NULL UNIQUE,
    email VARCHAR(150) NOT NULL UNIQUE,
    telefono VARCHAR(30),
    fecha_nacimiento DATE
);

-- ========================================
-- MEDICOS
-- ========================================
CREATE TABLE public.medicos (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    usuario_id BIGINT UNIQUE
        REFERENCES public.usuarios(id)
        ON DELETE RESTRICT,

    especialidad_id BIGINT NOT NULL
        REFERENCES public.especialidades(id)
        ON DELETE RESTRICT,

    nombre VARCHAR(100) NOT NULL,
    registro_medico VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(150) NOT NULL UNIQUE,
    telefono VARCHAR(30),
    activo BOOLEAN NOT NULL DEFAULT TRUE
);

-- ========================================
-- CONSULTORIOS
-- ========================================
CREATE TABLE public.consultorios (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    codigo VARCHAR(30) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    piso INTEGER NOT NULL,
    ubicacion VARCHAR(200),
    activo BOOLEAN NOT NULL DEFAULT TRUE
);

-- ========================================
-- CITAS
-- ========================================
CREATE TABLE public.citas (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    paciente_id BIGINT NOT NULL
        REFERENCES public.pacientes(id)
        ON DELETE RESTRICT,

    medico_id BIGINT NOT NULL
        REFERENCES public.medicos(id)
        ON DELETE RESTRICT,

    consultorio_id BIGINT NOT NULL
        REFERENCES public.consultorios(id)
        ON DELETE RESTRICT,

    fecha DATE NOT NULL,
    hora TIME NOT NULL,

    motivo VARCHAR(300) NOT NULL,

    estado VARCHAR(20) NOT NULL
        DEFAULT 'programada',

    CONSTRAINT ck_citas_estado
    CHECK (
        estado IN (
            'programada',
            'confirmada',
            'atendida',
            'cancelada'
        )
    ),

    CONSTRAINT ck_citas_motivo
        CHECK (LENGTH(TRIM(motivo)) BETWEEN 5 AND 300)
);

-- ========================================
-- ÍNDICES DE RELACIONES
-- ========================================
CREATE INDEX idx_usuarios_rol
    ON public.usuarios(rol_id);

CREATE INDEX idx_medicos_especialidad
    ON public.medicos(especialidad_id);

CREATE INDEX idx_citas_paciente
    ON public.citas(paciente_id);

CREATE INDEX idx_citas_medico
    ON public.citas(medico_id);

CREATE INDEX idx_citas_consultorio
    ON public.citas(consultorio_id);

CREATE INDEX idx_citas_fecha
    ON public.citas(fecha);

-- ========================================
-- PREVENIR DOBLE RESERVA
-- ========================================
CREATE UNIQUE INDEX uq_citas_medico_horario
    ON public.citas(medico_id, fecha, hora)
    WHERE estado <> 'cancelada';

CREATE UNIQUE INDEX uq_citas_consultorio_horario
    ON public.citas(consultorio_id, fecha, hora)
    WHERE estado <> 'cancelada';




CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    usuario_id BIGINT NOT NULL
        REFERENCES public.usuarios(id)
        ON DELETE CASCADE,

    administrador_id BIGINT NOT NULL
        REFERENCES public.usuarios(id),

    token_hash VARCHAR(64) NOT NULL UNIQUE,

    fecha_creacion TIMESTAMPTZ NOT NULL
        DEFAULT NOW(),

    fecha_expiracion TIMESTAMPTZ NOT NULL,

    fecha_uso TIMESTAMPTZ,

    CONSTRAINT ck_reset_expiracion
        CHECK (fecha_expiracion > fecha_creacion),

    CONSTRAINT ck_reset_uso
        CHECK (
            fecha_uso IS NULL
            OR fecha_uso >= fecha_creacion
        )
);

CREATE INDEX IF NOT EXISTS idx_reset_usuario
ON public.password_reset_tokens(usuario_id);

CREATE INDEX IF NOT EXISTS idx_reset_expiracion
ON public.password_reset_tokens(fecha_expiracion);

ALTER TABLE public.password_reset_tokens
ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.password_reset_tokens
FROM PUBLIC, anon, authenticated;

REVOKE ALL ON SEQUENCE public.password_reset_tokens_id_seq
FROM PUBLIC, anon, authenticated;



CREATE TABLE IF NOT EXISTS public.codigos_recuperacion (
 id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 usuario_id BIGINT NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
 codigo_hash VARCHAR(64) NOT NULL UNIQUE,
 fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 fecha_uso TIMESTAMPTZ,
 CONSTRAINT ck_codigos_fecha_uso CHECK (fecha_uso IS NULL OR fecha_uso >= fecha_creacion)
);
CREATE INDEX IF NOT EXISTS idx_codigos_recuperacion_usuario ON public.codigos_recuperacion(usuario_id);
ALTER TABLE public.codigos_recuperacion ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.codigos_recuperacion FROM PUBLIC, anon, authenticated;
REVOKE ALL ON SEQUENCE public.codigos_recuperacion_id_seq FROM PUBLIC, anon, authenticated;

COMMIT;