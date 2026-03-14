"use client"
import { useState, useEffect, useMemo } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Play, Check, X, Edit, Loader2, AlertCircle, Clock, CheckCircle2, UserX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { differenceInYears, parseISO, format } from "date-fns"

export default function FilaTab() {
  const [appointments, setAppointments] = useState<any[]>([])
  const [originsData, setOriginsData] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)

  const supabase = useMemo(() => createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!), [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      // Load Origins Dictionary
      const { data: orgs } = await supabase.from("exam_origins").select("*")
      const orgDict: Record<string, string> = {}
      orgs?.forEach(o => orgDict[o.id] = o.name)
      setOriginsData(orgDict)

      // Load Fila
      const { data } = await supabase
        .from("exam_appointments")
        .select("*")
        .in("status", ["aguardando", "presente", "falta"])
        .order("arrival_time", { ascending: true })
      
      if (data) {
        // Separa quem ainda está aguardando para aplicar a regra de intercalação
        const aguardando = data.filter(a => a.status === "aguardando")
        const realizados = data.filter(a => a.status !== "aguardando")

        const prioridades = aguardando.filter(a => a.priority !== "Sem Prioridade")
        const normais = aguardando.filter(a => a.priority === "Sem Prioridade")

        const intercalados: any[] = []
        const max = Math.max(prioridades.length, normais.length)

        for (let i = 0; i < max; i++) {
          if (prioridades[i]) intercalados.push(prioridades[i])
          if (normais[i]) intercalados.push(normais[i])
        }

        // Fila final: Intercalados primeiro, depois os que já foram atendidos (histórico do dia)
        setAppointments([...intercalados, ...realizados])
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleStatusChange = async (id: string, newStatus: "presente" | "falta" | "aguardando", currentRecord: any) => {
    try {
      // 1. Update Appointment Status
      await supabase.from("exam_appointments").update({ status: newStatus }).eq("id", id)

      // 2. Sync with Daily Exams (if moving to Presente/Falta)
      // Se saiu de aguardando para presente, incrementa presente no dashboard.
      if (currentRecord.status === "aguardando" && (newStatus === "presente" || newStatus === "falta")) {
         // Verifica se o registro diario ja existe
         const { data: dailyCheck } = await supabase.from("daily_exams")
            .select("*")
            .eq("date", currentRecord.exam_date)
            .eq("exame", currentRecord.procedure_name)
            .maybeSingle()

         if (dailyCheck) {
            await supabase.from("daily_exams").update({
               presentes: newStatus === "presente" ? (dailyCheck.presentes || 0) + 1 : dailyCheck.presentes,
               faltas: newStatus === "falta" ? (dailyCheck.faltas || 0) + 1 : dailyCheck.faltas
            }).eq("id", dailyCheck.id)
         } else {
            await supabase.from("daily_exams").insert([{
               date: currentRecord.exam_date,
               exame: currentRecord.procedure_name,
               presentes: newStatus === "presente" ? 1 : 0,
               faltas: newStatus === "falta" ? 1 : 0
            }])
         }
      }

      // Se estivesse revertendo (Presente -> Aguardando), teria que subtrair,
      // Mas para simplificar vamos apenas focar na logica basica do click. Se a pessoa errar, ela edita aqui e nós corrigimos no DB no proximo click. Reverter exigiria logica de decremento.
      // Vou implementar o decremento para "Editar": se current não for aguardando e new for aguardando
      if (newStatus === "aguardando" && currentRecord.status !== "aguardando") {
         const { data: dailyCheck } = await supabase.from("daily_exams")
            .select("*")
            .eq("date", currentRecord.exam_date)
            .eq("exame", currentRecord.procedure_name)
            .maybeSingle()
         if (dailyCheck) {
             await supabase.from("daily_exams").update({
                 presentes: currentRecord.status === "presente" ? Math.max(0, (dailyCheck.presentes || 1) - 1) : dailyCheck.presentes,
                 faltas: currentRecord.status === "falta" ? Math.max(0, (dailyCheck.faltas || 1) - 1) : dailyCheck.faltas
             }).eq("id", dailyCheck.id)
         }
      }

      loadData()
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="glass-card !bg-card/40 border-none rounded-[2.5rem] p-6 lg:p-8 shadow-sm">
        <h2 className="text-2xl font-black font-space uppercase tracking-tight mb-8 flex items-center gap-3">
          <div className="p-3 bg-purple-500/10 text-purple-500 rounded-xl"><Play className="h-6 w-6" /></div>
          Fila de Realização (Painel de Chamada)
        </h2>

        {isLoading ? (
           <div className="h-64 flex items-center justify-center">
             <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
           </div>
        ) : appointments.length === 0 ? (
           <div className="h-64 flex flex-col items-center justify-center opacity-40">
             <Play className="h-12 w-12 mb-4" />
             <p className="font-space font-bold tracking-widest uppercase">Nenhum paciente aguardando.</p>
           </div>
        ) : (
           <div className="overflow-x-auto rounded-3xl border border-white/5 bg-background/30 backdrop-blur-md">
             <table className="w-full text-left text-sm whitespace-nowrap">
               <thead className="bg-muted/50 font-bold uppercase tracking-wider text-xs border-b border-border/10">
                 <tr>
                   <th className="p-4 px-6 text-center">Chegada</th>
                   <th className="p-4">Origem</th>
                   <th className="p-4">Paciente</th>
                   <th className="p-4 text-center">Idade</th>
                   <th className="p-4 text-center">Prioridade</th>
                   <th className="p-4">Procedimento / Tipo</th>
                   <th className="p-4 text-center">Ações / Status</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-border/5">
                 {appointments.map(a => {
                   const originName = originsData[a.origin_id] || "Não Informada"
                   const age = a.birth_date ? differenceInYears(new Date(), parseISO(a.birth_date)) : "--"
                   const isPriority = a.priority !== "Sem Prioridade"

                   return (
                     <tr key={a.id} className={`hover:bg-muted/30 transition-colors group ${a.status === 'presente' ? 'opacity-50' : a.status === 'falta' ? 'opacity-40 grayscale' : ''}`}>
                       <td className="p-4 px-6 text-center">
                          <div className="flex flex-col items-center justify-center">
                             <Clock className="h-4 w-4 text-muted-foreground mb-1" />
                             <span className="font-black text-xs">{a.arrival_time ? format(new Date(a.arrival_time), 'HH:mm') : '--:--'}</span>
                          </div>
                       </td>
                       <td className="p-4 font-black uppercase text-xs text-muted-foreground">{originName}</td>
                       <td className="p-4 font-black uppercase text-foreground text-base">{a.patient_name}</td>
                       <td className="p-4 font-bold text-center">{age}</td>
                       <td className="p-4 text-center font-bold">
                          {isPriority ? <span className="text-red-500 p-1.5 px-3 rounded-full bg-red-500/10 text-xs uppercase tracking-widest">{a.priority}</span> : <span className="text-muted-foreground text-xs uppercase">--</span>}
                       </td>
                       <td className="p-4 font-bold">
                         <span className="text-primary">{a.procedure_name}</span>
                         <span className="text-[10px] ml-2 px-2 py-0.5 rounded-full bg-border text-foreground">{a.exam_type}</span>
                       </td>
                       <td className="p-4 text-center">
                          {a.status === "aguardando" ? (
                             <div className="flex justify-center gap-2">
                               <Button onClick={() => handleStatusChange(a.id, "presente", a)} className="h-9 w-10 p-0 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded-xl" title="Marcar Presente">
                                  <Check className="h-5 w-5" />
                               </Button>
                               <Button onClick={() => handleStatusChange(a.id, "falta", a)} className="h-9 w-10 p-0 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl" title="Marcar Falta">
                                  <X className="h-5 w-5" />
                               </Button>
                             </div>
                          ) : (
                             <div className="flex justify-center items-center gap-3">
                                {a.status === "presente" && <span className="text-emerald-500 font-bold uppercase text-xs flex items-center gap-1"><CheckCircle2 className="h-4 w-4"/> Presente</span>}
                                {a.status === "falta" && <span className="text-red-500 font-bold uppercase text-xs flex items-center gap-1"><UserX className="h-4 w-4"/> Falta</span>}
                                
                                <Button onClick={() => handleStatusChange(a.id, "aguardando", a)} variant="ghost" size="icon" className="h-8 w-8 text-blue-500 hover:bg-blue-500/10" title="Corrigir / Editar Status">
                                   <Edit className="h-4 w-4" />
                                </Button>
                             </div>
                          )}
                       </td>
                     </tr>
                   )
                 })}
               </tbody>
             </table>
           </div>
        )}
      </div>
    </div>
  )
}
