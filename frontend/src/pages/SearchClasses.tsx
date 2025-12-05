import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
      const { data, error } = await supabase
        .from("classes")
        .select(
          `
          *,
          professionals (full_name)
        `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get enrollment counts for each class
      const classesWithCounts = await Promise.all(
        (data || []).map(async (classItem) => {
          const { count } = await supabase
            .from("enrollments")
            .select("*", { count: "exact", head: true })
            .eq("class_id", classItem.id);

          return {
            ...classItem,
            enrollmentCount: count || 0,
            availableSpots: classItem.max_students - (count || 0),
          };
        })
      );

      setClasses(classesWithCounts);
    } catch (error) {
      console.error("Error fetching classes:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredClasses = classes.filter((classItem) => {
    const matchesLocation =
      searchLocation === "" ||
      classItem.location.toLowerCase().includes(searchLocation.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" || classItem.activity === categoryFilter;

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
    <div className="min-h-screen bg-gradient-hero">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold">Encontre Sua Aula</h1>
          <p className="text-xl text-muted-foreground">
            Descubra atividades físicas próximas a você
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-8 shadow-soft">
          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location" className="text-base">
                  <Search className="w-4 h-4 inline mr-2" />
                  Localização
                </Label>
                <Input
                  id="location"
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
                    {Array.from(new Set(classes.map((c) => c.activity))).map(
                      (activity) => (
                        <SelectItem key={activity} value={activity}>
                          {activity}
                        </SelectItem>
                      )
                    )}
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
              key={classItem.id}
              className="overflow-hidden hover:shadow-medium transition-all group"
            >
              <CardHeader>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">{classItem.activity}</h3>
                  <p className="text-muted-foreground">
                    Prof.{" "}
                    {classItem.professionals?.full_name || "Não especificado"}
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
                  <span>{classItem.location}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-primary flex-shrink-0" />
                  <span>{classItem.schedule}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4 text-primary flex-shrink-0" />
                  <span>
                    {classItem.availableSpots > 0
                      ? `${classItem.availableSpots} vagas disponíveis`
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
                  onClick={() => navigate(`/turma-aluno/${classItem.id}`)}
                  disabled={classItem.availableSpots <= 0}
                >
                  {classItem.availableSpots > 0 ? "Matricular" : "Cheia"}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {filteredClasses.length === 0 && (
          <Card className="p-12 text-center">
            <p className="text-xl text-muted-foreground">
              Nenhuma aula encontrada com os filtros selecionados.
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
