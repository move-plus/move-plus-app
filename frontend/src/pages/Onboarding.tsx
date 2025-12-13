import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, GraduationCap, ArrowRight, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Onboarding() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, role, loading, fetchRole } = useAuth();
  
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (loading) return;

    if (role) {
      if (role === "student") navigate("/minhas-turmas", { replace: true });
      else if (role === "professional") navigate("/dashboard", { replace: true });
      return;
    }

    const timer = setTimeout(() => {
      setIsChecking(false);
    }, 800);

    return () => clearTimeout(timer);
  }, [role, loading, navigate]);


  const handleFinish = async (selectedRole: "student" | "professional") => {
    if (!user) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .upsert({ 
          id: user.id, 
          full_name: name,
          role: selectedRole,
          phone: user.phone || user.user_metadata?.phone || null 
        });

      if (error) throw error;
      
      toast({ title: "Cadastro completo!" });
      
    await fetchRole(user.id);
    if (selectedRole === "student") navigate("/minhas-turmas");
    else navigate("/dashboard");

    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading || isChecking || role) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F5F7FA]">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <Loader2 className="h-12 w-12 animate-spin text-[#2D7DD2]" />
          <p className="text-gray-500 font-medium">
            {role ? "Entrando..." : "Verificando seu perfil..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F5F7FA] px-6">
      <div className="w-full max-w-lg space-y-8 animate-in fade-in duration-700">
        
        <div className="flex gap-2">
          <div className={`h-2 flex-1 rounded-full ${step >= 1 ? "bg-[#2D7DD2]" : "bg-gray-200"}`} />
          <div className={`h-2 flex-1 rounded-full ${step >= 2 ? "bg-[#2D7DD2]" : "bg-gray-200"}`} />
        </div>

        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            {step === 1 ? "Bem-vindo!" : "Qual seu objetivo?"}
          </h1>
          <p className="mt-2 text-lg text-gray-500">
            {step === 1 ? "Vamos começar pelo seu nome." : "Como você vai usar o app?"}
          </p>
        </div>

        {step === 1 && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <label className="text-sm font-bold text-gray-700 ml-1">Nome Completo</label>
              <Input
                placeholder="Ex: Maria da Silva"
                className="mt-2 h-16 text-xl bg-gray-50"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>
            <Button 
              size="lg"
              className="w-full h-16 text-xl font-bold bg-[#2D7DD2] rounded-xl"
              onClick={() => name.length > 2 ? setStep(2) : toast({ title: "Digite seu nome" })}
            >
              Continuar <ArrowRight className="ml-2" />
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="grid gap-4">
            <button
              onClick={() => handleFinish("student")}
              disabled={saving}
              className="group flex items-center gap-6 rounded-3xl bg-white p-6 text-left shadow-sm hover:border-[#2D7DD2] border-2 border-transparent transition-all"
            >
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-[#2D7DD2]">
                <User className="h-10 w-10" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Sou Aluno(a)</h3>
                <p className="text-gray-500">Quero me exercitar.</p>
              </div>
            </button>

            <button
              onClick={() => handleFinish("professional")}
              disabled={saving}
              className="group flex items-center gap-6 rounded-3xl bg-white p-6 text-left shadow-sm hover:border-[#E76F51] border-2 border-transparent transition-all"
            >
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-[#E76F51]">
                <GraduationCap className="h-10 w-10" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Sou Professor(a)</h3>
                <p className="text-gray-500">Quero dar aulas.</p>
              </div>
            </button>
            
            {saving && <div className="flex justify-center"><Loader2 className="animate-spin" /></div>}
          </div>
        )}
      </div>
    </div>
  );
}