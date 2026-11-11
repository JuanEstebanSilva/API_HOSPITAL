import { notificarSesionInvalida } from "./sesion-expirada";
import { API_URL } from "./api";

async function solicitud(ruta, token, metodo = "GET", cuerpo) {
  let respuesta;
  try {
    respuesta = await fetch(`${API_URL}${ruta}`, {
      method: metodo,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        ...(cuerpo !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      ...(cuerpo !== undefined ? { body: JSON.stringify(cuerpo) } : {}),
      cache: "no-store",
    });
  } catch (error) {
    throw new Error("No fue posible conectar con la API Hospital.", { cause: error });
  }
  const datos = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) {
    notificarSesionInvalida(respuesta, null, token);
    const detalle = Array.isArray(datos.errores) ? datos.errores.map(e => e.msg).join(". ") : "";
    const error = new Error(detalle || datos.mensaje || `Error HTTP ${respuesta.status}`);
    error.status = respuesta.status;
    throw error;
  }
  return datos;
}

export const listarEspecialidades = (token) => solicitud("/api/especialidades", token);
export const crearEspecialidad = (token, datos) => solicitud("/api/especialidades", token, "POST", datos);
export const actualizarEspecialidad = (token, id, datos) => solicitud(`/api/especialidades/${id}`, token, "PUT", datos);
export const cambiarEstadoEspecialidad = (token, id, activa) => solicitud(`/api/especialidades/${id}`, token, "PATCH", { activa });
