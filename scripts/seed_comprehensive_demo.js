require("dotenv").config();
const { pool, consultar } = require("../src/config/database");
const bcrypt = require("bcrypt");

async function seed() {
  console.log("Seeding demo data for all test suites...");
  const hash = await bcrypt.hash("ClaveSegura2026*", 10);

  // 1. Roles map
  const roles = (await consultar("SELECT id, nombre FROM public.roles")).rows;
  const rolMap = {};
  roles.forEach(r => rolMap[r.nombre] = r.id);

  // 2. Especialidades
  let esp = (await consultar("SELECT id FROM public.especialidades LIMIT 1")).rows[0];
  if (!esp) {
    esp = (await consultar("INSERT INTO public.especialidades (nombre, descripcion, activa) VALUES ('Medicina General', 'Atención Primaria', true) RETURNING id")).rows[0];
  }

  // 3. Consultorios
  let cons = (await consultar("SELECT id FROM public.consultorios LIMIT 1")).rows[0];
  if (!cons) {
    cons = (await consultar("INSERT INTO public.consultorios (codigo, nombre, piso, ubicacion, activo) VALUES ('CONS-101', 'Consultorio 101', 1, 'Piso 1 Ala Norte', true) RETURNING id")).rows[0];
  }

  // 4. Medico A User
  let uMedA = (await consultar("SELECT id FROM public.usuarios WHERE email = 'medico.a@hospital.com'")).rows[0];
  if (!uMedA) {
    uMedA = (await consultar(
      "INSERT INTO public.usuarios (rol_id, nombre, email, password_hash, activo, version_sesion) VALUES ($1, $2, $3, $4, true, 0) RETURNING id",
      [rolMap["medico"], "Dr. Medico A", "medico.a@hospital.com", hash]
    )).rows[0];
  } else {
    await consultar("UPDATE public.usuarios SET password_hash = $1, version_sesion = 0, activo = true WHERE id = $2", [hash, uMedA.id]);
  }

  // 5. Medico A Ficha
  let mMedA = (await consultar("SELECT id FROM public.medicos WHERE usuario_id = $1", [uMedA.id])).rows[0];
  if (!mMedA) {
    mMedA = (await consultar(
      "INSERT INTO public.medicos (usuario_id, especialidad_id, nombre, registro_medico, email, telefono, activo) VALUES ($1, $2, $3, $4, $5, $6, true) RETURNING id",
      [uMedA.id, esp.id, "Dr. Medico A", "RM-1001", "medico.a@hospital.com", "3110000001"]
    )).rows[0];
  }

  // 5b. Medico B User
  let uMedB = (await consultar("SELECT id FROM public.usuarios WHERE email = 'medico.b@hospital.com'")).rows[0];
  if (!uMedB) {
    uMedB = (await consultar(
      "INSERT INTO public.usuarios (rol_id, nombre, email, password_hash, activo, version_sesion) VALUES ($1, $2, $3, $4, true, 0) RETURNING id",
      [rolMap["medico"], "Dr. Medico B", "medico.b@hospital.com", hash]
    )).rows[0];
  } else {
    await consultar("UPDATE public.usuarios SET password_hash = $1, version_sesion = 0, activo = true WHERE id = $2", [hash, uMedB.id]);
  }

  // 5c. Medico B Ficha
  let mMedB = (await consultar("SELECT id FROM public.medicos WHERE usuario_id = $1", [uMedB.id])).rows[0];
  if (!mMedB) {
    mMedB = (await consultar(
      "INSERT INTO public.medicos (usuario_id, especialidad_id, nombre, registro_medico, email, telefono, activo) VALUES ($1, $2, $3, $4, $5, $6, true) RETURNING id",
      [uMedB.id, esp.id, "Dr. Medico B", "RM-1002", "medico.b@hospital.com", "3110000002"]
    )).rows[0];
  }

  // 6. Paciente A User
  let uPacA = (await consultar("SELECT id FROM public.usuarios WHERE email = 'paciente.a@example.com'")).rows[0];
  if (!uPacA) {
    uPacA = (await consultar(
      "INSERT INTO public.usuarios (rol_id, nombre, email, password_hash, activo, version_sesion) VALUES ($1, $2, $3, $4, true, 0) RETURNING id",
      [rolMap["paciente"], "Paciente A", "paciente.a@example.com", hash]
    )).rows[0];
  } else {
    await consultar("UPDATE public.usuarios SET password_hash = $1, version_sesion = 0, activo = true WHERE id = $2", [hash, uPacA.id]);
  }

  // 7. Paciente A Ficha
  let fPacA = (await consultar("SELECT id FROM public.pacientes WHERE usuario_id = $1", [uPacA.id])).rows[0];
  if (!fPacA) {
    fPacA = (await consultar(
      "INSERT INTO public.pacientes (usuario_id, nombre, documento, email, telefono, fecha_nacimiento) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
      [uPacA.id, "Paciente A", "CC-10001", "paciente.a@example.com", "3001111111", "1990-01-01"]
    )).rows[0];
  }

  // 8. Paciente B User
  let uPacB = (await consultar("SELECT id FROM public.usuarios WHERE email = 'paciente.b@example.com'")).rows[0];
  if (!uPacB) {
    uPacB = (await consultar(
      "INSERT INTO public.usuarios (rol_id, nombre, email, password_hash, activo, version_sesion) VALUES ($1, $2, $3, $4, true, 0) RETURNING id",
      [rolMap["paciente"], "Paciente B", "paciente.b@example.com", hash]
    )).rows[0];
  } else {
    await consultar("UPDATE public.usuarios SET password_hash = $1, version_sesion = 0, activo = true WHERE id = $2", [hash, uPacB.id]);
  }

  // 9. Paciente B Ficha
  let fPacB = (await consultar("SELECT id FROM public.pacientes WHERE usuario_id = $1", [uPacB.id])).rows[0];
  if (!fPacB) {
    fPacB = (await consultar(
      "INSERT INTO public.pacientes (usuario_id, nombre, documento, email, telefono, fecha_nacimiento) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
      [uPacB.id, "Paciente B", "CC-10002", "paciente.b@example.com", "3002222222", "1992-02-02"]
    )).rows[0];
  }

  // 10. Citas
  const cita1 = (await consultar("SELECT id FROM public.citas WHERE id = 1")).rows[0];
  if (!cita1) {
    await consultar(
      "INSERT INTO public.citas (id, paciente_id, medico_id, consultorio_id, fecha, hora, motivo, estado) OVERRIDING SYSTEM VALUE VALUES (1, $1, $2, $3, '2026-12-01', '08:00:00', 'Consulta general de rutina', 'programada')",
      [fPacA.id, mMedA.id, cons.id]
    );
  }

  const cita2 = (await consultar("SELECT id FROM public.citas WHERE id = 2")).rows[0];
  if (!cita2) {
    await consultar(
      "INSERT INTO public.citas (id, paciente_id, medico_id, consultorio_id, fecha, hora, motivo, estado) OVERRIDING SYSTEM VALUE VALUES (2, $1, $2, $3, '2026-12-01', '09:00:00', 'Control de paciente B', 'programada')",
      [fPacB.id, mMedA.id, cons.id]
    );
  }

  console.log("✅ Seed completed successfully!");
  console.log(`- Paciente A ID: ${fPacA.id}, User: ${uPacA.id} (${uPacA.email || 'paciente.a@example.com'})`);
  console.log(`- Paciente B ID: ${fPacB.id}, User: ${uPacB.id} (${uPacB.email || 'paciente.b@example.com'})`);
  console.log(`- Medico A ID: ${mMedA.id}, User: ${uMedA.id} (${uMedA.email || 'medico.a@hospital.com'})`);

  await pool.end();
}

seed().catch(err => {
  console.error("Error seeding:", err);
  process.exit(1);
});
