require("dotenv").config();
const { pool, consultar } = require("../src/config/database");
const { app, iniciarServidor } = require("../src/app");
const { execSync, fork } = require("child_process");

const PORT = process.env.PORT || 3000;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const API_KEY = process.env.API_KEY_POSTMAN || process.env.API_KEY_ADMIN;

async function fetchApi(path, options = {}) {
  const headers = {
    "x-api-key": API_KEY,
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers
  });

  const status = res.status;
  let body = null;
  try {
    body = await res.json();
  } catch (e) {
    body = null;
  }

  return { status, body };
}

async function run() {
  console.log("===============================================================");
  console.log("  SUITE DE PRUEBAS BLOQUE 7.5.1 — BOOTSTRAP ADMINISTRATIVO    ");
  console.log("===============================================================");

  // BA03 (Parte 1): Consultar administradores antes
  console.log("\n[BA03 - Pre] Consultando administradores iniciales en base de datos...");
  const adminAntes = await consultar(`
    SELECT u.id, u.nombre, u.email, r.nombre AS rol, u.activo
    FROM public.usuarios u
    INNER JOIN public.roles r ON r.id = u.rol_id
    WHERE r.nombre = 'administrador'
    ORDER BY u.id
  `);
  console.table(adminAntes.rows);
  const totalAntes = adminAntes.rows.length;
  console.log(`Total administradores antes: ${totalAntes}`);

  // BA01: Ejecutar bootstrap con administrador existente
  console.log("\n[BA01] Ejecutando 'node src/scripts/crearAdmin.js' (con admin existente)...");
  const salidaBA01 = execSync("node src/scripts/crearAdmin.js", { encoding: "utf8" });
  console.log(salidaBA01.trim());
  if (!salidaBA01.includes("Ya existe una cuenta administradora") || !salidaBA01.includes("No se realizaron modificaciones")) {
    throw new Error("BA01 falló: no detectó la cuenta administradora existente");
  }
  console.log("✓ BA01 APROBADA: No modificó ni duplicó cuentas.");

  // BA02: Ejecutar bootstrap por segunda vez
  console.log("\n[BA02] Ejecutando bootstrap por segunda vez...");
  const salidaBA02 = execSync("node src/scripts/crearAdmin.js", { encoding: "utf8" });
  console.log(salidaBA02.trim());
  if (!salidaBA02.includes("Ya existe una cuenta administradora")) {
    throw new Error("BA02 falló: comportamiento no idempotente");
  }
  console.log("✓ BA02 APROBADA: Idempotencia confirmada.");

  // BA03 (Parte 2): Consultar administradores después
  console.log("\n[BA03 - Post] Consultando administradores después en base de datos...");
  const adminDespues = await consultar(`
    SELECT u.id, u.nombre, u.email, r.nombre AS rol, u.activo
    FROM public.usuarios u
    INNER JOIN public.roles r ON r.id = u.rol_id
    WHERE r.nombre = 'administrador'
    ORDER BY u.id
  `);
  console.table(adminDespues.rows);
  if (adminDespues.rows.length !== totalAntes || adminDespues.rows[0]?.id !== adminAntes.rows[0]?.id) {
    throw new Error("BA03 falló: la cantidad o identidad de administradores cambió");
  }
  console.log("✓ BA03 APROBADA: Mismos registros e identidades conservadas sin duplicados.");

  // BA07: Ejecutar seed:admin sin ADMIN_*
  console.log("\n[BA07] Ejecutando bootstrap sin variables ADMIN_*...");
  try {
    execSync("node src/scripts/crearAdmin.js", {
      encoding: "utf8",
      env: { ...process.env, ADMIN_NOMBRE: "", ADMIN_EMAIL: "", ADMIN_PASSWORD: "" }
    });
    throw new Error("BA07 falló: debió terminar con error y código distinto de cero");
  } catch (err) {
    const errorOutput = err.stderr || err.stdout || err.message;
    console.log(`Código de salida: ${err.status}`);
    console.log(`Mensaje capturado: ${errorOutput.toString().trim()}`);
    if (err.status === 0) {
      throw new Error("BA07 falló: código de salida fue 0");
    }
    console.log("✓ BA07 APROBADA: Error controlado y salida distinta de cero.");
  }

  // BA05: Iniciar API sin variables ADMIN_*
  console.log("\n[BA05] Verificando arranque de API Express sin variables ADMIN_*...");
  await new Promise((resolve, reject) => {
    const child = fork("src/app.js", [], {
      env: { ...process.env, ADMIN_NOMBRE: "", ADMIN_EMAIL: "", ADMIN_PASSWORD: "" },
      stdio: "pipe"
    });
    let output = "";
    child.stdout.on("data", (d) => {
      output += d.toString();
      if (output.includes("Servidor ejecutándose")) {
        console.log("Express arrancó normalmente sin variables ADMIN_*:");
        console.log(output.trim());
        child.on("exit", () => {
          setTimeout(resolve, 600);
        });
        child.kill();
      }
    });
    child.stderr.on("data", (d) => {
      console.error(d.toString());
    });
    setTimeout(() => {
      child.kill();
      reject(new Error("BA05 falló: timeout esperando arranque de Express"));
    }, 7000);
  });
  console.log("✓ BA05 APROBADA: API inicia normalmente sin requerir bootstrap ni credenciales.");

  // Iniciar servidor para probar BA04 y BA06
  const server = await iniciarServidor();
  try {
    // BA04: Login con administrador existente
    console.log("\n[BA04] Probando login con administrador existente...");
    const loginRes = await fetchApi("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD
      })
    });
    console.log(`Status HTTP: ${loginRes.status}`, loginRes.body?.mensaje);
    if (loginRes.status !== 200 || !loginRes.body?.token) {
      throw new Error("BA04 falló: no se obtuvo token JWT para el administrador");
    }
    const tokenAdmin = loginRes.body.token;
    console.log("✓ BA04 APROBADA: Login correcto y JWT generado.");

    // BA06: Consultar recurso protegido con API Key y JWT
    console.log("\n[BA06] Consultando recurso protegido con API Key y JWT (/api/auth/perfil)...");
    const perfilRes = await fetchApi("/api/auth/perfil", {
      headers: { Authorization: `Bearer ${tokenAdmin}` }
    });
    console.log(`Status HTTP: ${perfilRes.status}`, perfilRes.body?.mensaje);
    console.log("Usuario en JWT:", perfilRes.body?.usuario?.email, "Rol:", perfilRes.body?.usuario?.rol);
    if (perfilRes.status !== 200 || perfilRes.body?.usuario?.rol !== "administrador") {
      throw new Error("BA06 falló: no se obtuvo respuesta autorizada RBAC");
    }
    console.log("✓ BA06 APROBADA: Recurso protegido respondió correctamente según RBAC.");
  } finally {
    server.close();
    await pool.end();
  }

  console.log("\n===============================================================");
  console.log("   ¡MATRIZ BLOQUE 7.5.1 (BA01 - BA07) COMPLETADA CON ÉXITO!    ");
  console.log("===============================================================");
}

run().catch((err) => {
  console.error("Error en validación:", err);
  process.exit(1);
});
