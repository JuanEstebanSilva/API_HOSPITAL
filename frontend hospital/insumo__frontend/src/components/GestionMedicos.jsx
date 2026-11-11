import { useCallback, useEffect, useMemo, useState } from "react";
import { listarMedicos, crearMedico, actualizarMedico, cambiarEstadoMedico } from "../services/medicos.service";
import { listarEspecialidades } from "../services/especialidades.service";
import { listarUsuarios, listarCuentasVinculadasMedicos } from "../services/usuarios.service";

const vacio = { nombre: "", registroMedico: "", email: "", telefono: "", especialidadId: "", usuarioId: "", activo: true };
const igualId = (a, b) => String(a) === String(b);

export default function GestionMedicos({ token }) {
  const [medicos, setMedicos] = useState([]);
  const [especialidades, setEspecialidades] = useState([]);
  const [form, setForm] = useState(null);
  const [editando, setEditando] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEspecialidad, setFiltroEspecialidad] = useState("");
  const [estado, setEstado] = useState("todos");
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [busquedaCuenta, setBusquedaCuenta] = useState("");
  const [cuentas, setCuentas] = useState([]);
  const [cuentasVinculadas, setCuentasVinculadas] = useState([]);
  const [buscandoCuenta, setBuscandoCuenta] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const [m, e, vinculadas] = await Promise.all([listarMedicos(token), listarEspecialidades(token), listarCuentasVinculadasMedicos(token)]);
      if (!Array.isArray(m) || !Array.isArray(e)) throw new Error("La API no devolvió los catálogos esperados.");
      setMedicos(m);
      setEspecialidades(e);
      setCuentasVinculadas(vinculadas);
      setError("");
    } catch (err) { setError(err.message); }
    finally { setCargando(false); }
  }, [token]);

  useEffect(() => { cargar(); }, [cargar]);

  const buscarCuentas = useCallback(async (q) => {
    setBuscandoCuenta(true);
    try {
      const resultado = await listarUsuarios(token, { q, rol: "medico", activo: "true", pagina: 1 });
      setCuentas(Array.isArray(resultado.usuarios) ? resultado.usuarios : []);
    } catch (err) { setError(err.message); }
    finally { setBuscandoCuenta(false); }
  }, [token]);

  const cuentaDe = (usuarioId) => cuentasVinculadas.find(u => igualId(u.id, usuarioId));

  const disponibles = useMemo(() => especialidades.filter(e => e.activa || (form && igualId(e.id, form.especialidadId))), [especialidades, form]);
  const filtrados = useMemo(() => medicos.filter(m => {
    const esp = especialidades.find(e => igualId(e.id, m.especialidadId));
    const texto = `${m.nombre} ${m.email} ${m.registroMedico} ${esp?.nombre ?? ""}`.toLocaleLowerCase("es");
    return texto.includes(busqueda.trim().toLocaleLowerCase("es")) &&
      (!filtroEspecialidad || igualId(m.especialidadId, filtroEspecialidad)) &&
      (estado === "todos" || m.activo === (estado === "activos"));
  }), [medicos, especialidades, busqueda, filtroEspecialidad, estado]);

  function nuevo() {
    setEditando(null); setForm({ ...vacio }); setBusquedaCuenta(""); setCuentas([]);
    setError(""); setAviso("");
  }
  function editar(m) {
    setEditando(m.id);
    setForm({
      nombre: m.nombre, registroMedico: m.registroMedico, email: m.email,
      telefono: m.telefono ?? "", especialidadId: String(m.especialidadId),
      usuarioId: m.usuarioId == null ? "" : String(m.usuarioId), activo: Boolean(m.activo),
    });
    setBusquedaCuenta(""); setCuentas([]);
    setError(""); setAviso("");
  }
  async function guardar(ev) {
    ev.preventDefault();
    if (guardando || !form) return;
    setError(""); setAviso(""); setGuardando(true);
    try {
      const datos = {
        nombre: form.nombre.trim(),
        registroMedico: form.registroMedico.trim(),
        email: form.email.trim(),
        telefono: form.telefono.trim() || null,
        especialidadId: String(form.especialidadId),
        usuarioId: form.usuarioId === "" ? null : String(form.usuarioId),
        activo: Boolean(form.activo),
      };
      if (editando === null) await crearMedico(token, datos);
      else await actualizarMedico(token, editando, datos);
      setForm(null); setEditando(null);
      await cargar();
      setAviso("Ficha médica guardada correctamente.");
    } catch (err) { setError(err.message); }
    finally { setGuardando(false); }
  }
  async function alternar(m) {
    if (!window.confirm(`¿Deseas ${m.activo ? "desactivar" : "activar"} la ficha de ${m.nombre}?`)) return;
    setError(""); setAviso("");
    try {
      await cambiarEstadoMedico(token, m.id, !m.activo);
      await cargar();
      setAviso("Estado de la ficha actualizado.");
    } catch (err) { setError(err.message); }
  }
  function campo(nombre, valor) { setForm(f => ({ ...f, [nombre]: valor })); }

  return (
    <section className="hospital-card p-4 mt-4">
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
        <div><h2 className="h4 fw-bold mb-1">Directorio de médicos</h2><p className="text-secondary mb-0">LAB 12.6.2 · Profesionales, especialidades y cuentas vinculadas</p></div>
        <div className="d-flex gap-2"><button className="btn btn-success" onClick={nuevo}>Nuevo médico</button><button className="btn btn-outline-success" onClick={cargar} disabled={cargando}>Actualizar</button></div>
      </div>
      {error && <div className="alert alert-danger" role="alert">{error}</div>}
      {aviso && <div className="alert alert-success" role="status">{aviso}</div>}
      {form && <form className="border rounded bg-light p-3 mb-4" onSubmit={guardar}>
        <h3 className="h5">{editando === null ? "Registrar médico" : "Editar ficha médica"}</h3>
        <div className="row g-3">
          <div className="col-md-6"><label className="form-label" htmlFor="med-nombre">Nombre completo</label><input id="med-nombre" className="form-control" required minLength={3} maxLength={100} value={form.nombre} onChange={e => campo("nombre", e.target.value)}/></div>
          <div className="col-md-6"><label className="form-label" htmlFor="med-registro">Registro médico (RM-12345)</label><input id="med-registro" className="form-control" required pattern="RM-[0-9]{4,10}" value={form.registroMedico} onChange={e => campo("registroMedico", e.target.value)}/></div>
          <div className="col-md-6"><label className="form-label" htmlFor="med-email">Correo electrónico</label><input id="med-email" type="email" className="form-control" required value={form.email} onChange={e => campo("email", e.target.value)}/></div>
          <div className="col-md-6"><label className="form-label" htmlFor="med-telefono">Teléfono (opcional)</label><input id="med-telefono" className="form-control" pattern="[0-9]{7,15}" value={form.telefono} onChange={e => campo("telefono", e.target.value)}/></div>
          <div className="col-md-6"><label className="form-label" htmlFor="med-especialidad">Especialidad</label><select id="med-especialidad" className="form-select" required value={form.especialidadId} onChange={e => campo("especialidadId", e.target.value)}><option value="">Seleccionar especialidad activa</option>{disponibles.map(e => <option key={e.id} value={String(e.id)} disabled={!e.activa}>{e.nombre}{!e.activa ? " (inactiva)" : ""}</option>)}</select></div>
          <div className="col-md-6"><label className="form-label" htmlFor="med-cuenta">Buscar cuenta de médico (opcional)</label><div className="input-group"><input id="med-cuenta" className="form-control" placeholder="Nombre o correo" value={busquedaCuenta} onChange={e => setBusquedaCuenta(e.target.value)}/><button type="button" className="btn btn-outline-primary" disabled={buscandoCuenta} onClick={() => buscarCuentas(busquedaCuenta)}>{buscandoCuenta ? "Buscando..." : "Buscar"}</button></div></div>
          <div className="col-md-12"><label className="form-label" htmlFor="med-usuario">Cuenta asociada</label><select id="med-usuario" className="form-select" value={form.usuarioId} onChange={e => campo("usuarioId", e.target.value)}><option value="">Sin cuenta asociada</option>{form.usuarioId && !cuentas.some(u => igualId(u.id, form.usuarioId)) && <option value={form.usuarioId}>{cuentaDe(form.usuarioId) ? `${cuentaDe(form.usuarioId).nombre} — ${cuentaDe(form.usuarioId).email} (${cuentaDe(form.usuarioId).activo ? "activa" : "inactiva"})` : "Cuenta vinculada no disponible"}</option>}{cuentas.filter(u => !medicos.some(m => igualId(m.usuarioId, u.id) && !igualId(m.id, editando))).map(u => <option key={u.id} value={String(u.id)}>{u.nombre} — {u.email}</option>)}</select>{form.usuarioId && cuentaDe(form.usuarioId) && <div className="border rounded bg-white p-3 mt-2" aria-live="polite"><div className="d-flex align-items-center justify-content-between gap-2"><strong>{cuentaDe(form.usuarioId).nombre}</strong><span className={`badge ${cuentaDe(form.usuarioId).activo ? "bg-success" : "bg-secondary"}`}>{cuentaDe(form.usuarioId).activo ? "Activa" : "Inactiva"}</span></div><div className="text-secondary small">{cuentaDe(form.usuarioId).email} · Rol: {cuentaDe(form.usuarioId).rol}</div></div>}
              <small className="text-secondary">Busca una cuenta con rol médico y selecciónala. No se crea una contraseña desde este formulario.</small></div>
          <div className="col-12"><label className="form-check-label"><input type="checkbox" className="form-check-input me-2" checked={form.activo} onChange={e => campo("activo", e.target.checked)}/>Ficha activa</label></div>
        </div>
        <div className="d-flex gap-2 mt-3"><button className="btn btn-success" type="submit" disabled={guardando}>{guardando ? "Guardando..." : "Guardar"}</button><button className="btn btn-outline-secondary" type="button" onClick={() => { setForm(null); setError(""); }}>Cancelar</button></div>
      </form>}
      <div className="row g-3 mb-3">
        <div className="col-lg-6"><label htmlFor="med-buscar" className="form-label">Buscar médico</label><input id="med-buscar" className="form-control" placeholder="Nombre, correo, registro o especialidad" value={busqueda} onChange={e => setBusqueda(e.target.value)}/></div>
        <div className="col-lg-3 col-md-6"><label htmlFor="med-filtrar-esp" className="form-label">Especialidad</label><select id="med-filtrar-esp" className="form-select" value={filtroEspecialidad} onChange={e => setFiltroEspecialidad(e.target.value)}><option value="">Todas</option>{especialidades.map(e => <option key={e.id} value={String(e.id)}>{e.nombre}</option>)}</select></div>
        <div className="col-lg-3 col-md-6"><label htmlFor="med-filtrar-estado" className="form-label">Estado</label><select id="med-filtrar-estado" className="form-select" value={estado} onChange={e => setEstado(e.target.value)}><option value="todos">Todos</option><option value="activos">Activos</option><option value="inactivos">Inactivos</option></select></div>
      </div>
      <div className="table-responsive"><table className="table table-hover align-middle"><thead><tr><th>Nombre</th><th>Registro</th><th>Correo</th><th>Especialidad</th><th>Cuenta</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>
        {filtrados.map(m => <tr key={m.id}><td>{m.nombre}</td><td>{m.registroMedico}</td><td>{m.email}</td><td>{especialidades.find(e => igualId(e.id, m.especialidadId))?.nombre ?? "No disponible"}</td><td>{m.usuarioId == null ? <span className="text-secondary">Sin vincular</span> : cuentaDe(m.usuarioId) ? <span><strong>{cuentaDe(m.usuarioId).nombre}</strong><br/><small className="text-secondary">{cuentaDe(m.usuarioId).email} · {cuentaDe(m.usuarioId).rol} · {cuentaDe(m.usuarioId).activo ? "Cuenta activa" : "Cuenta inactiva"}</small></span> : <span className="text-secondary">Cuenta no disponible</span>}</td><td><span className={`badge ${m.activo ? "bg-success" : "bg-secondary"}`}>{m.activo ? "Activo" : "Inactivo"}</span></td><td><div className="d-flex gap-2"><button className="btn btn-sm btn-outline-primary" onClick={() => editar(m)}>Editar</button><button className={`btn btn-sm ${m.activo ? "btn-outline-danger" : "btn-outline-success"}`} onClick={() => alternar(m)}>{m.activo ? "Desactivar" : "Activar"}</button></div></td></tr>)}
        {!cargando && filtrados.length === 0 && <tr><td colSpan={7} className="text-center text-secondary py-4">No se encontraron médicos.</td></tr>}
      </tbody></table></div>
      <small className="text-secondary">{cargando ? "Cargando..." : `${filtrados.length} de ${medicos.length} médicos`}</small>
    </section>
  );
}
