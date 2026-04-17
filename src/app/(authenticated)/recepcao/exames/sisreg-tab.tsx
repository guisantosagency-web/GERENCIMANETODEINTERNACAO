"use client"
import { useState, useEffect, useMemo } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Globe, RefreshCw, CheckCircle2, Search, Loader2, UserPlus, Trash2, Undo2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { format } from "date-fns"
import { useAuth } from "@/lib/auth-context"
import { upsertMasterPatient } from "@/lib/patient-search"

export default function SisregTab() {
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [imports, setImports] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [processingId, setProcessingId] = useState<string | null>(null)
  
  const { user } = useAuth()
  const supabase = useMemo(() => createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!), [])

  const loadImports = async () => {
    setIsLoading(true)
    try {
      const { data: importData } = await supabase
        .from("exam_sisreg_import")
        .select("*")
        .eq("exam_date", date)
        .order("patient_name")
      
      if (importData) {
        const grouped: Record<string, any> = {}

        importData.forEach(item => {
          // Ignorar consultas e eletrocardiogramas (Filtro solicitado pelo usuário)
          const procUpper = item.procedure_name.toUpperCase()
          if (procUpper.includes("CONSULTA") || procUpper.includes("ELETROCARDIOGRAMA")) return

          if (!grouped[item.cns]) {
            grouped[item.cns] = { ...item, procedures: [item.procedure_name], ids: [item.id] }
          } else {
            grouped[item.cns].procedures.push(item.procedure_name)
            grouped[item.cns].ids.push(item.id)
          }
        })
        setImports(Object.values(grouped))
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleDirectSchedule = async (patient: any) => {
    setProcessingId(patient.cns)
    try {
      // 1. Cadastro Mestre Compacto
      await upsertMasterPatient({
        full_name: patient.patient_name.toUpperCase(),
        sus: patient.cns,
        origem_cadastro: 'sisreg_direct'
      })

      // 2. Criar Agendamentos Diretos (Sem vínculo com vaga ou grupo HTO)
      const inserts = patient.procedures.map((sisregProc: string) => ({
        patient_name: patient.patient_name.toUpperCase(),
        sus: patient.cns,
        exam_date: patient.exam_date,
        exam_time: "08:00",
        procedure_name: sisregProc, // Uso direto do nome do SISREG
        exam_type: "SISREG",
        status: 'agendado',
        receptionist_name: user?.name || "SISREG",
        chave_sisreg: ""
      }))

      const { error: apptError } = await supabase.from("exam_appointments").insert(inserts)
      if (apptError) throw new Error(apptError.message)

      // 3. Confirmar na Importação
      await supabase.from("exam_sisreg_import").update({ status: 'confirmed' }).in("id", patient.ids)
      
      loadImports()
    } catch (e: any) {
      console.error(e)
      alert(`Erro: ${e.message}`)
    } finally {
      setProcessingId(null)
    }
  }

  const handleUnconfirm = async (patient: any) => {
    if (!confirm(`Deseja cancelar o agendamento de ${patient.patient_name}?`)) return
    setIsLoading(true)
    try {
      await supabase.from("exam_appointments").delete().eq("sus", patient.cns).eq("exam_date", patient.exam_date).or(`chave_sisreg.eq.IMPORT_SISREG,chave_sisreg.eq.`)
      await supabase.from("exam_sisreg_import").update({ status: 'pending' }).in("id", patient.ids)
      alert("Agendamento removido.")
      loadImports()
    } catch (e) {
      console.error(e)
      alert("Erro ao desfazer.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (ids: string[]) => {
    if(!confirm("Remover registros?")) return
    await supabase.from("exam_sisreg_import").delete().in("id", ids)
    loadImports()
  }

  useEffect(() => { loadImports() }, [date])

  const filteredImports = useMemo(() => {
    if (!searchTerm) return imports
    const s = searchTerm.toUpperCase()
    return imports.filter(item => 
      item.patient_name.toUpperCase().includes(s) || 
      item.cns.includes(s)
    )
  }, [imports, searchTerm])

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-1000 relative pb-32">
      {/* TERMINAL HEADER SECTION */}
      <div className="bg-white rounded-[3rem] p-8 lg:p-12 shadow-sm border border-slate-100 relative overflow-hidden">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-10">
          <div className="flex items-center gap-6">
            <div className="relative group">
              <div className="h-16 w-16 bg-teal-50 rounded-2xl flex items-center justify-center text-teal-600 shadow-sm border border-teal-100 relative">
                <Globe className="h-8 w-8" />
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-bold font-space uppercase tracking-tight text-slate-800 leading-tight">Triagem SISREG</h2>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">Terminal de Ingestão e Processamento</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-5 bg-slate-50 border border-slate-200 p-5 rounded-3xl shadow-sm">
            <div className="space-y-1.5 flex-1 min-w-[150px]">
              <Label className="uppercase text-[9px] font-bold tracking-wider text-slate-500 ml-2">Monitoramento Data</Label>
              <Input 
                type="date" 
                value={date} 
                onChange={e => setDate(e.target.value)} 
                className="h-12 bg-white border-slate-200 rounded-xl text-xs font-bold text-slate-700 w-full shadow-sm uppercase transition-colors focus:border-teal-400 outline-none" 
              />
            </div>

            <div className="space-y-1.5 flex-1 min-w-[280px]">
              <Label className="uppercase text-[9px] font-bold tracking-wider text-slate-500 ml-2">Scanner de Paciente</Label>
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-teal-500 transition-colors" />
                <Input 
                  placeholder="DIGITE NOME OU CNS..." 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="h-12 pl-12 pr-4 bg-white border-slate-200 rounded-xl text-[11px] font-bold text-slate-700 shadow-sm uppercase transition-colors focus:border-teal-400 outline-none" 
                />
              </div>
            </div>

            <div className="flex items-end self-end shrink-0">
              <Button 
                onClick={loadImports} 
                className="h-12 px-8 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-bold uppercase text-[10px] tracking-wider gap-3 shadow-sm transition-all"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} /> 
                Sincronizar
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* DATA FLOW MONITOR */}
      <div className="space-y-6">
        {isLoading && imports.length === 0 ? (
          <div className="py-40 flex flex-col items-center justify-center gap-6">
            <Loader2 className="h-16 w-16 text-teal-400 animate-spin" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 animate-pulse">Parseando Protocolos SISREG...</p>
          </div>
        ) : filteredImports.length === 0 ? (
          <div className="py-40 bg-white rounded-[3rem] border border-slate-100 flex flex-col items-center justify-center text-center shadow-sm">
             <div className="w-24 h-24 rounded-[2rem] bg-slate-50 border border-slate-200 flex items-center justify-center mb-6">
               <Globe className="h-10 w-10 text-slate-300" />
             </div>
             <p className="text-sm font-bold uppercase tracking-widest text-slate-500">Nenhum Dado Recebido</p>
             <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-3 max-w-sm">Verifique a sincronização com o rádio-operador SISREG.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5">
            {filteredImports.map((item, idx) => {
              const isConfirmed = item.status === 'confirmed'
              return (
                <div key={idx} className={`bg-white p-6 lg:p-8 rounded-[2.5rem] relative group border transition-all duration-300 overflow-hidden shadow-sm hover:shadow-md ${isConfirmed ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-100 hover:border-teal-300'}`}>
                   <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8 pl-2">
                      <div className="flex flex-1 items-center gap-6">
                         <div className={`h-16 w-16 rounded-[1.5rem] flex items-center justify-center font-bold text-xl transition-colors border shrink-0 ${isConfirmed ? 'bg-emerald-500 text-white border-emerald-600' : 'bg-slate-50 text-slate-500 border-slate-200 group-hover:bg-teal-50 group-hover:text-teal-600 group-hover:border-teal-200'}`}>
                            {item.patient_name.charAt(0)}
                         </div>
                         <div>
                            <h4 className="text-xl font-bold text-slate-800 uppercase tracking-tight group-hover:text-teal-700 transition-colors">{item.patient_name}</h4>
                            <div className="flex items-center gap-3 mt-2">
                               <div className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2 shadow-sm">
                                  <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isConfirmed ? 'bg-emerald-500' : 'bg-teal-400'}`} />
                                  SUS: <span className="text-slate-700">{item.cns}</span>
                               </div>
                            </div>
                         </div>
                      </div>

                      <div className="flex-1 max-w-2xl px-4 border-l border-slate-100">
                         <div className="flex flex-wrap gap-2">
                            {item.procedures.map((p: string, pi: number) => (
                               <div key={pi} className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-[10px] font-bold text-slate-600 uppercase tracking-wider hover:border-teal-300 transition-colors shadow-sm">
                                  {p}
                               </div>
                            ))}
                         </div>
                      </div>

                      <div className="flex items-center justify-end gap-3 shrink-0">
                         {isConfirmed ? (
                            <div className="flex flex-col items-end gap-3">
                               <div className="px-5 py-2.5 bg-emerald-50 text-emerald-600 rounded-xl font-bold text-[10px] uppercase tracking-wider flex items-center gap-2 border border-emerald-100 shadow-sm">
                                  <CheckCircle2 className="h-4 w-4" /> 
                                  Autorizado
                               </div>
                               <Button 
                                  variant="ghost"
                                  onClick={() => handleUnconfirm(item)}
                                  className="h-9 px-4 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors font-bold text-[9px] uppercase tracking-wider gap-2 border border-slate-100 hover:border-rose-100 shadow-sm"
                               >
                                  <Undo2 className="h-3 w-3" /> Desfazer
                                </Button>
                            </div>
                         ) : (
                            <Button 
                              onClick={() => handleDirectSchedule(item)}
                              disabled={processingId === item.cns}
                              className="h-14 px-8 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-bold text-[10px] uppercase tracking-wider gap-3 shadow-sm transition-all group/btn"
                            >
                              {processingId === item.cns ? <Loader2 className="h-5 w-5 animate-spin" /> : <UserPlus className="h-5 w-5 group-hover/btn:scale-110 transition-transform" />}
                              Autorizar Entrada
                            </Button>
                         )}
                         
                         {!isConfirmed && (
                           <Button 
                            variant="ghost" 
                            onClick={() => handleDelete(item.ids)} 
                            className="h-10 w-10 ml-2 rounded-xl text-slate-300 hover:bg-rose-50 hover:text-rose-500 transition-colors border border-transparent hover:border-rose-100 shadow-sm"
                           >
                              <Trash2 className="h-4 w-4" />
                           </Button>
                         )}
                      </div>
                   </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

    </div>
  )
}
