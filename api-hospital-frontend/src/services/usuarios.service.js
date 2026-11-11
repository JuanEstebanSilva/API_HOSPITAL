import { notificarSesionInvalida } from "./sesion-expirada";
import { API_URL } from "./api";

export async function listarUsuarios(token, filtros = {}) {
  const params = new URLSearchParams();
  for (const campo of ["q", "rol", "activo", "pagina"]) {
    if (filtros[campo] !== undefined && filtros[campo] !== "") params.set(campo, String(filtros[campo]));
  }
  let respuesta;
  try {
    respuesta = await fetch(`${API_URL}/api/usuarios?${params}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      cache: "no-store",
    });
  } catch (error) {
    throw new Error("No fue posible conectar con la API Hospital", { cause: error });
  }
  const datos = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) {
    notificarSesionInvalida(respuesta, null, token);
    const error = new Error(datos.mensaje || `Error HTTP ${respuesta.status}`);
    error.status = respuesta.status;
    throw error;
  }
  return datos;
}

async function modificarUsuario(token, ruta, method, datos) {
  let respuesta;
  try {
    respuesta = await fetch(`${API_URL}/api/usuarios${ruta}`, {
      method, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(datos), cache: "no-store",
    });
  } catch (error) { throw new Error("No fue posible conectar con la API Hospital", { cause: error }); }
  const cuerpo = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) {
    notificarSesionInvalida(respuesta, null, token);
    const detalle = Array.isArray(cuerpo.errores) ? cuerpo.errores.map(e => e.msg).join(". ") : "";
    const error = new Error(detalle || cuerpo.mensaje || `Error HTTP ${respuesta.status}`);
    error.status = respuesta.status;
    throw error;
  }
  return cuerpo;
}
export const crearUsuario = (token, datos) => modificarUsuario(token, "", "POST", datos);
export const editarUsuario = (token, id, datos) => modificarUsuario(token, `/${id}`, "PUT", datos);
export const cambiarEstadoUsuario = (token, id, activo) => modificarUsuario(token, `/${id}/estado`, "PATCH", { activo });


// LAB 12.6.2.1: identidades de cuentas ya vinculadas a fichas médicas.
export async function listarCuentasVinculadasMedicos(token) {
  let respuesta;
  try {
    respuesta = await fetch(`${API_URL}/api/usuarios/cuentas-vinculadas-medicos`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      cache: "no-store",
    });
  } catch (error) {
    throw new Error("No fue posible consultar las cuentas vinculadas.", { cause: error });
  }
  const datos = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) {
    notificarSesionInvalida(respuesta, null, token);
    const error = new Error(datos.mensaje || `Error HTTP ${respuesta.status}`);
    error.status = respuesta.status;
    throw error;
  }
  if (!Array.isArray(datos.cuentas)) throw new Error("Respuesta de cuentas vinculadas inválida.");
  return datos.cuentas;
}

// LAB 12.6.3.1: datos no sensibles de cuentas ya asociadas a pacientes.
export async function listarCuentasVinculadasPacientes(token) {
  let respuesta;
  try {
    respuesta = await fetch(`${API_URL}/api/usuarios/cuentas-vinculadas-pacientes`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      cache: "no-store",
    });
  } catch (error) {
    throw new Error("No fue posible consultar las cuentas vinculadas a pacientes.", { cause: error });
  }
  const datos = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) {
    notificarSesionInvalida(respuesta, null, token);
    const error = new Error(datos.mensaje || `Error HTTP ${respuesta.status}`);
    error.status = respuesta.status;
    throw error;
  }
  if (!Array.isArray(datos.cuentas)) throw new Error("Respuesta de cuentas vinculadas inválida.");
  return datos.cuentas;
}
