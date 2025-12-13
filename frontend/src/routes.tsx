import { BrowserRouter, Routes as RoutesDOM, Route } from "react-router-dom";
import Header from "./components/Header";
import Index from "./pages/Index";
import SearchClasses from "./pages/SearchClasses";
import CreateClass from "./pages/CreateClass";
import Auth from "./pages/LoginEmail";
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
import LoginPhone from "./pages/LoginPhone";
import LoginEmail from "./pages/LoginEmail";
import Onboarding from "./pages/Onboarding";
import AuthGuard from "@/components/AuthGuard"; 
import SignUpEmail from "./pages/SignUpEmail";

export function Routes() {
  return (
    <AuthGuard>
      <RoutesDOM>
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<LoginPhone />} />
        <Route path="/login-profissional" element={<LoginEmail />} />
        <Route path="/signup" element={<SignUpEmail />} />
        <Route path="/onboarding" element={<Onboarding />} />
        
        <Route
          path="/minhas-turmas"
          element={
            <ProtectedRoute requireRole="student">
              <MyClasses />
            </ProtectedRoute>
          }
        />
        <Route
          path="/turma-aluno/:id"
          element={
            <ProtectedRoute requireRole="student">
              <ClassDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/buscar-turmas"
          element={
            <ProtectedRoute requireRole="student">
              <SearchClasses />
            </ProtectedRoute>
          }
        />

        {/* PROFISSIONAIS */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute requireRole="professional">
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cadastro-profissional"
          element={
            <ProtectedRoute requireRole="professional">
              <ProfessionalRegistration />
            </ProtectedRoute>
          }
        />
        <Route
          path="/turmas"
          element={
            <ProtectedRoute requireRole="professional">
              <MyClasses />
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
          path="/criar-turma"
          element={
            <ProtectedRoute requireRole="professional">
              <CreateClass />
            </ProtectedRoute>
          }
        />
        {/* COMUNS (Perfil, Chat) */}
        <Route
          path="/perfil"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        
        <Route path="*" element={<NotFound />} />
      </RoutesDOM>
    </AuthGuard>
  );
}
