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
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [mapUrl, setMapUrl] = useState<string | null>(null);
  const [distanceInfo, setDistanceInfo] = useState<{
    distanceText: string;
    durationText: string;
  } | null>(null);
  const [locationStatus, setLocationStatus] = useState(
    "Ative a localizacao para estimar a distancia ate a aula."
  );

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

  useEffect(() => {
    if (!classData?.location) return;

    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    const destination = encodeURIComponent(classData.location);

    if (!apiKey) {
      setLocationStatus("Adicione a chave VITE_GOOGLE_MAPS_API_KEY no .env para ver o mapa.");
      return;
    }

    setDistanceInfo(null);
    setUserLocation(null);
    setLocationStatus("Solicitando sua localizacao para tracar a rota...");

    // Mostra somente o destino enquanto ainda nao temos origem
    setMapUrl(`https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${destination}`);

    if (!navigator.geolocation) {
      setLocationStatus("Seu navegador nao permite localizacao automatica.");
      return;
    }

    setLocationStatus("Solicitando sua localizacao...");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserLocation(coords);
        setLocationStatus("Calculando distancia...");

        setMapUrl(
          `https://www.google.com/maps/embed/v1/directions?key=${apiKey}&origin=${coords.lat},${coords.lng}&destination=${destination}&mode=walking`
        );
      },
      () => {
        setLocationStatus(
          "Nao foi possivel obter sua localizacao. Mostrando apenas o local da aula."
        );
        // Mantem o mapa apenas com o destino
        setMapUrl(`https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${destination}`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [classData?.location]);

  useEffect(() => {
    const fetchDistance = async () => {
      if (!userLocation || !classData?.location) return;

      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      if (!apiKey) return;

      try {
        const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${userLocation.lat},${userLocation.lng}&destinations=${encodeURIComponent(
          classData.location
        )}&mode=walking&key=${apiKey}`;
        const response = await fetch(url);
        const data = await response.json();
        const element = data?.rows?.[0]?.elements?.[0];

        if (element?.status === "OK") {
          setDistanceInfo({
            distanceText: element.distance?.text || "",
            durationText: element.duration?.text || "",
          });
          setLocationStatus("");
        } else {
          setLocationStatus("Não foi possível calcular a distância agora.");
        }
      } catch (error) {
        console.error("Erro ao calcular distância:", error);
        setLocationStatus("Não foi possível calcular a distância agora.");
      }
    };

    fetchDistance();
  }, [userLocation, classData?.location]);

  const fetchClassDetails = async () => {
    try {
      const { data: classInfo, error: classError } = await supabase
        .from("classes")
        .select("*")
        .eq("id", id)
        .single();

      if (classError || !classInfo) {
        throw classError || new Error("Turma não encontrada");
      }
      setClassData(classInfo);

      const { data: profData, error: profError } = await supabase
        .from("professionals")
        .select("*")
        .eq("id", classInfo.professional_id)
        .single();

      if (!profError && profData) {
        setProfessional(profData);
      }

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
        .eq("status", "enrolled");

      if (enrollError) throw enrollError;

      if (!enrollments || enrollments.length === 0) {
        setClassmates([]);
        return;
      }

      // 2. Busca os dados dos estudantes usando os user_ids
      const studentIds = enrollments.map((e) => e.student_id);

      const { data: students, error: studentsError } = await supabase
        .from("students")
        .select("user_id, full_name, email, phone, gender")
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
          avatar_url: "" //student.avatar_url,
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
    if (classData?.source === "mock") {
      toast({
        title: "Exemplo de turma",
        description: "Este é um exemplo para visualizar o mapa e os detalhes.",
      });
      return;
    }

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
        user_id: user.id,
        status: "enrolled",
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
  const originParam = userLocation ? `${userLocation.lat},${userLocation.lng}` : "";
  const routeUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    classData.location
  )}&travelmode=walking${originParam ? `&origin=${originParam}` : ""}`;

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

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Distância até a aula</h3>
                </div>
                {distanceInfo && (
                  <Badge variant="secondary">
                    {distanceInfo.distanceText} • {distanceInfo.durationText}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
              {distanceInfo
                ? `Você está a ${distanceInfo.distanceText} (aprox. ${distanceInfo.durationText}) do local informado.`
                : locationStatus}
              </p>
              {mapUrl ? (
                <>
                  <div className="aspect-video w-full overflow-hidden rounded-lg border shadow-sm">
                    <iframe
                      title="Mapa até a aula"
                      src={mapUrl}
                      className="h-full w-full"
                      loading="lazy"
                      allowFullScreen
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button asChild variant="outline" size="sm" className="mt-3">
                      <a href={routeUrl} target="_blank" rel="noreferrer">
                        Abrir rota no Google Maps
                      </a>
                    </Button>
                  </div>
                </>
              ) : (
                <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                  Configure a chave do Google Maps para visualizar o mapa.
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
                               {/* <User className="h-7 w-7 text-muted-foreground" /> */}
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
