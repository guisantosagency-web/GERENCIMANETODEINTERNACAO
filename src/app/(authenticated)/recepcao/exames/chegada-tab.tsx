"use client"
import { useState, useEffect, useMemo } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { CheckSquare, Clock, MapPin, Key, Loader2, Users, Trash, Search, ChevronDown, ChevronRight, X, Send, CreditCard, Activity, AlertCircle, Edit, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { differenceInYears, parseISO, format } from "date-fns"
import { useAuth } from "@/lib/auth-context"
import { upsertMasterPatient } from "@/lib/patient-search"

type IbgeEstado = { id: number, sigla: string, nome: string }
type IbgeMunicipio = { id: number, nome: string }

const SearchableSelect = ({ label, options, value, onChange, placeholder, disabled = false, icon: Icon }: any) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  const filteredOptions = options.filter((opt: any) =>
    opt.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (opt.sigla && opt.sigla.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const selectedOption = options.find((opt: any) => (opt.sigla || opt.nome) === value)

  return (
    <div className="space-y-2 relative">
      <Label className="uppercase text-[9px] font-black tracking-widest text-slate-400 ml-2">{label}</Label>
      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full flex items-center justify-between bg-slate-50 border-none px-4 h-14 rounded-2xl text-sm font-bold shadow-inner transition-all focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed ${isOpen ? 'ring-2 ring-emerald-500 bg-white' : ''}`}
        >
          <div className="flex items-center gap-3">
            {Icon && <Icon className="h-5 w-5 text-emerald-500" />}
            <span className={selectedOption ? "text-slate-900" : "text-slate-400 font-medium"}>
              {selectedOption ? selectedOption.nome : placeholder}
            </span>
          </div>
          <ChevronDown className={`h-5 w-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute z-[100] mt-2 w-full bg-white border border-slate-100 rounded-[1.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-3 border-b border-slate-50 sticky top-0 bg-white/90 backdrop-blur-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  autoFocus
                  className="w-full bg-slate-50 border-none rounded-xl h-10 pl-10 pr-4 text-sm font-bold focus:ring-0"
                  placeholder="Pesquisar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="max-h-[250px] overflow-y-auto pt-1 pb-1">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((opt: any) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      onChange(opt.sigla || opt.nome)
                      setIsOpen(false)
                      setSearchTerm("")
                    }}
                    className={`w-full text-left px-5 py-3 text-sm font-bold transition-colors hover:bg-emerald-50 hover:text-emerald-600 ${value === (opt.sigla || opt.nome) ? 'bg-emerald-50 text-emerald-600' : 'text-slate-600'}`}
                  >
                    {opt.nome} {opt.sigla ? `(${opt.sigla})` : ""}
                  </button>
                ))
              ) : (
                <div className="p-4 text-center text-xs font-bold text-slate-400 italic">Nenhum resultado encontrado</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ChegadaTab() {
  const [appointments, setAppointments] = useState<any[]>([])
  const [forwardedAppointments, setForwardedAppointments] = useState<any[]>([])
  const [queueView, setQueueView] = useState<'waiting' | 'forwarded'>('waiting')
  const [origins, setOrigins] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [estados, setEstados] = useState<IbgeEstado[]>([])
  const [municipios, setMunicipios] = useState<IbgeMunicipio[]>([])

  const [selectedAppt, setSelectedAppt] = useState<any>(null)
  const [isEditingReception, setIsEditingReception] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), "yyyy-MM-dd"))
  const [searchFilter, setSearchFilter] = useState("")
  const [confirmedIds, setConfirmedIds] = useState<string[]>([])

  const [formData, setFormData] = useState({
    origin_id: "",
    new_origin_name: "",
    cpf: "",
    sus: "",
    birth_date: "",
    state: "MA",
    city: "São Luís",
    chave_sisreg: "",
    priority: "Sem Prioridade",
    receptionist_name: "",
    is_encaixe: false
  })

  const [slotInfo, setSlotInfo] = useState<{ total: number; occupied: number } | null>(null)
  const [isCheckingSlots, setIsCheckingSlots] = useState(false)
  const [dynamicProcedures, setDynamicProcedures] = useState<string[]>([])
  const [dynamicTypes, setDynamicTypes] = useState<Record<string, string[]>>({})

  const { user } = useAuth()
  const supabase = useMemo(() => createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!), [])

  useEffect(() => {
    fetch("https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome")
      .then(res => res.json())
      .then(setEstados)
      .catch(console.error)
  }, [])

  useEffect(() => {
    if (formData.state) {
      const estadoSelecionado = estados.find(e => e.sigla === formData.state)
      if (estadoSelecionado) {
        fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${estadoSelecionado.id}/municipios`)
          .then(res => res.json())
          .then(setMunicipios)
          .catch(console.error)
      }
    } else {
      setMunicipios([])
    }
  }, [formData.state, estados])

  const loadConfig = async () => {
    const { data: procs } = await supabase.from("exam_procedures_list").select("*").order("name")
    const { data: types } = await supabase.from("exam_types_list").select("*").order("name")

    if (procs) setDynamicProcedures(procs.map((p: any) => p.name))
    
    if (types) {
      const tMap: Record<string, string[]> = {}
      types.forEach((t: any) => {
        if (!tMap[t.procedure_name]) tMap[t.procedure_name] = []
        tMap[t.procedure_name].push(t.name)
      })
      setDynamicTypes(tMap)
    }
  }

  useEffect(() => {
    loadConfig()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const { data: orgData } = await supabase.from("exam_origins").select("*").order("name")
      if (orgData) setOrigins(orgData)
       const { data: appData } = await supabase
        .from("exam_appointments")
        .select("*")
        .in("status", ["agendado", "aguardando"])
        .eq("exam_date", selectedDate) 
        .order("exam_time")

      if (appData) {
        const groupedWaiting: any[] = []
        const groupedForwarded: any[] = []
        
        const waitingGroups: Record<string, any> = {}
        const forwardedGroups: Record<string, any> = {}

        appData.forEach(app => {
          const patientKey = `${app.patient_name}-${app.exam_date}-${app.cpf || app.sus}`
          const isWaiting = app.status === "agendado"
          
          const groups = isWaiting ? waitingGroups : forwardedGroups
          const targetList = isWaiting ? groupedWaiting : groupedForwarded

          if (!groups[patientKey]) {
            groups[patientKey] = {
              ...app,
              ids: [app.id],
              all_procedures: [app.procedure_name],
              raw_appointments: [app],
              isGrouped: false
            }
            targetList.push(groups[patientKey])
          } else {
            groups[patientKey].isGrouped = true
            groups[patientKey].ids.push(app.id)
            groups[patientKey].raw_appointments.push(app)

            if (!groups[patientKey].all_procedures.includes(app.procedure_name)) {
              groups[patientKey].all_procedures.push(app.procedure_name)
            }

            const count = groups[patientKey].raw_appointments.length
            groups[patientKey].procedure_name = `Pacote de Exames (${count} itens)`
          }
        })

        setAppointments(groupedWaiting)
        setForwardedAppointments(groupedForwarded)
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [selectedDate]) // Recarregar quando a data mudar

  useEffect(() => {
    const checkSlots = async () => {
      // Find the currently selected exam for encaixe
      let procedure = ""
      if (selectedAppt?.isBlankEncaixe) {
        procedure = selectedAppt.procedure_name
      } else if (selectedAppt) {
        procedure = selectedAppt.procedure_name
      }

      if (!procedure || procedure === "Raio X") {
        setSlotInfo(null)
        return
      }

      setIsCheckingSlots(true)
      try {
        const { data: slotData } = await supabase.from("exam_slots").select("total_slots").eq("exam_date", selectedDate).eq("procedure_name", procedure).maybeSingle()
        
        if (!slotData) {
          setSlotInfo(null)
          return
        }

        const { count } = await supabase.from("exam_appointments").select("*", { count: 'exact', head: true }).eq("exam_date", selectedDate).eq("procedure_name", procedure).neq("status", "cancelado")
        setSlotInfo({ total: slotData.total_slots, occupied: count || 0 })
      } finally {
        setIsCheckingSlots(false)
      }
    }
    
    if (formData.is_encaixe) {
      checkSlots()
    }
  }, [selectedAppt?.procedure_name, formData.is_encaixe, selectedDate, supabase])

  const handleSelectAppt = async (appt: any) => {
    setSelectedAppt(appt)
    setConfirmedIds(appt.ids || [appt.id])
    setIsEditingReception(false)

    // Buscar dados completos se o paciente já existir na base
    let masterData: any = null
    if (appt.cpf || appt.sus) {
      const { data: masterPatient } = await supabase
        .from("master_patients")
        .select("*")
        .or(`cpf.eq.${appt.cpf},sus.eq.${appt.sus}`)
        .maybeSingle()
      masterData = masterPatient
    }

    setFormData({
      origin_id: origins[0]?.id || "",
      new_origin_name: "",
      cpf: appt.cpf || masterData?.cpf || "",
      sus: appt.sus || masterData?.sus || "",
      birth_date: masterData?.data_nascimento || appt.birth_date || "",
      state: masterData?.estado || appt.estado || "MA",
      city: masterData?.municipio || appt.municipio || "São Luís",
      chave_sisreg: appt.chave_sisreg || "",
      priority: "Sem Prioridade",
      receptionist_name: user?.name || "",
      is_encaixe: false
    })
    setSlotInfo(null)
  }

  const handleEditForwarded = async (appt: any) => {
    setSelectedAppt(appt)
    setConfirmedIds(appt.ids || [appt.id])
    setIsEditingReception(true)

    // Fetch Master Data
    let masterData: any = null
    if (appt.cpf || appt.sus) {
      const { data: masterPatient } = await supabase
        .from("master_patients")
        .select("*")
        .or(`cpf.eq.${appt.cpf},sus.eq.${appt.sus}`)
        .maybeSingle()
      masterData = masterPatient
    }

    setFormData({
      origin_id: appt.origin_id || origins[0]?.id || "",
      new_origin_name: "",
      cpf: appt.cpf || masterData?.cpf || "",
      sus: appt.sus || masterData?.sus || "",
      birth_date: masterData?.data_nascimento || appt.birth_date || "",
      state: masterData?.estado || appt.estado || "MA",
      city: masterData?.municipio || appt.municipio || "São Luís",
      chave_sisreg: appt.chave_sisreg || "",
      priority: appt.priority || "Sem Prioridade",
      receptionist_name: appt.receptionist_name || user?.name || "",
      is_encaixe: appt.is_encaixe || false
    })
    setSlotInfo(null)
  }

  const handleEncaixe = async (appt: any) => {
    setSelectedAppt(appt)
    setConfirmedIds(appt.ids || [appt.id])
    
    // Fetch Master Data
    let masterData: any = null
    if (appt.cpf || appt.sus) {
      const { data: masterPatient } = await supabase
        .from("master_patients")
        .select("*")
        .or(`cpf.eq.${appt.cpf},sus.eq.${appt.sus}`)
        .maybeSingle()
      masterData = masterPatient
    }

    setFormData({
      origin_id: origins[0]?.id || "",
      new_origin_name: "",
      cpf: appt.cpf || masterData?.cpf || "",
      sus: appt.sus || masterData?.sus || "",
      birth_date: masterData?.data_nascimento || appt.birth_date || "",
      state: masterData?.estado || appt.estado || "MA",
      city: masterData?.municipio || appt.municipio || "São Luís",
      chave_sisreg: appt.chave_sisreg || "",
      priority: "Sem Prioridade",
      receptionist_name: user?.name || "",
      is_encaixe: true
    })
    setIsEditingReception(false)
  }

  const handleNewEncaixe = () => {
    const defaultProc = dynamicProcedures[0] || ""
    const newId = 'NEW-' + Math.random().toString(36).substr(2, 9)
    const blankAppt = {
      id: 'MASTER-' + Math.random().toString(36).substr(2, 9),
      patient_name: "",
      exam_date: selectedDate,
      exam_time: format(new Date(), "HH:mm"),
      cpf: "",
      sus: "",
      isBlankEncaixe: true,
      raw_appointments: [
        {
          id: newId,
          procedure_name: defaultProc,
          exam_type: (dynamicTypes[defaultProc] || [])[0] || "",
          isNew: true
        }
      ]
    }
    setSelectedAppt(blankAppt)
    setConfirmedIds([newId])
    setFormData({
      origin_id: origins[0]?.id || "",
      new_origin_name: "",
      cpf: "",
      sus: "",
      birth_date: "",
      state: "MA",
      city: "São Luís",
      chave_sisreg: "",
      priority: "Sem Prioridade",
      receptionist_name: user?.name || "",
      is_encaixe: true
    })
    setSlotInfo(null)
  }

  const handleDeleteOrigin = async (e: any, id: string) => {
    e.preventDefault()
    if (confirm("Remover esta origem?")) {
      await supabase.from("exam_origins").delete().eq("id", id)
      loadData()
    }
  }

  const maskCPF = (v: string) => {
    v = v.replace(/\D/g, "")
    if (v.length > 11) v = v.substring(0, 11)
    return v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (confirmedIds.length === 0) {
      alert("Selecione ao menos um exame para confirmar a entrada.")
      return
    }

    if (selectedAppt.isBlankEncaixe && (!selectedAppt.patient_name || !selectedAppt.procedure_name)) {
      alert("Por favor, preencha o nome do paciente e o procedimento.")
      return
    }

    // Validação Chave SISREG obrigatória para origem SISREG
    const selectedOrigin = origins.find(o => o.id === formData.origin_id)
    if (selectedOrigin?.name?.toUpperCase() === "SISREG" && !formData.chave_sisreg.trim()) {
      alert("CHAVE SISREG É OBRIGATÓRIA PARA ESTA ORIGEM!")
      return
    }

    setIsLoading(true)
    try {
      let finalOriginId = formData.origin_id

      if (formData.origin_id === "NOVO" && formData.new_origin_name.trim() !== "") {
        const { data, error } = await supabase.from("exam_origins").insert([{ name: formData.new_origin_name.toUpperCase() }]).select().single()
        if (error) throw error
        finalOriginId = data.id
      }

      const cleanCPF = formData.cpf.replace(/\D/g, "")

      if (isEditingReception) {
        // 1. Atualizar Existentes
        const existingToUpdate = selectedAppt.raw_appointments.filter((a: any) => !a.isNew && confirmedIds.includes(a.id))
        if (existingToUpdate.length > 0) {
          await supabase.from("exam_appointments").update({
            origin_id: finalOriginId,
            cpf: cleanCPF,
            sus: formData.sus.replace(/\D/g, "") || undefined,
            birth_date: formData.birth_date,
            state: formData.state,
            city: formData.city,
            chave_sisreg: formData.chave_sisreg,
            priority: formData.priority,
            receptionist_name: formData.receptionist_name,
            updated_at: new Date().toISOString()
          }).in("id", existingToUpdate.map((a: any) => a.id))
        }

        // 2. Inserir Novos
        const newProcs = selectedAppt.raw_appointments.filter((a: any) => a.isNew)
        if (newProcs.length > 0) {
          await supabase.from("exam_appointments").insert(newProcs.map((p: any) => ({
            patient_name: selectedAppt.patient_name.toUpperCase(),
            exam_date: selectedDate,
            exam_time: selectedAppt.exam_time || format(new Date(), "HH:mm"),
            procedure_name: p.procedure_name,
            exam_type: p.exam_type,
            status: "aguardando",
            arrival_time: selectedAppt.arrival_time || new Date().toISOString(),
            origin_id: finalOriginId,
            cpf: cleanCPF,
            sus: formData.sus.replace(/\D/g, "") || undefined,
            birth_date: formData.birth_date,
            state: formData.state,
            city: formData.city,
            chave_sisreg: formData.chave_sisreg,
            priority: formData.priority,
            receptionist_name: formData.receptionist_name
          })))
        }

        // 3. Cancelar Removidos
        const allOriginalIds = selectedAppt.ids || []
        const removedIds = allOriginalIds.filter((id: string) => !confirmedIds.includes(id))
        if (removedIds.length > 0) {
          await supabase.from("exam_appointments").update({
            status: "cancelado",
            updated_at: new Date().toISOString()
          }).in("id", removedIds)
        }
      } else if (selectedAppt.isBlankEncaixe) {
        // Fluxo para NOVO AGENDA + ENTRADA DIRETA (Suporta múltiplos)
        const newProcs = selectedAppt.raw_appointments.filter((a: any) => confirmedIds.includes(a.id))
        if (newProcs.length === 0) {
          alert("Por favor, adicione e selecione ao menos um procedimento.")
          return
        }

        const { error: insertError } = await supabase.from("exam_appointments").insert(newProcs.map((p: any) => ({
          patient_name: selectedAppt.patient_name.toUpperCase(),
          exam_date: selectedDate,
          exam_time: selectedAppt.exam_time || format(new Date(), "HH:mm"),
          procedure_name: p.procedure_name,
          exam_type: p.exam_type,
          status: "aguardando",
          arrival_time: new Date().toISOString(),
          origin_id: finalOriginId,
          cpf: cleanCPF,
          sus: formData.sus.replace(/\D/g, "") || undefined,
          birth_date: formData.birth_date,
          state: formData.state,
          city: formData.city,
          chave_sisreg: formData.chave_sisreg,
          priority: formData.priority,
          receptionist_name: formData.receptionist_name
        })))

        if (insertError) throw insertError
      } else {
        // 1. Confirmados -> aguardando
        const { error: errorConfirm } = await supabase.from("exam_appointments").update({
          status: "aguardando",
          arrival_time: new Date().toISOString(),
          origin_id: finalOriginId,
          cpf: cleanCPF,
          sus: formData.sus.replace(/\D/g, "") || undefined,
          birth_date: formData.birth_date,
          state: formData.state,
          city: formData.city,
          chave_sisreg: formData.chave_sisreg,
          priority: formData.priority,
          receptionist_name: formData.receptionist_name
        }).in("id", confirmedIds)
  
        if (errorConfirm) throw errorConfirm
  
        // 2. Não Confirmados -> cancelado
        const allIds = selectedAppt.ids || [selectedAppt.id]
        const cancelledIds = allIds.filter((id: string) => !confirmedIds.includes(id))
  
        if (cancelledIds.length > 0) {
          await supabase.from("exam_appointments").update({
            status: "cancelado",
            updated_at: new Date().toISOString()
          }).in("id", cancelledIds)
        }
      }

      // 3. Sincronizar Cadastro Mestre
      await upsertMasterPatient({
        full_name: selectedAppt.patient_name,
        cpf: cleanCPF || undefined,
        sus: formData.sus || selectedAppt.sus,
        data_nascimento: formData.birth_date,
        municipio: formData.city,
        estado: formData.state,
        origem_cadastro: 'reception_arrival'
      })

      setSelectedAppt(null)
      setIsEditingReception(false)
      loadData()
      alert("Operação realizada com sucesso!")
    } catch (err) {
      console.error(err)
      alert("Erro ao confirmar chegada.")
    } finally {
      setIsLoading(false)
    }
  }

  const toggleExam = (id: string) => {
    setConfirmedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const calculatedAge = formData.birth_date ? differenceInYears(new Date(), parseISO(formData.birth_date)) : "--"

  return (
    <div className="h-full min-h-[800px] flex flex-row-reverse gap-8 animate-in fade-in duration-500 overflow-hidden relative">

      {/* RIGHT PANEL: ARRIVAL FORM */}
      <div className={`transition-all duration-700 ease-out h-full ${selectedAppt ? 'w-[550px] opacity-100 translate-x-0' : 'w-0 opacity-0 translate-x-full overflow-hidden'}`}>
        <div className="glass-premium rounded-[2.5rem] h-full flex flex-col overflow-hidden shadow-xl border border-emerald-500/15">
          <div className="p-8 border-b bg-emerald-600 text-white relative">
            <div className="flex items-center justify-between mb-2">
              <div className="h-10 w-10 flex items-center justify-center bg-white/20 rounded-xl"><CheckSquare className="h-6 w-6" /></div>
              <Button variant="ghost" size="icon" onClick={() => { setSelectedAppt(null); setIsEditingReception(false); }} className="h-10 w-10 text-white hover:bg-white/10 rounded-full"><X className="h-6 w-6" /></Button>
            </div>
            <h3 className="text-2xl font-black font-space uppercase tracking-tight">
              {isEditingReception ? "Editar Recepção" : "Protocolo de Entrada"}
            </h3>
            <div className="flex items-center gap-3">
              <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest mt-1 line-clamp-1">Paciente: {selectedAppt?.patient_name}</p>
              {formData.is_encaixe && (
                <span className="bg-amber-400 text-amber-900 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter animate-pulse">MODO ENCAIXE</span>
              )}
            </div>
          </div>

          {formData.is_encaixe && (
            <div className={`p-4 flex items-center justify-between border-b ${
              (selectedAppt?.procedure_name !== "Raio X" && (slotInfo === null || slotInfo.occupied >= slotInfo.total)) 
              ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
            }`}>
              <div className="flex items-center gap-2">
                {isCheckingSlots ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertCircle className="h-4 w-4" />}
                <span className="text-[10px] font-black uppercase tracking-widest">Disponibilidade de Vagas:</span>
              </div>
              <span className="text-xs font-black">
                {selectedAppt?.procedure_name === "Raio X" ? "ILIMITADO" : 
                 slotInfo === null ? "BLOQUEADO (SEM CONFIG.)" : 
                 slotInfo.occupied >= slotInfo.total ? "LOTADO" : 
                 `${slotInfo.occupied} / ${slotInfo.total}`}
              </span>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            <form id="arrival-form" onSubmit={handleSubmit} className="space-y-8 pb-10">
              <div className="space-y-6">
                
                {/* BLANK ENCAIXE FIELDS (NAME ONLY) */}
                {selectedAppt?.isBlankEncaixe && (
                  <div className="space-y-6 animate-in slide-in-from-top-4 duration-500">
                    <div className="space-y-2">
                      <Label className="uppercase text-[10px] font-black tracking-widest text-blue-600 ml-2">Nome Completo do Paciente</Label>
                      <Input 
                        required 
                        placeholder="DIGITAR NOME..." 
                        value={selectedAppt.patient_name} 
                        onChange={e => setSelectedAppt((p: any) => ({ ...p, patient_name: e.target.value.toUpperCase() }))} 
                        className="h-14 font-black uppercase bg-blue-50 border-blue-100 rounded-2xl" 
                      />
                    </div>
                  </div>
                )}

                {/* EXAM SELECTION SECTION (Unified for Encaixe and Existing) */}
                <div className="space-y-3 bg-emerald-50/50 p-6 rounded-3xl border border-emerald-100">
                  <div className="flex items-center justify-between ml-2">
                    <Label className="uppercase text-[10px] font-black tracking-widest text-emerald-600">Procedimentos a Realizar</Label>
                    {!selectedAppt?.isBlankEncaixe && <span className="text-[8px] font-bold text-emerald-400 uppercase tracking-widest">Selecione para Confirmar</span>}
                  </div>
                  <div className="space-y-2">
                    {(selectedAppt?.raw_appointments || []).map((exam: any) => {
                      const id = exam.id
                      const isConfirmed = confirmedIds.includes(id)
                      return (
                        <div key={id} className="group/item relative">
                          <button
                            key={id}
                            type="button"
                            onClick={() => toggleExam(id)}
                            className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${isConfirmed ? 'bg-white border-emerald-500 shadow-sm' : 'bg-slate-50 border-transparent opacity-60'}`}
                          >
                            <div className="flex flex-col items-start text-left">
                              <span className={`text-[11px] font-black uppercase ${isConfirmed ? 'text-emerald-700' : 'text-slate-500'}`}>{exam.procedure_name}</span>
                              <div className="flex items-baseline gap-2">
                                <span className="text-[9px] font-bold text-slate-400">{exam.exam_type || 'Padrão'}</span>
                                {exam.procedure_detail && (
                                  <span className="text-[8px] font-medium text-slate-300 italic truncate max-w-[160px]">SISREG: {exam.procedure_detail}</span>
                                )}
                              </div>
                            </div>
                            <div className={`h-6 w-6 rounded-full flex items-center justify-center border-2 ${isConfirmed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200 text-transparent'}`}>
                              {isConfirmed && <CheckSquare className="h-3 w-3" />}
                            </div>
                          </button>
                          
                          {(isEditingReception || (selectedAppt?.isBlankEncaixe && selectedAppt.raw_appointments.length > 1)) && (
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm("Deseja remover este procedimento?")) {
                                  setSelectedAppt((prev: any) => ({
                                    ...prev,
                                    raw_appointments: prev.raw_appointments.filter((a: any) => a.id !== id)
                                  }))
                                  setConfirmedIds(prev => prev.filter(i => i !== id))
                                }
                              }}
                              className="absolute -right-2 -top-2 h-6 w-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover/item:opacity-100 transition-opacity"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      )
                    })}

                    {(isEditingReception || selectedAppt?.isBlankEncaixe) && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          const newId = 'NEW-' + Math.random().toString(36).substr(2, 9)
                          const newProc = {
                            id: newId,
                            procedure_name: dynamicProcedures[0],
                            exam_type: (dynamicTypes[dynamicProcedures[0]] || [])[0] || "",
                            isNew: true
                          }
                          setSelectedAppt((prev: any) => ({
                            ...prev,
                            raw_appointments: [...(prev.raw_appointments || []), newProc]
                          }))
                          setConfirmedIds(prev => [...prev, newId])
                        }}
                        className="w-full h-12 border-dashed border-emerald-200 text-emerald-600 bg-emerald-50/50 hover:bg-emerald-50 rounded-2xl font-black text-[10px] uppercase tracking-widest gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Adicionar Procedimento
                      </Button>
                    )}
                  </div>

                  {(isEditingReception || (selectedAppt?.isBlankEncaixe && selectedAppt.raw_appointments.length > 0)) && (selectedAppt?.raw_appointments || []).filter((a: any) => a.isNew).map((newApp: any) => (
                    <div key={newApp.id} className="mt-4 p-4 bg-white border border-emerald-100 rounded-2xl space-y-3 shadow-inner">
                       <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                            <Activity className="h-3 w-3" />
                            Configurar Procedimento
                          </span>
                          <button onClick={() => {
                            setSelectedAppt((prev: any) => ({
                              ...prev,
                              raw_appointments: prev.raw_appointments.filter((a: any) => a.id !== newApp.id)
                            }))
                            setConfirmedIds(prev => prev.filter(i => i !== newApp.id))
                          }} className="text-red-400 hover:text-red-600"><X className="h-4 w-4"/></button>
                       </div>
                       <div className="grid grid-cols-1 gap-3">
                          <select 
                            value={newApp.procedure_name}
                            onChange={(e) => {
                              const val = e.target.value
                              setSelectedAppt((prev: any) => ({
                                ...prev,
                                raw_appointments: prev.raw_appointments.map((a: any) => a.id === newApp.id ? { ...a, procedure_name: val, exam_type: (dynamicTypes[val] || [])[0] || "" } : a)
                              }))
                            }}
                            className="w-full h-12 bg-slate-50 border-none rounded-xl px-4 font-black uppercase text-xs shadow-inner"
                          >
                            {dynamicProcedures.map(p => <option key={p} value={p}>{p}</option>)}
                          </select>
                          <select 
                            value={newApp.exam_type}
                            onChange={(e) => {
                              setSelectedAppt((prev: any) => ({
                                ...prev,
                                raw_appointments: prev.raw_appointments.map((a: any) => a.id === newApp.id ? { ...a, exam_type: e.target.value } : a)
                              }))
                            }}
                            className="w-full h-12 bg-slate-50 border-none rounded-xl px-4 font-black uppercase text-xs shadow-inner"
                          >
                            <option value="">PADRÃO / NENHUMA</option>
                            {(dynamicTypes[newApp.procedure_name] || []).map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                       </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 group">
                  <Label className="uppercase text-[10px] font-black tracking-widest text-slate-400 ml-2">Origem do Encaminhamento</Label>
                  <div className="flex gap-2">
                    <select required value={formData.origin_id} onChange={e => setFormData(p => ({ ...p, origin_id: e.target.value }))} className="flex-1 appearance-none bg-slate-50 border-none px-4 h-14 rounded-2xl text-sm font-bold shadow-inner focus:ring-2 focus:ring-emerald-500/20 uppercase transition-all">
                      {origins.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                      <option value="NOVO" className="font-black text-emerald-600">+ NOVA UNIDADE</option>
                    </select>
                    {formData.origin_id && formData.origin_id !== "NOVO" && user?.role === "admin" && (
                      <Button type="button" size="icon" variant="ghost" className="h-14 w-14 rounded-2xl bg-red-50 text-red-400 hover:bg-red-500 hover:text-white" onClick={(e) => handleDeleteOrigin(e, formData.origin_id)}>
                        <Trash className="h-5 w-5" />
                      </Button>
                    )}
                  </div>
                </div>

                {formData.origin_id === "NOVO" && (
                  <div className="animate-in zoom-in duration-300">
                    <Label className="uppercase text-[10px] font-black tracking-widest text-emerald-600 ml-2">Nova Unidade</Label>
                    <Input required placeholder="DIGITE O NOME..." value={formData.new_origin_name} onChange={e => setFormData(p => ({ ...p, new_origin_name: e.target.value }))} className="h-14 font-black uppercase bg-emerald-50 border-emerald-200 rounded-2xl" />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="uppercase text-[10px] font-black tracking-widest text-slate-400 ml-2">Nascimento</Label>
                    <Input type="date" required value={formData.birth_date} onChange={e => setFormData(p => ({ ...p, birth_date: e.target.value }))} className="h-14 font-bold bg-slate-50 border-none rounded-2xl text-center shadow-inner" />
                  </div>
                  <div className="space-y-2">
                    <Label className="uppercase text-[10px] font-black tracking-widest text-slate-400 ml-2">Idade Atual</Label>
                    <div className="h-14 flex items-center justify-center bg-slate-100/50 rounded-2xl font-black text-slate-500 border-2 border-dashed border-slate-200">{calculatedAge} ANOS</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="uppercase text-[10px] font-black tracking-widest text-slate-400 ml-2">CPF do Paciente</Label>
                  <div className="relative">
                    <Input placeholder="000.000.000-00" value={formData.cpf} onChange={e => setFormData(p => ({ ...p, cpf: maskCPF(e.target.value) }))} className="h-14 pl-12 font-bold bg-slate-50 border-none rounded-2xl text-center shadow-inner" />
                    <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-500" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="uppercase text-[10px] font-black tracking-widest text-slate-400 ml-2">Cartão SUS</Label>
                  <div className="relative">
                    <Input
                      placeholder="000 0000 0000 0000"
                      value={formData.sus}
                      onChange={e => {
                        const v = e.target.value.replace(/\D/g, "").substring(0, 15)
                        setFormData(p => ({ ...p, sus: v }))
                      }}
                      className="h-14 pl-12 font-bold bg-slate-50 border-none rounded-2xl text-center shadow-inner tracking-widest"
                    />
                    <Users className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-emerald-500" />
                  </div>
                </div>

                <SearchableSelect label="Estado (UF)" options={estados} value={formData.state} onChange={(val: string) => setFormData(p => ({ ...p, state: val, city: "" }))} icon={MapPin} />
                <SearchableSelect label="Cidade" options={municipios} value={formData.city} onChange={(val: string) => setFormData(p => ({ ...p, city: val }))} icon={Search} disabled={!formData.state} />

                <div className="space-y-2">
                  <Label className="uppercase text-[10px] font-black tracking-widest text-slate-400 ml-2">Chave de Protocolo (SISREG)</Label>
                  <div className="relative">
                    <Input 
                      type="text" 
                      placeholder="APENAS NÚMEROS..." 
                      value={formData.chave_sisreg === 'IMPORT_SISREG' ? '' : formData.chave_sisreg} 
                      onChange={e => {
                        const v = e.target.value.replace(/\D/g, "")
                        setFormData(p => ({ ...p, chave_sisreg: v }))
                      }} 
                      className="h-14 pl-12 font-black text-center tracking-widest bg-slate-50 border-none rounded-2xl shadow-inner uppercase" 
                    />
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-amber-500" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="uppercase text-[10px] font-black tracking-widest text-red-500 ml-2">Classificação de Prioridade</Label>
                  <select value={formData.priority} onChange={e => setFormData(p => ({ ...p, priority: e.target.value }))} className="w-full h-14 bg-red-50/50 border-red-100 border-2 text-red-600 font-black uppercase text-xs rounded-2xl px-4 cursor-pointer focus:ring-0">
                    <option value="Sem Prioridade">NORMAL (SEM PRIORIDADE)</option>
                    <option value="Idoso (+60)">Idoso (+60)</option>
                    <option value="Gestante / Lactante">Gestante / Lactante</option>
                    <option value="PcD">Pessoa com Deficiência (PcD)</option>
                    <option value="Autismo (TEA)">Autismo (TEA)</option>
                    <option value="Criança de Colo">Criança de Colo</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className="uppercase text-[10px] font-black tracking-widest text-slate-400 ml-2">Responsável Técnica</Label>
                  <div className="h-14 flex items-center px-6 bg-slate-100 rounded-2xl text-slate-400 font-black text-xs uppercase shadow-inner border border-slate-200/50">{user?.name || "LOGADO"}</div>
                </div>
              </div>
            </form>
          </div>

          <div className="p-8 border-t bg-slate-50/50">
            <Button 
              form="arrival-form" 
              type="submit" 
              disabled={isLoading || (
                formData.is_encaixe && 
                selectedAppt?.procedure_name !== "Raio X" && 
                (slotInfo === null || slotInfo.occupied >= slotInfo.total)
              )} 
              className={`w-full h-16 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl gap-4 transition-all active:scale-95 group ${
                formData.is_encaixe && 
                selectedAppt?.procedure_name !== "Raio X" && 
                (slotInfo === null || slotInfo.occupied >= slotInfo.total) 
                ? 'bg-slate-300 shadow-none' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'
              }`}
            >
              {isLoading ? <Loader2 className="animate-spin h-6 w-6" /> : <Send className="h-6 w-6 group-hover:translate-x-1 transition-transform" />}
              {isEditingReception ? "Salvar Alterações" : formData.is_encaixe ? "Confirmar Encaixe" : "Confirmar Chegada"}
            </Button>
          </div>
        </div>
      </div>

      {/* LEFT PANEL: WAIT LIST */}
      <div className={`flex-1 transition-all duration-700 ${selectedAppt ? 'translate-x-0' : '-translate-x-0'}`}>
        <div className="glass-premium rounded-[2.5rem] p-7 lg:p-9 shadow-premium h-full flex flex-col relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
            <div>
              <h2 className="text-3xl font-black font-space uppercase tracking-tight flex items-center gap-4 text-slate-800">
                <div className={`p-4 ${queueView === 'waiting' ? 'bg-emerald-600' : 'bg-blue-600'} text-white rounded-[1.5rem] shadow-xl shadow-emerald-500/10`}>
                  {queueView === 'waiting' ? <Users className="h-7 w-7" /> : <Send className="h-7 w-7" />}
                </div>
                {queueView === 'waiting' ? "Fila de Triagem / Recepção" : "Pacientes Encaminhados"}
              </h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-3 ml-20">
                {queueView === 'waiting' ? "Controle Dinâmico de Pacientes Aguardando" : "Gestão de Atendimentos em Curso"}
              </p>
            </div>

            <div className="flex flex-col items-center gap-4">
               <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-inner">
                  <button 
                    onClick={() => setQueueView('waiting')}
                    className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${queueView === 'waiting' ? 'bg-white text-emerald-600 shadow-md ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    Aguardando Entrada
                  </button>
                  <button 
                    onClick={() => setQueueView('forwarded')}
                    className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${queueView === 'forwarded' ? 'bg-white text-blue-600 shadow-md ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    Já Encaminhados
                  </button>
               </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 bg-white p-3 rounded-2xl shadow-sm border border-slate-100">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                <input 
                  type="text" 
                  placeholder="Pesquisar paciente..." 
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="h-12 pl-12 pr-4 w-64 bg-slate-50 border-none rounded-xl text-xs font-black uppercase tracking-wider focus:ring-2 focus:ring-emerald-500/20 transition-all"
                />
              </div>
              <div className="h-12 w-[1.5px] bg-slate-100" />
                <input 
                  type="date" 
                  value={selectedDate}
                  onChange={(e: any) => setSelectedDate(e.target.value)}
                  className="h-12 px-4 bg-slate-50 border-none rounded-xl text-xs font-black uppercase focus:ring-2 focus:ring-emerald-500/20 transition-all"
                />
                <div className="flex items-center gap-2">
                  <div className={`px-4 py-2.5 ${queueView === 'waiting' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-blue-50 text-blue-600 border-blue-100'} rounded-xl flex items-center gap-2.5 border`}>
                    <div className={`h-2 w-2 rounded-full ${queueView === 'waiting' ? 'bg-emerald-500' : 'bg-blue-500'} animate-pulse`} />
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      {(queueView === 'waiting' ? appointments : forwardedAppointments).length} REGISTROS
                    </span>
                  </div>

                  <Button
                    onClick={handleNewEncaixe}
                    className="h-12 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-black uppercase text-[10px] tracking-widest shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 transition-all gap-2"
                  >
                    <Activity className="h-4 w-4" />
                    Encaixe
                  </Button>
                </div>
              </div>
            </div>

          {isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-slate-400">
              <Loader2 className="h-12 w-12 animate-spin text-emerald-500" />
              <span className="text-[10px] font-black uppercase tracking-widest animate-pulse">Consultando Banco...</span>
            </div>
          ) : (queueView === 'waiting' ? appointments : forwardedAppointments).filter(a => 
            a.patient_name.toLowerCase().includes(searchFilter.toLowerCase()) || 
            (a.cpf && a.cpf.includes(searchFilter)) || 
            (a.sus && a.sus.includes(searchFilter))
          ).length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-slate-300">
              <Search className="h-12 w-12" />
              <span className="text-[10px] font-black uppercase tracking-widest">Nenhum paciente encontrado</span>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-10">
              <div className="grid grid-cols-1 gap-4">
                {(queueView === 'waiting' ? appointments : forwardedAppointments)
                  .filter(a => 
                    a.patient_name.toLowerCase().includes(searchFilter.toLowerCase()) || 
                    (a.cpf && a.cpf.includes(searchFilter)) || 
                    (a.sus && a.sus.includes(searchFilter))
                  )
                  .map(a => (
                    <div key={a.id} className={`p-5 rounded-[1.75rem] transition-all duration-500 border flex items-center justify-between group ${selectedAppt?.id === a.id ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-400/60 shadow-lg shadow-emerald-500/10' : 'bg-white/90 border-slate-100 hover:border-emerald-200/80 hover:shadow-md hover:-translate-y-0.5'}`}>
                    <div className="flex items-center gap-6">
                      <div className={`h-16 w-16 rounded-[1.5rem] flex items-center justify-center font-black text-2xl transition-all duration-500 ${selectedAppt?.id === a.id ? 'bg-emerald-600 text-white scale-110 rotate-3' : 'bg-slate-50 text-slate-400 group-hover:bg-emerald-100 group-hover:text-emerald-600 group-hover:-rotate-3'}`}>
                        {a.patient_name.charAt(0)}
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-black text-lg text-slate-800 uppercase tracking-tight">{a.patient_name}</h4>
                        <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                          <span className="flex items-center gap-1.5">
                            <Clock className={`h-3 w-3 ${queueView === 'waiting' ? 'text-emerald-500' : 'text-blue-500'}`} /> 
                            {a.exam_time} • {a.exam_date ? format(new Date(a.exam_date + "T00:00:00"), "dd/MM/yyyy") : "Sem Data"}
                          </span>
                          <span className={`px-2 py-0.5 ${queueView === 'waiting' ? 'bg-blue-50 text-blue-600' : 'bg-indigo-50 text-indigo-600'} rounded-md font-black`}>{a.procedure_name}</span>
                          {a.isGrouped && (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-md font-black italic">Agrupado</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="hidden md:flex flex-col items-end mr-4">
                        <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Doc. Identificação</span>
                        <span className="text-xs font-black text-slate-500 tabular-nums lowercase">{a.cpf ? 'cpf: ' + a.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4") : 'sus: ' + a.sus}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => queueView === 'waiting' ? handleSelectAppt(a) : handleEditForwarded(a)}
                          className={`h-14 px-8 rounded-2xl gap-3 font-black uppercase text-xs tracking-widest transition-all ${selectedAppt?.id === a.id && !formData.is_encaixe ? 'bg-emerald-700 text-white shadow-none' : (queueView === 'waiting' ? 'bg-emerald-600' : 'bg-blue-600') + ' text-white shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/30'}`}
                        >
                          {selectedAppt?.id === a.id && !formData.is_encaixe ? (
                            <ChevronRight className="h-5 w-5 animate-bounce-horizontal" />
                          ) : queueView === 'waiting' ? (
                            <CheckSquare className="h-5 w-5" />
                          ) : (
                            <Edit className="h-5 w-5" />
                          )}
                          {selectedAppt?.id === a.id && !formData.is_encaixe ? "Editando..." : queueView === 'waiting' ? "Registrar Entrada" : "Editar Recepção"}
                        </Button>
                      </div>

                      {user?.role === "admin" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={async () => {
                            if (confirm("Excluir agendamento(s) permanentemente?")) {
                              await supabase.from("exam_appointments").delete().in("id", a.ids)
                              loadData()
                            }
                          }}
                          className="h-14 w-14 rounded-2xl bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all border border-slate-100"
                        >
                          <Trash className="h-5 w-5" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  )
}
