import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
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
  const location = useLocation();

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
    if (!classData?.location_address) return;

    const apiKey = 'AIzaSyCJ6nXLmePF2_REnVVFtB_30KsltT8JnxU';
    const destination = encodeURIComponent(classData.location_address);

    if (!apiKey) {
      setLocationStatus("Não foi possível carregar a chave do Google Maps.");
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
  }, [classData?.location_address]);

  useEffect(() => {
    const fetchDistance = async () => {
      if (!userLocation || !classData?.location_address) return;
      const apiKey = 'AIzaSyCJ6nXLmePF2_REnVVFtB_30KsltT8JnxU';
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
  }, [userLocation, classData?.location_address]);

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
        .eq("class_id", id)

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

      const classmates = enrollments.map((enrollment) => {
        const student = students?.find(
          (s) => s.id === enrollment.user_id
        );

        return {
          enrollment_id: enrollment.id,
          student_id: enrollment.user_id,
          full_name: student?.full_name || "Nome não encontrado",
          email: student?.email,
          phone: student?.phone,
          gender: student?.gender,
          avatar_url: "" // student?.avatar_url,
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
        .select(
          `
          *
        `
        )
        .eq("class_id", classData.id)
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
      const {
        data: { user },
      } = await supabase.auth.getUser();
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
  const originParam = userLocation ? `${userLocation.lat},${userLocation.lng}` : "";
  const routeUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    classData.location_address
  )}&travelmode=walking${originParam ? `&origin=${originParam}` : ""}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white pb-20">
      <PageHeader title="Detalhes da Aula" />
      
      <div className="w-full h-48 bg-gradient-to-br from-[#5F94E2] via-[#4A84D1] to-[#25C588] relative">
        {isEnrolled && (
          <div className="absolute top-4 right-4">
            <Badge className="bg-white text-[#25C588] text-base px-4 py-2 shadow-lg font-semibold">
              ✓ Matriculado
            </Badge>
          </div>
        )}
      </div>

      <div className="container max-w-2xl mx-auto px-4 -mt-6">
        <div className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
          
          <div>
            <h1 className="text-2xl font-bold text-[#1756AC] mb-1">
              {classData.activity}
            </h1>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-blue-100/50 border border-blue-200">
              <div className="rounded-lg bg-white p-2 shadow-sm">
                <Clock className="h-5 w-5 text-[#5F94E2]" />
              </div>
              <div>
                <p className="font-semibold text-[#1756AC]">{classData.schedule?.split(',')[0] || classData.schedule}</p>
                <p className="text-sm text-muted-foreground">
                  {classData.schedule?.split(',')[1]?.trim() || '10:00 - 11:00'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-blue-100/50 border border-blue-200">
              <div className="rounded-lg bg-white p-2 shadow-sm">
                <MapPin className="h-5 w-5 text-[#5F94E2]" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-[#1756AC]">{classData.location_address?.split(',')[0] || 'Local'}</p>
                <p className="text-sm text-muted-foreground">
                  {classData.location_address?.split(',').slice(1).join(',').trim() || classData.location_address}
                </p>
              </div>
            </div>

            {classData.description && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-blue-100/50 border border-blue-200">
                <div className="rounded-lg bg-white p-2 shadow-sm">
                  <Users className="h-5 w-5 text-[#5F94E2]" />
                </div>
                <div>
                  <p className="font-semibold text-[#1756AC]">
                    {enrollmentCount}/{classData.capacity} participantes
                  </p>
                  <p className="text-sm text-muted-foreground">{classData.description}</p>
                </div>
              </div>
            )}
          </div>

          {professional && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-[#1756AC] mb-4">Seu Professor</h3>
              <div className="flex items-center gap-4">
                <div className="relative">
                  {professional.avatar_url ? (
                    <img 
                      src={professional.avatar_url} 
                      alt={professional.full_name}
                      className="h-16 w-16 rounded-full object-cover border-2 border-[#5F94E2]"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-gradient-to-br from-[#5F94E2] to-[#1756AC] flex items-center justify-center text-white text-xl font-bold">
                      {professional.full_name?.charAt(0) || 'P'}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-[#1756AC]">{professional.full_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {professional.specialty || 'Fisioterapeuta especialista'}
                  </p>
                </div>
                {isEnrolled && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/chat?contact=${professional.user_id}`)}
                    className="border-[#5F94E2] text-[#5F94E2] hover:bg-[#5F94E2] hover:text-white"
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Chat
                  </Button>
                )}
              </div>
            </div>
          )}

          <div className="border-t pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-[#5F94E2]" />
                <h3 className="text-lg font-semibold text-[#1756AC]">Distância até a aula</h3>
              </div>
              {distanceInfo && (
                <Badge variant="secondary" className="bg-[#25C588]/20 text-[#25C588] border-[#25C588]/30">
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
                <div className="aspect-video w-full overflow-hidden rounded-xl border shadow-sm">
                  <iframe
                    title="Mapa até a aula"
                    src={mapUrl}
                    className="h-full w-full"
                    loading="lazy"
                    allowFullScreen
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
                <Button asChild variant="outline" size="sm" className="w-full">
                  <a href={routeUrl} target="_blank" rel="noreferrer">
                    <MapPin className="h-4 w-4 mr-2" />
                    Abrir rota no Google Maps
                  </a>
                </Button>
              </>
            ) : (
              <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground text-center">
                Configure a chave do Google Maps para visualizar o mapa
              </div>
            )}
          </div>

          {!isEnrolled && (
            <Button
              onClick={handleEnroll}
              disabled={enrolling || availableSpots <= 0}
              className="w-full h-14 text-lg font-semibold bg-[#25C588] hover:bg-[#25C588]/90 text-white rounded-xl shadow-lg"
              size="lg"
            >
              {enrolling ? "Matriculando..." : availableSpots <= 0 ? "Turma Cheia" : "🎯 Participar desta Aula"}
            </Button>
          )}

          {isEnrolled && (
            <>
              <div className="border-t pt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-[#5F94E2]" />
                    <h3 className="text-lg font-semibold text-[#1756AC]">
                      Participantes da Turma
                    </h3>
                  </div>
                  <Badge variant="secondary" className="bg-[#5F94E2]/20 text-[#5F94E2] border-[#5F94E2]/30">
                    {enrollmentCount}/{classData.capacity}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {classmates.length}{" "}
                  {classmates.length === 1 ? "aluno matriculado" : "alunos matriculados"}
                </p>

                <div className="grid gap-2">
                  {classmates.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">
                      Nenhum participante encontrado
                    </p>
                  ) : (
                    classmates.map((mate: any) => (
                      <div 
                        key={mate.id + mate.full_name}
                        className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border"
                      >
                        {mate.avatar_url ? (
                          <img
                            className="h-10 w-10 rounded-full object-cover border-2 border-[#5F94E2]"
                            src={mate.avatar_url}
                            alt={mate.full_name}
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#5F94E2] to-[#1756AC] flex items-center justify-center text-white font-semibold">
                            {mate.full_name?.charAt(0) || 'A'}
                          </div>
                        )}
                        <span className="font-medium text-[#1756AC]">
                          {mate.full_name || "Aluno"}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="border-t pt-6 space-y-4">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-[#5F94E2]" />
                  <h3 className="text-lg font-semibold text-[#1756AC]">Fórum da Turma</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Comunicados e avisos do professor
                </p>

                <div className="space-y-3">
                  {forumMessages.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8 bg-gray-50 rounded-lg">
                      Ainda não há mensagens no fórum
                    </p>
                  ) : (
                    forumMessages.map((message) => (
                      <div key={message.id} className="p-4 rounded-lg bg-gray-50 border">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-semibold text-[#1756AC]">
                            {message.profiles?.full_name || "Professor"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(message.created_at).toLocaleString("pt-BR")}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{message.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClassDetails;
