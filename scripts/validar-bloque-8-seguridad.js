require("dotenv").config();
const { pool, consultar } = require("../src/config/database");
const { app, iniciarServidor } = require("../src/app");
const { generarPasswordHash } = require("../src/utils/password.util");

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

async function login(email, password) {
  const res = await fetchApi("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });
  if (res.status !== 200 || !res.body?.token) {
    throw new Error(`Login falló para ${email}: status ${res.status} ${JSON.stringify(res.body)}`);
  }
  return res.body.token;
}

async function prepararDatos() {
  console.log("\n[PREPARACIÓN] Verificando usuarios, perfiles y citas para SEG-01..SEG-08...");

  const hashTest = await generarPasswordHash("ClaveSegura2026*");

  // Obtener rol ids
  const rolesRes = await consultar("SELECT id, nombre FROM public.roles");
  const rolMap = {};
  for (const r of rolesRes.rows) rolMap[r.nombre] = r.id;

  // 1. Asegurar Medico A (usuario + perfil)
  let userMedA = (await consultar("SELECT id, email FROM public.usuarios WHERE email = 'medico.a@hospital.com'")).rows[0];
  if (!userMedA) {
    const res = await consultar(
      "INSERT INTO public.usuarios (rol_id, nombre, email, password_hash, activo) VALUES ($1, $2, $3, $4, TRUE) RETURNING id, email",
      [rolMap["medico"], "Dr. Médico A", "medico.a@hospital.com", hashTest]
    );
    userMedA = res.rows[0];
  }
  await consultar("UPDATE public.medicos SET usuario_id = $1 WHERE id = 1", [userMedA.id]);

  // 2. Asegurar Medico B (usuario + perfil)
  let userMedB = (await consultar("SELECT id, email FROM public.usuarios WHERE email = 'medico.b@hospital.com'")).rows[0];
  if (!userMedB) {
    const res = await consultar(
      "INSERT INTO public.usuarios (rol_id, nombre, email, password_hash, activo) VALUES ($1, $2, $3, $4, TRUE) RETURNING id, email",
      [rolMap["medico"], "Dr. Médico B", "medico.b@hospital.com", hashTest]
    );
    userMedB = res.rows[0];
  }
  await consultar("UPDATE public.medicos SET usuario_id = $1 WHERE id = 2", [userMedB.id]);

  // 3. Asegurar Paciente A y Paciente B con contraseñas conocidas
  await consultar("UPDATE public.usuarios SET password_hash = $1 WHERE email = 'paciente.a@example.com'", [hashTest]);
  await consultar("UPDATE public.usuarios SET password_hash = $1 WHERE email = 'paciente.b@example.com'", [hashTest]);

  // 4. Asegurar Citas asociadas
  // Cita 1: Paciente 1 (Paciente A), Médico 1 (Médico A)
  await consultar("UPDATE public.citas SET paciente_id = 1, medico_id = 1 WHERE id = 1");

  // Cita 2: Paciente 2 (Paciente B), Médico 2 (Médico B)
  await consultar("UPDATE public.citas SET paciente_id = 2, medico_id = 2 WHERE id = 2");

  console.log("✓ Datos preparados:");
  console.log("  - Paciente A: paciente.a@example.com (Paciente ID: 1) -> Dueño de Cita 1");
  console.log("  - Paciente B: paciente.b@example.com (Paciente ID: 2) -> Dueño de Cita 2");
  console.log("  - Médico A: medico.a@hospital.com (Médico ID: 1) -> Asignado a Cita 1");
  console.log("  - Médico B: medico.b@hospital.com (Médico ID: 2) -> Asignado a Cita 2");
}

async function run() {
  console.log("===============================================================");
  console.log("  LABORATORIO 8 — MATRIZ COMPLEMENTARIA DE SEGURIDAD (SEG)     ");
  console.log("===============================================================");

  await prepararDatos();

  const server = await iniciarServidor();

  try {
    // Tokens
    const tokenAdmin = await login(process.env.ADMIN_EMAIL, process.env.ADMIN_PASSWORD);
    const tokenPacA = await login("paciente.a@example.com", "ClaveSegura2026*");
    const tokenPacB = await login("paciente.b@example.com", "ClaveSegura2026*");
    const tokenMedA = await login("medico.a@hospital.com", "ClaveSegura2026*");
    const tokenMedB = await login("medico.b@hospital.com", "ClaveSegura2026*");

    console.log("✓ Tokens JWT generados para Admin, Paciente A, Paciente B, Médico A y Médico B.");

    // SEG-01: Paciente consulta cita propia -> 200
    console.log("\n[SEG-01] Paciente A consulta cita propia (ID: 1)...");
    const resSeg01 = await fetchApi("/api/citas/1", {
      headers: { Authorization: `Bearer ${tokenPacA}` }
    });
    console.log(`Status HTTP: ${resSeg01.status} (esperado: 200)`);
    if (resSeg01.status !== 200) throw new Error("SEG-01 falló");
    console.log("✓ SEG-01 APROBADA");

    // SEG-02: Paciente consulta cita ajena -> 403
    console.log("\n[SEG-02] Paciente A consulta cita ajena de Paciente B (ID: 2)...");
    const resSeg02 = await fetchApi("/api/citas/2", {
      headers: { Authorization: `Bearer ${tokenPacA}` }
    });
    console.log(`Status HTTP: ${resSeg02.status} (esperado: 403)`, resSeg02.body?.mensaje);
    if (resSeg02.status !== 403) throw new Error("SEG-02 falló");
    console.log("✓ SEG-02 APROBADA");

    // SEG-03: Paciente consulta sus citas -> 200, solo propias
    console.log("\n[SEG-03] Paciente A consulta sus citas (/api/citas/mis-citas)...");
    const resSeg03 = await fetchApi("/api/citas/mis-citas", {
      headers: { Authorization: `Bearer ${tokenPacA}` }
    });
    console.log(`Status HTTP: ${resSeg03.status} (esperado: 200) Total citas devueltas: ${resSeg03.body?.length}`);
    const todasSonDePacA = Array.isArray(resSeg03.body) && resSeg03.body.every(c => String(c.pacienteId) === "1");
    if (resSeg03.status !== 200 || !todasSonDePacA) throw new Error("SEG-03 falló: devuelve citas ajenas");
    console.log("✓ SEG-03 APROBADA (todas pertenecen al paciente autenticado)");

    // SEG-04: Médico consulta sus citas -> 200, solo asignadas
    console.log("\n[SEG-04] Médico A consulta sus citas asignadas (/api/citas/mis-citas)...");
    const resSeg04 = await fetchApi("/api/citas/mis-citas", {
      headers: { Authorization: `Bearer ${tokenMedA}` }
    });
    console.log(`Status HTTP: ${resSeg04.status} (esperado: 200) Total citas asignadas: ${resSeg04.body?.length}`);
    const todasSonDeMedA = Array.isArray(resSeg04.body) && resSeg04.body.every(c => String(c.medicoId) === "1");
    if (resSeg04.status !== 200 || !todasSonDeMedA) throw new Error("SEG-04 falló: devuelve citas de otro médico");
    console.log("✓ SEG-04 APROBADA (todas corresponden al médico autenticado)");

    // SEG-05: Médico A consulta agenda del médico B -> 403
    console.log("\n[SEG-05] Médico A intenta consultar agenda de Médico B (/api/citas/medico/2)...");
    const resSeg05 = await fetchApi("/api/citas/medico/2", {
      headers: { Authorization: `Bearer ${tokenMedA}` }
    });
    console.log(`Status HTTP: ${resSeg05.status} (esperado: 403)`, resSeg05.body?.mensaje);
    if (resSeg05.status !== 403) throw new Error("SEG-05 falló");
    console.log("✓ SEG-05 APROBADA");

    // SEG-06: Médico A consulta cita asignada al médico B -> 403
    console.log("\n[SEG-06] Médico A intenta consultar cita ajena asignada a Médico B (ID: 2)...");
    const resSeg06 = await fetchApi("/api/citas/2", {
      headers: { Authorization: `Bearer ${tokenMedA}` }
    });
    console.log(`Status HTTP: ${resSeg06.status} (esperado: 403)`, resSeg06.body?.mensaje);
    if (resSeg06.status !== 403) throw new Error("SEG-06 falló");
    console.log("✓ SEG-06 APROBADA");

    // SEG-07: Médico intenta crear cita de uso administrativo -> 403
    console.log("\n[SEG-07] Médico A intenta crear una cita (POST /api/citas)...");
    const resSeg07 = await fetchApi("/api/citas", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenMedA}` },
      body: JSON.stringify({
        pacienteId: 1,
        medicoId: 1,
        consultorioId: 1,
        fecha: "2026-12-01",
        hora: "10:00:00",
        motivo: "Consulta médica administrativa de prueba"
      })
    });
    console.log(`Status HTTP: ${resSeg07.status} (esperado: 403)`, resSeg07.body?.mensaje);
    if (resSeg07.status !== 403) throw new Error("SEG-07 falló");
    console.log("✓ SEG-07 APROBADA (restringido exclusivamente al administrador)");

    // SEG-08: Administrador consulta cita -> 200
    console.log("\n[SEG-08] Administrador consulta cualquier cita (ID: 1)...");
    const resSeg08 = await fetchApi("/api/citas/1", {
      headers: { Authorization: `Bearer ${tokenAdmin}` }
    });
    console.log(`Status HTTP: ${resSeg08.status} (esperado: 200)`, resSeg08.body ? "Cita encontrada" : "");
    if (resSeg08.status !== 200) throw new Error("SEG-08 falló");
    console.log("✓ SEG-08 APROBADA (acceso administrativo global)");

    // P35: Acceso sin X-API-Key
    console.log("\n[P35] Acceso a ruta protegida sin cabecera X-API-Key...");
    const resP35 = await fetch(`${BASE_URL}/api/citas/1`, {
      headers: {
        Authorization: `Bearer ${tokenAdmin}`,
        "Content-Type": "application/json"
      }
    });
    console.log(`Status HTTP: ${resP35.status} (esperado rechazo 401/403)`);
    if (![401, 403].includes(resP35.status)) throw new Error("P35 falló");
    console.log("✓ P35 APROBADA: Rechazo por ausencia de API Key.");

    // P06: Acceso a perfil sin JWT
    console.log("\n[P06] Acceso a /api/auth/perfil sin cabecera Authorization (JWT)...");
    const resP06 = await fetchApi("/api/auth/perfil");
    console.log(`Status HTTP: ${resP06.status} (esperado 401)`);
    if (resP06.status !== 401) throw new Error("P06 falló");
    console.log("✓ P06 APROBADA: Rechazo por ausencia de JWT.");

    console.log("\n===============================================================");
    console.log("   ¡MATRIZ DE SEGURIDAD (SEG-01 - SEG-08 + P06 + P35) APROBADA! ");
    console.log("===============================================================");
  } finally {
    server.close();
    await pool.end();
  }
}

run().catch((err) => {
  console.error("Error en validación de seguridad:", err);
  process.exit(1);
});
