import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Calendar, Shield, Star, Clock, Heart } from "lucide-react";

const Features = () => {
  const features = [
    {
      icon: MapPin,
      title: "Aulas Próximas",
      description: "Encontre atividades físicas perto de você, com localização facilitada",
    },
    {
      icon: Calendar,
      title: "Horários Flexíveis",
      description: "Escolha os melhores horários que se encaixam na sua rotina",
    },
    {
      icon: Shield,
      title: "Profissionais Qualificados",
      description: "Todos os instrutores são certificados e experientes",
    },
    {
      icon: Star,
      title: "Avaliações Reais",
      description: "Veja avaliações de outros alunos antes de se inscrever",
    },
    {
      icon: Clock,
      title: "Inscrição Rápida",
      description: "Reserve sua vaga em poucos cliques, de forma simples",
    },
    {
      icon: Heart,
      title: "Foco em Saúde",
      description: "Atividades adaptadas para a terceira idade com segurança",
    },
  ];

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-3xl md:text-5xl font-bold">
            Por que escolher nossa plataforma?
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Facilitamos a conexão entre idosos e profissionais de educação física, 
            promovendo saúde e bem-estar.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card 
                key={index} 
                className="border-2 hover:border-primary transition-all hover:shadow-soft group cursor-pointer"
              >
                <CardContent className="p-6 space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center group-hover:bg-primary transition-colors">
                    <Icon className="w-7 h-7 text-primary group-hover:text-primary-foreground transition-colors" />
                  </div>
                  <h3 className="text-xl font-semibold">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Features;
