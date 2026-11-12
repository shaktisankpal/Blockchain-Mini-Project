import { Navigate, Outlet } from "react-router-dom";
import authService from "../services/authService";

// Guards a group of routes: signed-out users go to the login page, wrong roles to 404.
const RoleAccess = ({ roles = [] }) => {
  if (!authService.getCurrentUser()) return <Navigate to="/login" replace />;
  const role = authService.getRole();
  return !roles.length || roles.includes(role) ? <Outlet /> : <Navigate to="/404" replace />;
};

export default RoleAccess;
