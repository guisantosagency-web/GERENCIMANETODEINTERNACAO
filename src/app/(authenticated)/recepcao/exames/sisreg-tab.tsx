"use client"
import { useState, useEffect, useMemo } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Globe, RefreshCw, CheckCircle2, AlertCircle, User, Calendar, Search, Loader2, UserPlus, Trash2, Filter, Undo2, X, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { format } from "date-fns"
import { useAuth } from "@/lib/auth-context"
import { upsertMasterPatient } from "@/lib/patient-search"

export default function SisregTab() {
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [imports, setImports] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [processingId, setProcessingId] = useState<string | null>(null)
  
  const { user, logos } = useAuth()
  const supabase = useMemo(() => createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!), [])

  // ... (findBestProcedureMatch remains the same)
  const findBestProcedureMatch = (sisregName: string, procedures: string[], subTypes: any[]) => {
    const normalizedSisreg = sisregName.toUpperCase()
    if (normalizedSisreg.includes("CONSULTA") || normalizedSisreg.includes("RETORNO")) return "EXCLUDE"

    const exactGroupMatch = procedures.find(p => normalizedSisreg.includes(p.toUpperCase()))
    if (exactGroupMatch) return exactGroupMatch

    const subTypeMatch = subTypes.find(st => normalizedSisreg.includes(st.name.toUpperCase()))
    if (subTypeMatch) return subTypeMatch.procedure_name

    if (normalizedSisreg.includes("TC") || normalizedSisreg.includes("TOMOGRAFIA")) return "Tomografia"
    if (normalizedSisreg.includes("USG") || normalizedSisreg.includes("ULTRASSONO")) return "Ultrassom"
    if (normalizedSisreg.includes("RX") || normalizedSisreg.includes("RAIO")) return "Raio X"
    if (normalizedSisreg.includes("ECO")) return "Ecocardiograma"
    if (normalizedSisreg.includes("LAB") || normalizedSisreg.includes("SANGUE") || normalizedSisreg.includes("BIOQUIMICA") || 
        normalizedSisreg.includes("DOSAGEM") || normalizedSisreg.includes("HEMOGRAMA") || normalizedSisreg.includes("GLICOSE") ||
        normalizedSisreg.includes("UREIA") || normalizedSisreg.includes("CREATININA") || normalizedSisreg.includes("TESTE") ||
        normalizedSisreg.includes("CONTAGEM") || normalizedSisreg.includes("TIPAGEM")) return "Laboratoriais"
    if (normalizedSisreg.includes("ECG") || normalizedSisreg.includes("ELETRO")) return "Eletrocardiograma"
    if (normalizedSisreg.includes("RM") || normalizedSisreg.includes("RESSONANCIA")) return "Ressonância"
    
    return null
  }

      const { data: importData } = await supabase
        .from("exam_sisreg_import")
        .select("*")
        .eq("exam_date", date)
        .order("patient_name")
      
      if (importData) {
        const grouped: Record<string, any> = {}

        importData.forEach(item => {
          // Ignorar se houver palavra CONSULTA (Filtro redundante para segurança)
          if (item.procedure_name.toUpperCase().includes("CONSULTA")) return

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
        chave_sisreg: "IMPORT_SISREG"
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

  const handlePrintLabel = async (patient: any) => {
    const { data } = await supabase.from("exam_appointments").select("*").eq("sus", patient.cns).eq("exam_date", patient.exam_date).eq("chave_sisreg", "IMPORT_SISREG")
    if (data && data.length > 0) {
      generatePrintableFicha(data)
    }
  }

  const handleUnconfirm = async (patient: any) => {
    if (!confirm(`Deseja cancelar o agendamento de ${patient.patient_name}?`)) return
    setIsLoading(true)
    try {
      await supabase.from("exam_appointments").delete().eq("sus", patient.cns).eq("exam_date", patient.exam_date).eq("chave_sisreg", "IMPORT_SISREG")
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

  return (
    <div className="h-full flex gap-8 relative overflow-hidden animate-in fade-in duration-500">
      

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 space-y-6">
        <div className="glass-card !bg-white/40 border-none rounded-[3rem] p-8 lg:p-12 shadow-sm relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
            <div className="flex items-center gap-6">
              <div className="p-5 bg-blue-600 text-white rounded-[2rem] shadow-2xl shadow-blue-500/20">
                <Globe className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-4xl font-black font-space uppercase tracking-tight text-slate-800">Triagem SISREG</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 ml-1">Atendimento de Pacientes Importados</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 bg-white/80 backdrop-blur-md p-5 rounded-[2.5rem] border border-slate-200 shadow-sm">
              <div className="space-y-1">
                <Label className="uppercase text-[9px] font-black tracking-widest text-slate-400 ml-3">Filtrar Data SISREG</Label>
                <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="h-14 bg-slate-50 border-none rounded-2xl text-sm font-black w-48 shadow-inner" />
              </div>
              <Button onClick={loadImports} className="h-14 rounded-2xl px-10 bg-slate-900 hover:bg-black text-white font-black uppercase text-xs tracking-widest gap-3 transition-all active:scale-95">
                <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} /> Sincronizar
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-separate border-spacing-y-4">
              <thead>
                <tr className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  <th className="px-8 py-4">Paciente | Identificação</th>
                  <th className="px-8 py-4">Procedimentos SISREG</th>
                  <th className="px-8 py-4 text-center">Status / Ações</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && imports.length === 0 ? (
                  <tr><td colSpan={3} className="py-32 text-center"><div className="flex flex-col items-center gap-4"><Loader2 className="h-12 w-12 animate-spin text-blue-500" /><span className="text-[10px] font-black uppercase tracking-widest text-slate-400 animate-pulse">Carregando triagem...</span></div></td></tr>
                ) : imports.length === 0 ? (
                  <tr><td colSpan={3} className="py-32 text-center"><div className="flex flex-col items-center gap-4 opacity-20"><Search className="h-20 w-20 text-slate-400" /><p className="text-lg font-black uppercase tracking-widest text-slate-500">Nenhum registro encontrado</p></div></td></tr>
                ) : imports.map((item, idx) => {
                  const isConfirmed = item.status === 'confirmed'
                  return (
                    <tr key={idx} className={`bg-white group rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all border-2 border-transparent ${isConfirmed ? 'bg-emerald-50/20 border-emerald-100 hover:border-emerald-200' : 'hover:border-blue-100'}`}>
                      <td className="px-8 py-8 rounded-l-[2rem]">
                        <div className="flex items-center gap-5">
                          <div className={`h-14 w-14 rounded-[1.2rem] flex items-center justify-center font-black text-xl transition-all ${isConfirmed ? 'bg-emerald-600 text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600'}`}>
                             {item.patient_name.charAt(0)}
                          </div>
                          <div>
                             <p className="text-base font-black text-slate-800 uppercase leading-none">{item.patient_name}</p>
                             <p className="text-[10px] font-black text-slate-400 mt-2 flex items-center gap-2 uppercase italic tracking-tighter">SUS: {item.cns}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-8">
                         <div className="flex flex-wrap gap-2">
                            {item.procedures.map((p: string, pi: number) => (
                               <span key={pi} className="text-[9px] font-black text-slate-500 bg-slate-50/80 px-3 py-1.5 rounded-xl border border-slate-100 max-w-[250px] truncate uppercase group-hover:bg-white transition-colors">{p}</span>
                            ))}
                         </div>
                      </td>
                      <td className="px-8 py-8 rounded-r-[2rem]">
                        <div className="flex items-center justify-end gap-3">
                           {isConfirmed ? (
                              <div className="flex items-center gap-3">
                                <Button 
                                  onClick={() => handlePrintLabel(item)}
                                  className="h-11 px-6 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 font-black text-[10px] uppercase tracking-widest gap-2 shadow-lg shadow-emerald-500/10"
                                >
                                  <Globe className="h-4 w-4" /> Imprimir Ficha
                                </Button>
                                <Button 
                                  onClick={() => handleUnconfirm(item)}
                                  className="h-11 px-6 rounded-xl bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-500 font-black text-[10px] uppercase tracking-widest gap-2 border border-slate-200"
                                >
                                  <Undo2 className="h-4 w-4" /> Desagendar
                                </Button>
                              </div>
                           ) : (
                              <Button 
                                onClick={() => handleDirectSchedule(item)}
                                disabled={processingId === item.cns}
                                className="h-14 px-8 rounded-2xl bg-blue-600 hover:bg-black text-white font-black text-[10px] uppercase tracking-widest gap-3 shadow-xl shadow-blue-500/10 transition-all hover:-translate-y-1"
                              >
                                {processingId === item.cns ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />} Agendar Agora
                              </Button>
                           )}
                           {!isConfirmed && (
                             <Button variant="ghost" onClick={() => handleDelete(item.ids)} className="h-14 w-14 rounded-2xl text-slate-300 hover:bg-red-50 hover:text-red-500 transition-all">
                                <Trash2 className="h-5 w-5" />
                             </Button>
                           )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}


