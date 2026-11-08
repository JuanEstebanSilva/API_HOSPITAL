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

COMMIT;