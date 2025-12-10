import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GraduationCap, TrendingUp, Calendar, Users } from "lucide-react";
import { Link } from "react-router-dom";

const ForProfessionals = () => {
  const benefits = [
    {
      icon: Users,
      title: "Encontre Alunos",
      description: "Conecte-se com idosos buscando atividades físicas na sua região",
    },
    {
      icon: Calendar,
      title: "Gerencie Aulas",
      description: "Cadastre e gerencie suas turmas e horários facilmente",
    },
    {
      icon: TrendingUp,
      title: "Cresça Profissionalmente",
      description: "Amplie sua base de alunos e fortaleça sua carreira",
    },
    {
      icon: GraduationCap,
      title: "Compartilhe Conhecimento",
      description: "Faça a diferença na vida de pessoas da terceira idade",
    },
  ];

  return (
    <section className="py-20 bg-gradient-hero">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-3xl md:text-5xl font-bold">
                Para Profissionais de Educação Física
              </h2>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Cadastre suas aulas e conecte-se com alunos que precisam de você. 
                Faça parte de uma comunidade que promove saúde e qualidade de vida.
              </p>
            </div>

            <div className="space-y-4">
              {benefits.map((benefit, index) => {
                const Icon = benefit.icon;
                return (
                  <div key={index} className="flex gap-4 items-start">
                    <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
                      <Icon className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-1">{benefit.title}</h3>
                      <p className="text-muted-foreground">{benefit.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <Link to="/cadastrar-aulas">
              <Button variant="secondary" size="lg" className="mt-4">
                Cadastrar como Profissional
              </Button>
            </Link>
          </div>

          <Card className="shadow-medium">
            <CardContent className="p-8 space-y-6">
              <div className="space-y-2">
                <h3 className="text-2xl font-bold">Comece Agora</h3>
                <p className="text-muted-foreground">
                  Preencha seus dados e comece a cadastrar aulas em minutos
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-accent rounded-lg">
                  <div>
                    <div className="font-semibold">Cadastro Gratuito</div>
                    <div className="text-sm text-muted-foreground">Sem taxas iniciais</div>
                  </div>
                  <div className="text-2xl font-bold text-primary">R$ 0</div>
                </div>

                <div className="flex items-center justify-between p-4 bg-accent rounded-lg">
                  <div>
                    <div className="font-semibold">Comissão por Aluno</div>
                    <div className="text-sm text-muted-foreground">Apenas quando fechar turma</div>
                  </div>
                  <div className="text-2xl font-bold text-secondary">10%</div>
                </div>

                <div className="pt-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <span>Suporte dedicado para profissionais</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <span>Ferramenta de gestão de turmas</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <span>Visibilidade para milhares de alunos</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default ForProfessionals;
