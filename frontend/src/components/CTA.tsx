import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const CTA = () => {
  return (
    <section className="py-20 bg-gradient-primary relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-20" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium text-primary-foreground">
            <Sparkles className="w-4 h-4" />
            Comece Hoje Mesmo
          </div>
          
          <h2 className="text-4xl md:text-6xl font-bold text-primary-foreground">
            Pronto para Transformar sua Saúde?
          </h2>
          
          <p className="text-xl text-primary-foreground/90 leading-relaxed max-w-2xl mx-auto">
            Junte-se a centenas de pessoas que já estão melhorando sua qualidade de vida 
            com atividades físicas seguras e profissionais qualificados.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link to="/buscar-aulas">
              <Button 
                size="lg" 
                variant="secondary"
                className="text-lg group w-full sm:w-auto"
              >
                Encontrar Aulas Agora
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/cadastrar-aulas">
              <Button 
                size="lg" 
                className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-primary-foreground border-2 border-white/50 text-lg w-full sm:w-auto"
              >
                Sou Profissional
              </Button>
            </Link>
          </div>
          
          <div className="pt-8 flex flex-wrap justify-center gap-6 text-primary-foreground/80 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-secondary" />
              <span>Sem compromisso</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-secondary" />
              <span>Cancelamento fácil</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-secondary" />
              <span>Primeira aula grátis</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;
