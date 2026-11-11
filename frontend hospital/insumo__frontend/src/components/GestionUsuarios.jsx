import { useCallback, useEffect, useState } from "react";
import { listarUsuarios, crearUsuario, editarUsuario, cambiarEstadoUsuario } from "../services/usuarios.service";

const vacio = { nombre: "", email: "", password: "", rol: "medico" };
export default function GestionUsuarios({ token, volver }) {
  const [q, setQ] = useState("");
  const [rol, setRol] = useState("");
  const [activo, setActivo] = useState("");
  const [pagina, setPagina] = useState(1);
  const [resultado, setResultado] = useState({ usuarios: [], total: 0 });
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const [form, setForm] = useState(null);
  const [editando, setEditando] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [revision, setRevision] = useState(0);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const datos = await listarUsuarios(token, { q, rol, activo, pagina });
      setResultado(datos); setError("");
    } catch (err) { setError(err.message); }
    finally { setCargando(false); }
  }, [token, q, rol, activo, pagina]);

  useEffect(() => { cargar(); }, [cargar, revision]);
  const totalPaginas = Math.max(1, Math.ceil(resultado.total / 20));
  function abrirCrear() { setEditando(null); setForm({ ...vacio }); setError(""); setAviso(""); }
  function abrirEditar(u) { setEditando(u); setForm({ nombre: u.nombre, email: u.email }); setError(""); setAviso(""); }
  async function guardar(e) {
    e.preventDefault(); setError(""); setAviso(""); setGuardando(true);
    try {
      if (editando) await editarUsuario(token, editando.id, { nombre: form.nombre.trim(), email: form.email.trim() });
      else await crearUsuario(token, { nombre: form.nombre.trim(), email: form.email.trim(), password: form.password, rol: form.rol });
      setForm(null); setEditando(null); setAviso("Cambios guardados correctamente"); setRevision(n => n + 1);
    } catch (err) { setError(err.message); }
    finally { setGuardando(false); }
  }
  async function alternar(u) {
    const accion = u.activo ? "desactivar" : "activar";
    if (!window.confirm(`¿Desea ${accion} la cuenta de ${u.nombre}?`)) return;
    setError(""); setAviso("");
    try { await cambiarEstadoUsuario(token, u.id, !u.activo); setAviso("Estado actualizado"); setRevision(n => n + 1); }
    catch (err) { setError(err.message); }
  }
  return (
    <section className="hospital-card p-4 mt-4">
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
        <div><h2 className="h4 fw-bold mb-1">Usuarios y roles</h2><p className="text-secondary mb-0">Administración de cuentas hospitalarias</p></div>
        <div className="d-flex gap-2"><button className="btn btn-hospital" onClick={abrirCrear}>Crear cuenta</button><button className="btn btn-outline-success" onClick={() => setRevision(n => n + 1)}>Actualizar</button></div>
      </div>
      <div className="row g-3 mb-3">
        <div className="col-12 col-lg-6"><label className="form-label" htmlFor="buscarUsuario">Nombre o correo</label><input id="buscarUsuario" className="form-control" value={q} maxLength={100} onChange={e => { setQ(e.target.value); setPagina(1); }} placeholder="Buscar usuarios" /></div>
        <div className="col-6 col-lg-3"><label className="form-label" htmlFor="rolUsuario">Rol</label><select id="rolUsuario" className="form-select" value={rol} onChange={e => { setRol(e.target.value); setPagina(1); }}><option value="">Todos</option><option value="administrador">Administrador</option><option value="medico">Médico</option><option value="paciente">Paciente</option></select></div>
        <div className="col-6 col-lg-3"><label className="form-label" htmlFor="estadoUsuario">Estado</label><select id="estadoUsuario" className="form-select" value={activo} onChange={e => { setActivo(e.target.value); setPagina(1); }}><option value="">Todos</option><option value="true">Activo</option><option value="false">Inactivo</option></select></div>
      </div>
      {error && <div className="alert alert-danger" role="alert">{error}</div>}
      {aviso && <div className="alert alert-success" role="status">{aviso}</div>}
      {form && <form onSubmit={guardar} className="border rounded p-3 mb-3 bg-light">
        <h3 className="h5">{editando ? `Editar: ${editando.nombre}` : "Crear cuenta administrativa"}</h3>
        <div className="row g-2">
          <div className="col-md-6"><label className="form-label" htmlFor="nombreNuevo">Nombre</label><input id="nombreNuevo" className="form-control" minLength={3} maxLength={100} required value={form.nombre} onChange={e => setForm(v => ({ ...v, nombre: e.target.value }))} /></div>
          <div className="col-md-6"><label className="form-label" htmlFor="emailNuevo">Correo</label><input id="emailNuevo" type="email" className="form-control" required value={form.email} onChange={e => setForm(v => ({ ...v, email: e.target.value }))} /></div>
          {!editando && <><div className="col-md-6"><label className="form-label" htmlFor="rolNuevo">Rol</label><select id="rolNuevo" className="form-select" value={form.rol} onChange={e => setForm(v => ({ ...v, rol: e.target.value }))}><option value="medico">Médico</option><option value="administrador">Administrador</option></select></div>
          <div className="col-md-6"><label className="form-label" htmlFor="claveNueva">Contraseña inicial</label><input id="claveNueva" type="password" className="form-control" minLength={12} maxLength={72} required autoComplete="new-password" value={form.password} onChange={e => setForm(v => ({ ...v, password: e.target.value }))} /></div></>}
        </div>
        <p className="small text-secondary mt-2">Las cuentas de paciente y las fichas clínicas se gestionarán en su módulo correspondiente. No se cambia el rol ni la contraseña al editar.</p>
        <div className="d-flex gap-2"><button className="btn btn-hospital" disabled={guardando}>{guardando ? "Guardando..." : "Guardar"}</button><button type="button" className="btn btn-outline-secondary" onClick={() => { setForm(null); setError(""); }}>Cancelar</button></div>
      </form>}
      {cargando && <p role="status">Cargando usuarios...</p>}
      <div className="table-responsive"><table className="table table-hover align-middle"><thead><tr><th>Nombre</th><th>Correo</th><th>Rol</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>
        {resultado.usuarios.map(u => <tr key={u.id}><td>{u.nombre}</td><td>{u.email}</td><td>{u.rol}</td><td><span className={`badge ${u.activo ? "bg-success" : "bg-secondary"}`}>{u.activo ? "Activo" : "Inactivo"}</span></td><td><div className="d-flex gap-2"><button className="btn btn-outline-primary btn-sm" onClick={() => abrirEditar(u)}>Editar</button><button className={`btn btn-sm ${u.activo ? "btn-outline-danger" : "btn-outline-success"}`} onClick={() => alternar(u)}>{u.activo ? "Desactivar" : "Activar"}</button></div></td></tr>)}
        {!cargando && resultado.usuarios.length === 0 && <tr><td colSpan={5} className="text-center text-secondary">No se encontraron usuarios</td></tr>}
      </tbody></table></div>
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2"><span className="text-secondary">{resultado.total} usuarios · Página {pagina} de {totalPaginas}</span><div className="d-flex gap-2"><button className="btn btn-outline-secondary btn-sm" disabled={pagina <= 1} onClick={() => setPagina(p => p - 1)}>Anterior</button><button className="btn btn-outline-secondary btn-sm" disabled={pagina >= totalPaginas} onClick={() => setPagina(p => p + 1)}>Siguiente</button></div></div>
      <button className="btn btn-outline-success mt-3" onClick={volver}>Volver al panel</button>
    </section>
  );
}
