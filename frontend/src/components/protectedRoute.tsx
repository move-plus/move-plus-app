import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/auth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireRole?: "professional" | "student";
}

export const ProtectedRoute = ({
  children,
  requireRole,
}: ProtectedRouteProps) => {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireRole && role !== requireRole) {
    if (!role) {
      return <Navigate to="/" replace />;
    }

    const redirectPath =
      role === "professional" ? "/dashboard" : "/minhas-turmas";
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
};
