import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { solicitudSegura } from "../services/seguridad.service";

export default function CodigosRecuperacion({ volver }) {
  const { token, logout } = useAuth();
  const [disponibles, setDisponibles] = useState(null);
  const [passwordActual, setPasswordActual] = useState("");
  const [codigos, setCodigos] = useState([]);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    solicitudSegura("/api/auth/codigos-recuperacion/estado", { token, signal: controller.signal })
      .then((datos) => setDisponibles(datos.disponibles))
      .catch((e) => { if (e.name !== "AbortError") setError(e.message); });
    return () => controller.abort();
  }, [token]);

  async function generar(evento) {
    evento.preventDefault();
    setError("");
    setCargando(true);
    try {
      const ruta = disponibles > 0 ? "/api/auth/codigos-recuperacion/regenerar" : "/api/auth/codigos-recuperacion";
      const datos = await solicitudSegura(ruta, { token, method: "POST", body: { passwordActual } });
      setCodigos(datos.codigos);
      setDisponibles(datos.codigos.length);
      setPasswordActual("");
    } catch (e) {
      if (e.status === 401) { logout(); return; }
      setError(e.message);
    } finally { setCargando(false); }
  }

  function descargar() {
    const texto = ["API Hospital — códigos de recuperación", "Guárdelos fuera del dispositivo compartido.", "", ...codigos].join("\n");
    const blob = new Blob([texto], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = "codigos-recuperacion-hospital.txt";
    enlace.click();
    URL.revokeObjectURL(url);
  }

  return <section className="hospital-card p-4 mt-4">
    <h2 className="h4 fw-bold">Seguridad de mi cuenta</h2>
    <p className="text-secondary">Los códigos permiten recuperar el acceso si olvidas la contraseña. Cada código se utiliza una sola vez.</p>
    <p><strong>Códigos disponibles:</strong> {disponibles === null ? "Consultando…" : disponibles}</p>
    {codigos.length > 0 ? <div className="alert alert-warning">
      <strong>Guarda estos ocho códigos ahora.</strong> No volverán a mostrarse. No los compartas ni los guardes en un equipo público.
      <div className="row row-cols-1 row-cols-sm-2 g-2 my-3">{codigos.map((codigo) => <div className="col" key={codigo}><code className="d-block p-2 bg-white border rounded text-dark">{codigo}</code></div>)}</div>
      <div className="d-flex flex-wrap gap-2"><button type="button" className="btn btn-outline-dark" onClick={descargar}>Guardar archivo .txt</button><button type="button" className="btn btn-success" onClick={() => setCodigos([])}>Ya los guardé — ocultar</button></div>
    </div> : <form onSubmit={generar} className="d-grid gap-3" style={{ maxWidth: 540 }}>
      {disponibles > 0 && <div className="alert alert-warning mb-0">Regenerar invalidará todos los códigos anteriores, incluso los que no hayas utilizado.</div>}
      <div><label htmlFor="passwordActualCodigos" className="form-label">Confirma tu contraseña actual</label><input id="passwordActualCodigos" type="password" autoComplete="current-password" className="form-control" required value={passwordActual} onChange={(e) => setPasswordActual(e.target.value)} /></div>
      {error && <div className="alert alert-danger" role="alert">{error}</div>}
      <button className="btn btn-success" disabled={cargando || disponibles === null}>{cargando ? "Procesando…" : disponibles > 0 ? "Regenerar ocho códigos" : "Generar ocho códigos"}</button>
    </form>}
    <button type="button" className="btn btn-outline-secondary mt-3" onClick={volver}>Volver al panel</button>
  </section>;
}
