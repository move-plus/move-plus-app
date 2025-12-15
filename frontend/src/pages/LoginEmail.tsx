import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Lock, Loader2, ArrowRight, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth";
import { Link, useNavigate } from "react-router-dom";

export default function LoginEmail() {
  const { loading } = useAuth(); // Loading global do contexto
  const { toast } = useToast();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tLoading, setTLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setTLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast({ title: "Login realizado com sucesso!" });

    } catch (error: any) {
      toast({
        title: "Erro ao entrar",
        description: error.message === "Invalid login credentials" 
          ? "E-mail ou senha incorretos." 
          : error.message,
        variant: "destructive",
      });
      setTLoading(false);
    }
  };

  const navigate = useNavigate();

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
          <h1 className="text-2xl font-bold text-[#1756AC] mb-2">Move+</h1>
          <p className="text-sm text-gray-600">Entre com seu e-mail e senha</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-4">        
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
                  disabled={tLoading || loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  className="pl-10 h-11 border-gray-300 hover:border-[#5F94E2] focus:border-[#5F94E2] transition-colors"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={tLoading || loading}
                />
              </div>
            </div>

          </div>

          <Button 
            type="submit" 
            className="w-full h-11 text-base bg-[#5F94E2] hover:bg-[#1756AC] transition-colors mt-6"
            disabled={tLoading || loading}
          >
            {(tLoading || loading) ? <Loader2 className="animate-spin" /> : <>Entrar como Profissional <ArrowRight className="ml-2 h-4 w-4"/></>}
          </Button>

          <div className="text-center text-sm text-gray-600">
            <a href="/signup" className="hover:text-[#5F94E2] transition-colors">
              Ainda não tem conta? Cadastre-se
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}