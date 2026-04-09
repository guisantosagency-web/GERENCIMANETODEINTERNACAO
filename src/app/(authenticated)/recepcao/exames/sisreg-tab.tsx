"use client"
import { useState, useEffect, useMemo } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Globe, RefreshCw, CheckCircle2, AlertCircle, User, Calendar, Search, Loader2, ArrowRight, UserPlus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { format } from "date-fns"
import { useAuth } from "@/lib/auth-context"
import { upsertMasterPatient } from "@/lib/patient-search"

export default function SisregTab() {
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [imports, setImports] = useState<any[]>([])
  const [syncJob, setSyncJob] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const { user } = useAuth()
  const supabase = useMemo(() => createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!), [])

  // MOTOR DE BUSCA INTELIGENTE (FUZZY MATCHING)
  const findBestProcedureMatch = (sisregName: string, procedures: string[]) => {
    const normalizedSisreg = sisregName.toUpperCase()
    
    // 0. IGNORAR CONSULTAS (Pedido do Usuário)
    if (normalizedSisreg.includes("CONSULTA")) return "EXCLUDE"

    // 1. Tenta busca exata ou por inclusão direta nos nomes permitidos
    const exactMatch = procedures.find(p => normalizedSisreg.includes(p.toUpperCase()))
    if (exactMatch) return exactMatch

    // 2. Mapeamento por Palavras-Chave (Inteligência Semântica)
    if (normalizedSisreg.includes("TC") || normalizedSisreg.includes("TOMOGRAFIA")) return "Tomografia"
    if (normalizedSisreg.includes("USG") || normalizedSisreg.includes("ULTRASSONO")) return "Ultrassom"
    if (normalizedSisreg.includes("RX") || normalizedSisreg.includes("RAIO")) return "Raio X"
    if (normalizedSisreg.includes("ECO")) return "Ecocardiograma"
    if (normalizedSisreg.includes("LAB") || normalizedSisreg.includes("SANGUE") || normalizedSisreg.includes("BIOQUIMICA")) return "Laboratoriais"
    if (normalizedSisreg.includes("ECG") || normalizedSisreg.includes("ELETRO")) return "Eletrocardiograma"
    if (normalizedSisreg.includes("RM") || normalizedSisreg.includes("RESSONANCIA")) return "Ressonância"
    
    return null
  }

  const loadImports = async () => {
    setIsLoading(true)
    try {
      // 1. Busca os procedimentos oficiais do HTO
      const { data: allowedProcedures } = await supabase
        .from("exam_procedures_list")
        .select("name")
      const allowedNames = (allowedProcedures || []).map(p => p.name)

      // 2. Busca os dados importados do banco
      const { data, error } = await supabase
        .from("exam_sisreg_import")
        .select("*")
        .eq("exam_date", date)
        .order("patient_name")
      
      if (data) {
        // 3. Triagem e Agrupamento
        const grouped: Record<string, any> = {}
        data.forEach(item => {
          const matchedProc = findBestProcedureMatch(item.procedure_name, allowedNames)
          
          // Se for consulta (EXCLUDE), ignoramos completamente
          if (matchedProc === "EXCLUDE") return

          if (!grouped[item.cns]) {
            grouped[item.cns] = {
              ...item,
              hto_procedure: matchedProc || null,
              unrecognized: !matchedProc,
              procedures: [item.procedure_name],
              ids: [item.id]
            }
          } else {
            grouped[item.cns].procedures.push(item.procedure_name)
            grouped[item.cns].ids.push(item.id)
            if (matchedProc && !grouped[item.cns].hto_procedure) {
               grouped[item.cns].hto_procedure = matchedProc
               grouped[item.cns].unrecognized = false
            }
          }
        })
        setImports(Object.values(grouped))
      }
    } finally {
      setIsLoading(false)
    }
  }

  const checkSyncStatus = async () => {
    const { data } = await supabase
      .from("exam_sisreg_sync_jobs")
      .select("*")
      .eq("target_date", date)
      .order("requested_at", { ascending: false })
      .limit(1)
      .maybeSingle()
    
    setSyncJob(data)
    if (data?.status === 'completed' || data?.status === 'failed') {
      setIsSyncing(false)
      loadImports()
    } else if (data?.status === 'processing' || data?.status === 'pending') {
      setIsSyncing(true)
    }
  }

  useEffect(() => {
    loadImports()
    checkSyncStatus()
  }, [date])

  // Inscrição em Tempo Real
  useEffect(() => {
    const channel = supabase
      .channel('sisreg-realtime')
      .on(
        'postgres_changes', 
        { event: '*', schema: 'public', table: 'exam_sisreg_import' }, 
        () => {
          loadImports()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [date])

  const handleStartSync = async () => {
    setIsSyncing(true)
    const { error } = await supabase.from("exam_sisreg_sync_jobs").insert([{
      target_date: date,
      status: 'pending'
    }])
    if (error) {
      alert("Erro ao solicitar sincronização.")
      setIsSyncing(false)
    }
  }

  const handleConfirm = async (patient: any) => {
    setIsLoading(true)
    try {
      const { data: procs } = await supabase.from("exam_procedures_list").select("name")
      const htoProcedure = findBestProcedureMatch(patient.procedure_name, (procs || []).map(p => p.name))

      if (!htoProcedure) {
        alert(`Não encontramos um exame correspondente no HTO para: "${patient.procedure_name}".`)
        return
      }

      // Validação de Vagas
      const { data: slotConfig } = await supabase
        .from("exam_slots")
        .select("total_slots")
        .eq("exam_date", patient.exam_date)
        .eq("procedure_name", htoProcedure)
        .maybeSingle()

      if (!slotConfig) {
        if (!confirm(`Não há limite de vagas configurado para ${htoProcedure}. Confirmar mesmo assim?`)) return
      } else {
        const { count } = await supabase
          .from("exam_appointments")
          .select("*", { count: 'exact', head: true })
          .eq("exam_date", patient.exam_date)
          .eq("procedure_name", htoProcedure)
          .neq("status", "cancelado")

        if (count && count >= slotConfig.total_slots) {
          if (!confirm(`Limite atingido (${count}/${slotConfig.total_slots}). Confirmar mesmo assim?`)) return
        }
      }

      await upsertMasterPatient({
        full_name: patient.patient_name.toUpperCase(),
        sus: patient.cns,
        origem_cadastro: 'sisreg'
      })

      const inserts = patient.procedures.map((proc: string) => ({
        patient_name: patient.patient_name.toUpperCase(),
        sus: patient.cns,
        exam_date: patient.exam_date,
        exam_time: "08:00",
        procedure_name: htoProcedure,
        procedure_detail: proc,
        status: 'agendado',
        receptionist_name: user?.name || "INTEGRAÇÃO_SISREG",
        chave_sisreg: "IMPORT_SISREG"
      }))

      const { error: apptError } = await supabase.from("exam_appointments").insert(inserts)
      if (apptError) throw apptError

      await supabase
        .from("exam_sisreg_import")
        .update({ status: 'confirmed' })
        .in("id", patient.ids)
      
      alert(`Confirmado com sucesso!`)
      loadImports()
    } catch (e) {
      console.error(e)
      alert("Falha ao confirmar.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (ids: string[]) => {
    if(!confirm("Remover registros?")) return
    const { error } = await supabase.from("exam_sisreg_import").delete().in("id", ids)
    if (!error) loadImports()
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="glass-card !bg-white/40 border-none rounded-[2.5rem] p-8 lg:p-10 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-10">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-blue-600 text-white rounded-2xl shadow-xl shadow-blue-500/20 animate-pulse-slow">
              <Globe className="h-7 w-7" />
            </div>
            <div>
              <h2 className="text-3xl font-black font-space uppercase tracking-tight text-slate-800">Sincronização SISREG</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Conexão direta com a rede de regulação</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 bg-slate-100/50 p-4 rounded-[2rem] border border-slate-200/50">
            <div className="space-y-1">
              <Label className="uppercase text-[9px] font-black tracking-widest text-slate-400 ml-2">Data da Consulta</Label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="h-12 bg-white border-none rounded-xl text-xs font-black w-44 shadow-sm" />
            </div>
            <Button 
                onClick={handleStartSync} 
                className="h-12 rounded-xl px-8 bg-slate-900 hover:bg-black text-white font-black uppercase text-[10px] tracking-widest gap-2"
            >
              <RefreshCw className="h-4 w-4" /> Consultar no SISREG
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {isLoading ? (
             <div className="py-20 flex flex-col items-center justify-center gap-4 text-slate-400">
               <Loader2 className="h-10 w-10 animate-spin" />
               <span className="text-[10px] font-black uppercase tracking-widest">Carregando...</span>
             </div>
          ) : imports.length === 0 ? (
            <div className="py-20 bg-slate-50/50 rounded-[3rem] border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
               <Search className="h-16 w-16 mb-4 opacity-10" />
               <p className="text-sm font-black uppercase tracking-widest opacity-30">Nenhum registro encontrado</p>
            </div>
          ) : (
            imports.map((item, idx) => (
              <div key={idx} className={`p-6 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-blue-200 transition-all ${item.status === 'confirmed' ? 'opacity-50 grayscale' : ''}`}>
                 <div className="flex items-center gap-6">
                    <div className="h-14 w-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-800 font-bold text-xl">
                       {item.patient_name.charAt(0)}
                    </div>
                    <div>
                       <h4 className="font-black text-slate-800 uppercase tracking-tight flex items-center gap-3">
                          {item.patient_name}
                          {item.status === 'confirmed' && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                       </h4>
                       <div className="flex flex-wrap items-center gap-3 mt-1.5">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-0.5 rounded-md">CNS: {item.cns}</span>
                          {item.unrecognized ? (
                             <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest bg-amber-100 px-2 py-0.5 rounded-md flex items-center gap-1.5 animate-pulse">
                                <AlertCircle className="h-3 w-3" /> Exame não reconhecido
                             </span>
                          ) : (
                             <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded-md">
                                {item.hto_procedure}
                             </span>
                          )}
                       </div>
                    </div>
                 </div>

                 <div className="flex flex-wrap items-center gap-3 md:max-w-[40%]">
                    {item.procedures.map((proc: string, pi: number) => (
                      <span key={pi} className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-[9px] font-black uppercase tracking-tight border border-slate-200/50">{proc}</span>
                    ))}
                 </div>

                 <div className="flex items-center gap-3">
                    <Button 
                        disabled={item.status === 'confirmed' || isLoading} 
                        onClick={() => handleConfirm(item)}
                        className={`h-12 rounded-xl px-6 font-black uppercase text-[10px] tracking-widest gap-2 ${item.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                    >
                       {item.status === 'confirmed' ? 'Confirmado' : 'Confirmar Agenda'}
                    </Button>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDelete(item.ids)}
                        className="h-10 w-10 text-slate-300 hover:text-red-500"
                    >
                       <Trash2 className="h-5 w-5" />
                    </Button>
                 </div>
              </div>
            ))
          )}
        </div>
      </div>
      
      <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden group">
         <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="space-y-3">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500 rounded-lg text-white"><Globe className="h-5 w-5" /></div>
                  <h5 className="text-xl font-black uppercase tracking-tight">Como usar a Extensão HTO</h5>
               </div>
               <p className="text-slate-400 font-medium max-w-2xl leading-relaxed">
                  Para importar dados, use a <span className="text-blue-400 font-bold">Extensão HTO</span> no SISREG. O sistema irá ignorar consultas automaticamente e listar apenas os exames do seu catálogo.
               </p>
            </div>
         </div>
      </div>
    </div>
  )
}
