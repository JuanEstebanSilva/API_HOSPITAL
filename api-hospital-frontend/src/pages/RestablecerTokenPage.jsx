import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { restablecerConTokenAdmin } from "../services/seguridad.service";

export default function RestablecerTokenPage() {
  const { autenticado } = useAuth();
  const navigate = useNavigate();
  const [token, setToken] = useState("");
  const [passwordNueva, setPasswordNueva] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  if (autenticado) return <Navigate to="/dashboard" replace />;

  async function enviar(e) {
    e.preventDefault(); setError("");
    if (!/^[a-fA-F0-9]{64}$/.test(token.trim())) { setError("El token debe contener 64 caracteres hexadecimales."); return; }
    if (passwordNueva.length < 12 || passwordNueva.length > 72 || !/[a-z]/.test(passwordNueva) || !/[A-Z]/.test(passwordNueva) || !/[0-9]/.test(passwordNueva)) {setError("Utiliza de 12 a 72 caracteres con mayúscula, minúscula y número.");return;}
    if (passwordNueva !== confirmarPassword) { setError("Las contraseñas no coinciden.");return; }
    setCargando(true);
    try {
      await restablecerConTokenAdmin({ token: token.trim(), passwordNueva, confirmarPassword });
      setToken("");setPasswordNueva("");setConfirmarPassword("");
      navigate("/login", { replace: true, state: { aviso: "Contraseña restablecida mediante recuperación administrativa. Inicia sesión nuevamente." } });
    } catch (err) {
      setError(err.status === 429 ? "Demasiados intentos. Intenta más tarde." : err.status === 400 ? "Token inválido, expirado, utilizado o datos incorrectos." : err.message || "No fue posible restablecer la contraseña.");
    } finally {setCargando(false);}
  }
  return <main className="pantalla-login d-flex align-items-center justify-content-center p-3"><section className="card border-0 shadow-lg tarjeta-login w-100"><div className="card-body p-4 p-md-5">
    <div className="marca-hospital mb-4">H+</div><h1 className="h3 fw-bold">Recuperación administrativa</h1><p className="text-secondary">Introduce el token temporal que te entregó el administrador tras verificar tu identidad.</p>
    <form onSubmit={enviar}>
      <label htmlFor="token-temporal" className="form-label fw-semibold">Token temporal</label><textarea id="token-temporal" className="form-control mb-3" rows="2" autoComplete="off" spellCheck="false" required value={token} onChange={e => setToken(e.target.value)} />
      <label htmlFor="password-nueva-admin" className="form-label fw-semibold">Nueva contraseña</label><input id="password-nueva-admin" type="password" className="form-control mb-3" autoComplete="new-password" minLength={12} maxLength={72} required value={passwordNueva} onChange={e => setPasswordNueva(e.target.value)} />
      <label htmlFor="confirmar-admin" className="form-label fw-semibold">Confirmar contraseña</label><input id="confirmar-admin" type="password" className="form-control mb-3" autoComplete="new-password" minLength={12} maxLength={72} required value={confirmarPassword} onChange={e => setConfirmarPassword(e.target.value)} />
      {error && <div className="alert alert-danger" role="alert">{error}</div>}
      <button type="submit" className="btn btn-hospital w-100" disabled={cargando}>{cargando ? "Restableciendo..." : "Restablecer contraseña"}</button>
    </form><div className="text-center mt-3"><Link to="/login">Volver al inicio de sesión</Link></div>
  </div></section></main>;
}
