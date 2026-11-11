import { notificarSesionInvalida } from "./sesion-expirada";
const API_URL = import.meta.env.VITE_API_URL;

export async function solicitudSegura(ruta, { token, method = "GET", body, signal } = {}) {
  let respuesta;

  try {
    respuesta = await fetch(`${API_URL}${ruta}`, {
      method,
      headers: {
        Accept: "application/json",
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal,
      cache: "no-store",
    });
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new Error("No fue posible conectar con la API Hospital.", { cause: error });
  }

  const datos = await respuesta.json().catch(() => ({}));

  if (!respuesta.ok) {

    notificarSesionInvalida(respuesta, null, token);
    const detalle = Array.isArray(datos.errores)
      ? datos.errores.map((item) => item.msg).filter(Boolean).join(". ")
      : "";

    const error = new Error(
      detalle || datos.mensaje || `Error HTTP ${respuesta.status}`
    );
    error.status = respuesta.status;
    throw error;
  }

  return datos;
}

export function restablecerConCodigo(datos) {
  return solicitudSegura("/api/auth/restablecer-con-codigo", {
    method: "POST",
    body: datos,
  });
}

// LAB 12.4.4 - Recuperación administrativa
export function generarTokenRecuperacionAdmin(usuarioId, token) {
  return solicitudSegura(`/api/auth/recuperacion/admin/${encodeURIComponent(usuarioId)}`, {
    token, method: "POST",
  });
}

export function restablecerConTokenAdmin(datos) {
  return solicitudSegura("/api/auth/restablecer-password", {
    method: "POST", body: datos,
  });
}

// Solo el administrador puede consultar el directorio mínimo de cuentas.
export function buscarUsuariosRecuperacion(texto, token, signal) {
  return solicitudSegura(`/api/usuarios/busqueda-recuperacion?q=${encodeURIComponent(texto)}`, {
    token,
    signal,
  });
}
