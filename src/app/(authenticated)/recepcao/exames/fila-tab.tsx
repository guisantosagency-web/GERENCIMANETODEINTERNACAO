"use client"
import { useState, useEffect, useMemo } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Play, Check, X, Edit, Loader2, AlertCircle, Clock, CheckCircle2, UserX, Trash } from "lucide-react"
import { Button } from "@/components/ui/button"
import { differenceInYears, parseISO, format } from "date-fns"
import { useAuth } from "@/lib/auth-context"

export default function FilaTab() {
  const [appointments, setAppointments] = useState<any[]>([])
  const [originsData, setOriginsData] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useAuth()

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
        // Interleave Priority and Normal
        const priority = data.filter(a => a.priority !== "Sem Prioridade")
        const normal = data.filter(a => a.priority === "Sem Prioridade")
        
        const interleaved: any[] = []
        const maxLen = Math.max(priority.length, normal.length)
        
        for (let i = 0; i < maxLen; i++) {
          if (priority[i]) interleaved.push(priority[i])
          if (normal[i]) interleaved.push(normal[i])
        }
        
        setAppointments(interleaved)
      }
    } finally {
       setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleStatusChange = async (id: string, newStatus: string, appt: any) => {
    try {
      const { error } = await supabase.from("exam_appointments").update({ status: newStatus }).eq("id", id)
      if (error) throw error

      // Mirror to daily_exams
      const dateKey = format(new Date(), 'yyyy-MM-dd')
      const procedure = appt.procedure_name

      // Check if record exists for this day/proc
      const { data: existing } = await supabase.from("daily_exams").select("*").eq("exam_date", dateKey).eq("procedure_name", procedure).maybeSingle()

      if (existing) {
        let updateData: any = {}
        if (newStatus === "presente") updateData.present_count = existing.present_count + 1
        if (newStatus === "falta") updateData.absent_count = existing.absent_count + 1
        
        // If correcting status
        if (appt.status === "presente" && newStatus !== "presente") updateData.present_count = Math.max(0, existing.present_count - 1)
        if (appt.status === "falta" && newStatus !== "falta") updateData.absent_count = Math.max(0, existing.absent_count - 1)

        await supabase.from("daily_exams").update(updateData).eq("id", existing.id)
      } else {
        await supabase.from("daily_exams").insert([{
          exam_date: dateKey,
          procedure_name: procedure,
          present_count: newStatus === "presente" ? 1 : 0,
          absent_count: newStatus === "falta" ? 1 : 0
        }])
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

                                {user?.role === "admin" && (
                                  <Button 
                                    onClick={async () => {
                                      if(confirm("Excluir este agendamento?")) {
                                        await supabase.from("exam_appointments").delete().eq("id", a.id)
                                        loadData()
                                      }
                                    }} 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-9 w-10 text-red-500 hover:bg-red-500/10" 
                                    title="Excluir Registro"
                                  >
                                    <Trash className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                           ) : (
                              <div className="flex justify-center items-center gap-3">
                                 {a.status === "presente" && <span className="text-emerald-500 font-bold uppercase text-xs flex items-center gap-1"><CheckCircle2 className="h-4 w-4"/> Presente</span>}
                                 {a.status === "falta" && <span className="text-red-500 font-bold uppercase text-xs flex items-center gap-1"><UserX className="h-4 w-4"/> Falta</span>}
                                 
                                 <Button onClick={() => handleStatusChange(a.id, "aguardando", a)} variant="ghost" size="icon" className="h-8 w-8 text-blue-500 hover:bg-blue-500/10" title="Corrigir / Editar Status">
                                    <Edit className="h-4 w-4" />
                                 </Button>

                                 {user?.role === "admin" && (
                                   <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-8 w-8 text-red-500 hover:bg-red-500/10" 
                                      title="Excluir Registro"
                                      onClick={async () => {
                                        if (confirm("Excluir este agendamento permanentemente?")) {
                                          await supabase.from("exam_appointments").delete().eq("id", a.id)
                                          loadData()
                                        }
                                      }}
                                   >
                                      <Trash className="h-4 w-4" />
                                   </Button>
                                 )}
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
