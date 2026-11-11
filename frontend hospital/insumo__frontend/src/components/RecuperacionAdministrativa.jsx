import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { buscarUsuariosRecuperacion, generarTokenRecuperacionAdmin } from "../services/seguridad.service";

export default function RecuperacionAdministrativa({ volver }) {
  const { token, usuario } = useAuth();
  const [busqueda, setBusqueda] = useState("");
  const [usuarios, setUsuarios] = useState([]);
  const [seleccionado, setSeleccionado] = useState("");
  const [confirmado, setConfirmado] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const [buscando, setBuscando] = useState(false);

  useEffect(() => {
    if (busqueda.trim().length < 2 || !token || usuario?.rol !== "administrador") return;
    const controller = new AbortController();
    const temporizador = setTimeout(async () => {
      setBuscando(true);
      try {
        const datos = await buscarUsuariosRecuperacion(busqueda.trim(), token, controller.signal);
        if (!controller.signal.aborted) setUsuarios(datos.usuarios ?? []);
      } catch (err) {
        if (!controller.signal.aborted) setError(err.message || "Error al buscar usuarios.");
      } finally {
        if (!controller.signal.aborted) setBuscando(false);
      }
    }, 350);
    return () => { clearTimeout(temporizador); controller.abort(); };
  }, [busqueda, token, usuario?.rol]);

  async function generar(evento) {
    evento.preventDefault();
    if (!confirmado || !seleccionado) return;
    setError(""); setResultado(null); setCargando(true);
    try {
      const datos = await generarTokenRecuperacionAdmin(seleccionado, token);
      setResultado(datos);
      setConfirmado(false);
    } catch (err) {
      setError(err.message || "No fue posible generar el token.");
    } finally { setCargando(false); }
  }

  if (usuario?.rol !== "administrador") return <div className="alert alert-danger mt-4">Acceso restringido.</div>;
  return (
    <section className="hospital-card p-4 mt-4">
      <h2 className="h4 fw-bold">Recuperación administrativa</h2>
      <p className="text-secondary">Busca por nombre o correo, selecciona la cuenta y verifica la identidad del titular por un procedimiento institucional autorizado. El token vence a los 15 minutos y solo se usa una vez.</p>
      <form onSubmit={generar} className="col-lg-8">
        <label htmlFor="buscar-cuenta" className="form-label fw-semibold">Buscar usuario por nombre o correo</label>
        <input id="buscar-cuenta" className="form-control" autoComplete="off" value={busqueda} maxLength={100}
          placeholder="Ej.: paciente@hospital.com" onChange={(e) => { setBusqueda(e.target.value); setSeleccionado(""); setUsuarios([]); setResultado(null); setError(""); }} />
        <div className="form-text mb-3">Escribe al menos dos caracteres. Se mostrarán hasta 20 coincidencias activas.</div>
        {buscando && <p className="text-secondary small" role="status">Buscando usuarios...</p>}
        {busqueda.trim().length >= 2 && !buscando && usuarios.length === 0 && <p className="small text-secondary">Sin coincidencias para seleccionar.</p>}
        {usuarios.length > 0 && <>
          <label htmlFor="usuario-seleccionado" className="form-label fw-semibold">Selecciona el usuario</label>
          <select id="usuario-seleccionado" className="form-select mb-3" value={seleccionado} required
            onChange={(e) => { setSeleccionado(e.target.value); setResultado(null); }}>
            <option value="">Seleccionar cuenta...</option>
            {usuarios.map((u) => <option key={u.id} value={String(u.id)}>{u.nombre} — {u.email} ({u.rol})</option>)}
          </select>
        </>}
        <div className="form-check mb-3">
          <input id="identidad-confirmada" className="form-check-input" type="checkbox" checked={confirmado} onChange={(e) => setConfirmado(e.target.checked)} />
          <label htmlFor="identidad-confirmada" className="form-check-label">Confirmo que verifiqué la identidad del titular por un procedimiento autorizado.</label>
        </div>
        <button className="btn btn-hospital" type="submit" disabled={cargando || !confirmado || !seleccionado}>
          {cargando ? "Generando..." : "Generar token temporal"}
        </button>
      </form>
      {error && <div className="alert alert-danger mt-3" role="alert">{error}</div>}
      {resultado && <div className="alert alert-warning mt-4" role="status">
        <strong>Token temporal generado. Se mostrará solo durante esta operación.</strong>
        <p className="mt-2 mb-2">Caduca: {new Date(resultado.expiraEn).toLocaleString("es-CO")}</p>
        <label htmlFor="token-reset-admin" className="form-label">Token para entregar únicamente al titular verificado</label>
        <textarea id="token-reset-admin" className="form-control font-monospace" rows={2} readOnly value={resultado.token ?? ""} onFocus={(e) => e.target.select()} />
        <p className="small mt-2">No compartas el token en capturas, registros ni canales públicos.</p>
        <button className="btn btn-outline-secondary btn-sm" type="button" onClick={() => setResultado(null)}>Ocultar token</button>
      </div>}
      <button type="button" className="btn btn-outline-secondary mt-3 d-block" onClick={volver}>Volver al panel</button>
    </section>
  );
}
