import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
export default function RutaProtegida({ rolesPermitidos }) {
  const { autenticado, usuario, verificando } = useAuth();
  if (verificando) return <main className="container py-5" role="status">Verificando sesión…</main>;
  if (!autenticado) return <Navigate to="/login" replace />;
  if (rolesPermitidos && !rolesPermitidos.includes(usuario?.rol)) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
