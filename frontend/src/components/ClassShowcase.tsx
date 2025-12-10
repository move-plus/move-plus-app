import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, Users, Star } from "lucide-react";
import classImage1 from "@/assets/class-example-1.jpg";
import classImage2 from "@/assets/class-example-2.jpg";
import classImage3 from "@/assets/class-example-3.jpg";

const ClassShowcase = () => {
  const classes = [
    {
      image: classImage1,
      title: "Ginástica ao Ar Livre",
      instructor: "Prof. Maria Silva",
      location: "Parque da Cidade",
      time: "Terça e Quinta, 8h",
      spots: 12,
      rating: 4.9,
      price: "R$ 80/mês",
      level: "Iniciante",
    },
    {
      image: classImage2,
      title: "Yoga para Idosos",
      instructor: "Prof. Ana Costa",
      location: "Studio Bem-Estar",
      time: "Segunda e Quarta, 10h",
      spots: 8,
      rating: 5.0,
      price: "R$ 120/mês",
      level: "Todos os níveis",
    },
    {
      image: classImage3,
      title: "Musculação Adaptada",
      instructor: "Prof. João Santos",
      location: "Academia Vida Ativa",
      time: "Seg, Qua, Sex, 15h",
      spots: 6,
      rating: 4.8,
      price: "R$ 150/mês",
      level: "Intermediário",
    },
  ];

  return (
    <section className="py-20 bg-accent/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-3xl md:text-5xl font-bold">
            Aulas Disponíveis
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Confira algumas das aulas mais populares na sua região
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {classes.map((classItem, index) => (
            <Card key={index} className="overflow-hidden hover:shadow-medium transition-all group">
              <div className="relative h-56 overflow-hidden">
                <img
                  src={classItem.image}
                  alt={classItem.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <Badge className="absolute top-4 right-4 bg-secondary text-secondary-foreground">
                  {classItem.level}
                </Badge>
              </div>
              
              <CardHeader>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold">{classItem.title}</h3>
                  <p className="text-muted-foreground">{classItem.instructor}</p>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span>{classItem.location}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-primary" />
                  <span>{classItem.time}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4 text-primary" />
                  <span>{classItem.spots} vagas disponíveis</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 fill-secondary text-secondary" />
                  <span className="font-semibold">{classItem.rating}</span>
                  <span className="text-muted-foreground text-sm">(50+ avaliações)</span>
                </div>
              </CardContent>
              
              <CardFooter className="flex items-center justify-between pt-6 border-t">
                <div className="text-2xl font-bold text-primary">{classItem.price}</div>
                <Button>Ver Detalhes</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ClassShowcase;
