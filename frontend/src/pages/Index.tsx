import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import HowItWorks from "@/components/HowItWorks";
import ClassShowcase from "@/components/ClassShowcase";
import ForProfessionals from "@/components/ForProfessionals";
import CTA from "@/components/CTA";
import { Home } from "./Home";

const Index = () => {
  return (
    <main className="min-h-screen">
      <Home />
      <Hero />
      <Features />
      <HowItWorks />
      <ForProfessionals />
      <CTA />
    </main>
  );
};

export default Index;
