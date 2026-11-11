import { useMemo, useState } from "react";
import "./AgendaInteractiva.css";

const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const FECHA = /^\d{4}-\d{2}-\d{2}$/;
const clave = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const fechaLocal = valor => FECHA.test(String(valor ?? "")) ? new Date(`${valor}T12:00:00`) : null;
const sumarDias = (d,n) => { const x=new Date(d); x.setDate(x.getDate()+n); return x; };
const inicioSemana = d => sumarDias(d, -(d.getDay()+6)%7);
const mesTitulo = d => new Intl.DateTimeFormat("es-CO",{month:"long",year:"numeric"}).format(d);
const fechaTitulo = d => new Intl.DateTimeFormat("es-CO",{weekday:"long",day:"numeric",month:"long",year:"numeric"}).format(d);
const colores = {programada:"agenda-programada",confirmada:"agenda-confirmada",atendida:"agenda-atendida",cancelada:"agenda-cancelada"};

export default function AgendaInteractiva({ citas = [], onDetalle, onEstado, rol, operando }) {
  const [vista,setVista] = useState("semana");
  const [referencia,setReferencia] = useState(() => new Date());
  const [seleccion,setSeleccion] = useState(() => clave(new Date()));
  const [mostrarHistorico,setMostrarHistorico] = useState(false);
  const hoy = clave(new Date());
  const registros = useMemo(() => citas.filter(c => fechaLocal(c.fecha) && (mostrarHistorico || c.estado !== "cancelada")),[citas,mostrarHistorico]);
  const porDia = useMemo(() => {
    const m = new Map();
    for (const c of registros) { const k=String(c.fecha).slice(0,10); if(!m.has(k))m.set(k,[]); m.get(k).push(c); }
    for (const lista of m.values()) lista.sort((a,b)=>String(a.hora).localeCompare(String(b.hora)));
    return m;
  },[registros]);
  const dias = useMemo(() => {
    if (vista === "dia") return [referencia];
    if (vista === "semana") return Array.from({length:7},(_,i)=>sumarDias(inicioSemana(referencia),i));
    const primero=new Date(referencia.getFullYear(),referencia.getMonth(),1,12);
    const inicio=inicioSemana(primero);
    const cantidad=Math.ceil(((new Date(referencia.getFullYear(),referencia.getMonth()+1,0).getDate()) + ((primero.getDay()+6)%7))/7)*7;
    return Array.from({length:cantidad},(_,i)=>sumarDias(inicio,i));
  },[referencia,vista]);
  const etiquetaPeriodo = vista === "mes" ? mesTitulo(referencia) : vista === "dia" ? fechaTitulo(referencia) : `${fechaTitulo(dias[0])} — ${fechaTitulo(dias[6])}`;
  const delDia = porDia.get(seleccion) ?? [];
  function mover(n) {
    const d = new Date(referencia);
    if(vista === "mes") d.setMonth(d.getMonth()+n);
    else d.setDate(d.getDate()+n*(vista === "semana" ? 7 : 1));
    setReferencia(d); setSeleccion(clave(d));
  }
  function seleccionar(d) {setSeleccion(clave(d));setReferencia(d);}
  function acciones(c) {
    if (rol !== "medico") return [];
    if (c.estado === "programada") return [{estado:"confirmada",label:"Confirmar"}];
    if (c.estado === "confirmada") return [{estado:"atendida",label:"Marcar atendida"}];
    return [];
  }
  return <section className="agenda-panel border rounded p-3 mb-4" aria-label="Agenda interactiva">
    <div className="d-flex justify-content-between flex-wrap gap-2 align-items-center mb-3">
      <div><h3 className="h5 fw-bold mb-1">Calendario de citas</h3><small className="text-secondary">Solo se muestran las citas autorizadas para tu sesión.</small></div>
      <div className="btn-group" role="group" aria-label="Vista del calendario">{[["mes","Mes"],["semana","Semana"],["dia","Día"]].map(([v,t])=><button key={v} type="button" className={`btn btn-sm ${vista===v?"btn-success":"btn-outline-success"}`} aria-pressed={vista===v} onClick={()=>setVista(v)}>{t}</button>)}</div>
    </div>
    <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
      <div className="d-flex gap-2"><button type="button" className="btn btn-outline-secondary btn-sm" onClick={()=>mover(-1)} aria-label="Periodo anterior">‹</button><button type="button" className="btn btn-outline-secondary btn-sm" onClick={()=>{const d=new Date();setReferencia(d);setSeleccion(clave(d));}}>Hoy</button><button type="button" className="btn btn-outline-secondary btn-sm" onClick={()=>mover(1)} aria-label="Periodo siguiente">›</button></div>
      <strong className="text-capitalize">{etiquetaPeriodo}</strong>
      <label className="form-check-label small"><input className="form-check-input me-2" type="checkbox" checked={mostrarHistorico} onChange={e=>setMostrarHistorico(e.target.checked)}/>Mostrar canceladas</label>
    </div>
    <div className={`agenda-grid agenda-${vista}`}>
      {vista !== "dia" && DIAS.map(d=><div key={d} className="agenda-dia-cabecera">{d}</div>)}
      {dias.map(d=>{
        const k=clave(d), lista=porDia.get(k)??[];
        return <button type="button" key={k} className={`agenda-celda ${k===seleccion?"agenda-seleccionada":""} ${k===hoy?"agenda-hoy":""} ${vista==="mes"&&d.getMonth()!==referencia.getMonth()?"agenda-otro-mes":""}`} aria-label={`${fechaTitulo(d)}, ${lista.length} citas`} aria-pressed={k===seleccion} onClick={()=>seleccionar(d)}>
          <span className="agenda-numero">{vista==="dia"?fechaTitulo(d):d.getDate()}</span>
          <span className="agenda-conteo">{lista.length ? `${lista.length} cita${lista.length===1?"":"s"}` : "Sin citas"}</span>
          {lista.slice(0,vista==="mes"?2:4).map(c=><span key={c.id} className={`agenda-evento ${colores[c.estado]??""}`}>{String(c.hora).slice(0,5)} · {c.pacienteNombre || c.motivo || `Cita ${c.id}`}</span>)}
          {lista.length>(vista==="mes"?2:4)&&<span className="agenda-mas">+{lista.length-(vista==="mes"?2:4)} más</span>}
        </button>;
      })}
    </div>
    <div className="d-flex gap-3 flex-wrap my-3 small">{Object.entries({programada:"Programada",confirmada:"Confirmada",atendida:"Atendida",cancelada:"Cancelada"}).map(([k,v])=><span key={k}><i className={`agenda-leyenda ${colores[k]}`}/> {v}</span>)}</div>
    <div className="border-top pt-3" aria-live="polite">
      <h4 className="h6 text-capitalize">{fechaTitulo(fechaLocal(seleccion)??new Date())} · {delDia.length} cita(s)</h4>
      {delDia.length===0?<p className="text-secondary small mb-0">No hay citas registradas para este día.</p>:<div className="d-grid gap-2">{delDia.map(c=><div key={c.id} className="agenda-fila d-flex flex-wrap justify-content-between align-items-center gap-2 p-2 border rounded"><div><strong>{String(c.hora).slice(0,5)}</strong> · {c.pacienteNombre || `Cita #${c.id}`}<div className="small text-secondary">{c.medicoNombre || "Médico asignado"} · {c.consultorioNombre || "Consultorio asignado"} · <span className="text-capitalize">{c.estado}</span></div><div className="small">{c.motivo}</div></div><div className="d-flex gap-2"><button type="button" className="btn btn-outline-secondary btn-sm" onClick={()=>onDetalle(c)}>Detalles</button>{acciones(c).map(a=><button key={a.estado} type="button" className="btn btn-outline-success btn-sm" disabled={operando!==null} onClick={()=>onEstado(c,a.estado)}>{a.label}</button>)}</div></div>)}</div>}
    </div>
  </section>;
}
