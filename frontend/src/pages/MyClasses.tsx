import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Clock,
  Users,
  Bell,
  BellOff,
  MessageCircle,
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

      // Initialize notifications state
      const notifState: { [key: string]: boolean } = {};
      classesData.forEach((cls: any) => {
        // For now, all notifications are enabled by default
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
    return <div className="container py-12">Carregando...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background py-12 px-4">
      <div className="container max-w-6xl mx-auto">
        <div className="max-w flex justify-between">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Minhas Turmas</h1>
            <p className="text-muted-foreground">
              Turmas em que você está matriculado
            </p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            Sair
          </Button>
        </div>

        {enrolledClasses.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">
                Você ainda não está matriculado em nenhuma turma
              </p>
              <button
                onClick={() => navigate("/buscar-aulas")}
                className="text-primary hover:underline"
              >
                Encontrar turmas disponíveis
              </button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {enrolledClasses.map((classItem) => (
              <Card
                key={classItem.id}
                className="cursor-pointer hover:shadow-lg transition-all duration-200"
              >
                <CardHeader>
                  <CardTitle
                    onClick={() => navigate(`/turma-aluno/${classItem.id}`)}
                    className="flex items-start justify-between"
                  >
                    <span className="hover:text-primary transition-colors">
                      {classItem.title}
                    </span>
                  </CardTitle>
                  <CardDescription className="line-clamp-2">
                    {classItem.description || "Sem descrição"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{classItem.schedule}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{classItem.location_address}</span>
                  </div>

                  <div className="pt-4 border-t space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate("/chat");
                      }}
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Chat com Professor
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyClasses;
