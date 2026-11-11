import { useEffect, useState } from "react";
import { consultarRecurso } from "../services/recursos.service";
import { solicitudSegura } from "../services/seguridad.service";

const rutasPorRol = {
  administrador: { medicos: "/api/medicos", pacientes: "/api/pacientes", consultorios: "/api/consultorios", citas: "/api/citas" },
  medico: { citas: "/api/citas/mis-citas" },
  paciente: { medicos: "/api/medicos", consultorios: "/api/consultorios", citas: "/api/citas/mis-citas" },
};

export function useDashboardData(token, rol) {
  const [version, setVersion] = useState(0);
  const [estado, setEstado] = useState({ datos: {}, errores: {}, cargando: true });

  useEffect(() => {
    const controller = new AbortController();
    const rutas = rutasPorRol[rol] || {};
    if (rol === "administrador") rutas.resumen = "/api/estadisticas/resumen";
    const claves = Object.keys(rutas);
    // El cambio de usuario o token provoca una carga nueva.
    Promise.allSettled(claves.map((clave) => (clave === "resumen" ? solicitudSegura(rutas[clave], { token, signal: controller.signal }) : consultarRecurso(rutas[clave], token, controller.signal))))
      .then((resultados) => {
        if (controller.signal.aborted) return;
        const datos = {};
        const errores = {};
        resultados.forEach((resultado, i) => {
          const clave = claves[i];
          if (resultado.status === "fulfilled") datos[clave] = resultado.value;
          else errores[clave] = resultado.reason?.message || "Error al consultar";
        });
        setEstado({ datos, errores, cargando: false });
      });
    return () => controller.abort();
  }, [token, rol, version]);

  return { ...estado, actualizar: () => { setEstado((prev) => ({ ...prev, cargando: true })); setVersion((v) => v + 1); } };
}
