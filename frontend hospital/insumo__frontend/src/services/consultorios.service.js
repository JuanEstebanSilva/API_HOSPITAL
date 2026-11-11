import { notificarSesionInvalida } from "./sesion-expirada";
import { API_URL } from "./api";

async function solicitarConsultorios(ruta, token, metodo = "GET", cuerpo) {
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

export const listarConsultorios = token => solicitarConsultorios("/api/consultorios", token);
export const crearConsultorio = (token, datos) => solicitarConsultorios("/api/consultorios", token, "POST", datos);
export const actualizarConsultorio = (token, id, datos) => solicitarConsultorios(`/api/consultorios/${id}`, token, "PUT", datos);
export const cambiarEstadoConsultorio = (token, id, activo) => solicitarConsultorios(`/api/consultorios/${id}`, token, "PATCH", { activo });
