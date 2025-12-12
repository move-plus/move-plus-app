import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Phone, ArrowRight, Loader2 } from "lucide-react";
import { useAuth } from "@/context/auth";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

export default function LoginPhone() {
  const { loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [step, setStep] = useState<"PHONE" | "OTP">("PHONE");
  const [tLoading, setTLoading] = useState(false); // Loading local da transação
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setTLoading(true);

    try {
      const cleanPhone = phone.replace(/\D/g, ""); 
      const formattedPhone = `+55${cleanPhone}`;

      if (cleanPhone.length < 10) throw new Error("Número inválido.");

      const { error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
      });

      if (error) throw error;

      setStep("OTP");
      toast({ title: "Código enviado!", description: "Verifique seu SMS." });

    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setTLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setTLoading(true);

    try {
      const cleanPhone = phone.replace(/\D/g, "");
      const formattedPhone = `+55${cleanPhone}`;

      const { error } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token: otp,
        type: "sms",
      });

      if (error) throw error;
      
      toast({ title: "Bem-vindo ao Move+!" });

    } catch (error: any) {
      toast({ title: "Código inválido", variant: "destructive" });
    } finally {
      setTLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F5F7FA] px-4">
      <div className="w-full max-w-md bg-white p-8 shadow-xl rounded-3xl border border-gray-100">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#2D7DD2] mb-2">Move+</h1>
          <p className="text-gray-500">
            {step === "PHONE" ? "Digite seu celular para entrar" : `Enviamos um código para ${phone}`}
          </p>
        </div>

        {step === "PHONE" && (
          <form onSubmit={handleSendCode} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Seu número</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="tel"
                  placeholder="(11) 99999-9999"
                  className="pl-10 h-14 text-lg bg-gray-50"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  disabled={tLoading || loading}
                />
              </div>
            </div>
            <Button type="submit" className="w-full h-14 text-lg bg-[#2D7DD2]" disabled={tLoading || loading}>
              {(tLoading || loading) ? <Loader2 className="animate-spin" /> : "Receber Código"}
            </Button>
          </form>
        )}

        {step === "OTP" && (
          <form onSubmit={handleVerifyCode} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Código</label>
              <Input
                type="text"
                maxLength={6}
                placeholder="000000"
                className="h-16 text-center text-3xl tracking-[0.5em] font-bold bg-gray-50"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                disabled={tLoading || loading}
              />
            </div>
            <Button type="submit" className="w-full h-14 text-lg bg-[#86CD82] text-white" disabled={tLoading || loading}>
              {(tLoading || loading) ? <Loader2 className="animate-spin" /> : <>Entrar <ArrowRight className="ml-2" /></>}
            </Button>
            <button type="button" onClick={() => setStep("PHONE")} className="w-full text-center text-sm text-gray-400 p-2">
              Corrigir número
            </button>
          </form>
        )}
      </div>
      <div className="mt-8 text-center">
        <Link to="/login-profissional" className="text-sm text-gray-500 hover:text-[#E76F51]">
          É professor? Entre aqui
        </Link>
      </div>
    </div>
  );
}