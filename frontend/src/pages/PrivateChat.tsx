import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Send, ArrowLeft, User, Loader2 } from "lucide-react";

interface Contact {
  id: string;
  name: string;
  role: "student" | "professional";
  avatar_url: string | null;
}

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string; // Padronizado para content
  created_at: string;
}

const PrivateChat = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [userRole, setUserRole] = useState<"student" | "professional" | null>(null);
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
      const unsubscribe = subscribeToMessages();
      return () => {
        if (unsubscribe) unsubscribe();
      };
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

  // 1. INICIALIZAÇÃO BASEADA NA TABELA PROFILES
  const initializeChat = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }

      setCurrentUserId(user.id);

      // Busca quem sou eu na tabela profiles
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (error || !profile) {
        console.error("Erro ao buscar perfil:", error);
        toast({ title: "Erro", description: "Perfil não encontrado.", variant: "destructive" });
        return;
      }

      // O role vem como string, forçamos a tipagem
      const role = profile.role as "student" | "professional";
      setUserRole(role);

      if (role === "student") {
        await fetchStudentContacts(user.id);
      } else if (role === "professional") {
        await fetchProfessionalContacts(user.id);
      }

    } catch (error: any) {
      toast({
        title: "Erro ao inicializar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // 2. SE EU SOU ALUNO: Busco Professores
  const fetchStudentContacts = async (studentId: string) => {
    // Passo A: Pegar as turmas que estou matriculado
    const { data: enrollments, error: enrollError } = await supabase
      .from("enrollments")
      .select(`
        classes (
          professional_id
        )
      `)
      .eq("user_id", studentId) // user_id em enrollments é o aluno
      .eq("status", "payment_pending"); // Ou 'active', ajuste conforme seu status real

    if (enrollError) {
      console.error("Erro ao buscar matrículas:", enrollError);
      return;
    }

    // Passo B: Extrair IDs dos professores (sem duplicatas)
    const professionalIds = new Set<string>();
    enrollments?.forEach((item: any) => {
      if (item.classes?.professional_id) {
        professionalIds.add(item.classes.professional_id);
      }
    });

    if (professionalIds.size === 0) {
      setContacts([]);
      return;
    }

    // Passo C: Buscar detalhes na tabela PROFILES
    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name, role, avatar_url")
      .in("id", Array.from(professionalIds));

    if (profileError) {
      console.error("Erro ao buscar perfis dos professores:", profileError);
      return;
    }

    // Formatar contatos
    const formattedContacts: Contact[] = profiles.map(p => ({
      id: p.id,
      name: p.full_name || "Professor",
      role: "professional",
      avatar_url: p.avatar_url
    }));

    setContacts(formattedContacts);
  };

  // 3. SE EU SOU PROFISSIONAL: Busco Alunos
  const fetchProfessionalContacts = async (professionalId: string) => {
    // Passo A: Buscar minhas turmas e ver quem está nelas
    // Usamos o classes!inner para filtrar turmas onde EU sou o professional_id
    const { data: classData, error: classError } = await supabase
      .from("classes")
      .select(`
        enrollments (
          user_id
        )
      `)
      .eq("professional_id", professionalId);

    if (classError) {
      console.error("Erro ao buscar turmas:", classError);
      return;
    }

    // Passo B: Extrair IDs dos alunos
    const studentIds = new Set<string>();
    classData?.forEach((cls: any) => {
      cls.enrollments?.forEach((enr: any) => {
        if (enr.user_id) studentIds.add(enr.user_id);
      });
    });

    if (studentIds.size === 0) {
      setContacts([]);
      return;
    }

    // Passo C: Buscar detalhes na tabela PROFILES
    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name, role, avatar_url")
      .in("id", Array.from(studentIds));

    if (profileError) {
      console.error("Erro ao buscar perfis dos alunos:", profileError);
      return;
    }

    const formattedContacts: Contact[] = profiles.map(p => ({
      id: p.id,
      name: p.full_name || "Aluno",
      role: "student",
      avatar_url: p.avatar_url
    }));

    setContacts(formattedContacts);
  };

  const fetchMessages = async () => {
    if (!selectedContact) return;

    const { data, error } = await supabase
      .from("private_messages")
      .select("*")
      .or(`and(sender_id.eq.${currentUserId},recipient_id.eq.${selectedContact.id}),and(sender_id.eq.${selectedContact.id},recipient_id.eq.${currentUserId})`)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching messages:", error);
      return;
    }

    // Mapeia para garantir que o campo 'content' seja usado (caso seu banco use 'message')
    const mappedMessages = (data || []).map((msg: any) => ({
      id: msg.id,
      sender_id: msg.sender_id,
      recipient_id: msg.recipient_id,
      content: msg.content || msg.message, // Fallback de segurança
      created_at: msg.created_at
    }));

    setMessages(mappedMessages);
  };

  const subscribeToMessages = () => {
    if (!selectedContact) return;

    const channel = supabase
      .channel(`chat-${currentUserId}-${selectedContact.id}`)
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
            const newMsg = payload.new;
            setMessages((prev) => [...prev, {
              id: newMsg.id,
              sender_id: newMsg.sender_id,
              recipient_id: newMsg.recipient_id,
              content: newMsg.content || newMsg.message,
              created_at: newMsg.created_at
            }]);
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

    const msgContent = newMessage.trim();
    setNewMessage(""); 
    setSending(true);

    try {
      const { data, error } = await supabase
        .from("private_messages")
        .insert({
          sender_id: currentUserId,
          recipient_id: selectedContact.id,
          content: msgContent, 
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setMessages((prev) => [...prev, {
            id: data.id,
            sender_id: data.sender_id,
            recipient_id: data.recipient_id,
            content: data.content || data.message,
            created_at: data.created_at
        }]);
      }
    } catch (error: any) {
      setNewMessage(msgContent); 
      toast({
        title: "Erro ao enviar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-gray-500">Carregando conversas...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-8 px-4">
      <div className="container max-w-6xl mx-auto h-[calc(100vh-100px)] flex flex-col">
        <div className="flex items-center mb-4">
            <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2 pl-0 hover:bg-transparent hover:text-primary">
            <ArrowLeft className="h-4 w-4" />
            Voltar
            </Button>
        </div>

        <div className="grid md:grid-cols-[300px_1fr] gap-6 flex-1 min-h-0">
          {/* Lista de Contatos */}
          <Card className="flex flex-col h-full border-0 shadow-md">
            <CardHeader className="bg-white border-b px-4 py-3">
              <CardTitle className="text-base font-semibold text-gray-700">
                {userRole === "student" ? "Meus Professores" : "Meus Alunos"}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-0">
              <div className="divide-y">
                {contacts.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-8">
                    Nenhum contato encontrado.
                  </p>
                ) : (
                  contacts.map((contact) => (
                    <button
                      key={contact.id}
                      onClick={() => setSelectedContact(contact)}
                      className={`w-full text-left px-4 py-4 transition-colors flex items-center gap-3 hover:bg-gray-50 ${
                        selectedContact?.id === contact.id ? "bg-blue-50 border-l-4 border-primary" : ""
                      }`}
                    >
                      <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center shrink-0 overflow-hidden">
                        {contact.avatar_url ? (
                          <img src={contact.avatar_url} alt={contact.name} className="h-full w-full object-cover" />
                        ) : (
                          <User className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                      <div className="truncate">
                        <span className="font-medium text-sm text-gray-900 block">{contact.name}</span>
                        <span className="text-xs text-gray-500 capitalize">
                            {contact.role === 'professional' ? 'Professor' : 'Aluno'}
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Área de Chat */}
          <Card className="flex flex-col h-full border-0 shadow-md overflow-hidden">
            {selectedContact ? (
              <>
                <CardHeader className="bg-white border-b px-6 py-3 shrink-0 flex flex-row items-center gap-3">
                   <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center text-primary font-bold shrink-0 overflow-hidden relative">
                      {selectedContact.avatar_url ? (
                        <img 
                          src={selectedContact.avatar_url} 
                          alt={selectedContact.name} 
                          className="h-full w-full object-cover" 
                        />
                      ) : (
                        <span>{selectedContact.name.charAt(0).toUpperCase()}</span>
                      )}
                   </div>
                  <CardTitle className="text-base font-medium">
                    {selectedContact.name}
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-2">
                        <Send className="h-8 w-8 opacity-20" />
                        <p>Comece a conversar com {selectedContact.name.split(' ')[0]}</p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                       const isMe = msg.sender_id === currentUserId;
                       return (
                        <div
                            key={msg.id}
                            className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                        >
                            <div
                            className={`max-w-[75%] rounded-2xl px-4 py-2 shadow-sm ${
                                isMe
                                ? "bg-blue-600 text-white rounded-tr-none"
                                : "bg-white text-gray-800 border rounded-tl-none"
                            }`}
                            >
                            <p className="text-sm leading-relaxed">{msg.content}</p>
                            <span className={`text-[10px] block text-right mt-1 ${isMe ? "text-blue-100" : "text-gray-400"}`}>
                                {new Date(msg.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                            </div>
                        </div>
                       );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </CardContent>

                <div className="p-4 bg-white border-t mt-auto">
                  <form onSubmit={handleSendMessage} className="flex gap-3">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Digite sua mensagem..."
                      disabled={sending}
                      className="flex-1 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                    />
                    <Button
                      type="submit"
                      size="icon"
                      className="bg-blue-600 hover:bg-blue-700 shrink-0"
                      disabled={sending || !newMessage.trim()}
                    >
                      {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                  </form>
                </div>
              </>
            ) : (
              <CardContent className="flex flex-col items-center justify-center h-full text-gray-400 bg-slate-50/50">
                <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <User className="h-8 w-8 text-gray-300" />
                </div>
                <p className="font-medium text-gray-500">Nenhum chat selecionado</p>
                <p className="text-sm">Selecione um contato ao lado para iniciar</p>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PrivateChat;