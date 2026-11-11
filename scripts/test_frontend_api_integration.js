require("dotenv").config();
const { app, iniciarServidor } = require("../src/app");
const { pool, consultar } = require("../src/config/database");

const BASE_URL = "http://127.0.0.1:3000";

async function request(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers
  });
  let body = null;
  try {
    body = await res.json();
  } catch (e) {
    body = null;
  }
  return { status: res.status, body };
}

async function run() {
  console.log("===============================================================");
  console.log("  VERIFICACIÓN DE ENDPOINTS REQUERIDOS POR EL FRONTEND REACT   ");
  console.log("===============================================================");

  const server = await iniciarServidor();

  try {
    // 1. Login Admin
    console.log("\n1. Autenticación Administrador...");
    const loginAdmin = await request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "admin@hospital.com", password: "SANTOTO_2026--2" })
    });
    console.log("Status:", loginAdmin.status, "Token:", !!loginAdmin.body?.token);
    const tokenAdmin = loginAdmin.body.token;

    // 2. Estadísticas Resumen (Dashboard Admin)
    console.log("\n2. GET /api/estadisticas/resumen (Admin Dashboard)...");
    const stats = await request("/api/estadisticas/resumen", {
      headers: { Authorization: `Bearer ${tokenAdmin}` }
    });
    console.log("Status:", stats.status, "Body:", stats.body);
    if (stats.status !== 200 || !stats.body?.totalCitas === undefined) throw new Error("Fallo en /api/estadisticas/resumen");

    // 3. Listar Usuarios (Gestión de usuarios Admin)
    console.log("\n3. GET /api/usuarios (Admin)...");
    const usuarios = await request("/api/usuarios", {
      headers: { Authorization: `Bearer ${tokenAdmin}` }
    });
    console.log("Status:", usuarios.status, "Total usuarios:", usuarios.body?.total, "Lista:", usuarios.body?.usuarios?.length);
    if (usuarios.status !== 200 || !Array.isArray(usuarios.body?.usuarios)) throw new Error("Fallo en GET /api/usuarios");

    // 4. Búsqueda usuarios recuperación
    console.log("\n4. GET /api/usuarios/busqueda-recuperacion?q=paciente (Admin)...");
    const busqueda = await request("/api/usuarios/busqueda-recuperacion?q=paciente", {
      headers: { Authorization: `Bearer ${tokenAdmin}` }
    });
    console.log("Status:", busqueda.status, "Resultados:", busqueda.body?.usuarios?.length);
    if (busqueda.status !== 200 || !Array.isArray(busqueda.body?.usuarios)) throw new Error("Fallo en GET /api/usuarios/busqueda-recuperacion");

    // 5. Cuentas vinculadas médicos y pacientes
    console.log("\n5. GET /api/usuarios/cuentas-vinculadas-medicos & pacientes...");
    const vincMed = await request("/api/usuarios/cuentas-vinculadas-medicos", {
      headers: { Authorization: `Bearer ${tokenAdmin}` }
    });
    const vincPac = await request("/api/usuarios/cuentas-vinculadas-pacientes", {
      headers: { Authorization: `Bearer ${tokenAdmin}` }
    });
    console.log("Status Medicos:", vincMed.status, "Status Pacientes:", vincPac.status);

    // 6. Login Médico
    console.log("\n6. Autenticación Médico A...");
    const loginMed = await request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "medico.a@hospital.com", password: "ClaveSegura2026*" })
    });
    console.log("Status:", loginMed.status, "Token:", !!loginMed.body?.token);
    const tokenMed = loginMed.body.token;

    // 7. Mi Contexto Médico
    console.log("\n7. GET /api/citas/mi-contexto (Médico)...");
    const ctxMed = await request("/api/citas/mi-contexto", {
      headers: { Authorization: `Bearer ${tokenMed}` }
    });
    console.log("Status:", ctxMed.status, "Contexto:", ctxMed.body);
    if (ctxMed.status !== 200 || ctxMed.body?.usuario?.rol !== "medico") throw new Error("Fallo en mi-contexto médico");

    // 8. Login Paciente
    console.log("\n8. Autenticación Paciente A...");
    const loginPac = await request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "paciente.a@example.com", password: "ClaveSegura2026*" })
    });
    console.log("Status:", loginPac.status, "Token:", !!loginPac.body?.token);
    const tokenPac = loginPac.body.token;

    // 9. Mi Contexto Paciente
    console.log("\n9. GET /api/citas/mi-contexto (Paciente)...");
    const ctxPac = await request("/api/citas/mi-contexto", {
      headers: { Authorization: `Bearer ${tokenPac}` }
    });
    console.log("Status:", ctxPac.status, "Contexto:", ctxPac.body);
    if (ctxPac.status !== 200 || ctxPac.body?.usuario?.rol !== "paciente") throw new Error("Fallo en mi-contexto paciente");

    // 10. Paciente solicita cita propia (/api/citas/mis-solicitudes)
    console.log("\n10. POST /api/citas/mis-solicitudes (Paciente agenda cita)...");
    const fechaTest = "2026-12-15";
    const horaTest = "10:00";
    const consId = 1;
    const medId = 1;
    const solCita = await request("/api/citas/mis-solicitudes", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenPac}` },
      body: JSON.stringify({
        medicoId: medId,
        consultorioId: consId,
        fecha: fechaTest,
        hora: horaTest,
        motivo: "Consulta médica preventiva semestral"
      })
    });
    console.log("Status:", solCita.status, "Cita agendada:", solCita.body);
    if (solCita.status !== 201) throw new Error("Fallo al agendar cita como paciente");
    const nuevaCitaId = solCita.body?.cita?.id;

    // 11. Médico confirma cita (/api/citas/:id/confirmar)
    console.log(`\n11. PATCH /api/citas/${nuevaCitaId}/confirmar (Médico confirma cita)...`);
    const confCita = await request(`/api/citas/${nuevaCitaId}/confirmar`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${tokenMed}` }
    });
    console.log("Status:", confCita.status, "Estado:", confCita.body?.cita?.estado);
    if (confCita.status !== 200 || confCita.body?.cita?.estado !== "confirmada") throw new Error("Fallo al confirmar cita");

    // 12. Médico atiende cita (/api/citas/:id/atender)
    console.log(`\n12. PATCH /api/citas/${nuevaCitaId}/atender (Médico atiende cita)...`);
    const atendCita = await request(`/api/citas/${nuevaCitaId}/atender`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${tokenMed}` }
    });
    console.log("Status:", atendCita.status, "Estado:", atendCita.body?.cita?.estado);
    if (atendCita.status !== 200 || atendCita.body?.cita?.estado !== "atendida") throw new Error("Fallo al atender cita");

    // 13. Paciente solicita otra cita y la cancela (/api/citas/:id/cancelar)
    console.log("\n13. Flujo de cancelación: paciente agenda y cancela cita propia...");
    const sol2 = await request("/api/citas/mis-solicitudes", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenPac}` },
      body: JSON.stringify({
        medicoId: medId,
        consultorioId: consId,
        fecha: "2026-12-16",
        hora: "11:00",
        motivo: "Consulta dental preventiva especializada"
      })
    });
    const cita2Id = sol2.body?.cita?.id;
    const cancelCita = await request(`/api/citas/${cita2Id}/cancelar`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${tokenPac}` }
    });
    console.log("Status:", cancelCita.status, "Estado:", cancelCita.body?.cita?.estado);
    if (cancelCita.status !== 200 || cancelCita.body?.cita?.estado !== "cancelada") throw new Error("Fallo al cancelar cita");

    console.log("\n===============================================================");
    console.log("  🎉 ¡TODOS LOS ENDPOINTS DEL FRONTEND FUNCIONAN PERFECTAMENTE! ");
    console.log("===============================================================");
  } catch (err) {
    console.error("❌ ERROR EN PRUEBA DE INTEGRACIÓN:", err);
    process.exit(1);
  } finally {
    if (server) await new Promise(r => server.close(r));
    await pool.end();
  }
}

run();
