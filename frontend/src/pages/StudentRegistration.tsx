import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Upload } from "lucide-react";

const StudentRegistration = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [certificateFile, setCertificateFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    fullName: "",
    gender: "",
    phone: "",
    email: "",
    cpf: "",
    address: "",
    birthDate: "",
  });

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }
    return age;
  };

  const isOver60 = formData.birthDate
    ? calculateAge(formData.birthDate) > 60
    : false;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCertificateFile(e.target.files[0]);
    }
  };

  const uploadCertificate = async (userId: string) => {
    if (!certificateFile) return null;

    setUploadingFile(true);
    try {
      const fileExt = certificateFile.name.split(".").pop();
      const fileName = `${userId}/certificate.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("health-certificates")
        .upload(fileName, certificateFile, { upsert: true });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("health-certificates").getPublicUrl(fileName);

      return publicUrl;
    } catch (error: any) {
      toast({
        title: "Erro ao fazer upload do atestado",
        description: error.message,
        variant: "destructive",
      });
      return null;
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isOver60 && !certificateFile) {
      toast({
        title: "Atestado obrigatório",
        description:
          "Para maiores de 60 anos, o atestado médico é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      let certificateUrl = null;
      if (certificateFile) {
        certificateUrl = await uploadCertificate(user.id);
        if (isOver60 && !certificateUrl) {
          setLoading(false);
          return;
        }
      }

      const { error: studentError } = await supabase
        .from("students")
        .upsert(
          {
            user_id: user.id,
            full_name: formData.fullName,
            gender: formData.gender,
            phone: formData.phone,
            email: formData.email,
            cpf: formData.cpf,
            address: formData.address,
            birth_date: formData.birthDate,
            health_certificate_url: certificateUrl,
          },
          { onConflict: "user_id" }
        );

      if (studentError) throw studentError;

      toast({
        title: "Cadastro concluído!",
        description: "Agora você pode encontrar turmas disponíveis.",
      });

      navigate("/buscar-aulas");
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
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background py-12 px-4">
      <div className="container max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Cadastro de Aluno</CardTitle>
            <CardDescription>
              Preencha seus dados para começar a participar das turmas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Nome Completo</Label>
                <Input
                  id="fullName"
                  required
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Sexo</Label>
                <Select
                  required
                  value={formData.gender}
                  onValueChange={(value) =>
                    setFormData({ ...formData, gender: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="masculino">Masculino</SelectItem>
                    <SelectItem value="feminino">Feminino</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="birthDate">Data de Nascimento</Label>
                <Input
                  id="birthDate"
                  type="date"
                  required
                  value={formData.birthDate}
                  onChange={(e) =>
                    setFormData({ ...formData, birthDate: e.target.value })
                  }
                />
                {isOver60 && (
                  <p className="text-sm text-muted-foreground">
                    ⚠️ Será necessário anexar um atestado médico
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cpf">CPF</Label>
                <Input
                  id="cpf"
                  required
                  value={formData.cpf}
                  onChange={(e) =>
                    setFormData({ ...formData, cpf: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <Input
                  id="address"
                  required
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                />
              </div>

              {isOver60 && (
                <div className="space-y-2">
                  <Label htmlFor="certificate">
                    Atestado Médico{" "}
                    {isOver60 && <span className="text-destructive">*</span>}
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="certificate"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileChange}
                      required={isOver60}
                    />
                    {certificateFile && (
                      <Upload className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Formatos aceitos: PDF, JPG, PNG
                  </p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={loading || uploadingFile}
              >
                {loading || uploadingFile
                  ? "Cadastrando..."
                  : "Concluir Cadastro"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudentRegistration;
