import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  GraduationCap,
  MapPin,
  Calendar,
  Users,
  FileText,
  Lightbulb,
} from "lucide-react";

const CreateDemand = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [studentId, setStudentId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    tipo: "",
    localizacao: "",
    horario: "",
    descricao: "",
    nivel: "",
  });

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast({
          title: "Acesso Negado",
          description: "Você precisa estar logado para criar uma demanda.",
          variant: "destructive",
        });
        navigate("/login");
        return;
      }

      setStudentId(user.id);
    };

    checkAuth();
  }, [navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.tipo ||
      !formData.localizacao ||
      !formData.horario ||
      !studentId
    ) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("Demandas").insert({
        student_id: studentId,
        tipo: formData.tipo,
        localizacao: formData.localizacao,
        horario: formData.horario,
        descricao: formData.descricao,
        nivel: formData.nivel,
        atendida: false,
      });

      if (error) throw error;

      toast({
        title: "Demanda Criada!",
        description: "Profissionais poderão ver sua solicitação e criar turmas para você.",
      });

      navigate("/buscar-turmas");
    } catch (error: any) {
      toast({
        title: "Erro ao criar demanda",
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white pb-24">
      <PageHeader title="Solicitar Nova Turma" />
      
      <div className="container max-w-6xl mx-auto px-4">
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="mb-8">
                <h2 className="text-xl font-bold text-[#1756AC]">
                  Não encontrou a turma ideal?
                </h2>
                <p className="text-gray-600 mt-2 text-sm">
                  Conte-nos o que você procura e profissionais poderão criar turmas
                  que atendam sua necessidade!
                </p>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="tipo" className="text-sm font-medium">
                    <FileText className="w-4 h-4 inline mr-2" />
                    Tipo de Atividade *
                  </Label>
                  <Select
                    value={formData.tipo}
                    onValueChange={(value) => handleChange("tipo", value)}
                  >
                    <SelectTrigger id="tipo" className="text-sm h-11 border-gray-300 hover:border-[#5F94E2] transition-colors">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="Ao Ar Livre" className="hover:bg-blue-50 cursor-pointer">Ao Ar Livre</SelectItem>
                      <SelectItem value="Yoga" className="hover:bg-blue-50 cursor-pointer">Yoga</SelectItem>
                      <SelectItem value="Musculação" className="hover:bg-blue-50 cursor-pointer">Musculação</SelectItem>
                      <SelectItem value="Pilates" className="hover:bg-blue-50 cursor-pointer">Pilates</SelectItem>
                      <SelectItem value="Hidroginástica" className="hover:bg-blue-50 cursor-pointer">Hidroginástica</SelectItem>
                      <SelectItem value="Dança" className="hover:bg-blue-50 cursor-pointer">Dança</SelectItem>
                      <SelectItem value="Alongamento" className="hover:bg-blue-50 cursor-pointer">Alongamento</SelectItem>
                      <SelectItem value="Caminhada" className="hover:bg-blue-50 cursor-pointer">Caminhada</SelectItem>
                      <SelectItem value="Natação" className="hover:bg-blue-50 cursor-pointer">Natação</SelectItem>
                      <SelectItem value="Outros" className="hover:bg-blue-50 cursor-pointer">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="localizacao" className="text-sm font-medium">
                    <MapPin className="w-4 h-4 inline mr-2" />
                    Localização Preferida *
                  </Label>
                  <Input
                    id="localizacao"
                    placeholder="Ex: Parque da Cidade, Bairro Centro, etc."
                    value={formData.localizacao}
                    onChange={(e) => handleChange("localizacao", e.target.value)}
                    className="text-sm h-11 border-gray-300 hover:border-[#5F94E2] focus:border-[#5F94E2] transition-colors"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="horario" className="text-sm font-medium">
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Horário Preferido *
                  </Label>
                  <Input
                    id="horario"
                    placeholder="Ex: Manhã (8h às 10h), Segunda e Quarta, etc."
                    value={formData.horario}
                    onChange={(e) => handleChange("horario", e.target.value)}
                    className="text-sm h-11 border-gray-300 hover:border-[#5F94E2] focus:border-[#5F94E2] transition-colors"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nivel" className="text-sm font-medium">
                    <GraduationCap className="w-4 h-4 inline mr-2" />
                    Nível Desejado
                  </Label>
                  <Select
                    value={formData.nivel}
                    onValueChange={(value) => handleChange("nivel", value)}
                  >
                    <SelectTrigger id="nivel" className="text-sm h-11 border-gray-300 hover:border-[#5F94E2] transition-colors">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="Iniciante" className="hover:bg-blue-50 cursor-pointer">Iniciante</SelectItem>
                      <SelectItem value="Intermediário" className="hover:bg-blue-50 cursor-pointer">Intermediário</SelectItem>
                      <SelectItem value="Avançado" className="hover:bg-blue-50 cursor-pointer">Avançado</SelectItem>
                      <SelectItem value="Todos os níveis" className="hover:bg-blue-50 cursor-pointer">Todos os níveis</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descricao" className="text-sm font-medium">
                    Observações Adicionais
                  </Label>
                  <Textarea
                    id="descricao"
                    placeholder="Conte mais sobre o que você procura, suas preferências, limitações físicas, etc."
                    value={formData.descricao}
                    onChange={(e) => handleChange("descricao", e.target.value)}
                    className="text-sm min-h-24 border-gray-300 hover:border-[#5F94E2] focus:border-[#5F94E2] transition-colors"
                    rows={4}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 text-base bg-[#25C588] hover:bg-[#1ea871] transition-colors mt-6"
                  disabled={loading}
                >
                  {loading ? "Enviando..." : "Enviar Solicitação"}
                </Button>
              </form>
            </div>
          </div>

          <div className="space-y-5">
            <div className="bg-white rounded-xl shadow-sm border p-5">
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="h-5 w-5 text-[#5F94E2]" />
                <h3 className="text-lg font-bold text-[#1756AC]">Como funciona?</h3>
              </div>
              <div className="space-y-4 text-sm">
                <div className="space-y-1">
                  <h4 className="font-semibold text-sm">1️⃣ Você Solicita</h4>
                  <p className="text-gray-600 text-xs leading-relaxed">
                    Preencha o formulário com a atividade que você procura.
                  </p>
                </div>
                <div className="space-y-1">
                  <h4 className="font-semibold text-sm">2️⃣ Profissionais Veem</h4>
                  <p className="text-gray-600 text-xs leading-relaxed">
                    Sua solicitação fica visível para todos os profissionais cadastrados.
                  </p>
                </div>
                <div className="space-y-1">
                  <h4 className="font-semibold text-sm">3️⃣ Turma Criada</h4>
                  <p className="text-gray-600 text-xs leading-relaxed">
                    Profissionais podem criar turmas baseadas na sua demanda.
                  </p>
                </div>
                <div className="space-y-1">
                  <h4 className="font-semibold text-sm">4️⃣ Você é Notificado</h4>
                  <p className="text-gray-600 text-xs leading-relaxed">
                    Quando uma turma for criada, você pode se inscrever!
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#25C588] to-[#1ea871] rounded-xl shadow-sm p-5">
              <div className="space-y-3">
                <div className="text-center">
                  <Users className="h-10 w-10 text-white mx-auto mb-2" />
                  <div className="text-sm font-medium text-white/90">
                    Sua voz importa!
                  </div>
                </div>
                <p className="text-xs text-center text-white/90 leading-relaxed">
                  Ao criar uma demanda, você ajuda profissionais a entenderem
                  melhor o que a comunidade precisa.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateDemand;
