import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from "@/integrations/supabase/client"
import { Search, MapPin, Calendar, Clock, ArrowRight, Heart, Users, Star } from 'lucide-react'
import { Button } from "@/components/ui/button"

interface ClassItem {
  id: string
  title: string
  price: number
  schedule: string
  capacity: number
  profiles: { full_name: string } | null
  enrollments: { count: number }[]
}

export function Home() {
  const [classes, setClasses] = useState<ClassItem[]>([])
   
  useEffect(() => {
    async function fetchClasses() {
      const { data } = await supabase
        .from('classes')
        .select(`*, profiles(full_name), enrollments(count)`)

      if (data) setClasses(data)
    }
    fetchClasses()
  }, [])

  return (
    // min-h-screen garante que ocupa a tela toda, bg-slate-50 para suavidade
    <div className="min-h-screen bg-slate-50 font-sans text-gray-900 flex flex-col justify-between overflow-x-hidden">

      {/* CONTAINER PRINCIPAL: Grid de 2 Colunas */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start relative z-10">
           
          {/* --- COLUNA DA ESQUERDA: CONTROLES (Fixo no Desktop) --- */}
          <div className="lg:col-span-5 flex flex-col h-full space-y-6 lg:sticky lg:top-24">
             
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-bold w-fit">
              <Heart className="w-3 h-3 fill-blue-800" />
              Saúde e Bem-Estar para Todos
            </div>

            <h1 className="text-4xl md:text-6xl font-bold leading-tight">
              Conectando <span className="text-primary text-blue-600">Idosos</span> a Profissionais de{" "}
              <span className="text-secondary text-blue-500">Educação Física</span>
            </h1>
             
            <p className="text-xl text-muted-foreground leading-relaxed text-slate-600">
              Encontre aulas de atividade física perto de você, com profissionais qualificados 
              e horários flexíveis. Sua saúde e qualidade de vida são nossa prioridade.
            </p>

            <div className="bg-white p-5 rounded-2xl shadow-xl border border-slate-100 relative z-20">
              <div className="space-y-3">
                {/* Input 1 */}
                <div className="relative group">
                  <input 
                    type="text" 
                    placeholder="O que praticar? (Ex: Yoga)" 
                    className="w-full bg-slate-100 p-3 pl-10 rounded-lg text-slate-900 placeholder-slate-500 font-medium focus:ring-2 focus:ring-black outline-none transition-all"
                  />
                </div>

                {/* Input 2 */}
                <div className="relative group">
                  <input 
                    type="text" 
                    placeholder="Bairro ou Horário" 
                    className="w-full bg-slate-100 p-3 pl-10 rounded-lg text-slate-900 placeholder-slate-500 font-medium focus:ring-2 focus:ring-black outline-none transition-all"
                  />
                </div>
              </div>

              <Button className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg text-lg transition-all">
                Buscar Aulas
              </Button>
            </div>

            {/* Prova Social Rápida */}
            <div className="flex items-center gap-4 text-sm text-slate-500 pt-2">
               <div className="flex -space-x-2">
                  {[1,2,3].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-xs">
                      <Users size={12}/>
                    </div>
                  ))}
               </div>
               <p>Junte-se a 500+ alunos hoje.</p>
            </div>
          </div>

          {/* --- COLUNA DA DIREITA: OS CARDS (Vitrine Imediata) --- */}
          <div className="lg:col-span-7 pb-20"> {/* pb-20 para dar espaço visual do footer */}
            <div className="flex items-center justify-between mb-4">
               <Link to="/buscar-turmas" className="text-blue-600 text-sm font-semibold flex items-center hover:underline">
                 Ver todas <ArrowRight className="w-4 h-4 ml-1"/>
               </Link>
            </div>

            {/* Grid de Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {classes.length === 0 ? (
                 <div className="col-span-2 p-10 text-center bg-white rounded-xl border border-dashed text-slate-400">
                    Carregando atividades...
                 </div>
              ) : (
                classes.map((aula) => {
                   const enrolled = aula.enrollments[0]?.count || 0
                   const spotsLeft = aula.capacity - enrolled

                   return (
                      <Link to={`/turma-aluno/${aula.id}`} key={aula.id} className="group">
                        <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-200 h-full flex flex-col relative z-20">
                           
                          <div className="flex justify-between items-start mb-3">
                             <div className="bg-blue-50 text-blue-700 p-2 rounded-lg">
                                <Calendar size={20} />
                             </div>
                             <span className="font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded text-xs">
                               {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(aula.price)}
                             </span>
                          </div>

                          <h3 className="text-lg font-bold text-slate-900 mb-1 leading-tight group-hover:text-blue-700">
                            {aula.title}
                          </h3>
                          <p className="text-sm text-slate-500 mb-3">
                             Prof. {aula.profiles?.full_name.split(' ')[0]}
                          </p>

                          <div className="mt-auto space-y-2">
                             <div className="flex items-center text-xs text-slate-600 bg-slate-50 p-1.5 rounded">
                                <Clock size={14} className="mr-1.5 text-slate-400"/>    
                                {aula.schedule}
                             </div>

                             <div className="flex justify-between items-center pt-2 border-t border-slate-50">
                                <span className={`text-xs font-medium ${spotsLeft > 0 ? 'text-blue-600' : 'text-red-500'}`}>
                                   {spotsLeft > 0 ? `${spotsLeft} vagas` : 'Esgotado'}
                                </span>
                                <div className="bg-slate-900 text-white rounded-full p-1 group-hover:bg-blue-600 transition">
                                   <ArrowRight size={12} />
                                </div>
                             </div>
                          </div>

                        </div>
                      </Link>
                   )
                })
              )}
            </div>
          </div>

      </div>

    </div>
  )
}