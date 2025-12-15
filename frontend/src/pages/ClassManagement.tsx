import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  MessageSquare,
  ClipboardList,
  Send,
  BarChart3,
  Calendar,
  MessageCircle,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

interface Student {
  id: string;
  enrollment_id: string;
  full_name: string;
  absences: number;
  total_classes: number;
  attendance_rate: number;
  payment_status: string;
}

interface FrequencyData {
  id: string;
  user_id: string;
  class_id: string;
  date: string;
  profiles: {
    full_name: string;
  } | null;
  absences?: number;
  total_classes?: number;
  attendance_rate?: number;
}

interface Message {
  id: string;
  message: string;
  created_at: string;
  user_id: string;
  profiles: { full_name: string } | null;
}

const ClassManagement = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [classData, setClassData] = useState<any>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [attendance, setAttendance] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  
  const [selectedDate, setSelectedDate] = useState(
    format(new Date(), "yyyy-MM-dd")
  );
  const [frequencyData, setFrequencyData] = useState<FrequencyData[]>([]);

  useEffect(() => {
    loadClassData();
    loadStudents();
    loadFrequencyData();
  }, [id]);

  useEffect(() => {
    if (frequencyData.length > 0) {
    }
  }, [frequencyData]);

  const loadClassData = async () => {
    const { data } = await supabase
      .from("classes")
      .select("*")
      .eq("id", id)
      .single();

    setClassData(data);
    setLoading(false);
  };

  const loadStudents = async () => {
    try {
      const { data: enrollments, error: enrollError } = await supabase
        .from("enrollments")
        .select("id, user_id, status") 
        .eq("class_id", id);

      if (enrollError) throw enrollError;

      if (!enrollments || enrollments.length === 0) {
        setStudents([]);
        return;
      }

      const studentIds = enrollments.map((e) => e.user_id);

      const { data: studentsData, error: studentsError } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", studentIds);

      if (studentsError) throw studentsError;
      
      const studentsList = await Promise.all(
        enrollments.map(async (enrollment) => {
          const profile = studentsData?.find(
            (s: any) => s.id === enrollment.user_id
          );
          const fullName = profile ? profile.full_name : "Sem nome";
          
          return {
            id: enrollment.user_id,
            enrollment_id: enrollment.id,
            full_name: fullName,
            absences: 0,
            total_classes: 0,
            attendance_rate: 0,
            payment_status: enrollment.status || 'payment_pending'
          };
        })
      );

      setStudents(studentsList);
    } catch (error) {
      console.error("Error loading students:", error);
    }
  };

  const loadMessages = async () => {
    const { data } = await supabase
      .from("forum_messages")
      .select("*")
      .eq("class_id", id)
      .order("created_at", { ascending: false });

    if (data) {
      const messagesWithProfiles = await Promise.all(
        data.map(async (msg) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", msg.user_id)
            .maybeSingle();

          return {
            ...msg,
            profiles: profile || null,
          };
        })
      );

      setMessages(messagesWithProfiles as Message[]);
    }
  };

  const loadFrequencyData = async () => {
    try {
      const { data: frequencyRecords, error: freqError } = await supabase
        .from("frequency")
        .select(`
          *,
          profiles:user_id (
            full_name
          )
        `)
        .eq("class_id", id);

      if (freqError) {
        console.error("Error loading frequency data:", freqError);
        return;
      }

      const { data: enrollments } = await supabase
        .from("enrollments")
        .select("user_id")
        .eq("class_id", id);

      const uniqueDates = new Set(frequencyRecords?.map(f => f.date) || []);
      const totalClasses = uniqueDates.size;

      const studentMap = new Map<string, FrequencyData>();

      enrollments?.forEach(enrollment => {
        const userId = enrollment.user_id;
        if (!studentMap.has(userId)) {
          studentMap.set(userId, {
            id: userId,
            user_id: userId,
            class_id: id!,
            date: "",
            profiles: null,
            absences: totalClasses,
            total_classes: totalClasses,
            attendance_rate: 0,
          });
        }
      });

      frequencyRecords?.forEach(record => {
        const userId = record.user_id;
        const existing = studentMap.get(userId);
        
        if (existing) {
          if (!existing.profiles && record.profiles) {
            existing.profiles = record.profiles;
          }
        } else {
          studentMap.set(userId, {
            ...record,
            absences: totalClasses,
            total_classes: totalClasses,
            attendance_rate: 0,
          });
        }
      });

      const presenceCount = new Map<string, number>();
      frequencyRecords?.forEach(record => {
        presenceCount.set(
          record.user_id,
          (presenceCount.get(record.user_id) || 0) + 1
        );
      });

      studentMap.forEach((student, userId) => {
        const presences = presenceCount.get(userId) || 0;
        student.absences = totalClasses - presences;
        student.attendance_rate = totalClasses > 0 
          ? (presences / totalClasses) * 100 
          : 0;
      });

      const consolidatedData = Array.from(studentMap.values());
      setFrequencyData(consolidatedData);
    } catch (error) {
      console.error("Error in loadFrequencyData:", error);
    }
  };

  const handleAttendanceSubmit = async () => {
    const attendanceRecords = Object.entries(attendance)
    .filter(([_, isPresent]) => isPresent === true)
    .map(([userId]) => ({
      user_id: userId,
      date: selectedDate,
      class_id: classData.id,
    }))
    
    const { error } = await supabase
      .from("frequency")
      .upsert(attendanceRecords);

    if (error) {
      toast({
        title: "Erro ao salvar presença",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Presença salva!",
        description: `Chamada de ${format(
          new Date(selectedDate),
          "dd/MM/yyyy"
        )} atualizada.`,
      });
      loadFrequencyData();
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("forum_messages").insert({
      class_id: id,
      user_id: user.id,
      message: newMessage,
    });

    if (error) {
      toast({
        title: "Erro ao enviar mensagem",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setNewMessage("");
      loadMessages();
    }
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
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar ao Dashboard
        </Button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold">{classData?.title}</h1>
          <p className="text-xl text-muted-foreground mt-2">
            {classData?.schedule} • {classData?.location_address}
          </p>
        </div>

        <Tabs defaultValue="attendance" className="space-y-6">
          <TabsList>
            <TabsTrigger value="attendance">
              <ClipboardList className="w-4 h-4 mr-2" />
              Chamada
            </TabsTrigger>
            <TabsTrigger value="frequency">
              <BarChart3 className="w-4 h-4 mr-2" />
              Frequência
            </TabsTrigger>
            <TabsTrigger value="forum" onClick={loadMessages}>
              <MessageSquare className="w-4 h-4 mr-2" />
              Fórum
            </TabsTrigger>
          </TabsList>

          <TabsContent value="attendance" className="space-y-6">
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle>Lista de Chamada</CardTitle>
                <CardDescription>
                  Selecione a data e marque os alunos presentes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    max={format(new Date(), "yyyy-MM-dd")}
                    className="max-w-xs"
                  />
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Aluno</TableHead>
                      <TableHead className="text-center">Financeiro</TableHead>
                      <TableHead className="text-center">Presente</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">
                          {student.full_name}
                        </TableCell>
                        
                        <TableCell className="text-center">
                           <Badge 
                             variant={student.payment_status === 'active' ? 'outline' : 'destructive'} 
                             className={student.payment_status === 'active' ? "border-green-600 text-green-700 bg-green-50" : ""}
                           >
                             {student.payment_status === 'active' ? 'Em dia' : 'Pendente'}
                           </Badge>
                        </TableCell>

                        <TableCell className="text-center">
                          <Checkbox
                            checked={attendance[student.id] || false}
                            onCheckedChange={(checked) =>
                              setAttendance((prev) => ({
                                ...prev,
                                [student.id]: checked as boolean,
                              }))
                            }
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <Button
                  onClick={handleAttendanceSubmit}
                  className="w-full"
                  size="lg"
                >
                  Salvar Chamada
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="frequency" className="space-y-6">
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle>Frequência Consolidada</CardTitle>
                <CardDescription>
                  Visão geral da frequência de todos os alunos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Aluno</TableHead>
                      <TableHead className="text-center">
                        Total de Aulas
                      </TableHead>
                      <TableHead className="text-center">Presenças</TableHead>
                      <TableHead className="text-center">Faltas</TableHead>
                      <TableHead className="text-center">
                        % Frequência
                      </TableHead>
                      <TableHead className="text-center">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {frequencyData.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-center text-muted-foreground py-8"
                        >
                          Nenhum registro de frequência ainda
                        </TableCell>
                      </TableRow>
                    ) : (
                      frequencyData.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell className="font-medium">
                            {student.profiles?.full_name || "Sem nome"}
                          </TableCell>
                          <TableCell className="text-center">
                            {student.total_classes || 0}
                          </TableCell>
                          <TableCell className="text-center text-green-600 font-semibold">
                            {(student.total_classes || 0) - (student.absences || 0)}
                          </TableCell>
                          <TableCell className="text-center text-red-600 font-semibold">
                            {student.absences || 0}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant={
                                (student.attendance_rate || 0) >= 75
                                  ? "default"
                                  : "destructive"
                              }
                              className="font-semibold"
                            >
                              {(student.attendance_rate || 0).toFixed(1)}%
                            </Badge>
                          </TableCell>

                          <TableCell className="text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                navigate(`/chat?contact=${student.user_id}`)
                              }
                            >
                              <MessageCircle className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="forum" className="space-y-6">
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle>Enviar Mensagem</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Digite sua mensagem para a turma..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSendMessage();
                  }}
                />
                <Button onClick={handleSendMessage} className="w-full">
                  <Send className="w-4 h-4 mr-2" />
                  Enviar
                </Button>
              </CardContent>
            </Card>

            <div className="space-y-4">
              {messages.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">Nenhuma mensagem no fórum.</p>
              ) : (
                  messages.map((msg) => (
                    <Card key={msg.id} className="shadow-soft">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-base">
                            {msg.profiles?.full_name || "Usuário"}
                          </CardTitle>
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(msg.created_at), "dd/MM/yyyy HH:mm", {
                              locale: ptBR,
                            })}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm">{msg.message}</p>
                      </CardContent>
                    </Card>
                  ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ClassManagement;