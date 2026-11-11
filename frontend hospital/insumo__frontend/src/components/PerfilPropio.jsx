import { useEffect, useState } from "react";
import { solicitudSegura } from "../services/seguridad.service";

export default function PerfilPropio({ token, usuario, volver }) {
  const [perfil, setPerfil] = useState(null);
  const [ficha, setFicha] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      solicitudSegura("/api/auth/perfil", { token, signal: controller.signal }),
      solicitudSegura("/api/citas/mi-contexto", { token, signal: controller.signal }),
    ]).then(([p, c]) => { setPerfil(p.usuario); setFicha(c.ficha); }).catch(e => { if (e.name !== "AbortError") setError(e.message); });
    return () => controller.abort();
  }, [token]);
  const actual = perfil || usuario || {};
  return <section className="hospital-card p-4 mt-4"><h2 className="h4 fw-bold">Mi perfil</h2>
    <p className="text-secondary">Información de tu cuenta autenticada y ficha hospitalaria vinculada.</p>
    {error && <div className="alert alert-danger">{error}</div>}
    <dl className="row"><dt className="col-sm-3">Nombre de cuenta</dt><dd className="col-sm-9">{actual.nombre || "—"}</dd>
      <dt className="col-sm-3">Correo de acceso</dt><dd className="col-sm-9">{actual.email || "—"}</dd>
      <dt className="col-sm-3">Rol</dt><dd className="col-sm-9">{actual.rol || "—"}</dd>
      <dt className="col-sm-3">Ficha vinculada</dt><dd className="col-sm-9">{ficha ? ficha.nombre : "Sin ficha vinculada"}</dd>
      {ficha?.documento && <><dt className="col-sm-3">Documento</dt><dd className="col-sm-9">{ficha.documento}</dd></>}
      {ficha?.registroMedico && <><dt className="col-sm-3">Registro médico</dt><dd className="col-sm-9">{ficha.registroMedico}</dd></>}
      {ficha?.telefono && <><dt className="col-sm-3">Teléfono</dt><dd className="col-sm-9">{ficha.telefono}</dd></>}
      {ficha?.fechaNacimiento && <><dt className="col-sm-3">Nacimiento</dt><dd className="col-sm-9">{String(ficha.fechaNacimiento).slice(0, 10)}</dd></>}
    </dl><p className="text-secondary small">Los datos de identificación y vinculación se administran desde los módulos autorizados. Este perfil no permite cambiar el rol.</p>
    <button type="button" className="btn btn-outline-success" onClick={volver}>Volver al panel</button></section>;
}
