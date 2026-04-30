"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { 
  Users, Clock, Loader2, 
  Search, ChevronRight, X, 
  CheckSquare, Plus, Trash2, AlertTriangle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { format, parseISO, differenceInYears } from "date-fns"
import { searchMasterPatients, upsertMasterPatient } from "@/lib/patient-search"
import { useAuth } from "@/lib/auth-context"

// ---------- Types ----------
type ExamItem = { id: string; procedure_name: string; exam_type: string }

export default function ChegadaTab() {
  const [loading, setLoading] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [appointments, setAppointments] = useState<any[]>([])
  const [selectedAppt, setSelectedAppt] = useState<any>(null)
  const [confirmedIds, setConfirmedIds] = useState<string[]>([])
  const [origins, setOrigins] = useState<any[]>([])
  const [dynamicProcedures, setDynamicProcedures] = useState<string[]>([])
  const [dynamicTypes, setDynamicTypes] = useState<Record<string, string[]>>({})
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))

  // Encaixe state
  const [showEncaixe, setShowEncaixe] = useState(false)
  const [encaixeSearch, setEncaixeSearch] = useState("")
  const [encaixeResults, setEncaixeResults] = useState<any[]>([])
  const [encaixeForm, setEncaixeForm] = useState({
    patient_name: "",
    cpf: "",
    sus: "",
    birth_date: "",
    priority: "Sem Prioridade",
    origin_id: "",
    chave_sisreg: "",
    new_origin_name: ""
  })
  const [encaixeExams, setEncaixeExams] = useState<ExamItem[]>([{ id: "1", procedure_name: "", exam_type: "" }])
  const [slotWarnings, setSlotWarnings] = useState<Record<string, string>>({})
  const [isSubmittingEncaixe, setIsSubmittingEncaixe] = useState(false)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Arrival protocol state
  const [formData, setFormData] = useState<any>({
    patient_name: "",
    birth_date: "",
    cpf: "",
    sus: "",
    state: "MA",
    city: "",
    origin_id: "",
    new_origin_name: "",
    clave_sisreg: "",
    priority: "Sem Prioridade",
    is_encaixe: false
  })

  const { user } = useAuth()
  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), [])

  useEffect(() => {
    loadData()
    loadConfig()
  }, [selectedDate])

  async function loadConfig() {
    const { data: oData } = await supabase.from("exam_origins").select("*").order("name")
    setOrigins(oData || [])
    const { data: pData } = await supabase.from("exam_procedures_list").select("name")
    const { data: tData } = await supabase.from("exam_types_list").select("name, procedure_name")
    const procedures = (pData || []).map(p => p.name)
    setDynamicProcedures(procedures)
    const typeMap = (tData || []).reduce((acc: any, curr: any) => {
      if (!acc[curr.procedure_name]) acc[curr.procedure_name] = []
      acc[curr.procedure_name].push(curr.name)
      return acc
    }, {})
    setDynamicTypes(typeMap)
    if (procedures.length > 0) {
      setEncaixeExams([{ id: "1", procedure_name: procedures[0], exam_type: typeMap[procedures[0]]?.[0] || "" }])
    }
  }

  async function loadData() {
    try {
      setLoading(true)
      const { data: appts } = await supabase
        .from("exam_appointments")
        .select("*")
        .eq("status", "agendado")
        .eq("exam_date", selectedDate)
        .order("exam_time")

      const grouped = (appts || []).reduce((acc: any[], curr: any) => {
        const key = `${curr.patient_name}-${curr.exam_time}`
        let exists = acc.find(a => `${a.patient_name}-${a.exam_time}` === key)
        if (!exists) {
          exists = { ...curr, ids: [curr.id], raw_appointments: [curr] }
          acc.push(exists)
        } else {
          exists.ids.push(curr.id)
          exists.raw_appointments.push(curr)
        }
        return acc
      }, [])

      setAppointments(grouped)
    } finally {
      setLoading(false)
    }
  }

  const maskCPF = (v: string) => {
    v = v.replace(/\D/g, "")
    if (v.length > 11) v = v.substring(0, 11)
    return v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
  }

  const handleSelectAppt = (appt: any) => {
    setSelectedAppt(appt)
    setConfirmedIds(appt.ids || [])
    setFormData({
      patient_name: appt.patient_name,
      birth_date: appt.birth_date || "",
      cpf: maskCPF(appt.cpf || ""),
      sus: appt.sus || "",
      state: appt.estado || "MA",
      city: appt.municipio || "",
      origin_id: appt.origin_id || "",
      clave_sisreg: appt.chave_sisreg || "",
      priority: appt.priority || "Sem Prioridade",
      is_encaixe: false,
      new_origin_name: ""
    })
  }

  // Determine if selected origin is SISREG
  const isProtocoloSisreg = useMemo(() => {
    if (!formData.origin_id) return false
    const origin = origins.find(o => o.id === formData.origin_id)
    return origin?.name?.toUpperCase().includes("SISREG") || false
  }, [formData.origin_id, origins])

  const isEncaixeSisreg = useMemo(() => {
    if (!encaixeForm.origin_id) return false
    const origin = origins.find(o => o.id === encaixeForm.origin_id)
    return origin?.name?.toUpperCase().includes("SISREG") || false
  }, [encaixeForm.origin_id, origins])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Validate SISREG key if required
    if (isProtocoloSisreg && !formData.clave_sisreg.trim()) {
      alert("Chave SISREG é obrigatória quando a unidade de origem é SISREG.")
      return
    }
    setIsLoading(true)
    try {
      let finalOriginId = formData.origin_id
      if (finalOriginId === "NOVO") {
        const { data: newO, error: oErr } = await supabase.from("exam_origins").insert([{ name: formData.new_origin_name.toUpperCase() }]).select().single()
        if (oErr) throw oErr
        finalOriginId = newO.id
      }

      const cleanCPF = formData.cpf.replace(/\D/g, "")
      await supabase.from("exam_appointments").update({
        status: 'presente',
        arrival_time: new Date().toISOString(),
        origin_id: finalOriginId,
        priority: formData.priority,
        chave_sisreg: formData.clave_sisreg,
        birth_date: formData.birth_date,
        cpf: cleanCPF || undefined,
        sus: formData.sus || undefined
      }).in("id", confirmedIds)

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
      loadData()
      alert("Chegada confirmada!")
    } catch (err) {
      console.error(err)
      alert("Erro ao confirmar")
    } finally {
      setIsLoading(false)
    }
  }

  const handleEncaixeSearch = async (val: string) => {
    setEncaixeSearch(val)
    setEncaixeForm(prev => ({ ...prev, patient_name: val }))
    
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)

    if (val.length < 3) { setEncaixeResults([]); return }

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await searchMasterPatients(val)
        setEncaixeResults(results)
      } catch { }
    }, 400)
  }

  const handleEncaixeSelectPatient = (p: any) => {
    setEncaixeForm(prev => ({
      ...prev,
      patient_name: (p.full_name || p.paciente || "").toUpperCase(),
      cpf: maskCPF(p.cpf || ""),
      sus: p.sus || "",
      birth_date: p.data_nascimento || ""
    }))
    setEncaixeResults([])
    setEncaixeSearch("")
  }

  // Check slot availability for a given procedure
  const checkSlot = async (examId: string, procedureName: string) => {
    if (!procedureName) return
    try {
      const { data } = await supabase
        .from("exam_slots")
        .select("total_slots")
        .eq("exam_date", selectedDate)
        .eq("procedure_name", procedureName)
        .single()

      if (data) {
        const { count } = await supabase
          .from("exam_appointments")
          .select("id", { count: "exact", head: true })
          .eq("exam_date", selectedDate)
          .eq("procedure_name", procedureName)
          .neq("status", "cancelado")
        
        const used = count || 0
        const available = data.total_slots - used
        setSlotWarnings(prev => ({
          ...prev,
          [examId]: available <= 0 
            ? `⚠️ VAGAS ESGOTADAS (${data.total_slots}/${data.total_slots})` 
            : available <= 2 
              ? `⚡ Atenção: apenas ${available} vaga(s)` 
              : ""
        }))
      } else {
        setSlotWarnings(prev => ({ ...prev, [examId]: "" }))
      }
    } catch {
      setSlotWarnings(prev => ({ ...prev, [examId]: "" }))
    }
  }

  const addEncaixeExam = () => {
    const newId = Date.now().toString()
    const defaultProc = dynamicProcedures[0] || ""
    setEncaixeExams(prev => [...prev, { 
      id: newId, 
      procedure_name: defaultProc, 
      exam_type: dynamicTypes[defaultProc]?.[0] || "" 
    }])
  }

  const removeEncaixeExam = (id: string) => {
    if (encaixeExams.length <= 1) return
    setEncaixeExams(prev => prev.filter(e => e.id !== id))
    setSlotWarnings(prev => { const n = { ...prev }; delete n[id]; return n })
  }

  const updateEncaixeExam = (id: string, field: string, value: string) => {
    setEncaixeExams(prev => prev.map(e => {
      if (e.id !== id) return e
      const updated = { ...e, [field]: value }
      if (field === "procedure_name") {
        updated.exam_type = dynamicTypes[value]?.[0] || ""
        checkSlot(id, value)
      }
      return updated
    }))
  }

  const handleSubmitEncaixe = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isEncaixeSisreg && !encaixeForm.chave_sisreg.trim()) {
      alert("Chave SISREG é obrigatória quando a unidade de origem é SISREG.")
      return
    }
    setIsSubmittingEncaixe(true)
    try {
      let finalOriginId = encaixeForm.origin_id
      if (finalOriginId === "NOVO") {
        const { data: newO, error: oErr } = await supabase.from("exam_origins").insert([{ name: encaixeForm.new_origin_name.toUpperCase() }]).select().single()
        if (oErr) throw oErr
        finalOriginId = newO.id
      }

      const cleanCPF = encaixeForm.cpf.replace(/\D/g, "")
      const userName = user?.name || "RECEPÇÃO"
      const inserts = encaixeExams.map(exam => ({
        patient_name: encaixeForm.patient_name.toUpperCase(),
        cpf: cleanCPF,
        sus: encaixeForm.sus,
        exam_date: selectedDate,
        exam_time: format(new Date(), 'HH:mm'),
        procedure_name: exam.procedure_name,
        exam_type: exam.exam_type,
        status: 'presente',
        arrival_time: new Date().toISOString(),
        origin_id: finalOriginId || null,
        chave_sisreg: encaixeForm.chave_sisreg,
        priority: encaixeForm.priority,
        birth_date: encaixeForm.birth_date,
        is_encaixe: true,
        receptionist_name: userName
      }))

      const { error } = await supabase.from("exam_appointments").insert(inserts)
      if (error) throw error

      await upsertMasterPatient({
        full_name: encaixeForm.patient_name.toUpperCase(),
        cpf: cleanCPF || undefined,
        sus: encaixeForm.sus || undefined,
        origem_cadastro: 'reception_arrival'
      })

      setShowEncaixe(false)
      const defaultProc = dynamicProcedures[0] || ""
      setEncaixeForm({ patient_name: "", cpf: "", sus: "", birth_date: "", priority: "Sem Prioridade", origin_id: "", chave_sisreg: "", new_origin_name: "" })
      setEncaixeExams([{ id: "1", procedure_name: defaultProc, exam_type: dynamicTypes[defaultProc]?.[0] || "" }])
      setSlotWarnings({})
      alert(`Encaixe registrado: ${inserts.length} procedimento(s).`)
    } catch (err) {
      console.error(err)
      alert("Erro ao registrar encaixe")
    } finally {
      setIsSubmittingEncaixe(false)
    }
  }

  const filteredAppointments = useMemo(() => {
    if (!searchTerm) return appointments
    const s = searchTerm.toLowerCase()
    return appointments.filter(a =>
      a.patient_name.toLowerCase().includes(s) ||
      (a.cpf && a.cpf.includes(searchTerm)) ||
      (a.sus && a.sus.includes(searchTerm))
    )
  }, [appointments, searchTerm])

  const calculatedAge = formData.birth_date ? differenceInYears(new Date(), parseISO(formData.birth_date)) : "--"

  if (loading) return <div className="h-96 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-teal-500" /></div>

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* HEADER CONTROLS */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-teal-50 text-teal-600 rounded-xl border border-teal-100">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 uppercase tracking-tight">Pacientes Agendados</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Recepção / Chegada</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 flex flex-col min-w-[140px]">
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Data</span>
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="bg-transparent border-none outline-none text-xs font-bold text-slate-700 p-0 mt-0.5"
              />
            </div>
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar paciente..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="h-10 pl-10 bg-white border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:border-teal-400 outline-none shadow-sm"
              />
            </div>
            <div className="h-10 px-5 bg-teal-50 border border-teal-100 rounded-xl flex items-center gap-2 shrink-0">
              <span className="text-[10px] font-bold text-teal-600 uppercase tracking-wider">Saldo:</span>
              <span className="text-sm font-bold text-teal-700">{filteredAppointments.length}</span>
            </div>
            <Button
              onClick={() => setShowEncaixe(true)}
              className="h-10 px-5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold uppercase text-[10px] tracking-wider gap-2 shadow-sm"
            >
              <Plus className="h-4 w-4" />
              Encaixe
            </Button>
          </div>
        </div>
      </div>

      {/* PATIENT LIST */}
      {filteredAppointments.length === 0 ? (
        <div className="bg-white rounded-2xl py-24 text-center border border-slate-100 shadow-sm">
          <div className="flex flex-col items-center gap-4 opacity-40">
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200"><Clock className="h-10 w-10 text-slate-400" /></div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Nenhum agendamento para esta data</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredAppointments.map(appt => (
            <div
              key={`${appt.patient_name}-${appt.exam_time}`}
              onClick={() => handleSelectAppt(appt)}
              className={`bg-white rounded-2xl p-5 border cursor-pointer group transition-all hover:shadow-md hover:border-teal-300 hover:-translate-y-0.5 ${selectedAppt?.patient_name === appt.patient_name && selectedAppt?.exam_time === appt.exam_time ? 'border-teal-400 shadow-md bg-teal-50/30' : 'border-slate-100 shadow-sm'}`}
            >
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center font-bold text-xl text-teal-600 group-hover:bg-teal-500 group-hover:text-white transition-colors shrink-0">
                  {appt.patient_name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">{appt.exam_time}</span>
                    <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-teal-500 transition-colors" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 uppercase tracking-tight truncate">{appt.patient_name}</h4>
                  <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">
                    {appt.raw_appointments.length > 1 ? `${appt.raw_appointments.length} PROCEDIMENTOS` : appt.procedure_name}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ============ SLIDE-IN ARRIVAL PROTOCOL ============ */}
      <Sheet open={!!selectedAppt} onOpenChange={open => !open && setSelectedAppt(null)}>
        <SheetContent side="right" className="w-[500px] sm:max-w-[540px] p-0 border-l border-slate-200 bg-slate-50 flex flex-col shadow-xl overflow-hidden">
          <div className="p-6 bg-teal-500 text-white shrink-0">
            <div className="flex items-center justify-between mb-3">
              <div className="h-9 w-9 bg-white/20 rounded-xl flex items-center justify-center">
                <CheckSquare className="h-5 w-5" />
              </div>
              <button onClick={() => setSelectedAppt(null)} className="h-9 w-9 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <h3 className="text-xl font-bold uppercase tracking-tight">Protocolo de Entrada</h3>
            <p className="text-teal-100 text-[10px] font-bold uppercase tracking-wider mt-0.5">{selectedAppt?.patient_name}</p>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            <form id="arrival-form" onSubmit={handleSubmit} className="space-y-5">
              {/* Exames confirmados */}
              <div className="space-y-2">
                <Label className="uppercase text-[9px] font-bold tracking-wider text-slate-500 ml-1">Exames Confirmados</Label>
                {(selectedAppt?.raw_appointments || []).map((exam: any) => {
                  const isConfirmed = confirmedIds.includes(exam.id)
                  return (
                    <button
                      key={exam.id}
                      type="button"
                      onClick={() => setConfirmedIds(prev => prev.includes(exam.id) ? prev.filter(i => i !== exam.id) : [...prev, exam.id])}
                      className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left ${isConfirmed ? 'bg-teal-50 border-teal-400' : 'bg-white border-slate-200 opacity-60 hover:opacity-100'}`}
                    >
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-800 uppercase">{exam.procedure_name}</span>
                        <span className="text-[9px] font-bold text-slate-500 uppercase">{exam.exam_type}</span>
                      </div>
                      <div className={`h-5 w-5 rounded-md border-2 flex items-center justify-center shrink-0 ${isConfirmed ? 'bg-teal-500 border-teal-500' : 'border-slate-300'}`}>
                        {isConfirmed && <CheckSquare className="h-3 w-3 text-white" />}
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Dados do paciente */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="uppercase text-[9px] font-bold tracking-wider text-slate-500 ml-1">Nascimento</Label>
                  <Input type="date" value={formData.birth_date} onChange={e => setFormData((p: any) => ({ ...p, birth_date: e.target.value }))} className="h-11 bg-white border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:border-teal-400 outline-none" />
                </div>
                <div className="space-y-1">
                  <Label className="uppercase text-[9px] font-bold tracking-wider text-slate-500 ml-1">Idade</Label>
                  <div className="h-11 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-center font-bold text-slate-600 text-xs uppercase">{calculatedAge} anos</div>
                </div>
              </div>

              {/* CPF + CNS */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="uppercase text-[9px] font-bold tracking-wider text-slate-500 ml-1">CPF <span className="text-slate-300">(opcional)</span></Label>
                  <Input
                    value={formData.cpf}
                    onChange={e => setFormData((p: any) => ({ ...p, cpf: maskCPF(e.target.value) }))}
                    placeholder="000.000.000-00"
                    className="h-11 bg-white border-slate-200 rounded-xl text-xs font-bold text-slate-700 text-center focus:border-teal-400 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="uppercase text-[9px] font-bold tracking-wider text-slate-500 ml-1">CNS / SUS <span className="text-slate-300">(opcional)</span></Label>
                  <Input
                    value={formData.sus}
                    onChange={e => setFormData((p: any) => ({ ...p, sus: e.target.value }))}
                    placeholder="000 0000 0000 0000"
                    className="h-11 bg-white border-slate-200 rounded-xl text-xs font-bold text-slate-700 text-center focus:border-teal-400 outline-none"
                  />
                </div>
              </div>

              {/* Prioridade */}
              <div className="space-y-1">
                <Label className="uppercase text-[9px] font-bold tracking-wider text-slate-500 ml-1">Prioridade</Label>
                <select value={formData.priority} onChange={e => setFormData((p: any) => ({ ...p, priority: e.target.value }))} className="w-full h-11 bg-white border border-slate-200 rounded-xl px-4 font-bold uppercase text-xs text-slate-700 outline-none focus:border-teal-400">
                  <option value="Sem Prioridade">NORMAL</option>
                  <option value="Idoso (60+)">IDOSO 60+</option>
                  <option value="Gestante">GESTANTE</option>
                  <option value="Prioritário">PRIORITÁRIO</option>
                </select>
              </div>

              {/* Unidade de Origem */}
              <div className="space-y-1">
                <Label className="uppercase text-[9px] font-bold tracking-wider text-slate-500 ml-1">Unidade de Origem</Label>
                <select value={formData.origin_id} onChange={e => setFormData((p: any) => ({ ...p, origin_id: e.target.value }))} className="w-full h-11 bg-white border border-slate-200 rounded-xl px-4 font-bold uppercase text-xs text-slate-700 outline-none focus:border-teal-400">
                  <option value="">SELECIONAR...</option>
                  {origins.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                  <option value="NOVO">+ CADASTRAR NOVA</option>
                </select>
              </div>
              {formData.origin_id === "NOVO" && (
                <Input placeholder="NOME DA UNIDADE..." value={formData.new_origin_name} onChange={e => setFormData((p: any) => ({ ...p, new_origin_name: e.target.value.toUpperCase() }))} className="h-11 bg-orange-50 border-orange-200 rounded-xl text-xs font-bold text-slate-700 focus:border-orange-400 outline-none" />
              )}

              {/* Chave SISREG — obrigatória só se origem for SISREG */}
              <div className="space-y-1">
                <Label className="uppercase text-[9px] font-bold tracking-wider text-slate-500 ml-1">
                  Chave SISREG {isProtocoloSisreg ? <span className="text-rose-500 ml-1">*obrigatória</span> : <span className="text-slate-300">(opcional)</span>}
                </Label>
                <Input
                  value={formData.clave_sisreg}
                  onChange={e => setFormData((p: any) => ({ ...p, clave_sisreg: e.target.value }))}
                  required={isProtocoloSisreg}
                  placeholder={isProtocoloSisreg ? "OBRIGATÓRIO - APENAS NÚMEROS" : "APENAS NÚMEROS..."}
                  className={`h-11 rounded-xl text-xs font-bold text-slate-700 outline-none ${isProtocoloSisreg ? 'bg-rose-50 border-rose-200 focus:border-rose-400' : 'bg-white border-slate-200 focus:border-teal-400'}`}
                />
              </div>
            </form>
          </div>

          <div className="p-6 border-t border-slate-100 bg-white shrink-0">
            <Button form="arrival-form" type="submit" disabled={isLoading} className="w-full h-12 bg-teal-500 hover:bg-teal-600 text-white rounded-xl font-bold uppercase tracking-wider text-xs transition-all shadow-sm">
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Confirmar Recebimento"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* ============ ENCAIXE SHEET ============ */}
      <Sheet open={showEncaixe} onOpenChange={setShowEncaixe}>
        <SheetContent side="right" className="w-[500px] sm:max-w-[560px] p-0 border-l border-slate-200 bg-slate-50 flex flex-col shadow-xl overflow-hidden">
          <div className="p-6 bg-orange-500 text-white shrink-0">
            <div className="flex items-center justify-between mb-3">
              <div className="h-9 w-9 bg-white/20 rounded-xl flex items-center justify-center">
                <Plus className="h-5 w-5" />
              </div>
              <button onClick={() => setShowEncaixe(false)} className="h-9 w-9 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <h3 className="text-xl font-bold uppercase tracking-tight">Registrar Encaixe</h3>
            <p className="text-orange-100 text-[10px] font-bold uppercase tracking-wider mt-0.5">Paciente fora de horário — {selectedDate}</p>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            <form id="encaixe-form" onSubmit={handleSubmitEncaixe} className="space-y-5">
              {/* Busca do paciente */}
              <div className="space-y-1 relative">
                <Label className="uppercase text-[9px] font-bold tracking-wider text-slate-500 ml-1">Nome do Paciente <span className="text-rose-500">*</span></Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    required
                    autoComplete="off"
                    placeholder="BUSCAR OU DIGITAR NOME..."
                    value={encaixeForm.patient_name}
                    onChange={e => handleEncaixeSearch(e.target.value)}
                    className="h-11 pl-10 bg-white border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:border-orange-400 outline-none"
                  />
                </div>
                {encaixeResults.length > 0 && (
                  <div className="absolute z-50 w-full bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden mt-1">
                    <div className="max-h-48 overflow-y-auto divide-y divide-slate-100">
                      {encaixeResults.map(p => (
                        <button key={p.id} type="button" onClick={() => handleEncaixeSelectPatient(p)} className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors">
                          <p className="font-bold text-xs text-slate-800 uppercase">{p.full_name || p.paciente}</p>
                          <p className="text-[9px] text-slate-500 font-bold">CPF: {maskCPF(p.cpf || "")} {p.municipio ? `• ${p.municipio}` : ""}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* CPF + CNS */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="uppercase text-[9px] font-bold tracking-wider text-slate-500 ml-1">CPF <span className="text-slate-300">(opcional)</span></Label>
                  <Input value={encaixeForm.cpf} onChange={e => setEncaixeForm(p => ({ ...p, cpf: maskCPF(e.target.value) }))} className="h-11 bg-white border-slate-200 rounded-xl text-xs font-bold text-slate-700 text-center focus:border-orange-400 outline-none" placeholder="000.000.000-00" />
                </div>
                <div className="space-y-1">
                  <Label className="uppercase text-[9px] font-bold tracking-wider text-slate-500 ml-1">CNS / SUS <span className="text-slate-300">(opcional)</span></Label>
                  <Input value={encaixeForm.sus} onChange={e => setEncaixeForm(p => ({ ...p, sus: e.target.value }))} className="h-11 bg-white border-slate-200 rounded-xl text-xs font-bold text-slate-700 text-center focus:border-orange-400 outline-none" placeholder="000 0000 0000 0000" />
                </div>
              </div>

              {/* Nascimento */}
              <div className="space-y-1">
                <Label className="uppercase text-[9px] font-bold tracking-wider text-slate-500 ml-1">Data de Nascimento</Label>
                <Input type="date" value={encaixeForm.birth_date} onChange={e => setEncaixeForm(p => ({ ...p, birth_date: e.target.value }))} className="h-11 bg-white border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:border-orange-400 outline-none" />
              </div>

              {/* ---- PROCEDIMENTOS (múltiplos) ---- */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="uppercase text-[9px] font-bold tracking-wider text-slate-500 ml-1">Procedimentos Solicitados</Label>
                  <button
                    type="button"
                    onClick={addEncaixeExam}
                    className="h-7 px-3 bg-orange-50 border border-orange-200 text-orange-600 rounded-lg text-[9px] font-bold uppercase tracking-wide hover:bg-orange-100 transition-colors flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" /> Adicionar
                  </button>
                </div>

                {encaixeExams.map((exam, idx) => (
                  <div key={exam.id} className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 relative group/exam">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Exame {idx + 1}</span>
                      {encaixeExams.length > 1 && (
                        <button type="button" onClick={() => removeEncaixeExam(exam.id)} className="h-6 w-6 flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="uppercase text-[9px] font-bold tracking-wider text-slate-400 ml-1">Procedimento</Label>
                        <select
                          value={exam.procedure_name}
                          onChange={e => updateEncaixeExam(exam.id, "procedure_name", e.target.value)}
                          className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 font-bold uppercase text-xs text-slate-700 outline-none focus:border-orange-400"
                          required
                        >
                          <option value="">Selecione...</option>
                          {dynamicProcedures.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <Label className="uppercase text-[9px] font-bold tracking-wider text-slate-400 ml-1">Especificação</Label>
                        <select
                          value={exam.exam_type}
                          onChange={e => updateEncaixeExam(exam.id, "exam_type", e.target.value)}
                          className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 font-bold uppercase text-xs text-slate-700 outline-none focus:border-orange-400"
                        >
                          <option value="">Nenhuma</option>
                          {(dynamicTypes[exam.procedure_name] || []).map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                    </div>
                    {slotWarnings[exam.id] && (
                      <div className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                        <p className="text-[9px] font-bold text-amber-700 uppercase tracking-wide">{slotWarnings[exam.id]}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Prioridade */}
              <div className="space-y-1">
                <Label className="uppercase text-[9px] font-bold tracking-wider text-slate-500 ml-1">Prioridade</Label>
                <select value={encaixeForm.priority} onChange={e => setEncaixeForm(p => ({ ...p, priority: e.target.value }))} className="w-full h-11 bg-white border border-slate-200 rounded-xl px-4 font-bold uppercase text-xs text-slate-700 outline-none focus:border-orange-400">
                  <option value="Sem Prioridade">NORMAL</option>
                  <option value="Idoso (60+)">IDOSO 60+</option>
                  <option value="Gestante">GESTANTE</option>
                  <option value="Prioritário">PRIORITÁRIO</option>
                </select>
              </div>

              {/* Unidade de Origem */}
              <div className="space-y-1">
                <Label className="uppercase text-[9px] font-bold tracking-wider text-slate-500 ml-1">Unidade de Origem</Label>
                <select value={encaixeForm.origin_id} onChange={e => setEncaixeForm(p => ({ ...p, origin_id: e.target.value }))} className="w-full h-11 bg-white border border-slate-200 rounded-xl px-4 font-bold uppercase text-xs text-slate-700 outline-none focus:border-orange-400">
                  <option value="">SELECIONAR...</option>
                  {origins.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                  <option value="NOVO">+ CADASTRAR NOVA</option>
                </select>
              </div>
              {encaixeForm.origin_id === "NOVO" && (
                <Input placeholder="NOME DA UNIDADE..." value={encaixeForm.new_origin_name} onChange={e => setEncaixeForm(p => ({ ...p, new_origin_name: e.target.value.toUpperCase() }))} className="h-11 bg-orange-50 border-orange-200 rounded-xl text-xs font-bold text-slate-700 focus:border-orange-400 outline-none" />
              )}

              {/* Chave SISREG — condicional */}
              <div className="space-y-1">
                <Label className="uppercase text-[9px] font-bold tracking-wider text-slate-500 ml-1">
                  Chave SISREG {isEncaixeSisreg ? <span className="text-rose-500 ml-1">*obrigatória</span> : <span className="text-slate-300">(opcional)</span>}
                </Label>
                <Input
                  value={encaixeForm.chave_sisreg}
                  onChange={e => setEncaixeForm(p => ({ ...p, chave_sisreg: e.target.value }))}
                  required={isEncaixeSisreg}
                  placeholder={isEncaixeSisreg ? "OBRIGATÓRIO - APENAS NÚMEROS" : "OPCIONAL..."}
                  className={`h-11 rounded-xl text-xs font-bold text-slate-700 outline-none ${isEncaixeSisreg ? 'bg-rose-50 border-rose-200 focus:border-rose-400' : 'bg-white border-slate-200 focus:border-orange-400'}`}
                />
              </div>
            </form>
          </div>

          <div className="p-6 border-t border-slate-100 bg-white shrink-0">
            <Button form="encaixe-form" type="submit" disabled={isSubmittingEncaixe} className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold uppercase tracking-wider text-xs transition-all shadow-sm">
              {isSubmittingEncaixe ? <Loader2 className="h-5 w-5 animate-spin" /> : `Confirmar Encaixe (${encaixeExams.length} exame${encaixeExams.length > 1 ? 's' : ''})`}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
