import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import moveLogo from "@/assets/logos/move-logo.png";

interface PageHeaderProps {
  title: string;
  showBackButton?: boolean;
  backTo?: string;
}

export function PageHeader({ title, showBackButton = true, backTo }: PageHeaderProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (backTo) {
      navigate(backTo);
    } else {
      navigate(-1);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 mb-6">
      <div className="flex h-16 items-center px-4">
        {showBackButton && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="mr-4 hover:bg-[#5F94E2]/10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <img 
          src={moveLogo} 
          alt="Move+" 
          className="h-8 w-auto mr-3"
        />
        <h1 className="text-xl font-semibold text-[#1756AC]">{title}</h1>
      </div>
    </header>
  );
}
