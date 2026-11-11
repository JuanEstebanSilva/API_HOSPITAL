import { useCallback, useEffect, useMemo, useState } from "react";
import { listarEspecialidades, crearEspecialidad, actualizarEspecialidad, cambiarEstadoEspecialidad } from "../services/especialidades.service";

const inicial = { nombre: "", descripcion: "", activa: true };

export default function GestionEspecialidades({ token, volver }) {
  const [especialidades, setEspecialidades] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [estado, setEstado] = useState("todos");
  const [form, setForm] = useState(null);
  const [idEditando, setIdEditando] = useState(null);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const datos = await listarEspecialidades(token);
      if (!Array.isArray(datos)) throw new Error("La API no devolvió una lista de especialidades.");
      setEspecialidades(datos);
      setError("");
    } catch (err) { setError(err.message); }
    finally { setCargando(false); }
  }, [token]);

  useEffect(() => { cargar(); }, [cargar]);

  const filtradas = useMemo(() => especialidades.filter(e => {
    const texto = `${e.nombre} ${e.descripcion ?? ""}`.toLocaleLowerCase("es");
    return texto.includes(busqueda.toLocaleLowerCase("es").trim()) &&
      (estado === "todos" || e.activa === (estado === "activas"));
  }), [especialidades, busqueda, estado]);

  function nueva() { setIdEditando(null); setForm({ ...inicial }); setError(""); setAviso(""); }
  function editar(e) { setIdEditando(e.id); setForm({ nombre: e.nombre, descripcion: e.descripcion ?? "", activa: e.activa }); setError(""); setAviso(""); }

  async function guardar(evento) {
    evento.preventDefault();
    if (guardando) return;
    setError(""); setAviso(""); setGuardando(true);
    try {
      const datos = { nombre: form.nombre.trim(), descripcion: form.descripcion.trim(), activa: Boolean(form.activa) };
      if (idEditando === null) await crearEspecialidad(token, datos);
      else await actualizarEspecialidad(token, idEditando, datos);
      setForm(null); setIdEditando(null);
      await cargar();
      setAviso("Especialidad guardada correctamente.");
    } catch (err) { setError(err.message); }
    finally { setGuardando(false); }
  }

  async function alternar(e) {
    if (!window.confirm(`¿Deseas ${e.activa ? "desactivar" : "activar"} la especialidad ${e.nombre}?`)) return;
    setError(""); setAviso("");
    try {
      await cambiarEstadoEspecialidad(token, e.id, !e.activa);
      await cargar();
      setAviso("Estado actualizado correctamente.");
    } catch (err) { setError(err.message); }
  }

  return (
    <section className="hospital-card p-4 mt-4">
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
        <div><h2 className="h4 fw-bold mb-1">Médicos y especialidades</h2><p className="text-secondary mb-0">LAB 12.6.1 · Catálogo de especialidades médicas</p></div>
        <div className="d-flex gap-2"><button className="btn btn-success" onClick={nueva}>Nueva especialidad</button><button className="btn btn-outline-success" onClick={cargar} disabled={cargando}>Actualizar</button></div>
      </div>
      {error && <div className="alert alert-danger" role="alert">{error}</div>}
      {aviso && <div className="alert alert-success" role="status">{aviso}</div>}
      {form && <form className="border rounded p-3 mb-4 bg-light" onSubmit={guardar}>
        <h3 className="h5">{idEditando === null ? "Crear especialidad" : "Editar especialidad"}</h3>
        <div className="row g-3">
          <div className="col-md-5"><label htmlFor="esp-nombre" className="form-label">Nombre</label><input id="esp-nombre" className="form-control" required minLength={3} maxLength={100} value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}/></div>
          <div className="col-md-7"><label htmlFor="esp-descripcion" className="form-label">Descripción</label><input id="esp-descripcion" className="form-control" required minLength={5} maxLength={300} value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}/></div>
          <div className="col-12"><label className="form-check-label"><input className="form-check-input me-2" type="checkbox" checked={form.activa} onChange={e => setForm(f => ({ ...f, activa: e.target.checked }))}/>Especialidad activa</label></div>
        </div>
        <div className="d-flex gap-2 mt-3"><button type="submit" disabled={guardando} className="btn btn-success">{guardando ? "Guardando..." : "Guardar"}</button><button type="button" className="btn btn-outline-secondary" onClick={() => setForm(null)}>Cancelar</button></div>
      </form>}
      <div className="row g-3 mb-3">
        <div className="col-md-8"><label className="form-label" htmlFor="esp-buscar">Buscar por nombre o descripción</label><input id="esp-buscar" className="form-control" placeholder="Ej.: Cardiología" value={busqueda} onChange={e => setBusqueda(e.target.value)}/></div>
        <div className="col-md-4"><label className="form-label" htmlFor="esp-estado">Estado</label><select id="esp-estado" className="form-select" value={estado} onChange={e => setEstado(e.target.value)}><option value="todos">Todas</option><option value="activas">Activas</option><option value="inactivas">Inactivas</option></select></div>
      </div>
      <div className="table-responsive"><table className="table table-hover align-middle"><thead><tr><th>Nombre</th><th>Descripción</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>
        {filtradas.map(e => <tr key={e.id}><td>{e.nombre}</td><td>{e.descripcion}</td><td><span className={`badge ${e.activa ? "bg-success" : "bg-secondary"}`}>{e.activa ? "Activa" : "Inactiva"}</span></td><td><div className="d-flex gap-2"><button className="btn btn-sm btn-outline-primary" onClick={() => editar(e)}>Editar</button><button className={`btn btn-sm ${e.activa ? "btn-outline-danger" : "btn-outline-success"}`} onClick={() => alternar(e)}>{e.activa ? "Desactivar" : "Activar"}</button></div></td></tr>)}
        {!cargando && filtradas.length === 0 && <tr><td colSpan={4} className="text-secondary text-center py-4">No hay especialidades que coincidan.</td></tr>}
      </tbody></table></div>
      <div className="d-flex justify-content-between align-items-center"><small className="text-secondary">{cargando ? "Cargando..." : `${filtradas.length} de ${especialidades.length} especialidades`}</small><button className="btn btn-outline-success btn-sm" onClick={volver}>Volver al panel</button></div>
    </section>
  );
}
