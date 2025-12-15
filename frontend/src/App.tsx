import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, useLocation } from "react-router-dom";
import NavBar from "./components/NavBar";
import { Routes } from "./routes";
import { StrictMode } from "react";
import { AuthProvider } from "./context/auth";

const AppContent = () => {
  const location = useLocation();
  const hideNavBar = [
    "/",
    "/login",
    "/login-profissional",
    "/signup",
    "/onboarding",
    "/cadastro-idoso",
    "/cadastro-profissional"
  ].includes(location.pathname);

  return (
    <>
      <Routes />
      {!hideNavBar && <NavBar />}
    </>
  );
};

const App = () => (
  <StrictMode>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </StrictMode>
);

export default App;
