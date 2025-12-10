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
} from "lucide-react";

const ProfessionalRegistration = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    cref: "",
    fullName: "",
    birthDate: "",
    specialty: "",
    cpf: "",
  });

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      setUserId(user.id);

      // Check if professional profile already exists
      const { data: professional } = await supabase
        .from("professionals")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (professional) {
        navigate("/dashboard");
      }
    };

    checkUser();
  }, [navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setLoading(true);

    try {
      // Insert professional data
      const { error: profError } = await supabase.from("professionals").insert({
        user_id: userId,
        cref: formData.cref,
        full_name: formData.fullName,
        birth_date: formData.birthDate,
        specialty: formData.specialty,
        cpf: formData.cpf,
      });

      if (profError) throw profError;

      toast({
        title: "Cadastro completo!",
        description: "Seu perfil profissional foi criado com sucesso.",
      });

      // ✅ Mudança aqui: redireciona para /profile após cadastro
      navigate("/profile");
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
    <div className="min-h-screen bg-gradient-hero">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold mb-4">Cadastro Profissional</h1>
            <p className="text-xl text-muted-foreground">
              Complete seu perfil para começar a oferecer aulas
            </p>
          </div>

          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle>Informações Profissionais</CardTitle>
              <CardDescription>
                Preencha todos os campos obrigatórios
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="cref" className="text-base">
                    <FileText className="w-4 h-4 inline mr-2" />
                    CREF *
                  </Label>
                  <Input
                    id="cref"
                    placeholder="Ex: 123456-G/SP"
                    value={formData.cref}
                    onChange={(e) => handleChange("cref", e.target.value)}
                    className="text-base h-12"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-base">
                    <User className="w-4 h-4 inline mr-2" />
                    Nome Completo *
                  </Label>
                  <Input
                    id="fullName"
                    placeholder="Digite seu nome completo"
                    value={formData.fullName}
                    onChange={(e) => handleChange("fullName", e.target.value)}
                    className="text-base h-12"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="birthDate" className="text-base">
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Data de Nascimento *
                  </Label>
                  <Input
                    id="birthDate"
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => handleChange("birthDate", e.target.value)}
                    className="text-base h-12"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="specialty" className="text-base">
                    <GraduationCap className="w-4 h-4 inline mr-2" />
                    Especialidade *
                  </Label>
                  <Input
                    id="specialty"
                    placeholder="Ex: Yoga, Pilates, Musculação"
                    value={formData.specialty}
                    onChange={(e) => handleChange("specialty", e.target.value)}
                    className="text-base h-12"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cpf" className="text-base">
                    <CreditCard className="w-4 h-4 inline mr-2" />
                    CPF *
                  </Label>
                  <Input
                    id="cpf"
                    placeholder="000.000.000-00"
                    value={formData.cpf}
                    onChange={(e) => handleChange("cpf", e.target.value)}
                    className="text-base h-12"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full text-lg"
                  disabled={loading}
                >
                  {loading ? "Salvando..." : "Concluir Cadastro"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalRegistration;
