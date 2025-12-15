import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
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

// Defina sua chave aqui para facilitar (o ideal seria .env, mas para o TCC ok)
const GOOGLE_API_KEY = "AIzaSyCJ6nXLmePF2_REnVVFtB_30KsltT8JnxU";

const ClassDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  
  const [classData, setClassData] = useState<any>(null);
  const [professional, setProfessional] = useState<any>(null);
  
  const [enrollmentCount, setEnrollmentCount] = useState(0);
  const [isEnrolled, setIsEnrolled] = useState(false);
  
  const [forumMessages, setForumMessages] = useState<any[]>([]);
  const [classmates, setClassmates] = useState<any[]>([]);
  
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [mapUrl, setMapUrl] = useState<string | null>(null);
  
  const [distanceInfo, setDistanceInfo] = useState<{
    distanceText: string;
    durationText: string;
  } | null>(null);
  
  const [locationStatus, setLocationStatus] = useState(
    "Ative a localização para ver a distância."
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

  // 1. CONFIGURAÇÃO DO MAPA E GEOLOCALIZAÇÃO DO USUÁRIO
  useEffect(() => {
    if (!classData) return;

    // Se tivermos lat/lng salvos no banco (novo método), usamos eles.
    // Se for antigo, usamos o endereço em texto.
    const destinationQuery = (classData.lat && classData.lng)
      ? `${classData.lat},${classData.lng}`
      : encodeURIComponent(classData.location_address);

    // URL Oficial do Google Static Maps
    const initialMap = `https://maps.googleapis.com/maps/api/staticmap?center=${destinationQuery}&zoom=15&size=600x300&markers=color:red|${destinationQuery}&key=${GOOGLE_API_KEY}`;
    setMapUrl(initialMap);

    if (!navigator.geolocation) {
      setLocationStatus("Seu navegador não suporta geolocalização.");
      return;
    }

    setLocationStatus("Solicitando sua localização...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userCoords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserLocation(userCoords);
        setLocationStatus("Calculando rota...");

        // Atualiza o mapa para mostrar DOIS pontos (Origem do usuário e Destino da aula)
        // &markers=color:blue|label:VC|... (Você)
        // &markers=color:red|... (Aula)
        const routeMap = `https://maps.googleapis.com/maps/api/staticmap?size=600x300&markers=color:blue|label:U|${userCoords.lat},${userCoords.lng}&markers=color:red|${destinationQuery}&path=color:0x0000ff|weight:5|${userCoords.lat},${userCoords.lng}|${destinationQuery}&key=${GOOGLE_API_KEY}`;
        
        setMapUrl(routeMap);
      },
      (error) => {
        console.error("Erro de geolocalização:", error);
        setLocationStatus("Não foi possível obter sua localização.");
      }
    );
  }, [classData]);

  // 2. CÁLCULO DE DISTÂNCIA (Correção do Erro CORS)
  useEffect(() => {
    if (!userLocation || !classData) return;
    if (!window.google || !window.google.maps) return;

    const calculateDistanceNative = () => {
      const service = new google.maps.DistanceMatrixService();

      // Define o destino: Preferência por Objeto LatLng, fallback para string
      const destination = (classData.lat && classData.lng)
        ? { lat: classData.lat, lng: classData.lng }
        : classData.location_address;

      service.getDistanceMatrix(
        {
          origins: [{ lat: userLocation.lat, lng: userLocation.lng }],
          destinations: [destination],
          travelMode: google.maps.TravelMode.WALKING, // Pode mudar para DRIVING se quiser
          unitSystem: google.maps.UnitSystem.METRIC,
        },
        (response, status) => {
          if (status === "OK" && response) {
            const element = response.rows[0].elements[0];
            if (element.status === "OK") {
              setDistanceInfo({
                distanceText: element.distance.text,
                durationText: element.duration.text,
              });
              setLocationStatus("");
            } else {
              setLocationStatus("Rota não encontrada (muito longe ou oceano).");
            }
          } else {
            console.error("Erro DistanceMatrix:", status);
            setLocationStatus("Erro ao calcular distância.");
          }
        }
      );
    };

    calculateDistanceNative();
  }, [userLocation, classData]);

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
        .from("profiles")
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
      const { data: enrollments, error: enrollError } = await supabase
        .from("enrollments")
        .select("id, user_id")
        .eq("class_id", id);

      if (enrollError) throw enrollError;

      if (!enrollments || enrollments.length === 0) {
        setClassmates([]);
        return;
      }

      const studentIds = enrollments.map((e) => e.user_id);

      const { data: students, error: studentsError } = await supabase
        .from("profiles")
        .select("id, full_name, email, phone, gender")
        .in("id", studentIds);

      if (studentsError) throw studentsError;

      const classmatesData = enrollments.map((enrollment) => {
        const student = students?.find((s) => s.id === enrollment.user_id);
        return {
          enrollment_id: enrollment.id,
          student_id: enrollment.user_id,
          full_name: student?.full_name || "Nome não encontrado",
          email: student?.email,
          phone: student?.phone,
          gender: student?.gender,
          avatar_url: "",
        };
      });

      setClassmates(classmatesData);
    } catch (error: any) {
      console.error("Error fetching classmates:", error);
    }
  };

  const checkEnrollment = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("enrollments")
        .select("*")
        .eq("class_id", id)
        .eq("user_id", user.id)
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
        .select(`*, profiles:user_id (full_name)`)
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

    if (enrollmentCount >= classData.capacity) {
      toast({
        title: "Turma cheia",
        description: "Esta turma já atingiu o número máximo de alunos.",
        variant: "destructive",
      });
      return;
    }

    setEnrolling(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login", { state: { from: location } });
        return;
      }

      const { error } = await supabase.from("enrollments").insert({
        class_id: id,
        user_id: user.id,
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

  const availableSpots = classData.capacity - enrollmentCount;
  // Link para abrir no App do Google Maps (botão externo)
  const routeUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(classData.location_address)}${userLocation ? `&origin=${userLocation.lat},${userLocation.lng}` : ""}&travelmode=walking`;

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
                <CardTitle className="text-3xl">{classData.title}</CardTitle>
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
                <span>{classData.location_address}</span>
              </div>

              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Vagas:</span>
                <span>
                  {enrollmentCount}/{classData.capacity || classData.max_students}
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
                  <Badge variant="secondary" className="text-sm px-3 py-1">
                     🚶 {distanceInfo.distanceText} • {distanceInfo.durationText}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {distanceInfo
                  ? `Você está a ${distanceInfo.distanceText} do local.`
                  : locationStatus}
              </p>
              
              {/* COMPONENTE DE MAPA CORRIGIDO */}
              {mapUrl ? (
                <>
                  <div className="aspect-video w-full overflow-hidden rounded-lg border shadow-sm bg-gray-100">
                    <img
                      src={mapUrl}
                      alt="Mapa até a aula"
                      className="w-full h-full object-cover"
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
                <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground text-center">
                  Carregando mapa...
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
                        <Card key={mate.enrollment_id}>
                          <CardContent className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              {/* Avatar placeholder se não tiver URL */}
                              <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                                 <User className="h-5 w-5 text-gray-500" />
                              </div>
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