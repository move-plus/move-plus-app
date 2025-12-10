import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import HowItWorks from "@/components/HowItWorks";
import ClassShowcase from "@/components/ClassShowcase";
import ForProfessionals from "@/components/ForProfessionals";
import CTA from "@/components/CTA";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Briefcase } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUserRole();
  }, []);

  const checkUserRole = async () => {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      setLoading(false);
      return;
    }

    // Verifica role na tabela profiles (coluna role)
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .maybeSingle();

    if (error) throw error;

    if (!profile?.role) {
      setShowRoleSelection(true);
    }
  } catch (error) {
    console.error("Error checking role:", error);
  } finally {
    setLoading(false);
  }
};

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Carregando...
      </div>
    );
  }

  if (showRoleSelection) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-hero p-4">
        <Card className="w-full max-w-2xl shadow-medium">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl">Bem-vindo ao FitSênior!</CardTitle>
            <CardDescription className="text-lg">
              Como você gostaria de usar a plataforma?
            </CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-6">
            <Card
              className="cursor-pointer hover:shadow-lg transition-all border-2 hover:border-primary"
              onClick={() => navigate("/cadastro-aluno")}
            >
              <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-2xl font-bold">Sou Aluno</h3>
                <p className="text-center text-muted-foreground">
                  Quero participar de aulas e atividades físicas
                </p>
                <Button className="w-full">Continuar como Aluno</Button>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer hover:shadow-lg transition-all border-2 hover:border-primary"
              onClick={() => navigate("/cadastro-profissional")}
            >
              <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <Briefcase className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-2xl font-bold">Sou Profissional</h3>
                <p className="text-center text-muted-foreground">
                  Quero criar e gerenciar turmas de atividades físicas
                </p>
                <Button className="w-full">Continuar como Profissional</Button>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <main className="min-h-screen">
      <Hero />
      <Features />
      <HowItWorks />
      <ClassShowcase />
      <ForProfessionals />
      <CTA />
    </main>
  );
};

export default Index;
