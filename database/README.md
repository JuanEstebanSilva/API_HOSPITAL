# Base de Datos HospitalSoft — PostgreSQL en Supabase

Este directorio contiene los scripts SQL requeridos para desplegar, configurar y verificar la estructura relacional y las restricciones de seguridad de la base de datos de **API Hospital**.

---

## 1. Orden de Ejecución en Supabase SQL Editor

1. **`01_esquema_hospital.sql`**:
   - Crea las 7 tablas fundamentales: `roles`, `usuarios`, `especialidades`, `medicos`, `pacientes`, `consultorios` y `citas`.
   - Establece claves primarias con `GENERATED ALWAYS AS IDENTITY`.
   - Configura claves foráneas con integridad referencial (`ON DELETE RESTRICT`).
   - Define validaciones `CHECK` para estados y longitudes permitidas.

2. **`02_roles_seguridad.sql`**:
   - Inserta los roles estándar: `administrador`, `medico`, `paciente`.
   - Habilita Row Level Security (**RLS**) en las 7 tablas.
   - Crea índices únicos insensibles a mayúsculas (`LOWER(...)`) para evitar duplicados como `Cardiología` / `cardiología` o colisiones en correos y códigos.
   - Crea índices parciales para evitar solapamiento de citas médicas o de consultorios.

3. **`03_verificacion.sql`**:
   - Comprueba la creación de tablas, conteo de registros, reglas de eliminación de claves foráneas y activación de RLS.

---

## 2. Parámetros de Conexión TLS
- **Pooler**: Transaction Pooler (puerto 6543) o Session Pooler (puerto 5432).
- **Certificado CA**: `certs/prod-ca-2021.crt`.
- **Modo SSL**: `rejectUnauthorized: true`.
