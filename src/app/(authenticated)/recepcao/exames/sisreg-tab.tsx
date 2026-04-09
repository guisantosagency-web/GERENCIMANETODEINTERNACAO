"use client"
import { useState, useEffect, useMemo } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Globe, RefreshCw, CheckCircle2, AlertCircle, User, Calendar, Search, Loader2, UserPlus, Trash2, Filter, Undo2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { format } from "date-fns"
import { useAuth } from "@/lib/auth-context"
import { upsertMasterPatient } from "@/lib/patient-search"

export default function SisregTab() {
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [imports, setImports] = useState<any[]>([])
  const [allProcedures, setAllProcedures] = useState<string[]>([])
  const [allSubTypes, setAllSubTypes] = useState<any[]>([])
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [currentPatient, setCurrentPatient] = useState<any>(null)
  const [panelExams, setPanelExams] = useState<any[]>([])
  const [panelDate, setPanelDate] = useState("")
  const [panelTime, setPanelTime] = useState("08:00")
  const [isLoading, setIsLoading] = useState(false)
  
  const { user } = useAuth()
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

  const loadImports = async () => {
    setIsLoading(true)
    try {
      const { data: configData } = await supabase.from("exam_procedures_types").select("procedure_name, exam_type_name")
      let procNames: string[] = []
      let sTypesMapped: any[] = []

      if (configData) {
        procNames = Array.from(new Set(configData.map(d => d.procedure_name)))
        setAllProcedures(procNames)
        sTypesMapped = configData.map(d => ({ name: d.exam_type_name, procedure_name: d.procedure_name }))
        setAllSubTypes(sTypesMapped)
      }

      const { data: importData } = await supabase
        .from("exam_sisreg_import")
        .select("*")
        .eq("exam_date", date)
        .order("patient_name")
      
      if (importData) {
        const grouped: Record<string, any> = {}

        importData.forEach(item => {
          const matchedProc = findBestProcedureMatch(item.procedure_name, procNames, sTypesMapped)
          if (matchedProc === "EXCLUDE") return

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

  const openSchedulingPanel = (patient: any) => {
    setCurrentPatient(patient)
    setPanelDate(patient.exam_date)
    setPanelTime("08:00")
    
    // Sugerir procedimentos baseados no SISREG
    const suggested = patient.procedures.map((sisregProc: string) => {
      const matchedProc = findBestProcedureMatch(sisregProc, allProcedures, allSubTypes)
      const suggestedSubType = allSubTypes.find(st => sisregProc.toUpperCase().includes(st.name.toUpperCase()) && st.procedure_name === matchedProc)?.name || ""
      return {
        id: Math.random().toString(36).substr(2, 9),
        procedure: matchedProc || (allProcedures[0] || ""),
        subType: suggestedSubType,
        sisregOriginal: sisregProc
      }
    })
    
    setPanelExams(suggested)
    setIsPanelOpen(true)
  }

  const addPanelExam = () => {
    setPanelExams(prev => [...prev, { 
      id: Math.random().toString(36).substr(2, 9), 
      procedure: allProcedures[0] || "", 
      subType: "",
      sisregOriginal: "Adicionado Manualmente"
    }])
  }

  const removePanelExam = (id: string) => {
    setPanelExams(prev => prev.filter(e => e.id !== id))
  }

  const updatePanelExam = (id: string, field: string, value: string) => {
    setPanelExams(prev => prev.map(e => e.id === id ? { ...e, [field]: value, ...(field === 'procedure' ? { subType: "" } : {}) } : e))
  }

  const handleFinalConfirm = async () => {
    if (panelExams.length === 0) return alert("Adicione pelo menos um procedimento.")
    if (!panelExams.every(e => e.procedure)) return alert("Preencha todos os procedimentos.")

    setIsLoading(true)
    try {
      // 1. Cadastro Mestre
      await upsertMasterPatient({
        full_name: currentPatient.patient_name.toUpperCase(),
        sus: currentPatient.cns,
        origem_cadastro: 'sisreg'
      })

      // 2. Inserir Agendamentos
      // Detalhes: Vamos concatenar os nomes originais do SISREG em um texto único para facilitar a impressão
      const sisregDetails = currentPatient.procedures.join(", ")

      const inserts = panelExams.map(exam => ({
        patient_name: currentPatient.patient_name.toUpperCase(),
        sus: currentPatient.cns,
        exam_date: panelDate,
        exam_time: panelTime,
        procedure_name: exam.procedure,
        exam_type: exam.subType || null,
        procedure_detail: sisregDetails, 
        status: 'agendado',
        receptionist_name: user?.name || "SISREG",
        chave_sisreg: "IMPORT_SISREG"
      }))

      const { error: apptError } = await supabase.from("exam_appointments").insert(inserts)
      if (apptError) throw new Error(apptError.message)

      // 3. Marcar Importação como Confirmada
      await supabase.from("exam_sisreg_import").update({ status: 'confirmed' }).in("id", currentPatient.ids)
      
      alert(`Agendamento realizado com sucesso para ${currentPatient.patient_name}!`)
      setIsPanelOpen(false)
      loadImports()
    } catch (e: any) {
      console.error(e)
      alert(`Erro: ${e.message}`)
    } finally {
      setIsLoading(false)
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
      
      {/* SIDE PANEL (SCHEDULING FORM) */}
      <div className={`fixed inset-y-0 right-0 w-[500px] bg-white shadow-2xl z-[100] transition-transform duration-500 ease-in-out transform ${isPanelOpen ? 'translate-x-0' : 'translate-x-full'} border-l border-slate-100 flex flex-col`}>
        <div className="p-8 bg-blue-600 text-white relative">
          <Button variant="ghost" size="icon" onClick={() => setIsPanelOpen(false)} className="absolute top-6 right-6 text-white/50 hover:text-white hover:bg-white/10 rounded-full">
            <X className="h-6 w-6" />
          </Button>
          <div className="h-12 w-12 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
            <UserPlus className="h-7 w-7" />
          </div>
          <h3 className="text-2xl font-black font-space uppercase tracking-tight">Ficha de Agendamento</h3>
          <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest mt-1">Refinamento SISREG: {currentPatient?.patient_name}</p>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="space-y-8">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="uppercase text-[10px] font-black tracking-widest text-slate-400 ml-2">Data do Exame</Label>
                <Input type="date" value={panelDate} onChange={e => setPanelDate(e.target.value)} className="h-12 font-bold bg-slate-50 border-none rounded-xl text-center shadow-inner" />
              </div>
              <div className="space-y-2">
                <Label className="uppercase text-[10px] font-black tracking-widest text-slate-400 ml-2">Horário</Label>
                <Input type="time" value={panelTime} onChange={e => setPanelTime(e.target.value)} className="h-12 font-bold bg-slate-50 border-none rounded-xl text-center shadow-inner" />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="uppercase text-[10px] font-black tracking-widest text-slate-400 ml-2">Procedimentos / Exames</Label>
                <Button onClick={addPanelExam} size="sm" variant="ghost" className="h-8 px-4 text-[9px] font-black bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 uppercase tracking-widest">+ Adicionar</Button>
              </div>
              
              <div className="space-y-3">
                {panelExams.map((ex, idx) => (
                  <div key={ex.id} className="p-5 bg-slate-50/50 rounded-2xl border border-slate-100 relative group animate-in zoom-in-95 duration-200">
                    <button onClick={() => removePanelExam(ex.id)} className="absolute -top-2 -right-2 h-6 w-6 bg-red-400 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                      <X className="h-3 w-3" />
                    </button>
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <Label className="uppercase text-[8px] font-black text-slate-400 ml-1">Grupo HTO</Label>
                        <select 
                          value={ex.procedure}
                          onChange={(e) => updatePanelExam(ex.id, 'procedure', e.target.value)}
                          className="w-full h-10 bg-white border border-slate-200 rounded-xl px-3 text-[10px] font-black uppercase text-blue-600 shadow-sm"
                        >
                          <option value="">Selecione...</option>
                          {allProcedures.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <Label className="uppercase text-[8px] font-black text-slate-400 ml-1">Tipo de Exame</Label>
                        <select 
                          value={ex.subType}
                          onChange={(e) => updatePanelExam(ex.id, 'subType', e.target.value)}
                          className="w-full h-10 bg-white border border-slate-200 rounded-xl px-3 text-[10px] font-black uppercase text-slate-600 shadow-sm"
                        >
                          <option value="">Escolha...</option>
                          {allSubTypes.filter(s => s.procedure_name === ex.procedure).map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                        </select>
                      </div>
                      {ex.sisregOriginal && (
                        <p className="text-[8px] font-bold text-slate-300 italic px-1 truncate">Detec: {ex.sisregOriginal}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 bg-slate-50 border-t border-slate-100">
          <Button onClick={handleFinalConfirm} disabled={isLoading} className="w-full h-16 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-blue-500/20 gap-3 group transition-all active:scale-95">
            {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : <CheckCircle2 className="h-6 w-6 group-hover:translate-x-1 transition-transform" />}
            Confirmar Agendamento HTO
          </Button>
        </div>
      </div>

      {/* OVERLAY WHEN PANEL IS OPEN */}
      {isPanelOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[90] animate-in fade-in duration-300" onClick={() => setIsPanelOpen(false)} />
      )}

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
                                <div className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-xl font-black text-[10px] uppercase flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Confirmado</div>
                                <Button 
                                  onClick={() => handleUnconfirm(item)}
                                  className="h-11 px-6 rounded-xl bg-amber-50 text-amber-600 hover:bg-amber-100 font-black text-[10px] uppercase tracking-widest gap-2 border border-amber-200"
                                >
                                  <Undo2 className="h-4 w-4" /> Desagendar
                                </Button>
                              </div>
                           ) : (
                              <Button 
                                onClick={() => openSchedulingPanel(item)}
                                className="h-14 px-8 rounded-2xl bg-blue-600 hover:bg-black text-white font-black text-[10px] uppercase tracking-widest gap-3 shadow-xl shadow-blue-500/10 transition-all hover:-translate-y-1"
                              >
                                <UserPlus className="h-4 w-4" /> Agendar Agora
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


