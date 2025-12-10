import { Button } from "@/components/ui/button";
import { Heart, Menu, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/context/auth";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, role } = useAuth();
  const location = useLocation();

  const navItemsUnauth = [
    { path: "/", label: "Início" },
    { path: "/auth", label: "Login" },
  ];

  const navItemsStudents = [
    { path: "/minhas-turmas", label: "Minhas Turmas" },
    { path: "/buscar-aulas", label: "Buscar Aulas" },
    { path: "/perfil", label: "Perfil" },
    { path: "/chat", label: "Mensagens" },
  ];

  const navItemsProfessionals = [
    { path: "/cadastrar-aulas", label: "Cadastrar aula" },
    { path: "/dashboard", label: "Dashboard" },
    { path: "/perfil", label: "Perfil" },
    { path: "/chat", label: "Mensagens" },
  ];

  const navItems = !user || role === null ? [] : role === "student" ? navItemsStudents : navItemsProfessionals;

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b shadow-soft">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center group-hover:scale-110 transition-transform">
              <Heart className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold">
              Fit<span className="text-primary">Sênior</span>
            </span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link key={item.path} to={item.path}>
                <Button
                  variant={isActive(item.path) ? "default" : "ghost"}
                  className="text-base"
                >
                  {item.label}
                </Button>
              </Link>
            ))}
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="md:hidden py-4 space-y-2 border-t">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMenuOpen(false)}
              >
                <Button
                  variant={isActive(item.path) ? "default" : "ghost"}
                  className="w-full justify-start text-base"
                >
                  {item.label}
                </Button>
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
