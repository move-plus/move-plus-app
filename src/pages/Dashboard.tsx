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
  BookOpen,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tables } from "@/integrations/supabase/types";

type ClassData = Tables<"classes"> & {
  enrollments: { count: number }[];
};

interface Professional {
  id: string;
  full_name: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [professional, setProfessional] = useState<Professional | null>(null);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [demands, setDemands] = useState<Demand[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: prof } = await supabase
        .from("professionals")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!prof) {
        navigate("/cadastro-profissional");
        return;
      }

      setProfessional(prof);
      await loadData(prof.id);
    };

    checkAuth();
  }, [navigate]);

  const loadData = async (professionalId: string) => {
    setLoading(true);

    const { data: classesData } = await supabase
      .from("classes")
      .select(
        `
        *,
        enrollments:enrollments(count)
      `
      )
      .eq("professional_id", professionalId);

    const { data: demandsData } = await supabase
      .from("demands")
      .select("*")
      .order("created_at", { ascending: false });

    setClasses(classesData || []);
    setDemands(demandsData || []);
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const createClassFromDemand = (demand: Demand) => {
    navigate("/cadastrar-aulas", {
      state: {
        demandId: demand.id,
        activity: demand.activity,
        schedule: demand.schedule,
        location: demand.location,
      },
    });
  };

  const totalRevenue = classes.reduce((sum, cls) => {
    const students = cls.enrollments[0]?.count || 0;
    return sum + cls.price * students;
  }, 0);

  const totalStudents = classes.reduce((sum, cls) => {
    return sum + (cls.enrollments[0]?.count || 0);
  }, 0);

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

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Receita Total
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {totalRevenue.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Acumulado de todas as turmas
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Total de Alunos
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalStudents}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Em {classes.length} turma{classes.length !== 1 ? "s" : ""}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Demandas Ativas
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{demands.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Oportunidades disponíveis
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="classes" className="space-y-6">
          <TabsList>
            <TabsTrigger value="classes">Minhas Turmas</TabsTrigger>
            <TabsTrigger value="demands">Demandas</TabsTrigger>
            <TabsTrigger value="financial">Financeiro</TabsTrigger>
          </TabsList>

          <TabsContent value="classes" className="space-y-4">
            {classes.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground mb-4">
                    Você ainda não tem turmas cadastradas.
                  </p>
                  <Button onClick={() => navigate("/cadastrar-aulas")}>
                    Cadastrar Primeira Turma
                  </Button>
                </CardContent>
              </Card>
            ) : (
              classes.map((cls: ClassData) => (
                <Card
                  key={cls.id}
                  className="shadow-soft hover:shadow-medium transition-shadow cursor-pointer"
                  onClick={() => navigate(`/turma/${cls.id}`)}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{cls.activity}</span>
                      <span className="text-sm font-normal text-muted-foreground">
                        {cls.enrollments[0]?.count || 0} alunos
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center text-sm">
                      <Clock className="w-4 h-4 mr-2" />
                      {cls.schedule}
                    </div>
                    <div className="flex items-center text-sm">
                      <MapPin className="w-4 h-4 mr-2" />
                      {cls.location}
                    </div>
                    <div className="flex items-center text-sm">
                      <DollarSign className="w-4 h-4 mr-2" />
                      R$ {cls.price.toFixed(2)}/mês por aluno
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="demands" className="space-y-4">
            {demands.map((demand) => (
              <Card key={demand.id} className="shadow-soft">
                <CardHeader>
                  <CardTitle>{demand.activity}</CardTitle>
                  <CardDescription>
                    {demand.num_interested} idosos interessados
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center text-sm">
                    <MapPin className="w-4 h-4 mr-2" />
                    {demand.neighborhood} - {demand.location}
                  </div>
                  <div className="flex items-center text-sm">
                    <Clock className="w-4 h-4 mr-2" />
                    {demand.schedule}
                  </div>
                  <Button
                    onClick={() => createClassFromDemand(demand)}
                    className="w-full mt-4"
                  >
                    Criar Turma
                  </Button>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="financial" className="space-y-4">
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle>Receita por Turma</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {classes.map((cls) => {
                  const students = cls.enrollments[0]?.count || 0;
                  const revenue = cls.price * students;
                  const percentage =
                    totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0;

                  return (
                    <div key={cls.id} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{cls.activity}</span>
                        <span className="text-sm text-muted-foreground">
                          R$ {revenue.toFixed(2)} ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div
                          className="bg-primary rounded-full h-2 transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
