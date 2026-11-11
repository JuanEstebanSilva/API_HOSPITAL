// Este servicio encapsula la solicitud HTTP. Así evitamos escribir fetch() directamente en cada componente.

export const API_URL = import.meta.env.VITE_API_URL;

export async function iniciarSesion(email, password) {
  let respuesta;

  try {
    respuesta = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });
  } catch {
    throw new Error(
      "No fue posible conectar con la API Hospital."
    );
  }

  const datos = await respuesta.json().catch(() => ({}));

  if (respuesta.status === 429) {
    const espera = Number(respuesta.headers.get("Retry-After"));
    const minutos = Number.isFinite(espera) && espera > 0
      ? ` Espera aproximadamente ${Math.ceil(espera / 60)} minuto(s).`
      : " Espera unos minutos antes de volver a intentar.";
    const error = new Error(`Se alcanzó el límite de intentos de acceso.${minutos}`);
    error.status = 429;
    throw error;
  }

  if (respuesta.status === 503) {
    const error = new Error(datos.mensaje || "No hay conexión con la base de datos. Revisa el backend y Supabase.");
    error.status = 503;
    throw error;
  }

  if (!respuesta.ok) {
    const errores = Array.isArray(datos.errores)
      ? datos.errores.map((error) => error.msg).join(". ")
      : "";

    throw new Error(
      datos.mensaje ||
      errores ||
      `Error HTTP ${respuesta.status}`
    );
  }

  if (!datos.token || !datos.usuario) {
    throw new Error(
      "La respuesta de autenticación está incompleta."
    );
  }

  return datos;
}
