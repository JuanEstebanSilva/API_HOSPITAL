import PerfilPropio from "../components/PerfilPropio";
import GestionUsuarios from "../components/GestionUsuarios";
import GestionProfesionales from "../components/GestionProfesionales";
import GestionPacientes from "../components/GestionPacientes";
import GestionConsultorios from "../components/GestionConsultorios";
import GestionCitas from "../components/GestionCitas";
import CodigosRecuperacion from "../components/CodigosRecuperacion";
import CambiarPassword from "../components/CambiarPassword";
import RecuperacionAdministrativa from "../components/RecuperacionAdministrativa";
import { useState } from "react";
import { useDashboardData } from "../hooks/useDashboardData";
import ResumenHospital from "../components/ResumenHospital";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import equipoSalud from "../assets/equipo-salud.jpg";

const catalogo = {
  administrador: {
    titulo: "Panel administrativo",
    descripcion: "Gestión de usuarios, profesionales, pacientes y citas.",
    enlaces: [
      { icono: "♙", titulo: "Usuarios y roles", detalle: "Gestión de cuentas y permisos" },
      { icono: "⚕", titulo: "Médicos y especialidades", detalle: "Profesionales y especialidades" },
      { icono: "♡", titulo: "Pacientes", detalle: "Registro y consulta de pacientes" },
      { icono: "▣", titulo: "Consultorios", detalle: "Espacios de atención" },
      { icono: "▦", titulo: "Citas", detalle: "Programación y seguimiento" },
    ],
    indicadores: ["Usuarios", "Médicos", "Pacientes", "Citas"],
  },
  medico: {
    titulo: "Panel médico",
    descripcion: "Agenda y recursos de atención autorizados.",
    enlaces: [
      { icono: "▦", titulo: "Agenda médica", detalle: "Próximas atenciones" },
      { icono: "♡", titulo: "Citas asignadas", detalle: "Consultar citas autorizadas" },
      { icono: "♙", titulo: "Mi perfil", detalle: "Información de la cuenta" },
    ],
    indicadores: ["Citas asignadas", "Atenciones", "Agenda", "Consultas"],
  },
  paciente: {
    titulo: "Portal del paciente",
    descripcion: "Consulta de información personal y citas autorizadas.",
    enlaces: [
      { icono: "▦", titulo: "Mis citas", detalle: "Consultar mis citas" },
      { icono: "♙", titulo: "Mi perfil", detalle: "Datos personales" },
      { icono: "♧", titulo: "Seguridad de la cuenta", detalle: "Códigos de respaldo" },
    ],
    indicadores: ["Mis citas", "Próximas citas", "Atendidas", "Canceladas"],
  },
};

const RUTAS = {
  "Usuarios y roles": "/usuarios",
  "Médicos y especialidades": "/medicos",
  "Pacientes": "/pacientes",
  "Consultorios": "/consultorios",
  "Citas": "/citas",
  "Agenda médica": "/agenda",
  "Citas asignadas": "/citas-asignadas",
  "Mis citas": "/mis-citas",
  "Mi perfil": "/mi-perfil",
  "Seguridad de la cuenta": "/seguridad-cuenta",
  "Recuperación administrativa": "/recuperacion-administrativa",
  "Seguridad de mi cuenta": "/codigos-recuperacion",
  "Cambiar mi contraseña": "/cambiar-password",
};
const MODULOS_POR_RUTA = Object.fromEntries(Object.entries(RUTAS).map(([nombre, ruta]) => [ruta, nombre]));
const MODULOS_ADMIN = new Set(["Usuarios y roles", "Médicos y especialidades", "Pacientes", "Consultorios", "Citas", "Recuperación administrativa"]);
const MODULOS_MEDICO = new Set(["Agenda médica", "Citas asignadas", "Mi perfil"]);
const MODULOS_PACIENTE = new Set(["Mis citas", "Mi perfil", "Seguridad de la cuenta"]);

export default function DashboardPage() {
  const { usuario, token, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const moduloSolicitado = MODULOS_POR_RUTA[location.pathname] ?? null;
  const permitido = !moduloSolicitado ||
    ["Seguridad de mi cuenta", "Cambiar mi contraseña"].includes(moduloSolicitado) ||
    (usuario?.rol === "administrador" && MODULOS_ADMIN.has(moduloSolicitado)) ||
    (usuario?.rol === "medico" && MODULOS_MEDICO.has(moduloSolicitado)) ||
    (usuario?.rol === "paciente" && MODULOS_PACIENTE.has(moduloSolicitado));
  const moduloSeleccionado = permitido ? moduloSolicitado : null;
  const vista = catalogo[usuario?.rol] ?? catalogo.paciente;
  const nombre = usuario?.nombre || "Usuario";
  const { datos, errores, cargando, actualizar } = useDashboardData(token, usuario?.rol);

  function cerrarSesion() {
    logout();
    navigate("/login", { replace: true });
  }

  function abrirModulo(titulo) {
    navigate(titulo ? RUTAS[titulo] ?? "/dashboard" : "/dashboard");
    setMenuAbierto(false);
  }

  return (
    <div className="hospital-layout">
      {menuAbierto && <button className="hospital-overlay" aria-label="Cerrar menú" onClick={() => setMenuAbierto(false)} />}
      <aside className={`hospital-sidebar ${menuAbierto ? "hospital-sidebar-open" : ""}`}>
        <div className="hospital-logo"><span className="hospital-logo-icon">H+</span><span>API Hospital</span></div>
        <div className="hospital-menu-label">MENÚ PRINCIPAL</div>
        <nav aria-label="Navegación principal" className="hospital-menu">
          <button className={!moduloSeleccionado ? "activo" : ""} onClick={() => abrirModulo(null)}><span>⌂</span> Inicio</button>
          {vista.enlaces.map((enlace) => (
            <button key={enlace.titulo} className={moduloSeleccionado === enlace.titulo ? "activo" : ""} onClick={() => abrirModulo(enlace.titulo)}>
              <span>{enlace.icono}</span>{enlace.titulo}
            </button>
          ))}
          {usuario?.rol === "administrador" && <button className={moduloSeleccionado === "Recuperación administrativa" ? "activo" : ""} onClick={() => abrirModulo("Recuperación administrativa")}><span>♧</span> Recuperación administrativa</button>}
          {usuario?.rol !== "paciente" && <button className={moduloSeleccionado === "Seguridad de mi cuenta" ? "activo" : ""} onClick={() => abrirModulo("Seguridad de mi cuenta")}><span>♧</span> Códigos de recuperación</button>}
          <button className={moduloSeleccionado === "Cambiar mi contraseña" ? "activo" : ""} onClick={() => abrirModulo("Cambiar mi contraseña")}><span>♧</span> Cambiar mi contraseña</button>
        </nav>
        <div className="hospital-sidebar-footer"><button onClick={cerrarSesion}><span>⇥</span> Cerrar sesión</button></div>
      </aside>

      <div className="hospital-main">
        <header className="hospital-topbar">
          <button className="hospital-menu-toggle" onClick={() => setMenuAbierto(true)} aria-label="Abrir menú">☰</button>
          <span className="hospital-topbar-name">H+ API Hospital</span>
          <div className="hospital-user-chip"><span className="hospital-avatar">{nombre.charAt(0).toUpperCase()}</span><span><strong>{nombre}</strong><small>{usuario?.rol}</small></span></div>
          <button className="hospital-logout-top" onClick={cerrarSesion}>Salir</button>
        </header>

        <main className="hospital-content">
          <div className="hospital-breadcrumb">⌂ &nbsp; Inicio &nbsp; / &nbsp; {moduloSeleccionado || vista.titulo}</div>
          <section className="hospital-hero">
            <div className="hospital-hero-text">
              <p className="mb-1">Bienvenido,</p>
              <h1>{nombre}</h1>
              <p>{vista.descripcion}</p>
              <span className="hospital-role-pill">✦ Rol: {usuario?.rol}</span>
            </div>
            <img src={equipoSalud} alt="Equipo de profesionales de salud" className="hospital-hero-image" />
          </section>

          {moduloSeleccionado === "Usuarios y roles" && usuario?.rol === "administrador" ? (
            <GestionUsuarios token={token} volver={() => abrirModulo(null)} />
          ) : moduloSeleccionado === "Médicos y especialidades" && usuario?.rol === "administrador" ? (
            <GestionProfesionales token={token} volver={() => abrirModulo(null)} />
          ) : moduloSeleccionado === "Pacientes" && usuario?.rol === "administrador" ? (
            <GestionPacientes token={token} rol={usuario?.rol} volver={() => abrirModulo(null)} />
          ) : moduloSeleccionado === "Consultorios" && usuario?.rol === "administrador" ? (
            <GestionConsultorios token={token} volver={() => abrirModulo(null)} />
          ) : moduloSeleccionado === "Citas" && usuario?.rol === "administrador" ? (
            <GestionCitas token={token} rol={usuario?.rol} volver={() => abrirModulo(null)} />
          ) : ["Mis citas", "Citas asignadas", "Agenda médica"].includes(moduloSeleccionado) ? (
            <GestionCitas token={token} rol={usuario?.rol} modoAgenda={moduloSeleccionado === "Agenda médica"} volver={() => abrirModulo(null)} />
          ) : moduloSeleccionado === "Recuperación administrativa" && usuario?.rol === "administrador" ? (
            <RecuperacionAdministrativa volver={() => abrirModulo(null)} />
          ) : ["Seguridad de mi cuenta", "Seguridad de la cuenta"].includes(moduloSeleccionado) ? (
            <CodigosRecuperacion volver={() => abrirModulo(null)} />
          ) : moduloSeleccionado === "Mi perfil" ? (
            <PerfilPropio token={token} usuario={usuario} volver={() => abrirModulo(null)} />
          ) : moduloSeleccionado === "Cambiar mi contraseña" ? (
            <CambiarPassword volver={() => abrirModulo(null)} />
          ) : moduloSeleccionado ? (
            <section className="hospital-card p-4 mt-4">
              <h2 className="h4 fw-bold">{moduloSeleccionado}</h2>
              <p className="text-secondary mb-0">El acceso visual está preparado. Las operaciones y permisos de este módulo se integrarán con la API REST en las próximas etapas.</p>
              <button className="btn btn-outline-success mt-3" onClick={() => abrirModulo(null)}>Volver al panel</button>
            </section>
          ) : (
            <>
              <ResumenHospital datos={datos} errores={errores} cargando={cargando} actualizar={actualizar} rol={usuario?.rol} />
              <section className="hospital-panels">
                <div className="hospital-card hospital-profile">
                  <h2>Usuario autenticado</h2>
                  <p><strong>Nombre:</strong> {nombre}</p>
                  <p className="text-break"><strong>Correo:</strong> {usuario?.email}</p>
                  <p><strong>Rol:</strong> {usuario?.rol}</p>
                  <div className="hospital-token-status">● JWT en memoria: {token ? "Sí" : "No"}</div>
                </div>
                <div className="hospital-card hospital-modules">
                  <h2>Módulos del sistema</h2>
                  <div className="hospital-module-grid">
                    {vista.enlaces.map((enlace) => (
                      <button key={enlace.titulo} className="hospital-module" onClick={() => abrirModulo(enlace.titulo)}>
                        <span className="hospital-module-icon">{enlace.icono}</span>
                        <span><strong>{enlace.titulo}</strong><small>{enlace.detalle}</small></span>
                        <span className="hospital-module-arrow">›</span>
                      </button>
                    ))}
                  </div>
                </div>
              </section>
            </>
          )}
          <footer className="hospital-footer">API Hospital · LAB 12.5.1 · React + Vite + Bootstrap 5.3</footer>
        </main>
      </div>
    </div>
  );
}
