import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { restablecerConCodigo } from "../services/seguridad.service";

export default function RecuperarPasswordPage() {
  const { autenticado } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [codigo, setCodigo] = useState("");
  const [passwordNueva, setPasswordNueva] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  if (autenticado) return <Navigate to="/dashboard" replace />;

  async function enviar(evento) {
    evento.preventDefault();
    setError("");
    if (passwordNueva !== confirmarPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (passwordNueva.length < 12 || !/[a-z]/.test(passwordNueva) ||
        !/[A-Z]/.test(passwordNueva) || !/[0-9]/.test(passwordNueva)) {
      setError("La contraseña debe tener 12 a 72 caracteres, mayúscula, minúscula y número.");
      return;
    }
    setCargando(true);
    try {
      await restablecerConCodigo({
        email: email.trim(),
        codigo: codigo.trim(),
        passwordNueva,
        confirmarPassword,
      });
      setCodigo("");
      setPasswordNueva("");
      setConfirmarPassword("");
      navigate("/login", {
        replace: true,
        state: { aviso: "Contraseña restablecida. Inicia sesión con tu nueva contraseña." },
      });
    } catch (err) {
      if (err.status === 429) {
        setError("Demasiados intentos. Espera antes de volver a intentarlo.");
      } else if (err.status === 400) {
        setError("No se pudo restablecer la contraseña. Revisa el código y los datos ingresados.");
      } else {
        setError(err.message || "No fue posible restablecer la contraseña.");
      }
    } finally {
      setCargando(false);
    }
  }

  return (
    <main className="pantalla-login d-flex align-items-center justify-content-center p-3">
      <section className="card border-0 shadow-lg tarjeta-login w-100">
        <div className="card-body p-4 p-md-5">
          <div className="marca-hospital mb-4">H+</div>
          <h1 className="h3 fw-bold mb-2">Recuperar contraseña</h1>
          <p className="text-secondary mb-4">Utiliza uno de los ocho códigos de respaldo que guardaste previamente. Cada código funciona una sola vez.</p>
          <form onSubmit={enviar}>
            <div className="mb-3">
              <label htmlFor="rec-email" className="form-label fw-semibold">Correo electrónico</label>
              <input id="rec-email" className="form-control" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="mb-3">
              <label htmlFor="rec-codigo" className="form-label fw-semibold">Código de recuperación</label>
              <input id="rec-codigo" className="form-control" type="text" autoComplete="off" required placeholder="XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX" value={codigo} onChange={(e) => setCodigo(e.target.value)} />
            </div>
            <div className="mb-3">
              <label htmlFor="rec-password" className="form-label fw-semibold">Nueva contraseña</label>
              <input id="rec-password" className="form-control" type="password" autoComplete="new-password" minLength={12} maxLength={72} required value={passwordNueva} onChange={(e) => setPasswordNueva(e.target.value)} />
              <div className="form-text">Entre 12 y 72 caracteres; incluye mayúscula, minúscula y número.</div>
            </div>
            <div className="mb-3">
              <label htmlFor="rec-confirmar" className="form-label fw-semibold">Confirmar contraseña</label>
              <input id="rec-confirmar" className="form-control" type="password" autoComplete="new-password" minLength={12} maxLength={72} required value={confirmarPassword} onChange={(e) => setConfirmarPassword(e.target.value)} />
            </div>
            {error && <div className="alert alert-danger" role="alert">{error}</div>}
            <button type="submit" className="btn btn-hospital w-100" disabled={cargando}>
              {cargando ? "Restableciendo..." : "Restablecer contraseña"}
            </button>
          </form>
          <div className="text-center mt-3"><Link to="/login">Volver al inicio de sesión</Link></div>
        </div>
      </section>
    </main>
  );
}
