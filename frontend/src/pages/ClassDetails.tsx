import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  MapPin,
  Clock,
  Users,
  User,
  MessageSquare,
  MessageCircle,
} from "lucide-react";

const ClassDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [classData, setClassData] = useState<any>(null);
  const [professional, setProfessional] = useState<any>(null);
  const [enrollmentCount, setEnrollmentCount] = useState(0);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [forumMessages, setForumMessages] = useState<any[]>([]);
  const [classmates, setClassmates] = useState<any[]>([]);

  useEffect(() => {
    fetchClassDetails();
    checkEnrollment();
  }, [id]);

  useEffect(() => {
    if (isEnrolled) {
      fetchForumMessages();
      subscribeToForum();
      fetchClassmates();
    }
  }, [isEnrolled]);

  const fetchClassDetails = async () => {
    try {
      const { data: classInfo, error: classError } = await supabase
        .from("classes")
        .select("*")
        .eq("id", id)
        .single();

      if (classError) throw classError;
      setClassData(classInfo);

      const { data: profData, error: profError } = await supabase
        .from("professionals")
        .select("*")
        .eq("id", classInfo.professional_id)
        .single();

      if (profError) throw profError;
      setProfessional(profData);

      const { count } = await supabase
        .from("enrollments")
        .select("*", { count: "exact", head: true })
        .eq("class_id", id);

      setEnrollmentCount(count || 0);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar turma",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchClassmates = async () => {
    try {
      // 1. Busca os enrollments da turma
      const { data: enrollments, error: enrollError } = await supabase
        .from("enrollments")
        .select("id, student_id")
        .eq("class_id", id)
        .eq("status", "active");

      if (enrollError) throw enrollError;

      if (!enrollments || enrollments.length === 0) {
        setClassmates([]);
        return;
      }

      // 2. Busca os dados dos estudantes usando os user_ids
      const studentIds = enrollments.map((e) => e.student_id);

      const { data: students, error: studentsError } = await supabase
        .from("students")
        .select("user_id, full_name, email, phone, gender, avatar_url")
        .in("user_id", studentIds);

      if (studentsError) throw studentsError;

      // 3. Combina os dados
      const classmates = enrollments.map((enrollment) => {
        const student = students?.find(
          (s) => s.user_id === enrollment.student_id
        );

        return {
          enrollment_id: enrollment.id,
          student_id: enrollment.student_id,
          full_name: student?.full_name || "Nome não encontrado",
          email: student?.email,
          phone: student?.phone,
          gender: student?.gender,
          avatar_url: student.avatar_url,
        };
      });

      setClassmates(classmates);
    } catch (error: any) {
      console.error("Error fetching classmates:", error);
    }
  };
  const checkEnrollment = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("enrollments")
        .select("*")
        .eq("class_id", id)
        .eq("student_id", user.id)
        .maybeSingle();

      if (error) throw error;
      setIsEnrolled(!!data);
    } catch (error: any) {
      console.error("Error checking enrollment:", error);
    }
  };

  const fetchForumMessages = async () => {
    try {
      const { data, error } = await supabase
        .from("forum_messages")
        .select(
          `
          *,
          profiles:user_id (full_name)
        `
        )
        .eq("class_id", id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setForumMessages(data || []);
    } catch (error: any) {
      console.error("Error fetching forum:", error);
    }
  };

  const subscribeToForum = () => {
    const channel = supabase
      .channel(`forum-${id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "forum_messages",
          filter: `class_id=eq.${id}`,
        },
        () => {
          fetchForumMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleEnroll = async () => {
    if (enrollmentCount >= classData.max_students) {
      toast({
        title: "Turma cheia",
        description: "Esta turma já atingiu o número máximo de alunos.",
        variant: "destructive",
      });
      return;
    }

    setEnrolling(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { error } = await supabase.from("enrollments").insert({
        class_id: id,
        student_id: user.id,
        status: "active",
      });

      if (error) throw error;

      toast({
        title: "Matrícula realizada!",
        description: "Você foi matriculado na turma com sucesso.",
      });

      setIsEnrolled(true);
      setEnrollmentCount(enrollmentCount + 1);
    } catch (error: any) {
      toast({
        title: "Erro ao matricular",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return <div className="container py-12">Carregando...</div>;
  }

  if (!classData) {
    return <div className="container py-12">Turma não encontrada</div>;
  }

  const availableSpots = classData.max_students - enrollmentCount;

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background py-12 px-4">
      <div className="container max-w-4xl mx-auto">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          ← Voltar
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-3xl">{classData.activity}</CardTitle>
                <CardDescription className="text-lg mt-2">
                  {classData.description || "Sem descrição disponível"}
                </CardDescription>
              </div>
              {isEnrolled && <Badge className="bg-primary">Matriculado</Badge>}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Horário:</span>
                <span>{classData.schedule}</span>
              </div>

              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Local:</span>
                <span>{classData.location}</span>
              </div>

              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Vagas:</span>
                <span>
                  {enrollmentCount}/{classData.max_students}
                  {availableSpots > 0
                    ? ` (${availableSpots} disponíveis)`
                    : " (Turma cheia)"}
                </span>
              </div>

              {professional && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">Professor:</span>
                    <span>{professional.full_name}</span>
                  </div>
                  {isEnrolled && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        navigate(`/chat?contact=${professional.user_id}`)
                      }
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Chat
                    </Button>
                  )}
                </div>
              )}

              {classData.price > 0 && (
                <div className="flex items-center gap-3">
                  <span className="font-medium">Valor:</span>
                  <span className="text-xl font-bold text-primary">
                    R$ {classData.price.toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            {!isEnrolled && (
              <>
                <Separator />
                <Button
                  onClick={handleEnroll}
                  disabled={enrolling || availableSpots <= 0}
                  className="w-full"
                  size="lg"
                >
                  {enrolling ? "Matriculando..." : "Confirmar Inscrição"}
                </Button>
              </>
            )}

            {isEnrolled && (
              <>
                <Separator />
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    <h3 className="text-xl font-semibold">
                      Participantes da Turma
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {classmates.length}{" "}
                    {classmates.length === 1
                      ? "aluno matriculado"
                      : "alunos matriculados"}
                  </p>

                  <div className="grid gap-2">
                    {classmates.length === 0 ? (
                      <p className="text-center text-muted-foreground py-4">
                        Nenhum participante encontrado
                      </p>
                    ) : (
                      classmates.map((mate: any) => (
                        <Card key={mate.id + mate.full_name}>
                          <CardContent className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <img
                                className="h-7 w-7 text-muted-foreground rounded-full"
                                src={mate.avatar_url}
                                alt={`photo-of-${mate.name}`}
                              />
                              <span className="font-medium">
                                {mate.full_name || "Aluno"}
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </div>

                <Separator />
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    <h3 className="text-xl font-semibold">Fórum da Turma</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Comunicados e avisos do professor
                  </p>

                  <div className="space-y-3">
                    {forumMessages.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        Ainda não há mensagens no fórum
                      </p>
                    ) : (
                      forumMessages.map((message) => (
                        <Card key={message.id}>
                          <CardContent className="pt-4">
                            <div className="flex justify-between items-start mb-2">
                              <span className="font-semibold">
                                {message.profiles?.full_name || "Professor"}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(message.created_at).toLocaleString(
                                  "pt-BR"
                                )}
                              </span>
                            </div>
                            <p className="text-sm">{message.message}</p>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ClassDetails;
