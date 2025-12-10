import { Card, CardContent } from "@/components/ui/card";
import { Search, CheckCircle, Dumbbell, Trophy } from "lucide-react";

const HowItWorks = () => {
  const steps = [
    {
      icon: Search,
      number: "01",
      title: "Busque Aulas",
      description: "Encontre atividades físicas próximas a você usando nossos filtros de localização",
    },
    {
      icon: CheckCircle,
      number: "02",
      title: "Escolha e Reserve",
      description: "Veja detalhes das aulas, avaliações e reserve sua vaga em poucos cliques",
    },
    {
      icon: Dumbbell,
      number: "03",
      title: "Pratique",
      description: "Compareça nas aulas com profissionais qualificados e comece a se exercitar",
    },
    {
      icon: Trophy,
      number: "04",
      title: "Conquiste Resultados",
      description: "Melhore sua saúde, ganhe mais disposição e qualidade de vida",
    },
  ];

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-3xl md:text-5xl font-bold">
            Como Funciona?
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            É muito simples começar sua jornada de saúde e bem-estar
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <Card key={index} className="relative overflow-hidden group hover:shadow-soft transition-all">
                <div className="absolute top-0 right-0 text-8xl font-bold text-primary/5 group-hover:text-primary/10 transition-colors">
                  {step.number}
                </div>
                <CardContent className="p-6 space-y-4 relative z-10">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-soft">
                    <Icon className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <h3 className="text-xl font-bold">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {step.description}
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

export default HowItWorks;
