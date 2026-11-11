import { useState } from "react";
import GestionEspecialidades from "./GestionEspecialidades";
import GestionMedicos from "./GestionMedicos";

export default function GestionProfesionales({ token, volver }) {
  const [seccion, setSeccion] = useState("medicos");
  return (
    <>
      <div className="d-flex gap-2 mt-4" role="group" aria-label="Secciones de profesionales">
        <button className={`btn ${seccion === "medicos" ? "btn-success" : "btn-outline-success"}`} onClick={() => setSeccion("medicos")}>Médicos</button>
        <button className={`btn ${seccion === "especialidades" ? "btn-success" : "btn-outline-success"}`} onClick={() => setSeccion("especialidades")}>Especialidades</button>
      </div>
      {seccion === "medicos" ? <GestionMedicos token={token} /> : <GestionEspecialidades token={token} volver={volver} />}
      {seccion === "medicos" && <button className="btn btn-outline-success mt-3" onClick={volver}>Volver al panel</button>}
    </>
  );
}
