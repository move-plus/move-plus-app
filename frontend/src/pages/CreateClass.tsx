import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

  const handleAddressSelect = useCallback(({ address, lat, lng }: { address: string, lat: number, lng: number }) => {
    console.log("📍 Endereço capturado:", address);
    
    setFormData(prev => ({
      ...prev,
      location_address: address,
      lat: lat,
      lng: lng
    }));

    const apiKey = "AIzaSyBEKe9FuiZDmFD1XSoTHzh4P5esSgrYDHk"; 
    if (apiKey && apiKey !== "AIzaSyBEKe9FuiZDmFD1XSoTHzh4P5esSgrYDHk") {
       const url = `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=15&size=600x300&markers=color:red|${lat},${lng}&key=${apiKey}`;
       setMapUrl(url);
    }
  }, []); // Array vazio = cria a função uma única vez

  const demandData = location.state as {
    demandId?: string;
    activity?: string;
    schedule?: string;
    location?: string;
  } | null;

  const [formData, setFormData] = useState({
    title: demandData?.activity || "",
    description: "",
    category: "",
    schedule: "",  
    location_address: demandData?.location || "",
    lat: null as number | null,
    lng: null as number | null, 
    capacity: "",
    price: "",
    level: "",
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
        description: formData.description,
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
    <div className="min-h-screen bg-gradient-hero">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold">
            Cadastrar Nova Aula
          </h1>
          <p className="text-xl text-muted-foreground">
            Preencha as informações da sua aula para começar a receber alunos
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
            <Card className="shadow-medium">
              <CardHeader>
                <CardTitle className="text-2xl">Informações da Aula</CardTitle>
                <CardDescription className="text-base">
                  Quanto mais detalhes você fornecer, mais fácil será para os
                  alunos encontrarem sua aula
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Title */}
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-base">
                      <FileText className="w-4 h-4 inline mr-2" />
                      Título da Aula *
                    </Label>
                    <Input
                      id="title"
                      placeholder="Ex: Yoga para Iniciantes"
                      value={formData.title}
                      onChange={(e) => handleChange("title", e.target.value)}
                      className="text-base h-12"
                      required
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-base">
                      Descrição
                    </Label>
                    <Textarea
                      id="description"
                      placeholder="Descreva sua aula, metodologia, benefícios..."
                      value={formData.description}
                      onChange={(e) =>
                        handleChange("description", e.target.value)
                      }
                      className="text-base min-h-32"
                      rows={5}
                    />
                  </div>

                  {/* Category and Level */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category" className="text-base">
                        Categoria *
                      </Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) =>
                          handleChange("category", value)
                        }
                      >
                        <SelectTrigger id="category" className="text-base h-12">
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="outdoor">Ao Ar Livre</SelectItem>
                          <SelectItem value="yoga">Yoga</SelectItem>
                          <SelectItem value="gym">Musculação</SelectItem>
                          <SelectItem value="pilates">Pilates</SelectItem>
                          <SelectItem value="water">Hidroginástica</SelectItem>
                          <SelectItem value="dance">Dança</SelectItem>
                          <SelectItem value="stretch">Alongamento</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="level" className="text-base">
                        <GraduationCap className="w-4 h-4 inline mr-2" />
                        Nível *
                      </Label>
                      <Select
                        value={formData.level}
                        onValueChange={(value) => handleChange("level", value)}
                      >
                        <SelectTrigger id="level" className="text-base h-12">
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Iniciante">Iniciante</SelectItem>
                          <SelectItem value="Intermediário">
                            Intermediário
                          </SelectItem>
                          <SelectItem value="Avançado">Avançado</SelectItem>
                          <SelectItem value="Todos os níveis">
                            Todos os níveis
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="space-y-2">
                    <Label htmlFor="location_address" className="text-base">
                      <MapPin className="w-4 h-4 inline mr-2" />
                      Localização *
                    </Label>
                    <AddressAutocomplete 
                      onAddressSelect={handleAddressSelect}
                      defaultValue={formData.location_address}
                    />
                    
                    {/* Campo Hidden para garantir validação HTML padrão se quiser, ou remova */}
                    <input 
                      type="hidden" 
                      required 
                      value={formData.location_address} 
                    />

                    {/* Preview do Mapa (O "Uau" da banca) */}
                    {mapUrl && (
                      <div className="mt-2 rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                          <img src={mapUrl} alt="Localização da turma" className="w-full h-48 object-cover" />
                      </div>
                    )}
                  </div>

                  {/* Schedule */}
                  <div className="space-y-2">
                    <Label htmlFor="schedule" className="text-base">
                      <Calendar className="w-4 h-4 inline mr-2" />
                      Horários *
                    </Label>
                    <Input
                      id="schedule"
                      placeholder="Ex: Segunda e Quarta, 8h às 9h"
                      value={formData.schedule}
                      onChange={(e) => handleChange("schedule", e.target.value)}
                      className="text-base h-12"
                      required
                    />
                  </div>

                  {/* Max Students and Price */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="capacity" className="text-base">
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
                        className="text-base h-12"
                        min="1"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="price" className="text-base">
                        <DollarSign className="w-4 h-4 inline mr-2" />
                        Valor Mensal (R$)
                      </Label>
                      <Input
                        id="price"
                        type="number"
                        placeholder="Ex: 120"
                        value={formData.price}
                        onChange={(e) => handleChange("price", e.target.value)}
                        className="text-base h-12"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full text-lg"
                    disabled={loading}
                  >
                    {loading ? "Cadastrando..." : "Cadastrar Turma"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle>Dicas para o Sucesso</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="space-y-2">
                  <h4 className="font-semibold">📝 Título Atrativo</h4>
                  <p className="text-muted-foreground">
                    Use títulos claros que descrevam exatamente o tipo de
                    atividade.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">📍 Localização Precisa</h4>
                  <p className="text-muted-foreground">
                    Forneça endereço completo para facilitar o encontro dos
                    alunos.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">⏰ Horários Flexíveis</h4>
                  <p className="text-muted-foreground">
                    Ofereça opções de horários variados para atrair mais alunos.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">💰 Preço Justo</h4>
                  <p className="text-muted-foreground">
                    Pesquise valores praticados na sua região para ser
                    competitivo.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-soft bg-accent">
              <CardContent className="p-6 space-y-4">
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary">10%</div>
                  <div className="text-sm text-muted-foreground">
                    Taxa da plataforma
                  </div>
                </div>
                <p className="text-sm text-center text-muted-foreground">
                  Cobramos apenas quando você recebe um novo aluno. Sem taxas
                  fixas!
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateClass;
