import { BrowserRouter, Routes as RoutesDOM, Route } from "react-router-dom";
import Header from "./components/Header";
import Index from "./pages/Index";
import SearchClasses from "./pages/SearchClasses";
import CreateClass from "./pages/CreateClass";
import Auth from "./pages/Auth";
import ProfessionalRegistration from "./pages/ProfessionalRegistration";
import StudentRegistration from "./pages/StudentRegistration";
import Dashboard from "./pages/Dashboard";
import ClassManagement from "./pages/ClassManagement";
import ClassDetails from "./pages/ClassDetails";
import MyClasses from "./pages/MyClasses";
import Financial from "./pages/Financial";
import NotFound from "./pages/NotFound";
import { ProtectedRoute } from "@/components/protectedRoute";
import Profile from "./pages/Profile";
import PrivateChat from "./pages/PrivateChat";

export function Routes() {
  return (
    <RoutesDOM>
      <Route path="/" element={<Index />} />
      <Route path="/auth" element={<Auth />} />

      {/* Rotas públicas autenticadas */}
      <Route
        path="/buscar-aulas"
        element={
          <ProtectedRoute>
            <SearchClasses />
          </ProtectedRoute>
        }
      />

      {/* Rotas apenas para profissionais */}
      <Route
        path="/cadastrar-aulas"
        element={
          <ProtectedRoute requireRole="professional">
            <CreateClass />
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute requireRole="professional">
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/turma/:id"
        element={
          <ProtectedRoute requireRole="professional">
            <ClassManagement />
          </ProtectedRoute>
        }
      />

      <Route
        path="/financeiro"
        element={
          <ProtectedRoute requireRole="professional">
            <Financial />
          </ProtectedRoute>
        }
      />

      {/* Rotas apenas para estudantes */}
      <Route
        path="/turma-aluno/:id"
        element={
          <ProtectedRoute requireRole="student">
            <ClassDetails />
          </ProtectedRoute>
        }
      />

      <Route
        path="/minhas-turmas"
        element={
          <ProtectedRoute requireRole="student">
            <MyClasses />
          </ProtectedRoute>
        }
      />

      {/* Rotas de cadastro - protegidas mas sem role específica */}
      <Route
        path="/cadastro-profissional"
        element={
          <ProtectedRoute>
            <ProfessionalRegistration />
          </ProtectedRoute>
        }
      />

      <Route
        path="/cadastro-aluno"
        element={
          <ProtectedRoute>
            <StudentRegistration />
          </ProtectedRoute>
        }
      />

      <Route
        path="/perfil"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />

      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <PrivateChat />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<NotFound />} />
    </RoutesDOM>
  );
}
