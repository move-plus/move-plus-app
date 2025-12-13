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

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [professional, setProfessional] = useState<any>(null);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

    setClasses(classesData || []);
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
                R$ 0.00
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
              <div className="text-2xl font-bold">{0}</div>
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
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {classes.map((classItem) => (
                  <Card 
                    key={classItem.id} 
                    className="shadow-soft" 
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
                      <div className="flex flex-col space-y-2">
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{classItem.location_address}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{classItem.schedule}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
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
