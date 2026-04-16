"use client"
import { useState, useRef, useMemo, useEffect } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { CalendarDays, Save, Printer, Activity, FileText, AlertCircle, Heart, Search, ClipboardList, Loader2, UserPlus, ChevronRight, CreditCard, Clock, FileDown, Plus, Trash2, Check, ChevronDown, Settings2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { format, parseISO } from "date-fns"
import { useAuth } from "@/lib/auth-context"
import { searchMasterPatients, upsertMasterPatient } from "@/lib/patient-search"
import { ExamManagerModal } from "@/components/exam-manager-modal"

const FALLBACK_PROCEDURES = [
  "Tomografia",
  "Tomografia com Contraste",
  "Ultrassom",
  "Ecocardiograma",
  "Raio X",
  "Laboratoriais",
  "Eletrocardiograma"
]

const FALLBACK_TYPES: Record<string, string[]> = {
  "Tomografia": ["Crânio", "Abdome Total", "Tórax", "Coluna Cervical", "Coluna Lombar", "Angio Cerebral", "Angio Abdominal", "Angio Membros", "Angio Aorta", "Outros"],
  "Tomografia com Contraste": ["Crânio com Contraste", "Abdome com Contraste", "Tórax com Contraste", "Outros"],
  "Ultrassom": ["Abdominal Total", "Pélvico", "Articulações", "Transvaginal", "Outros"],
  "Ecocardiograma": ["Transtorácico", "Transesofágico"],
  "Raio X": ["Tórax", "Membros", "Coluna", "Bacia"],
  "Laboratoriais": ["Sangue", "Urina", "Fezes", "Hemograma", "Bioquímica"],
  "Eletrocardiograma": ["Padrão"]
}

// PREMIUM 3D HUMAN MODEL
const HumanModel = ({ procedure }: { procedure: string }) => {
  const isHead = (procedure || "").includes("Tomografia")
  const isChest = procedure === "Ecocardiograma" || procedure === "Eletrocardiograma" || procedure === "Raio X"
  const isAbdomen = (procedure || "").includes("Ultrassom") || (procedure || "").includes("Abdome")
  const isLimbs = procedure === "Raio X" || (procedure || "").includes("Membros")
  const isLaboratorial = procedure === "Laboratoriais"

  return (
    <div className="relative w-full h-[450px] flex items-center justify-center bg-gradient-to-b from-slate-50 to-white rounded-[3rem] border border-slate-200/50 shadow-inner overflow-hidden group [perspective:1200px]">
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#64748b 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
      
      {/* Scanning Line Animation */}
      <div className="absolute inset-x-0 w-full h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent z-10 animate-scan pointer-events-none shadow-[0_0_15px_rgba(59,130,246,0.5)]" />

      <div className="relative transition-all duration-1000 ease-out group-hover:[transform:rotateY(10deg)_rotateX(5deg)] transform-gpu h-full w-full flex items-center justify-center">
        <svg viewBox="0 0 200 500" className="h-[90%] w-auto filter drop-shadow-[0_25px_50px_rgba(0,0,0,0.15)] transition-all duration-700">
          <defs>
            <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" style={{ stopColor: '#f1f5f9' }} />
              <stop offset="50%" style={{ stopColor: '#e2e8f0' }} />
              <stop offset="100%" style={{ stopColor: '#f1f5f9' }} />
            </linearGradient>
            <linearGradient id="activeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" style={{ stopColor: '#3b82f6' }} />
              <stop offset="50%" style={{ stopColor: '#60a5fa' }} />
              <stop offset="100%" style={{ stopColor: '#3b82f6' }} />
            </linearGradient>
            <filter id="neonGlow" x="-25%" y="-25%" width="150%" height="150%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Sombra de Profundidade */}
          <ellipse cx="100" cy="485" rx="50" ry="10" className="fill-slate-200/40" />

          {/* Cabeça */}
          <g className={`transition-all duration-700 ${isHead ? 'scale-110 origin-center' : ''}`}>
            <circle cx="100" cy="60" r="35" 
              className={`transition-all duration-500 ${isHead ? 'fill-[url(#activeGradient)]' : isLaboratorial ? 'fill-blue-100' : 'fill-[url(#bodyGradient)]'}`} 
              style={{ filter: isHead ? 'url(#neonGlow)' : 'none' }} 
            />
            {isHead && <circle cx="100" cy="60" r="15" className="fill-white/40 animate-pulse" />}
          </g>

          {/* Tronco / Abdome */}
          <path 
            d="M65 110 L135 110 Q145 250 135 320 L65 320 Q55 250 65 110 Z" 
            className={`transition-all duration-500 ${
              isChest ? 'fill-blue-400' : 
              isAbdomen ? 'fill-blue-300' : 
              isLaboratorial ? 'fill-blue-100 animate-pulse' : 
              'fill-[url(#bodyGradient)]'
            }`} 
            style={{ filter: (isChest || isAbdomen) ? 'url(#neonGlow)' : 'none' }} 
          />

          {/* Coração (Específico para Cardios) */}
          {(procedure === "Ecocardiograma" || procedure === "Eletrocardiograma") && (
            <g transform="translate(105, 160) scale(0.6)">
              <path d="M0 -30 Q20 -50 40 -30 T0 30 T-40 -30 Q-20 -50 0 -30" fill="#ef4444" className="animate-ping opacity-30" />
              <path d="M0 -30 Q20 -50 40 -30 T0 30 T-40 -30 Q-20 -50 0 -30" fill="#ef4444" className="animate-bounce" />
            </g>
          )}

          {/* Braços e Pernas */}
          <g className="transition-all duration-500">
            {/* Braço Esquerdo */}
            <path d="M65 110 L35 270 L55 275 L75 120 Z" 
              className={`transition-all duration-500 ${isLimbs ? 'fill-blue-200' : isLaboratorial ? 'fill-blue-100' : 'fill-[url(#bodyGradient)]'}`} 
            />
            {/* Braço Direito */}
            <path d="M135 110 L165 270 L145 275 L125 120 Z" 
              className={`transition-all duration-500 ${isLimbs ? 'fill-blue-200' : isLaboratorial ? 'fill-blue-100' : 'fill-[url(#bodyGradient)]'}`} 
            />
            {/* Perna Esquerda */}
            <path d="M70 320 L55 480 L85 480 L95 320 Z" 
              className={`transition-all duration-500 ${isLimbs ? 'fill-blue-200' : isLaboratorial ? 'fill-blue-100' : 'fill-[url(#bodyGradient)]'}`} 
            />
            {/* Perna Direita */}
            <path d="M130 320 L145 480 L115 480 L105 320 Z" 
              className={`transition-all duration-500 ${isLimbs ? 'fill-blue-200' : isLaboratorial ? 'fill-blue-100' : 'fill-[url(#bodyGradient)]'}`} 
            />
          </g>

          {/* Sistema Circulatório (Para Laboratoriais) */}
          {isLaboratorial && (
            <g className="animate-pulse" style={{ opacity: 0.6 }}>
              <path d="M100 110 L100 320 M70 150 L40 250 M130 150 L160 250 M80 320 L65 450 M120 320 L135 450" 
                fill="none" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" className="animate-pulse"
              />
            </g>
          )}
        </svg>
      </div>

      <div className="absolute top-8 left-8 flex flex-col gap-2">
        <div className="bg-white/90 backdrop-blur-2xl p-4 border border-slate-100 rounded-3xl shadow-2xl flex items-center gap-4 group-hover:scale-105 transition-transform duration-500">
          <div className="relative">
            <div className={`w-3 h-3 rounded-full ${procedure ? 'bg-blue-500' : 'bg-slate-300'}`} />
            <div className={`absolute inset-0 rounded-full animate-ping ${procedure ? 'bg-blue-500/50' : 'bg-slate-300/50'}`} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 leading-none mb-1">Scanner Ativo</p>
            <p className="text-sm font-black text-slate-800 uppercase tracking-tight">{procedure || "Aguardando"}</p>
          </div>
        </div>
      </div>

      {/* Estilos customizados para a animação de scan */}
      <style jsx>{`
        @keyframes scan {
          0% { top: 10%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 90%; opacity: 0; }
        }
        .animate-scan {
          animation: scan 3s linear infinite;
        }
      `}</style>
    </div>
  )
}

// SEARCHABLE SELECT COMPONENT WITH ADD OPTION
const SearchableAdder = ({ 
  value, 
  onSelect, 
  options, 
  placeholder, 
  label, 
  onAddNew,
  canAdd = true 
}: { 
  value: string, 
  onSelect: (v: string) => void, 
  options: string[], 
  placeholder: string, 
  label: string,
  onAddNew: (v: string) => Promise<void>,
  canAdd?: boolean
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState("")
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [isAdding, setIsAdding] = useState(false)

  const filtered = options.filter(o => o.toLowerCase().includes(search.toLowerCase()))
  const showAdd = search.length > 2 && !options.some(o => o.toLowerCase() === search.toLowerCase())

  useEffect(() => {
    const clickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", clickOutside)
    return () => document.removeEventListener("mousedown", clickOutside)
  }, [])

  const handleAdd = async () => {
    setIsAdding(true)
    try {
      await onAddNew(search.toUpperCase())
      onSelect(search.toUpperCase())
      setSearch("")
      setIsOpen(false)
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <div className="space-y-1.5 relative" ref={dropdownRef}>
      <Label className="uppercase text-[9px] font-black tracking-widest text-slate-400 ml-2">{label}</Label>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-12 bg-slate-50 flex items-center justify-between px-4 rounded-xl text-xs font-black shadow-inner cursor-pointer hover:bg-white transition-all border border-transparent hover:border-blue-100"
      >
        <span className="truncate uppercase">{value || placeholder}</span>
        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute z-[100] mt-2 w-full bg-white/95 backdrop-blur-xl border border-slate-100 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="p-3 border-b border-slate-50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input 
                autoFocus
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Pesquisar ou cadastrar..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border-none rounded-lg text-xs font-bold focus:ring-2 focus:ring-blue-500/20 outline-none uppercase"
              />
            </div>
          </div>
          <div className="max-h-[200px] overflow-y-auto custom-scrollbar">
            {filtered.map(opt => (
              <button
                key={opt}
                onClick={() => { onSelect(opt); setIsOpen(false); setSearch(""); }}
                className="w-full text-left px-5 py-3 hover:bg-blue-50 transition-colors flex items-center justify-between group"
              >
                <span className="text-xs font-bold text-slate-600 uppercase group-hover:text-blue-600">{opt}</span>
                {value === opt && <Check className="h-3.5 w-3.5 text-blue-500" />}
              </button>
            ))}
            {showAdd && canAdd && (
              <button
                disabled={isAdding}
                onClick={handleAdd}
                className="w-full text-left px-5 py-4 bg-emerald-50 hover:bg-emerald-100 transition-colors flex items-center gap-3 border-t border-emerald-100 mt-1 shadow-inner"
              >
                <div className="h-7 w-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg">
                  {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                </div>
                <div>
                  <p className="text-[10px] font-black text-emerald-600 uppercase">Não encontrado?</p>
                  <p className="text-xs font-black text-emerald-700 uppercase">CADASTRAR "{search}"</p>
                </div>
              </button>
            )}
            {showAdd && !canAdd && (
              <div className="p-6 bg-red-50 border-t border-red-100 flex items-center gap-4">
                <div className="h-8 w-8 flex-shrink-0 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
                  <AlertCircle className="h-4 w-4" />
                </div>
                <p className="text-[9px] font-black text-red-600 uppercase leading-tight tracking-tight">
                  voce digitou errado ou procedimento não esta cadastrado, por favor se for cadastrar, chame o admininistrador do sistema
                </p>
              </div>
            )}
            {filtered.length === 0 && !showAdd && (
              <div className="p-8 text-center opacity-30">
                <Search className="h-8 w-8 mx-auto mb-2 text-slate-400" />
                <p className="text-[10px] font-black uppercase tracking-widest">Nenhum resultado</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function AgendamentoTab() {
  const { user, logos } = useAuth()
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [procedurePatients, setProcedurePatients] = useState<Record<string, any[]>>({})
  const [slotInfo, setSlotInfo] = useState<{ total: number; occupied: number } | null>(null)
  const [isCheckingSlots, setIsCheckingSlots] = useState(false)

  const [searchResults, setSearchResults] = useState<any[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [dateAppointments, setDateAppointments] = useState<any[]>([])
  const [lastSaved, setLastSaved] = useState<any>(null)
  const [selectedAgendadoDate, setSelectedAgendadoDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'))
  const [isManagerOpen, setIsManagerOpen] = useState(false)

  const isAdmin = user?.role === "admin"

  const [dynamicProcedures, setDynamicProcedures] = useState<string[]>(FALLBACK_PROCEDURES)
  const [dynamicTypes, setDynamicTypes] = useState<Record<string, string[]>>(FALLBACK_TYPES)

  const [formData, setFormData] = useState({
    patient_name: "",
    cpf: "",
    sus: "",
    chave_sisreg: "",
    municipio: "",
    estado: "",
  })

  const [exams, setExams] = useState<any[]>([{
    id: Math.random().toString(36).substr(2, 9),
    exam_date: format(new Date(), 'yyyy-MM-dd'),
    exam_time: format(new Date(), 'HH:mm'),
    procedure_name: FALLBACK_PROCEDURES[0],
    exam_type: FALLBACK_TYPES[FALLBACK_PROCEDURES[0]][0] || "",
  }])

  const supabase = useMemo(() => createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!), [])

  const loadConfig = async () => {
    const { data: procs } = await supabase.from("exam_procedures_list").select("*").order("name")
    const { data: types } = await supabase.from("exam_types_list").select("*").order("name")

    // Sempre mescla o banco com o FALLBACK garantindo que todos os procedimentos aparecem
    const dbProcs = (procs || []).map((p: any) => p.name)
    const merged = Array.from(new Set([...FALLBACK_PROCEDURES, ...dbProcs]))
    setDynamicProcedures(merged)

    // Inicia com o mapa de tipos do fallback e adiciona do banco
    const tMap: Record<string, string[]> = { ...FALLBACK_TYPES }
    if (types) {
      types.forEach((t: any) => {
        if (!tMap[t.procedure_name]) tMap[t.procedure_name] = []
        if (!tMap[t.procedure_name].includes(t.name)) {
          tMap[t.procedure_name].push(t.name)
        }
      })
    }
    setDynamicTypes(tMap)
  }

  useEffect(() => {
    loadConfig()
  }, [supabase])

  const handleAddNewProcedure = async (name: string) => {
    const { error } = await supabase.from("exam_procedures_list").insert([{ name }])
    if (error) {
      alert("Erro ao cadastrar procedimento: " + error.message)
    } else {
      await loadConfig()
    }
  }

  const handleAddNewType = async (name: string, procedure_name: string) => {
    const { error } = await supabase.from("exam_types_list").insert([{ name, procedure_name }])
    if (error) {
      alert("Erro ao cadastrar especificação: " + error.message)
    } else {
      await loadConfig()
    }
  }

  useEffect(() => {
    // Recarrega a lista de agendados quando a data selecionada muda
    loadDateAppointments(selectedAgendadoDate)
  }, [selectedAgendadoDate])

  useEffect(() => {
    const loadProcedureSlots = async () => {
      if (exams.length === 0) return
      
      const results: Record<string, any[]> = {}
      for (const ex of exams) {
        const { data } = await supabase
          .from("exam_appointments")
          .select("patient_name, exam_time, status")
          .eq("exam_date", ex.exam_date)
          .eq("procedure_name", ex.procedure_name)
          .neq("status", "cancelado")
          .order("exam_time")
        results[`${ex.procedure_name}|${ex.exam_date}`] = data || []
      }
      setProcedurePatients(results)
    }
    loadProcedureSlots()
  }, [exams, supabase])

  const [appointmentSearch, setAppointmentSearch] = useState("")

  const filteredAppointments = useMemo(() => {
    if (!appointmentSearch) return dateAppointments
    return dateAppointments.filter(a => a.patient_name.toLowerCase().includes(appointmentSearch.toLowerCase()))
  }, [dateAppointments, appointmentSearch])

  const loadDateAppointments = async (date: string) => {
    const { data } = await supabase
      .from("exam_appointments")
      .select("*")
      .eq("exam_date", date)
      .neq("status", "cancelado")
      .order("exam_time")
    setDateAppointments(data || [])
  }

  useEffect(() => {
    // Slot check for the first exam in the list to give immediate feedback
    const checkSlots = async () => {
      const firstExam = exams[0]
      if (!firstExam || firstExam.procedure_name === "Raio X") {
        setSlotInfo(null)
        return
      }
      setIsCheckingSlots(true)
      try {
        const { data: slotData } = await supabase.from("exam_slots").select("total_slots").eq("exam_date", firstExam.exam_date).eq("procedure_name", firstExam.procedure_name).maybeSingle()
        
        // If no slot configuration exists, we don't return 0/0, we return null to signify unlimited
        if (!slotData) {
          setSlotInfo(null)
          return
        }

        const { count } = await supabase.from("exam_appointments").select("*", { count: 'exact', head: true }).eq("exam_date", firstExam.exam_date).eq("procedure_name", firstExam.procedure_name).neq("status", "cancelado")
        setSlotInfo({ total: slotData.total_slots, occupied: count || 0 })
      } finally {
        setIsCheckingSlots(false)
      }
    }
    checkSlots()
  }, [exams[0]?.exam_date, exams[0]?.procedure_name, supabase])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const maskCPF = (v: string) => {
    v = v.replace(/\D/g, "")
    if (v.length > 11) v = v.substring(0, 11)
    return v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
  }

  const handleNameInput = async (val: string) => {
    setFormData(prev => ({ ...prev, patient_name: val }))
    if (val.length < 3) {
      setSearchResults([])
      setShowDropdown(false)
      return
    }
    setShowDropdown(true)
    try {
      // Busca no cadastro unificado de pacientes
      const results = await searchMasterPatients(val)
      setSearchResults(results)
    } catch (e) { }
  }

  const handleSelectPatient = (patient: any) => {
    setFormData(prev => ({
      ...prev,
      patient_name: patient.full_name || patient.paciente || patient.patient_name,
      cpf: maskCPF(patient.cpf || ""),
      sus: patient.sus || "",
      municipio: patient.municipio || patient.cidade_origem || "",
      estado: patient.estado || "",
    }))
    setShowDropdown(false)
  }

  const addExam = () => {
    setExams(prev => [...prev, {
      id: Math.random().toString(36).substr(2, 9),
      exam_date: format(new Date(), 'yyyy-MM-dd'),
      exam_time: format(new Date(), 'HH:mm'),
      procedure_name: dynamicProcedures[0] || FALLBACK_PROCEDURES[0],
      exam_type: (dynamicTypes[dynamicProcedures[0] || FALLBACK_PROCEDURES[0]] || [])[0] || "",
    }])
  }

  const removeExam = (id: string) => {
    if (exams.length <= 1) return
    setExams(prev => prev.filter(e => e.id !== id))
  }

  const updateExam = (id: string, field: string, value: any) => {
    setExams(prev => prev.map(e => {
      if (e.id === id) {
        const updated = { ...e, [field]: value }
        if (field === 'procedure_name' && dynamicTypes[value]) {
          updated.exam_type = dynamicTypes[value][0] || ""
        }
        return updated
      }
      return e
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      // 1. Validation for Duplication in Patients Table
      const cleanCPF = formData.cpf.replace(/\D/g, "")
      
      let existingPatient = null
      if (cleanCPF || formData.sus) {
        const query = supabase.from("patients").select("*")
        const filters = []
        if (cleanCPF) filters.push(`cpf.eq.${cleanCPF}`)
        if (formData.sus) filters.push(`sus.eq.${formData.sus}`)
        
        if (filters.length > 0) {
          const { data } = await query.or(filters.join(",")).maybeSingle()
          existingPatient = data
        }
      }

      // If we find a patient but the name is significantly different, we might want to warn
      if (existingPatient && !formData.patient_name.toUpperCase().includes(existingPatient.paciente.toUpperCase().split(' ')[0])) {
         if(!confirm(`AVISO: Já existe um cadastro com este CPF/SUS no nome de ${existingPatient.paciente}. Deseja continuar mesmo assim?`)) {
           setIsSubmitting(false)
           return
         }
      }

      // 2. Automatic Patient Registration if not exists
      if (!existingPatient) {
        const { error: patientErr } = await supabase.from("patients").insert([{
          paciente: formData.patient_name.toUpperCase(),
          cpf: cleanCPF,
          sus: formData.sus,
          recepcionista: user?.name || "RECEPÇÃO"
        }])
        if (patientErr) console.error("Erro ao registrar paciente:", patientErr)
      }

      // 3. Insert Appointments
      const inserts = exams.map(exam => ({
        patient_name: formData.patient_name.toUpperCase(),
        cpf: cleanCPF,
        sus: formData.sus,
        chave_sisreg: formData.chave_sisreg,
        municipio: formData.municipio,
        estado: formData.estado,
        exam_date: exam.exam_date,
        exam_time: exam.exam_time,
        procedure_name: exam.procedure_name,
        exam_type: exam.exam_type,
        status: 'agendado',
        receptionist_name: user?.name || "RECEPÇÃO"
      }))

      const { data, error } = await supabase.from("exam_appointments").insert(inserts).select()
      
      if (error) throw error

      // Salva/atualiza o paciente no cadastro central
      await upsertMasterPatient({
        full_name: formData.patient_name.toUpperCase(),
        cpf: cleanCPF || undefined,
        sus: formData.sus || undefined,
        estado: formData.estado || undefined,
        municipio: formData.municipio || undefined,
        origem_cadastro: 'exames',
      })
      
      setLastSaved(data)
      if (exams[0]) loadDateAppointments(exams[0].exam_date)
      alert("Agendamentos e Cadastro processados com sucesso!")
      
      setFormData({ patient_name: "", cpf: "", sus: "", chave_sisreg: "", municipio: "", estado: "" })
      setExams([{
        id: Math.random().toString(36).substr(2, 9),
        exam_date: format(new Date(), 'yyyy-MM-dd'),
        exam_time: format(new Date(), 'HH:mm'),
        procedure_name: dynamicProcedures[0] || FALLBACK_PROCEDURES[0],
        exam_type: (dynamicTypes[dynamicProcedures[0] || FALLBACK_PROCEDURES[0]] || [])[0] || "",
      }])
    } catch (err) {
      console.error(err)
      alert("Erro ao processar agendamento.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const generatePrintableFicha = (apptToPrint?: any) => {
    const data = apptToPrint || lastSaved
    if (!data) return

    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    const logoSection = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 15px;">
        <div style="display: flex; gap: 20px; height: 60px;">
          ${logos.logo_hto ? `<img src="${logos.logo_hto}" style="height: 100%;"/>` : ""}
          ${logos.logo_instituto ? `<img src="${logos.logo_instituto}" style="height: 100%;"/>` : ""}
          ${logos.logo_maranhao ? `<img src="${logos.logo_maranhao}" style="height: 100%;"/>` : ""}
          ${logos.logo_sus ? `<img src="${logos.logo_sus}" style="height: 100%;"/>` : ""}
        </div>
        <div style="text-align: right; font-size: 8pt; font-weight: bold; opacity: 0.6;">
          EMITIDO EM ${format(new Date(), 'dd/MM/yyyy HH:mm')}
        </div>
      </div>
    `

    const content = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Ficha de Agendamento - ${data.patient_name}</title>
        <style>
          @page { size: A5; margin: 10mm; }
          body { font-family: sans-serif; color: #000; line-height: 1.4; margin: 0; padding: 0; }
          h1 { font-size: 16pt; font-weight: 900; text-align: center; text-transform: uppercase; letter-spacing: 2px; border-bottom: 2px solid #000; padding-bottom: 5mm; margin-bottom: 8mm; }
          .info-block { font-size: 11pt; margin-bottom: 8mm; }
          .info-row { margin-bottom: 3mm; display: flex; }
          .label { font-weight: 900; width: 45mm; text-transform: uppercase; }
          .value { text-transform: uppercase; border-bottom: 1px dashed #ccc; flex: 1; }
          table { width: 100%; border-collapse: collapse; border: 1.5px solid #000; margin-bottom: 10mm; }
          th { background-color: #f0f0f0; border: 1.5px solid #000; padding: 3mm; text-transform: uppercase; font-size: 9pt; }
          td { border: 1.5px solid #000; padding: 4mm; text-align: center; font-weight: bold; text-transform: uppercase; font-size: 11pt; }
          .instructions { border: 1.5px solid #000; padding: 5mm; border-radius: 4mm; }
          .instructions h2 { font-size: 10pt; font-weight: 900; text-transform: uppercase; margin: 0 0 3mm 0; }
          .instructions ul { margin: 0; padding-left: 5mm; font-size: 9.5pt; font-weight: bold; }
          .instructions li { margin-bottom: 1.5mm; }
          .footer { margin-top: 15mm; border-top: 1px solid #000; padding-top: 5mm; text-align: center; font-size: 8pt; font-weight: bold; opacity: 0.5; }
        </style>
      </head>
      <body>
        ${logoSection}
        <h1>Ficha de Agendamento</h1>
        <div class="info-block">
          <div class="info-row"><span class="label">Paciente:</span> <span class="value">${data[0]?.patient_name || data.patient_name}</span></div>
          <div class="info-row"><span class="label">CPF:</span> <span class="value">${maskCPF((data[0]?.cpf || data.cpf) || "")}</span></div>
          <div class="info-row"><span class="label">Cartão SUS:</span> <span class="value">${(data[0]?.sus || data.sus) || "--"}</span></div>
          <div class="info-row"><span class="label">Chave SISREG:</span> <span class="value">${(data[0]?.chave_sisreg !== 'IMPORT_SISREG' && (data[0]?.chave_sisreg || data.chave_sisreg)) || "--"}</span></div>
          <div class="info-row"><span class="label">Atendente:</span> <span class="value">${(data[0]?.receptionist_name || data.receptionist_name) || "NÃO INFORMADO"}</span></div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Procedimento</th>
              <th>Especificação</th>
              <th>Data/Hora</th>
            </tr>
          </thead>
          <tbody>
            ${Array.isArray(data) ? data.map(item => `
              <tr>
                <td>
                  ${item.procedure_name}
                  ${item.procedure_detail ? `<div style="font-size: 8pt; color: #666; font-style: italic; margin-top: 2mm;">SISREG: ${item.procedure_detail}</div>` : ""}
                </td>
                <td>${item.exam_type}</td>
                <td>${format(new Date(item.exam_date + 'T00:00:00'), 'dd/MM/yyyy')} às ${item.exam_time}</td>
              </tr>
            `).join('') : `
              <tr>
                <td>
                  ${data.procedure_name}
                  ${data.procedure_detail ? `<div style="font-size: 8pt; color: #666; font-style: italic; margin-top: 2mm;">SISREG: ${data.procedure_detail}</div>` : ""}
                </td>
                <td>${data.exam_type}</td>
                <td>${format(new Date(data.exam_date + 'T00:00:00'), 'dd/MM/yyyy')} às ${data.exam_time}</td>
              </tr>
            `}
          </tbody>
        </table>
        <div class="instructions">
          <h2>Orientações Importantes:</h2>
          <ul>
            ${(() => {
              const procedures = Array.isArray(data) ? data : [data]
              const allInstructions = new Set<string>()
              
              procedures.forEach(p => {
                const name = (p.procedure_name || "").toUpperCase()

                if (name.includes("COM CONTRASTE") || name.includes("ANGIOTOMOGRAFIA")) {
                  // GRUPO 1: Tomografia com Contraste e Angiotomografia
                  allInstructions.add("PACIENTE EM JEJUM DE 6 HORAS")
                  allInstructions.add("TRAZER EXAMES DE UREIA E CREATININA RECENTE")
                  allInstructions.add("PACIENTE ESTÁ COM ACESSO COM JELCO 18")
                  allInstructions.add("NÃO FAZER USO DE METFORMINA OU HIPOGLICEMINANTE NO DIA DO EXAME")
                  allInstructions.add("TRAZER SOLICITAÇÃO DO EXAME")
                  allInstructions.add("DOCUMENTO SUS E CPF")
                } else {
                  // GRUPO 2: Todos os demais procedimentos
                  allInstructions.add("TRAZER REQUISIÇÃO DO EXAME")
                  allInstructions.add("DOCUMENTO COM FOTO")
                }
              })
              
              return Array.from(allInstructions).map(instr => `<li>${instr}</li>`).join('')
            })()}
          </ul>
        </div>
        <div class="footer">DESENVOLVIDO POR GUILHERME SANTOS - AVERO AGENCY</div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
          };
        </script>
      </body>
      </html>
    `
    printWindow.document.write(content)
    printWindow.document.close()
  }

  const noSlotsAtAll = useMemo(() => {
    // Raio X is ALWAYS allowed
    if (exams[0]?.procedure_name === "Raio X") return false
    
    // If no config exists, it is BLOCKED (except Raio X handled above)
    if (slotInfo === null) return true
    
    // If config exists, check occupancy
    return slotInfo.occupied >= slotInfo.total
  }, [slotInfo, exams])

  const hasSlots = useMemo(() => {
    if (!exams[0]) return true
    return !noSlotsAtAll
  }, [noSlotsAtAll, exams])

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
      <div className="print:hidden max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-12 xl:col-span-8 flex flex-col gap-8">
            <div className="glass-card !bg-white/40 border-none rounded-[3.5rem] p-8 lg:p-12 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-700 via-indigo-500 to-emerald-400" />
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
                <div>
                  <h2 className="text-4xl font-black font-space uppercase tracking-tight text-slate-800 flex items-center gap-5">
                    <div className="p-5 bg-blue-600 text-white rounded-[2rem] shadow-2xl shadow-blue-500/30">
                      <CalendarDays className="h-8 w-8" />
                    </div>
                    Novo Agendamento
                  </h2>
                </div>
                <div className="flex items-center gap-4">
                  {isAdmin && (
                    <Button 
                      type="button"
                      onClick={() => setIsManagerOpen(true)}
                      className="h-14 px-8 rounded-2xl bg-slate-100 text-slate-600 hover:bg-slate-200 font-black uppercase text-xs tracking-widest gap-3 shadow-inner"
                    >
                      <Settings2 className="h-5 w-5" />
                      Gerenciar
                    </Button>
                  )}
                  {(exams[0] && exams[0].procedure_name !== "Raio X") && (
                    <div className={`px-8 py-5 rounded-[2rem] border-2 flex items-center gap-5 shadow-inner ${noSlotsAtAll ? 'bg-red-50 border-red-100 text-red-600' : 'bg-blue-50/50 border-blue-100 text-blue-700'}`}>
                      {isCheckingSlots ? <Loader2 className="h-6 w-6 animate-spin" /> : <AlertCircle className="h-7 w-7" />}
                      <div className="text-right">
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Status Vagas</p>
                        <p className="text-2xl font-black font-space">
                          {slotInfo === null ? "SEM CONFIG." : noSlotsAtAll ? "LOTADO" : `${slotInfo.occupied} / ${slotInfo.total}`}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10">
                  <div className="space-y-3 md:col-span-2 relative" ref={dropdownRef}>
                    <Label className="uppercase text-[10px] font-black tracking-widest text-slate-400 ml-5">Nome do Paciente</Label>
                    <div className="relative">
                      <Input required autoComplete="off" placeholder="BUSCAR OU DIGITAR NOME..." value={formData.patient_name} onChange={e => handleNameInput(e.target.value)} onFocus={() => formData.patient_name.length >= 3 && setShowDropdown(true)} className="pl-16 h-20 text-xl font-black bg-slate-50 border-none rounded-[2rem] shadow-inner uppercase" />
                      <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-7 w-7 text-slate-300" />
                    </div>
                    {showDropdown && (
                      <div className="absolute z-50 mt-3 w-full bg-white/95 backdrop-blur-xl border border-slate-100 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
                        <div className="max-h-[300px] overflow-y-auto">
                          {searchResults.length > 0 ? (
                            searchResults.map(p => (
                              <button key={p.id} type="button" onClick={() => handleSelectPatient(p)} className="w-full text-left px-8 py-4 flex items-center justify-between hover:bg-blue-50 transition-colors">
                                <div>
                                  <p className="font-black text-slate-800 uppercase text-sm">{p.full_name || p.paciente}</p>
                                  <p className="text-[10px] text-slate-400 uppercase">CPF: {maskCPF(p.cpf || "")} {p.municipio ? `• ${p.municipio}` : ''}</p>
                                </div>
                                <ChevronRight className="h-5 w-5 text-slate-300" />
                              </button>
                            ))
                          ) : (
                            <div className="p-8 text-center text-[10px] font-black uppercase text-slate-400">Novo Paciente</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="space-y-3 relative">
                    <Label className="uppercase text-[10px] font-black tracking-widest text-slate-400 ml-5">CPF</Label>
                    <Input placeholder="000.000.000-00" value={formData.cpf} onChange={e => setFormData(p => ({ ...p, cpf: maskCPF(e.target.value) }))} className="pl-16 h-16 font-bold text-center text-lg bg-slate-50 border-none rounded-[1.5rem]" />
                    <CreditCard className="absolute left-6 bottom-[1.2rem] h-6 w-6 text-blue-500" />
                  </div>
                  <div className="space-y-3 relative">
                    <Label className="uppercase text-[10px] font-black tracking-widest text-slate-400 ml-5">SUS</Label>
                    <Input placeholder="000 0000 0000 0000" value={formData.sus} onChange={e => setFormData(prev => ({ ...prev, sus: e.target.value }))} className="pl-16 h-16 font-bold text-center text-lg bg-slate-50 border-none rounded-[1.5rem]" />
                    <ClipboardList className="absolute left-6 bottom-[1.2rem] h-6 w-6 text-emerald-500" />
                  </div>
                  <div className="space-y-3 relative">
                    <Label className="uppercase text-[10px] font-black tracking-widest text-slate-400 ml-5">CHAVE SISREG</Label>
                    <Input 
                      placeholder="APENAS NÚMEROS" 
                      value={formData.chave_sisreg === 'IMPORT_SISREG' ? '' : formData.chave_sisreg} 
                      onChange={e => {
                        const v = e.target.value.replace(/\D/g, "")
                        setFormData(prev => ({ ...prev, chave_sisreg: v }))
                      }} 
                      className="pl-16 h-16 font-bold text-center text-lg bg-slate-50 border-none rounded-[1.5rem] uppercase" 
                    />
                    <FileText className="absolute left-6 bottom-[1.2rem] h-6 w-6 text-purple-500" />
                  </div>
                  {/* EXAMS LIST */}
                  <div className="md:col-span-2 space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                      <h3 className="text-xl font-black font-space uppercase tracking-tight text-slate-700">Lista de Procedimentos</h3>
                      <Button type="button" onClick={addExam} className="rounded-full bg-blue-500 hover:bg-blue-600 text-white h-10 px-6 font-black uppercase text-[10px] tracking-widest gap-2">
                        <Plus className="h-4 w-4" /> Adicionar Procedimento
                      </Button>
                    </div>

                    <div className="space-y-4">
                      {exams.map((exam, index) => (
                        <div key={exam.id} className="p-6 bg-white/50 border border-slate-100 rounded-[2rem] relative group/item hover:bg-white transition-all shadow-sm">
                          <button type="button" onClick={() => removeExam(exam.id)} className="absolute -top-2 -right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover/item:opacity-100 transition-opacity shadow-lg">
                            <Trash2 className="h-4 w-4" />
                          </button>
                          
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <SearchableAdder 
                              label="Procedimento"
                              placeholder="Selecione..."
                              value={exam.procedure_name}
                              canAdd={isAdmin}
                              options={dynamicProcedures}
                              onSelect={(v) => updateExam(exam.id, 'procedure_name', v)}
                              onAddNew={handleAddNewProcedure}
                            />
                            <SearchableAdder 
                              label="Especificação"
                              placeholder="Selecione..."
                              value={exam.exam_type}
                              canAdd={true}
                              options={dynamicTypes[exam.procedure_name] || []}
                              onSelect={(v) => updateExam(exam.id, 'exam_type', v)}
                              onAddNew={(v) => handleAddNewType(v, exam.procedure_name)}
                            />
                            <div className="space-y-1.5">
                              <Label className="uppercase text-[9px] font-black tracking-widest text-slate-400 ml-2">Data</Label>
                              <Input type="date" value={exam.exam_date} onChange={e => updateExam(exam.id, 'exam_date', e.target.value)} className="h-12 bg-slate-50 border-none rounded-xl text-xs font-black text-center" />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="uppercase text-[9px] font-black tracking-widest text-slate-400 ml-2">Hora</Label>
                              <Input type="time" value={exam.exam_time} onChange={e => updateExam(exam.id, 'exam_time', e.target.value)} className="h-12 bg-slate-50 border-none rounded-xl text-xs font-black text-center" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 pt-10">
                    <Button type="submit" disabled={isSubmitting || !hasSlots || isCheckingSlots} className={`h-20 rounded-[2rem] text-white font-black text-xl tracking-widest uppercase shadow-xl transition-all ${hasSlots ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-200 text-slate-400'}`}>
                      {isSubmitting ? <Loader2 className="animate-spin" /> : "Confirmar Agendamento"}
                    </Button>
                    {lastSaved && (
                      <Button type="button" onClick={() => generatePrintableFicha()} className="rounded-[2rem] bg-emerald-600 text-white h-20 font-black uppercase shadow-xl hover:bg-emerald-700">
                        <Printer className="mr-2" /> Gerar Ficha (Impressão/PDF)
                      </Button>
                    )}
                  </div>
                </div>
              </form>
            </div>
          </div>
          <div className="hidden xl:block xl:col-span-4 self-stretch space-y-8">
            <div className="glass-card bg-white border-none rounded-[4rem] p-8 shadow-2xl flex flex-col items-center justify-between sticky top-8">
              <HumanModel procedure={exams[0]?.procedure_name || ""} />
              <div className="mt-8 p-8 bg-slate-50 rounded-[3rem] w-full">
                <p className="text-sm font-bold text-slate-600 leading-relaxed uppercase">
                  Zona diagnosticada para <span className="text-blue-600 font-extrabold">{exams[0]?.procedure_name || "Exame"}</span>. Verifique orientações no PDF.
                </p>
              </div>

              {/* DETALHAMENTO DE VAGAS POR PROCEDIMENTO */}
              <div className="w-full mt-10 space-y-6">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">Ocupação das Vagas</h4>
                
                {exams.map((ex, idx) => {
                  const key = `${ex.procedure_name}|${ex.exam_date}`
                  const occupants = procedurePatients[key] || []
                  
                  return (
                    <div key={idx} className="bg-slate-50/50 rounded-[2rem] p-6 border border-slate-100">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-[10px] font-black uppercase text-blue-600">{ex.procedure_name}</span>
                        <span className="text-[9px] font-bold text-slate-400">{ex.exam_date ? format(parseISO(ex.exam_date), 'dd/MM') : '--'}</span>
                      </div>
                      
                      <div className="space-y-2">
                        {occupants.length === 0 ? (
                          <p className="text-[8px] font-bold text-slate-300 uppercase italic text-center">Nenhum ocupante ainda</p>
                        ) : (
                          occupants.slice(0, 5).map((occ, i) => (
                            <div key={i} className="flex items-center justify-between bg-white px-3 py-2 rounded-xl shadow-sm">
                              <span className="text-[9px] font-black text-slate-600 uppercase truncate max-w-[120px]">{occ.patient_name}</span>
                              <span className="text-[8px] font-bold text-blue-500">{occ.exam_time}</span>
                            </div>
                          ))
                        )}
                        {occupants.length > 5 && (
                          <p className="text-[8px] font-black text-slate-400 text-center mt-2">+{occupants.length - 5} OUTROS</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* LISTA DE AGENDADOS NA DATA */}
        <div className="mt-12 glass-premium rounded-[2.5rem] p-8 lg:p-12 shadow-premium relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 mb-8">
            <h3 className="text-2xl font-black font-space uppercase tracking-tight text-slate-800 flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-2xl shadow-lg shadow-emerald-500/20">
                <ClipboardList className="h-6 w-6" />
              </div>
              Agendados para {selectedAgendadoDate ? format(new Date(selectedAgendadoDate + 'T00:00:00'), 'dd/MM/yyyy') : '---'}
            </h3>

            <div className="flex flex-wrap items-center gap-3">
              {/* Seletor de Data independente do formulario */}
              <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-2xl px-4 py-2.5 shadow-soft">
                <CalendarDays className="h-4 w-4 text-emerald-500 shrink-0" />
                <input
                  type="date"
                  value={selectedAgendadoDate}
                  onChange={e => setSelectedAgendadoDate(e.target.value)}
                  className="bg-transparent border-none text-[11px] font-black uppercase text-slate-600 focus:ring-0 focus:outline-none cursor-pointer"
                />
              </div>
              {/* Busca por nome */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  className="bg-white border border-slate-100 rounded-2xl px-3 py-2.5 pl-10 text-[10px] font-black uppercase tracking-widest focus:ring-0 w-56"
                  placeholder="Filtrar por nome..."
                  value={appointmentSearch}
                  onChange={e => setAppointmentSearch(e.target.value)}
                />
              </div>
              <div className="bg-white px-5 py-2.5 rounded-2xl border border-slate-100 shadow-soft text-[10px] font-black text-slate-500 uppercase">{filteredAppointments.length} pacientes</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredAppointments.length === 0 ? (
              <div className="col-span-full py-10 text-center text-slate-400 font-bold italic opacity-50 uppercase text-xs tracking-widest">Nenhum agendamento encontrado</div>
            ) : (
              filteredAppointments.map(appt => (
                <div key={appt.id} className="bg-white/60 hover:bg-white p-5 rounded-3xl border border-slate-100 flex items-center justify-between group transition-all hover:shadow-xl hover:-translate-y-1">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center font-black text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">{appt.patient_name.charAt(0)}</div>
                    <div>
                      <p className="text-xs font-black text-slate-800 uppercase line-clamp-1">{appt.patient_name}</p>
                      <p className="text-[8px] font-bold text-slate-400 flex items-center gap-2 mt-1 uppercase"><Clock className="h-3 w-3" /> {appt.exam_time} • {appt.procedure_name}</p>
                    </div>
                  </div>
                  <Button onClick={() => generatePrintableFicha(appt)} variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-blue-500 hover:bg-blue-50 transition-all border border-transparent hover:border-blue-100">
                    <Printer className="h-5 w-5" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      `}</style>
      <ExamManagerModal 
        isOpen={isManagerOpen} 
        onOpenChange={setIsManagerOpen} 
        onUpdate={loadConfig} 
      />
    </div>
  )
}
