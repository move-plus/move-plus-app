import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
  DollarSign,
  Users,
  FileText,
} from "lucide-react";

import { AddressAutocomplete } from "@/components/AddressAutocomplete";

const CreateClass = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [professionalId, setProfessionalId] = useState<string | null>(null);
  const [mapUrl, setMapUrl] = useState("");

  // 1. Recebendo os dados extras do Dashboard
  const demandData = location.state as {
    demandId?: string;
    activity?: string;
    schedule?: string;
    location?: string;
    description?: string; // Novo: observacoes vem aqui
    level?: string;       // Novo: nivel vem aqui
  } | null;

  // 2. Preenchendo o formulário com os dados recebidos
  const [formData, setFormData] = useState({
    title: demandData?.activity || "",
    category: "",
    description: demandData?.description || "", // Atualiza a descrição
    schedule: demandData?.schedule || "",
    location_address: demandData?.location || "",
    lat: null as number | null,
    lng: null as number | null, 
    capacity: "",
    price: "",
    level: demandData?.level || "",             // Atualiza o nível
  });

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast({
          title: "Acesso Negado",
          description: "Você precisa estar logado como profissional para acessar esta página.",
          variant: "destructive",
        });
        navigate("/login-profissional");
        return;
      }

      setProfessionalId(user.id);
    };

    checkAuth();
  }, [navigate, toast]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.title ||
      !formData.category ||
      !formData.location_address ||
      !formData.schedule ||
      !professionalId
    ) {
      console.log("Dados do formulário incompletos:", formData);
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });

      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("classes").insert({
        professional_id: professionalId,
        title: formData.title,
        description: formData.description, // Agora envia a descrição corretamente
        category: formData.category,
        schedule: formData.schedule,
        capacity: parseInt(formData.capacity) || 10,
        location_address: formData.location_address,
        lat: formData.lat, 
        lng: formData.lng, 
        price: parseFloat(formData.price) || 0,
        level: formData.level,
    });

      if (error) throw error;

      if (demandData?.demandId) {
        const { error: updateError } = await supabase
          .from("Demandas" as any) 
          .update({ atendida: true })
          .eq("id", demandData.demandId);

      if (updateError) {
          console.error("Erro ao atualizar status da demanda:", updateError);
        }}

      toast({
        title: "Turma Cadastrada!",
        description: "Sua turma foi criada com sucesso.",
      });

      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Erro ao cadastrar turma",
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
      <PageHeader title="Cadastrar Nova Aula" />
      
      <div className="container max-w-6xl mx-auto px-4">
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="mb-8">
                <h2 className="text-xl font-bold text-[#1756AC]">Informações da Aula</h2>
                <p className="text-gray-600 mt-2 text-sm">
                  Quanto mais detalhes você fornecer, mais fácil será para os
                  alunos encontrarem sua aula
                </p>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-sm font-medium">
                      <FileText className="w-4 h-4 inline mr-2" />
                      Título da Aula *
                    </Label>
                    <Input
                      id="title"
                      placeholder="Ex: Yoga para Iniciantes"
                      value={formData.title}
                      onChange={(e) => handleChange("title", e.target.value)}
                      className="text-sm h-11 border-gray-300 hover:border-[#5F94E2] focus:border-[#5F94E2] transition-colors"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-sm font-medium">
                      Descrição
                    </Label>
                    <Textarea
                      id="description"
                      placeholder="Descreva sua aula, metodologia, benefícios..."
                      value={formData.description}
                      onChange={(e) =>
                        handleChange("description", e.target.value)
                      }
                      className="text-sm min-h-24 border-gray-300 hover:border-[#5F94E2] focus:border-[#5F94E2] transition-colors"
                      rows={5}
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category" className="text-sm font-medium">
                        Categoria *
                      </Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) =>
                          handleChange("category", value)
                        }
                      >
                        <SelectTrigger id="category" className="text-sm h-11 border-gray-300 hover:border-[#5F94E2] transition-colors">
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          <SelectItem value="outdoor" className="hover:bg-blue-50 cursor-pointer">Ao Ar Livre</SelectItem>
                          <SelectItem value="yoga" className="hover:bg-blue-50 cursor-pointer">Yoga</SelectItem>
                          <SelectItem value="gym" className="hover:bg-blue-50 cursor-pointer">Musculação</SelectItem>
                          <SelectItem value="pilates" className="hover:bg-blue-50 cursor-pointer">Pilates</SelectItem>
                          <SelectItem value="water" className="hover:bg-blue-50 cursor-pointer">Hidroginástica</SelectItem>
                          <SelectItem value="dance" className="hover:bg-blue-50 cursor-pointer">Dança</SelectItem>
                          <SelectItem value="stretch" className="hover:bg-blue-50 cursor-pointer">Alongamento</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="level" className="text-sm font-medium">
                        <GraduationCap className="w-4 h-4 inline mr-2" />
                        Nível *
                      </Label>
                      <Select
                        value={formData.level}
                        onValueChange={(value) => handleChange("level", value)}
                      >
                        <SelectTrigger id="level" className="text-sm h-11 border-gray-300 hover:border-[#5F94E2] transition-colors">
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          <SelectItem value="Iniciante" className="hover:bg-blue-50 cursor-pointer">Iniciante</SelectItem>
                          <SelectItem value="Intermediário" className="hover:bg-blue-50 cursor-pointer">
                            Intermediário
                          </SelectItem>
                          <SelectItem value="Avançado" className="hover:bg-blue-50 cursor-pointer">Avançado</SelectItem>
                          <SelectItem value="Todos os níveis" className="hover:bg-blue-50 cursor-pointer">
                            Todos os níveis
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location_address" className="text-sm font-medium">
                      <MapPin className="w-4 h-4 inline mr-2" />
                      Localização *
                    </Label>
                    <Input
                      id="location_address"
                      placeholder="Ex: Parque da Cidade, Rua das Flores, 123"
                      value={formData.location_address}
                      onChange={(e) => handleChange("location_address", e.target.value)}
                      className="text-sm h-11 border-gray-300 hover:border-[#5F94E2] focus:border-[#5F94E2] transition-colors"
                      required
                    />
                    
                    <input 
                      type="hidden" 
                      required 
                      value={formData.location_address} 
                    />

                    {mapUrl && (
                      <div className="mt-2 rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                          <img src={mapUrl} alt="Localização da turma" className="w-full h-48 object-cover" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="schedule" className="text-sm font-medium">
                      <Calendar className="w-4 h-4 inline mr-2" />
                      Horários *
                    </Label>
                    <Input
                      id="schedule"
                      placeholder="Ex: Segunda e Quarta, 8h às 9h"
                      value={formData.schedule}
                      onChange={(e) => handleChange("schedule", e.target.value)}
                      className="text-sm h-11 border-gray-300 hover:border-[#5F94E2] focus:border-[#5F94E2] transition-colors"
                      required
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="capacity" className="text-sm font-medium">
                        <Users className="w-4 h-4 inline mr-2" />
                        Vagas Disponíveis
                      </Label>
                      <Input
                        id="capacity"
                        type="number"
                        placeholder="Ex: 15"
                        value={formData.capacity}
                        onChange={(e) =>
                          handleChange("capacity", e.target.value)
                        }
                        className="text-sm h-11 border-gray-300 hover:border-[#5F94E2] focus:border-[#5F94E2] transition-colors"
                        min="1"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="price" className="text-sm font-medium">
                        <DollarSign className="w-4 h-4 inline mr-2" />
                        Valor Mensal (R$)
                      </Label>
                      <Input
                        id="price"
                        type="number"
                        placeholder="Ex: 120"
                        value={formData.price}
                        onChange={(e) => handleChange("price", e.target.value)}
                        className="text-sm h-11 border-gray-300 hover:border-[#5F94E2] focus:border-[#5F94E2] transition-colors"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-11 text-base bg-[#5F94E2] hover:bg-[#1756AC] transition-colors mt-6"
                    disabled={loading}
                  >
                    {loading ? "Cadastrando..." : "Cadastrar Turma"}
                  </Button>
                </form>
            </div>
          </div>

          <div className="space-y-5">
            <div className="bg-white rounded-xl shadow-sm border p-5">
              <h3 className="text-lg font-bold text-[#1756AC] mb-5">Dicas para o Sucesso</h3>
              <div className="space-y-4 text-sm">
                <div className="space-y-1">
                  <h4 className="font-semibold text-sm">📝 Título Atrativo</h4>
                  <p className="text-gray-600 text-xs leading-relaxed">
                    Use títulos claros que descrevam exatamente o tipo de
                    atividade.
                  </p>
                </div>
                <div className="space-y-1">
                  <h4 className="font-semibold text-sm">📍 Localização Precisa</h4>
                  <p className="text-gray-600 text-xs leading-relaxed">
                    Forneça endereço completo para facilitar o encontro dos
                    alunos.
                  </p>
                </div>
                <div className="space-y-1">
                  <h4 className="font-semibold text-sm">⏰ Horários Flexíveis</h4>
                  <p className="text-gray-600 text-xs leading-relaxed">
                    Ofereça opções de horários variados para atrair mais alunos.
                  </p>
                </div>
                <div className="space-y-1">
                  <h4 className="font-semibold text-sm">💰 Preço Justo</h4>
                  <p className="text-gray-600 text-xs leading-relaxed">
                    Pesquise valores praticados na sua região para ser
                    competitivo.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#5F94E2] to-[#1756AC] rounded-xl shadow-sm p-5">
              <div className="space-y-3">
                <div className="text-center">
                  <div className="text-4xl font-bold text-white">10%</div>
                  <div className="text-sm text-white/80">
                    Taxa da plataforma
                  </div>
                </div>
                <p className="text-sm text-center text-white/90">
                  Cobramos apenas quando você recebe um novo aluno. Sem taxas
                  fixas!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateClass;