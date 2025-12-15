import { useAuth } from "@/context/auth";
import { Navigate, useLocation, matchPath } from "react-router-dom";
import { Loader2 } from "lucide-react";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  const guestOnlyRoutes = [
    "/login",
    "/login-profissional",
    "/signup",
    "/",
  ];

  const protectedRoutes = [
    "/onboarding",
    "/cadastro-profissional",
  ];

  const privateRoutes = [
    "/minhas-turmas",
    "/dashboard",
    "/profile",
    "/turmas",
    "/turma/:id",
    "/criar-turma",
  ];

  const publicPrivateRoutes = [
    "/turma-aluno/:id"
  ];

  const isGuestOnlyRoute = guestOnlyRoutes.some(route =>
    matchPath({ path: route, end: true }, location.pathname)
  );

  const isProtectedRoute = protectedRoutes.some(route =>
    matchPath({ path: route, end: true }, location.pathname)
  );

  const isPrivateRoute = privateRoutes.some(route =>
    matchPath({ path: route, end: true }, location.pathname)
  );
  
  const isPublicPrivateRoute = publicPrivateRoutes.some(route =>
    matchPath({ path: route, end: true }, location.pathname)
  );

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#F5F7FA]">
        <Loader2 className="h-10 w-10 animate-spin text-[#2D7DD2]" />
      </div>
    );
  }

  if (isPrivateRoute) {
    if (!user) {
      return <Navigate to="/login" state={{ from: location }} replace />;
    }
  }

  if (isPublicPrivateRoute) {
    if (user && !role) {
      return <Navigate to="/onboarding" replace />;
    }
    return <>{children}</>;
  }

  else if (isGuestOnlyRoute) {
    if (user) {
      if (role === "student") return <Navigate to="/minhas-turmas" replace />;
      if (role === "professional") return <Navigate to="/dashboard" replace />;
      return (
        <div className="flex h-screen w-full items-center justify-center bg-[#F5F7FA]">
          <Loader2 className="h-10 w-10 animate-spin text-[#2D7DD2]" />
        </div>
      );
    }
  }

  return <>{children}</>;
}