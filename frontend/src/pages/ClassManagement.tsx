import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea"; // Certifique-se de ter este componente
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
  User,
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
  const [sendingMessage, setSendingMessage] = useState(false);
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
    loadMessages(); // Carregar mensagens ao iniciar
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

      let studentsInfo = null;
      const { data: studentsData, error: studentsError } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", studentIds);

      studentsInfo = studentsData;
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

      setStudents(studentsWithAbsences as any);
    } catch (error) {
      console.error("Error loading students:", error);
    }
  };

  // --- LÓGICA DO FÓRUM: Carregar Mensagens ---
  const loadMessages = async () => {
    // 1. Busca as mensagens da tabela forum_messages filtrando pelo class_id
    const { data, error } = await supabase
      .from("forum_messages")
      .select(`
        *
      `)
      .eq("class_id", id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao carregar mensagens:", error);
      return;
    }

    if (data) {
      setMessages(data as any);
    }
  };

  // --- LÓGICA DO FÓRUM: Enviar Mensagem ---
  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    setSendingMessage(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Erro",
          description: "Você precisa estar logado para enviar mensagens.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase.from("forum_messages").insert({
        class_id: classData.id,
        //user_id: user.id, // Importante para saber quem enviou
        message: newMessage.trim(),
      });

      if (error) throw error;

      toast({
        title: "Mensagem enviada",
        description: "Sua mensagem foi postada no mural da turma.",
      });

      setNewMessage("");
      loadMessages(); // Recarrega a lista
    } catch (error: any) {
      toast({
        title: "Erro ao enviar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSendingMessage(false);
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

      if (freqError) return;

      const { data: enrollments, error: enrollError } = await supabase
        .from("enrollments")
        .select("user_id")
        .eq("class_id", id);

      if (enrollError) return;

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
      loadStudents();
      loadFrequencyData(); // Recarrega dados de frequência
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
          <TabsList className="grid w-full grid-cols-3 bg-gray-100 p-1">
            <TabsTrigger 
              value="attendance"
              className="data-[state=active]:bg-white data-[state=active]:text-[#5F94E2] data-[state=active]:shadow-sm transition-all hover:bg-white/50"
            >
              <ClipboardList className="w-4 h-4 mr-2" />
              Chamada
            </TabsTrigger>
            <TabsTrigger 
              value="frequency"
              className="data-[state=active]:bg-white data-[state=active]:text-[#5F94E2] data-[state=active]:shadow-sm transition-all hover:bg-white/50"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Frequência
            </TabsTrigger>
            <TabsTrigger 
              value="forum"
              className="data-[state=active]:bg-white data-[state=active]:text-[#5F94E2] data-[state=active]:shadow-sm transition-all hover:bg-white/50"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Fórum
            </TabsTrigger>
          </TabsList>

          <TabsContent value="attendance" className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-[#1756AC] mb-2">Lista de Chamada</h3>
              <p className="text-sm text-gray-600 mb-6">
                Selecione a data e marque os alunos presentes
              </p>
              <div className="space-y-4">
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
                  className="w-full bg-[#25C588] hover:bg-[#25C588]/90 text-white"
                  size="lg"
                >
                  Salvar Chamada
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="frequency" className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-[#1756AC] mb-2">Frequência Consolidada</h3>
              <p className="text-sm text-gray-600 mb-6">
                Visão geral da frequência de todos os alunos
              </p>
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
            </div>
          </TabsContent>

          {/* --- NOVA ABA DE FÓRUM IMPLEMENTADA --- */}
          <TabsContent value="forum" className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-[#1756AC] mb-4">Mural da Turma</h3>
              <p className="text-sm text-gray-600 mb-6">
                Envie avisos e mensagens para toda a turma
              </p>
              
              <div className="space-y-4">
                <Textarea
                  placeholder="Escreva sua mensagem aqui..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  rows={4}
                  className="resize-none bg-gray-50 border-gray-200"
                />
                <div className="flex justify-end">
                  <Button 
                    onClick={handleSendMessage} 
                    className="bg-[#5F94E2] hover:bg-[#2D7DD2] text-white"
                    disabled={sendingMessage || !newMessage.trim()}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {sendingMessage ? "Enviando..." : "Enviar Mensagem"}
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                Histórico de Mensagens
              </h4>
              
              {messages.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-200">
                  <MessageSquare className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Nenhuma mensagem postada ainda.</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <Card key={msg.id} className="overflow-hidden border-l-4 border-l-[#5F94E2] hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="h-4 w-4 text-[#1756AC]" />
                          </div>
                          <div>
                            <p className="font-semibold text-[#1756AC] text-sm">
                              {"Professor"}
                            </p>
                            <p className="text-xs text-gray-400">
                              {format(new Date(msg.created_at), "dd 'de' MMMM 'às' HH:mm", {
                                locale: ptBR,
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                      <p className="text-gray-700 text-sm leading-relaxed pl-10">
                        {msg.message}
                      </p>
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