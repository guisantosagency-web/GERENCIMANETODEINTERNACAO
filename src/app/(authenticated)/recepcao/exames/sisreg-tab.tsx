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
      <div className="card-csgo rounded-[3.5rem] p-8 lg:p-12 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#00D9FF] to-transparent" />
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-12">
          <div className="flex items-center gap-8">
            <div className="relative group">
              <div className="absolute inset-0 bg-[#00D9FF] blur-2xl opacity-20 animate-pulse" />
              <div className="h-20 w-20 bg-gradient-to-br from-[#00D9FF] to-[#0088FF] rounded-[2rem] flex items-center justify-center text-white shadow-2xl relative border border-white/20">
                <Globe className="h-10 w-10" />
              </div>
            </div>
            <div>
              <h2 className="text-5xl font-black font-space uppercase tracking-tight text-white leading-tight">Triagem SISREG</h2>
              <p className="text-[10px] font-black uppercase tracking-[0.5em] text-[#7E8C9A] mt-2 ml-1">Terminal de Ingestão e Processamento</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 bg-[#161B22] border border-white/5 p-4 rounded-[2.5rem] shadow-2xl">
            <div className="space-y-1.5">
              <Label className="uppercase text-[8px] font-black tracking-widest text-[#7E8C9A] ml-4">Monitoramento Data</Label>
              <Input 
                type="date" 
                value={date} 
                onChange={e => setDate(e.target.value)} 
                className="h-14 bg-white/5 border-white/5 rounded-2xl text-[11px] font-black text-white w-48 shadow-xl uppercase transition-all focus:border-[#00D9FF]/50" 
              />
            </div>

            <div className="space-y-1.5 min-w-[350px]">
              <Label className="uppercase text-[8px] font-black tracking-widest text-[#7E8C9A] ml-4">Scanner de Paciente</Label>
              <div className="relative group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-[#7E8C9A] group-focus-within:text-[#00D9FF] transition-colors" />
                <Input 
                  placeholder="DIGITE NOME OU CNS..." 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="h-14 pl-14 pr-6 bg-white/5 border-white/5 rounded-2xl text-[11px] font-black text-white shadow-xl uppercase transition-all focus:border-[#00D9FF]/50" 
                />
              </div>
            </div>

            <div className="flex items-end self-end">
              <Button 
                onClick={loadImports} 
                className="h-14 px-10 rounded-2xl bg-[#00D9FF] text-white font-black uppercase text-[11px] tracking-widest gap-4 shadow-[0_10px_30px_rgba(0,217,255,0.2)] hover:scale-[1.05] transition-all"
              >
                <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} /> 
                Sync Engine
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* DATA FLOW MONITOR */}
      <div className="space-y-6">
        {isLoading && imports.length === 0 ? (
          <div className="py-60 flex flex-col items-center justify-center gap-8">
            <div className="relative">
              <Loader2 className="h-24 w-24 text-[#00D9FF] animate-spin" />
              <div className="absolute inset-0 h-24 w-24 text-[#00D9FF] animate-pulse blur-3xl opacity-20" />
            </div>
            <p className="text-[11px] font-black uppercase tracking-[0.8em] text-[#7E8C9A] animate-pulse">Parseando Protocolos SISREG...</p>
          </div>
        ) : filteredImports.length === 0 ? (
          <div className="py-60 card-csgo rounded-[4rem] flex flex-col items-center justify-center text-center opacity-30 border-white/5">
             <div className="w-40 h-40 rounded-[3rem] bg-[#161B22] border border-dashed border-white/10 flex items-center justify-center mb-10">
               <Globe className="h-20 w-20 text-white" />
             </div>
             <p className="text-xl font-black uppercase tracking-[0.5em] text-[#7E8C9A]">Nenhum Dado Recebido</p>
             <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#7E8C9A]/40 mt-6 max-w-sm">Verifique a sincronização com o rádio-operador SISREG.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredImports.map((item, idx) => {
              const isConfirmed = item.status === 'confirmed'
              return (
                <div key={idx} className={`card-csgo p-8 lg:p-10 rounded-[4rem] relative group border transition-all duration-700 overflow-hidden ${isConfirmed ? 'border-[#00FF88]/20 bg-[#00FF88]/5 shadow-[0_0_50px_rgba(0,255,136,0.05)]' : 'border-white/5 hover:border-[#00D9FF]/40'}`}>
                   <div className="absolute top-0 right-0 p-12 opacity-[0.01] group-hover:opacity-[0.05] group-hover:scale-125 transition-all text-white pointer-events-none">
                      <Search className="h-64 w-64" />
                   </div>

                   <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-12">
                      <div className="flex flex-1 items-center gap-10">
                         <div className={`h-24 w-24 rounded-[2.5rem] flex items-center justify-center font-black text-4xl transition-all border shrink-0 ${isConfirmed ? 'bg-[#00FF88] text-white' : 'bg-[#161B22] text-[#7E8C9A] border-white/5 shadow-2xl group-hover:text-[#00D9FF] group-hover:border-[#00D9FF]/30'}`}>
                            {item.patient_name.charAt(0)}
                         </div>
                         <div>
                            <h4 className="text-3xl font-black text-white uppercase tracking-tight group-hover:text-[#00D9FF] transition-colors leading-tight">{item.patient_name}</h4>
                            <div className="flex items-center gap-4 mt-3">
                               <div className="px-5 py-2 rounded-2xl bg-[#161B22] border border-white/5 text-[10px] font-black text-[#7E8C9A] uppercase tracking-widest flex items-center gap-3">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#00D9FF] animate-pulse" />
                                  SUS: {item.cns}
                               </div>
                            </div>
                         </div>
                      </div>

                      <div className="flex-1 max-w-2xl">
                         <div className="flex flex-wrap gap-3">
                            {item.procedures.map((p: string, pi: number) => (
                               <div key={pi} className="px-5 py-3 rounded-2xl bg-white/[0.03] border border-white/5 text-[10px] font-black text-white/60 uppercase tracking-tight hover:border-[#00D9FF]/40 transition-all">
                                  {p}
                               </div>
                            ))}
                         </div>
                      </div>

                      <div className="flex items-center justify-end gap-6 shrink-0">
                         {isConfirmed ? (
                            <div className="flex items-center gap-4">
                               <div className="px-8 py-4 bg-[#00FF88]/10 text-[#00FF88] rounded-3xl font-black text-[11px] uppercase tracking-widest flex items-center gap-4 border border-[#00FF88]/20 shadow-xl">
                                  <CheckCircle2 className="h-5 w-5" /> 
                                  Confirmed
                               </div>
                               <Button 
                                  variant="ghost"
                                  onClick={() => handleUnconfirm(item)}
                                  className="h-16 px-8 rounded-3xl bg-white/5 text-[#7E8C9A] hover:bg-[#FF1493] hover:text-white transition-all duration-500 font-black text-[10px] uppercase tracking-widest gap-4 border border-white/5"
                               >
                                  <Undo2 className="h-5 w-5" /> Rollback
                                </Button>
                            </div>
                         ) : (
                            <Button 
                              onClick={() => handleDirectSchedule(item)}
                              disabled={processingId === item.cns}
                              className="h-16 px-10 rounded-3xl bg-[#00D9FF] text-white font-black text-[11px] uppercase tracking-widest gap-4 shadow-[0_10px_40px_rgba(0,217,255,0.3)] hover:scale-[1.05] transition-all"
                            >
                              {processingId === item.cns ? <Loader2 className="h-6 w-6 animate-spin" /> : <UserPlus className="h-6 w-6" />}
                              Authorize Entry
                            </Button>
                         )}
                         
                         {!isConfirmed && (
                           <Button 
                            variant="ghost" 
                            onClick={() => handleDelete(item.ids)} 
                            className="h-16 w-16 rounded-[1.5rem] bg-white/5 text-white/5 hover:text-[#FF1493] transition-all duration-500 group/del"
                           >
                              <Trash2 className="h-6 w-6" />
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
