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

  const loadImports = async () => {
    setIsLoading(true)
    try {
      // 1. Busca os procedimentos permitidos do HTO
      const { data: allowedProcedures } = await supabase
        .from("exam_procedures_list")
        .select("name")
      const allowedNames = (allowedProcedures || []).map(p => p.name)

      // 2. Busca TODOS os dados importados para a data
      const { data, error } = await supabase
        .from("exam_sisreg_import")
        .select("*")
        .eq("exam_date", date)
        .order("patient_name")
      
      if (data) {
        // 3. Filtra e Agrupa usando a inteligência do sistema
        const grouped: Record<string, any> = {}
        data.forEach(item => {
          // Verifica se o procedimento se enquadra em algum do HTO
          const matchedProc = findBestProcedureMatch(item.procedure_name, allowedNames)
          
          if (!grouped[item.cns]) {
            grouped[item.cns] = {
              ...item,
              hto_procedure: matchedProc || null, // Se não achar, fica null
              unrecognized: !matchedProc, // Marca como não reconhecido
              procedures: [item.procedure_name],
              ids: [item.id]
            }
          } else {
            grouped[item.cns].procedures.push(item.procedure_name)
            grouped[item.cns].ids.push(item.id)
            // Se um dos procedimentos do grupo for reconhecido, atualiza
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

  // Inscrição em Tempo Real para ver os dados aparecendo enquanto a extensão trabalha
  useEffect(() => {
    const channel = supabase
      .channel('sisreg-realtime')
      .on(
        'postgres_changes', 
        { event: '*', schema: 'public', table: 'exam_sisreg_import' }, 
        () => {
          console.log("Mudança detectada no banco, atualizando lista...")
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

  // MOTOR DE BUSCA INTELIGENTE (FUZZY MATCHING)
  const findBestProcedureMatch = (sisregName: string, procedures: string[]) => {
    const normalizedSisreg = sisregName.toUpperCase()
    
    // 1. Tenta busca exata
    const exactMatch = procedures.find(p => normalizedSisreg.includes(p.toUpperCase()))
    if (exactMatch) return exactMatch

    // 2. Tenta por palavras-chave comuns
    if (normalizedSisreg.includes("TC") || normalizedSisreg.includes("TOMOGRAFIA")) return "Tomografia"
    if (normalizedSisreg.includes("USG") || normalizedSisreg.includes("ULTRASSONO")) return "Ultrassom"
    if (normalizedSisreg.includes("RX") || normalizedSisreg.includes("RAIO")) return "Raio X"
    if (normalizedSisreg.includes("ECO")) return "Ecocardiograma"
    if (normalizedSisreg.includes("LAB") || normalizedSisreg.includes("SANGUE")) return "Laboratoriais"
    
    return null
  }

  const handleConfirm = async (patient: any) => {
    setIsLoading(true)
    try {
      // 1. Identificar Procedimento Interno correspondente
      const { data: procs } = await supabase.from("exam_procedures_list").select("name")
      const htoProcedure = findBestProcedureMatch(patient.procedure_name, (procs || []).map(p => p.name))

      if (!htoProcedure) {
        alert(`Não encontramos um exame correspondente no HTO para: "${patient.procedure_name}". Verifique o cadastro do procedimento.`)
        return
      }

      // 2. Verificar Disponibilidade de Vagas
      const { data: slotConfig } = await supabase
        .from("exam_slots")
        .select("total_slots")
        .eq("exam_date", patient.exam_date)
        .eq("procedure_name", htoProcedure)
        .maybeSingle()

      if (!slotConfig) {
        if (!confirm(`Não há limite de vagas configurado para ${htoProcedure} em ${format(new Date(patient.exam_date + 'T00:00:00'), 'dd/MM')}. Deseja confirmar mesmo assim?`)) return
      } else {
        // Contar agendamentos existentes
        const { count } = await supabase
          .from("exam_appointments")
          .select("*", { count: 'exact', head: true })
          .eq("exam_date", patient.exam_date)
          .eq("procedure_name", htoProcedure)
          .neq("status", "cancelado")

        if (count && count >= slotConfig.total_slots) {
          if (!confirm(`ATENÇÃO: Limite de vagas atingido (${count}/${slotConfig.total_slots}). Confirmar mesmo assim?`)) return
        }
      }

      // 3. Registrar Paciente Master
      await upsertMasterPatient({
        full_name: patient.patient_name.toUpperCase(),
        sus: patient.cns,
        origem_cadastro: 'sisreg'
      })

      // 4. Criar Agendamentos Oficiais
      const inserts = patient.procedures.map((proc: string) => ({
        patient_name: patient.patient_name.toUpperCase(),
        sus: patient.cns,
        exam_date: patient.exam_date,
        exam_time: "08:00", // Horário padrão de chegada
        procedure_name: htoProcedure, // Usa o nome reconhecido pelo sistema
        procedure_detail: proc, // Guarda o nome original do SISREG como detalhe
        status: 'agendado', // Status agendado faz aparecer na recepção/chegada
        receptionist_name: user?.name || "INTEGRAÇÃO_SISREG",
        chave_sisreg: "IMPORT_SISREG"
      }))

      const { error: apptError } = await supabase.from("exam_appointments").insert(inserts)
      if (apptError) throw apptError

      // 5. Atualizar status da importação
      await supabase
        .from("exam_sisreg_import")
        .update({ status: 'confirmed' })
        .in("id", patient.ids)
      
      alert(`Sucesso! ${patient.patient_name.split(' ')[0]} foi agendado para ${htoProcedure}.`)
      loadImports()
    } catch (e) {
      console.error(e)
      alert("Falha ao processar confirmação.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (ids: string[]) => {
    if(!confirm("Remover estes registros importados?")) return
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
                disabled={isSyncing} 
                className={`h-12 rounded-xl px-8 font-black uppercase text-[10px] tracking-widest gap-2 shadow-lg transition-all ${isSyncing ? 'bg-amber-500 text-white' : 'bg-slate-900 hover:bg-black text-white shadow-slate-900/10'}`}
            >
              {isSyncing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Robô Processando...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Consultar no SISREG
                </>
              )}
            </Button>
          </div>
        </div>

        {syncJob?.status === 'failed' && (
          <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-4 text-red-600 animate-in shake duration-500">
            <AlertCircle className="h-5 w-5" />
            <p className="text-xs font-bold uppercase tracking-tight">Ocorreu um erro na captura: {syncJob.error_message}</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4">
          {isLoading && !isSyncing ? (
             <div className="py-20 flex flex-col items-center justify-center gap-4 text-slate-400">
               <Loader2 className="h-10 w-10 animate-spin" />
               <span className="text-[10px] font-black uppercase tracking-widest">Carregando lista...</span>
             </div>
          ) : imports.length === 0 ? (
            <div className="py-20 bg-slate-50/50 rounded-[3rem] border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
               <Search className="h-16 w-16 mb-4 opacity-10" />
               <p className="text-sm font-black uppercase tracking-widest opacity-30">Nenhum registro capturado para esta data</p>
               <p className="text-[10px] font-bold uppercase tracking-widest mt-2 opacity-20 italic">Clique em consultar para iniciar o robô</p>
            </div>
          ) : (
            imports.map((item, idx) => (
              <div key={idx} className={`p-6 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-blue-200 transition-all group ${item.status === 'confirmed' ? 'opacity-50 grayscale' : ''}`}>
                 <div className="flex items-center gap-6">
                    <div className="h-14 w-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 font-black text-xl group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
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
                                <AlertCircle className="h-3 w-3" /> Exame não reconhecido pelo HTO
                             </span>
                          ) : (
                             <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded-md flex items-center gap-1.5">
                                <User className="h-3 w-3" /> {item.professional || 'Prof. não inf.'}
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
                        className={`h-12 rounded-xl px-6 font-black uppercase text-[10px] tracking-widest gap-3 shadow-lg transition-all ${item.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20 active:scale-95'}`}
                    >
                       {item.status === 'confirmed' ? 'Agenda Confirmada' : <><UserPlus className="h-4 w-4" /> Confirmar Agenda</>}
                    </Button>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDelete(item.ids)}
                        className="h-12 w-12 rounded-xl text-slate-300 hover:bg-red-50 hover:text-red-500 transition-all"
                    >
                       <Trash2 className="h-5 w-5" />
                    </Button>
                 </div>
              </div>
            ))
          )}
        </div>
      </div>
      
      {/* CARD DE DICA DE USO - ATUALIZADO PARA EXTENSÃO */}
      <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden group">
         <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-blue-500/20 transition-all duration-1000" />
         <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="space-y-3">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500 rounded-lg text-white"><Globe className="h-5 w-5" /></div>
                  <h5 className="text-xl font-black uppercase tracking-tight">Como usar a Extensão HTO</h5>
               </div>
               <p className="text-slate-400 font-medium max-w-2xl leading-relaxed">
                  Para importar dados, abra o <span className="text-blue-400 font-bold">SISREG</span> em uma aba ao lado, faça sua consulta e clique no botão azul flutuante <span className="text-blue-400 font-bold">"🚀 IMPORTAR TUDO PARA HTO"</span>. Os dados aparecerão aqui automaticamente conforme forem sendo processados pela extensão.
               </p>
            </div>
            <div className="flex items-center gap-6">
               <div className="text-right">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Status da Integração</p>
                  <p className="text-sm font-black uppercase tracking-tight flex items-center justify-end gap-2 text-blue-400">
                     <span className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
                     Extensão HTO Ativa
                  </p>
               </div>
            </div>
         </div>
      </div>
    </div>
  )
}
