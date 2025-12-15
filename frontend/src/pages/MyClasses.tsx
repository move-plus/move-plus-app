import { useState, useEffect } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MapPin,
  Clock,
  MessageCircle,
  CheckCircle2,
  XCircle,
  Calendar,
} from "lucide-react";

const MyClasses = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [enrolledClasses, setEnrolledClasses] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<{
    [key: string]: boolean;
  }>({});

  useEffect(() => {
    fetchEnrolledClasses();
  }, []);

  const getTodayClasses = () => {
    const today = new Date().toLocaleDateString('pt-BR', { weekday: 'long' });
    const todayNormalized = today.toLowerCase();
    
    // mapa de dias da semana
    const dayVariations: { [key: string]: string[] } = {
      'segunda': ['segunda', 'segunda-feira', 'seg'],
      'terça': ['terça', 'terca', 'terça-feira', 'terca-feira', 'ter'],
      'quarta': ['quarta', 'quarta-feira', 'qua'],
      'quinta': ['quinta', 'quinta-feira', 'qui'],
      'sexta': ['sexta', 'sexta-feira', 'sex'],
      'sábado': ['sábado', 'sabado', 'sab'],
      'domingo': ['domingo', 'dom']
    };
    
    return enrolledClasses.filter((classItem) => {
      const schedule = classItem.schedule?.toLowerCase() || '';
      
      // verifica qual é o dia de hoje e procura por variações
      for (const [day, variations] of Object.entries(dayVariations)) {
        if (todayNormalized.includes(day)) {
          return variations.some(v => schedule.includes(v));
        }
      }
      
      return false;
    });
  };

  const getWeekClasses = () => {
    return enrolledClasses;
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const fetchEnrolledClasses = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Usuário não autenticado");

      const { data: enrollments, error: enrollError } = await supabase
        .from("enrollments")
        .select(
          `
          id,
          class_id,
          classes (
            id,
            title,
            schedule,
            location_address,
            capacity,
            description
          )
        `
        )
        .eq("user_id", user.id);

      if (enrollError) throw enrollError;

      const classesData =
        enrollments?.map((e: any) => ({
          enrollmentId: e.id,
          ...e.classes,
        })) || [];

      setEnrolledClasses(classesData);

  
      const notifState: { [key: string]: boolean } = {};
      classesData.forEach((cls: any) => {
  
        notifState[cls.id] = true;
      });
      setNotifications(notifState);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar turmas",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleNotifications = (classId: string) => {
    setNotifications((prev) => {
      const newState = { ...prev, [classId]: !prev[classId] };

      toast({
        title: newState[classId]
          ? "Notificações ativadas"
          : "Notificações desativadas",
        description: newState[classId]
          ? "Você receberá avisos desta turma"
          : "Você não receberá mais avisos desta turma",
      });

      return newState;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Carregando...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white pb-20">
      <PageHeader title="Minhas Aulas" showBackButton={false} />
      
      <div className="container max-w-2xl mx-auto px-4 py-6">
        <Tabs defaultValue="hoje" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6 bg-gray-100 p-1">
            <TabsTrigger 
              value="hoje" 
              className="text-base data-[state=active]:bg-white data-[state=active]:text-[#5F94E2] data-[state=active]:shadow-sm transition-all hover:bg-white/50"
            >
              Hoje
            </TabsTrigger>
            <TabsTrigger 
              value="semana" 
              className="text-base data-[state=active]:bg-white data-[state=active]:text-[#5F94E2] data-[state=active]:shadow-sm transition-all hover:bg-white/50"
            >
              Semana
            </TabsTrigger>
          </TabsList>

          <TabsContent value="hoje" className="space-y-4">
            {getTodayClasses().length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 space-y-4">
                <div className="rounded-full bg-blue-100 p-6">
                  <Calendar className="h-12 w-12 text-[#5F94E2]" />
                </div>
                <p className="text-xl font-semibold text-[#1756AC]">Nenhuma aula agendada</p>
                <button
                  onClick={() => navigate("/buscar-turmas")}
                  className="text-[#5F94E2] hover:underline text-sm"
                >
                  Encontrar turmas disponíveis
                </button>
              </div>
            ) : (
              getTodayClasses().map((classItem) => (
                <div
                  key={classItem.id}
                  className="bg-white rounded-xl shadow-sm border p-4 space-y-3"
                >
                  {/* Header com ícone e título */}
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      <div className="rounded-full bg-green-100 p-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-[#1756AC] text-lg">
                        {classItem.title}
                      </h3>
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100 mt-1">
                        Confirmada
                      </Badge>
                    </div>
                  </div>

                  {/* Informações */}
                  <div className="space-y-2 pl-11">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="h-4 w-4" />
                      <span>{classItem.schedule}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span>{classItem.location_address}</span>
                    </div>
                  </div>

                  {/* Botão */}
                  <div className="pt-2">
                    <Button
                      variant="outline"
                      className="w-full border-gray-300"
                      onClick={() => navigate(`/turma-aluno/${classItem.id}`)}
                    >
                      Ver Detalhes
                    </Button>
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="semana" className="space-y-4">
            {getWeekClasses().length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 space-y-4">
                <div className="rounded-full bg-blue-100 p-6">
                  <Calendar className="h-12 w-12 text-[#5F94E2]" />
                </div>
                <p className="text-xl font-semibold text-[#1756AC]">Nenhuma aula agendada</p>
                <button
                  onClick={() => navigate("/buscar-turmas")}
                  className="text-[#5F94E2] hover:underline text-sm"
                >
                  Encontrar turmas disponíveis
                </button>
              </div>
            ) : (
              getWeekClasses().map((classItem) => (
                <div
                  key={classItem.id}
                  className="bg-white rounded-xl shadow-sm border p-4 space-y-3"
                >
                  {/* Header com ícone e título */}
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      <div className="rounded-full bg-green-100 p-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-[#1756AC] text-lg">
                        {classItem.title}
                      </h3>
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100 mt-1">
                        Confirmada
                      </Badge>
                    </div>
                  </div>

                  {/* Informações */}
                  <div className="space-y-2 pl-11">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="h-4 w-4" />
                      <span>{classItem.schedule}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span>{classItem.location_address}</span>
                    </div>
                  </div>

                  {/* Botão */}
                  <div className="pt-2">
                    <Button
                      variant="outline"
                      className="w-full border-gray-300"
                      onClick={() => navigate(`/turma-aluno/${classItem.id}`)}
                    >
                      Ver Detalhes
                    </Button>
                  </div>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MyClasses;
