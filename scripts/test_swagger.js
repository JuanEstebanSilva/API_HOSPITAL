require("dotenv").config();
const { app, iniciarServidor } = require("../src/app");

const PORT = process.env.PORT || 3000;
const BASE_URL = `http://127.0.0.1:${PORT}`;

let server;

async function request(path) {
  const res = await fetch(`${BASE_URL}${path}`);
  const contentType = res.headers.get("content-type") || "";
  let body = null;
  if (contentType.includes("application/json")) {
    body = await res.json();
  } else {
    body = await res.text();
  }
  return { status: res.status, headers: res.headers, body };
}

async function run() {
  console.log("===============================================================");
  console.log("  VERIFICACIÓN DE SWAGGER UI Y ESPECIFICACIÓN OPENAPI 3.0     ");
  console.log("===============================================================");

  server = await iniciarServidor();

  try {
    // 1. Verificar openapi.json
    console.log("\n1. Consultando GET /openapi.json...");
    const resJson = await request("/openapi.json");
    if (resJson.status !== 200 || !resJson.body) {
      throw new Error(`Fallo al consultar /openapi.json: status ${resJson.status}`);
    }
    const spec = resJson.body;
    console.log(`✅ OpenAPI Spec 3.0 disponible (versión: ${spec.openapi})`);
    console.log(`   - Título: "${spec.info?.title}"`);
    console.log(`   - Versión API: ${spec.info?.version}`);

    const paths = Object.keys(spec.paths || {});
    console.log(`✅ Total de rutas documentadas: ${paths.length}`);
    if (paths.length < 35) {
      throw new Error(`Se esperaban al menos 35 rutas documentadas, encontradas: ${paths.length}`);
    }

    // Contar operaciones
    let totalOperaciones = 0;
    const metodos = ["get", "post", "put", "patch", "delete"];
    for (const p of paths) {
      for (const m of metodos) {
        if (spec.paths[p][m]) totalOperaciones++;
      }
    }
    console.log(`✅ Total de operaciones HTTP documentadas: ${totalOperaciones}`);

    // Esquemas de seguridad
    const schemes = spec.components?.securitySchemes || {};
    if (!schemes.BearerAuth || !schemes.ApiKeyAuth) {
      throw new Error("Faltan esquemas de seguridad BearerAuth o ApiKeyAuth en components");
    }
    console.log("✅ Esquemas de seguridad verificados: BearerAuth (JWT) y ApiKeyAuth (x-api-key)");

    // 2. Verificar Swagger UI HTML (/api-docs/)
    console.log("\n2. Consultando GET /api-docs/...");
    const resDocs = await request("/api-docs/");
    if (resDocs.status !== 200 || typeof resDocs.body !== "string") {
      throw new Error(`Fallo al consultar /api-docs/: status ${resDocs.status}`);
    }
    if (!resDocs.body.includes("swagger-ui") || !resDocs.body.includes("Swagger UI")) {
      throw new Error("La respuesta de /api-docs/ no contiene los componentes de Swagger UI");
    }
    console.log("✅ Interfaz visual Swagger UI renderizada correctamente (HTTP 200)");

    console.log("\n===============================================================");
    console.log("  🎉 ¡SWAGGER UI Y OPENAPI ESTÁN 100% OPERATIVOS Y COMPLETOS!  ");
    console.log("===============================================================");
  } catch (error) {
    console.error("❌ Error en prueba de Swagger:", error.message);
    process.exitCode = 1;
  } finally {
    if (server) await new Promise(r => server.close(r));
  }
}

run();
