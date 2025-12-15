import { useState } from "react";
import { useNavigate, useLocation} from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Onboarding() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user, fetchRole } = useAuth();
  
  const [name, setName] = useState("");

  const handleFinish = async () => {
    try {
      const { error } = await supabase
        .from("profiles")
        .upsert({ 
          id: user.id, 
          full_name: name,
          role: "student",
          phone: user.phone || user.user_metadata?.phone || null 
        });

      if (error) throw error;
      
      toast({ title: "Cadastro completo!" });
      
    await fetchRole(user.id);
    navigate(location.state?.from?.pathname || "/minhas-turmas", { replace: true });

    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      // qualquer limpeza se necessário
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F5F7FA] px-6">
      <div className="w-full max-w-lg space-y-8 animate-in fade-in duration-700">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Bem-vindo!
          </h1>
          <p className="mt-2 text-lg text-gray-500">
            Vamos começar pelo seu nome.
          </p>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <label className="text-sm font-bold text-gray-700 ml-1">
              Nome Completo
            </label>
            <Input
              placeholder="Ex: Maria da Silva"
              className="mt-2 h-16 text-xl bg-gray-50"
              value={name}
              onChange={(e: { target: { value: any; }; }) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <Button 
            size="lg"
            className="w-full h-16 text-xl font-bold bg-[#2D7DD2] rounded-xl"
            onClick={() => handleFinish()}
          >
            Continuar <ArrowRight className="ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}