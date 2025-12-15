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
  Phone,
  Mail,
  FileText,
  MapPin as MapPinIcon,
  AlertCircle
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface StudentDetails {
  id: string;
  health_certificate_url?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
}

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
    avatar_url?: string | null;
    phone?: string | null;
    email?: string | null;
    address?: any | null; 
  } | null;
  students: StudentDetails | null;
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

  const [selectedStudent, setSelectedStudent] = useState<FrequencyData | null>(null);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);

  useEffect(() => {
    loadClassData();
    loadStudents();
    loadFrequencyData();
  }, [id]);

  const handleOpenStudentDetails = (student: FrequencyData) => {
    setSelectedStudent(student);
    setIsStudentModalOpen(true);
  };

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
      const { data: enrollments, error: enrollError } = await supabase
        .from("enrollments")
        .select("user_id")
        .eq("class_id", id);

      if (enrollError) throw enrollError;

      const studentIds = enrollments?.map((e) => e.user_id) || [];

      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, email, phone")
        .in("id", studentIds);
        
      if (profileError) throw profileError;

      const { data: studentsData, error: studentsError } = await supabase
        .from("students")
        .select("id, health_certificate_url, emergency_contact_name, emergency_contact_phone") 
        .in("id", studentIds);

      if (studentsError) console.warn("Erro ao buscar dados complementares:", studentsError);

      const { data: frequencyRecords, error: freqError } = await supabase
        .from("frequency")
        .select("user_id, date")
        .eq("class_id", id);

      if (freqError) throw freqError;

      const uniqueDates = new Set(frequencyRecords?.map(f => f.date) || []);
      const totalClasses = uniqueDates.size;
      const presenceCount = new Map<string, number>();
      
      frequencyRecords?.forEach(record => {
        presenceCount.set(
          record.user_id,
          (presenceCount.get(record.user_id) || 0) + 1
        );
      });

      const consolidatedData = studentIds.map((userId) => {
        const profile = profiles?.find((p) => p.id === userId);
        const studentInfo = studentsData?.find((s) => s.user_id === userId);
        const presences = presenceCount.get(userId) || 0;
        
        return {
          id: userId,
          user_id: userId,
          class_id: id!,
          date: "",
          profiles: profile || { full_name: "Desconhecido" },
          students: (studentInfo as unknown as StudentDetails) || null,
          absences: totalClasses - presences,
          total_classes: totalClasses,
          attendance_rate: totalClasses > 0 ? (presences / totalClasses) * 100 : 0,
        };
      });

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
                  Selecione a data e marque os alunos presentes. Clique no nome para ver detalhes.
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
                    {students.map((student) => {
                      const fullStudentData = frequencyData.find(f => f.user_id === student.id);

                      return (
                        <TableRow 
                          key={student.id}
                          className="cursor-pointer hover:bg-gray-50 transition-colors"
                          onClick={() => {
                            if (fullStudentData) handleOpenStudentDetails(fullStudentData);
                          }}
                        >
                          <TableCell className="font-medium">
                            <span className="underline decoration-dotted underline-offset-4 decoration-muted-foreground/30">
                              {student.full_name}
                            </span>
                          </TableCell>
                          
                          <TableCell className="text-center">
                             <Badge 
                               variant={student.payment_status === 'active' ? 'outline' : 'destructive'} 
                               className={student.payment_status === 'active' ? "border-green-600 text-green-700 bg-green-50" : ""}
                             >
                               {student.payment_status === 'active' ? 'Em dia' : 'Pendente'}
                             </Badge>
                          </TableCell>

                          <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
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
                      );
                    })}
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
                  Visão geral da frequência e cadastro. Clique para ver detalhes.
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
                        <TableRow 
                          key={student.id} 
                          className="cursor-pointer hover:bg-gray-50 transition-colors"
                          onClick={() => handleOpenStudentDetails(student)}
                        >
                          <TableCell className="font-medium flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={student.profiles?.avatar_url || ""} />
                              <AvatarFallback>{student.profiles?.full_name?.charAt(0) || "A"}</AvatarFallback>
                            </Avatar>
                            <span className="underline decoration-dotted underline-offset-4 text-primary">
                              {student.profiles?.full_name || "Sem nome"}
                            </span>
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
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/chat?contact=${student.user_id}`)
                              }}
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

      <Dialog open={isStudentModalOpen} onOpenChange={setIsStudentModalOpen}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>Detalhes do Aluno</DialogTitle>
            <DialogDescription>Informações de cadastro e contato.</DialogDescription>
          </DialogHeader>

          {selectedStudent && selectedStudent.profiles && (
            <div className="flex flex-col items-center space-y-6 py-4">
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-24 w-24 border-4 border-white shadow-lg mb-4">
                  <AvatarImage src={selectedStudent.profiles.avatar_url || ""} />
                  <AvatarFallback className="text-2xl bg-gray-100">
                    {selectedStudent.profiles.full_name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <h3 className="text-xl font-bold">{selectedStudent.profiles.full_name}</h3>
                <Badge 
                  variant={selectedStudent.attendance_rate! >= 75 ? "outline" : "destructive"} 
                  className="mt-2"
                >
                  Frequência: {selectedStudent.attendance_rate!.toFixed(1)}%
                </Badge>
              </div>
              <div className="w-full space-y-4 bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {selectedStudent.students?.phone || selectedStudent.profiles.phone || "Telefone não informado"}
                  </span>
                </div>
                
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm truncate">
                    {selectedStudent.profiles.email || "Email não informado"}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <MapPinIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {typeof selectedStudent.students?.address === 'object' 
                      ? `${selectedStudent.students?.address?.street || 'Endereço'}, ${selectedStudent.students?.address?.number || ''}`
                      : (selectedStudent.students?.address || selectedStudent.profiles.address || "Endereço não informado")
                    }
                  </span>
                </div>
                <div className="pt-2 mt-2 border-t border-gray-200">
                  <p className="text-xs font-semibold text-red-500 mb-1 uppercase">Em caso de emergência</p>
                  <div className="flex items-center gap-3">
                    <div className="bg-red-100 p-1.5 rounded-full">
                      <Phone className="h-3 w-3 text-red-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-800">
                      {selectedStudent.students?.emergency_contact || "Não informado"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="w-full">
                <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
                  Documentação
                </p>
                {selectedStudent.students?.health_certificate_url ? (
                  <Button 
                    variant="outline" 
                    className="w-full justify-start h-12"
                    asChild
                  >
                    <a 
                      href={selectedStudent.students.health_certificate_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      <FileText className="h-5 w-5 mr-3 text-blue-600" />
                      <div className="flex flex-col items-start text-left">
                        <span className="text-sm font-medium">Visualizar Atestado Médico</span>
                        <span className="text-xs text-muted-foreground">Clique para abrir</span>
                      </div>
                    </a>
                  </Button>
                ) : (
                  <div className="flex items-center gap-2 p-3 border border-dashed rounded-md text-muted-foreground bg-gray-50">
                    <AlertCircle className="h-5 w-5 text-yellow-500" />
                    <span className="text-sm">Atestado pendente.</span>
                  </div>
                )}
              </div>
              <Button 
                className="w-full" 
                onClick={() => {
                  navigate(`/chat?contact=${selectedStudent.user_id}`);
                  setIsStudentModalOpen(false);
                }}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Enviar Mensagem
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClassManagement;