import { Navigate } from "react-router";
import { getCurrentUserRole, type UserRole } from "../api/authApi";

type RoleProtectedRouteProps = {
  allowedRoles: UserRole[];
  children: React.ReactNode;
};

export function RoleProtectedRoute({
  allowedRoles,
  children,
}: RoleProtectedRouteProps) {
  const token = sessionStorage.getItem("token");
  const role = getCurrentUserRole();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (!role || !allowedRoles.includes(role)) {
    return <Navigate to="/listings" replace />;
  }

  return children;
}