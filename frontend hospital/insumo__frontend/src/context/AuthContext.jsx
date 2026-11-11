import { useCallback, useEffect, useMemo, useState } from "react";
import { AuthContext } from "./auth-context";
import { iniciarSesion } from "../services/api";
import { solicitudSegura } from "../services/seguridad.service";
import { EVENTO_SESION_INVALIDA } from "../services/sesion-expirada";

const CLAVE = "hospital_sesion_v1";
const CLAVE_AVISO = "hospital_aviso_sesion";

function expiracionJwt(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return Number.isFinite(payload.exp) ? payload.exp * 1000 : null;
  } catch { return null; }
}

function mensajeFinSesion(motivo) {
  return /expirad/i.test(motivo)
    ? "Tu sesión ha expirado por seguridad. Inicia sesión nuevamente."
    : "Tu sesión ya no es válida. Inicia sesión nuevamente.";
}

function leerSesion() {
  try {
    const valor = sessionStorage.getItem(CLAVE);
    if (!valor) return null;
    const sesion = JSON.parse(valor);
    if (typeof sesion?.token !== "string" || !sesion?.usuario) return null;
    return sesion;
  } catch { return null; }
}

export function AuthProvider({ children }) {
  const [sesion, setSesion] = useState(leerSesion);
  const [verificando, setVerificando] = useState(Boolean(leerSesion()));

  const logout = useCallback(() => {
    sessionStorage.removeItem(CLAVE);
    setSesion(null);
    setVerificando(false);
  }, []);

  const invalidarSesion = useCallback((motivo) => {
    sessionStorage.setItem(CLAVE_AVISO, mensajeFinSesion(motivo));
    logout();
  }, [logout]);

  // La expiración del JWT es absoluta, no un contador de inactividad.
  useEffect(() => {
    if (!sesion?.token) return;
    const tokenActual = sesion.token;
    const expira = expiracionJwt(tokenActual);
    if (expira && expira <= Date.now()) {
      // Ejecutar al siguiente ciclo para no modificar estado durante el montaje.
      const id = setTimeout(() => invalidarSesion("Token expirado"), 0);
      return () => clearTimeout(id);
    }
    const tiempo = expira ? setTimeout(() => invalidarSesion("Token expirado"), Math.min(expira - Date.now(), 2147483647)) : null;
    const manejarInvalida = (evento) => {
      if (evento.detail?.token === tokenActual) invalidarSesion(evento.detail.motivo);
    };
    window.addEventListener(EVENTO_SESION_INVALIDA, manejarInvalida);
    return () => {
      if (tiempo !== null) clearTimeout(tiempo);
      window.removeEventListener(EVENTO_SESION_INVALIDA, manejarInvalida);
    };
  }, [sesion?.token, invalidarSesion]);

  const login = useCallback(async (email, password) => {
    const datos = await iniciarSesion(email, password);
    const nueva = { usuario: datos.usuario, token: datos.token };
    sessionStorage.removeItem(CLAVE_AVISO);
    sessionStorage.setItem(CLAVE, JSON.stringify(nueva));
    setSesion(nueva);
    setVerificando(false);
    return datos.usuario;
  }, []);

  useEffect(() => {
    if (!sesion?.token) return;
    const controller = new AbortController();
    solicitudSegura("/api/auth/perfil", { token: sesion.token, signal: controller.signal })
      .then((datos) => {
        if (controller.signal.aborted) return;
        const usuario = datos.usuario;
        if (!usuario?.id || !usuario?.rol) { invalidarSesion("Sesión no válida"); return; }
        setSesion((actual) => {
          if (!actual || actual.token !== sesion.token) return actual;
          const nueva = { ...actual, usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol } };
          sessionStorage.setItem(CLAVE, JSON.stringify(nueva));
          return nueva;
        });
        setVerificando(false);
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        if (error.status === 401) invalidarSesion(error.message);
        else if (error.status === 403) invalidarSesion("Acceso no autorizado");
        else setVerificando(false);
      });
    return () => controller.abort();
  }, [sesion?.token, invalidarSesion]);

  const value = useMemo(() => ({
    usuario: sesion?.usuario ?? null,
    token: sesion?.token ?? null,
    autenticado: Boolean(sesion?.token),
    verificando,
    login,
    logout,
  }), [sesion, verificando, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
