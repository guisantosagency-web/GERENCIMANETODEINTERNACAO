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
        const categories = ["RAIO X", "TOMOGRAFIA", "ULTRASSOM", "LABORATORIAIS", "OUTROS"]
        const groupedData: Record<string, any[]> = {}
        
        categories.forEach(cat => groupedData[cat] = [])

        // 1. First Pass: Categorize and Group by Patient/Time
        const patientGroups: Record<string, any> = {}

        data.forEach(app => {
          const proc = (app.procedure_name || "").toUpperCase()
          const type = (app.exam_type || "").toUpperCase()
          
          let category = "OUTROS"
          if (proc.includes("RAIO X") || type.includes("RAIO X")) category = "RAIO X"
          else if (proc.includes("TOMOGRAFIA") || type.includes("TOMOGRAFIA")) category = "TOMOGRAFIA"
          else if (proc.includes("ULTRASSOM") || proc.includes("USG") || type.includes("ULTRASSOM") || type.includes("USG")) category = "ULTRASSOM"
          else if (proc.includes("LABORATORIAIS") || type.includes("LABORATORIAIS")) category = "LABORATORIAIS"
          
          // Normalize arrival_time to minutes for grouping key to handle slight batch processing differences
          const arrivalMinute = app.arrival_time ? app.arrival_time.substring(0, 16) : 'no-time'
          const groupKey = `${category}|${app.patient_name}|${arrivalMinute}`

          if (!patientGroups[groupKey]) {
            patientGroups[groupKey] = {
              ...app,
              category,
              ids: [app.id],
              exams: [{ procedure: app.procedure_name, type: app.exam_type }]
            }
          } else {
            patientGroups[groupKey].ids.push(app.id)
            patientGroups[groupKey].exams.push({ procedure: app.procedure_name, type: app.exam_type })
          }
        })

        // 2. Put into Category Buckets
        Object.values(patientGroups).forEach((group: any) => {
          groupedData[group.category].push(group)
        })

        // 3. Apply interleaving logic PER CATEGORY
        const finalGrouped: Record<string, any[]> = {}
        
        Object.keys(groupedData).forEach(cat => {
          const catData = groupedData[cat]
          if (catData.length === 0) return

          const priority = catData.filter(a => a.priority !== "Sem Prioridade")
          const normal = catData.filter(a => a.priority === "Sem Prioridade")
          
          const interleaved: any[] = []
          const maxLen = Math.max(priority.length, normal.length)
          
          for (let i = 0; i < maxLen; i++) {
            if (priority[i]) interleaved.push(priority[i])
            if (normal[i]) interleaved.push(normal[i])
          }
          
          finalGrouped[cat] = interleaved
        })
        
        setAppointments(finalGrouped as any)
      }
    } finally {
       setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleStatusChange = async (ids: string[], newStatus: string, firstAppt: any) => {
    try {
      const { error } = await supabase.from("exam_appointments").update({ status: newStatus }).in("id", ids)
      if (error) throw error

      // Mirror to daily_exams - Use first appointment data for statistics
      const dateKey = firstAppt.exam_date 
      const procedure = firstAppt.procedure_name

      const { data: existing } = await supabase.from("daily_exams").select("*").eq("exam_date", dateKey).eq("procedure_name", procedure).maybeSingle()

      const isNewPresent = newStatus === "presente"
      const isNewAbsent = newStatus === "falta"
      const wasPresent = firstAppt.status === "presente"
      const wasAbsent = firstAppt.status === "falta"

      if (existing) {
        const newPresentCount = Math.max(0, existing.present_count + (isNewPresent ? ids.length : 0) - (wasPresent ? ids.length : 0))
        const newAbsentCount = Math.max(0, existing.absent_count + (isNewAbsent ? ids.length : 0) - (wasAbsent ? ids.length : 0))
        
        await supabase.from("daily_exams").update({
          present_count: newPresentCount,
          absent_count: newAbsentCount
        }).eq("id", existing.id)
      } else {
        await supabase.from("daily_exams").insert([{
          exam_date: dateKey,
          procedure_name: procedure,
          present_count: isNewPresent ? ids.length : 0,
          absent_count: isNewAbsent ? ids.length : 0
        }])
      }

      loadData()
    } catch (e) {
      console.error(e)
    }
  }

  const handleDelete = async (ids: string[]) => {
    if (!confirm(`Deseja excluir este paciente e todos os seus ${ids.length} exames da fila?`)) return
    try {
      const { error } = await supabase.from("exam_appointments").delete().in("id", ids)
      if (error) throw error
      loadData()
    } catch (e) {
      alert("Erro ao excluir")
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
        ) : Object.keys(appointments).length === 0 ? (
           <div className="h-64 flex flex-col items-center justify-center opacity-40">
             <Play className="h-12 w-12 mb-4" />
             <p className="font-space font-bold tracking-widest uppercase">Nenhum paciente aguardando.</p>
           </div>
        ) : (
           <div className="space-y-12 pb-12">
              {Object.keys(appointments).map(category => (
                 <div key={category} className="space-y-4">
                    <div className="flex items-center gap-4 px-4">
                       <div className="h-2 w-2 rounded-full bg-purple-500 animate-pulse" />
                       <h3 className="text-lg font-black font-space text-purple-600 tracking-tighter uppercase">{category}</h3>
                       <div className="h-[1px] flex-1 bg-slate-100" />
                       <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">{(appointments as any)[category].length} Pacientes</span>
                    </div>
                    
                    <div className="overflow-x-auto rounded-[2rem] border border-slate-100 bg-white/50 backdrop-blur-md shadow-sm">
                      <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-slate-50 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100 text-slate-400">
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
                        <tbody className="divide-y divide-slate-50">
                          {(appointments as any)[category].map((a: any) => {
                            const originName = originsData[a.origin_id] || "Não Informada"
                            const age = a.birth_date ? differenceInYears(new Date(), parseISO(a.birth_date)) : "--"
                            const isPriority = a.priority !== "Sem Prioridade"

                            return (
                              <tr key={a.id} className={`hover:bg-slate-50/50 transition-colors group ${a.status === 'presente' ? 'opacity-50' : a.status === 'falta' ? 'opacity-40 grayscale' : ''}`}>
                                <td className="p-4 px-6 text-center">
                                   <div className="flex flex-col items-center justify-center">
                                      <Clock className="h-4 w-4 text-slate-300 mb-1" />
                                      <span className="font-black text-xs text-slate-700">{a.arrival_time ? format(new Date(a.arrival_time), 'HH:mm') : '--:--'}</span>
                                   </div>
                                </td>
                                <td className="p-4 font-black uppercase text-xs text-slate-400">{originName}</td>
                                <td className="p-4">
                                   <div className="flex flex-col">
                                      <span className="font-black uppercase text-slate-800 text-base tracking-tight">{a.patient_name}</span>
                                      {a.ids.length > 1 && <span className="text-[8px] font-black text-purple-500 uppercase mt-1 bg-purple-50 w-fit px-2 py-0.5 rounded-lg">{a.ids.length} EXAMES AGRUPADOS</span>}
                                   </div>
                                </td>
                                <td className="p-4 font-bold text-center text-slate-600">{age}</td>
                                <td className="p-4 text-center font-bold">
                                   {isPriority ? <span className="text-red-500 p-1.5 px-3 rounded-xl bg-red-50 text-[10px] font-black uppercase tracking-widest border border-red-100 italic">{a.priority}</span> : <span className="text-slate-300 text-[10px] font-black uppercase tracking-widest">--</span>}
                                </td>
                                <td className="p-4">
                                   <div className="flex flex-col gap-2 max-w-[350px]">
                                      {a.exams.map((exam: any, idx: number) => (
                                         <div key={idx} className="flex items-center gap-2 group/exam">
                                            <span className="text-purple-600 text-xs font-black uppercase tracking-tight">{exam.procedure}</span>
                                            <span className="text-[9px] border border-slate-100 px-2 py-0.5 rounded-lg bg-slate-50 text-slate-400 font-black uppercase">{exam.type}</span>
                                         </div>
                                      ))}
                                   </div>
                                </td>
                                <td className="p-4 text-center">
                                   {a.status === "aguardando" ? (
                                      <div className="flex justify-center gap-2 scale-90">
                                        <Button onClick={() => handleStatusChange(a.ids, "presente", a)} className="h-10 w-11 p-0 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded-xl shadow-inner transition-all" title="Marcar Presente (Todos)">
                                           <Check className="h-5 w-5" />
                                        </Button>
                                        <Button onClick={() => handleStatusChange(a.ids, "falta", a)} className="h-10 w-11 p-0 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl shadow-inner transition-all" title="Marcar Falta (Todos)">
                                           <X className="h-5 w-5" />
                                        </Button>

                                        {user?.role === "admin" && (
                                          <Button 
                                            onClick={() => handleDelete(a.ids)} 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-10 w-11 rounded-xl text-slate-300 hover:bg-red-50 hover:text-red-500" 
                                            title="Excluir Registros"
                                          >
                                            <Trash className="h-4 w-4" />
                                          </Button>
                                        )}
                                      </div>
                                   ) : (
                                      <div className="flex justify-center items-center gap-3">
                                         {a.status === "presente" && <span className="text-emerald-500 font-black uppercase text-[10px] flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4"/> Presentes</span>}
                                         {a.status === "falta" && <span className="text-red-500 font-black uppercase text-[10px] flex items-center gap-1.5"><UserX className="h-4 w-4"/> Faltas</span>}
                                         
                                         <Button onClick={() => handleStatusChange(a.ids, "aguardando", a)} variant="ghost" size="icon" className="h-8 w-8 text-blue-500 hover:bg-blue-500/10 rounded-full" title="Corrigir / Editar Status">
                                            <Edit className="h-4 w-4" />
                                         </Button>

                                         {user?.role === "admin" && (
                                           <Button 
                                              variant="ghost" 
                                              size="icon" 
                                              className="h-8 w-8 text-slate-300 hover:bg-red-50 hover:text-red-500 rounded-full" 
                                              title="Excluir Registros"
                                              onClick={() => handleDelete(a.ids)}
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
                 </div>
              ))}
           </div>
        )}
      </div>
    </div>
  )
}
