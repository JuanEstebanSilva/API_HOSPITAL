import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function LoginPage() {
  const { autenticado, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [avisoSesion] = useState(() => {
    const aviso = sessionStorage.getItem("hospital_aviso_sesion");
    sessionStorage.removeItem("hospital_aviso_sesion");
    return aviso;
  });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  if (autenticado) return <Navigate to="/dashboard" replace />;

  async function manejarLogin(evento) {
    evento.preventDefault();
    setError("");
    setCargando(true);
    try {
      await login(email.trim(), password);
      setPassword("");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "No fue posible iniciar sesión");
    } finally {
      setCargando(false);
    }
  }

  return (
    <main className="pantalla-login d-flex align-items-center justify-content-center p-3">
      <section className="card border-0 shadow-lg tarjeta-login w-100">
        <div className="card-body p-4 p-md-5">
          <div className="marca-hospital mb-4">H+</div>
          <h1 className="h3 fw-bold mb-2">API Hospital</h1>
          <p className="text-secondary mb-4">Sistema de gestión hospitalaria</p>
          {avisoSesion && <div className="alert alert-warning" role="status">{avisoSesion}</div>}
          {location.state?.aviso && <div className="alert alert-success" role="status">{location.state.aviso}</div>}
          <form onSubmit={manejarLogin}>
            <div className="mb-3">
              <label className="form-label fw-semibold" htmlFor="email">Correo electrónico</label>
              <input className="form-control" id="email" type="email" autoComplete="username"
                value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="mb-3">
              <label className="form-label fw-semibold" htmlFor="password">Contraseña</label>
              <input className="form-control" id="password" type="password" autoComplete="current-password"
                value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            {error && <div className="alert alert-danger" role="alert">{error}</div>}
            <button className="btn btn-hospital w-100" type="submit" disabled={cargando}>
              {cargando ? "Validando..." : "Iniciar sesión"}
            </button>
          </form>
          <div className="text-center mt-3"><Link to="/recuperar-password">¿Olvidaste tu contraseña?</Link></div>
          <div className="text-center mt-2"><Link to="/restablecer-token">Tengo un token de recuperación administrativa</Link></div>
          <p className="text-center text-secondary small mt-4 mb-0">LAB 12.2 · React + Bootstrap + JWT</p>
        </div>
      </section>
    </main>
  );
}
