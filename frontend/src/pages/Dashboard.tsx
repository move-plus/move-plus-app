import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
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
  AlertCircle,
  Wallet,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [professional, setProfessional] = useState<any>(null);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [financialData, setFinancialData] = useState({
    totalRevenue: 0,
    potentialRevenue: 0,
    activeStudents: 0,
    pendingStudents: 0,
  });

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Acesso Negado",
          description: "Você precisa estar logado como profissional.",
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

    // 1. Buscamos as turmas E o status das matrículas
    const { data: classesData } = await supabase
      .from("classes")
      .select(`
        *,
        enrollments ( status )
      `)
      .eq("professional_id", professionalId)
      .order('created_at', { ascending: false });

    if (classesData) {
      setClasses(classesData);
      calculateFinancials(classesData);
    }
    setLoading(false);
  };

  const calculateFinancials = (classesData: any[]) => {
    let revenue = 0;
    let potential = 0;
    let activeCount = 0;
    let pendingCount = 0;

    // TAXA DA PLATAFORMA (10%)
    const TAKE_RATE = 0.10; 

    classesData.forEach((cls) => {
      const activeEnrollments = cls.enrollments.filter((e: any) => e.status === 'active').length;
      const pendingEnrollments = cls.enrollments.filter((e: any) => e.status !== 'active').length;

      // PREÇO LÍQUIDO (O que sobra pro professor)
      const netPrice = (cls.price || 0) * (1 - TAKE_RATE);

      // Soma financeira (Baseada no Líquido)
      revenue += (activeEnrollments * netPrice);
      potential += (pendingEnrollments * netPrice);

      // Soma de alunos
      activeCount += activeEnrollments;
      pendingCount += pendingEnrollments;
    });

    setFinancialData({
      totalRevenue: revenue,
      potentialRevenue: potential,
      activeStudents: activeCount,
      pendingStudents: pendingCount,
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold">Dashboard</h1>
            <p className="text-xl text-muted-foreground mt-2">
              Olá, {professional?.full_name}!
            </p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            Sair
          </Button>
        </div>

        {/* CARDS SUPERIORES */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Card Receita */}
          <Card className="shadow-soft border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Receita Líquida (90%)
              </CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700">
                R$ {financialData.totalRevenue.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Já descontada a taxa de 10% da plataforma.
              </p>
            </CardContent>
          </Card>

          {/* Card Alunos */}
          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Total de Alunos
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {financialData.activeStudents + financialData.pendingStudents}
              </div>
              <div className="flex gap-2 mt-1">
                <Badge variant="outline" className="text-xs font-normal border-green-200 bg-green-50 text-green-700">
                  {financialData.activeStudents} Ativos
                </Badge>
                {financialData.pendingStudents > 0 && (
                   <Badge variant="outline" className="text-xs font-normal border-yellow-200 bg-yellow-50 text-yellow-700">
                     {financialData.pendingStudents} Pendentes
                   </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Card Pendências (Oportunidade) */}
          <Card className="shadow-soft border-l-4 border-l-yellow-400">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                A Receber (Pendentes)
              </CardTitle>
              <Wallet className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-700">
                R$ {financialData.potentialRevenue.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                De {financialData.pendingStudents} matrículas pendentes
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="classes" className="space-y-6">
          <TabsList>
            <TabsTrigger value="classes">Minhas Turmas</TabsTrigger>
            <TabsTrigger value="financial">Relatório Financeiro</TabsTrigger>
            <TabsTrigger value="demands">Demandas</TabsTrigger>
          </TabsList>

          {/* ABA MINHAS TURMAS */}
          <TabsContent value="classes" className="space-y-4">
            {classes.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground mb-4">
                    Você ainda não tem turmas cadastradas.
                  </p>
                  <Button onClick={() => navigate("/criar-turma")}>
                    Cadastrar Primeira Turma
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {classes.map((classItem) => {
                  // Contagem local para o card
                  const activeCount = classItem.enrollments.filter((e: any) => e.status === 'active').length;
                  const totalCount = classItem.enrollments.length;

                  return (
                    <Card 
                      key={classItem.id} 
                      className="shadow-soft cursor-pointer hover:border-primary/50 transition-colors" 
                      onClick={() => navigate(`/turma/${classItem.id}`)}
                    >
                      <CardHeader>
                        <CardTitle className="text-lg font-medium">
                          {classItem.title}
                        </CardTitle>
                        <CardDescription className="text-sm text-muted-foreground">
                          {classItem.activity}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-col space-y-3">
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm truncate">{classItem.location_address}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{classItem.schedule}</span>
                          </div>
                          <div className="flex items-center justify-between pt-2 border-t">
                             <span className="text-sm font-semibold text-green-600">
                               R$ {classItem.price?.toFixed(2)}/mês
                             </span>
                             <Badge variant="secondary" className="text-xs">
                               {activeCount}/{classItem.capacity} ativos
                             </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* ABA FINANCEIRO (NOVA) */}
          <TabsContent value="financial" className="space-y-4">
             <Card className="shadow-soft">
                <CardHeader>
                   <CardTitle>Detalhamento por Turma</CardTitle>
                   <CardDescription>Entenda de onde vem sua receita</CardDescription>
                </CardHeader>
                <CardContent>
                   <div className="space-y-4">
                      {classes.map((cls) => {
                         const active = cls.enrollments.filter((e: any) => e.status === 'active').length;
                         const pending = cls.enrollments.filter((e: any) => e.status !== 'active').length;
                         const revenue = active * (cls.price || 0);
                         
                         return (
                            <div key={cls.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                               <div>
                                  <p className="font-semibold">{cls.title}</p>
                                  <div className="flex gap-2 mt-1">
                                     <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                        {active} Pagantes
                                     </Badge>
                                     {pending > 0 && (
                                        <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                                           {pending} Inadimplentes
                                        </Badge>
                                     )}
                                  </div>
                               </div>
                               <div className="text-right">
                                  <p className="text-lg font-bold text-green-700">
                                     R$ {revenue.toFixed(2)}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                     Mensal
                                  </p>
                               </div>
                            </div>
                         )
                      })}
                   </div>
                </CardContent>
             </Card>
          </TabsContent>

          <TabsContent value="demands">
             <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                   Em breve: Oportunidades de aulas na sua região.
                </CardContent>
             </Card>
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;