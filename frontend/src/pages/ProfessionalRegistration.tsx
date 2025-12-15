import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  GraduationCap,
  User,
  Calendar,
  FileText,
  CreditCard,
  ArrowLeft,
} from "lucide-react";
import { useAuth } from "@/context/auth";

const ProfessionalRegistration = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    cref: "",
    fullName: "",
    birthDate: "",
    specialty: "",
    cpf: "",
  });
  const { fetchRole } = useAuth();

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        console.log("Usuário não autenticado, redirecionando para signup...");
        navigate("/signup");
        return;
      }
      setUserId(user.id);
    };

    checkUser();
  }, [navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setLoading(true);

    try {
      const { error: profError } = await supabase.from("professionals").insert({
        id: userId,
        cref: formData.cref,
        specialty: formData.specialty,
      });

      if (profError) throw profError;

      toast({
        title: "Cadastro completo!",
        description: "Seu perfil profissional foi criado com sucesso.",
      });

      await fetchRole(userId);

      navigate("/dashboard");
    } catch (error: any) {
      console.error("Erro no cadastro:", error);
      toast({
        title: "Erro no cadastro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg">Verificando cadastro...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="mb-6 text-gray-600 hover:text-[#5F94E2] transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm font-medium">Voltar</span>
          </button>
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-[#1756AC] mb-2">Cadastro Profissional</h1>
            <p className="text-sm text-gray-600">
              Complete seu perfil para começar a oferecer aulas
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-[#1756AC]">Informações Profissionais</h2>
              <p className="text-sm text-gray-600 mt-1">
                Preencha todos os campos obrigatórios
              </p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="cref" className="text-sm font-medium">
                    <FileText className="w-4 h-4 inline mr-2" />
                    CREF *
                  </Label>
                  <Input
                    id="cref"
                    placeholder="Ex: 123456-G/SP"
                    value={formData.cref}
                    onChange={(e) => handleChange("cref", e.target.value)}
                    className="text-sm h-11 border-gray-300 hover:border-[#5F94E2] focus:border-[#5F94E2] transition-colors"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="specialty" className="text-sm font-medium">
                    <GraduationCap className="w-4 h-4 inline mr-2" />
                    Especialidade *
                  </Label>
                  <Input
                    id="specialty"
                    placeholder="Ex: Yoga, Pilates, Musculação"
                    value={formData.specialty}
                    onChange={(e) => handleChange("specialty", e.target.value)}
                    className="text-sm h-11 border-gray-300 hover:border-[#5F94E2] focus:border-[#5F94E2] transition-colors"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 text-base bg-[#5F94E2] hover:bg-[#1756AC] transition-colors mt-6"
                  disabled={loading}
                >
                  {loading ? "Salvando..." : "Concluir Cadastro"}
                </Button>
              </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalRegistration;
