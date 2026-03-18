"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { searchMasterPatients, type MasterPatient } from "@/lib/patient-search"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Search, Save, User, FileText, Printer, CheckCircle2, ChevronRight, Hash, X, Activity, Droplet, Clock, CalendarDays, Key } from "lucide-react"
import { differenceInYears, parseISO } from "date-fns"
import { useAuth } from "@/lib/auth-context"
import { generateAdmissaoHtml } from "@/components/print-admissao-template"

function getSupabase() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}

type YesNo = "nao" | "sim" | null

interface BooleanField {
  checked: YesNo
  details: string
  details2?: string 
  date?: string
}

const emptyField = (): BooleanField => ({ checked: null, details: "" })

export default function AdmissaoEnfermagemTab() {
  const { logos } = useAuth()
  const [isSaving, setIsSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<MasterPatient[]>([])
  const [showPatientResults, setShowPatientResults] = useState(false)

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
    jejum_status: "nao_se_aplica", 
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
      cateterismo: emptyField(), 
      cirurgias: emptyField(), 
      alergias: emptyField(), 
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
      puncao_venosa: { checked: null, date: "", details: "", details2: "" } as BooleanField,
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
        created_by: "Sistema"
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

  const doPrintAction = () => {
    const htmlContent = generateAdmissaoHtml(formData, logos)
    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(htmlContent)
      printWindow.document.close()
      setTimeout(() => {
        printWindow.print()
      }, 500)
    }
  }

  const handlePrint = async () => {
    doPrintAction()
  }

  // Helper renderer for modern UI table rows
  const renderRow = (
    title: string, 
    category: "comorbidades"|"medicacoes_continuas"|"historico_familiar"|"habitos_vida"|"dispositivos", 
    itemKey: string,
    detailsLabel: string = "Detalhes",
    extraFields?: boolean
  ) => {
    const data = (formData as any)[category][itemKey]
    
    return (
      <div className="flex flex-col md:flex-row md:items-center gap-4 p-4 border-b border-border/40 hover:bg-slate-50/50 transition-colors">
        <div className="flex-1 md:w-1/3">
          <span className="text-sm font-bold text-slate-700">{title}</span>
        </div>
        
        <div className="flex items-center gap-4 w-32 shrink-0">
          <label className="flex flex-col items-center gap-1 cursor-pointer group">
            <div className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center transition-all ${data.checked === 'nao' ? 'border-red-500 bg-red-50 text-red-600' : 'border-slate-200 bg-white text-slate-300 group-hover:border-slate-300'}`}>
              <X className="h-5 w-5" />
            </div>
            <input 
              type="radio" 
              name={`${category}_${itemKey}`} 
              className="hidden" 
              checked={data.checked === 'nao'} 
              onChange={() => updateField(category, itemKey, 'checked', 'nao')}
            />
            <span className={`text-[10px] font-black uppercase tracking-wider ${data.checked === 'nao' ? 'text-red-600' : 'text-slate-400'}`}>Não</span>
          </label>
          
          <label className="flex flex-col items-center gap-1 cursor-pointer group">
            <div className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center transition-all ${data.checked === 'sim' ? 'border-emerald-500 bg-emerald-50 text-emerald-600' : 'border-slate-200 bg-white text-slate-300 group-hover:border-slate-300'}`}>
              <CheckCircle2 className="h-5 w-5" />
            </div>
             <input 
              type="radio" 
              name={`${category}_${itemKey}`} 
              className="hidden"
              checked={data.checked === 'sim'} 
              onChange={() => updateField(category, itemKey, 'checked', 'sim')}
            />
            <span className={`text-[10px] font-black uppercase tracking-wider ${data.checked === 'sim' ? 'text-emerald-600' : 'text-slate-400'}`}>Sim</span>
          </label>
        </div>

        <div className="flex-1 min-w-0">
          {category === "dispositivos" && itemKey === "puncao_venosa" ? (
             <div className="flex flex-col sm:flex-row gap-3">
               <Input 
                 type="date" 
                 placeholder="Data:" 
                 className={`flex-1 transition-all ${data.checked !== 'sim' ? 'opacity-30 cursor-not-allowed bg-slate-50' : 'bg-white shadow-sm focus:ring-emerald-500/20'}`}
                 value={data.date || ""}
                 onChange={(e) => updateField(category, itemKey, 'date', e.target.value)}
                 disabled={data.checked !== 'sim'}
               />
               <Input 
                 type="text" 
                 placeholder="Local:" 
                 className={`flex-1 transition-all ${data.checked !== 'sim' ? 'opacity-30 cursor-not-allowed bg-slate-50' : 'bg-white shadow-sm focus:ring-emerald-500/20'}`}
                 value={data.details || ""}
                 onChange={(e) => updateField(category, itemKey, 'details', e.target.value)}
                 disabled={data.checked !== 'sim'}
               />
               <Input 
                 type="text" 
                 placeholder="Dispositivo:" 
                 className={`flex-1 transition-all ${data.checked !== 'sim' ? 'opacity-30 cursor-not-allowed bg-slate-50' : 'bg-white shadow-sm focus:ring-emerald-500/20'}`}
                 value={data.details2 || ""}
                 onChange={(e) => updateField(category, itemKey, 'details2', e.target.value)}
                 disabled={data.checked !== 'sim'}
               />
             </div>
          ) : category === "dispositivos" ? (
             <div className="flex flex-col sm:flex-row gap-3">
               <Input 
                 type="date" 
                 placeholder="Data:" 
                 className={`sm:w-1/3 transition-all ${data.checked !== 'sim' ? 'opacity-30 cursor-not-allowed bg-slate-50' : 'bg-white shadow-sm focus:ring-emerald-500/20'}`}
                 value={data.date || ""}
                 onChange={(e) => updateField(category, itemKey, 'date', e.target.value)}
                 disabled={data.checked !== 'sim'}
               />
               <Input 
                 type="text" 
                 placeholder="Observações:" 
                 className={`flex-1 transition-all ${data.checked !== 'sim' ? 'opacity-30 cursor-not-allowed bg-slate-50' : 'bg-white shadow-sm focus:ring-emerald-500/20'}`}
                 value={data.details || ""}
                 onChange={(e) => updateField(category, itemKey, 'details', e.target.value)}
                 disabled={data.checked !== 'sim'}
               />
             </div>
          ) : (
            <Input 
              type="text" 
              placeholder={detailsLabel} 
               className={`w-full transition-all ${data.checked !== 'sim' ? 'opacity-30 cursor-not-allowed bg-slate-50' : 'bg-white shadow-sm focus:ring-emerald-500/20'}`}
              value={data.details}
              onChange={(e) => updateField(category, itemKey, 'details', e.target.value)}
              disabled={data.checked !== 'sim'}
            />
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 pb-24">
      
      {/* Search & Actions Header */}
      <div className="sticky top-4 z-40 bg-white/80 backdrop-blur-xl rounded-[2rem] p-4 shadow-xl border border-slate-100/50 flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex-1 relative">
          <div className="relative group">
            <Input 
              placeholder="Localizar paciente (Nome, CPF ou SUS)..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setShowPatientResults(true)
                if(e.target.value !== formData.patient_name) setFormData(prev => ({...prev, patient_id: null}))
              }}
              onFocus={() => setShowPatientResults(true)}
              className="h-14 pl-12 rounded-[1.5rem] bg-slate-50 border-transparent font-bold focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-inner text-sm"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 h-5 w-5" />
            
            {showPatientResults && searchResults.length > 0 && (
              <div className="absolute z-50 w-full mt-2 bg-white border border-slate-100 rounded-[1.5rem] shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                <div className="max-h-60 overflow-y-auto p-2">
                  {searchResults.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelectPatient(p)}
                      className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-emerald-50 text-left group transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-[1rem] bg-emerald-100 text-emerald-600 flex justify-center items-center font-black">
                          {p.full_name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-black text-slate-800 uppercase text-xs leading-tight">{p.full_name}</p>
                          <p className="text-[10px] text-slate-400 font-bold mt-1 tracking-wider">CPF: {p.cpf || "S/N"} • SUS: {p.sus || "S/N"}</p>
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
        
        <div className="flex items-center gap-3 shrink-0">
          <Button 
            onClick={doPrintAction}
            variant="outline" 
            className="h-14 rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-300 px-6 transition-all"
          >
            <Printer className="h-4 w-4 md:mr-2" /> 
            <span className="hidden md:inline">Imprimir / PDF</span>
          </Button>

          <Button 
            onClick={handleSubmit} 
            disabled={isSaving || success || !formData.patient_name}
            className="h-14 rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] bg-emerald-500 hover:bg-emerald-600 shadow-xl shadow-emerald-500/30 px-8 disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            {isSaving ? <Activity className="h-4 w-4 animate-spin md:mr-2" /> : 
             success ? <CheckCircle2 className="h-4 w-4 md:mr-2" /> : 
             <Save className="h-4 w-4 md:mr-2" />}
            <span className="hidden md:inline">{success ? "Salvo com sucesso" : "Registrar Admissão"}</span>
            <span className="md:hidden">{success ? "Salvo" : "Salvar"}</span>
          </Button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto space-y-8">
        {/* Identificação Card */}
        <Card className="rounded-[2rem] border-slate-100 shadow-lg overflow-hidden glass-card">
          <div className="bg-slate-50/80 px-8 py-5 border-b border-border/40 flex items-center gap-3">
             <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600">
               <User className="h-5 w-5" />
             </div>
             <div>
               <h3 className="font-space font-bold tracking-tight text-lg text-slate-800">Identificação do Paciente</h3>
               <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Dados cadastrais gerais</p>
             </div>
          </div>
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2 col-span-1 md:col-span-2 text-sm font-semibold">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider ml-1">Nome Completo</label>
                <Input value={formData.patient_name} onChange={e => setFormData({...formData, patient_name: e.target.value.toUpperCase()})} className="bg-slate-50 border-none font-bold uppercase shadow-inner h-12 rounded-xl focus:bg-white" />
              </div>
              <div className="space-y-2 text-sm font-semibold">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider ml-1">Prontuário</label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input value={formData.prontuario} onChange={e => setFormData({...formData, prontuario: e.target.value})} className="pl-9 bg-slate-50 border-none font-bold shadow-inner h-12 rounded-xl focus:bg-white" />
                </div>
              </div>
              <div className="space-y-2 col-span-1 md:col-span-2 text-sm font-semibold">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider ml-1">Nome Social</label>
                <Input value={formData.social_name} onChange={e => setFormData({...formData, social_name: e.target.value.toUpperCase()})} className="bg-slate-50 border-none font-bold uppercase shadow-inner h-12 rounded-xl focus:bg-white" />
              </div>
               <div className="space-y-2 text-sm font-semibold">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider ml-1">Sexo</label>
                <Input value={formData.sexo} onChange={e => setFormData({...formData, sexo: e.target.value.toUpperCase()})} className="bg-slate-50 border-none font-bold uppercase shadow-inner h-12 rounded-xl focus:bg-white" />
              </div>
               <div className="space-y-2 text-sm font-semibold">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider ml-1">Data Nascimento</label>
                 <div className="relative">
                  <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input type="date" value={formData.data_nascimento} onChange={e => setFormData({...formData, data_nascimento: e.target.value})} className="pl-9 bg-slate-50 border-none font-bold shadow-inner h-12 rounded-xl focus:bg-white text-slate-600" />
                </div>
              </div>
               <div className="space-y-2 text-sm font-semibold">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider ml-1">Idade Automática</label>
                <div className="relative">
                  <Input value={formData.idade ? \`\${formData.idade} anos\` : ""} readOnly placeholder="--" className="bg-slate-100 border-none font-black shadow-none h-12 rounded-xl text-slate-600 cursor-not-allowed" />
                </div>
              </div>
               <div className="space-y-2 text-sm font-semibold">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider ml-1">Hora da Admissão</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input type="time" value={formData.hora_admissao} onChange={e => setFormData({...formData, hora_admissao: e.target.value})} className="pl-9 bg-slate-50 border-none font-bold shadow-inner h-12 rounded-xl focus:bg-white text-slate-600" />
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-border/40 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2 col-span-1 md:col-span-2 text-sm font-semibold">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider ml-1 text-red-500">Diagnóstico Médico</label>
                <Input value={formData.diagnostico_medico} onChange={e => setFormData({...formData, diagnostico_medico: e.target.value.toUpperCase()})} placeholder="Motivo da internação" className="bg-red-50/50 border-red-100 text-red-900 font-bold uppercase shadow-inner h-12 rounded-xl focus:bg-red-50 focus:ring-red-500/20" />
              </div>
              <div className="space-y-2 text-sm font-semibold">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider ml-1">Peso Estimado</label>
                <div className="relative">
                  <Input type="number" step="0.1" placeholder="Ex: 75.5" value={formData.peso} onChange={e => setFormData({...formData, peso: e.target.value})} className="bg-slate-50 border-none font-bold shadow-inner h-12 rounded-xl focus:bg-white pr-10" />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase">Kg</span>
                </div>
              </div>
              <div className="space-y-2 text-sm font-semibold">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider ml-1">Altura</label>
                <div className="relative">
                  <Input type="number" step="0.01" placeholder="Ex: 1.75" value={formData.altura} onChange={e => setFormData({...formData, altura: e.target.value})} className="bg-slate-50 border-none font-bold shadow-inner h-12 rounded-xl focus:bg-white pr-10" />
                   <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase">M</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-border/40">
               <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider ml-1 mb-3 block">Estado de Jejum</label>
               <div className="flex flex-wrap items-center gap-4 bg-slate-50 p-4 rounded-2xl shadow-inner">
                 <label className="flex items-center gap-2 cursor-pointer group">
                    <div className={\`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all \${formData.jejum_status === 'sim' ? 'border-amber-500 bg-amber-50 border-[6px]' : 'border-slate-300 bg-white group-hover:border-slate-400'}\`} />
                    <input type="radio" value="sim" className="hidden" checked={formData.jejum_status === 'sim'} onChange={e => setFormData({...formData, jejum_status: e.target.value})} />
                    <span className="text-sm font-bold text-slate-600">Sim, a partir das:</span>
                  </label>
                  <Input type="time" className="w-32 h-10 bg-white shadow-sm border-none font-bold rounded-xl" value={formData.jejum_inicio} onChange={e => setFormData({...formData, jejum_inicio: e.target.value})} disabled={formData.jejum_status !== 'sim'} />
                  <span className="text-xs font-bold text-slate-400 uppercase mr-4">Horas</span>

                  <label className="flex items-center gap-2 cursor-pointer group mr-4">
                    <div className={\`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all \${formData.jejum_status === 'nao' ? 'border-emerald-500 bg-emerald-50 border-[6px]' : 'border-slate-300 bg-white group-hover:border-slate-400'}\`} />
                    <input type="radio" value="nao" className="hidden" checked={formData.jejum_status === 'nao'} onChange={e => setFormData({...formData, jejum_status: e.target.value})} />
                    <span className="text-sm font-bold text-slate-600">Alimentado (Não)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer group">
                    <div className={\`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all \${formData.jejum_status === 'nao_se_aplica' ? 'border-slate-500 bg-slate-100 border-[6px]' : 'border-slate-300 bg-white group-hover:border-slate-400'}\`} />
                    <input type="radio" value="nao_se_aplica" className="hidden" checked={formData.jejum_status === 'nao_se_aplica'} onChange={e => setFormData({...formData, jejum_status: e.target.value})} />
                    <span className="text-sm font-bold text-slate-600">Não se aplica</span>
                  </label>
               </div>
            </div>
          </CardContent>
        </Card>

        {/* Antecedentes Pessoais (Comorbidades) */}
        <Card className="rounded-[2rem] border-slate-100 shadow-lg overflow-hidden glass-card">
          <div className="bg-red-50/50 px-8 py-5 border-b border-red-100/50 flex items-center gap-3">
             <div className="p-2 rounded-xl bg-red-500/10 text-red-600">
               <Activity className="h-5 w-5" />
             </div>
             <div>
               <h3 className="font-space font-bold tracking-tight text-lg text-slate-800">Antecedentes Pessoais</h3>
               <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Comorbidades e histórico de saúde</p>
             </div>
          </div>
          <div className="flex flex-col">
            {renderRow("Hipertensão", "comorbidades", "hipertensao", "Medicação em uso")}
            {renderRow("Diabetes", "comorbidades", "diabetes", "Medicação em uso")}
            {renderRow("Doença renal", "comorbidades", "doenca_renal", "Medicação em uso")}
            {renderRow("Dialítico", "comorbidades", "dialitico", "Onde / Desde quando?")}
            {renderRow("Cardiopata", "comorbidades", "cardiopata", "Medicação em uso")}
            {renderRow("Respiratória crônica", "comorbidades", "doenca_respiratoria", "Qual doença/remédios?")}
            {renderRow("Hepática crônica", "comorbidades", "doenca_hepatica", "Qual doença/remédios?")}
            {renderRow("Convulsões", "comorbidades", "convulsoes", "Controladas? Medicação")}
            {renderRow("Câncer", "comorbidades", "cancer", "Tipo / Tratamento")}
            {renderRow("Cateterismo prévio", "comorbidades", "cateterismo", "Há quanto tempo?")}
            {renderRow("Cirurgias anteriores", "comorbidades", "cirurgias", "Quais cirurgias?")}
            {renderRow("Alergias", "comorbidades", "alergias", "Alergia ao quê?")}
            {renderRow("Outras comorbidades", "comorbidades", "outras", "Quais outras?")}
          </div>
        </Card>

        {/* Medicações Uso Continuo */}
        <Card className="rounded-[2rem] border-slate-100 shadow-lg overflow-hidden glass-card">
          <div className="bg-blue-50/50 px-8 py-5 border-b border-blue-100/50 flex items-center gap-3">
             <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600">
               <Droplet className="h-5 w-5" />
             </div>
             <div>
               <h3 className="font-space font-bold tracking-tight text-lg text-slate-800">Uso Contínuo</h3>
               <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Medicações regulares</p>
             </div>
          </div>
          <div className="flex flex-col">
            {renderRow("Anticoagulantes", "medicacoes_continuas", "anticoagulantes", "Qual anticoagulante?")}
            {renderRow("Outras medicações", "medicacoes_continuas", "outros", "Listar outras...")}
          </div>
        </Card>

        {/* Historico Familiar e Habitos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           <Card className="rounded-[2rem] border-slate-100 shadow-lg overflow-hidden glass-card">
              <div className="bg-purple-50/50 px-8 py-5 border-b border-purple-100/50 flex items-center gap-3">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-space font-bold tracking-tight text-lg text-slate-800">Histórico Familiar</h3>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Genética</p>
                </div>
              </div>
              <div className="flex flex-col">
                {renderRow("Hipertensão", "historico_familiar", "hipertensao", "Quem (Grau)?")}
                {renderRow("Diabetes", "historico_familiar", "diabetes", "Quem (Grau)?")}
                {renderRow("Cardiopatia", "historico_familiar", "cardiopatia", "Quem (Grau)?")}
                {renderRow("Câncer", "historico_familiar", "cancer", "Quem (Grau)?")}
              </div>
           </Card>

           <Card className="rounded-[2rem] border-slate-100 shadow-lg overflow-hidden glass-card">
              <div className="bg-amber-50/50 px-8 py-5 border-b border-amber-100/50 flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
                  <Activity className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-space font-bold tracking-tight text-lg text-slate-800">Hábitos de Vida</h3>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Riscos</p>
                </div>
              </div>
              <div className="flex flex-col">
                {renderRow("Tabagista", "habitos_vida", "tabagista", "Quanto tempo / quant?")}
                {renderRow("Etilista", "habitos_vida", "etilista", "Frequência?")}
                {renderRow("Drogas", "habitos_vida", "drogas", "Quais?")}
              </div>
           </Card>
        </div>

        {/* Dispositivos */}
        <Card className="rounded-[2rem] border-slate-100 shadow-lg overflow-hidden glass-card">
          <div className="bg-cyan-50/50 px-8 py-5 border-b border-cyan-100/50 flex items-center gap-3">
             <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-600">
               <Key className="h-5 w-5" />
             </div>
             <div>
               <h3 className="font-space font-bold tracking-tight text-lg text-slate-800">Dispositivos</h3>
               <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Acessos e sondas (Ao admitir)</p>
             </div>
          </div>
          <div className="flex flex-col">
            {renderRow("Punção venosa", "dispositivos", "puncao_venosa", "", true)}
            {renderRow("Sonda vesical", "dispositivos", "sonda_vesical", "Observações gerais")}
            {renderRow("Sonda gástrica", "dispositivos", "sonda_gastrica", "Observações gerais")}
            {renderRow("Outros", "dispositivos", "outros", "Detalhes")}
          </div>
        </Card>

        {/* Sinais Vitais Card (Fixed at bottom or floating) */}
        <Card className="rounded-[2rem] border-slate-100 shadow-xl overflow-hidden glass-card border-t-4 border-t-emerald-400">
          <div className="bg-emerald-50/50 px-8 py-5 border-b border-emerald-100/50 flex items-center gap-3">
             <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
               <Activity className="h-5 w-5" />
             </div>
             <div>
               <h3 className="font-space font-bold tracking-tight text-lg text-emerald-800">Exame Físico / Sinais Vitais</h3>
               <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600/70">Aferidos na admissão</p>
             </div>
          </div>
          <CardContent className="p-8">
             <div className="grid grid-cols-2 lg:grid-cols-6 gap-6">
               <div className="space-y-2 text-sm font-semibold text-center">
                 <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">PA</label>
                 <Input value={formData.sinais_vitais.pa} onChange={e => updateVital("pa", e.target.value)} placeholder="120/80" className="text-center font-space font-bold text-lg h-14 bg-slate-50 border-none shadow-inner" />
               </div>
               <div className="space-y-2 text-sm font-semibold text-center">
                 <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">FC</label>
                 <Input value={formData.sinais_vitais.fc} onChange={e => updateVital("fc", e.target.value)} placeholder="75" className="text-center font-space font-bold text-lg h-14 bg-slate-50 border-none shadow-inner" />
               </div>
               <div className="space-y-2 text-sm font-semibold text-center">
                 <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">FR</label>
                 <Input value={formData.sinais_vitais.fr} onChange={e => updateVital("fr", e.target.value)} placeholder="16" className="text-center font-space font-bold text-lg h-14 bg-slate-50 border-none shadow-inner" />
               </div>
               <div className="space-y-2 text-sm font-semibold text-center">
                 <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">TAX</label>
                 <Input value={formData.sinais_vitais.tax} onChange={e => updateVital("tax", e.target.value)} placeholder="36.5" className="text-center font-space font-bold text-lg h-14 bg-slate-50 border-none shadow-inner" />
               </div>
               <div className="space-y-2 text-sm font-semibold text-center">
                 <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">GLI</label>
                 <Input value={formData.sinais_vitais.gli} onChange={e => updateVital("gli", e.target.value)} placeholder="99" className="text-center font-space font-bold text-lg h-14 bg-slate-50 border-none shadow-inner" />
               </div>
               <div className="space-y-2 text-sm font-semibold text-center">
                 <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">SPO2</label>
                 <Input value={formData.sinais_vitais.spo2} onChange={e => updateVital("spo2", e.target.value)} placeholder="98%" className="text-center font-space font-bold text-lg h-14 bg-emerald-50 text-emerald-700 border-none shadow-inner" />
               </div>
             </div>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
