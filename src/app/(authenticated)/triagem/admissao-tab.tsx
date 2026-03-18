"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { searchMasterPatients, type MasterPatient } from "@/lib/patient-search"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Search, Save, User, FileText, Printer, CheckCircle2, ChevronRight, Hash, X } from "lucide-react"
import { differenceInYears, parseISO } from "date-fns"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"

function getSupabase() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}

type YesNo = "nao" | "sim" | null

interface BooleanField {
  checked: YesNo
  details: string
  details2?: string // for extra fields like local/dispositivo
  date?: string
}

const emptyField = (): BooleanField => ({ checked: null, details: "" })

export default function AdmissaoEnfermagemTab() {
  const [isSaving, setIsSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<MasterPatient[]>([])
  const [showPatientResults, setShowPatientResults] = useState(false)
  const formRef = useRef<HTMLDivElement>(null)

  const [formData, setFormData] = useState({
    patient_id: null as number | null,
    patient_name: "",
    social_name: "",
    prontuario: "",
    sexo: "",
    data_nascimento: "",
    idade: "",
    diagnostico_medico: "",
    hora_admissao: "",
    peso: "",
    altura: "",
    jejum_status: "nao_se_aplica", // sim, nao, nao_se_aplica
    jejum_inicio: "",

    // Antecedentes Pessoais
    comorbidades: {
      hipertensao: emptyField(),
      diabetes: emptyField(),
      doenca_renal: emptyField(),
      dialitico: emptyField(),
      cardiopata: emptyField(),
      doenca_respiratoria: emptyField(),
      doenca_hepatica: emptyField(),
      convulsoes: emptyField(),
      cancer: emptyField(),
      cateterismo: emptyField(), // details = Tempo?
      cirurgias: emptyField(), // details = Qual?
      alergias: emptyField(), // details = A que?
      outras: emptyField(),
    },

    // Medicações de Uso Contínuo
    medicacoes_continuas: {
      anticoagulantes: emptyField(),
      outros: emptyField(),
    },

    // Histórico Familiar
    historico_familiar: {
      hipertensao: emptyField(),
      diabetes: emptyField(),
      cardiopatia: emptyField(),
      cancer: emptyField(),
      outras: emptyField(),
    },

    // Hábitos de Vida
    habitos_vida: {
      tabagista: emptyField(),
      etilista: emptyField(),
      drogas: emptyField(),
    },

    // Dispositivos
    dispositivos: {
      puncao_venosa: { checked: null, date: "", details: "", details2: "" } as BooleanField, // details: Local, details2: Dispositivo
      sonda_vesical: emptyField(),
      sonda_gastrica: emptyField(),
      outros: emptyField(),
    },

    // Sinais Vitais / Exame Físico
    sinais_vitais: {
      pa: "",
      fc: "",
      fr: "",
      tax: "",
      gli: "",
      spo2: "",
    }
  })

  useEffect(() => {
    const fetchResults = async () => {
      if (searchTerm.length < 3) {
        setSearchResults([])
        return
      }
      try {
        const results = await searchMasterPatients(searchTerm)
        setSearchResults(results)
      } catch (e) {}
    }
    const t = setTimeout(fetchResults, 300)
    return () => clearTimeout(t)
  }, [searchTerm])

  // Calculate age automatically when data_nascimento changes
  useEffect(() => {
    if (formData.data_nascimento) {
      try {
        const age = differenceInYears(new Date(), parseISO(formData.data_nascimento))
        if (!isNaN(age)) {
          setFormData(prev => ({ ...prev, idade: age.toString() }))
        }
      } catch (e) {}
    }
  }, [formData.data_nascimento])

  const handleSelectPatient = (p: MasterPatient) => {
    let sexo = "Masculino"
    if (p.sexo) {
      sexo = p.sexo.toLowerCase().startsWith('m') ? "Masculino" : "Feminino"
    }
    
    setFormData(prev => ({
      ...prev,
      patient_id: p.id as any,
      patient_name: p.full_name,
      social_name: p.nome_social || "",
      prontuario: p.prontuario || "",
      data_nascimento: p.data_nascimento || "",
      sexo: sexo,
    }))
    setSearchTerm(p.full_name)
    setShowPatientResults(false)
  }

  const updateField = (category: keyof typeof formData, item: string, fieldType: keyof BooleanField, value: any) => {
    setFormData(prev => ({
      ...prev,
      [category]: {
        ...(prev[category] as any),
        [item]: {
          ...(prev[category] as any)[item],
          [fieldType]: value
        }
      }
    }))
  }

  const updateVital = (vital: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      sinais_vitais: {
        ...prev.sinais_vitais,
        [vital]: value
      }
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    
    try {
      const supabase = getSupabase()
      
      const admissionData = {
        patient_id: formData.patient_id,
        patient_name: formData.patient_name,
        social_name: formData.social_name,
        prontuario: formData.prontuario,
        sexo: formData.sexo,
        data_nascimento: formData.data_nascimento || null,
        diagnostico_medico: formData.diagnostico_medico,
        hora_admissao: formData.hora_admissao || null,
        jejum_status: formData.jejum_status,
        jejum_inicio: formData.jejum_inicio || null,
        peso: formData.peso ? parseFloat(formData.peso) : null,
        altura: formData.altura ? parseFloat(formData.altura) : null,
        comorbidades: formData.comorbidades,
        medicacoes_continuas: formData.medicacoes_continuas,
        historico_familiar: formData.historico_familiar,
        habitos_vida: formData.habitos_vida,
        dispositivos: formData.dispositivos,
        sinais_vitais: formData.sinais_vitais,
        created_by: "Sistema" // Adjust this if you have user context
      }

      const { error } = await supabase.from('nursing_admissions').insert([admissionData])
      
      if (error) throw error
      
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      alert("Erro ao salvar: " + err.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handlePrint = async () => {
    if (!formRef.current) return
    window.print() // Best for high quality
  }

  const handleGeneratePDF = async () => {
    if (!formRef.current) return
    setIsSaving(true)
    try {
      // Temporarily add a class to format for PDF rendering without screen max-heights
      formRef.current.classList.add('pdf-rendering')
      const canvas = await html2canvas(formRef.current, { scale: 2, useCORS: true })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
      pdf.save(`Admissao_Enfermagem_${formData.patient_name}.pdf`)
    } finally {
      formRef.current?.classList.remove('pdf-rendering')
      setIsSaving(false)
    }
  }

  // Helper renderer for table rows
  const renderRow = (
    title: string, 
    category: "comorbidades"|"medicacoes_continuas"|"historico_familiar"|"habitos_vida"|"dispositivos", 
    itemKey: string,
    detailsLabel: string = "Qual?",
    extraFields?: boolean
  ) => {
    const data = (formData as any)[category][itemKey]
    
    return (
      <tr className="border-b border-border/50 group hover:bg-slate-50 transition-colors">
        <td className="p-2 py-3 align-middle text-sm font-bold text-slate-700">{title}</td>
        <td className="p-2 py-3 text-center align-middle">
          <label className="flex items-center justify-center cursor-pointer">
            <input 
              type="radio" 
              name={`${category}_${itemKey}`} 
              className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer" 
              checked={data.checked === 'nao'} 
              onChange={() => updateField(category, itemKey, 'checked', 'nao')}
            />
          </label>
        </td>
        <td className="p-2 py-3 text-center align-middle border-r border-border/50">
          <label className="flex items-center justify-center cursor-pointer">
            <input 
              type="radio" 
              name={`${category}_${itemKey}`} 
              className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              checked={data.checked === 'sim'} 
              onChange={() => updateField(category, itemKey, 'checked', 'sim')}
            />
          </label>
        </td>
        <td className="p-2 py-3 align-middle">
          {category === "dispositivos" && itemKey === "puncao_venosa" ? (
             <div className="flex gap-2">
               <input 
                 type="date" 
                 placeholder="Data:" 
                 className="flex-1 min-w-0 h-8 px-2 text-xs border rounded bg-transparent"
                 value={data.date || ""}
                 onChange={(e) => updateField(category, itemKey, 'date', e.target.value)}
                 disabled={data.checked !== 'sim'}
               />
               <input 
                 type="text" 
                 placeholder="Local:" 
                 className="flex-1 min-w-0 h-8 px-2 text-xs border rounded bg-transparent"
                 value={data.details || ""}
                 onChange={(e) => updateField(category, itemKey, 'details', e.target.value)}
                 disabled={data.checked !== 'sim'}
               />
               <input 
                 type="text" 
                 placeholder="Dispositivo:" 
                 className="flex-1 min-w-0 h-8 px-2 text-xs border rounded bg-transparent"
                 value={data.details2 || ""}
                 onChange={(e) => updateField(category, itemKey, 'details2', e.target.value)}
                 disabled={data.checked !== 'sim'}
               />
             </div>
          ) : category === "dispositivos" ? (
             <div className="flex gap-2">
               <input 
                 type="date" 
                 placeholder="Data:" 
                 className="w-1/3 h-8 px-2 text-xs border rounded bg-transparent"
                 value={data.date || ""}
                 onChange={(e) => updateField(category, itemKey, 'date', e.target.value)}
                 disabled={data.checked !== 'sim'}
               />
               <input 
                 type="text" 
                 placeholder="Observações:" 
                 className="flex-1 h-8 px-2 text-xs border rounded bg-transparent"
                 value={data.details || ""}
                 onChange={(e) => updateField(category, itemKey, 'details', e.target.value)}
                 disabled={data.checked !== 'sim'}
               />
             </div>
          ) : (
            <input 
              type="text" 
              placeholder={detailsLabel} 
              className="w-full h-8 px-3 text-sm bg-transparent border-b border-dashed border-slate-300 focus:border-emerald-500 focus:outline-none focus:bg-white transition-colors"
              value={data.details}
              onChange={(e) => updateField(category, itemKey, 'details', e.target.value)}
              disabled={data.checked !== 'sim'}
            />
          )}
        </td>
      </tr>
    )
  }

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 pb-20">
      
      {/* Search Header (Not Printed) */}
      <div className="bg-white rounded-[2rem] p-6 shadow-xl border border-slate-100 flex flex-col md:flex-row gap-6 print:hidden">
        <div className="flex-1 relative space-y-2">
          <label className="text-xs font-black uppercase text-slate-500 ml-1 tracking-wider">Localizar Paciente</label>
          <div className="relative group">
            <Input 
              placeholder="Digite NOME, CPF ou SUS..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setShowPatientResults(true)
                if(e.target.value !== formData.patient_name) setFormData(prev => ({...prev, patient_id: null}))
              }}
              onFocus={() => setShowPatientResults(true)}
              className="h-14 pl-12 rounded-[1.5rem] bg-slate-50 border-none font-bold focus:ring-emerald-500/20 shadow-inner"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 h-5 w-5" />
            
            {showPatientResults && searchResults.length > 0 && (
              <div className="absolute z-50 w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                <div className="max-h-60 overflow-y-auto">
                  {searchResults.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelectPatient(p)}
                      className="w-full flex items-center justify-between p-4 hover:bg-emerald-50 text-left border-b border-slate-50 last:border-0 group transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-600 flex justify-center items-center font-black">
                          {p.full_name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-black text-slate-800 uppercase text-sm leading-tight">{p.full_name}</p>
                          <p className="text-[10px] text-slate-400 font-bold mt-1">CPF: {p.cpf || "S/N"} • SUS: {p.sus || "S/N"}</p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-emerald-300 group-hover:text-emerald-600" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-end gap-3 shrink-0">
          <Button 
            onClick={handleGeneratePDF}
            variant="outline" 
            className="h-14 rounded-[1.5rem] font-black uppercase tracking-widest text-xs border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:text-indigo-800 px-6"
          >
            <FileText className="h-4 w-4 mr-2" /> 
            Baixar PDF
          </Button>
          <Button 
            onClick={handlePrint}
            variant="outline" 
            className="h-14 rounded-[1.5rem] font-black uppercase tracking-widest text-xs border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-800 px-6"
          >
            <Printer className="h-4 w-4 mr-2" /> 
            Imprimir
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSaving || success || !formData.patient_name}
            className="h-14 rounded-[1.5rem] font-black uppercase tracking-widest text-xs bg-emerald-500 hover:bg-emerald-600 shadow-xl shadow-emerald-500/30 px-8 disabled:opacity-50 transition-all"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : 
             success ? <CheckCircle2 className="h-4 w-4 mr-2" /> : 
             <Save className="h-4 w-4 mr-2" />}
            {success ? "Salvo" : "Registrar"}
          </Button>
        </div>
      </div>

      {/* --- FORMULÁRIO PRINCIPAL PARA PRINT & PDF --- */}
      <div 
        ref={formRef} 
        className="bg-white p-10 md:p-14 rounded-[3rem] shadow-xl border border-slate-200 max-w-5xl mx-auto print:p-0 print:shadow-none print:border-none print:m-0 print:block"
        style={{ fontFamily: 'Arial, sans-serif' }}
      >
        {/* Header Ficha */}
        <div className="flex items-center justify-between border-b-2 border-slate-800 pb-4 mb-6">
          <div className="flex-1">
            <h1 className="text-2xl font-black uppercase tracking-wider text-slate-800 text-center">Admissão de Enfermagem</h1>
          </div>
        </div>

        {/* Section 1: Dados do Paciente */}
        <div className="bg-slate-100 font-bold uppercase text-center text-xs tracking-widest py-1 border border-slate-400 mb-0.5">Dados do Paciente</div>
        <div className="grid grid-cols-12 gap-0 border border-slate-400 mb-6 text-[11px] leading-tight">
          
          <div className="col-span-8 border-b border-r border-slate-400 p-1 flex items-center">
            <span className="font-bold mr-2 whitespace-nowrap">NOME:</span>
            <input type="text" className="w-full bg-transparent focus:outline-none uppercase font-semibold" value={formData.patient_name} onChange={e => setFormData({...formData, patient_name: e.target.value.toUpperCase()})} />
          </div>
          <div className="col-span-4 border-b border-slate-400 p-1 flex items-center">
             <span className="font-bold mr-2 whitespace-nowrap">Nº PRONTUÁRIO:</span>
             <input type="text" className="w-full bg-transparent focus:outline-none uppercase font-semibold" value={formData.prontuario} onChange={e => setFormData({...formData, prontuario: e.target.value})} />
          </div>

          <div className="col-span-8 border-b border-r border-slate-400 p-1 flex items-center">
            <span className="font-bold mr-2 whitespace-nowrap">NOME SOCIAL:</span>
            <input type="text" className="w-full bg-transparent focus:outline-none uppercase font-semibold" value={formData.social_name} onChange={e => setFormData({...formData, social_name: e.target.value.toUpperCase()})} />
          </div>
          <div className="col-span-4 border-b border-slate-400 p-1 flex items-center">
             <span className="font-bold mr-2 whitespace-nowrap">HORA DA ADMISSÃO:</span>
             <input type="time" className="w-full bg-transparent focus:outline-none uppercase font-semibold" value={formData.hora_admissao} onChange={e => setFormData({...formData, hora_admissao: e.target.value})} />
          </div>

          <div className="col-span-12 md:col-span-4 border-b border-r border-slate-400 p-1 flex items-center">
            <span className="font-bold mr-2 whitespace-nowrap">SEXO:</span>
            <input type="text" className="w-full bg-transparent focus:outline-none uppercase font-semibold" value={formData.sexo} onChange={e => setFormData({...formData, sexo: e.target.value})} />
          </div>
          <div className="col-span-12 md:col-span-4 border-b border-r border-slate-400 p-1 flex items-center">
             <span className="font-bold mr-2 whitespace-nowrap">DATA DE NASCIMENTO:</span>
             <input type="date" className="w-full bg-transparent focus:outline-none uppercase font-semibold" value={formData.data_nascimento} onChange={e => setFormData({...formData, data_nascimento: e.target.value})} />
          </div>
          <div className="col-span-12 md:col-span-4 border-b border-slate-400 p-1 flex items-center">
             <span className="font-bold mr-2 whitespace-nowrap">IDADE:</span>
             <input type="text" className="w-full bg-transparent focus:outline-none uppercase font-semibold" value={formData.idade} readOnly placeholder="Aut." />
          </div>

          <div className="col-span-12 border-b border-slate-400 p-1 flex items-center">
             <span className="font-bold mr-2 whitespace-nowrap">DIAGNÓSTICO MÉDICO:</span>
             <input type="text" className="w-full bg-transparent focus:outline-none uppercase font-semibold" value={formData.diagnostico_medico} onChange={e => setFormData({...formData, diagnostico_medico: e.target.value.toUpperCase()})} />
          </div>

          <div className="col-span-8 border-r border-slate-400 p-1 py-1.5 flex items-center gap-4 flex-wrap">
             <span className="font-bold whitespace-nowrap">JEJUM:</span>
             <label className="flex items-center gap-1 cursor-pointer">
               <input type="radio" value="sim" checked={formData.jejum_status === 'sim'} onChange={e => setFormData({...formData, jejum_status: e.target.value})} />
               <span>SIM A PARTIR DE</span>
             </label>
             <input type="time" className="w-20 bg-transparent border-b border-dashed border-slate-400 focus:outline-none uppercase text-center" value={formData.jejum_inicio} onChange={e => setFormData({...formData, jejum_inicio: e.target.value})} disabled={formData.jejum_status !== 'sim'} />
             <span>H</span>
             
             <label className="flex items-center gap-1 cursor-pointer ml-2">
               <input type="radio" value="nao" checked={formData.jejum_status === 'nao'} onChange={e => setFormData({...formData, jejum_status: e.target.value})} />
               <span>NÃO</span>
             </label>

             <label className="flex items-center gap-1 cursor-pointer ml-2">
               <input type="radio" value="nao_se_aplica" checked={formData.jejum_status === 'nao_se_aplica'} onChange={e => setFormData({...formData, jejum_status: e.target.value})} />
               <span>NÃO SE APLICA</span>
             </label>
          </div>
          
          <div className="col-span-4 flex items-center">
            <div className="w-1/2 h-full border-r border-slate-400 p-1 flex items-center">
               <span className="font-bold mr-2">PESO:</span>
               <input type="number" step="0.1" className="w-full bg-transparent focus:outline-none" value={formData.peso} onChange={e => setFormData({...formData, peso: e.target.value})} placeholder="kg" />
            </div>
            <div className="w-1/2 h-full p-1 flex items-center">
               <span className="font-bold mr-2">ALTURA:</span>
               <input type="number" step="0.01" className="w-full bg-transparent focus:outline-none" value={formData.altura} onChange={e => setFormData({...formData, altura: e.target.value})} placeholder="m" />
            </div>
          </div>
        </div>

        {/* Generic Table Layout */}
        <div className="w-full text-slate-800">
          
          {/* ANTECEDENTES PESSOAIS */}
          <div className="bg-slate-100 font-bold uppercase text-center text-xs tracking-widest py-1 border border-b-0 border-slate-400">Antecedentes Pessoais</div>
          <table className="w-full border-collapse border border-slate-400 mb-6 text-[11px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-400">
                <th className="p-1.5 text-left border-r border-slate-400 w-[35%]">COMORBIDADES</th>
                <th className="p-1.5 text-center border-r border-slate-400 w-[10%]">NÃO</th>
                <th className="p-1.5 text-center border-r border-slate-400 w-[10%]">SIM</th>
                <th className="p-1.5 text-left w-[45%]">MEDICAÇÃO EM USO</th>
              </tr>
            </thead>
            <tbody>
              {renderRow("Hipertensão", "comorbidades", "hipertensao")}
              {renderRow("Diabetes", "comorbidades", "diabetes")}
              {renderRow("Doença renal", "comorbidades", "doenca_renal")}
              {renderRow("Dialítico", "comorbidades", "dialitico")}
              {renderRow("Cardiopata", "comorbidades", "cardiopata")}
              {renderRow("Doença respiratória crônica", "comorbidades", "doenca_respiratoria")}
              {renderRow("Doença hepática crônica", "comorbidades", "doenca_hepatica")}
              {renderRow("Convulsões", "comorbidades", "convulsoes")}
              {renderRow("Câncer", "comorbidades", "cancer")}
              {renderRow("Cateterismo prévio", "comorbidades", "cateterismo", "Tempo?")}
              {renderRow("Cirurgias", "comorbidades", "cirurgias", "Qual?")}
              {renderRow("Alergias", "comorbidades", "alergias", "A que?")}
              {renderRow("Outras:", "comorbidades", "outras", "Qual?")}
            </tbody>
          </table>

          {/* MEDICAÇÕES DE USO CONTÍNUO */}
          <div className="bg-slate-100 font-bold uppercase text-center text-xs tracking-widest py-1 border border-b-0 border-slate-400">Medicações de Uso Contínuo</div>
          <table className="w-full border-collapse border border-slate-400 mb-6 text-[11px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-400">
                <th className="p-1.5 text-left border-r border-slate-400 w-[35%]">MEDICAMENTOS</th>
                <th className="p-1.5 text-center border-r border-slate-400 w-[10%]">NÃO</th>
                <th className="p-1.5 text-center border-r border-slate-400 w-[10%]">SIM</th>
                <th className="p-1.5 text-left w-[45%]">QUAL?</th>
              </tr>
            </thead>
            <tbody>
              {renderRow("Anticoagulantes", "medicacoes_continuas", "anticoagulantes")}
              {renderRow("Outros:", "medicacoes_continuas", "outros")}
            </tbody>
          </table>

          {/* HISTÓRICO FAMILIAR */}
          <div className="bg-slate-100 font-bold uppercase text-center text-xs tracking-widest py-1 border border-b-0 border-slate-400">Histórico Familiar</div>
          <table className="w-full border-collapse border border-slate-400 mb-6 text-[11px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-400">
                <th className="p-1.5 text-left border-r border-slate-400 w-[35%]">COMORBIDADES</th>
                <th className="p-1.5 text-center border-r border-slate-400 w-[10%]">NÃO</th>
                <th className="p-1.5 text-center border-r border-slate-400 w-[10%]">SIM</th>
                <th className="p-1.5 text-left w-[45%]">QUEM NA FAMÍLIA APRESENTA A DOENÇA?</th>
              </tr>
            </thead>
            <tbody>
              {renderRow("Hipertensão", "historico_familiar", "hipertensao")}
              {renderRow("Diabetes", "historico_familiar", "diabetes")}
              {renderRow("Cardiopatia", "historico_familiar", "cardiopatia")}
              {renderRow("Câncer", "historico_familiar", "cancer")}
              {renderRow("Outras:", "historico_familiar", "outras")}
            </tbody>
          </table>

          {/* HÁBITOS DE VIDA */}
          <div className="bg-slate-100 font-bold uppercase text-center text-xs tracking-widest py-1 border border-b-0 border-slate-400">Hábitos de Vida</div>
          <table className="w-full border-collapse border border-slate-400 mb-6 text-[11px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-400">
                <th className="p-1.5 text-left border-r border-slate-400 w-[35%]">HÁBITO</th>
                <th className="p-1.5 text-center border-r border-slate-400 w-[10%]">NÃO</th>
                <th className="p-1.5 text-center border-r border-slate-400 w-[10%]">SIM</th>
                <th className="p-1.5 text-left w-[45%]">QUANTO TEMPO?</th>
              </tr>
            </thead>
            <tbody>
              {renderRow("Tabagista", "habitos_vida", "tabagista")}
              {renderRow("Etilista", "habitos_vida", "etilista")}
              {renderRow("Drogas ilícitas", "habitos_vida", "drogas")}
            </tbody>
          </table>

          {/* DISPOSITIVOS */}
          <div className="bg-slate-100 font-bold uppercase text-center text-xs tracking-widest py-1 border border-b-0 border-slate-400">Dispositivos</div>
          <table className="w-full border-collapse border border-slate-400 mb-6 text-[11px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-400">
                <th className="p-1.5 text-left border-r border-slate-400 w-[35%]">TIPO</th>
                <th className="p-1.5 text-center border-r border-slate-400 w-[10%]">NÃO</th>
                <th className="p-1.5 text-center border-r border-slate-400 w-[10%]">SIM</th>
                <th className="p-1.5 text-left w-[45%]">DATA / OBSERVAÇÕES</th>
              </tr>
            </thead>
            <tbody>
              {renderRow("Punção venosa", "dispositivos", "puncao_venosa", "", true)}
              {renderRow("Sonda vesical", "dispositivos", "sonda_vesical")}
              {renderRow("Sonda gástrica", "dispositivos", "sonda_gastrica")}
              {renderRow("Outros dispositivos", "dispositivos", "outros")}
            </tbody>
          </table>

          {/* EXAME FÍSICO GERAL / SINAIS VITAIS */}
          <div className="bg-slate-100 font-bold uppercase text-center text-xs tracking-widest py-1 border border-b-0 border-slate-400">Exame Físico Geral</div>
          <div className="flex border border-slate-400 text-[11px] font-bold p-1 divide-x divide-slate-400">
            <div className="flex-1 flex items-center gap-2 px-2 py-1">
              <span>SINAIS VITAIS:</span>
            </div>
            <div className="flex-1 flex items-center gap-2 px-2 py-1">
              <span>PA:</span>
              <input type="text" className="w-full bg-transparent border-b border-dashed border-slate-400 focus:outline-none" value={formData.sinais_vitais.pa} onChange={e => updateVital("pa", e.target.value)} />
            </div>
            <div className="flex-1 flex items-center gap-2 px-2 py-1">
              <span>FC:</span>
              <input type="text" className="w-full bg-transparent border-b border-dashed border-slate-400 focus:outline-none" value={formData.sinais_vitais.fc} onChange={e => updateVital("fc", e.target.value)} />
            </div>
            <div className="flex-1 flex items-center gap-2 px-2 py-1">
              <span>FR:</span>
              <input type="text" className="w-full bg-transparent border-b border-dashed border-slate-400 focus:outline-none" value={formData.sinais_vitais.fr} onChange={e => updateVital("fr", e.target.value)} />
            </div>
            <div className="flex-1 flex items-center gap-2 px-2 py-1">
              <span>TAX:</span>
              <input type="text" className="w-full bg-transparent border-b border-dashed border-slate-400 focus:outline-none" value={formData.sinais_vitais.tax} onChange={e => updateVital("tax", e.target.value)} />
            </div>
            <div className="flex-1 flex items-center gap-2 px-2 py-1">
              <span>GLI:</span>
              <input type="text" className="w-full bg-transparent border-b border-dashed border-slate-400 focus:outline-none" value={formData.sinais_vitais.gli} onChange={e => updateVital("gli", e.target.value)} />
            </div>
            <div className="flex-1 flex items-center gap-2 px-2 py-1">
              <span>SPO2:</span>
              <input type="text" className="w-full bg-transparent border-b border-dashed border-slate-400 focus:outline-none" value={formData.sinais_vitais.spo2} onChange={e => updateVital("spo2", e.target.value)} />
            </div>
          </div>
          
        </div>
      </div>
      
      {/* Required styles for printing properly */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
          }
          /* Setup everything inside formRef to be visible and positioned absolutely */
          .print\\:block, .print\\:block * {
            visibility: visible;
          }
          .print\\:block {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0 !important;
            padding: 0 !important;
          }
          /* Removes margin top of inputs padding inside table to make smaller space */
          select, input, textarea {
            border: none;
            outline: none;
            background: transparent !important;
          }
        }
      `}} />
    </div>
  )
}
