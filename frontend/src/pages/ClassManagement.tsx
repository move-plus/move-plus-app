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
import { Textarea } from "@/components/ui/textarea";
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
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(
    format(new Date(), "yyyy-MM-dd")
  );
  const [frequencyData, setFrequencyData] = useState<Student[]>([]);

  useEffect(() => {
    loadClassData();
    loadStudents();
    loadMessages();
    loadFrequencyData();
  }, [id]);

  useEffect(() => {
    loadAttendanceForDate();
  }, [selectedDate, students]);

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
      // 1. Busca enrollments
      const { data: enrollments, error: enrollError } = await supabase
        .from("enrollments")
        .select("id, student_id")
        .eq("class_id", id)
        .eq("status", "enrolled");

      if (enrollError) throw enrollError;

      if (!enrollments || enrollments.length === 0) {
        setStudents([]);
        return;
      }

      // 2. Busca perfis dos estudantes - CORRIGIDO
      const studentIds = enrollments.map((e) => e.student_id);

      // const { data: profiles, error: profilesError } = await supabase
      //   .from("profiles")
      //   .select("id, full_name")
      //   .in("id", studentIds);

      // if (profilesError) {
      //   console.error("Error fetching profiles:", profilesError);
      // }

      // 3. Se profiles está vazio, tenta buscar da tabela students
      let studentsInfo = null;
        const { data: studentsData, error: studentsError } = await supabase
          .from("students")
          .select("user_id, full_name")
          .in("user_id", studentIds);

        studentsInfo = studentsData;

      // 4. Combina dados e busca faltas
      const studentsWithAbsences = await Promise.all(
        enrollments.map(async (enrollment) => {
          //const profile = profiles?.find((p) => p.id === enrollment.student_id);
          const student = studentsInfo?.find(
            (s) => s.user_id === enrollment.student_id
          );

          const { count } = await supabase
            .from("attendance")
            .select("*", { count: "exact", head: true })
            .eq("enrollment_id", enrollment.id)
            .eq("present", false);

          return {
            id: enrollment.student_id,
            enrollment_id: enrollment.id,
            // full_name: profile?.full_name || student?.full_name || "Sem nome",
            full_name:  student?.full_name || "Sem nome",
            absences: count || 0,
            total_classes: 0,
            attendance_rate: 0,
          };
        })
      );

      setStudents(studentsWithAbsences);
    } catch (error) {
      console.error("Error loading students:", error);
    }
  };

  const loadAttendanceForDate = async () => {
    if (students.length === 0) return;

    const attendanceMap: Record<string, boolean> = {};

    for (const student of students) {
      const { data } = await supabase
        .from("attendance")
        .select("present")
        .eq("enrollment_id", student.enrollment_id)
        .eq("date", selectedDate)
        .maybeSingle();

      if (data) {
        attendanceMap[student.id] = data.present;
      }
    }

    setAttendance(attendanceMap);
  };

  const loadFrequencyData = async () => {
    try {
      // 1. Busca enrollments
      const { data: enrollments, error: enrollError } = await supabase
        .from("enrollments")
        .select("id, student_id")
        .eq("class_id", id)
        .eq("status", "active");

      if (enrollError) throw enrollError;

      if (!enrollments || enrollments.length === 0) {
        setFrequencyData([]);
        return;
      }

      // 2. Busca dados dos estudantes
      const studentIds = enrollments.map((e) => e.student_id);

      // Tenta buscar de profiles primeiro
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", studentIds);

      // Se profiles estiver vazio, busca de students
      let studentsData = null;
      if (!profiles || profiles.length === 0) {
        const { data } = await supabase
          .from("students")
          .select("user_id, full_name")
          .in("user_id", studentIds);
        studentsData = data;
      }

      // 3. Calcula estatísticas de frequência
      const frequencyStats = await Promise.all(
        enrollments.map(async (enrollment) => {
          // Busca o nome do estudante
          const profile = profiles?.find((p) => p.id === enrollment.student_id);
          const student = studentsData?.find(
            (s) => s.user_id === enrollment.student_id
          );
          const fullName =
            profile?.full_name || student?.full_name || "Sem nome";

          // Busca registros de presença
          const { data: attendanceRecords } = await supabase
            .from("attendance")
            .select("present")
            .eq("enrollment_id", enrollment.id);

          const totalClasses = attendanceRecords?.length || 0;
          const absences =
            attendanceRecords?.filter((a) => !a.present).length || 0;
          const presences = totalClasses - absences;
          const attendanceRate =
            totalClasses > 0 ? (presences / totalClasses) * 100 : 0;

          return {
            id: enrollment.student_id,
            enrollment_id: enrollment.id,
            full_name: fullName,
            absences,
            total_classes: totalClasses,
            attendance_rate: attendanceRate,
          };
        })
      );

      setFrequencyData(frequencyStats);
    } catch (error) {
      console.error("Error loading frequency data:", error);
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

  const handleAttendanceSubmit = async () => {
    const attendanceRecords = students.map((student) => ({
      enrollment_id: student.enrollment_id,
      date: selectedDate,
      present: attendance[student.id] || false,
    }));

    const { error } = await supabase
      .from("attendance")
      .upsert(attendanceRecords, {
        onConflict: "enrollment_id,date",
      });

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
      loadStudents();
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
          <h1 className="text-4xl font-bold">{classData?.activity}</h1>
          <p className="text-xl text-muted-foreground mt-2">
            {classData?.schedule} • {classData?.location}
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
            <TabsTrigger value="forum">
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
                            {student.full_name}
                          </TableCell>
                          <TableCell className="text-center">
                            {student.total_classes}
                          </TableCell>
                          <TableCell className="text-center text-green-600 font-semibold">
                            {student.total_classes - student.absences}
                          </TableCell>
                          <TableCell className="text-center text-red-600 font-semibold">
                            {student.absences}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant={
                                student.attendance_rate >= 75
                                  ? "default"
                                  : "destructive"
                              }
                              className="font-semibold"
                            >
                              {student.attendance_rate.toFixed(1)}%
                            </Badge>
                          </TableCell>

                          <TableCell className="text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                navigate(`/chat?contact=${student.id}`)
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
                <Textarea
                  placeholder="Digite sua mensagem..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  rows={3}
                />
                <Button onClick={handleSendMessage} className="w-full">
                  <Send className="w-4 h-4 mr-2" />
                  Enviar
                </Button>
              </CardContent>
            </Card>

            <div className="space-y-4">
              {messages.map((msg) => (
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
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ClassManagement;
