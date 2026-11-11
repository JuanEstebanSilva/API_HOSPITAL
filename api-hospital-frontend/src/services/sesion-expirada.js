// Notificación transversal sin acoplar los servicios HTTP a React.
// El proveedor de autenticación valida que el token sea el de la sesión vigente.
export const EVENTO_SESION_INVALIDA = "hospital:sesion-invalida";

export function notificarSesionInvalida(respuesta, datos, token) {
  if (respuesta.status !== 401 || !token) return;
  window.dispatchEvent(new CustomEvent(EVENTO_SESION_INVALIDA, {
    detail: { token, motivo: datos?.mensaje || "Sesión no válida" },
  }));
}
