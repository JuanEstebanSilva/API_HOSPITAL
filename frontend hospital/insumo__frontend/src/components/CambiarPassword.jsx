import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { solicitudSegura } from "../services/seguridad.service";
export default function CambiarPassword({ volver }) {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const [campos, setCampos] = useState({ passwordActual: "", passwordNueva: "", confirmarPassword: "" });
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  async function enviar(e) {
    e.preventDefault();
    setError("");
    if (campos.passwordNueva.length < 12) { setError("La contraseña nueva debe tener al menos 12 caracteres."); return; }
    if (campos.passwordNueva !== campos.confirmarPassword) { setError("Las contraseñas nuevas no coinciden."); return; }
    if (
      campos.passwordNueva.length > 72 ||
      !/[a-z]/.test(campos.passwordNueva) ||
      !/[A-Z]/.test(campos.passwordNueva) ||
      !/[0-9]/.test(campos.passwordNueva)
    ) {
      setError(
        "La nueva contraseña debe tener entre 12 y 72 caracteres e incluir mayúscula, minúscula y número."
      );
      return;
    }
    setCargando(true);
    try {
      await solicitudSegura("/api/auth/cambiar-password", { method: "PATCH", token, body: campos });
      setCampos({ passwordActual: "", passwordNueva: "", confirmarPassword: "" });
      logout();
      navigate("/login", { replace: true, state: { aviso: "Contraseña actualizada. Inicia sesión con la nueva contraseña." } });
    } catch (e) { setError(e.message); }
    finally { setCargando(false); }
  }
  return <section className="hospital-card p-4"><h2 className="h4">Cambiar mi contraseña</h2><p className="text-secondary">Por seguridad se cerrará la sesión al finalizar.</p>
    <form onSubmit={enviar} className="d-grid gap-3" style={{ maxWidth: 520 }}>
      {[["passwordActual", "Contraseña actual"], ["passwordNueva", "Nueva contraseña"], ["confirmarPassword", "Confirmar nueva contraseña"]].map(([clave, etiqueta]) => <div key={clave}><label htmlFor={clave} className="form-label">{etiqueta}</label><input id={clave} className="form-control" type="password" autoComplete={clave === "passwordActual" ? "current-password" : "new-password"} required value={campos[clave]} onChange={e => setCampos(c => ({ ...c, [clave]: e.target.value }))} /></div>)}
      {error && <div className="alert alert-danger" role="alert">{error}</div>}
      <div className="d-flex gap-2"><button className="btn btn-success" disabled={cargando}>{cargando ? "Guardando…" : "Actualizar contraseña"}</button><button type="button" className="btn btn-outline-secondary" onClick={volver}>Volver</button></div>
    </form>
  </section>;
}
