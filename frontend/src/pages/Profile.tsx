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

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface StudentData {
  health_certificate_url: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
}

interface ProfessionalData {
  cref: string;
  specialty: string;
  verification_status: string | null;
}

interface ProfileData {
  role: "users" | "professional";
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  cpf: string | null;
  gender: string | null;
  birth_date: string | null;
}

export default function Profile() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [profileData, setProfileData] = useState<ProfileData>({
    role: "",
    full_name: "",
    avatar_url: null,
    bio: null,
    email: null,
    phone: null,
    address: null,
    cpf: null,
    gender: null,
    birth_date: null,
  });

  const [studentData, setStudentData] = useState<StudentData>({
    health_certificate_url: null,
    emergency_contact_name: null,
    emergency_contact_phone: null,
  });

  const [professionalData, setProfessionalData] = useState<ProfessionalData>({
    cref: "",
    specialty: "",
    verification_status: null,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [authUser, setAuthUser] = useState<any>(null);

  useEffect(() => {
    checkAuthAndLoadProfile();
  }, []);

  const checkAuthAndLoadProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) return;

    setAuthUser(session.user);

    const profileFound = await loadProfileData(session.user.id);
    if (!profileFound) {
      console.error("Perfil não encontrado.");
      setLoading(false);
      return;
    }

    setLoading(false);
  };

  const loadProfileData = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) return false;

    setProfileData(data);

    if (data.role === "student") {
      const { data: studentInfo, error: studentError } = await supabase
        .from("students")
        .select("*")
        .eq("id", userId)
        .single();

      if (!studentError) setStudentData(studentInfo);
    } else if (data.role === "professional") {
      const { data: professionalInfo, error: professionalError } = await supabase
        .from("professionals")
        .select("*")
        .eq("id", userId)
        .single();
      if (!professionalError) setProfessionalData(professionalInfo);
    }

    return true;
  };

  const handleProfileSave = async () => {
    if (!profileData) return;

    setSaving(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: profileData.full_name,
        gender: profileData.gender,
        phone: profileData.phone,
        email: profileData.email,
        cpf: profileData.cpf,
        address: profileData.address,
        birth_date: profileData.birth_date,
      })
      .eq("id", session?.user.id);
    
    if (profileData.role === "student" && studentData) {
      const { error: studentError } = await supabase
        .from("students")
        .update({
          emergency_contact_name: studentData.emergency_contact_name,
          emergency_contact_phone: studentData.emergency_contact_phone,
        })
        .eq("id", session?.user.id);

      if (studentError) console.error("Erro ao salvar dados do aluno:", studentError);

    } else if (profileData.role === "professional" && professionalData) {
      const { error } = await supabase
        .from("professionals")
        .update({
          specialty: professionalData.specialty,
        })
        .eq("id", session?.user.id);
      if (error) console.error("Erro ao salvar dados do profissional:", error);
    }
    
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
    navigate("/login");
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
    const oldAvatarUrl = profileData?.avatar_url;
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
    const table = profileData?.role === "student" ? "students" : "professionals";
    const { error: updateError } = await supabase
      .from(table)
      .update({ avatar_url: publicUrl })
      .eq("id", session.user.id);

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
    // if (profileData?.role === "student" && studentData) {
    //   setStudentData({ ...studentData, avatar_url: publicUrl });
    // } else if (userRole === "professional" && professionalData) {
    //   setProfessionalData({ ...professionalData, avatar_url: publicUrl });
    // }

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

  const avatarUrl = profileData?.avatar_url;
  const fullName = profileData?.full_name;
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
            {/* Avatar */}
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
                  {profileData?.role === "student"
                    ? "Perfil de aluno"
                    : profileData?.role === "professional"
                    ? "Perfil de profissional"
                    : "Perfil"}
                </p>
              </div>
            </div>

            {!profileData && (
              <Card className="mb-8">
                <CardContent className="text-sm text-muted-foreground align-center">
                  Não encontramos suas informações de perfil. Complete seu
                  cadastro para editar seus dados e foto.
                </CardContent>
              </Card>
            )}

            {/* Dados */}
            <div className="space-y-6">
              {/* Nome */}
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
                  value={profileData.full_name || ""}
                  onChange={(e) =>
                    setProfileData({
                      ...profileData,
                      full_name: e.target.value,
                    })
                  }
                />
              </div>
              {/* Sexo */}
              <div className="space-y-2">
                <Label htmlFor="gender" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Sexo
                </Label>
                
                <Select
                  value={profileData.gender}
                  onValueChange={(value: any) =>
                    setProfileData({ ...profileData, gender: value })
                  }
                >
                  <SelectTrigger id="gender">
                    <SelectValue placeholder="Selecione o sexo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="masculino">Masculino</SelectItem>
                    <SelectItem value="feminino">Feminino</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                    <SelectItem value="nao_informar">Prefiro não informar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {/* Telefone */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Telefone
                </Label>
                <Input
                  id="phone"
                  value={profileData.phone}
                  onChange={(e) =>
                    setProfileData({ ...profileData , phone: e.target.value })
                  }
                />
              </div>
              {/* E-mail */}
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  E-mail
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={profileData.email}
                  onChange={(e) =>
                    setProfileData({ ...profileData, email: e.target.value })
                  }
                />
              </div>
              {/* CPF */}
              <div className="space-y-2">
                <Label htmlFor="cpf" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  CPF
                </Label>
                <Input
                  id="cpf"
                  type="text"
                  value={profileData.cpf}
                  onChange={(e) =>
                    setProfileData({ ...profileData, cpf: e.target.value })
                  }
                />
              </div>
              {/* Endereço */}
              <div className="space-y-2">
                <Label htmlFor="address" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Endereço
                </Label>
                <Input
                  id="address"
                  value={profileData.address}
                  onChange={(e) =>
                    setProfileData({
                      ...profileData,
                      address: e.target.value,
                    })
                  }
                />
              </div>
              {/* Data de Nascimento */}
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
                  value={profileData.birth_date}
                  onChange={(e: { target: { value: any; }; }) =>
                    setProfileData({
                      ...profileData,
                      birth_date: e.target.value,
                    })
                  }
                />
              </div>
              {/* Dados do profissional */}
              {profileData?.role === "professional" && professionalData && (
                <><div className="space-y-2">
                  <Label htmlFor="cref" className="flex items-center gap-2">
                    <Award className="h-4 w-4" />
                    CREF
                  </Label>
                  <Input
                    id="cref"
                    value={professionalData.cref}
                    disabled
                    className="bg-muted" />
                </div><div className="space-y-2">
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
                      onChange={(e) => setProfessionalData({
                        ...professionalData,
                        specialty: e.target.value,
                      })} />
                  </div><div className="space-y-2">
                    <Label
                      htmlFor="verification_status"
                      className="flex items-center gap-2"
                    >
                      <Award className="h-4 w-4" />
                      Status de Verificação
                    </Label>
                    <Input
                      id="verification_status"
                      value={professionalData.verification_status}
                      disabled
                      className="bg-muted" />
                  </div></>
              )}
              {/* Dados do aluno */}
              {profileData?.role === "student" && studentData && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label
                      htmlFor="emergency_contact_name"
                      className="flex items-center gap-2"
                    >
                      <Phone className="h-4 w-4" />
                      Nome do Contato de Emergência
                    </Label>
                    <Input
                      id="emergency_contact_name"
                      value={studentData.emergency_contact_name || ""}
                      onChange={(e) =>
                        setStudentData({
                          ...studentData,
                          emergency_contact_name: e.target.value,
                        })
                      }
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label
                      htmlFor="emergency_contact_phone"
                      className="flex items-center gap-2"
                    >
                      <Phone className="h-4 w-4" />
                      Telefone do Contato de Emergência
                    </Label>
                    <Input
                      id="emergency_contact_phone"
                      value={studentData.emergency_contact_phone || ""}
                      onChange={(e) =>
                        setStudentData({
                          ...studentData,
                          emergency_contact_phone: e.target.value,
                        })
                      }
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label
                      htmlFor="health_certificate"
                      className="flex items-center gap-2"
                    >
                      <FileText className="h-4 w-4" />
                      Certificado de Saúde
                    </Label>
                    {studentData.health_certificate_url ? (
                      <a
                        href={studentData.health_certificate_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline"
                      >
                        Visualizar Certificado
                      </a>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Nenhum certificado anexado.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
            {/* Save Button */}
            <div className="mt-8 flex justify-end">
              <Button
                onClick={handleProfileSave}
                disabled={saving}
                className="w-full"
              >
                {saving ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
