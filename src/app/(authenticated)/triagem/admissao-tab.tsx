"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { searchMasterPatients, type MasterPatient } from "@/lib/patient-search"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Save, User, FileText, Printer, CheckCircle2, ChevronRight, Hash, X, Activity, Droplet, Clock, CalendarDays, Key, Users, ArrowLeft, Trash2 } from "lucide-react"
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
  const { patients, logos } = useAuth()
  const [view, setView] = useState<"list" | "form">("list")
  const [admissions, setAdmissions] = useState<any[]>([])
  const [currentAdmissionId, setCurrentAdmissionId] = useState<string | null>(null)

  const [filterDate, setFilterDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  )
  const [filterStatus, setFilterStatus] = useState<"todos" | "lancado" | "nao_lancado">("nao_lancado")

  const [isSaving, setIsSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  
  // To handle the load of nursing admissions to see what's launched
  useEffect(() => {
    const fetchAdmissions = async () => {
      const supabase = getSupabase()
      const { data } = await supabase.from('nursing_admissions').select('id, patient_id, prontuario, patient_name, created_at')
      if (data) setAdmissions(data)
    }
    fetchAdmissions()
  }, [view]) // reload when arriving at list 

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
    },

    // Exame Físico Detalhado
    exame_fisico: {
      cabeca_pescoco: { cabeca: "", cabeca_obs: "", acuid_visual: "", acuid_auditiva: "", nariz_boca: "", nariz_boca_obs: "", protese: "" },
      torax: { resp: "", o2_lmin: "", padrao: "", ausc_pulm: "", ra: "", ausc_card: "", outros: "" },
      abdome: { inspecao: "", ausculta: "", percussao: "", palpacao: "", hernia: "", obs: "" },
      geniturinario: { miccao: "", aspecto: "", lesoes: "", varizes: "", edema: "", perineo: "", emld: "", hemorroidas: "", obs: "" },
      mmss_mmii: { mmss_dor: "", mmss_edema: "", mmii_dor: "", mmii_edema: "", hematoma_local: "", varizes: "Não", avp_local: "", cvc_local: "", outros: "" },
      pele_anexos: { pele: "", cicatriz_local: "", coloracao: "", mucosas: "", hematoma_local: "", perfusao: "", obs: "" }
    },

    // Escalas
    escalas: {
       morse: { quedas: "0", diag_sec: "0", auxilio: "0", terapia: "0", marcha: "0", estado_mental: "0" },
       braden: { percepcao: "0", umidade: "0", atividade: "0", mobilidade: "0", nutricao: "0", friccao: "0" }
    },

    evolucao_enfermagem: ""
  })

  const filteredPatients = useMemo(() => {
    return patients.filter(p => {
      let dateMatch = true
      if (filterDate) {
        const formattedFilter = filterDate.split('-').reverse().join('/')
        dateMatch = p.data === formattedFilter
      }
      
      let statusMatch = true
      const isLancado = admissions.some(a => String(a.patient_id) === String(p.id) || (a.prontuario && a.prontuario === p.prontuario))
      if (filterStatus === "lancado") statusMatch = isLancado
      if (filterStatus === "nao_lancado") statusMatch = !isLancado
      
      return dateMatch && statusMatch
    })
  }, [patients, filterDate, filterStatus, admissions])

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

  const handleRegistrar = (p: any) => {
    let sexo = "Masculino"
    if (p.sexo) {
      sexo = p.sexo.toLowerCase().startsWith('m') ? "Masculino" : "Feminino"
    }
    
    // reset form but keep structure
    setFormData({
      patient_id: p.id,
      patient_name: p.paciente || "",
      social_name: "",
      prontuario: p.prontuario || "",
      sexo: sexo,
      data_nascimento: p.dataNascimento || p.data_nascimento || "",
      idade: p.idade || "",
      diagnostico_medico: "",
      hora_admissao: "",
      peso: "",
      altura: "",
      jejum_status: "nao_se_aplica",
      jejum_inicio: "",
      comorbidades: { hipertensao: emptyField(), diabetes: emptyField(), doenca_renal: emptyField(), dialitico: emptyField(), cardiopata: emptyField(), doenca_respiratoria: emptyField(), doenca_hepatica: emptyField(), convulsoes: emptyField(), cancer: emptyField(), cateterismo: emptyField(), cirurgias: emptyField(), alergias: emptyField(), outras: emptyField() },
      medicacoes_continuas: { anticoagulantes: emptyField(), outros: emptyField() },
      historico_familiar: { hipertensao: emptyField(), diabetes: emptyField(), cardiopatia: emptyField(), cancer: emptyField(), outras: emptyField() },
      habitos_vida: { tabagista: emptyField(), etilista: emptyField(), drogas: emptyField() },
      dispositivos: { puncao_venosa: { checked: null, date: "", details: "", details2: "" }, sonda_vesical: emptyField(), sonda_gastrica: emptyField(), outros: emptyField() },
      sinais_vitais: { pa: "", fc: "", fr: "", tax: "", gli: "", spo2: "" },
      exame_fisico: { cabeca_pescoco: { cabeca: "", cabeca_obs: "", acuid_visual: "", acuid_auditiva: "", nariz_boca: "", nariz_boca_obs: "", protese: "" }, torax: { resp: "", o2_lmin: "", padrao: "", ausc_pulm: "", ra: "", ausc_card: "", outros: "" }, abdome: { inspecao: "", ausculta: "", percussao: "", palpacao: "", hernia: "", obs: "" }, geniturinario: { miccao: "", aspecto: "", lesoes: "", varizes: "", edema: "", perineo: "", emld: "", hemorroidas: "", obs: "" }, mmss_mmii: { mmss_dor: "", mmss_edema: "", mmii_dor: "", mmii_edema: "", hematoma_local: "", varizes: "Não", avp_local: "", cvc_local: "", outros: "" }, pele_anexos: { pele: "", cicatriz_local: "", coloracao: "", mucosas: "", hematoma_local: "", perfusao: "", obs: "" } },
      escalas: { morse: { quedas: "0", diag_sec: "0", auxilio: "0", terapia: "0", marcha: "0", estado_mental: "0" }, braden: { percepcao: "0", umidade: "0", atividade: "0", mobilidade: "0", nutricao: "0", friccao: "0" } },
      evolucao_enfermagem: ""
    })
    setCurrentAdmissionId(null)
    setView("form")
  }

  const handleEditar = async (p: any, obj: any) => {
    const supabase = getSupabase()
    const { data } = await supabase.from('nursing_admissions').select('*').eq('id', obj.id).single()
    if (data) {
      let sexo = "Masculino"
      if (p.sexo) sexo = p.sexo.toLowerCase().startsWith('m') ? "Masculino" : "Feminino"
        
      setFormData({
        patient_id: data.patient_id || p.id,
        patient_name: data.patient_name || p.paciente || "",
        social_name: data.social_name || "",
        prontuario: data.prontuario || p.prontuario || "",
        sexo: data.sexo || sexo,
        data_nascimento: data.data_nascimento || p.dataNascimento || p.data_nascimento || "",
        idade: p.idade || "",
        diagnostico_medico: data.diagnostico_medico || "",
        hora_admissao: data.hora_admissao || "",
        peso: data.peso ? data.peso.toString() : "",
        altura: data.altura ? data.altura.toString() : "",
        jejum_status: data.jejum_status || "nao_se_aplica",
        jejum_inicio: data.jejum_inicio || "",
        comorbidades: data.comorbidades || { hipertensao: emptyField(), diabetes: emptyField(), doenca_renal: emptyField(), dialitico: emptyField(), cardiopata: emptyField(), doenca_respiratoria: emptyField(), doenca_hepatica: emptyField(), convulsoes: emptyField(), cancer: emptyField(), cateterismo: emptyField(), cirurgias: emptyField(), alergias: emptyField(), outras: emptyField() },
        medicacoes_continuas: data.medicacoes_continuas || { anticoagulantes: emptyField(), outros: emptyField() },
        historico_familiar: data.historico_familiar || { hipertensao: emptyField(), diabetes: emptyField(), cardiopatia: emptyField(), cancer: emptyField(), outras: emptyField() },
        habitos_vida: data.habitos_vida || { tabagista: emptyField(), etilista: emptyField(), drogas: emptyField() },
        dispositivos: data.dispositivos || { puncao_venosa: { checked: null, date: "", details: "", details2: "" }, sonda_vesical: emptyField(), sonda_gastrica: emptyField(), outros: emptyField() },
        sinais_vitais: data.sinais_vitais || { pa: "", fc: "", fr: "", tax: "", gli: "", spo2: "" },
        exame_fisico: data.exame_fisico || { cabeca_pescoco: { cabeca: "", cabeca_obs: "", acuid_visual: "", acuid_auditiva: "", nariz_boca: "", nariz_boca_obs: "", protese: "" }, torax: { resp: "", o2_lmin: "", padrao: "", ausc_pulm: "", ra: "", ausc_card: "", outros: "" }, abdome: { inspecao: "", ausculta: "", percussao: "", palpacao: "", hernia: "", obs: "" }, geniturinario: { miccao: "", aspecto: "", lesoes: "", varizes: "", edema: "", perineo: "", emld: "", hemorroidas: "", obs: "" }, mmss_mmii: { mmss_dor: "", mmss_edema: "", mmii_dor: "", mmii_edema: "", hematoma_local: "", varizes: "Não", avp_local: "", cvc_local: "", outros: "" }, pele_anexos: { pele: "", cicatriz_local: "", coloracao: "", mucosas: "", hematoma_local: "", perfusao: "", obs: "" } },
        escalas: data.escalas || { morse: { quedas: "0", diag_sec: "0", auxilio: "0", terapia: "0", marcha: "0", estado_mental: "0" }, braden: { percepcao: "0", umidade: "0", atividade: "0", mobilidade: "0", nutricao: "0", friccao: "0" } },
        evolucao_enfermagem: data.evolucao_enfermagem || ""
      })
      setCurrentAdmissionId(data.id)
      setView("form")
    }
  }

  const handleImprimir = async (p: any, obj: any) => {
    const printWindow = window.open("", "_blank")
    if (!printWindow) {
      alert("Por favor libere os pop-ups para imprimir a página.")
      return
    }
    
    // Fallback loading message
    printWindow.document.write("<html><body><h2>Gerando PDF, por favor aguarde...</h2></body></html>")
    
    const supabase = getSupabase()
    const { data } = await supabase.from('nursing_admissions').select('*').eq('id', obj.id).single()
    if (data) {
      const htmlContent = generateAdmissaoHtml(data, logos)
      printWindow.document.open()
      printWindow.document.write(htmlContent)
      printWindow.document.close()
      setTimeout(() => printWindow.print(), 500)
    } else {
      printWindow.close()
    }
  }

  const handleExcluir = async (obj: any) => {
    if (!window.confirm("Tem certeza que deseja excluir esta ficha de admissão? Esta ação não pode ser desfeita.")) {
      return
    }

    try {
      const supabase = getSupabase()
      const { error } = await supabase.from('nursing_admissions').delete().eq('id', obj.id)
      if (error) throw error
      
      // Refresh the list
      const { data } = await supabase.from('nursing_admissions').select('id, patient_id, prontuario, patient_name, created_at')
      if (data) setAdmissions(data)
      
      alert("Ficha excluída com sucesso!")
    } catch (err: any) {
      alert("Erro ao excluir: " + err.message)
    }
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

  const updateExame = (section: keyof typeof formData.exame_fisico, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      exame_fisico: {
        ...prev.exame_fisico,
        [section]: {
          ...prev.exame_fisico[section],
          [field]: value
        }
      }
    }))
  }

  const updateEscala = (escala: "morse" | "braden", field: string, value: string) => {
    setFormData(prev => {
      const newEscalas = {
        ...prev.escalas,
        [escala]: {
          ...prev.escalas[escala],
          [field]: value
        }
      }
      return { ...prev, escalas: newEscalas }
    })
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
        exame_fisico: formData.exame_fisico,
        escalas: formData.escalas,
        evolucao_enfermagem: formData.evolucao_enfermagem,
        created_by: "Sistema"
      }

      if (currentAdmissionId) {
        const { error } = await supabase.from('nursing_admissions').update(admissionData).eq('id', currentAdmissionId)
        if (error) throw error
      } else {
        const { error } = await supabase.from('nursing_admissions').insert([admissionData])
        if (error) throw error
      }
      
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      alert("Erro ao salvar: " + err.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handlePrint = async () => {
     // No op, used inside handleImprimir via the list now
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

  if (view === "list") {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center bg-white/50 backdrop-blur-xl p-6 rounded-[2rem] border border-slate-100 shadow-sm gap-4">
           <div>
             <h2 className="text-2xl font-black text-slate-800 tracking-tight">Pacientes Internados</h2>
             <p className="text-sm font-bold tracking-widest text-slate-400 uppercase">Selecione para Admissão de Enfermagem</p>
           </div>
           
           <div className="flex bg-white shadow-sm border border-border/40 p-1 pl-4 rounded-[1.5rem] items-center gap-3 w-full md:w-auto overflow-hidden text-sm">
             <span className="font-bold text-slate-400 text-xs uppercase tracking-wider whitespace-nowrap">Filtros:</span>
             <Input 
               type="date" 
               className="border-none bg-transparent shadow-none w-36 font-bold text-slate-600 focus-visible:ring-0 p-0" 
               value={filterDate}
               onChange={e => setFilterDate(e.target.value)}
             />
             <div className="w-[1px] h-6 bg-slate-200"></div>
             <select 
                className="bg-transparent border-none font-bold text-slate-600 focus:outline-none focus:ring-0 appearance-none pr-4 cursor-pointer"
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value as any)}
             >
                <option value="todos">Todos os Status</option>
                <option value="nao_lancado">Não Lançados</option>
                <option value="lancado">Lançados</option>
             </select>
           </div>
        </div>
        
        <Card className="rounded-[2rem] shadow-xl border-slate-100 overflow-hidden glass-card">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="font-bold py-4 pl-6">Data / Horário</TableHead>
                  <TableHead className="font-bold py-4">Nome do Paciente</TableHead>
                  <TableHead className="font-bold py-4">Prontuário</TableHead>
                  <TableHead className="font-bold py-4">Status</TableHead>
                  <TableHead className="font-bold py-4 text-right pr-6">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPatients.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-slate-500 font-bold">Nenhuma internação encontrada para este filtro.</TableCell></TableRow>
                ) : (
                  filteredPatients.map(p => {
                    const obj = admissions.find(a => String(a.patient_id) === String(p.id) || (a.prontuario && a.prontuario === p.prontuario))
                    const isLancado = !!obj
                    return (
                      <TableRow key={p.id} className="hover:bg-slate-50/50 transition-colors">
                        <TableCell className="pl-6">
                           <div className="flex flex-col">
                             <span className="font-black text-slate-700">{p.data}</span>
                             <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{p.horario}</span>
                           </div>
                        </TableCell>
                        <TableCell>
                           <div className="flex flex-col">
                             <span className="font-black text-slate-800 uppercase text-xs">{p.paciente}</span>
                             <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mt-1">CPF: {p.cpf || "S/N"} • SUS: {p.sus || "S/N"}</span>
                           </div>
                        </TableCell>
                        <TableCell>
                           <Badge variant="outline" className="font-mono text-xs">{p.prontuario || "S/N"}</Badge>
                        </TableCell>
                        <TableCell>
                           {isLancado ? (
                             <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none">Lançado</Badge>
                           ) : (
                             <Badge className="bg-slate-100 text-slate-500 hover:bg-slate-100 border-none">Não Lançado</Badge>
                           )}
                        </TableCell>
                        <TableCell className="text-right pr-6">
                           {isLancado ? (
                              <div className="flex items-center justify-end gap-2">
                                <Button size="sm" variant="outline" onClick={() => handleEditar(p, obj)} className="h-8 rounded-[1rem] font-bold text-xs border-slate-200 text-slate-600 hover:bg-slate-50 gap-2">
                                  Editar
                                </Button>
                                <Button size="sm" onClick={() => handleImprimir(p, obj)} className="h-8 rounded-[1rem] font-bold text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200 gap-2">
                                  <Printer className="h-4 w-4" /> PDF
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => handleExcluir(obj)} className="h-8 w-8 p-0 rounded-full text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                           ) : (
                              <Button size="sm" onClick={() => handleRegistrar(p)} className="h-8 rounded-[1rem] font-black uppercase text-[10px] tracking-wider bg-emerald-500 hover:bg-emerald-600 shadow-md shadow-emerald-500/20 gap-2">
                                <FileText className="h-4 w-4" /> Registrar Admissão
                              </Button>
                           )}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (view === "form") {
    return (
      <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 pb-24">
        
        {/* Form Header with Back Button */}
        <div className="sticky top-4 z-40 bg-white/80 backdrop-blur-xl rounded-[2rem] p-4 shadow-xl border border-slate-100/50 flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
          <div className="flex items-center gap-4 w-full">
             <Button variant="ghost" onClick={() => setView("list")} className="rounded-xl h-12 w-12 p-0 border border-slate-200 hover:bg-slate-100 text-slate-500 shrink-0 shadow-sm">
               <ArrowLeft className="h-5 w-5" />
             </Button>
             <div className="flex-1">
                <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Nova Admissão de Enfermagem</p>
                <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight line-clamp-1">{formData.patient_name || "Paciente Vazio"}</h2>
             </div>
             
             <Button onClick={() => setView("list")} variant="outline" className="h-10 rounded-xl font-bold text-xs">
               Cancelar
             </Button>
          </div>
          
          <div className="flex items-center gap-3 shrink-0">
            <Button 
              onClick={() => handleImprimir({ id: formData.patient_id, prontuario: formData.prontuario }, { id: currentAdmissionId })}
              disabled={!currentAdmissionId}
              variant="outline" 
              className="h-14 rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-300 px-6 transition-all disabled:opacity-50"
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
                <Input value={formData.idade ? `${formData.idade} anos` : ""} readOnly placeholder="--" className="bg-slate-100 border-none font-black shadow-none h-12 rounded-xl text-slate-600 cursor-not-allowed" />
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
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${formData.jejum_status === 'sim' ? 'border-amber-500 bg-amber-50 border-[6px]' : 'border-slate-300 bg-white group-hover:border-slate-400'}`} />
                    <input type="radio" value="sim" className="hidden" checked={formData.jejum_status === 'sim'} onChange={e => setFormData({...formData, jejum_status: e.target.value})} />
                    <span className="text-sm font-bold text-slate-600">Sim, a partir das:</span>
                  </label>
                  <Input type="time" className="w-32 h-10 bg-white shadow-sm border-none font-bold rounded-xl" value={formData.jejum_inicio} onChange={e => setFormData({...formData, jejum_inicio: e.target.value})} disabled={formData.jejum_status !== 'sim'} />
                  <span className="text-xs font-bold text-slate-400 uppercase mr-4">Horas</span>

                  <label className="flex items-center gap-2 cursor-pointer group mr-4">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${formData.jejum_status === 'nao' ? 'border-emerald-500 bg-emerald-50 border-[6px]' : 'border-slate-300 bg-white group-hover:border-slate-400'}`} />
                    <input type="radio" value="nao" className="hidden" checked={formData.jejum_status === 'nao'} onChange={e => setFormData({...formData, jejum_status: e.target.value})} />
                    <span className="text-sm font-bold text-slate-600">Alimentado (Não)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer group">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${formData.jejum_status === 'nao_se_aplica' ? 'border-slate-500 bg-slate-100 border-[6px]' : 'border-slate-300 bg-white group-hover:border-slate-400'}`} />
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

        {/* Exame Físico Detalhado */}
        <Card className="rounded-[2rem] border-slate-100 shadow-lg overflow-hidden glass-card">
          <div className="bg-slate-50/50 px-8 py-5 border-b border-border/40 flex items-center gap-3">
             <div className="p-2 rounded-xl bg-slate-500/10 text-slate-600">
               <Activity className="h-5 w-5" />
             </div>
             <div>
               <h3 className="font-space font-bold tracking-tight text-lg text-slate-800">Exame Físico Específico</h3>
               <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Avaliação por sistemas</p>
             </div>
          </div>
          <CardContent className="p-8 space-y-8">
            {/* Cabeça e Pescoço */}
            <div className="space-y-4">
              <h4 className="font-bold text-slate-700 border-b pb-2">Cabeça e Pescoço</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                   <Label className="text-xs font-bold text-slate-500">Cabeça</Label>
                   <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50 mt-1" value={formData.exame_fisico.cabeca_pescoco.cabeca} onChange={e => updateExame("cabeca_pescoco", "cabeca", e.target.value)}>
                     <option value="">Selecione...</option>
                     <option value="Inalterada">Inalterada</option>
                     <option value="Alterada">Alterações (Descrever)</option>
                   </select>
                   {formData.exame_fisico.cabeca_pescoco.cabeca === "Alterada" && (
                     <Input className="mt-2" placeholder="Quais alterações?" value={formData.exame_fisico.cabeca_pescoco.cabeca_obs} onChange={e => updateExame("cabeca_pescoco", "cabeca_obs", e.target.value)} />
                   )}
                 </div>
                 <div>
                   <Label className="text-xs font-bold text-slate-500">Acuidade Visual</Label>
                   <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1" value={formData.exame_fisico.cabeca_pescoco.acuid_visual} onChange={e => updateExame("cabeca_pescoco", "acuid_visual", e.target.value)}>
                     <option value="">Selecione...</option>
                     <option value="Preservada">Preservada</option>
                     <option value="Diminuída">Diminuída</option>
                   </select>
                 </div>
                 <div>
                   <Label className="text-xs font-bold text-slate-500">Acuidade Auditiva</Label>
                   <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1" value={formData.exame_fisico.cabeca_pescoco.acuid_auditiva} onChange={e => updateExame("cabeca_pescoco", "acuid_auditiva", e.target.value)}>
                     <option value="">Selecione...</option>
                     <option value="Preservada">Preservada</option>
                     <option value="Diminuída">Diminuída</option>
                   </select>
                 </div>
                 <div>
                   <Label className="text-xs font-bold text-slate-500">Nariz e Boca</Label>
                   <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1" value={formData.exame_fisico.cabeca_pescoco.nariz_boca} onChange={e => updateExame("cabeca_pescoco", "nariz_boca", e.target.value)}>
                     <option value="">Selecione...</option>
                     <option value="Inalterado">Inalterado</option>
                     <option value="Alterações">Alterações</option>
                   </select>
                   {formData.exame_fisico.cabeca_pescoco.nariz_boca === "Alterações" && (
                     <Input className="mt-2" placeholder="Quais alterações?" value={formData.exame_fisico.cabeca_pescoco.nariz_boca_obs} onChange={e => updateExame("cabeca_pescoco", "nariz_boca_obs", e.target.value)} />
                   )}
                 </div>
                 <div>
                   <Label className="text-xs font-bold text-slate-500">Prótese Dentária</Label>
                   <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1" value={formData.exame_fisico.cabeca_pescoco.protese} onChange={e => updateExame("cabeca_pescoco", "protese", e.target.value)}>
                     <option value="">Selecione...</option>
                     <option value="Sim">Sim</option>
                     <option value="Não">Não</option>
                   </select>
                 </div>
              </div>
            </div>

            {/* Tórax */}
            <div className="space-y-4">
              <h4 className="font-bold text-slate-700 border-b pb-2">Tórax</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                   <Label className="text-xs font-bold text-slate-500">Respiratório (Suporte)</Label>
                   <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1" value={formData.exame_fisico.torax.resp} onChange={e => updateExame("torax", "resp", e.target.value)}>
                     <option value="">Selecione...</option>
                     <option value="Ar ambiente">Ar ambiente</option>
                     <option value="CNO2">Cateter Nasal O2</option>
                     <option value="Macronebulização">Macronebulização</option>
                     <option value="TQT">TQT</option>
                   </select>
                   {formData.exame_fisico.torax.resp === "CNO2" && (
                     <Input className="mt-2" placeholder="Quantos L/min?" value={formData.exame_fisico.torax.o2_lmin} onChange={e => updateExame("torax", "o2_lmin", e.target.value)} />
                   )}
                 </div>
                 <div>
                   <Label className="text-xs font-bold text-slate-500">Padrão Respiratório</Label>
                   <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1" value={formData.exame_fisico.torax.padrao} onChange={e => updateExame("torax", "padrao", e.target.value)}>
                     <option value="">Selecione...</option>
                     <option value="Eupneico">Eupneico</option>
                     <option value="Taquipneico">Taquipneico</option>
                     <option value="Bradipneico">Bradipneico</option>
                     <option value="Dispneico">Dispneico</option>
                   </select>
                 </div>
                 <div>
                   <Label className="text-xs font-bold text-slate-500">Ausculta Pulmonar</Label>
                   <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1" value={formData.exame_fisico.torax.ausc_pulm} onChange={e => updateExame("torax", "ausc_pulm", e.target.value)}>
                     <option value="">Selecione...</option>
                     <option value="MV+">MV+</option>
                     <option value="MV diminuídos">MV diminuídos</option>
                     <option value="Sem RA">Sem RA</option>
                     <option value="Com RA">Com RA</option>
                   </select>
                   {formData.exame_fisico.torax.ausc_pulm === "Com RA" && (
                     <div className="mt-2 flex gap-4">
                       <label className="flex items-center gap-1 text-sm"><input type="radio" name="ra_tipo" value="Roncos" onChange={e => updateExame("torax", "ra", e.target.value)} checked={formData.exame_fisico.torax.ra === "Roncos"}/> Roncos</label>
                       <label className="flex items-center gap-1 text-sm"><input type="radio" name="ra_tipo" value="Sibilos" onChange={e => updateExame("torax", "ra", e.target.value)} checked={formData.exame_fisico.torax.ra === "Sibilos"}/> Sibilos</label>
                       <label className="flex items-center gap-1 text-sm"><input type="radio" name="ra_tipo" value="Estertores" onChange={e => updateExame("torax", "ra", e.target.value)} checked={formData.exame_fisico.torax.ra === "Estertores"}/> Estertores</label>
                     </div>
                   )}
                 </div>
                 <div>
                   <Label className="text-xs font-bold text-slate-500">Ausculta Cardíaca</Label>
                   <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1" value={formData.exame_fisico.torax.ausc_card} onChange={e => updateExame("torax", "ausc_card", e.target.value)}>
                     <option value="">Selecione...</option>
                     <option value="BRNF 2T">BRNF 2T</option>
                     <option value="Sem sopro">Sem sopro</option>
                     <option value="Com sopro">Com sopro</option>
                   </select>
                 </div>
                 <div className="md:col-span-2">
                   <Label className="text-xs font-bold text-slate-500">Outros relacionados ao Tórax</Label>
                   <Input className="mt-1" value={formData.exame_fisico.torax.outros} onChange={e => updateExame("torax", "outros", e.target.value)} />
                 </div>
              </div>
            </div>

            {/* Abdome, Aparelho Geniturinario, MMSS/MMII, Pele */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="font-bold text-slate-700 border-b pb-2">Abdome</h4>
                 <div>
                   <Label className="text-xs font-bold text-slate-500">Inspeção</Label>
                   <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1" value={formData.exame_fisico.abdome.inspecao} onChange={e => updateExame("abdome", "inspecao", e.target.value)}>
                     <option value="">Selecione...</option>
                     <option value="Plano">Plano</option><option value="Escavado">Escavado</option><option value="Globoso">Globoso</option><option value="Distendido">Distendido</option>
                   </select>
                 </div>
                 <div>
                   <Label className="text-xs font-bold text-slate-500">Ausculta</Label>
                   <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1" value={formData.exame_fisico.abdome.ausculta} onChange={e => updateExame("abdome", "ausculta", e.target.value)}>
                     <option value="">Selecione...</option>
                     <option value="RHA+">RHA+</option><option value="RHA diminuídos">RHA diminuídos</option><option value="Ausência">Ausência de sons</option>
                   </select>
                 </div>
                 <div>
                   <Label className="text-xs font-bold text-slate-500">Palpação</Label>
                   <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1" value={formData.exame_fisico.abdome.palpacao} onChange={e => updateExame("abdome", "palpacao", e.target.value)}>
                     <option value="">Selecione...</option>
                     <option value="Flácido">Flácido</option><option value="Indolor">Indolor</option><option value="Doloroso">Doloroso a palpação</option>
                   </select>
                 </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-bold text-slate-700 border-b pb-2">Aparelho Geniturinário</h4>
                 <div>
                   <Label className="text-xs font-bold text-slate-500">Micção</Label>
                   <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1" value={formData.exame_fisico.geniturinario.miccao} onChange={e => updateExame("geniturinario", "miccao", e.target.value)}>
                     <option value="">Selecione...</option>
                     <option value="Espontânea">Espontânea</option><option value="Disúria">Disúria</option><option value="Polaciúria">Polaciúria</option><option value="Perda">Perda Urinária</option><option value="SVD">SVD</option>
                   </select>
                 </div>
                 <div>
                   <Label className="text-xs font-bold text-slate-500">Aspecto da Urina</Label>
                   <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1" value={formData.exame_fisico.geniturinario.aspecto} onChange={e => updateExame("geniturinario", "aspecto", e.target.value)}>
                     <option value="">Selecione...</option>
                     <option value="Inalterado">Inalterado</option><option value="Hematúria">Hematúria</option><option value="Piúria">Piúria</option>
                   </select>
                 </div>
                 <div>
                   <Label className="text-xs font-bold text-slate-500">Períneo / Lesões</Label>
                   <Input className="mt-1" placeholder="Varizes vulvares, edema, íntegro, hemorroidas..." value={formData.exame_fisico.geniturinario.obs} onChange={e => updateExame("geniturinario", "obs", e.target.value)} />
                 </div>
              </div>
            </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="font-bold text-slate-700 border-b pb-2">Membros (MMSS e MMII)</h4>
                 <div className="grid grid-cols-2 gap-2">
                   <div>
                     <Label className="text-xs font-bold text-slate-500">MMSS (Dor)</Label>
                     <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1" value={formData.exame_fisico.mmss_mmii.mmss_dor} onChange={e => updateExame("mmss_mmii", "mmss_dor", e.target.value)}>
                       <option value="">Selecione...</option>
                       <option value="Não">Não</option><option value="Sim">Sim</option>
                     </select>
                   </div>
                   <div>
                     <Label className="text-xs font-bold text-slate-500">MMSS (Edema)</Label>
                     <Input className="mt-1" placeholder="Ex: 2/4+" value={formData.exame_fisico.mmss_mmii.mmss_edema} onChange={e => updateExame("mmss_mmii", "mmss_edema", e.target.value)} />
                   </div>
                 </div>
                 <div className="grid grid-cols-2 gap-2">
                   <div>
                     <Label className="text-xs font-bold text-slate-500">MMII (Dor)</Label>
                     <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1" value={formData.exame_fisico.mmss_mmii.mmii_dor} onChange={e => updateExame("mmss_mmii", "mmii_dor", e.target.value)}>
                       <option value="">Selecione...</option>
                       <option value="Não">Não</option><option value="Sim">Sim</option>
                     </select>
                   </div>
                   <div>
                     <Label className="text-xs font-bold text-slate-500">MMII (Edema)</Label>
                     <Input className="mt-1" placeholder="Ex: 2/4+" value={formData.exame_fisico.mmss_mmii.mmii_edema} onChange={e => updateExame("mmss_mmii", "mmii_edema", e.target.value)} />
                   </div>
                 </div>
                 <div>
                   <Label className="text-xs font-bold text-slate-500">Acessos</Label>
                   <Input className="mt-1 mb-2" placeholder="Local do AVP" value={formData.exame_fisico.mmss_mmii.avp_local} onChange={e => updateExame("mmss_mmii", "avp_local", e.target.value)} />
                   <Input className="mt-1" placeholder="Local do CVC" value={formData.exame_fisico.mmss_mmii.cvc_local} onChange={e => updateExame("mmss_mmii", "cvc_local", e.target.value)} />
                 </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-bold text-slate-700 border-b pb-2">Pele e Anexos</h4>
                 <div>
                   <Label className="text-xs font-bold text-slate-500">Pele</Label>
                   <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1" value={formData.exame_fisico.pele_anexos.pele} onChange={e => updateExame("pele_anexos", "pele", e.target.value)}>
                     <option value="">Selecione...</option>
                     <option value="Íntegra">Íntegra</option><option value="Cicatriz">Cicatriz (Detalhar)</option><option value="Lesão">Lesão</option>
                   </select>
                   {formData.exame_fisico.pele_anexos.pele !== "Íntegra" && formData.exame_fisico.pele_anexos.pele !== "" && (
                     <Input className="mt-2" placeholder="Localização..." value={formData.exame_fisico.pele_anexos.cicatriz_local} onChange={e => updateExame("pele_anexos", "cicatriz_local", e.target.value)} />
                   )}
                 </div>
                 <div>
                   <Label className="text-xs font-bold text-slate-500">Coloração / Mucosas</Label>
                   <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1 mb-2" value={formData.exame_fisico.pele_anexos.coloracao} onChange={e => updateExame("pele_anexos", "coloracao", e.target.value)}>
                     <option value="">Selecione (Coloração)...</option>
                     <option value="Normocorado">Normocorado</option><option value="Palidez">Palidez</option><option value="Icterícia">Icterícia</option><option value="Cianose">Cianose</option>
                   </select>
                   <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1" value={formData.exame_fisico.pele_anexos.mucosas} onChange={e => updateExame("pele_anexos", "mucosas", e.target.value)}>
                     <option value="">Selecione (Mucosas)...</option>
                     <option value="Normocoradas">Normocoradas</option><option value="Hipocoradas">Hipocoradas</option>
                   </select>
                 </div>
                 <div>
                   <Label className="text-xs font-bold text-slate-500">Perfusão Periférica</Label>
                   <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1" value={formData.exame_fisico.pele_anexos.perfusao} onChange={e => updateExame("pele_anexos", "perfusao", e.target.value)}>
                     <option value="">Selecione...</option>
                     <option value="Boa">Boa</option><option value="Regular">Regular</option><option value="Ruim">Ruim</option>
                   </select>
                 </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Escalas & Evolução */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <Card className="rounded-[2rem] border-slate-100 shadow-lg overflow-hidden glass-card">
              <div className="bg-orange-50/50 px-8 py-5 border-b border-orange-100/50 flex flex-col gap-1">
                 <h3 className="font-space font-bold tracking-tight text-lg text-slate-800">Escala de Morse Fall</h3>
                 <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Risco de Quedas</p>
              </div>
              <CardContent className="p-6 space-y-4">
                 <div>
                   <Label className="text-xs">Histórico de Quedas</Label>
                   <select className="flex h-10 w-full rounded-md border bg-slate-50 text-sm mt-1" value={formData.escalas.morse.quedas} onChange={e => updateEscala("morse", "quedas", e.target.value)}>
                     <option value="0">Não (0)</option><option value="20">Sim (20)</option>
                   </select>
                 </div>
                 <div>
                   <Label className="text-xs">Diagnóstico Secundário</Label>
                   <select className="flex h-10 w-full rounded-md border bg-slate-50 text-sm mt-1" value={formData.escalas.morse.diag_sec} onChange={e => updateEscala("morse", "diag_sec", e.target.value)}>
                     <option value="0">Não (0)</option><option value="15">Sim (15)</option>
                   </select>
                 </div>
                 <div>
                   <Label className="text-xs">Auxílio na Deambulação</Label>
                   <select className="flex h-10 w-full rounded-md border bg-slate-50 text-sm mt-1" value={formData.escalas.morse.auxilio} onChange={e => updateEscala("morse", "auxilio", e.target.value)}>
                     <option value="0">Nenhum/Acamado/Auxiliado (0)</option><option value="15">Muletas/Bengala/Andador (15)</option><option value="30">Mobiliário/Parede (30)</option>
                   </select>
                 </div>
                 <div>
                   <Label className="text-xs">Terapia Endovenosa (Sinalizado/Heparinizado)</Label>
                   <select className="flex h-10 w-full rounded-md border bg-slate-50 text-sm mt-1" value={formData.escalas.morse.terapia} onChange={e => updateEscala("morse", "terapia", e.target.value)}>
                     <option value="0">Não (0)</option><option value="20">Sim (20)</option>
                   </select>
                 </div>
                 <div>
                   <Label className="text-xs">Marcha</Label>
                   <select className="flex h-10 w-full rounded-md border bg-slate-50 text-sm mt-1" value={formData.escalas.morse.marcha} onChange={e => updateEscala("morse", "marcha", e.target.value)}>
                     <option value="0">Normal/Sem Deambulação/Cadeira de Rodas (0)</option><option value="15">Fraca (15)</option><option value="20">Comprometida/Cambaleante (20)</option>
                   </select>
                 </div>
                 <div>
                   <Label className="text-xs">Estado Mental</Label>
                   <select className="flex h-10 w-full rounded-md border bg-slate-50 text-sm mt-1" value={formData.escalas.morse.estado_mental} onChange={e => updateEscala("morse", "estado_mental", e.target.value)}>
                     <option value="0">Orientado (0)</option><option value="15">Superestima capacidade/ Esquece limitações (15)</option>
                   </select>
                 </div>
                 
                 <div className="pt-4 border-t flex justify-between items-center bg-orange-50 p-3 rounded-xl">
                   <span className="font-bold text-sm text-slate-700">Total:</span>
                   <span className="font-black text-lg text-orange-600">
                     {parseInt(formData.escalas.morse.quedas) + parseInt(formData.escalas.morse.diag_sec) + parseInt(formData.escalas.morse.auxilio) + parseInt(formData.escalas.morse.terapia) + parseInt(formData.escalas.morse.marcha) + parseInt(formData.escalas.morse.estado_mental)} pts
                   </span>
                 </div>
              </CardContent>
           </Card>

           <div className="flex flex-col gap-8">
             <Card className="rounded-[2rem] border-slate-100 shadow-lg overflow-hidden glass-card h-full">
                <div className="bg-indigo-50/50 px-8 py-5 border-b border-indigo-100/50 flex flex-col gap-1">
                   <h3 className="font-space font-bold tracking-tight text-lg text-slate-800">Escala de Braden</h3>
                   <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Risco de Lesão</p>
                </div>
                <CardContent className="p-6 space-y-4">
                   <div className="grid grid-cols-2 gap-4">
                     <div>
                       <Label className="text-[10px] uppercase font-bold text-slate-400">Percepção</Label>
                       <select className="flex h-8 w-full rounded-md border bg-slate-50 text-xs mt-1" value={formData.escalas.braden.percepcao} onChange={e => updateEscala("braden", "percepcao", e.target.value)}>
                         <option value="0">Sel...</option><option value="1">1. Limitado</option><option value="2">2. Muito lim</option><option value="3">3. Leve lim</option><option value="4">4. Sem limitação</option>
                       </select>
                     </div>
                     <div>
                       <Label className="text-[10px] uppercase font-bold text-slate-400">Umidade</Label>
                       <select className="flex h-8 w-full rounded-md border bg-slate-50 text-xs mt-1" value={formData.escalas.braden.umidade} onChange={e => updateEscala("braden", "umidade", e.target.value)}>
                         <option value="0">Sel...</option><option value="1">1. Comp molhado</option><option value="2">2. Muito molhado</option><option value="3">3. Ocasional</option><option value="4">4. Raramente</option>
                       </select>
                     </div>
                     <div>
                       <Label className="text-[10px] uppercase font-bold text-slate-400">Atividade</Label>
                       <select className="flex h-8 w-full rounded-md border bg-slate-50 text-xs mt-1" value={formData.escalas.braden.atividade} onChange={e => updateEscala("braden", "atividade", e.target.value)}>
                         <option value="0">Sel...</option><option value="1">1. Acamado</option><option value="2">2. Cadeira</option><option value="3">3. Anda ocas</option><option value="4">4. Anda freq</option>
                       </select>
                     </div>
                     <div>
                       <Label className="text-[10px] uppercase font-bold text-slate-400">Mobilidade</Label>
                       <select className="flex h-8 w-full rounded-md border bg-slate-50 text-xs mt-1" value={formData.escalas.braden.mobilidade} onChange={e => updateEscala("braden", "mobilidade", e.target.value)}>
                         <option value="0">Sel...</option><option value="1">1. Tot Imóvel</option><option value="2">2. Bast lim</option><option value="3">3. Leve lim</option><option value="4">4. Sem limites</option>
                       </select>
                     </div>
                     <div>
                       <Label className="text-[10px] uppercase font-bold text-slate-400">Nutrição</Label>
                       <select className="flex h-8 w-full rounded-md border bg-slate-50 text-xs mt-1" value={formData.escalas.braden.nutricao} onChange={e => updateEscala("braden", "nutricao", e.target.value)}>
                         <option value="0">Sel...</option><option value="1">1. Muito pobre</option><option value="2">2. Inadequada</option><option value="3">3. Adequada</option><option value="4">4. Excelente</option>
                       </select>
                     </div>
                     <div>
                       <Label className="text-[10px] uppercase font-bold text-slate-400">Fricção</Label>
                       <select className="flex h-8 w-full rounded-md border bg-slate-50 text-xs mt-1" value={formData.escalas.braden.friccao} onChange={e => updateEscala("braden", "friccao", e.target.value)}>
                         <option value="0">Sel...</option><option value="1">1. Problema</option><option value="2">2. Potencial</option><option value="3">3. Nenhum prob</option>
                       </select>
                     </div>
                   </div>

                   <div className="pt-4 mt-2 border-t flex justify-between items-center bg-indigo-50 p-3 rounded-xl">
                     <span className="font-bold text-sm text-slate-700">Total:</span>
                     <span className="font-black text-lg text-indigo-600">
                       {parseInt(formData.escalas.braden.percepcao) + parseInt(formData.escalas.braden.umidade) + parseInt(formData.escalas.braden.atividade) + parseInt(formData.escalas.braden.mobilidade) + parseInt(formData.escalas.braden.nutricao) + parseInt(formData.escalas.braden.friccao)} pts
                     </span>
                   </div>
                </CardContent>
             </Card>
           </div>
        </div>

        <Card className="rounded-[2rem] border-slate-100 shadow-xl overflow-hidden glass-card">
          <div className="bg-slate-800 text-white px-8 py-5 flex items-center gap-3">
             <div className="p-2 rounded-xl bg-white/10">
               <FileText className="h-5 w-5" />
             </div>
             <div>
               <h3 className="font-space font-bold tracking-tight text-lg">Evolução de Enfermagem</h3>
               <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">Resumo descritivo da admissão</p>
             </div>
          </div>
          <CardContent className="p-8">
             <textarea 
               className="w-full min-h-[300px] p-4 text-sm resize-y rounded-2xl border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-inner"
               placeholder="Escreva a evolução livremente aqui..."
               value={formData.evolucao_enfermagem}
               onChange={e => setFormData({...formData, evolucao_enfermagem: e.target.value})}
             />

             <div className="flex flex-col sm:flex-row justify-end mt-8 gap-4 pt-4 border-t border-border/40">
                <Button 
                  onClick={handleSubmit} 
                  disabled={isSaving || success || !formData.patient_name}
                  className="h-14 rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] bg-emerald-500 hover:bg-emerald-600 shadow-xl shadow-emerald-500/30 px-8 disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  {isSaving ? <Activity className="h-4 w-4 mr-2 animate-spin" /> : 
                  success ? <CheckCircle2 className="h-4 w-4 mr-2" /> : 
                  <Save className="h-4 w-4 mr-2" />}
                  {success ? "Salvo com sucesso!" : "Registrar Admissão de Enfermagem Completa"}
                </Button>
             </div>
          </CardContent>
        </Card>

      </div>
    </div>
    )
  }
}
