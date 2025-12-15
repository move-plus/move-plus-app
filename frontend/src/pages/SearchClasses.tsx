import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MapPin, Clock, Users, Star, Search, Filter } from "lucide-react";

const SearchClasses = () => {
  const navigate = useNavigate();
  const [searchLocation, setSearchLocation] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      setLoading(true);

      // 1. Verificar usuário logado
      const { data: { user } } = await supabase.auth.getUser();
      let enrolledClassIds: string[] = [];

      // 2. Se houver usuário, buscar os IDs das turmas que ele já está matriculado
      if (user) {
        const { data: myEnrollments } = await supabase
          .from("enrollments")
          .select("class_id")
          .eq("user_id", user.id); // Certifique-se que a coluna é user_id ou student_id

        if (myEnrollments) {
          enrolledClassIds = myEnrollments.map((e: any) => e.class_id);
        }
      }

      // 3. Buscar todas as aulas
      const { data, error } = await supabase
        .from("classes")
        .select(`
          *,
          profiles:professional_id (
            full_name
          ),
          enrollments (
            count
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // 4. Filtrar (remover aulas que o aluno já tem) e Formatar
      const classesFormatted = data
        .filter((cls) => !enrolledClassIds.includes(cls.id)) // <--- AQUI ESTÁ O FILTRO
        .map((cls) => {
          // O count retorna um array de objetos, pegamos o count do primeiro ou 0
          // Nota: Supabase count no select retorna algo como [{count: 5}]
          const enrolledCount = cls.enrollments[0]?.count || 0;
          
          return {
            ...cls,
            enrolled_count: enrolledCount,
            spots_left: cls.capacity - enrolledCount 
          };
        });

      setClasses(classesFormatted);
    } catch (error) {
      console.error("Error fetching classes:", error);
      setClasses([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredClasses = classes.filter((classItem) => {
    const matchesLocation =
      searchLocation === "" ||
      classItem.location_address.toLowerCase().includes(searchLocation.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" || classItem.category === categoryFilter;

    return matchesLocation && matchesCategory;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Carregando...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero pb-24">
      <PageHeader title="Encontre Sua Aula" showBackButton={false} />
      <div className="container mx-auto px-4 py-6">
        
        {/* Botão para criar demanda */}
        <div className="mb-6 flex justify-end">
          <Button
            onClick={() => navigate("/solicitar-turma")}
            className="bg-[#25C588] hover:bg-[#1ea871] text-white"
          >
            Não encontrou? Solicite uma turma
          </Button>
        </div>

        {/* Filters */}
        <Card className="mb-8 shadow-soft">
          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location_address" className="text-base">
                  <Search className="w-4 h-4 inline mr-2" />
                  Localização
                </Label>
                <Input
                  id="location_address"
                  placeholder="Digite sua localização..."
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                  className="text-base h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category" className="text-base">
                  <Filter className="w-4 h-4 inline mr-2" />
                  Atividade
                </Label>
                <Select
                  value={categoryFilter}
                  onValueChange={setCategoryFilter}
                >
                  <SelectTrigger id="category" className="text-base h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as atividades</SelectItem>
                    
                    {Array.from(new Set(classes.map((c) => c.category)))
                      .filter((category) => category)
                      .map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-lg text-muted-foreground">
            {filteredClasses.length}{" "}
            {filteredClasses.length === 1
              ? "aula encontrada"
              : "aulas encontradas"}
          </p>
        </div>

        {/* Classes Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClasses.map((classItem) => (
            <Card
              onClick={() => navigate(`/turma-aluno/${classItem.id}`)}
              key={classItem.id}
              className="overflow-hidden hover:shadow-medium transition-all group cursor-pointer"
            >
              <CardHeader>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">{classItem.title}</h3>
                  <p className="text-muted-foreground">
                    Prof.{" "}
                    {classItem.profiles?.full_name || "Não especificado"}
                  </p>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {classItem.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {classItem.description}
                  </p>
                )}

                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                  <span>{classItem.location_address}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-primary flex-shrink-0" />
                  <span>{classItem.schedule}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className={classItem.spots_left <= 0 ? "text-red-500 font-medium" : ""}>
                    {classItem.spots_left > 0
                      ? `${classItem.spots_left} vagas disponíveis`
                      : "Turma cheia"}
                  </span>
                </div>
              </CardContent>

              <CardFooter className="flex items-center justify-between pt-6 border-t">
                <div className="text-2xl font-bold text-primary">
                  {classItem.price > 0
                    ? `R$ ${classItem.price.toFixed(2)}`
                    : "Gratuito"}
                </div>
                <Button
                  onClick={(e) => {
                    e.stopPropagation(); // Evita clicar no card ao clicar no botão
                    navigate(`/turma-aluno/${classItem.id}`);
                  }}
                  disabled={classItem.spots_left <= 0}
                >
                  {classItem.spots_left > 0 ? "Matricular" : "Cheia"}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {filteredClasses.length === 0 && (
          <Card className="p-12 text-center">
            <p className="text-xl text-muted-foreground">
              Nenhuma aula encontrada com os filtros selecionados (ou você já está matriculado em todas).
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                setSearchLocation("");
                setCategoryFilter("all");
              }}
            >
              Limpar Filtros
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SearchClasses;