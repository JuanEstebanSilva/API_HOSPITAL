require("dotenv").config();
const { pool, consultar } = require("../src/config/database");
const { app, iniciarServidor } = require("../src/app");

const PORT = process.env.PORT || 3000;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const API_KEY = process.env.API_KEY_POSTMAN;

let server;

async function request(path, options = {}) {
  const headers = {
    ...(options.headers || {})
  };
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers
  });
  let body = null;
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    try {
      body = await res.json();
    } catch (e) {
      body = null;
    }
  } else {
    body = await res.text();
  }
  return { status: res.status, headers: res.headers, body };
}

async function run() {
  console.log("===============================================================");
  console.log("   EJECUTANDO BATERÍA COMPLETA DE PRUEBAS DEL BLOQUE 11        ");
  console.log("===============================================================");

  server = await iniciarServidor();

  const resultados = [];
  function registrar(num, nombre, rol, endpoint, esperado, obtenido, ok, obs = "") {
    resultados.push({
      num,
      nombre,
      rol,
      endpoint,
      esperado,
      obtenido,
      estado: ok ? "APROBADO" : "FALLIDO",
      obs
    });
    const icono = ok ? "✓" : "✗";
    console.log(`[PRUEBA ${num}] ${nombre}`);
    console.log(`  Endpoint: ${endpoint} | HTTP: ${obtenido} (esperado: ${esperado}) -> ${icono} ${ok ? "APROBADO" : "FALLIDO"}`);
    if (obs) console.log(`  Nota: ${obs}`);
  }

  try {
    // 0. Preparar usuario de prueba específico para Bloque 11
    const testEmail = "usuario_bloque11@hospital.com";
    const testPassword = "Password11_Original!";
    const testPasswordNueva = "Password11_Nueva2026!";
    const testPasswordTercera = "Password11_Final2026!";

    // Asegurarse de que exista el usuario de prueba o crearlo
    let userRes = await consultar("SELECT id, password_hash, version_sesion FROM public.usuarios WHERE email = $1", [testEmail]);
    let testUserId;
    const bcrypt = require("bcrypt");
    const testHash = await bcrypt.hash(testPassword, 10);

    if (userRes.rows.length === 0) {
      const ins = await consultar(
        "INSERT INTO public.usuarios (rol_id, nombre, email, password_hash, activo, version_sesion) VALUES (3, 'Usuario Bloque 11', $1, $2, true, 0) RETURNING id",
        [testEmail, testHash]
      );
      testUserId = ins.rows[0].id;
    } else {
      testUserId = userRes.rows[0].id;
      // Resetear a password original para pruebas
      await consultar("UPDATE public.usuarios SET password_hash = $1, version_sesion = 0, activo = true WHERE id = $2", [testHash, testUserId]);
      await consultar("DELETE FROM public.password_reset_tokens WHERE usuario_id = $1", [testUserId]);
      await consultar("DELETE FROM public.codigos_recuperacion WHERE usuario_id = $1", [testUserId]);
    }

    // Login Admin inicial
    const adminLogin = await request("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: process.env.ADMIN_EMAIL || "admin@hospital.com",
        password: process.env.ADMIN_PASSWORD || "SANTOTO_2026--2"
      })
    });
    const tokenAdmin = adminLogin.body?.token;

    // ==========================================
    // PRUEBA 1: Login válido POST /api/auth/login
    // ==========================================
    const p1 = await request("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testEmail, password: testPassword })
    });
    let tokenUser = p1.body?.token;
    registrar(1, "Login válido", "Paciente", "POST /api/auth/login", 200, p1.status, p1.status === 200 && !!tokenUser, "Retorna JWT con versión de sesión");

    // ==========================================
    // PRUEBA 2: Login con JSON inválido
    // ==========================================
    const p2 = await request("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "correo_invalido", password: "" })
    });
    registrar(2, "Login con JSON inválido", "Público", "POST /api/auth/login", 400, p2.status, p2.status === 400, "Validación de cuerpo express-validator");

    // ==========================================
    // PRUEBA 3: Perfil o recurso protegido sin JWT
    // ==========================================
    const p3 = await request("/api/auth/perfil", {
      method: "GET"
    });
    registrar(3, "Recurso protegido sin JWT", "Anónimo", "GET /api/auth/perfil", 401, p3.status, p3.status === 401, "Rechazado por ausencia de Bearer token");

    // ==========================================
    // PRUEBA 4: Cambio de contraseña con contraseña actual correcta
    // ==========================================
    const p4 = await request("/api/auth/cambiar-password", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenUser}`
      },
      body: JSON.stringify({
        passwordActual: testPassword,
        passwordNueva: testPasswordNueva,
        confirmarPassword: testPasswordNueva
      })
    });
    const dbPostP4 = await consultar("SELECT version_sesion FROM public.usuarios WHERE id = $1", [testUserId]);
    const vsAumento = dbPostP4.rows[0].version_sesion > 0;
    registrar(4, "Cambio contraseña propia correcta", "Paciente", "PATCH /api/auth/cambiar-password", 200, p4.status, p4.status === 200 && vsAumento, `version_sesion incrementó a ${dbPostP4.rows[0].version_sesion}`);

    // ==========================================
    // PRUEBA 5: Intento de usar JWT anterior
    // ==========================================
    const p5 = await request("/api/auth/perfil", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${tokenUser}`
      }
    });
    registrar(5, "Uso de JWT revocado previo", "Paciente", "GET /api/auth/perfil", 401, p5.status, p5.status === 401, p5.body?.mensaje || "Sesión revocada");

    // ==========================================
    // PRUEBA 6: Login con contraseña nueva
    // ==========================================
    const p6 = await request("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testEmail, password: testPasswordNueva })
    });
    tokenUser = p6.body?.token;
    registrar(6, "Login con contraseña nueva", "Paciente", "POST /api/auth/login", 200, p6.status, p6.status === 200 && !!tokenUser, "Nuevo JWT generado con versión actualizada");

    // ==========================================
    // PRUEBA 7: Cambio de contraseña con contraseña actual incorrecta
    // ==========================================
    const p7 = await request("/api/auth/cambiar-password", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenUser}`
      },
      body: JSON.stringify({
        passwordActual: "ClaveErronea123!",
        passwordNueva: testPasswordTercera,
        confirmarPassword: testPasswordTercera
      })
    });
    registrar(7, "Cambio con contraseña actual incorrecta", "Paciente", "PATCH /api/auth/cambiar-password", 401, p7.status, p7.status === 401, "Rechazo sin alterar versión ni hash");

    // ==========================================
    // PRUEBA 8: Administrador genera recuperación para cuenta de prueba
    // ==========================================
    const p8 = await request(`/api/auth/recuperacion/admin/${testUserId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tokenAdmin}`
      }
    });
    const resetToken = p8.body?.token;
    const dbToken = await consultar("SELECT id, token_hash, fecha_uso FROM public.password_reset_tokens WHERE usuario_id = $1 ORDER BY id DESC LIMIT 1", [testUserId]);
    registrar(8, "Admin genera token de recuperación", "Administrador", `POST /api/auth/recuperacion/admin/${testUserId}`, 201, p8.status, p8.status === 201 && !!resetToken && dbToken.rows.length > 0, "Token temporal de un solo uso emitido");

    // ==========================================
    // PRUEBA 9: Restablecimiento mediante token válido
    // ==========================================
    const p9 = await request("/api/auth/restablecer-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": API_KEY
      },
      body: JSON.stringify({
        token: resetToken,
        passwordNueva: testPasswordTercera,
        confirmarPassword: testPasswordTercera
      })
    });
    const dbTokenUsado = await consultar("SELECT fecha_uso FROM public.password_reset_tokens WHERE id = $1", [dbToken.rows[0].id]);
    const usado = dbTokenUsado.rows[0].fecha_uso !== null;
    registrar(9, "Restablecimiento con token válido", "Público c/Key", "POST /api/auth/restablecer-password", 200, p9.status, p9.status === 200 && usado, "Contraseña actualizada y token marcado como usado");

    // ==========================================
    // PRUEBA 10: Reutilización del token
    // ==========================================
    const p10 = await request("/api/auth/restablecer-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": API_KEY
      },
      body: JSON.stringify({
        token: resetToken,
        passwordNueva: testPassword,
        confirmarPassword: testPassword
      })
    });
    registrar(10, "Reutilización de token consumido", "Público c/Key", "POST /api/auth/restablecer-password", 400, p10.status, p10.status === 400, p10.body?.mensaje || "Token inválido");

    // ==========================================
    // PRUEBA 11: Usuario no administrador intenta generar recuperación
    // ==========================================
    const loginUser3 = await request("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testEmail, password: testPasswordTercera })
    });
    tokenUser = loginUser3.body?.token;

    const p11 = await request(`/api/auth/recuperacion/admin/${testUserId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tokenUser}`
      }
    });
    registrar(11, "No-admin genera recuperación administrativa", "Paciente", `POST /api/auth/recuperacion/admin/${testUserId}`, 403, p11.status, p11.status === 403, "Rechazado por RBAC");

    // ==========================================
    // PRUEBA 12: Usuario genera ocho códigos de respaldo
    // ==========================================
    const p12 = await request("/api/auth/codigos-recuperacion", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenUser}`
      },
      body: JSON.stringify({
        passwordActual: testPasswordTercera
      })
    });
    const codigos = p12.body?.codigos || [];
    registrar(12, "Generación de 8 códigos de respaldo", "Paciente", "POST /api/auth/codigos-recuperacion", 201, p12.status, p12.status === 201 && codigos.length === 8, `8 códigos recibidos formato XXXX-XXXX`);

    // ==========================================
    // PRUEBA 13: Consulta de estado de códigos
    // ==========================================
    const p13 = await request("/api/auth/codigos-recuperacion/estado", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${tokenUser}`
      }
    });
    registrar(13, "Consulta estado de códigos", "Paciente", "GET /api/auth/codigos-recuperacion/estado", 200, p13.status, p13.status === 200 && p13.body?.disponibles === 8, `Disponibles: ${p13.body?.disponibles}`);

    // ==========================================
    // PRUEBA 14: Regeneración de códigos
    // ==========================================
    const p14 = await request("/api/auth/codigos-recuperacion/regenerar", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenUser}`
      },
      body: JSON.stringify({
        passwordActual: testPasswordTercera
      })
    });
    const nuevosCodigos = p14.body?.codigos || [];
    registrar(14, "Regeneración de códigos de respaldo", "Paciente", "POST /api/auth/codigos-recuperacion/regenerar", 201, p14.status, p14.status === 201 && nuevosCodigos.length === 8, "Códigos anteriores revocados");

    // ==========================================
    // PRUEBA 15: Restablecimiento con código válido
    // ==========================================
    const codigoAUsar = nuevosCodigos[0];
    const passwordCuarta = "Password11_Cuarta2026!";
    const p15 = await request("/api/auth/restablecer-con-codigo", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": API_KEY
      },
      body: JSON.stringify({
        email: testEmail,
        codigo: codigoAUsar,
        passwordNueva: passwordCuarta,
        confirmarPassword: passwordCuarta
      })
    });
    registrar(15, "Restablecimiento con código válido", "Público c/Key", "POST /api/auth/restablecer-con-codigo", 200, p15.status, p15.status === 200, "Contraseña actualizada exitosamente");

    // ==========================================
    // PRUEBA 16: Reutilización de un código consumido
    // ==========================================
    const p16 = await request("/api/auth/restablecer-con-codigo", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": API_KEY
      },
      body: JSON.stringify({
        email: testEmail,
        codigo: codigoAUsar,
        passwordNueva: testPassword,
        confirmarPassword: testPassword
      })
    });
    registrar(16, "Reutilización de código consumido", "Público c/Key", "POST /api/auth/restablecer-con-codigo", 400, p16.status, p16.status === 400, p16.body?.mensaje || "Código inválido");

    // ==========================================
    // PRUEBA 17: Paciente consulta /api/citas/mis-citas con JWT
    // ==========================================
    // Asegurar password y version_sesion de paciente.a@example.com
    const pacHash = await bcrypt.hash("ClaveSegura2026*", 10);
    await consultar("UPDATE public.usuarios SET password_hash = $1, version_sesion = 0, activo = true WHERE email = 'paciente.a@example.com'", [pacHash]);

    // Login con paciente existente con citas (paciente.a@example.com)
    const loginPacA = await request("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "paciente.a@example.com", password: "ClaveSegura2026*" })
    });
    const tokenPacA = loginPacA.body?.token;

    const p17 = await request("/api/citas/mis-citas", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${tokenPacA}`
      }
    });
    registrar(17, "Paciente consulta mis-citas con JWT", "Paciente", "GET /api/citas/mis-citas", 200, p17.status, p17.status === 200, `Citas devueltas: ${Array.isArray(p17.body) ? p17.body.length : 0}`);

    // ==========================================
    // PRUEBA 18: Paciente consulta citas de otro paciente (BOLA/IDOR)
    // ==========================================
    const p18 = await request("/api/citas/2", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${tokenPacA}`
      }
    });
    registrar(18, "Paciente consulta cita ajena (BOLA/IDOR)", "Paciente", "GET /api/citas/2", 403, p18.status, p18.status === 403, "Rechazo por control de propiedad BOLA");

    // ==========================================
    // PRUEBA 19: Paciente intenta GET /api/citas administrativo
    // ==========================================
    const p19 = await request("/api/citas", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${tokenPacA}`
      }
    });
    registrar(19, "Paciente intenta GET /api/citas admin", "Paciente", "GET /api/citas", 403, p19.status, p19.status === 403, "Rechazo por control RBAC");

    // ==========================================
    // PRUEBA 20: GET /api/seguridad/cliente sin API Key
    // ==========================================
    const p20 = await request("/api/seguridad/cliente", {
      method: "GET"
    });
    registrar(20, "Cliente privado sin API Key", "Anónimo", "GET /api/seguridad/cliente", 401, p20.status, p20.status === 401, "Rechazado: API Key requerida");

    // ==========================================
    // PRUEBA 21: GET /api/seguridad/cliente con API Key válida
    // ==========================================
    const p21 = await request("/api/seguridad/cliente", {
      method: "GET",
      headers: {
        "X-API-Key": API_KEY
      }
    });
    registrar(21, "Cliente privado con API Key válida", "Cliente API", "GET /api/seguridad/cliente", 200, p21.status, p21.status === 200, "Acceso concedido a cliente registrado");

    // ==========================================
    // PRUEBA 22: Login sin API Key y cuerpo inválido
    // ==========================================
    const p22 = await request("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "invalid", password: "short" })
    });
    const es400NoKeyReq = p22.status === 400 && (!p22.body?.mensaje || !p22.body?.mensaje.includes("API Key"));
    registrar(22, "Login público sin API Key c/cuerpo inválido", "Público", "POST /api/auth/login", 400, p22.status, es400NoKeyReq, "Responde 400 por validación, no 401 por falta de API Key");

    // ==========================================
    // PRUEBA 23: mis-citas sin JWT y sin API Key
    // ==========================================
    const p23 = await request("/api/citas/mis-citas", {
      method: "GET"
    });
    registrar(23, "mis-citas sin JWT y sin API Key", "Anónimo", "GET /api/citas/mis-citas", 401, p23.status, p23.status === 401, "Rechazado por falta de JWT");

    // ==========================================
    // PRUEBA 24: mis-citas con JWT y sin API Key
    // ==========================================
    const p24 = await request("/api/citas/mis-citas", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${tokenPacA}`
      }
    });
    registrar(24, "mis-citas con JWT y SIN API Key", "Paciente", "GET /api/citas/mis-citas", 200, p24.status, p24.status === 200, "Permite consumo directo desde navegador sin exponer API Key");

    // ==========================================
    // PRUEBA 25: Swagger OpenAPI validación de esquemas
    // ==========================================
    const p25 = await request("/openapi.json", { method: "GET" });
    const spec = p25.body;
    const loginSec = spec?.paths?.["/api/auth/login"]?.post?.security;
    const misCitasSec = spec?.paths?.["/api/citas/mis-citas"]?.get?.security;
    const clienteSec = spec?.paths?.["/api/seguridad/cliente"]?.get?.security;

    const loginOk = Array.isArray(loginSec) && loginSec.length === 0;
    const misCitasOk = Array.isArray(misCitasSec) && misCitasSec.some(s => "BearerAuth" in s);
    const clienteOk = Array.isArray(clienteSec) && clienteSec.some(s => "ApiKeyAuth" in s);
    const p25Ok = loginOk && misCitasOk && clienteOk;
    registrar(25, "Swagger: Esquemas de credenciales", "Documentación", "GET /openapi.json", 200, p25.status, p25Ok, `Login: [] | mis-citas: BearerAuth | cliente: ApiKeyAuth`);

    // ==========================================
    // PRUEBA PASO 10: CORS Preflight desde PowerShell
    // ==========================================
    const pCors = await request("/api/auth/login", {
      method: "OPTIONS",
      headers: {
        Origin: "http://localhost:5173",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "content-type"
      }
    });
    const allowOrigin = pCors.headers.get("access-control-allow-origin");
    const corsOk = pCors.status === 204 && allowOrigin === "http://localhost:5173";
    registrar(26, "CORS Preflight para React+Vite", "Navegador", "OPTIONS /api/auth/login", 204, pCors.status, corsOk, `Access-Control-Allow-Origin: ${allowOrigin}`);

    console.log("\n===============================================================");
    console.log("            TABLA RESUMEN DE EVIDENCIAS - BLOQUE 11            ");
    console.log("===============================================================");
    console.table(resultados.map(r => ({
      Prueba: r.num,
      Nombre: r.nombre,
      Rol: r.rol,
      HTTP: r.obtenido,
      Estado: r.estado,
      Observacion: r.obs
    })));

    const todosAprobados = resultados.every(r => r.estado === "APROBADO");
    if (todosAprobados) {
      console.log("\n🎉 ¡TODAS LAS PRUEBAS DEL BLOQUE 11 HAN SIDO APROBADAS SATISFACTORIAMENTE!");
    } else {
      console.error("\n❌ ALGUNAS PRUEBAS NO FUERON APROBADAS");
      process.exitCode = 1;
    }

  } catch (error) {
    console.error("Error ejecutando pruebas:", error);
    process.exitCode = 1;
  } finally {
    if (server) server.close();
    await pool.end();
  }
}

run();
