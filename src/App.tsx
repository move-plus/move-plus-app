import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter } from "react-router-dom";
import Header from "./components/Header";
import { Routes } from "./routes";
import { StrictMode } from "react";
import { AuthProvider } from "./context/auth";

const App = () => (
  <StrictMode>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Header />
          <Routes />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </StrictMode>
);

export default App;
