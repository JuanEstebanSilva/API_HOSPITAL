import { useCallback, useEffect, useMemo, useState } from "react";
import { listarConsultorios, crearConsultorio, actualizarConsultorio, cambiarEstadoConsultorio } from "../services/consultorios.service";

const inicial = { codigo: "", nombre: "", piso: "1", ubicacion: "", activo: true };

export default function GestionConsultorios({ token, volver }) {
  const [consultorios, setConsultorios] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState("todos");
  const [form, setForm] = useState(null);
  const [editando, setEditando] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [operando, setOperando] = useState(null);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const registros = await listarConsultorios(token);
      if (!Array.isArray(registros)) throw new Error("La API no devolvió una lista de consultorios.");
      setConsultorios(registros);
      setError("");
    } catch (err) { setError(err.message); }
    finally { setCargando(false); }
  }, [token]);

  useEffect(() => { cargar(); }, [cargar]);

  const filtrados = useMemo(() => consultorios.filter(c => {
    const coincide = `${c.codigo} ${c.nombre} ${c.ubicacion} ${c.piso}`.toLocaleLowerCase("es").includes(busqueda.trim().toLocaleLowerCase("es"));
    return coincide && (filtro === "todos" || (filtro === "activos" ? c.activo : !c.activo));
  }), [consultorios, busqueda, filtro]);

  function nuevo() { setForm({ ...inicial }); setEditando(null); setError(""); setAviso(""); }
  function editar(c) {
    setForm({ codigo: c.codigo ?? "", nombre: c.nombre ?? "", piso: String(c.piso ?? 1), ubicacion: c.ubicacion ?? "", activo: Boolean(c.activo) });
    setEditando(c.id); setError(""); setAviso("");
  }
  function campo(nombre, valor) { setForm(actual => ({ ...actual, [nombre]: valor })); }

  async function guardar(ev) {
    ev.preventDefault();
    if (!form || guardando) return;
    setGuardando(true); setError(""); setAviso("");
    try {
      const datos = { codigo: form.codigo.trim().toUpperCase(), nombre: form.nombre.trim(), piso: Number(form.piso), ubicacion: form.ubicacion.trim(), activo: form.activo };
      if (editando == null) await crearConsultorio(token, datos);
      else await actualizarConsultorio(token, editando, datos);
      setForm(null); setEditando(null);
      await cargar();
      setAviso("Consultorio guardado correctamente.");
    } catch (err) { setError(err.message); }
    finally { setGuardando(false); }
  }

  async function alternar(c) {
    if (operando != null) return;
    const accion = c.activo ? "desactivar" : "activar";
    if (!window.confirm(`¿Deseas ${accion} el consultorio ${c.codigo}?`)) return;
    setOperando(c.id); setError(""); setAviso("");
    try {
      await cambiarEstadoConsultorio(token, c.id, !c.activo);
      await cargar();
      setAviso(`Consultorio ${c.activo ? "desactivado" : "activado"} correctamente.`);
    } catch (err) { setError(err.message); }
    finally { setOperando(null); }
  }

  return (
    <section className="hospital-card p-4 mt-4">
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
        <div><h2 className="h4 fw-bold mb-1">Gestión de consultorios</h2><p className="text-secondary mb-0">LAB 12.6.4 · Espacios de atención hospitalaria</p></div>
        <div className="d-flex gap-2"><button className="btn btn-success" type="button" onClick={nuevo}>Nuevo consultorio</button><button className="btn btn-outline-success" type="button" onClick={cargar} disabled={cargando}>Actualizar</button></div>
      </div>
      {error && <div className="alert alert-danger" role="alert">{error}</div>}
      {aviso && <div className="alert alert-success" role="status">{aviso}</div>}
      {form && <form className="border rounded bg-light p-3 mb-4" onSubmit={guardar}>
        <h3 className="h5">{editando == null ? "Registrar consultorio" : "Editar consultorio"}</h3>
        <div className="row g-3">
          <div className="col-md-6"><label htmlFor="cons-codigo" className="form-label">Código (CONS-101)</label><input id="cons-codigo" className="form-control" required pattern="CONS-[0-9]{3,4}" title="Ejemplo: CONS-101" value={form.codigo} onChange={e => campo("codigo", e.target.value.toUpperCase())}/></div>
          <div className="col-md-6"><label htmlFor="cons-nombre" className="form-label">Nombre</label><input id="cons-nombre" className="form-control" required minLength={3} maxLength={100} value={form.nombre} onChange={e => campo("nombre", e.target.value)}/></div>
          <div className="col-md-6"><label htmlFor="cons-piso" className="form-label">Piso (1 a 100)</label><input id="cons-piso" type="number" className="form-control" required min={1} max={100} step={1} value={form.piso} onChange={e => campo("piso", e.target.value)}/></div>
          <div className="col-md-6"><label htmlFor="cons-ubicacion" className="form-label">Ubicación</label><input id="cons-ubicacion" className="form-control" required minLength={3} maxLength={100} placeholder="Ej.: Ala Norte" value={form.ubicacion} onChange={e => campo("ubicacion", e.target.value)}/></div>
          <div className="col-12"><label className="form-check"><input className="form-check-input" type="checkbox" checked={form.activo} onChange={e => campo("activo", e.target.checked)}/><span className="form-check-label">Consultorio activo</span></label></div>
        </div>
        <div className="d-flex gap-2 mt-3"><button className="btn btn-success" disabled={guardando} type="submit">{guardando ? "Guardando..." : "Guardar"}</button><button className="btn btn-outline-secondary" type="button" onClick={() => { setForm(null); setError(""); }}>Cancelar</button></div>
      </form>}
      <div className="row g-3 mb-3">
        <div className="col-md-8"><label htmlFor="cons-buscar" className="form-label">Buscar por código, nombre, ubicación o piso</label><input id="cons-buscar" className="form-control" placeholder="Ej.: CONS-101" value={busqueda} onChange={e => setBusqueda(e.target.value)}/></div>
        <div className="col-md-4"><label htmlFor="cons-filtro" className="form-label">Estado</label><select id="cons-filtro" className="form-select" value={filtro} onChange={e => setFiltro(e.target.value)}><option value="todos">Todos</option><option value="activos">Activos</option><option value="inactivos">Inactivos</option></select></div>
      </div>
      <div className="table-responsive"><table className="table table-hover align-middle"><thead><tr><th>Código</th><th>Nombre</th><th>Piso</th><th>Ubicación</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>
        {filtrados.map(c => <tr key={c.id}><td>{c.codigo}</td><td>{c.nombre}</td><td>{c.piso}</td><td>{c.ubicacion}</td><td><span className={`badge ${c.activo ? "bg-success" : "bg-secondary"}`}>{c.activo ? "Activo" : "Inactivo"}</span></td><td><div className="d-flex gap-2"><button className="btn btn-sm btn-outline-primary" type="button" onClick={() => editar(c)}>Editar</button><button className={`btn btn-sm ${c.activo ? "btn-outline-danger" : "btn-outline-success"}`} type="button" disabled={operando != null} onClick={() => alternar(c)}>{c.activo ? "Desactivar" : "Activar"}</button></div></td></tr>)}
        {!cargando && filtrados.length === 0 && <tr><td colSpan={6} className="text-secondary text-center py-4">No se encontraron consultorios.</td></tr>}
      </tbody></table></div>
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2"><small className="text-secondary">{filtrados.length} de {consultorios.length} consultorios</small><button className="btn btn-outline-success" type="button" onClick={volver}>Volver al panel</button></div>
    </section>
  );
}
