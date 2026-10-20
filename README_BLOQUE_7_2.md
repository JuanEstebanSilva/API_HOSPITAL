# BLOQUE 7.2 — Conexión segura de API Hospital con Supabase PostgreSQL

**Proyecto:** API_HOSPITAL  
**Tecnologías:** Node.js 22, Express, `pg`, `dotenv`, Supabase PostgreSQL  
**Estado:** conexión y lectura de roles verificadas; migración de CRUD pendiente (Bloque 7.3).

## 1. Objetivo

Conectar el backend Node.js/Express con la base PostgreSQL alojada en Supabase mediante un pool de conexiones y **TLS con verificación del certificado**, sin reemplazar todavía los arreglos en memoria ni alterar las reglas de autenticación y autorización de la API.

Al finalizar, el script `scripts/probar-conexion.js` debe consultar el nombre de la base, el usuario SQL, la fecha del servidor y los roles de negocio.

## 2. Requisitos previos

- Proyecto Supabase `hospitalsoft` creado.
- Scripts de la carpeta `database/` ejecutados en orden: `01_esquema_hospital.sql`, `02_roles_seguridad.sql`, `03_verificacion.sql`.
- Siete tablas creadas: `roles`, `usuarios`, `pacientes`, `medicos`, `especialidades`, `consultorios`, `citas`.
- Tres roles registrados: `administrador`, `medico`, `paciente`.
- RLS habilitado en las siete tablas y ocho claves foráneas comprobadas.
- Node.js, npm y el proyecto `API_HOSPITAL` disponibles en VS Code.

> **Importante:** RLS habilitado no implica que las políticas de acceso por fila estén implementadas. En esta fase el backend se conecta con credenciales PostgreSQL de servidor; no se está probando RLS en nombre de cada paciente o médico.

## 3. Estructura de carpetas

```text
API_HOSPITAL/
├── certs/
│   └── prod-ca-2021.crt
├── database/
│   ├── README.md
│   ├── 01_esquema_hospital.sql
│   ├── 02_roles_seguridad.sql
│   └── 03_verificacion.sql
├── scripts/
│   └── probar-conexion.js
├── src/
│   ├── config/
│   │   └── database.js
│   ├── controllers/
│   ├── middlewares/
│   ├── routes/
│   ├── services/
│   └── app.js
├── .env
├── .env.example
├── .gitignore
└── package.json
```

## 4. Paso 1 — Obtener el método de conexión

1. Abrir Supabase y entrar al proyecto `hospitalsoft`.
2. Pulsar **Connect**.
3. Seleccionar **Direct** (pestaña de cadenas de conexión), revisar el método disponible y elegir el endpoint apropiado para el entorno. Para una máquina Windows con conectividad IPv4 suele resultar útil **Session pooler**; el puerto habitual es `5432`. El **Transaction pooler** utiliza habitualmente `6543`. Copiar la URI que corresponda al método realmente elegido.
4. Guardar la URI **solo** en el archivo `.env` del backend. No pegarla en capturas, documentación, repositorios ni en el frontend.

Ejemplo con valores ficticios:

```dotenv
DATABASE_URL=postgresql://USUARIO:CONTRASENA@HOST:5432/postgres
```

Si la contraseña tiene caracteres especiales, deben codificarse correctamente para una URI. Los parámetros de SSL dentro de la URI (`sslmode`, `sslrootcert`, etc.) pueden interferir con las opciones SSL suministradas a `pg`: verificar su presencia y evitar configuraciones contradictorias.

## 5. Paso 2 — Instalar la dependencia

Desde la raíz del proyecto:

```powershell
npm install pg
```

`pg` permite conectar Node.js con PostgreSQL y administrar un **pool de conexiones**. No es necesario instalar PostgreSQL localmente.

## 6. Paso 3 — Configurar variables de entorno

Conservar las variables actuales de API Keys, JWT y administrador inicial. Agregar en `.env`:

```dotenv
DATABASE_URL=postgresql://USUARIO:CONTRASENA@HOST:5432/postgres
```

En `.env.example` colocar únicamente valores ficticios. Verificar `.gitignore`:

```gitignore
node_modules/
.env
.env.*
!.env.example
```

**Nunca incluir contraseñas reales en archivos versionados.**

## 7. Paso 4 — Descargar el certificado de Supabase

1. En Supabase, abrir **Database → Settings → SSL configuration**.
2. Pulsar **Download certificate**.
3. Guardar el certificado obtenido como `certs/prod-ca-2021.crt` (nombre observado en este laboratorio).
4. Comprobar que la ruta y el nombre del archivo coinciden con el código. El certificado debe ser confiable y corresponder al endpoint usado; una CA del endpoint directo no necesariamente sirve para un pooler distinto.

### ¿Por qué necesitamos el certificado?

TLS cifra el tráfico entre Node.js y PostgreSQL. Con `rejectUnauthorized: true`, Node.js también valida la cadena de confianza del certificado presentado por el servidor. **Cifrar sin validar la identidad del servidor no ofrece la misma protección**.

Durante las pruebas apareció:

```text
SELF_SIGNED_CERT_IN_CHAIN
self-signed certificate in certificate chain
```

La conexión funcionaba al cambiar `rejectUnauthorized` a `false`, pero esa alternativa **desactiva la verificación de identidad** y no se debe mantener como solución. La conexión se verificó correctamente después de configurar el certificado descargado y mantener `rejectUnauthorized: true`.

## 8. Paso 5 — Crear `src/config/database.js`

```javascript
const { Pool } = require("pg");
const fs = require("node:fs");
const path = require("node:path");
require("dotenv").config();

if (!process.env.DATABASE_URL) {
  throw new Error("Falta DATABASE_URL en el archivo .env");
}

const rutaCertificado = path.resolve(
  __dirname,
  "../../certs/prod-ca-2021.crt"
);

if (!fs.existsSync(rutaCertificado)) {
  throw new Error(`No se encontró el certificado SSL en: ${rutaCertificado}`);
}

const certificado = fs.readFileSync(rutaCertificado, "utf8");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    ca: certificado,
    rejectUnauthorized: true
  },
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
});

pool.on("error", (error) => {
  console.error("Error en conexión PostgreSQL inactiva:", error.message);
});

const consultar = (sql, parametros = []) => pool.query(sql, parametros);

module.exports = { pool, consultar };
```

**Explicación:**

| Elemento | Función |
|---|---|
| `Pool` | Reutiliza conexiones y limita conexiones simultáneas. |
| `DATABASE_URL` | Define el servidor y las credenciales PostgreSQL. |
| `ca` | Autoridad certificadora de confianza para TLS. |
| `rejectUnauthorized: true` | Exige validación del certificado. |
| `max: 5` | Hasta cinco conexiones en el pool de esta instancia. |
| `idleTimeoutMillis` | Cierra conexiones inactivas después de 30 s. |
| `connectionTimeoutMillis` | Límite de espera de 10 s para obtener conexión. |
| `consultar(sql, parametros)` | Ejecuta SQL, con soporte para parámetros. |

> En los futuros services se usarán consultas parametrizadas (`$1`, `$2`, etc.), no concatenación de valores provenientes del usuario.

## 9. Paso 6 — Crear `scripts/probar-conexion.js`

```javascript
const { pool, consultar } = require("../src/config/database");

async function probarConexion() {
  try {
    console.log("Conectando con Supabase...");

    const resultado = await consultar(`
      SELECT
        current_database() AS base_datos,
        current_user AS usuario,
        NOW() AS fecha_servidor
    `);
    console.table(resultado.rows);

    const roles = await consultar(`
      SELECT id, nombre, activo
      FROM public.roles
      ORDER BY id
    `);
    console.log("Roles registrados:");
    console.table(roles.rows);

    console.log("Conexión PostgreSQL exitosa");
  } catch (error) {
    console.error("Error de conexión PostgreSQL");
    console.error("Código:", error.code);
    console.error("Mensaje:", error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

probarConexion();
```

**Explicación:** `async/await` permite esperar consultas de red; `console.table` facilita la inspección; `finally` cierra el pool aunque falle la consulta; `process.exitCode = 1` señala un error sin impedir la limpieza.

## 10. Paso 7 — Ejecutar y validar

Desde la raíz del proyecto:

```powershell
node scripts/probar-conexion.js
```

Resultado observado en el laboratorio (valores ilustrativos de fecha):

```text
Conectando con Supabase...
base_datos: postgres
usuario: postgres
fecha_servidor: [fecha y hora devueltas por PostgreSQL]

Roles registrados:
1 administrador true
2 medico        true
3 paciente      true

Conexión PostgreSQL exitosa
```

Esto demuestra que la credencial SQL de servidor puede conectarse y leer `public.roles`. **No demuestra aún que los pacientes o médicos tengan permisos correctos mediante RLS.**

## 11. Paso 8 — Obligar a utilizar SSL en Supabase

En **Database → Settings → SSL configuration**, activar:

**Enforce SSL on incoming connections** → **ON**.

La opción rechaza conexiones sin SSL a la base de datos. En el laboratorio se probó la conexión con el interruptor apagado y encendido; funcionó en ambos casos porque Node.js ya utilizaba TLS. Se dejó **activado** como configuración final.

**Configuración final:**

| Lugar | Opción | Valor |
|---|---|---|
| Supabase | Enforce SSL | ON |
| Node.js | `ssl.ca` | Certificado `prod-ca-2021.crt` descargado |
| Node.js | `rejectUnauthorized` | `true` |
| Backend | `DATABASE_URL` | Solo en `.env` |



## 12. Pruebas y evidencias del bloque

| ID | Prueba | Resultado esperado | Estado observado |
|---|---|---|---|
| P01 | `DATABASE_URL` configurada | El script intenta conectar | Confirmado |
| P02 | Consulta a PostgreSQL | Devuelve `postgres` | Confirmado |
| P03 | Consulta de roles | Tres roles activos | Confirmado |
| P04 | Ruta de CA incorrecta | Error antes de conectar | Confirmado |
| P05 | TLS sin CA confiable | Error de validación | Confirmado |
| P06 | TLS con CA y `rejectUnauthorized: true` | Conexión exitosa | Confirmado |
| P07 | Enforce SSL activado | La conexión TLS sigue funcionando | Confirmado |
| P08 | Contraseña errónea | Acceso rechazado | Pendiente de prueba controlada |
| P09 | Consulta parametrizada en un service | CRUD correcto | Bloque 7.3 |

No modificar contraseñas reales para realizar P08 si no se ha preparado una prueba aislada.

## 13. Seguridad y arquitectura: qué conservamos

```text
Postman / Swagger (posteriormente React + Vite)
             |
             v
     Express / API Hospital
       | API Keys (clientes confiables)
       | JWT / autenticación
       | RBAC / roles
       | BOLA / propiedad
       | express-validator
             |
             v
    Controllers → Services
             |
             v
    pg Pool + TLS verificado
             |
             v
    Supabase PostgreSQL
```

**Roles de negocio:** `administrador`, `medico`, `paciente`.

- **Administrador:** gestiona usuarios y recursos; consulta y administra citas.
- **Médico:** consulta los recursos permitidos y las citas que le corresponden.
- **Paciente:** consulta sus propias citas mediante `/api/citas/mis-citas` y recursos autorizados.
- **BOLA/IDOR:** la propiedad de una cita se determina por la identidad autenticada y la relación con el perfil, no por confiar en un ID suministrado por el cliente.

**Importante:** aún no se ha migrado la autenticación a Supabase Auth ni se han implementado políticas RLS por usuario. El backend seguirá aplicando sus controles durante la transición. La conexión PostgreSQL de servidor no debe exponerse en el navegador.

## 14. Próximo paso — Bloque 7.3

Migrar el CRUD de **Especialidades** desde arreglos en memoria a `public.especialidades`:

1. Revisar `especialidades.service.js`, su controller y sus validadores actuales.
2. Introducir consultas SQL parametrizadas y `async/await`.
3. Conservar el contrato HTTP/JSON y las restricciones de RBAC.
4. Ajustar las dependencias de otros services que consultan especialidades.
5. Probar GET, POST, PUT, PATCH y DELETE; reiniciar Node.js y comprobar persistencia.

**Criterio de cierre del Bloque 7.2:** conexión PostgreSQL exitosa mediante `pg`, lectura de los tres roles y TLS verificado con `rejectUnauthorized: true`, mientras Supabase exige SSL en conexiones entrantes.
