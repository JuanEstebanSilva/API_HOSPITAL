import { notificarSesionInvalida } from "./sesion-expirada";
const API_URL = import.meta.env.VITE_API_URL;

export async function consultarRecurso(ruta, token, signal) {
  let respuesta;
  try {
    respuesta = await fetch(`${API_URL}${ruta}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      signal,
    });
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new Error("No se pudo conectar con la API Hospital", { cause: error });
  }
  const contenido = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) {
    notificarSesionInvalida(respuesta, null, token);
    throw new Error(contenido.mensaje || `Error HTTP ${respuesta.status}`);
  }
  if (!Array.isArray(contenido)) {
    throw new Error("El servidor no devolvió una lista de registros");
  }
  return contenido;
}
