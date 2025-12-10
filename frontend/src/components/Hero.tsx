import { Button } from "@/components/ui/button";
import { ArrowRight, Heart, Users } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-fitness.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center bg-gradient-hero overflow-hidden">
      <div className="container mx-auto px-4 py-12 md:py-24">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 animate-fade-in">
            <div className="inline-flex items-center gap-2 bg-accent px-4 py-2 rounded-full text-sm font-medium text-accent-foreground">
              <Heart className="w-4 h-4" />
              Saúde e Bem-Estar para Todos
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold leading-tight">
              Conectando <span className="text-primary">Idosos</span> a Profissionais de{" "}
              <span className="text-secondary">Educação Física</span>
            </h1>
            
            <p className="text-xl text-muted-foreground leading-relaxed">
              Encontre aulas de atividade física perto de você, com profissionais qualificados 
              e horários flexíveis. Sua saúde e qualidade de vida são nossa prioridade.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/buscar-aulas">
                <Button variant="hero" size="lg" className="group w-full sm:w-auto">
                  Começar Agora
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/cadastrar-aulas">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  <Users className="w-5 h-5" />
                  Sou Profissional
                </Button>
              </Link>
            </div>
            
            <div className="flex gap-8 pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">500+</div>
                <div className="text-sm text-muted-foreground">Alunos Ativos</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">100+</div>
                <div className="text-sm text-muted-foreground">Profissionais</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">50+</div>
                <div className="text-sm text-muted-foreground">Locais</div>
              </div>
            </div>
          </div>
          
          <div className="relative animate-fade-in-delay">
            <div className="absolute -inset-4 bg-gradient-primary opacity-20 blur-3xl rounded-full" />
            <img
              src={heroImage}
              alt="Idosos praticando exercícios com instrutor"
              className="relative rounded-3xl shadow-medium w-full h-auto object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
