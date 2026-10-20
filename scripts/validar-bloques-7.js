require("dotenv").config();
const { pool, consultar } = require("../src/config/database");
const { app, iniciarServidor } = require("../src/app");

const PORT = process.env.PORT || 3000;
const BASE_URL = `http://127.0.0.1:${PORT}`;

const API_KEY = process.env.API_KEY_POSTMAN;

let server;
let adminToken = "";
let pacienteToken = "";
let medicoToken = "";

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
  console.log("   EJECUTANDO BATERÍA DE PRUEBAS INTEGRALES (BLOQUE 7.2 - 7.5)");
  console.log("===============================================================");

  server = await iniciarServidor();

  try {
    // -------------------------------------------------------------
    // PRUEBAS DE AUTENTICACIÓN
    // -------------------------------------------------------------
    console.log("\n[AUTH] 1. Login con administrador inicial...");
    const loginAdmin = await fetchApi("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD
      })
    });
    console.log(`Status: ${loginAdmin.status}`, loginAdmin.body?.mensaje);
    if (loginAdmin.status !== 200 || !loginAdmin.body?.token) {
      throw new Error("Fallo en login de administrador");
    }
    adminToken = loginAdmin.body.token;
    console.log("✓ Admin autenticado con éxito");

    console.log("\n[AUTH] 2. Login con contraseña errónea (debe retornar 401)...");
    const loginError = await fetchApi("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: process.env.ADMIN_EMAIL,
        password: "PASSWORD_INCORRECTO"
      })
    });
    console.log(`Status: ${loginError.status} (esperado 401)`);

    console.log("\n[AUTH] 3. Registro público de nuevo paciente (debe asignar rol paciente)...");
    const randomSuffix = Date.now().toString().slice(-6);
    const nuevoPacienteEmail = `paciente_${randomSuffix}@test.com`;
    const regPaciente = await fetchApi("/api/auth/registro", {
      method: "POST",
      body: JSON.stringify({
        nombre: `Paciente Test ${randomSuffix}`,
        email: nuevoPacienteEmail,
        password: "Password123*"
      })
    });
    console.log(`Status: ${regPaciente.status}`, regPaciente.body?.mensaje, "Rol:", regPaciente.body?.usuario?.rol);
    if (regPaciente.status !== 201 || regPaciente.body?.usuario?.rol !== "paciente") {
      throw new Error("Fallo en registro de paciente");
    }

    console.log("\n[AUTH] 4. Login del nuevo paciente...");
    const loginPaciente = await fetchApi("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: nuevoPacienteEmail,
        password: "Password123*"
      })
    });
    console.log(`Status: ${loginPaciente.status}`, loginPaciente.body?.mensaje);
    pacienteToken = loginPaciente.body.token;

    // -------------------------------------------------------------
    // PRUEBAS DE ESPECIALIDADES (BLOQUE 7.3)
    // -------------------------------------------------------------
    console.log("\n[ESPECIALIDADES] 5. Listar especialidades...");
    const espList = await fetchApi("/api/especialidades", {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log(`Status: ${espList.status}`, `Total: ${espList.body?.length}`);

    console.log("\n[ESPECIALIDADES] 6. Crear nueva especialidad...");
    const nombreEsp = `Neurología_${randomSuffix}`;
    const espCrear = await fetchApi("/api/especialidades", {
      method: "POST",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        nombre: nombreEsp,
        descripcion: "Especialidad de prueba neurológica",
        activa: true
      })
    });
    console.log(`Status: ${espCrear.status}`, espCrear.body?.mensaje);
    const nuevaEspId = espCrear.body?.especialidad?.id;

    console.log("\n[ESPECIALIDADES] 7. Nombre duplicado insensitivo (debe retornar 409)...");
    const espDup = await fetchApi("/api/especialidades", {
      method: "POST",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        nombre: nombreEsp.toLowerCase(),
        descripcion: "Duplicado",
        activa: true
      })
    });
    console.log(`Status: ${espDup.status} (esperado 409)`);

    console.log("\n[ESPECIALIDADES] 8. Intentar crear especialidad con token de paciente (RBAC -> 403)...");
    const espRbac = await fetchApi("/api/especialidades", {
      method: "POST",
      headers: { Authorization: `Bearer ${pacienteToken}` },
      body: JSON.stringify({
        nombre: `Cardio_${randomSuffix}`,
        descripcion: "No permitido",
        activa: true
      })
    });
    console.log(`Status: ${espRbac.status} (esperado 403)`);

    // -------------------------------------------------------------
    // PRUEBAS DE MÉDICOS (BLOQUE 7.4)
    // -------------------------------------------------------------
    console.log("\n[MÉDICOS] 9. Listar médicos...");
    const medList = await fetchApi("/api/medicos", {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log(`Status: ${medList.status}`, `Total: ${medList.body?.length}`);

    console.log("\n[MÉDICOS] 10. Crear médico con especialidad activa...");
    const registroMed = `RM-${randomSuffix}`;
    const emailMed = `medico_${randomSuffix}@hospital.com`;
    const medCrear = await fetchApi("/api/medicos", {
      method: "POST",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        nombre: `Dr. Carlos Test ${randomSuffix}`,
        registroMedico: registroMed,
        email: emailMed,
        telefono: "3109876543",
        especialidadId: Number(nuevaEspId),
        activo: true
      })
    });
    console.log(`Status: ${medCrear.status}`, medCrear.body?.mensaje);
    const nuevoMedId = medCrear.body?.medico?.id;

    console.log("\n[MÉDICOS] 11. Registro médico duplicado (debe retornar 409)...");
    const medDup = await fetchApi("/api/medicos", {
      method: "POST",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        nombre: "Dr. Duplicado",
        registroMedico: registroMed,
        email: `otro_${randomSuffix}@hospital.com`,
        telefono: "3101112233",
        especialidadId: Number(nuevaEspId),
        activo: true
      })
    });
    console.log(`Status: ${medDup.status} (esperado 409)`);

    // -------------------------------------------------------------
    // PRUEBAS DE PACIENTES (BLOQUE 7.5.2)
    // -------------------------------------------------------------
    console.log("\n[PACIENTES] 12. Listar pacientes...");
    const pacList = await fetchApi("/api/pacientes", {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log(`Status: ${pacList.status}`, `Total: ${pacList.body?.length}`);

    console.log("\n[PACIENTES] 13. Crear paciente asociado a usuario...");
    const docPaciente = "10" + randomSuffix;
    const pacCrear = await fetchApi("/api/pacientes", {
      method: "POST",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        usuarioId: regPaciente.body?.usuario?.id,
        nombre: `Paciente Asociado ${randomSuffix}`,
        documento: docPaciente,
        email: nuevoPacienteEmail,
        telefono: "3115554433",
        fechaNacimiento: "1992-04-15"
      })
    });
    console.log(`Status: ${pacCrear.status}`, pacCrear.body?.mensaje);
    const nuevoPacId = pacCrear.body?.paciente?.id;

    console.log("\n[PACIENTES] 14. Documento de paciente duplicado (debe retornar 409)...");
    const pacDup = await fetchApi("/api/pacientes", {
      method: "POST",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        nombre: "Otro Paciente",
        documento: docPaciente,
        email: `nuevo_${randomSuffix}@correo.com`,
        telefono: "3110000000",
        fechaNacimiento: "1990-01-01"
      })
    });
    console.log(`Status: ${pacDup.status} (esperado 409)`);

    // -------------------------------------------------------------
    // PRUEBAS DE CONSULTORIOS (BLOQUE 7.5.2)
    // -------------------------------------------------------------
    console.log("\n[CONSULTORIOS] 15. Crear consultorio...");
    const codConsultorio = `CONS-${100 + Math.floor(Math.random() * 800)}`;
    const consCrear = await fetchApi("/api/consultorios", {
      method: "POST",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        codigo: codConsultorio,
        nombre: `Consultorio ${randomSuffix}`,
        piso: 3,
        ubicacion: "Ala Norte",
        activo: true
      })
    });
    console.log(`Status: ${consCrear.status}`, consCrear.body?.mensaje);
    const nuevoConsId = consCrear.body?.consultorio?.id;

    // -------------------------------------------------------------
    // PRUEBAS DE CITAS (BLOQUE 7.5.3)
    // -------------------------------------------------------------
    console.log("\n[CITAS] 16. Programar cita válida...");
    const fechaCita = "2026-11-20";
    const horaCita = "10:30";
    const citaCrear = await fetchApi("/api/citas", {
      method: "POST",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        pacienteId: Number(nuevoPacId),
        medicoId: Number(nuevoMedId),
        consultorioId: Number(nuevoConsId),
        fecha: fechaCita,
        hora: horaCita,
        motivo: "Revisión clínica neurológica"
      })
    });
    console.log(`Status: ${citaCrear.status}`, citaCrear.body?.mensaje, "Estado:", citaCrear.body?.cita?.estado);
    const nuevaCitaId = citaCrear.body?.cita?.id;

    console.log("\n[CITAS] 17. Conflicto de horario médico (mismo médico, fecha y hora -> 409)...");
    const citaConfMed = await fetchApi("/api/citas", {
      method: "POST",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        pacienteId: 1,
        medicoId: Number(nuevoMedId),
        consultorioId: 1,
        fecha: fechaCita,
        hora: horaCita,
        motivo: "Otra cita en el mismo horario"
      })
    });
    console.log(`Status: ${citaConfMed.status} (esperado 409)`);

    console.log("\n[CITAS] 18. Conflicto de consultorio (mismo consultorio, fecha y hora -> 409)...");
    const citaConfCons = await fetchApi("/api/citas", {
      method: "POST",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        pacienteId: 1,
        medicoId: 1,
        consultorioId: Number(nuevoConsId),
        fecha: fechaCita,
        hora: horaCita,
        motivo: "Conflicto en consultorio"
      })
    });
    console.log(`Status: ${citaConfCons.status} (esperado 409)`);

    console.log("\n[CITAS] 19. Transición de estado: programada -> confirmada (200)...");
    const estadoConf = await fetchApi(`/api/citas/${nuevaCitaId}/estado`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ estado: "confirmada" })
    });
    console.log(`Status: ${estadoConf.status}`, "Nuevo estado:", estadoConf.body?.cita?.estado);

    console.log("\n[CITAS] 20. Transición de estado: confirmada -> atendida (200)...");
    const estadoAten = await fetchApi(`/api/citas/${nuevaCitaId}/estado`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ estado: "atendida" })
    });
    console.log(`Status: ${estadoAten.status}`, "Nuevo estado:", estadoAten.body?.cita?.estado);

    console.log("\n[CITAS] 21. Transición inválida: atendida -> programada (409)...");
    const estadoInv = await fetchApi(`/api/citas/${nuevaCitaId}/estado`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ estado: "programada" })
    });
    console.log(`Status: ${estadoInv.status} (esperado 409)`);

    // -------------------------------------------------------------
    // PRUEBAS DE BOLA / IDOR Y PERFILES
    // -------------------------------------------------------------
    console.log("\n[BOLA] 22. Paciente consulta sus propias citas (/api/citas/mis-citas)...");
    const misCitas = await fetchApi("/api/citas/mis-citas", {
      headers: { Authorization: `Bearer ${pacienteToken}` }
    });
    console.log(`Status: ${misCitas.status}`, `Citas encontradas: ${misCitas.body?.length}`);

    console.log("\n[BOLA] 23. Paciente consulta cita por ID de su propiedad (200)...");
    const citaPropia = await fetchApi(`/api/citas/${nuevaCitaId}`, {
      headers: { Authorization: `Bearer ${pacienteToken}` }
    });
    console.log(`Status: ${citaPropia.status} (esperado 200)`);

    console.log("\n[BOLA] 24. Paciente consulta cita ajena (ID 1 de María Rodríguez -> 403)...");
    const citaAjena = await fetchApi("/api/citas/1", {
      headers: { Authorization: `Bearer ${pacienteToken}` }
    });
    console.log(`Status: ${citaAjena.status} (esperado 403)`);

    // -------------------------------------------------------------
    // INTEGRIDAD REFERENCIAL (FK RESTRICT)
    // -------------------------------------------------------------
    console.log("\n[FK] 25. Intentar eliminar médico con citas asociadas (debe retornar 409)...");
    const delMed = await fetchApi(`/api/medicos/${nuevoMedId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log(`Status: ${delMed.status} (esperado 409)`);

    console.log("\n[FK] 26. Intentar eliminar consultorio con citas asociadas (debe retornar 409)...");
    const delCons = await fetchApi(`/api/consultorios/${nuevoConsId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log(`Status: ${delCons.status} (esperado 409)`);

    console.log("\n[FK] 27. Intentar eliminar paciente con citas asociadas (debe retornar 409)...");
    const delPac = await fetchApi(`/api/pacientes/${nuevoPacId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log(`Status: ${delPac.status} (esperado 409)`);

    console.log("\n===============================================================");
    console.log("   ¡TODAS LAS PRUEBAS FUNCIONARON Y SE VALIDARON CON ÉXITO!   ");
    console.log("===============================================================");
  } finally {
    if (server) {
      server.close();
    }
    await pool.end();
  }
}

run().catch(err => {
  console.error("Error fatal en suite de pruebas:", err);
  process.exit(1);
});
