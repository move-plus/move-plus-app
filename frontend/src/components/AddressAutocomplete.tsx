import React, { useEffect, useRef, useState } from "react";

interface AddressData {
  address: string;
  lat: number;
  lng: number;
}

interface Props {
  onAddressSelect: (data: AddressData) => void;
  defaultValue?: string;
}

export const AddressAutocomplete = React.memo(function AddressAutocomplete({ onAddressSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pickerRef = useRef<any>(null);
  const callbackRef = useRef(onAddressSelect);
  
  const [googleLoaded, setGoogleLoaded] = useState(false);

  useEffect(() => {
    callbackRef.current = onAddressSelect;
  }, [onAddressSelect]);

  // 1. Espera o Google carregar
  useEffect(() => {
    const checkGoogle = setInterval(() => {
      if (window.google?.maps?.places) {
        setGoogleLoaded(true);
        clearInterval(checkGoogle);
      }
    }, 100);
    return () => clearInterval(checkGoogle);
  }, []);

  // 2. Monta o componente
  useEffect(() => {
    if (!googleLoaded || !containerRef.current || pickerRef.current) return;

    console.log("🚀 Google Places Ready. Montando componente...");

    // @ts-ignore
    const placePicker = new google.maps.places.PlaceAutocompleteElement();
    pickerRef.current = placePicker;
    containerRef.current.appendChild(placePicker);

    // FUNÇÃO ROBUSTA V3
    const handleSelect = async (event: any) => {
      console.log("📦 Evento Bruto:", event); 

      // 1. ESTRATÉGIA DE CAPTURA DO PLACE
      let place = event.place; // Tentativa padrão

      // CASO DO SEU LOG: O evento trouxe uma 'placePrediction' em vez do 'place'
      if (!place && event.placePrediction) {
        console.log("🔮 Convertendo Predição para Place...");
        // A API exige que converta a predição em um objeto Place real
        place = event.placePrediction.toPlace(); 
      }

      // Fallback para WebComponents genéricos
      if (!place && event.detail?.place) {
         place = event.detail.place;
      }

      // Se depois de tudo isso ainda for nulo, desistimos
      if (!place) {
        console.warn("⚠️ Não foi possível extrair um objeto Place deste evento.");
        return;
      }

      console.log("📍 Place válido encontrado! Buscando coordenadas...");

      try {
        // 2. AGORA SIM PODEMOS USAR O fetchFields
        await place.fetchFields({ fields: ["displayName", "formattedAddress", "location"] });
        
        const lat = place.location?.lat();
        const lng = place.location?.lng();
        const address = place.formattedAddress || place.displayName;

        console.log("✅ DADOS FINAIS:", { address, lat, lng });

        if (lat && lng && address) {
          callbackRef.current({ address, lat, lng });
        }
      } catch (e) {
        console.error("❌ Erro no fetchFields:", e);
      }
    };

    // Ouvintes
    placePicker.addEventListener("gmp-places-select", handleSelect);
    placePicker.addEventListener("gmp-select", handleSelect);

  }, [googleLoaded]);

  return (
    <div className="w-full">
      <div ref={containerRef} className="place-picker-wrapper" />
      
      <style>{`
        /* 1. Força o navegador a renderizar este pedaço como LIGHT mode */
        .place-picker-wrapper {
          color-scheme: light; 
        }

        /* 2. Variáveis Globais do Componente (Dropdown e Texto) */
        gmp-place-autocomplete {
          --gm-px-color-surface: #ffffff;      /* Fundo do dropdown */
          --gm-px-color-text-primary: #020617; /* Texto Principal (Preto quase total) */
          --gm-px-color-text-secondary: #64748b; /* Texto Secundário (Cinza) */
          --gm-px-color-primary: #2D7DD2;      /* Cor do Highlight (Seu Azul) */
        }

        /* 3. Estilização Direta do Input (A caixa de texto) */
        /* O Google expõe a parte "input" para gente estilizar assim: */
        gmp-place-autocomplete::part(input) {
          height: 48px;              /* Altura igual aos outros inputs */
          background-color: #ffffff; /* Fundo Branco */
          border: 1px solid #e2e8f0; /* Borda cinza suave (slate-200) */
          border-radius: 8px;        /* Arredondamento */
          padding-left: 14px;
          padding-right: 14px;
          font-size: 16px;
          color: #020617;
          box-sizing: border-box;
          transition: border-color 0.2s;
        }

        /* Efeito de Focus (quando clica) */
        gmp-place-autocomplete::part(input):focus {
          border-color: #2D7DD2;     /* Borda azul ao focar */
          outline: none;
          box-shadow: 0 0 0 2px rgba(45, 125, 210, 0.2);
        }
      `}</style>
    </div>
  );
});