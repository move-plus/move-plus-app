import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import movePrimary from "@/assets/logos/move-primary.png";
import moveAlt from "@/assets/logos/move-alt.png";

const Welcome = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // começar animação
    setTimeout(() => setIsVisible(true), 100);
    
    // transição de 3 segundos
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  // splash screen
  if (showSplash) {

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-secondary to-accent overflow-hidden relative">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse-slow animation-delay-1000" />
        </div>

        <div className="relative z-10 flex flex-col items-center">
          <div 
            className={`transform transition-all duration-2000 ${
              isVisible ? 'scale-100 opacity-100 rotate-0' : 'scale-50 opacity-0 rotate-12'
            }`}
          >
            <img 
              src={movePrimary} 
              alt="Move+ Logo" 
              className="w-72 md:w-96 animate-float-bounce"
            />
          </div>

          <div 
            className={`mt-12 transform transition-all duration-1000 delay-500 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            <div className="flex space-x-2">
              <div className="w-3 h-3 bg-white rounded-full animate-bounce animation-delay-0"></div>
              <div className="w-3 h-3 bg-white rounded-full animate-bounce animation-delay-200"></div>
              <div className="w-3 h-3 bg-white rounded-full animate-bounce animation-delay-400"></div>
            </div>
          </div>
        </div>

        <style>{`
          @keyframes float-bounce {
            0%, 100% {
              transform: translateY(0px) scale(1);
            }
            25% {
              transform: translateY(-20px) scale(1.02);
            }
            50% {
              transform: translateY(-10px) scale(1);
            }
            75% {
              transform: translateY(-15px) scale(0.98);
            }
          }
          
          @keyframes pulse-slow {
            0%, 100% {
              opacity: 0.3;
              transform: scale(1);
            }
            50% {
              opacity: 0.5;
              transform: scale(1.1);
            }
          }
          
          .animate-float-bounce {
            animation: float-bounce 3s ease-in-out infinite;
          }
          
          .animate-pulse-slow {
            animation: pulse-slow 4s ease-in-out infinite;
          }
          
          .animation-delay-0 {
            animation-delay: 0ms;
          }
          
          .animation-delay-200 {
            animation-delay: 200ms;
          }
          
          .animation-delay-400 {
            animation-delay: 400ms;
          }
          
          .animation-delay-1000 {
            animation-delay: 1000ms;
          }
          
          .duration-2000 {
            transition-duration: 2000ms;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-between bg-gradient-to-br from-[#5F94E2] via-[#2D7DD2] to-[#1756AC] px-4 sm:px-6 md:px-8 py-8 sm:py-12 md:py-16">
      <div className="text-center animate-fade-in pt-4 sm:pt-8 md:pt-12">
        <img 
          src={moveAlt} 
          alt="Move+ Logo" 
          className="w-44 sm:w-56 md:w-64 lg:w-72 mx-auto drop-shadow-2xl"
        />
      </div>

      <div className="w-full max-w-sm sm:max-w-md md:max-w-lg text-center space-y-6 sm:space-y-8 animate-slide-up flex-1 flex flex-col justify-center items-center">
        <div className="flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 bg-white/20 backdrop-blur-sm rounded-full mb-2 sm:mb-4">
          <svg className="w-10 h-10 sm:w-12 sm:h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>

        <div className="space-y-3 sm:space-y-4">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white drop-shadow-lg px-2">
            Bem-vindo(a) ao Move+
          </h1>
          
          <p className="text-white/90 text-base sm:text-lg md:text-xl leading-relaxed px-4 sm:px-6 md:px-8">
            Encontre aulas de atividade física em grupo perto de você e redescubra o prazer de se exercitar em comunidade.
          </p>
        </div>
      </div>

      {/* botões */}
      <div className="w-full max-w-sm sm:max-w-md md:max-w-lg space-y-3 sm:space-y-4 animate-slide-up pb-4 sm:pb-8">
        <Link to="/login" className="block">
          <Button 
            className="w-full h-14 sm:h-16 md:h-[4.5rem] text-base sm:text-lg md:text-xl bg-[#25C588] hover:bg-[#1ea871] text-white font-semibold rounded-full shadow-2xl transition-all"
            size="lg"
          >
            Vamos Começar?
          </Button>
        </Link>

        <Link to="/login" className="block">
          <Button 
            variant="outline"
            className="w-full h-14 sm:h-16 md:h-[4.5rem] text-base sm:text-lg md:text-xl border-2 border-white/90 bg-white/10 backdrop-blur-sm text-white hover:bg-white hover:text-[#5F94E2] font-semibold rounded-full transition-all"
            size="lg"
          >
            Já possuo uma conta
          </Button>
        </Link>

        {/* redireciona para o profissional */}
        <div className="text-center pt-2 sm:pt-4">
          <Link 
            to="/login-profissional" 
            className="text-sm md:text-base lg:text-lg text-white/80 hover:text-white font-medium transition-colors underline"
          >
            É profissional? Entre aqui
          </Link>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
        
        .animate-slide-up {
          animation: slide-up 0.6s ease-out 0.2s backwards;
        }
      `}</style>
    </div>
  );
};

export default Welcome;
