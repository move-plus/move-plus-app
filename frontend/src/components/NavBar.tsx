import { Link, useLocation } from "react-router-dom";
import { Home, Calendar, MessageCircle, User, Plus, LayoutDashboard, LogIn } from "lucide-react";
import { useAuth } from "@/context/auth";

const NavBar = () => {
  const { user, role } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  // alunos
  const navItemsStudents = [
    { path: "/buscar-turmas", icon: Home, label: "Início" },
    { path: "/minhas-turmas", icon: Calendar, label: "Minhas Aulas" },
    { path: "/chat", icon: MessageCircle, label: "Chat" },
    { path: "/perfil", icon: User, label: "Perfil" },
  ];

  // profissionais
  const navItemsProfessionals = [
    { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/criar-turma", icon: Plus, label: "Criar Aula" },
    { path: "/chat", icon: MessageCircle, label: "Chat" },
    { path: "/perfil", icon: User, label: "Perfil" },
  ];

  // não autenticados
  const navItemsUnauth = [
    { path: "/login", icon: LogIn, label: "Login" },
  ];

  const navItems = !user || role === null 
    ? navItemsUnauth 
    : role === "student" 
    ? navItemsStudents 
    : navItemsProfessionals;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 safe-area-bottom">
      <div className="max-w-screen-xl mx-auto px-2">
        <div className="flex items-center justify-around h-16">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center flex-1 h-full transition-all ${
                  active
                    ? "text-[#5F94E2]"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Icon 
                  className={`w-6 h-6 mb-1 transition-all ${
                    active ? "scale-110" : ""
                  }`}
                  strokeWidth={active ? 2.5 : 2}
                />
                <span className={`text-xs font-medium ${
                  active ? "font-semibold" : ""
                }`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
