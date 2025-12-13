import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Lock, User, Loader2, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth";

export default function SignUpEmail() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { fetchRole } = useAuth(); 
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        const { error: profileError } = await supabase
          .from("profiles")
          .upsert({
            id: data.user.id,
            full_name: name,
            role: "professional",
            email: email
          });

        if (profileError) throw profileError;

        toast({ title: "Conta criada com sucesso!" });

        await fetchRole(data.user.id);
        navigate("/cadastro-profissional");
      }

    } catch (error: any) {
      toast({
        title: "Erro ao cadastrar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F5F7FA] px-4">
      <div className="w-full max-w-md bg-white p-8 shadow-xl rounded-3xl border border-gray-100">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#5F94E2] mb-2">Criar Conta</h1>
          <p className="text-gray-500">Cadastro exclusivo para Professores</p>
        </div>

        <form onSubmit={handleSignUp} className="space-y-6">
          <div className="space-y-4">
            
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Nome Completo</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Seu nome"
                  className="pl-10 h-14 bg-gray-50 border-gray-200"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="email"
                  placeholder="seu@email.com"
                  className="pl-10 h-14 bg-gray-50 border-gray-200"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  className="pl-10 h-14 bg-gray-50 border-gray-200"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  required
                  disabled={loading}
                />
              </div>
            </div>

          </div>

          <Button 
            type="submit" 
            className="w-full h-14 text-lg font-bold bg-[#5F94E2] hover:bg-[#1756AC] text-white rounded-xl"
            disabled={loading}
          >
            {loading ? <Loader2 className="animate-spin" /> : <>Criar Conta <ArrowRight className="ml-2" /></>}
          </Button>
        </form>

        <div className="mt-8 text-center">
          <Link to="/login-profissional" className="text-sm text-gray-500 hover:text-[#5F94E2]">
            Já tem conta? Faça login
          </Link>
        </div>

      </div>
    </div>
  );
}