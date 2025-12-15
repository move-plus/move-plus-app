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

  // 1. ADICIONE ISTO: Rotas que exigem login, mas não ligam se o role ainda não carregou
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
  
  // 2. VERIFICAÇÃO DA NOVA ROTA
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

  // 3. LÓGICA DE LIBERAÇÃO: Se for a rota da turma, só exige User. Ignora o Role.
  if (isPublicPrivateRoute) {
    if (!user) {
       return <Navigate to="/login" state={{ from: location }} replace />;
    }
    // Se tem user, libera IMEDIATAMENTE. 
    // Não importa se o role é null, undefined ou 'student'. 
    // Deixa a página da turma lidar com isso.
    return <>{children}</>;
  }

  if (isPrivateRoute) {
    if (!user) {
      return <Navigate to="/login" state={{ from: location }} replace />;
    }
    if (!role) {
      return <Navigate to="/onboarding" replace />;
    }
  }

  else if (isProtectedRoute) {
    if (!user) return <Navigate to="/login" replace />;
    if (role) {
      if (role === "student") return <Navigate to="/minhas-turmas" replace />;
      if (role === "professional") return <Navigate to="/dashboard" replace />;
    }
  }

  else if (isGuestOnlyRoute) {
    if (user) {
      // Cenário 1: Tudo carregado corretamente -> Redireciona
      if (role === "student") return <Navigate to="/minhas-turmas" replace />;
      if (role === "professional") return <Navigate to="/dashboard" replace />;
      
      return (
        <div className="flex h-screen w-full items-center justify-center bg-[#F5F7FA]">
          <Loader2 className="h-10 w-10 animate-spin text-[#2D7DD2]" />
        </div>
      );
    }
  }

  // A "Trava de Segurança" continua aqui para outras rotas desconhecidas
  if (user && !role && !isProtectedRoute) {
    console.log('User trying acessing: ', location.pathname);
    console.log('Redirecting to onboarding because user has no role.');
    return <Navigate to="/onboarding" state={location.state || { from: location }} replace />;
  }

  return <>{children}</>;
}