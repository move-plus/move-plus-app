import { useAuth } from "@/context/auth";
import { Navigate, useLocation, matchPath } from "react-router-dom";
import { Loader2 } from "lucide-react";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  const publicRoutes = [
    "/", 
    "/login",
    "/login-profissional",
    "/signup",
    "/turma-aluno/:id",
    "/buscar-turmas"
  ];

  const isPublicRoute = publicRoutes.some(route => 
    matchPath({ path: route, end: true }, location.pathname)
  );

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#F5F7FA]">
        <Loader2 className="h-10 w-10 animate-spin text-[#2D7DD2]" />
      </div>
    );
  }

  if (!user) {
    if (!isPublicRoute) {
      console.log('Redirecting to home from AuthGuard');
      console.log('Current path:', location.pathname);
      return <Navigate to="/" replace />;
    }
    return <>{children}</>;
  }

  if (!role) {
    if (location.pathname !== "/onboarding") {
      return <Navigate to="/" replace />;
    }
    return <>{children}</>;
  }

  if (role) {
    if (publicRoutes.includes(location.pathname) || location.pathname === "/onboarding") {
      if (role === "student") return <Navigate to="/minhas-turmas" replace />;
      if (role === "professional") return <Navigate to="/dashboard" replace />;
    }
    return <>{children}</>;
  }

  return <>{children}</>;
}