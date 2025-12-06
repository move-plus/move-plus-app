import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  User,
  Calendar,
  Mail,
  Phone,
  MapPin,
  FileText,
  Award,
  Camera,
} from "lucide-react";

interface StudentData {
  full_name: string;
  gender: string;
  phone: string;
  email: string;
  cpf: string;
  address: string;
  birth_date: string;
  health_certificate_url: string | null;
  avatar_url: string | null;
}

interface ProfessionalData {
  full_name: string;
  birth_date: string;
  cpf: string;
  cref: string;
  specialty: string;
  avatar_url: string | null;
}

export default function Profile() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [userRole, setUserRole] = useState<"student" | "professional" | null>(
    null
  );
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [professionalData, setProfessionalData] =
    useState<ProfessionalData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [authUser, setAuthUser] = useState<any>(null);

  useEffect(() => {
    checkAuthAndLoadProfile();
  }, []);

  const checkAuthAndLoadProfile = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    setAuthUser(session.user);

    // Check user role
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id);

    const resolvedRole = roles?.find(
      (r) => r.role === "student" || r.role === "professional"
    )?.role as "student" | "professional" | undefined;

    if (resolvedRole === "student") {
      setUserRole("student");
      await loadStudentData(session.user.id);
    } else if (resolvedRole === "professional") {
      setUserRole("professional");
      await loadProfessionalData(session.user.id);
    } else {
      // Fallback: tenta descobrir pelo cadastro existente
      const studentFound = await loadStudentData(session.user.id);
      if (studentFound) {
        setUserRole("student");
      } else {
        const professionalFound = await loadProfessionalData(session.user.id);
        if (professionalFound) {
          setUserRole("professional");
        }
      }
    }

    setLoading(false);
  };

  const loadStudentData = async (userId: string) => {
    const { data, error } = await supabase
      .from("students")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) {
      return false;
    }

    setStudentData(data);
    return true;
  };

  const loadProfessionalData = async (userId: string) => {
    const { data, error } = await supabase
      .from("professionals")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) {
      return false;
    }

    setProfessionalData(data);
    return true;
  };

  const handleStudentSave = async () => {
    if (!studentData) return;

    setSaving(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const { error } = await supabase
      .from("students")
      .update({
        full_name: studentData.full_name,
        phone: studentData.phone,
        email: studentData.email,
        address: studentData.address,
      })
      .eq("user_id", session?.user.id);

    setSaving(false);

    if (error) {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Perfil atualizado",
      description: "Suas informações foram atualizadas com sucesso.",
    });
  };

  const handleProfessionalSave = async () => {
    if (!professionalData) return;

    setSaving(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const { error } = await supabase
      .from("professionals")
      .update({
        full_name: professionalData.full_name,
        specialty: professionalData.specialty,
      })
      .eq("user_id", session?.user.id);

    setSaving(false);

    if (error) {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Perfil atualizado",
      description: "Suas informações foram atualizadas com sucesso.",
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const handleAvatarUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Erro",
        description: "Por favor, selecione uma imagem.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Erro",
        description: "A imagem deve ter no máximo 5MB.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;

    const fileExt = file.name.split(".").pop();
    const fileName = `${session.user.id}/${Date.now()}.${fileExt}`;

    // Delete old avatar if exists
    const oldAvatarUrl =
      userRole === "student"
        ? studentData?.avatar_url
        : professionalData?.avatar_url;
    if (oldAvatarUrl) {
      const oldPath = oldAvatarUrl.split("/").slice(-2).join("/");
      await supabase.storage.from("avatars").remove([oldPath]);
    }

    // Upload new avatar
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(fileName, file);

    if (uploadError) {
      toast({
        title: "Erro ao fazer upload",
        description: uploadError.message,
        variant: "destructive",
      });
      setUploading(false);
      return;
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(fileName);

    // Update database
    const table = userRole === "student" ? "students" : "professionals";
    const { error: updateError } = await supabase
      .from(table)
      .update({ avatar_url: publicUrl })
      .eq("user_id", session.user.id);

    setUploading(false);

    if (updateError) {
      toast({
        title: "Erro ao atualizar",
        description: updateError.message,
        variant: "destructive",
      });
      return;
    }

    // Update local state
    if (userRole === "student" && studentData) {
      setStudentData({ ...studentData, avatar_url: publicUrl });
    } else if (userRole === "professional" && professionalData) {
      setProfessionalData({ ...professionalData, avatar_url: publicUrl });
    }

    toast({
      title: "Foto atualizada",
      description: "Sua foto de perfil foi atualizada com sucesso.",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 py-12">
        <div className="container max-w-3xl">
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-48" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const avatarUrl =
    userRole === "student"
      ? studentData?.avatar_url
      : professionalData?.avatar_url;
  const fullName =
    userRole === "student"
      ? studentData?.full_name
      : professionalData?.full_name;
  const initials =
    fullName
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?";

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 py-12">
      <div className="container max-w-3xl">
        <Card>
          <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <CardTitle className="text-3xl flex items-center gap-2">
              <User className="h-8 w-8" />
              Meu Perfil
            </CardTitle>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              {authUser?.email && <span>{authUser.email}</span>}
              <Button variant="outline" size="sm" onClick={handleLogout}>
                Sair
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Avatar Section */}
            <div className="flex flex-col items-center mb-8">
              <div className="relative">
                <Avatar className="h-32 w-32">
                  <AvatarImage
                    src={avatarUrl || undefined}
                    alt={fullName || "Usuário"}
                  />
                  <AvatarFallback className="text-3xl">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute bottom-0 right-0 rounded-full h-10 w-10"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  <Camera className="h-5 w-5" />
                </Button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
            {uploading && (
              <p className="text-sm text-muted-foreground mt-2">
                Enviando foto...
              </p>
            )}
            <div className="mt-4 text-center space-y-1">
              <p className="text-lg font-semibold">
                {fullName || "Nome não informado"}
              </p>
              <p className="text-sm text-muted-foreground">
                {userRole === "student"
                  ? "Perfil de aluno"
                  : userRole === "professional"
                  ? "Perfil de profissional"
                  : "Perfil"}
              </p>
            </div>
          </div>

          {!studentData && !professionalData && (
            <Card className="mb-8">
              <CardContent className="text-sm text-muted-foreground">
                Não encontramos suas informações de perfil. Complete seu
                cadastro para editar seus dados e foto.
              </CardContent>
            </Card>
          )}

          {userRole === "student" && studentData && (
            <div className="space-y-6">
                <div className="space-y-2">
                  <Label
                    htmlFor="full_name"
                    className="flex items-center gap-2"
                  >
                    <User className="h-4 w-4" />
                    Nome Completo
                  </Label>
                  <Input
                    id="full_name"
                    value={studentData.full_name}
                    onChange={(e) =>
                      setStudentData({
                        ...studentData,
                        full_name: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Sexo
                  </Label>
                  <Input
                    id="gender"
                    value={studentData.gender}
                    disabled
                    className="bg-muted"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Telefone
                  </Label>
                  <Input
                    id="phone"
                    value={studentData.phone}
                    onChange={(e) =>
                      setStudentData({ ...studentData, phone: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    E-mail
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={studentData.email}
                    onChange={(e) =>
                      setStudentData({ ...studentData, email: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cpf" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    CPF
                  </Label>
                  <Input
                    id="cpf"
                    value={studentData.cpf}
                    disabled
                    className="bg-muted"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Endereço
                  </Label>
                  <Input
                    id="address"
                    value={studentData.address}
                    onChange={(e) =>
                      setStudentData({
                        ...studentData,
                        address: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="birth_date"
                    className="flex items-center gap-2"
                  >
                    <Calendar className="h-4 w-4" />
                    Data de Nascimento
                  </Label>
                  <Input
                    id="birth_date"
                    type="date"
                    value={studentData.birth_date}
                    disabled
                    className="bg-muted"
                  />
                </div>

                <Button
                  onClick={handleStudentSave}
                  disabled={saving}
                  className="w-full"
                >
                  {saving ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </div>
            )}

            {userRole === "professional" && professionalData && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label
                    htmlFor="full_name"
                    className="flex items-center gap-2"
                  >
                    <User className="h-4 w-4" />
                    Nome Completo
                  </Label>
                  <Input
                    id="full_name"
                    value={professionalData.full_name}
                    onChange={(e) =>
                      setProfessionalData({
                        ...professionalData,
                        full_name: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cref" className="flex items-center gap-2">
                    <Award className="h-4 w-4" />
                    CREF
                  </Label>
                  <Input
                    id="cref"
                    value={professionalData.cref}
                    disabled
                    className="bg-muted"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="specialty"
                    className="flex items-center gap-2"
                  >
                    <Award className="h-4 w-4" />
                    Especialidade
                  </Label>
                  <Input
                    id="specialty"
                    value={professionalData.specialty}
                    onChange={(e) =>
                      setProfessionalData({
                        ...professionalData,
                        specialty: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cpf" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    CPF
                  </Label>
                  <Input
                    id="cpf"
                    value={professionalData.cpf}
                    disabled
                    className="bg-muted"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="birth_date"
                    className="flex items-center gap-2"
                  >
                    <Calendar className="h-4 w-4" />
                    Data de Nascimento
                  </Label>
                  <Input
                    id="birth_date"
                    type="date"
                    value={professionalData.birth_date}
                    disabled
                    className="bg-muted"
                  />
                </div>

                <Button
                  onClick={handleProfessionalSave}
                  disabled={saving}
                  className="w-full"
                >
                  {saving ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
