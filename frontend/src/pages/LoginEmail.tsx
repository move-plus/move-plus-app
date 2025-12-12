import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Lock, Loader2, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth";
import { Link } from "react-router-dom";

export default function LoginEmail() {
  const { loading } = useAuth(); // Loading global do contexto
  const { toast } = useToast();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tLoading, setTLoading] = useState(false); // Loading local do botão

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

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F5F7FA] px-4">
      <div className="w-full max-w-md bg-white p-8 shadow-xl rounded-3xl border border-gray-100">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#2D7DD2] mb-2">Move+</h1>
          <p className="text-gray-500">Entre com seu e-mail e senha</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">        
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="email"
                  placeholder="seu@email.com"
                  className="pl-10 h-14 bg-gray-50 border-gray-200"
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
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  className="pl-10 h-12 bg-gray-50 border-gray-200"
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
            className="w-full h-12 text-lg font-bold bg-[#E76F51] hover:bg-[#D65F41] text-white rounded-xl"
            disabled={tLoading || loading}
          >
            {(tLoading || loading) ? <Loader2 className="animate-spin" /> : <>Entrar como Profissional <ArrowRight className="ml-2 h-5 w-5"/></>}
          </Button>

          <div className="text-center text-sm text-gray-500">
            <a href="/signup" className="hover:text-[#E76F51] underline">
              Ainda não tem conta? Cadastre-se
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}