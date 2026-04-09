"use client"
import { useState, useEffect, useMemo } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Globe, RefreshCw, CheckCircle2, AlertCircle, User, Calendar, Search, Loader2, UserPlus, Trash2, Filter } from "lucide-react"
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
  const [rowSelections, setRowSelections] = useState<Record<string, { procedure: string, subType: string }>>({})
  const [isLoading, setIsLoading] = useState(false)
  
  const { user } = useAuth()
  const supabase = useMemo(() => createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!), [])

  // MOTOR DE BUSCA INTELIGENTE (FUZZY MATCHING)
  const findBestProcedureMatch = (sisregName: string, procedures: string[], subTypes: any[]) => {
    const normalizedSisreg = sisregName.toUpperCase()
    
    // 0. IGNORAR CONSULTAS E RETORNOS
    if (normalizedSisreg.includes("CONSULTA") || normalizedSisreg.includes("RETORNO")) return "EXCLUDE"

    // 1. Tenta busca exata ou por inclusão nos grupos (Tomografia, USG, etc.)
    const exactGroupMatch = procedures.find(p => normalizedSisreg.includes(p.toUpperCase()))
    if (exactGroupMatch) return exactGroupMatch

    // 2. Tenta busca nos Sub-Tipos cadastrados (Crânio, Tórax, etc.)
    const subTypeMatch = subTypes.find(st => normalizedSisreg.includes(st.name.toUpperCase()))
    if (subTypeMatch) return subTypeMatch.procedure_name

    // 3. Palavras-chave universais
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
      // 1. Carregar Procedimentos e Tipos do banco HTO
      const { data: configData } = await supabase
        .from("exam_procedures_types")
        .select("procedure_name, exam_type_name")
      
      let procNames: string[] = []
      let sTypesMapped: any[] = []

      if (configData) {
        // Extrair nomes únicos de procedimentos (Grupos)
        procNames = Array.from(new Set(configData.map(d => d.procedure_name)))
        setAllProcedures(procNames)

        // Mapear tipos para o formato interno
        sTypesMapped = configData.map(d => ({
          name: d.exam_type_name,
          procedure_name: d.procedure_name
        }))
        setAllSubTypes(sTypesMapped)
      }

      // 2. Carregar Importações do SISREG
      const { data: importData } = await supabase
        .from("exam_sisreg_import")
        .select("*")
        .eq("exam_date", date)
        .order("patient_name")
      
      if (importData) {
        const grouped: Record<string, any> = {}
        const initialSelections: Record<string, { procedure: string, subType: string }> = {}

        importData.forEach(item => {
          const matchedProc = findBestProcedureMatch(item.procedure_name, procNames, sTypesMapped)
          
          if (matchedProc === "EXCLUDE") return

          if (!grouped[item.cns]) {
            grouped[item.cns] = {
              ...item,
              procedures: [item.procedure_name],
              ids: [item.id]
            }
            
            // Sugestão inteligente de sub-tipo
            const suggestedSubType = sTypesMapped.find(st => 
                item.procedure_name.toUpperCase().includes(st.name.toUpperCase()) && 
                st.procedure_name === matchedProc
            )?.name || ""

            initialSelections[item.cns] = {
              procedure: matchedProc || (procNames[0] || ""),
              subType: suggestedSubType
            }
          } else {
            grouped[item.cns].procedures.push(item.procedure_name)
            grouped[item.cns].ids.push(item.id)
          }
        })

        setImports(Object.values(grouped))
        setRowSelections(initialSelections)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleConfirm = async (patient: any) => {
    const selection = rowSelections[patient.cns]
    if (!selection || !selection.procedure) {
      alert("Selecione o procedimento.")
      return
    }

    setIsLoading(true)
    try {
      // Registrar no Agendamento HTO
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
        procedure_name: selection.procedure,
        procedure_detail: selection.subType || proc, 
        status: 'agendado',
        receptionist_name: user?.name || "INTEGRAÇÃO_SISREG",
        chave_sisreg: "IMPORT_SISREG"
      }))

      await supabase.from("exam_appointments").insert(inserts)

      await supabase
        .from("exam_sisreg_import")
        .update({ status: 'confirmed' })
        .in("id", patient.ids)
      
      alert(`Paciente ${patient.patient_name} agendado!`)
      loadImports()
    } catch (e) {
      alert("Erro ao confirmar.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (ids: string[]) => {
    if(!confirm("Remover estes registros?")) return
    await supabase.from("exam_sisreg_import").delete().in("id", ids)
    loadImports()
  }

  const updateSelection = (cns: string, field: 'procedure' | 'subType', value: string) => {
    setRowSelections(prev => ({
      ...prev,
      [cns]: {
        ...prev[cns],
        [field]: value,
        ...(field === 'procedure' ? { subType: "" } : {})
      }
    }))
  }

  useEffect(() => { loadImports() }, [date])

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="glass-card !bg-white/40 border-none rounded-[2.5rem] p-8 lg:p-10 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-10">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-blue-600 text-white rounded-2xl shadow-xl shadow-blue-500/20">
              <Globe className="h-7 w-7" />
            </div>
            <div>
              <h2 className="text-3xl font-black font-space uppercase tracking-tight text-slate-800">Triagem SISREG</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Refinamento Manual de Importação</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 bg-slate-100/50 p-4 rounded-[2rem] border border-slate-200/50">
            <div className="space-y-1">
              <Label className="uppercase text-[9px] font-black tracking-widest text-slate-400 ml-2">Data do SISREG</Label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="h-12 bg-white border-none rounded-xl text-xs font-black w-44 shadow-sm" />
            </div>
            <Button onClick={loadImports} className="h-12 rounded-xl px-8 bg-slate-900 hover:bg-black text-white font-black uppercase text-[10px] tracking-widest gap-2 shadow-lg scale-100 active:scale-95 transition-all">
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} /> Sincronizar
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-separate border-spacing-y-3">
            <thead>
              <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                <th className="px-6 py-4">Paciente | CNS</th>
                <th className="px-6 py-4">Procedimento SISREG</th>
                <th className="px-6 py-4">Vincular Procedimento HTO</th>
                <th className="px-6 py-4">Tipo/Exame</th>
                <th className="px-6 py-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                   <td colSpan={5} className="py-20 text-center">
                      <div className="flex flex-col items-center gap-4 text-slate-400">
                         <Loader2 className="h-10 w-10 animate-spin" />
                         <span className="text-[10px] font-black uppercase tracking-widest">Carregando Exames...</span>
                      </div>
                   </td>
                </tr>
              ) : imports.length === 0 ? (
                <tr>
                   <td colSpan={5} className="py-20 text-center">
                      <div className="flex flex-col items-center gap-4 text-slate-400 opacity-30">
                         <Search className="h-16 w-16" />
                         <p className="text-sm font-black uppercase tracking-widest">Nenhum exame para esta data</p>
                      </div>
                   </td>
                </tr>
              ) : imports.map((item, idx) => {
                const selection = rowSelections[item.cns] || { procedure: "", subType: "" }
                const filteredSubTypes = allSubTypes.filter(s => s.procedure_name === selection.procedure)

                return (
                  <tr key={idx} className={`bg-white group rounded-[2.5rem] shadow-sm hover:shadow-md transition-all border border-transparent hover:border-blue-100 ${item.status === 'confirmed' ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
                    <td className="px-6 py-6 rounded-l-[1.5rem]">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center font-bold text-slate-400 uppercase">{item.patient_name.charAt(0)}</div>
                        <div>
                           <p className="text-[11px] font-black text-slate-800 uppercase leading-none">{item.patient_name}</p>
                           <p className="text-[9px] font-bold text-slate-400 mt-1">SUS: {item.cns}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                       <div className="flex flex-col gap-1">
                          {item.procedures.map((p: string, pi: number) => (
                             <span key={pi} className="text-[9px] font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md inline-block max-w-[200px] truncate">{p}</span>
                          ))}
                       </div>
                    </td>
                    <td className="px-6 py-6">
                       <select 
                          value={selection.procedure}
                          onChange={(e) => updateSelection(item.cns, 'procedure', e.target.value)}
                          className="w-full h-10 bg-blue-50/50 border-none rounded-xl px-4 text-[10px] font-black uppercase text-blue-600 focus:ring-2 focus:ring-blue-500/20 shadow-inner"
                       >
                          <option value="">Selecione...</option>
                          {allProcedures.map(p => <option key={p} value={p}>{p}</option>)}
                       </select>
                    </td>
                    <td className="px-6 py-6">
                       <select 
                          value={selection.subType}
                          onChange={(e) => updateSelection(item.cns, 'subType', e.target.value)}
                          className="w-full h-10 bg-slate-50 border-none rounded-xl px-4 text-[10px] font-black uppercase text-slate-500 disabled:opacity-30"
                          disabled={!selection.procedure}
                       >
                          <option value="">Escolha o Exame...</option>
                          {filteredSubTypes.map((s: any) => <option key={s.name} value={s.name}>{s.name}</option>)}
                       </select>
                    </td>
                    <td className="px-6 py-6 rounded-r-[1.5rem] text-center">
                       <div className="flex items-center justify-center gap-2">
                          <Button 
                              onClick={() => handleConfirm(item)}
                              disabled={item.status === 'confirmed' || !selection.procedure}
                              className="h-10 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-[9px] uppercase tracking-widest gap-2 shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                          >
                             {item.status === 'confirmed' ? 'Agendado' : <><UserPlus className="h-3.5 w-3.5" /> Agendar</>}
                          </Button>
                          <Button 
                              variant="ghost" 
                              onClick={() => handleDelete(item.ids)}
                              className="h-10 w-10 rounded-xl text-slate-300 hover:text-red-500 hover:bg-red-50"
                          >
                             <Trash2 className="h-4 w-4" />
                          </Button>
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
  )
}
