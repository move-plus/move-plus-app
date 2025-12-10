import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Send, ArrowLeft, User } from "lucide-react";

interface Contact {
  id: string;
  name: string;
  type: "student" | "professional";
  avatar_url: string;
}

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  message: string;
  created_at: string;
}

const PrivateChat = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [userType, setUserType] = useState<"student" | "professional" | null>(
    null
  );
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    initializeChat();
  }, []);

  useEffect(() => {
    if (selectedContact) {
      fetchMessages();
      subscribeToMessages();
    }
  }, [selectedContact]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const contactId = searchParams.get("contact");
    if (contactId && contacts.length > 0) {
      const contact = contacts.find((c) => c.id === contactId);
      if (contact) {
        setSelectedContact(contact);
      }
    }
  }, [searchParams, contacts]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const initializeChat = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      setCurrentUserId(user.id);

      // Check if user is student or professional
      const { data: studentData } = await supabase
        .from("students")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      const { data: professionalData } = await supabase
        .from("professionals")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (studentData) {
        setUserType("student");
        await fetchStudentContacts(user.id);
      } else if (professionalData) {
        setUserType("professional");
        await fetchProfessionalContacts(professionalData.id);
      }
    } catch (error: any) {
      toast({
        title: "Erro ao inicializar chat",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentContacts = async (userId: string) => {
    // Get all professionals from classes the student is enrolled in
    const { data: enrollments, error } = await supabase
      .from("enrollments")
      .select(
        `
        classes (
          professional_id,
          professionals (
            user_id,
            full_name,
            avatar_url
          )
        )
      `
      )
      .eq("student_id", userId)
      .eq("status", "enrolled");

    if (error) throw error;

    const contactsList: Contact[] = [];
    const seenIds = new Set();

    enrollments?.forEach((enrollment: any) => {
      const prof = enrollment.classes?.professionals;
      if (prof && !seenIds.has(prof.user_id)) {
        seenIds.add(prof.user_id);
        contactsList.push({
          id: prof.user_id,
          name: prof.full_name,
          type: "professional",
          avatar_url: prof.avatar_url,
        });
      }
    });

    setContacts(contactsList);
  };

  const fetchProfessionalContacts = async (professionalId: string) => {
    // Get all students enrolled in professional's classes
    const { data: enrollments, error } = await supabase
      .from("enrollments")
      .select(
        `
        student_id,
        classes!inner (
          professional_id
        )
      `
      )
      .eq("classes.professional_id", professionalId)
      .eq("status", "enrolled");

    if (error) throw error;

    // Now get student details separately
    const studentIds = enrollments?.map((e: any) => e.student_id) || [];
    const uniqueStudentIds = [...new Set(studentIds)];

    if (uniqueStudentIds.length === 0) {
      setContacts([]);
      return;
    }

    const { data: students, error: studentsError } = await supabase
      .from("students")
      //.select("user_id, full_name, avatar_url")
      .select("user_id, full_name")
      .in("user_id", uniqueStudentIds);

    if (studentsError) throw studentsError;

    const contactsList: Contact[] =
      students?.map((student) => ({
        id: student.user_id,
        name: student.full_name,
        type: "student" as const,
        avatar_url: ""//student.avatar_url
      })) || [];

    setContacts(contactsList);
  };

  const fetchMessages = async () => {
    if (!selectedContact) return;

    const { data, error } = await supabase
      .from("private_messages")
      .select("*")
      .or(
        `and(sender_id.eq.${currentUserId},recipient_id.eq.${selectedContact.id}),and(sender_id.eq.${selectedContact.id},recipient_id.eq.${currentUserId})`
      )
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching messages:", error);
      return;
    }

    setMessages(data || []);
  };

  const subscribeToMessages = () => {
    if (!selectedContact) return;

    const channel = supabase
      .channel(`private-chat-${currentUserId}-${selectedContact.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "private_messages",
          filter: `sender_id=eq.${selectedContact.id}`,
        },
        (payload) => {
          if (payload.new.recipient_id === currentUserId) {
            setMessages((prev) => [...prev, payload.new as Message]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedContact || sending) return;

    setSending(true);
    try {
      const { error } = await supabase.from("private_messages").insert({
        sender_id: currentUserId,
        recipient_id: selectedContact.id,
        content: newMessage.trim(),
      });

      if (error) throw error;

      // Add message locally
      const newMsg: Message = {
        id: crypto.randomUUID(),
        sender_id: currentUserId,
        recipient_id: selectedContact.id,
        content: newMessage.trim(),
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, newMsg]);
      setNewMessage("");
    } catch (error: any) {
      toast({
        title: "Erro ao enviar mensagem",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <div className="container py-12">Carregando...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background py-12 px-4">
      <div className="container max-w-6xl mx-auto">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>

        <div className="grid md:grid-cols-[300px_1fr] gap-4 h-[600px]">
          {/* Contacts List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {userType === "student" ? "Meus Professores" : "Meus Alunos"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-1">
                {contacts.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8 px-4">
                    Nenhum contato disponível
                  </p>
                ) : (
                  contacts.map((contact) => (
                    <button
                      key={contact.id}
                      onClick={() => setSelectedContact(contact)}
                      className={`w-full text-left px-4 py-3 hover:bg-accent transition-colors flex items-center gap-3 ${
                        selectedContact?.id === contact.id ? "bg-accent" : ""
                      }`}
                    >
                      {contact.avatar_url ? (
                        <img
                          className="h-7 w-7 text-muted-foreground rounded-full"
                          src={contact.avatar_url}
                          alt={`photo-of-${contact.name}`}
                        />
                      ) : (
                        <User className="h-5 w-5 text-muted-foreground" />
                      )}

                      <span className="font-medium">{contact.name}</span>
                    </button>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Messages Area */}
          <Card className="flex flex-col">
            {selectedContact ? (
              <>
                <CardHeader className="border-b">
                  <CardTitle className="flex items-center gap-2">
                    {selectedContact.avatar_url ? (
                      <img
                        className="h-8 w-8 text-muted-foreground rounded-full"
                        src={selectedContact.avatar_url}
                        alt={`photo-of-${selectedContact.name}`}
                      />
                    ) : (
                      <User className="h-5 w-5" />
                    )}
                    {selectedContact.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhuma mensagem ainda. Envie a primeira!
                    </p>
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${
                          msg.sender_id === currentUserId
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg px-4 py-2 ${
                            msg.sender_id === currentUserId
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          <p className="text-sm">{msg.content}</p>
                          <span className="text-xs opacity-70">
                            {new Date(msg.created_at).toLocaleTimeString(
                              "pt-BR",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </CardContent>
                <div className="border-t p-4">
                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Digite sua mensagem..."
                      disabled={sending}
                    />
                    <Button
                      type="submit"
                      size="icon"
                      disabled={sending || !newMessage.trim()}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </>
            ) : (
              <CardContent className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">
                  Selecione um contato para iniciar a conversa
                </p>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PrivateChat;
