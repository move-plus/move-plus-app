import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Lock, User, Loader2, ArrowRight, ArrowLeft } from "lucide-react";
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-white px-4">
      <div className="w-full max-w-md bg-white p-8 shadow-sm rounded-xl border relative">
        <button
          onClick={() => navigate(-1)}
          className="absolute top-6 left-6 text-gray-600 hover:text-[#5F94E2] transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#1756AC] mb-2">Criar Conta</h1>
          <p className="text-sm text-gray-600">Cadastro exclusivo para Professores</p>
        </div>

        <form onSubmit={handleSignUp} className="space-y-5">
          <div className="space-y-4">
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Nome Completo</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Seu nome"
                  className="pl-10 h-11 border-gray-300 hover:border-[#5F94E2] focus:border-[#5F94E2] transition-colors"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="email"
                  placeholder="seu@email.com"
                  className="pl-10 h-11 border-gray-300 hover:border-[#5F94E2] focus:border-[#5F94E2] transition-colors"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  className="pl-10 h-11 border-gray-300 hover:border-[#5F94E2] focus:border-[#5F94E2] transition-colors"
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
            className="w-full h-11 text-base bg-[#5F94E2] hover:bg-[#1756AC] transition-colors mt-6"
            disabled={loading}
          >
            {loading ? <Loader2 className="animate-spin" /> : <>Criar Conta <ArrowRight className="ml-2 h-4 w-4" /></>}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Link to="/login-profissional" className="text-sm text-gray-600 hover:text-[#5F94E2] transition-colors">
            Já tem conta? Faça login
          </Link>
        </div>

      </div>
    </div>
  );
}