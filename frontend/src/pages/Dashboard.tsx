import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DollarSign,
  Users,
  MapPin,
  Clock,
  TrendingUp,
  BookOpen,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tables } from "@/integrations/supabase/types";

interface Demand {
  id: string;
  tipo: string; // ou 'activity' dependendo do seu banco
  activity: string;
  localizacao: string;
  horario: string;
  created_at: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [professional, setProfessional] = useState<any>(null);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [demands, setDemands] = useState<any[]>([]);
  const [demandsCount, setDemandsCount] = useState(0);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user },} = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Acesso Negado",
          description: "Você precisa estar logado como profissional para acessar esta página.",
          variant: "destructive",
        });
        navigate("/login-profissional");
        return;
      }

      const { data: professional_data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user?.id)
        .single();


      setProfessional({ id: professional_data.id, full_name: professional_data.full_name });
      await loadData(professional_data.id);
    };

    checkAuth();
  }, [navigate]);

  const loadData = async (professionalId: string) => {
    setLoading(true);

    const { data: classesData } = await supabase
      .from("classes")
      .select(`
        *,
        enrollments ( count )
      `)
      .eq("professional_id", professionalId)
      .order('created_at', { ascending: false });

    const { data: demandsData } = await supabase
      .from("Demandas") 
      .select("*")
      .eq('atendida', false) // Opcional: descomente se quiser apenas demandas abertas
      .order('created_at', { ascending: false });

    setClasses(classesData || []);
    setDemands(demandsData || []);
    console.log(demandsData)

    setDemandsCount(demandsData.length);
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const createClassFromDemand = (demand: Demand) => {
    navigate("/criar-turma", {
      state: {
        demandId: demand.id,
        // Mapeando os campos do banco (Português) para o Form (Inglês)
        activity: demand.tipo, 
        schedule: demand.horario, 
        location: demand.localizacao,
      },
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl">Carregando...</p>
      </div>
    );
  }

  const totalStudents = classes.reduce((total, cls) => {
    const count = cls.enrollments?.[0]?.count || 0;
    return total + count;
  }, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white pb-24">
      <PageHeader title="Dashboard" showBackButton={false} />
      <div className="container mx-auto px-4 py-6">
        <p className="text-lg text-muted-foreground mb-6">
          Olá, {professional?.full_name}!
        </p>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-[#5F94E2] to-[#2D7DD2] rounded-xl shadow-sm p-6">
            <div className="flex flex-row items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-white/90">
                Receita Total
              </h3>
              <DollarSign className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="text-3xl font-bold text-white">
                R$ 0.00
              </div>
              <p className="text-xs text-white/80 mt-1">
                Acumulado de todas as turmas
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex flex-row items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">
                Total de Alunos
              </h3>
              <Users className="h-5 w-5 text-[#5F94E2]" />
            </div>
            <div>
              <div className="text-3xl font-bold text-[#1756AC]">{totalStudents}</div>
              <p className="text-xs text-gray-500 mt-1">
                Em {classes.length} turma{classes.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#25C588] to-[#1ea872] rounded-xl shadow-sm p-6">
            <div className="flex flex-row items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-white/90">
                Demandas Ativas
              </h3>
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="text-3xl font-bold text-white">{demandsCount}</div>
              <p className="text-xs text-white/80 mt-1">
                Oportunidades disponíveis
              </p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="classes" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-gray-100 p-1 rounded-lg h-auto">
            <TabsTrigger 
              value="classes" 
              className="text-xs sm:text-sm md:text-base py-2 px-2 data-[state=active]:bg-white data-[state=active]:text-[#5F94E2] data-[state=active]:shadow-sm transition-all hover:bg-white/50"
            >
              <span className="hidden sm:inline">Minhas Turmas</span>
              <span className="sm:hidden">Turmas</span>
            </TabsTrigger>
            <TabsTrigger 
              value="demands" 
              className="text-xs sm:text-sm md:text-base py-2 px-2 data-[state=active]:bg-white data-[state=active]:text-[#5F94E2] data-[state=active]:shadow-sm transition-all hover:bg-white/50"
            >
              Demandas
            </TabsTrigger>
            <TabsTrigger 
              value="financial" 
              className="text-xs sm:text-sm md:text-base py-2 px-2 data-[state=active]:bg-white data-[state=active]:text-[#5F94E2] data-[state=active]:shadow-sm transition-all hover:bg-white/50"
            >
              Financeiro
            </TabsTrigger>
          </TabsList>

          <TabsContent value="classes" className="space-y-4">
            {classes.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
                <div className="flex flex-col items-center justify-center space-y-4">
                  <div className="rounded-full bg-blue-100 p-6">
                    <BookOpen className="h-12 w-12 text-[#5F94E2]" />
                  </div>
                  <p className="text-gray-600">
                    Você ainda não tem turmas cadastradas.
                  </p>
                  <Button 
                    onClick={() => navigate("/cadastrar-aulas")}
                    className="bg-[#5F94E2] hover:bg-[#1756AC] transition-colors"
                  >
                    Cadastrar Primeira Turma
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {classes.map((classItem) => (
                  <div 
                    key={classItem.id} 
                    className="bg-white rounded-xl shadow-sm border p-4 space-y-3 hover:shadow-md transition-shadow cursor-pointer" 
                    onClick={() => navigate(`/turma/${classItem.id}`)}
                  >
                    <div>
                      <h3 className="text-lg font-semibold text-[#1756AC]">
                        {classItem.title}
                      </h3>
                      {classItem.activity && (
                        <p className="text-sm text-gray-500 mt-1">
                          {classItem.activity}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col space-y-2">
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-gray-600" />
                        <span className="text-sm text-gray-600">{classItem.location_address}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-gray-600" />
                        <span className="text-sm text-gray-600">{classItem.schedule}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="demands" className="space-y-4">
            {demands.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
                <div className="flex flex-col items-center justify-center space-y-4">
                  <div className="rounded-full bg-green-100 p-6">
                    <TrendingUp className="h-12 w-12 text-[#25C588]" />
                  </div>
                  <p className="text-gray-600">
                    Nenhuma demanda disponível no momento.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {demands.map((demand) => (
                  <div 
                    key={demand.id} 
                    className="bg-white rounded-xl shadow-sm border p-5 flex flex-col justify-between hover:shadow-md transition-shadow h-full"
                  >
                    <div className="space-y-3 mb-4">
                      <div>
                        {/* Assumindo que a demanda tem um 'title' ou 'activity' como título */}
                        <h3 className="text-lg font-semibold text-[#1756AC]">
                          {demand.tipo || "Nova Demanda"}
                        </h3>
                        {demand.description && (
                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                                {demand.description}
                            </p>
                        )}
                      </div>
                      
                      <div className="flex flex-col space-y-2">
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-gray-600 shrink-0" />
                          <span className="text-sm text-gray-600 truncate">{demand.localizacao || "Local a definir"}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-gray-600 shrink-0" />
                          <span className="text-sm text-gray-600">{demand.horario || "Horário a combinar"}</span>
                        </div>
                         {/* Se tiver data de criação */}
                        <div className="flex items-center space-x-2">
                          {/* <Calendar className="h-4 w-4 text-gray-600 shrink-0" /> */}
                          <span className="text-sm text-gray-600">
                            Postado em {new Date(demand.created_at).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <Button 
                      onClick={() => createClassFromDemand(demand)}
                      className="w-full bg-[#25C588] hover:bg-[#1ea872] text-white transition-colors"
                    >
                      Criar Turma para esta Demanda
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
