import AgendaInteractiva from "./AgendaInteractiva";
import { useCallback, useEffect, useMemo, useState } from "react";
import { listarPacientes } from "../services/pacientes.service";
import { listarMedicos } from "../services/medicos.service";
import { listarConsultorios } from "../services/consultorios.service";
import { listarCitas, listarMisCitas, crearCita, actualizarCita, cambiarEstadoCita, consultarMiContexto, solicitarCitaPropia, cancelarMiCita, confirmarMiCita, atenderMiCita } from "../services/citas.service";

const vacio = { pacienteId: "", medicoId: "", consultorioId: "", fecha: "", hora: "", motivo: "" };
const opcionesEstado = { programada: ["confirmada", "cancelada"], confirmada: ["atendida", "cancelada"], atendida: [], cancelada: [] };
const normalizar = valor => String(valor ?? "").toLocaleLowerCase("es");
const etiqueta = (registro, tipo) => {
  if (!registro) return "Registro no disponible";
  if (tipo === "paciente") return `${registro.nombre} · ${registro.documento}`;
  if (tipo === "medico") return `${registro.nombre} · ${registro.registroMedico ?? registro.registro_medico ?? registro.email ?? "Médico"}`;
  return `${registro.codigo} · ${registro.nombre}`;
};

export default function GestionCitas({ token, rol, volver, modoAgenda = false }) {
  const esAdmin = rol === "administrador";
  const esPaciente = rol === "paciente";
  const esMedico = rol === "medico";
  const [citas, setCitas] = useState([]);
  const [miFicha, setMiFicha] = useState(null);
  const [detalle, setDetalle] = useState(null);
  const [pacientes, setPacientes] = useState([]);
  const [medicos, setMedicos] = useState([]);
  const [consultorios, setConsultorios] = useState([]);
  const [form, setForm] = useState(null);
  const [editando, setEditando] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("todos");
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [operando, setOperando] = useState(null);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const [registros, ps, ms, cs, contexto] = await Promise.all([
        esAdmin ? listarCitas(token) : listarMisCitas(token),
        esAdmin ? listarPacientes(token) : Promise.resolve([]),
        esAdmin || esPaciente ? listarMedicos(token) : Promise.resolve([]),
        esAdmin || esPaciente ? listarConsultorios(token) : Promise.resolve([]),
        esAdmin ? Promise.resolve(null) : consultarMiContexto(token),
      ]);
      if (![registros, ps, ms, cs].every(Array.isArray)) throw new Error("La API no devolvió las listas esperadas.");
      setCitas(registros); setPacientes(ps); setMedicos(ms); setConsultorios(cs); setMiFicha(contexto?.ficha ?? null);
      setError("");
    } catch (err) { setError(err.message); }
    finally { setCargando(false); }
  }, [token, esAdmin, esPaciente]);

  useEffect(() => { cargar(); }, [cargar]);

  const porPaciente = useMemo(() => new Map(pacientes.map(x => [String(x.id), x])), [pacientes]);
  const porMedico = useMemo(() => new Map(medicos.map(x => [String(x.id), x])), [medicos]);
  const porConsultorio = useMemo(() => new Map(consultorios.map(x => [String(x.id), x])), [consultorios]);

  const filtradas = useMemo(() => citas.filter(c => {
    if (modoAgenda && (["cancelada", "atendida"].includes(c.estado) || new Date(`${c.fecha}T${String(c.hora).slice(0, 5)}`) < new Date())) return false;
    const texto = [c.id, c.fecha, c.hora, c.estado, c.motivo,
      etiqueta(porPaciente.get(String(c.pacienteId)), "paciente"),
      etiqueta(porMedico.get(String(c.medicoId)), "medico"),
      etiqueta(porConsultorio.get(String(c.consultorioId)), "consultorio")].join(" ");
    return normalizar(texto).includes(normalizar(busqueda.trim())) && (estadoFiltro === "todos" || c.estado === estadoFiltro);
  }), [citas, busqueda, estadoFiltro, porPaciente, porMedico, porConsultorio, modoAgenda]);

  function nuevo() { setForm({ ...vacio }); setEditando(null); setError(""); setAviso(""); }
  function editar(c) {
    setEditando(c.id);
    setForm({ pacienteId: String(c.pacienteId), medicoId: String(c.medicoId), consultorioId: String(c.consultorioId), fecha: c.fecha, hora: String(c.hora).slice(0, 5), motivo: c.motivo });
    setError(""); setAviso("");
  }
  function campo(nombre, valor) { setForm(actual => ({ ...actual, [nombre]: valor })); }

  async function guardar(ev) {
    ev.preventDefault();
    if ((!esAdmin && !esPaciente) || !form || guardando) return;
    setGuardando(true); setError(""); setAviso("");
    try {
      const datos = { medicoId: form.medicoId, consultorioId: form.consultorioId, fecha: form.fecha, hora: form.hora, motivo: form.motivo.trim() };
      if (esPaciente) await solicitarCitaPropia(token, datos);
      else if (editando == null) await crearCita(token, { ...datos, pacienteId: form.pacienteId });
      else await actualizarCita(token, editando, { ...datos, pacienteId: form.pacienteId });
      setForm(null); setEditando(null);
      await cargar(); setAviso("Cita guardada correctamente.");
    } catch (err) { setError(err.message); }
    finally { setGuardando(false); }
  }

  async function transicionar(c, estado) {
    if (operando !== null) return;
    if (!window.confirm(`¿Cambiar la cita ${c.id} de ${c.estado} a ${estado}?`)) return;
    setOperando(c.id); setError(""); setAviso("");
    try {
      if (esAdmin) await cambiarEstadoCita(token, c.id, estado);
      else if (esPaciente && estado === "cancelada") await cancelarMiCita(token, c.id);
      else if (esMedico && estado === "confirmada") await confirmarMiCita(token, c.id);
      else if (esMedico && estado === "atendida") await atenderMiCita(token, c.id);
      else throw new Error("Acción no autorizada para este rol");
      await cargar(); setAviso(`Cita ${estado} correctamente.`);
    } catch (err) { setError(err.message); }
    finally { setOperando(null); }
  }

  const opcionesPaciente = pacientes;
  const opcionesMedico = medicos.filter(m => m.activo || (form && String(m.id) === form.medicoId));
  const opcionesConsultorio = consultorios.filter(c => c.activo || (form && String(c.id) === form.consultorioId));

  return <section className="hospital-card p-4 mt-4">
    <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
      <div><h2 className="h4 fw-bold mb-1">{esAdmin ? "Gestión de citas médicas" : modoAgenda ? "Mi agenda próxima" : "Mis citas médicas"}</h2><p className="text-secondary mb-0">LAB 12.6.5 · Programación, agenda y seguimiento</p></div>
      <div className="d-flex gap-2">{(esAdmin || (esPaciente && miFicha)) && <button type="button" className="btn btn-success" onClick={nuevo}>{esPaciente ? "Solicitar cita" : "Nueva cita"}</button>}<button type="button" className="btn btn-outline-success" disabled={cargando} onClick={cargar}>Actualizar</button></div>
    </div>
    {error && <div role="alert" className="alert alert-danger">{error}</div>}
    {aviso && <div role="status" className="alert alert-success">{aviso}</div>}
    {!esAdmin && !miFicha && !cargando && <div className="alert alert-warning">No hay una ficha {esPaciente ? "de paciente" : "de médico"} vinculada a esta cuenta. Solicita la vinculación al administrador para gestionar citas.</div>}
    {(esAdmin || esPaciente) && form && <form onSubmit={guardar} className="border rounded bg-light p-3 mb-4">
      <h3 className="h5">{esPaciente ? "Solicitar una cita para mí" : editando == null ? "Programar cita" : `Editar cita ${editando}`}</h3>
      <div className="row g-3">
        {esAdmin && <div className="col-md-6"><label className="form-label" htmlFor="cita-paciente">Paciente</label><select className="form-select" id="cita-paciente" required value={form.pacienteId} onChange={e => campo("pacienteId", e.target.value)}><option value="">Selecciona un paciente</option>{opcionesPaciente.map(p => <option key={p.id} value={p.id}>{etiqueta(p, "paciente")}</option>)}</select></div>}
        <div className="col-md-6"><label className="form-label" htmlFor="cita-medico">Médico</label><select className="form-select" id="cita-medico" required value={form.medicoId} onChange={e => campo("medicoId", e.target.value)}><option value="">Selecciona un médico activo</option>{opcionesMedico.map(m => <option key={m.id} value={m.id}>{etiqueta(m, "medico")}{m.activo ? "" : " (inactivo)"}</option>)}</select></div>
        <div className="col-md-6"><label className="form-label" htmlFor="cita-consultorio">Consultorio</label><select className="form-select" id="cita-consultorio" required value={form.consultorioId} onChange={e => campo("consultorioId", e.target.value)}><option value="">Selecciona un consultorio activo</option>{opcionesConsultorio.map(c => <option key={c.id} value={c.id}>{etiqueta(c, "consultorio")}{c.activo ? "" : " (inactivo)"}</option>)}</select></div>
        <div className="col-md-3"><label className="form-label" htmlFor="cita-fecha">Fecha</label><input className="form-control" id="cita-fecha" type="date" required value={form.fecha} onChange={e => campo("fecha", e.target.value)}/></div>
        <div className="col-md-3"><label className="form-label" htmlFor="cita-hora">Hora</label><input className="form-control" id="cita-hora" type="time" required value={form.hora} onChange={e => campo("hora", e.target.value)}/></div>
        <div className="col-12"><label className="form-label" htmlFor="cita-motivo">Motivo de consulta</label><textarea className="form-control" id="cita-motivo" rows={2} minLength={5} maxLength={300} required value={form.motivo} onChange={e => campo("motivo", e.target.value)}/></div>
      </div>
      <p className="text-secondary small mt-2 mb-0">La API valida la disponibilidad del médico y del consultorio. Una cita cancelada no reserva el horario.</p>
      <div className="d-flex gap-2 mt-3"><button type="submit" className="btn btn-success" disabled={guardando}>{guardando ? "Guardando..." : "Guardar"}</button><button type="button" className="btn btn-outline-secondary" onClick={() => { setForm(null); setError(""); }}>Cancelar</button></div>
    </form>}
    {detalle && <div className="border rounded p-3 mb-3 bg-light" role="region" aria-label="Detalle de cita"><div className="d-flex justify-content-between"><h3 className="h5">Detalle de la cita #{detalle.id}</h3><button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setDetalle(null)}>Cerrar</button></div><dl className="row mb-0"><dt className="col-sm-3">Paciente</dt><dd className="col-sm-9">{detalle.pacienteNombre || (esPaciente ? "Mi ficha" : `Paciente ${detalle.pacienteId}`)}</dd><dt className="col-sm-3">Médico</dt><dd className="col-sm-9">{detalle.medicoNombre || `Médico ${detalle.medicoId}`}</dd><dt className="col-sm-3">Consultorio</dt><dd className="col-sm-9">{detalle.consultorioNombre || `Consultorio ${detalle.consultorioId}`}</dd><dt className="col-sm-3">Fecha y hora</dt><dd className="col-sm-9">{detalle.fecha} · {String(detalle.hora).slice(0, 5)}</dd><dt className="col-sm-3">Estado</dt><dd className="col-sm-9">{detalle.estado}</dd><dt className="col-sm-3">Motivo</dt><dd className="col-sm-9">{detalle.motivo}</dd></dl></div>}
    {modoAgenda && esMedico && <AgendaInteractiva citas={citas} rol={rol} onDetalle={setDetalle} onEstado={transicionar} operando={operando} />}
    <div className="row g-3 mb-3">
      <div className="col-md-8"><label className="form-label" htmlFor="citas-buscar">Buscar por paciente, médico, consultorio, fecha o motivo</label><input id="citas-buscar" className="form-control" value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar citas" /></div>
      <div className="col-md-4"><label className="form-label" htmlFor="citas-estado">Estado</label><select id="citas-estado" className="form-select" value={estadoFiltro} onChange={e => setEstadoFiltro(e.target.value)}><option value="todos">Todos</option>{Object.keys(opcionesEstado).map(e => <option key={e} value={e}>{e}</option>)}</select></div>
    </div>
    <div className="table-responsive"><table className="table table-hover align-middle"><thead><tr><th>Fecha</th><th>Hora</th><th>Paciente</th><th>Médico</th><th>Consultorio</th><th>Motivo</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>
      {filtradas.map(c => <tr key={c.id}><td>{c.fecha}</td><td>{String(c.hora).slice(0, 5)}</td><td>{esAdmin ? etiqueta(porPaciente.get(String(c.pacienteId)), "paciente") : c.pacienteNombre || (esPaciente ? "Mi cita" : "Paciente asignado")}</td><td>{esAdmin ? etiqueta(porMedico.get(String(c.medicoId)), "medico") : c.medicoNombre || "Médico asignado"}</td><td>{esAdmin ? etiqueta(porConsultorio.get(String(c.consultorioId)), "consultorio") : c.consultorioNombre || "Consultorio asignado"}</td><td>{c.motivo}</td><td><span className={`badge ${c.estado === "cancelada" ? "bg-secondary" : c.estado === "atendida" ? "bg-success" : c.estado === "confirmada" ? "bg-primary" : "bg-info text-dark"}`}>{c.estado}</span></td><td><div className="d-flex flex-wrap gap-1"><button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setDetalle(c)}>Detalles</button>{esAdmin && <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => editar(c)} disabled={c.estado === "atendida" || c.estado === "cancelada"}>Editar</button>}{(esAdmin ? opcionesEstado[c.estado] ?? [] : esPaciente ? ["programada", "confirmada"].includes(c.estado) ? ["cancelada"] : [] : esMedico ? c.estado === "programada" ? ["confirmada"] : c.estado === "confirmada" ? ["atendida"] : [] : []).map(estado => <button type="button" key={estado} disabled={operando !== null} className={`btn btn-sm ${estado === "cancelada" ? "btn-outline-danger" : "btn-outline-success"}`} onClick={() => transicionar(c, estado)}>{estado === "cancelada" ? "Cancelar cita" : estado === "confirmada" ? "Confirmar" : "Marcar atendida"}</button>)}</div></td></tr>)}
      {!cargando && filtradas.length === 0 && <tr><td colSpan={8} className="text-center text-secondary py-4">No hay citas que coincidan con los filtros.</td></tr>}
    </tbody></table></div>
    <div className="d-flex justify-content-between align-items-center flex-wrap gap-2"><small className="text-secondary">{filtradas.length} de {citas.length} citas</small><button className="btn btn-outline-success" type="button" onClick={volver}>Volver al panel</button></div>
  </section>;
}
