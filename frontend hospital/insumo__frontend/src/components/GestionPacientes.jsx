import { useCallback, useEffect, useMemo, useState } from "react";
import { listarPacientes, crearPaciente, actualizarPaciente } from "../services/pacientes.service";
import { listarUsuarios, listarCuentasVinculadasPacientes } from "../services/usuarios.service";

const vacio = { nombre: "", documento: "", email: "", telefono: "", fechaNacimiento: "", usuarioId: "" };
const mismoId = (a, b) => a != null && b != null && String(a) === String(b);

export default function GestionPacientes({ token, rol, volver }) {
  const administrador = rol === "administrador";
  const [pacientes, setPacientes] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [form, setForm] = useState(null);
  const [editando, setEditando] = useState(null);
  const [busquedaCuenta, setBusquedaCuenta] = useState("");
  const [cuentas, setCuentas] = useState([]);
  const [cuentasVinculadas, setCuentasVinculadas] = useState([]);
  const [buscandoCuenta, setBuscandoCuenta] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const [resultado, vinculadas] = await Promise.all([
        listarPacientes(token),
        administrador ? listarCuentasVinculadasPacientes(token) : Promise.resolve([]),
      ]);
      if (!Array.isArray(resultado)) throw new Error("La API no devolvió una lista de pacientes.");
      setPacientes(resultado);
      setCuentasVinculadas(vinculadas);
      setError("");
    } catch (err) { setError(err.message); }
    finally { setCargando(false); }
  }, [token, administrador]);

  useEffect(() => { cargar(); }, [cargar]);

  const filtrados = useMemo(() => pacientes.filter(p =>
    `${p.nombre} ${p.documento} ${p.email}`.toLocaleLowerCase("es").includes(busqueda.trim().toLocaleLowerCase("es"))
  ), [pacientes, busqueda]);

  function nuevo() {
    setForm({ ...vacio }); setEditando(null); setCuentas([]); setBusquedaCuenta("");
    setError(""); setAviso("");
  }
  function editar(p) {
    setEditando(p.id);
    setForm({
      nombre: p.nombre ?? "", documento: p.documento ?? "", email: p.email ?? "",
      telefono: p.telefono ?? "", fechaNacimiento: p.fechaNacimiento ? String(p.fechaNacimiento).slice(0, 10) : "",
      usuarioId: p.usuarioId == null ? "" : String(p.usuarioId),
    });
    setCuentas([]); setBusquedaCuenta(""); setError(""); setAviso("");
  }
  function campo(nombre, valor) { setForm(actual => ({ ...actual, [nombre]: valor })); }

  async function buscarCuentas(ev) {
    ev.preventDefault();
    if (busquedaCuenta.trim().length < 2) { setError("Escribe al menos dos caracteres para buscar cuentas."); return; }
    setBuscandoCuenta(true); setError("");
    try {
      const resultado = await listarUsuarios(token, { q: busquedaCuenta.trim(), rol: "paciente", activo: "true", pagina: 1 });
      setCuentas(Array.isArray(resultado.usuarios) ? resultado.usuarios : []);
    } catch (err) { setError(err.message); }
    finally { setBuscandoCuenta(false); }
  }

  async function guardar(ev) {
    ev.preventDefault();
    if (!administrador || guardando || !form) return;
    setGuardando(true); setError(""); setAviso("");
    try {
      const datos = {
        nombre: form.nombre.trim(), documento: form.documento.trim(), email: form.email.trim(),
        telefono: form.telefono.trim(), fechaNacimiento: form.fechaNacimiento,
        usuarioId: form.usuarioId === "" ? null : Number(form.usuarioId),
      };
      if (editando == null) await crearPaciente(token, datos);
      else await actualizarPaciente(token, editando, datos);
      setForm(null); setEditando(null);
      await cargar();
      setAviso("Ficha del paciente guardada correctamente.");
    } catch (err) { setError(err.message); }
    finally { setGuardando(false); }
  }

  const cuentasElegibles = cuentas.filter(u =>
    !pacientes.some(p => mismoId(p.usuarioId, u.id) && !mismoId(p.id, editando))
  );
  const cuentaActual = cuentasVinculadas.find(u => mismoId(u.id, form?.usuarioId));
  const cuentaSeleccionada = Boolean(form?.usuarioId) && !cuentasElegibles.some(u => mismoId(u.id, form.usuarioId));

  return (
    <section className="hospital-card p-4 mt-4">
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
        <div><h2 className="h4 fw-bold mb-1">Directorio de pacientes</h2><p className="text-secondary mb-0">LAB 12.6.3 · Fichas personales y cuentas vinculadas</p></div>
        <div className="d-flex gap-2">
          {administrador && <button className="btn btn-success" type="button" onClick={nuevo}>Nuevo paciente</button>}
          <button className="btn btn-outline-success" type="button" disabled={cargando} onClick={cargar}>Actualizar</button>
        </div>
      </div>
      {error && <div className="alert alert-danger" role="alert">{error}</div>}
      {aviso && <div className="alert alert-success" role="status">{aviso}</div>}
      {form && administrador && (
        <form className="border rounded bg-light p-3 mb-4" onSubmit={guardar}>
          <h3 className="h5">{editando == null ? "Registrar paciente" : "Editar ficha del paciente"}</h3>
          <div className="row g-3">
            <div className="col-md-6"><label htmlFor="pac-nombre" className="form-label">Nombre completo</label><input id="pac-nombre" className="form-control" required minLength={3} maxLength={100} value={form.nombre} onChange={e => campo("nombre", e.target.value)} /></div>
            <div className="col-md-6"><label htmlFor="pac-documento" className="form-label">Documento (6 a 15 dígitos)</label><input id="pac-documento" className="form-control" required pattern="[0-9]{6,15}" value={form.documento} onChange={e => campo("documento", e.target.value)} /></div>
            <div className="col-md-6"><label htmlFor="pac-email" className="form-label">Correo electrónico</label><input id="pac-email" type="email" className="form-control" required value={form.email} onChange={e => campo("email", e.target.value)} /></div>
            <div className="col-md-6"><label htmlFor="pac-telefono" className="form-label">Teléfono (7 a 15 dígitos)</label><input id="pac-telefono" className="form-control" required pattern="[0-9]{7,15}" value={form.telefono} onChange={e => campo("telefono", e.target.value)} /></div>
            <div className="col-md-6"><label htmlFor="pac-nacimiento" className="form-label">Fecha de nacimiento</label><input id="pac-nacimiento" type="date" className="form-control" required value={form.fechaNacimiento} onChange={e => campo("fechaNacimiento", e.target.value)} /></div>
            <div className="col-md-6"><label htmlFor="pac-buscar-cuenta" className="form-label">Buscar cuenta con rol paciente (opcional)</label><div className="input-group"><input id="pac-buscar-cuenta" className="form-control" placeholder="Nombre o correo" value={busquedaCuenta} onChange={e => setBusquedaCuenta(e.target.value)} /><button type="button" className="btn btn-outline-primary" disabled={buscandoCuenta} onClick={buscarCuentas}>{buscandoCuenta ? "Buscando..." : "Buscar"}</button></div></div>
            <div className="col-12"><label htmlFor="pac-cuenta" className="form-label">Cuenta asociada</label><select id="pac-cuenta" className="form-select" value={form.usuarioId} onChange={e => campo("usuarioId", e.target.value)}><option value="">Sin cuenta asociada</option>{cuentaSeleccionada && <option value={form.usuarioId}>{cuentaActual ? `${cuentaActual.nombre} — ${cuentaActual.email} (${cuentaActual.rol}${cuentaActual.activo ? ", activa" : ", inactiva"})` : "Cuenta vinculada (datos no disponibles)"}</option>}{cuentasElegibles.map(u => <option key={u.id} value={String(u.id)}>{u.nombre} — {u.email}</option>)}</select>{cuentaActual && <div className="border rounded bg-white p-3 mt-2" aria-live="polite"><div className="d-flex align-items-center justify-content-between gap-2"><strong>{cuentaActual.nombre}</strong><span className={`badge ${cuentaActual.activo ? "bg-success" : "bg-secondary"}`}>{cuentaActual.activo ? "Activa" : "Inactiva"}</span></div><div className="text-secondary small">{cuentaActual.email} · Rol: {cuentaActual.rol}</div></div>}
              {form.usuarioId && !cuentaActual && <div className="text-secondary small mt-2">No fue posible consultar el detalle de la cuenta asociada. La vinculación se conserva.</div>}
              <small className="text-secondary">Primero crea la cuenta en «Usuarios y roles» y después vincúlala aquí. Este formulario no crea ni modifica contraseñas.</small></div>
          </div>
          <div className="d-flex gap-2 mt-3"><button className="btn btn-success" disabled={guardando} type="submit">{guardando ? "Guardando..." : "Guardar"}</button><button type="button" className="btn btn-outline-secondary" onClick={() => { setForm(null); setError(""); }}>Cancelar</button></div>
        </form>
      )}
      <div className="mb-3"><label htmlFor="pac-buscar" className="form-label">Buscar por nombre, documento o correo</label><input id="pac-buscar" className="form-control" placeholder="Buscar pacientes" value={busqueda} onChange={e => setBusqueda(e.target.value)} /></div>
      <div className="table-responsive"><table className="table table-hover align-middle"><thead><tr><th>Nombre</th><th>Documento</th><th>Correo</th><th>Teléfono</th><th>Nacimiento</th><th>Cuenta</th>{administrador && <th>Acciones</th>}</tr></thead><tbody>
        {filtrados.map(p => <tr key={p.id}><td>{p.nombre}</td><td>{p.documento}</td><td>{p.email}</td><td>{p.telefono ?? "—"}</td><td>{p.fechaNacimiento ? String(p.fechaNacimiento).slice(0, 10) : "—"}</td><td><span className={`badge ${p.usuarioId == null ? "bg-secondary" : "bg-success"}`}>{p.usuarioId == null ? "Sin vincular" : "Vinculada"}</span></td>{administrador && <td><button type="button" className="btn btn-sm btn-outline-primary" onClick={() => editar(p)}>Editar</button></td>}</tr>)}
        {!cargando && filtrados.length === 0 && <tr><td colSpan={administrador ? 7 : 6} className="text-center text-secondary py-4">No se encontraron pacientes.</td></tr>}
      </tbody></table></div>
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2"><small className="text-secondary">{cargando ? "Cargando..." : `${filtrados.length} de ${pacientes.length} pacientes`}</small><button type="button" className="btn btn-outline-success btn-sm" onClick={volver}>Volver al panel</button></div>
    </section>
  );
}
