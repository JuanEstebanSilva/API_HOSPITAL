import { useMemo } from "react";

const nombresMes = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const estados = ["programada", "confirmada", "atendida", "cancelada"];

function fechaValida(cita) {
  const fecha = String(cita.fecha || "").slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(fecha) ? fecha : null;
}

export default function ResumenHospital({ datos, errores, cargando, actualizar, rol }) {
  const citas = datos.citas;
  const totales = datos.resumen?.resumen;
  const tarjetas = rol === "administrador"
    ? [["Usuarios", totales?.usuarios, errores.resumen], ["Médicos", totales?.medicos, errores.resumen], ["Pacientes", totales?.pacientes, errores.resumen], ["Citas", totales?.citas, errores.resumen], ["Consultorios", totales?.consultorios, errores.resumen]]
    : rol === "medico"
      ? [["Mis citas asignadas", citas, errores.citas], ["Programadas", Array.isArray(citas) ? citas.filter(c => c.estado === "programada") : null, errores.citas], ["Confirmadas", Array.isArray(citas) ? citas.filter(c => c.estado === "confirmada") : null, errores.citas], ["Atendidas", Array.isArray(citas) ? citas.filter(c => c.estado === "atendida") : null, errores.citas]]
      : [["Mis citas", citas, errores.citas], ["Médicos", datos.medicos, errores.medicos], ["Consultorios", datos.consultorios, errores.consultorios]];

  const resumen = useMemo(() => {
    if (!Array.isArray(citas)) return null;
    const conteo = Object.fromEntries(estados.map((estado) => [estado, 0]));
    const meses = new Map();
    citas.forEach((cita) => {
      if (Object.hasOwn(conteo, cita.estado)) conteo[cita.estado] += 1;
      const fecha = fechaValida(cita);
      if (fecha) meses.set(fecha.slice(0, 7), (meses.get(fecha.slice(0, 7)) || 0) + 1);
    });
    const serie = [...meses.entries()].sort(([a], [b]) => a.localeCompare(b)).slice(-6);
    const proximas = citas.filter((cita) => {
      const fecha = fechaValida(cita);
      return fecha && new Date(`${fecha}T${cita.hora || "00:00"}`) >= new Date() && !["cancelada", "atendida"].includes(cita.estado);
    }).sort((a, b) => `${a.fecha} ${a.hora}`.localeCompare(`${b.fecha} ${b.hora}`)).slice(0, 6);
    return { conteo, serie, proximas };
  }, [citas]);

  return (
    <section aria-label="Indicadores reales del hospital" className="hospital-live">
      <div className="hospital-live-heading"><h2>Indicadores en tiempo real</h2><button className="btn btn-outline-primary btn-sm" disabled={cargando} onClick={actualizar}>{cargando ? "Consultando…" : "Actualizar datos"}</button></div>
      <div className="hospital-live-kpis">
        {tarjetas.map(([titulo, lista, error]) => (
          <article className="hospital-card hospital-live-kpi" key={titulo}>
            <strong className="hospital-live-value">{cargando ? "…" : typeof lista === "number" ? lista : Array.isArray(lista) ? lista.length : "—"}</strong>
            <span>{titulo}</span>
            {error && <small title={error} className="text-secondary">{error}</small>}
          </article>
        ))}
      </div>
      <div className="hospital-live-panels">
        <article className="hospital-card hospital-live-panel">
          <h3>Citas por estado</h3>
          {!resumen ? <p className="text-secondary">{cargando ? "Cargando citas…" : errores.citas || "No hay información disponible"}</p> : (
            <div className="hospital-live-states">{estados.map((estado) => <div className="hospital-live-state" key={estado}><span className={`hospital-dot estado-${estado}`} /><span>{estado}</span><strong>{resumen.conteo[estado]}</strong></div>)}</div>
          )}
        </article>
        <article className="hospital-card hospital-live-panel">
          <h3>Citas por mes (datos disponibles)</h3>
          {!resumen ? <p className="text-secondary">Sin datos disponibles</p> : resumen.serie.length === 0 ? <p className="text-secondary">No hay citas fechadas</p> : (
            <div className="hospital-live-chart">{resumen.serie.map(([mes, total]) => <div className="hospital-live-bar-wrap" key={mes}><span>{total}</span><div className="hospital-live-bar" style={{ height: `${Math.max(6, (total / Math.max(...resumen.serie.map(([, n]) => n))) * 100)}%` }} title={`${mes}: ${total} citas`} /><small>{nombresMes[Number(mes.slice(5)) - 1]} {mes.slice(2, 4)}</small></div>)}</div>
          )}
        </article>
      </div>
      <article className="hospital-card hospital-live-panel">
        <h3>{rol === "administrador" ? "Próximas citas registradas" : "Mis próximas citas"}</h3>
        {!resumen ? <p className="text-secondary">{errores.citas || "Consultando…"}</p> : resumen.proximas.length === 0 ? <p className="text-secondary">No hay próximas citas registradas.</p> : (
          <div className="table-responsive"><table className="table table-hover align-middle mb-0"><thead><tr><th>Fecha</th><th>Hora</th><th>Paciente</th><th>Médico</th><th>Consultorio</th><th>Estado</th></tr></thead><tbody>{resumen.proximas.map((cita) => <tr key={cita.id}><td>{fechaValida(cita)}</td><td>{cita.hora}</td><td>{cita.pacienteNombre || (rol === "paciente" ? "Mi cita" : `ID ${cita.pacienteId}`)}</td><td>{cita.medicoNombre || `ID ${cita.medicoId}`}</td><td>{[cita.consultorioCodigo, cita.consultorioNombre].filter(Boolean).join(" · ") || `ID ${cita.consultorioId}`}</td><td><span className="badge text-bg-light">{cita.estado}</span></td></tr>)}</tbody></table></div>
        )}
        <p className="hospital-live-note">Se muestran únicamente las citas autorizadas para la cuenta autenticada.</p>
      </article>
    </section>
  );
}
