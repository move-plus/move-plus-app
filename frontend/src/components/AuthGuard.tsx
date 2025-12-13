import { useAuth } from "@/context/auth";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  const publicRoutes = [
    "/", 
    "/login",
    "/login-profissional",
    "/signup",];

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#F5F7FA]">
        <Loader2 className="h-10 w-10 animate-spin text-[#2D7DD2]" />
      </div>
    );
  }

  if (!user) {
    if (!publicRoutes.includes(location.pathname)) {
      return <Navigate to="/login" replace />;
    }
    return <>{children}</>;
  }

  if (!role) {
    if (location.pathname !== "/onboarding") {
      return <Navigate to="/onboarding" replace />;
    }
    return <>{children}</>;
  }

  if (role) {
    if (["/", "/login", "/onboarding"].includes(location.pathname)) {
      if (role === "student") return <Navigate to="/minhas-turmas" replace />;
      if (role === "professional") return <Navigate to="/dashboard" replace />;
    }
    return <>{children}</>;
  }

  return <>{children}</>;
}