import { notificarSesionInvalida } from "./sesion-expirada";
import { API_URL } from "./api";

async function solicitar(ruta, token, metodo = "GET", cuerpo) {
  let respuesta;
  try {
    respuesta = await fetch(`${API_URL}${ruta}`, {
      method: metodo,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        ...(cuerpo === undefined ? {} : { "Content-Type": "application/json" }),
      },
      ...(cuerpo === undefined ? {} : { body: JSON.stringify(cuerpo) }),
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

export const listarCitas = token => solicitar("/api/citas", token);
export const listarMisCitas = token => solicitar("/api/citas/mis-citas", token);
export const crearCita = (token, datos) => solicitar("/api/citas", token, "POST", datos);
export const actualizarCita = (token, id, datos) => solicitar(`/api/citas/${id}`, token, "PUT", datos);
export const cambiarEstadoCita = (token, id, estado) => solicitar(`/api/citas/${id}/estado`, token, "PATCH", { estado });

export const consultarMiContexto = token => solicitar("/api/citas/mi-contexto", token);
export const solicitarCitaPropia = (token, datos) => solicitar("/api/citas/mis-solicitudes", token, "POST", datos);
export const cancelarMiCita = (token, id) => solicitar(`/api/citas/${id}/cancelar`, token, "PATCH");
export const confirmarMiCita = (token, id) => solicitar(`/api/citas/${id}/confirmar`, token, "PATCH");
export const atenderMiCita = (token, id) => solicitar(`/api/citas/${id}/atender`, token, "PATCH");
