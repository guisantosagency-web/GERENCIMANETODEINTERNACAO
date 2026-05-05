"use client"

import { useState, useEffect, useMemo, useRef, memo } from "react"
import { createBrowserClient } from "@supabase/ssr"
import {
  CalendarDays, Search, User, Users, CreditCard, ClipboardList,
  Trash2, Plus, Clock, FileText, Settings2, PlusCircle,
  CheckCircle2, AlertCircle, Loader2, ChevronRight, Printer, Activity, MapPin
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { format, parseISO, addMonths, subMonths, subDays, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday } from "date-fns"
import { ptBR } from "date-fns/locale"
import { searchMasterPatients, upsertMasterPatient } from "@/lib/patient-search"
import { ExamManagerModal } from "@/components/exam-manager-modal"
import { useAuth } from "@/lib/auth-context"


const FALLBACK_PROCEDURES = ["RAIO X", "TOMOGRAFIA", "ULTRASSONOGRAFIA", "MAMOGRAFIA", "ELETROCARDIOGRAMA"]
const FALLBACK_TYPES: Record<string, string[]> = {
  "TOMOGRAFIA": ["SEM CONTRASTE", "COM CONTRASTE", "ANGIOTOMOGRAFIA"],
  "RAIO X": ["TÓRAX", "ABDOMEN", "BRAÇO", "PERNA", "COLUNA"],
  "ULTRASSONOGRAFIA": ["ABDOMEN TOTAL", "ARTICULAÇÃO", "MAMAS", "TIREOIDE"],
}

const SearchableAdder = memo(function SearchableAdder({ label, placeholder, value, onSelect, onAddNew, options, canAdd, icon: Icon }: any) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const containerRef = useRef<HTMLDivElement>(null)

  const filtered = options.filter((o: string) => o.toLowerCase().includes(search.toLowerCase()))

  useEffect(() => {
    const click = (e: any) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener("mousedown", click)
    return () => document.removeEventListener("mousedown", click)
  }, [])

  return (
    <div className="space-y-2 relative" ref={containerRef}>
      <Label className="uppercase text-[9px] font-bold tracking-wider text-slate-500 ml-2">{label}</Label>
      <div
        onClick={() => setOpen(!open)}
        className="h-12 bg-white border border-slate-200 rounded-xl flex items-center px-4 cursor-pointer group hover:border-teal-400 transition-all shadow-sm"
      >
        <span className={`text-[10px] font-bold uppercase flex-1 ${value ? 'text-slate-800' : 'text-slate-400'}`}>{value || placeholder}</span>
        <ChevronRight className={`h-4 w-4 text-slate-400 transition-transform ${open ? 'rotate-90 text-teal-500' : ''}`} />
      </div>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden animate-in fade-in zoom-in-95">
          <div className="p-2 border-b border-slate-100 bg-slate-50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                className="w-full bg-white border border-slate-200 rounded-lg py-2 pl-9 text-[10px] font-bold uppercase text-slate-700 outline-none focus:border-teal-400 transition-colors"
                placeholder="FILTRAR..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                autoFocus
              />
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.map((o: string) => (
              <button
                key={o}
                onClick={() => { onSelect(o); setOpen(false); }}
                className="w-full text-left px-4 py-2.5 text-[10px] font-bold uppercase text-slate-600 hover:bg-slate-50 hover:text-teal-600 transition-colors"
              >
                {o}
              </button>
            ))}
            {search && !options.includes(search.toUpperCase()) && canAdd && (
              <button
                onClick={() => { onAddNew(search.toUpperCase()); onSelect(search.toUpperCase()); setOpen(false); }}
                className="w-full text-left px-4 py-3 text-[10px] font-bold uppercase text-teal-600 bg-teal-50 hover:bg-teal-100 transition-colors mt-1 border-t border-teal-100"
              >
                + CADASTRAR "{search.toUpperCase()}"
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
})

const HumanModel = memo(function HumanModel({ procedure }: { procedure: string }) {
  const p = procedure.toUpperCase()
  const isHead = p.includes("CRÂNIO") || p.includes("FACE")
  const isTorax = p.includes("TÓRAX") || p.includes("CORAÇÃO")
  const isAbdomen = p.includes("ABDOMEN") || p.includes("PELVE") || p.includes("RINS")
  const isLimbs = p.includes("BRAÇO") || p.includes("PERNA") || p.includes("MÃO") || p.includes("PÉ")
  const isLaboratorial = p.includes("SANGUE") || p.includes("LABORATORIAL")

  return (
    <div className="relative w-full aspect-[3/4] max-h-[500px] flex items-center justify-center p-8 group">
      <div className="absolute inset-0 bg-teal-50 rounded-full blur-[80px] group-hover:bg-teal-100 transition-all duration-1000 opacity-60" />

      <div className="relative z-10 w-full h-full flex items-center justify-center">
        {/* Esqueleto Holográfico Light */}
        <svg viewBox="0 0 200 500" className="w-[80%] h-full">
          <defs>
            <linearGradient id="bodyGradientLight" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#e2e8f0" />
              <stop offset="100%" stopColor="#f8fafc" />
            </linearGradient>
            <filter id="glowLight">
              <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <g filter="url(#glowLight)">
            {/* Cabeça */}
            <circle cx="100" cy="50" r="30"
              className={`transition-all duration-500 ${isHead ? 'fill-teal-300 opacity-80' : isLaboratorial ? 'fill-teal-100 opacity-50' : 'fill-[url(#bodyGradientLight)]'}`}
            />
            {/* Tronco */}
            <path d="M70 90 L130 90 L140 250 L60 250 Z"
              className={`transition-all duration-500 ${isTorax || isAbdomen ? 'fill-teal-300 opacity-80' : isLaboratorial ? 'fill-teal-100 opacity-50' : 'fill-[url(#bodyGradientLight)]'}`}
            />
            {/* Braços */}
            <path d="M60 100 L20 250 L40 255 L70 110 Z" className="fill-slate-200" />
            <path d="M140 100 L180 250 L160 255 L130 110 Z" className="fill-slate-200" />
            {/* Pernas */}
            <path d="M70 260 L60 480 L90 480 L100 280 Z" className="fill-slate-200" />
            <path d="M130 260 L140 480 L110 480 L100 280 Z" className="fill-slate-200" />
          </g>

          {/* Animação de Scan */}
          <line x1="0" y1="0" x2="200" y2="0" stroke="#0ea5e9" strokeWidth="1.5" className="animate-scan" />
        </svg>
      </div>

      <div className="absolute top-8 left-8">
        <div className="bg-white/80 backdrop-blur-md py-3 px-4 border border-slate-100 rounded-2xl flex items-center gap-3 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
          <div className="relative">
            <div className={`w-2.5 h-2.5 rounded-full ${procedure ? 'bg-teal-500' : 'bg-slate-300'}`} />
            <div className={`absolute inset-0 rounded-full animate-ping ${procedure ? 'bg-teal-400 opacity-50' : 'bg-slate-200 opacity-0'}`} />
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 leading-none mb-1">Diagnóstico Visual</p>
            <p className="text-xs font-bold text-slate-800 uppercase tracking-tight">{procedure || "Aguardando"}</p>
          </div>
        </div>
      </div>
    </div>
  )
})

export default function AgendamentoTab() {
  const { logos } = useAuth()
  const [loading, setLoading] = useState(false)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [dynamicProcedures, setDynamicProcedures] = useState<string[]>([])
  const [dynamicTypes, setDynamicTypes] = useState<Record<string, string[]>>({})
  const [isManagerOpen, setIsManagerOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isCheckingSlots, setIsCheckingSlots] = useState(false)
  const [slotInfo, setSlotInfo] = useState<any>(null)
  const [lastSaved, setLastSaved] = useState<any>(null)
  const [dateAppointments, setDateAppointments] = useState<any[]>([])
  const [selectedAgendadoDate, setSelectedAgendadoDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [appointmentSearch, setAppointmentSearch] = useState("")
  
  // Novos estados para gerenciamento de vagas
  const [selectedProcedureForVagas, setSelectedProcedureForVagas] = useState<string | null>(null)
  const [currentVagasMonth, setCurrentVagasMonth] = useState(new Date())
  const [slotsWithBalances, setSlotsWithBalances] = useState<any[]>([])
  const [isLoadingSlots, setIsLoadingSlots] = useState(false)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [activeExamId, setActiveExamId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    patient_name: "",
    cpf: "",
    sus: "",
    chave_sisreg: "",
    municipio: "",
    estado: "MA"
  })

  const [exams, setExams] = useState([{
    id: Math.random().toString(36).substr(2, 9),
    exam_date: format(new Date(), 'yyyy-MM-dd'),
    exam_time: "07:00",
    procedure_name: "",
    exam_type: "",
    isSlotSelected: false
  }])

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    loadConfig()
    checkAdmin()
  }, [])

  async function checkAdmin() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      setIsAdmin(data?.role === 'admin')
    }
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function loadConfig() {
    const { data: pData } = await supabase.from("exam_procedures_list").select("name")
    const { data: tData } = await supabase.from("exam_types_list").select("name, procedure_name")
    setDynamicProcedures((pData || []).map(p => p.name))
    const typeMap = (tData || []).reduce((acc: any, curr: any) => {
      if (!acc[curr.procedure_name]) acc[curr.procedure_name] = []
      acc[curr.procedure_name].push(curr.name)
      return acc
    }, {})
    setDynamicTypes(typeMap)

    if (exams[0] && !exams[0].procedure_name && pData && pData.length > 0) {
      const pName = pData[0].name
      setExams([{
        ...exams[0],
        procedure_name: pName,
        exam_type: typeMap[pName]?.[0] || ""
      }])
      setSelectedProcedureForVagas(pName)
    }
  }

  useEffect(() => {
    if (selectedProcedureForVagas) {
      fetchSlotsWithBalances()
    }
  }, [selectedProcedureForVagas, currentVagasMonth])

  const fetchSlotsWithBalances = async () => {
    setIsLoadingSlots(true)
    try {
      const start = format(startOfMonth(currentVagasMonth), 'yyyy-MM-dd')
      const end = format(endOfMonth(currentVagasMonth), 'yyyy-MM-dd')

      // 1. Buscar todas as configurações de vagas para o mês e procedimento
      const { data: slotConfigs } = await supabase
        .from("exam_slots")
        .select("*")
        .eq("procedure_name", selectedProcedureForVagas)
        .gte("exam_date", start)
        .lte("exam_date", end)

      // 2. Buscar contagem de agendamentos para o mês e procedimento
      const { data: appointments } = await supabase
        .from("exam_appointments")
        .select("exam_date")
        .eq("procedure_name", selectedProcedureForVagas)
        .neq("status", "cancelado")
        .gte("exam_date", start)
        .lte("exam_date", end)

      // Agrupar agendamentos por data
      const apptCounts: Record<string, number> = {}
      appointments?.forEach(a => {
        apptCounts[a.exam_date] = (apptCounts[a.exam_date] || 0) + 1
      })

      // 3. Mapear dias do mês
      const days = eachDayOfInterval({
        start: startOfMonth(currentVagasMonth),
        end: endOfMonth(currentVagasMonth)
      })

      const results = days.map(day => {
        const dateStr = format(day, 'yyyy-MM-dd')
        const config = slotConfigs?.find(c => c.exam_date === dateStr)
        const total = config?.total_slots || 0
        const occupied = apptCounts[dateStr] || 0
        return {
          date: day,
          dateStr,
          total,
          occupied,
          balance: total - occupied
        }
      }).filter(d => d.total > 0 || d.occupied > 0) // Mostrar apenas dias que tenham configuração ou agendamentos

      setSlotsWithBalances(results)
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoadingSlots(false)
    }
  }

  const maskCPF = (v: string) => {
    v = v.replace(/\D/g, "")
    if (v.length > 11) v = v.substring(0, 11)
    return v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
  }

  const handleNameInput = async (val: string) => {
    setFormData(prev => ({ ...prev, patient_name: val }))
    
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)

    if (val.length < 3) {
      setSearchResults([])
      setShowDropdown(false)
      return
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setShowDropdown(true)
      try {
        const results = await searchMasterPatients(val)
        setSearchResults(results)
      } catch (e) { }
    }, 400)
  }

  const handleSelectPatient = (patient: any) => {
    setFormData(prev => ({
      ...prev,
      patient_name: (patient.full_name || patient.paciente || "").toUpperCase(),
      cpf: maskCPF(patient.cpf || ""),
      sus: patient.sus || "",
      municipio: patient.municipio || "",
      estado: patient.estado || "MA",
    }))
    setShowDropdown(false)
  }

  const addExam = () => {
    setExams([...exams, {
      id: Math.random().toString(36).substr(2, 9),
      exam_date: format(new Date(), 'yyyy-MM-dd'),
      exam_time: "07:00",
      procedure_name: "",
      exam_type: "",
      isSlotSelected: false
    }])
  }

  const removeExam = (id: string) => {
    if (exams.length <= 1) return
    setExams(prev => prev.filter(e => e.id !== id))
  }

  const updateExam = (id: string, field: string, value: any) => {
    setExams(prev => prev.map(e => {
      if (e.id === id) {
        const updated: any = { ...e, [field]: value }
        
        // Se mudou o procedimento, atualiza o tipo padrão
        if (field === 'procedure_name' && dynamicTypes[value]) {
          updated.exam_type = dynamicTypes[value][0] || ""
        }

        // Lógica de horário padrão para Ultrassom conforme o dia da semana
        const isUSG = (updated.procedure_name || "").toUpperCase().includes("ULTRASSONOGRAFIA") || 
                      (updated.procedure_name || "").toUpperCase().includes("ULTRASSOM") || 
                      (updated.procedure_name || "").toUpperCase().includes("USG")

        if (isUSG && (field === 'exam_date' || field === 'procedure_name')) {
          const dateStr = updated.exam_date
          if (dateStr) {
            const date = new Date(dateStr + 'T00:00:00')
            const day = date.getDay()
            if (day === 2) updated.exam_time = "09:00" // Terça
            else if (day === 4) updated.exam_time = "07:00" // Quinta
            else if (day === 5) updated.exam_time = "14:00" // Sexta
          }
        }

        return updated
      }
      return e
    }))
  }

  const handleAddNewType = async (procedure_name: string, new_type: string) => {
    if (!procedure_name || !new_type) return
    try {
      const { error } = await supabase.from("exam_types_list").insert([{ 
        name: new_type.toUpperCase(), 
        procedure_name: procedure_name 
      }])
      if (error) throw error
      await loadConfig()
    } catch (e: any) {
      alert("Erro ao cadastrar especificação: " + e.message)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validação básica inicial antes de abrir a janela
    if (!formData.patient_name) return
    
    // Abrir a janela IMEDIATAMENTE no clique para evitar bloqueio de pop-up
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write('<html><head><title>Processando...</title></head><body style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;color:#64748b;"><div><p style="font-weight:bold;text-align:center;">Processando agendamento...</p><p style="font-size:12px;text-align:center;">Por favor, não feche esta janela.</p></div></body></html>')
    }

    setIsSubmitting(true)
    try {
      const cleanCPF = formData.cpf.replace(/\D/g, "")
      const sus = formData.sus?.trim()

      // 1. Validações internas e de 30 dias
      for (const exam of exams) {
        if (!exam.procedure_name || !exam.exam_date) continue

        // Verificação interna: duplicidade no mesmo pedido (Mesmo Procedimento + Mesma Especificação + Mesma Data)
        const sameExamsInOrder = exams.filter(e => 
          e.procedure_name === exam.procedure_name && 
          e.exam_type === exam.exam_type && 
          e.exam_date === exam.exam_date
        )
        if (sameExamsInOrder.length > 1) {
          alert(`⚠️ PROCEDIMENTOS DUPLICADOS!\n\nVocê está tentando agendar o procedimento "${exam.procedure_name} (${exam.exam_type})" mais de uma vez para este paciente na mesma data.`)
          printWindow?.close()
          setIsSubmitting(false)
          return
        }

        // Verificação de 30 dias (Janela móvel)
        const requestedDate = new Date(exam.exam_date + 'T00:00:00')
        const thirtyDaysAgo = format(subDays(requestedDate, 30), 'yyyy-MM-dd')
        const thirtyDaysLater = format(addDays(requestedDate, 30), 'yyyy-MM-dd')

        let duplicateQuery = supabase
          .from("exam_appointments")
          .select("exam_date, procedure_name, exam_type")
          .eq("procedure_name", exam.procedure_name)
          .eq("exam_type", exam.exam_type) // Agora filtra pela especificação
          .neq("exam_date", exam.exam_date) // Ignora a mesma data (permite duplicatas no mesmo dia)
          .neq("status", "cancelado")
          .gte("exam_date", thirtyDaysAgo)
          .lte("exam_date", thirtyDaysLater)

        if (cleanCPF) {
          duplicateQuery = duplicateQuery.eq("cpf", cleanCPF)
        } else if (sus) {
          duplicateQuery = duplicateQuery.eq("sus", sus)
        } else {
          duplicateQuery = duplicateQuery.eq("patient_name", formData.patient_name.toUpperCase())
        }

        const { data: existingAppts } = await duplicateQuery.limit(1)

        if (existingAppts && existingAppts.length > 0) {
          const foundDate = format(parseISO(existingAppts[0].exam_date), 'dd/MM/yyyy')
          alert(`⚠️ RESTRIÇÃO DE 30 DIAS!\n\nO paciente já possui agendamento para "${exam.procedure_name} (${exam.exam_type})" em ${foundDate}.\n\nNão é permitido realizar o mesmo procedimento com a mesma especificação em um intervalo inferior a 30 dias (exceto no mesmo dia).`)
          printWindow?.close()
          setIsSubmitting(false)
          return
        }

        // 2. Validação de vagas (Saldo)
        const { data: config } = await supabase
          .from("exam_slots")
          .select("total_slots")
          .eq("procedure_name", exam.procedure_name)
          .eq("exam_date", exam.exam_date)
          .single()

        const { count } = await supabase
          .from("exam_appointments")
          .select("*", { count: 'exact', head: true })
          .eq("procedure_name", exam.procedure_name)
          .eq("exam_date", exam.exam_date)
          .neq("status", "cancelado")

        const total = config?.total_slots || 0
        const occupied = count || 0

        if (occupied >= total) {
          alert(`⚠️ VAGAS ESGOTADAS!\n\nO procedimento "${exam.procedure_name}" para o dia ${format(parseISO(exam.exam_date), 'dd/MM/yyyy')} atingiu o limite de ${total} vagas.`)
          printWindow?.close()
          setIsSubmitting(false)
          return
        }
      }

      // 3. Efetuar Agendamento
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
        receptionist_name: "LOGADO"
      }))

      const { data, error } = await supabase.from("exam_appointments").insert(inserts).select()
      if (error) throw error

      await upsertMasterPatient({
        full_name: formData.patient_name.toUpperCase(),
        cpf: cleanCPF || undefined,
        sus: formData.sus || undefined,
        estado: formData.estado || undefined,
        municipio: formData.municipio || undefined,
        origem_cadastro: 'exames',
      })

      alert("Agendamento realizado com sucesso!")
      
      // Preencher a janela que já está aberta
      if (data && data.length > 0) {
        printAppointment({ ...data[0], all_procedures: data }, printWindow)
      } else {
        printWindow?.close()
      }

      setFormData({ patient_name: "", cpf: "", sus: "", chave_sisreg: "", municipio: "", estado: "MA" })
      setExams([{
        id: Math.random().toString(36).substr(2, 9),
        exam_date: format(new Date(), 'yyyy-MM-dd'),
        exam_time: format(new Date(), 'HH:mm'),
        procedure_name: dynamicProcedures[0] || "",
        exam_type: dynamicTypes[dynamicProcedures[0]]?.[0] || ""
      }])
    } catch (err) {
      console.error(err)
      alert("Erro ao realizar agendamento.")
      printWindow?.close()
    } finally {
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    loadDateAppointments(selectedAgendadoDate)
  }, [selectedAgendadoDate])

  const loadDateAppointments = async (date: string) => {
    const { data } = await supabase
      .from("exam_appointments")
      .select("*")
      .eq("exam_date", date)
      .neq("status", "cancelado")
      .order("exam_time")
    setDateAppointments(data || [])
  }

  const groupedAppointments = useMemo(() => {
    const list = appointmentSearch
      ? dateAppointments.filter(a => a.patient_name.toLowerCase().includes(appointmentSearch.toLowerCase()))
      : dateAppointments

    // Agrupa por patient_name + exam_date (embora a data já esteja filtrada no carregamento)
    const groups: Record<string, any[]> = {}
    list.forEach(a => {
      if (!groups[a.patient_name]) groups[a.patient_name] = []
      groups[a.patient_name].push(a)
    })

    return Object.values(groups).map(group => {
      // Retorna o primeiro item como base e anexa a lista completa de procedimentos
      return {
        ...group[0],
        all_procedures: group
      }
    })
  }, [dateAppointments, appointmentSearch])

  const cancelAppointment = async (id: string, name: string) => {
    if (!confirm(`Cancelar o agendamento de ${name}?`)) return
    try {
      await supabase.from('exam_appointments').update({ status: 'cancelado' }).eq('id', id)
      loadDateAppointments(selectedAgendadoDate)
    } catch (err) {
      console.error(err)
      alert('Erro ao cancelar')
    }
  }

  const printAppointment = (appt: any, existingWindow?: Window | null) => {
    // Garantir que temos acesso ao nome e data para o filtro de agrupamento
    const patientName = appt.patient_name || (appt.all_procedures?.[0]?.patient_name)
    const examDate = appt.exam_date || (appt.all_procedures?.[0]?.exam_date)

    if (!patientName) {
      console.error("Dados do paciente ausentes para impressão")
      existingWindow?.close()
      return
    }

    const printWindow = existingWindow || window.open('', '_blank')
    if (!printWindow) return

    // Se não for uma janela existente, escreve um estado inicial
    if (!existingWindow) {
      printWindow.document.write('<html><head><title>Carregando...</title></head><body><div style="padding:20px; font-family:sans-serif;">Gerando comprovante, aguarde...</div></body></html>')
    }

    // Busca todos os exames do mesmo paciente na mesma data para agrupar no comprovante
    const patientAppts = dateAppointments.filter(a =>
      a.patient_name === patientName &&
      a.exam_date === examDate &&
      a.status !== 'cancelado'
    ).sort((a, b) => (a.exam_time || "").localeCompare(b.exam_time || ""))

    // Se por algum motivo o filtro local falhar, usamos o que veio no appt
    const examsToPrint = patientAppts.length > 0 ? patientAppts : (appt.all_procedures || [appt])

    const needsFasting = examsToPrint.some((a: any) => {
      const p = (a.procedure_name || "").toUpperCase()
      const t = (a.exam_type || "").toUpperCase()

      // Angiotomografia e USG sempre mostram jejum (conforme padrão anterior)
      if (p.includes("ANGIOTOMOGRAFIA") || p.includes("ULTRASSONOGRAFIA") || p.includes("USG")) {
        return true
      }

      // Tomografia normal não precisa de jejum, apenas se tiver "CONTRASTE" no nome ou tipo
      if (p.includes("TOMOGRAFIA")) {
        return p.includes("CONTRASTE") || t.includes("CONTRASTE")
      }

      return false
    })

    const mainAppt = examsToPrint[0] || appt

    // Padrão do sistema de internação: verificar se existe qualquer logo
    const hasAnyLogo = logos.logo_hto || logos.logo_maranhao || logos.logo_instituto || logos.logo_sus

    try {
      const examDateStr = mainAppt.exam_date
        ? new Date(mainAppt.exam_date.includes('T') ? mainAppt.exam_date : mainAppt.exam_date + 'T00:00:00').toLocaleDateString('pt-BR')
        : '--'

      const content = `
      <!DOCTYPE html><html><head>
        <meta charset="UTF-8">
        <title>Comprovação de Agendamento</title>
        <style>
          @page { size: A4 portrait; margin: 0; }
          body { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #000000; line-height: 1.4; margin: 0; padding: 0; background: #fff; }
          
          .a4-portrait { display: flex; width: 210mm; height: 297mm; overflow: hidden; }
          .receipt-copy { width: 100%; height: 100%; padding: 10mm; position: relative; box-sizing: border-box; display: flex; flex-direction: column; }

          /* Header */
          .header { display: flex; align-items: flex-start; justify-content: space-between; border-bottom: 2px solid #000000; padding-bottom: 4mm; margin-bottom: 6mm; }
          .logo-box { display: flex; flex-direction: row; gap: 4mm; align-items: center; }
          .logo-hospital { height: 14mm; }
          .logo-invisa { height: 12mm; opacity: 0.9; }
          .logo-gov { height: 12mm; opacity: 0.8; }
          .logo-sus { height: 12mm; opacity: 0.9; }
          .doc-title { text-align: right; }
          .doc-title h1 { margin: 0; font-size: 11pt; color: #000000; text-transform: uppercase; letter-spacing: 0.5px; }
          .doc-title p { margin: 1mm 0 0 0; font-size: 7pt; color: #000000; font-weight: bold; text-transform: uppercase; }

          /* Sections */
          .section { margin-bottom: 5mm; }
          .section-title { font-size: 10pt; font-weight: 800; color: #000000; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 2mm; display: flex; align-items: center; gap: 2mm; border-left: 4px solid #000000; padding-left: 2mm; }
          
          /* Data Grid */
          .data-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 3mm; background: #f8fafc; padding: 3mm; border-radius: 8px; border: 1px solid #f1f5f9; }
          .data-item { display: flex; flex-direction: column; }
          .data-label { font-size: 9pt; font-weight: bold; color: #000000; text-transform: uppercase; margin-bottom: 0.5mm; }
          .data-value { font-size: 12pt; font-weight: 700; color: #000000; overflow: hidden; text-overflow: ellipsis; }
          .full-width { grid-column: span 2; }

          /* Guidelines Box */
          .guidelines { padding: 4mm; background: #f0fdfa; border-radius: 12px; border: 1px solid #ccfbf1; margin-top: auto; }
          .guidelines h3 { margin: 0 0 2mm 0; font-size: 9pt; text-transform: uppercase; color: #000000; }
          .guidelines ul { margin: 0; padding-left: 4mm; font-size: 10pt; color: #000000; }
          .guidelines li { margin-bottom: 1mm; }

          /* Footer */
          .footer { margin-top: 5mm; font-size: 7.5pt; color: #000000; border-top: 1px solid #f1f5f9; padding-top: 3mm; display: flex; justify-content: space-between; align-items: flex-end; }
          .signature { border-top: 1px solid #cbd5e1; width: 45mm; text-align: center; padding-top: 1mm; font-size: 7.5pt; color: #000000; font-weight: bold; text-transform: uppercase; }
          
          @media print { body { -webkit-print-color-adjust: exact; } }
        </style>
      </head><body>
        <div class="a4-portrait">
          <div class="receipt-copy">
            <div class="header">
              <div class="logo-box">
                ${logos.logo_hto ? `<img src="${logos.logo_hto}" class="logo-hospital" />` : `<img src="/images/hto-20nova.png" class="logo-hospital" />`}
                ${logos.logo_instituto ? `<img src="${logos.logo_instituto}" class="logo-invisa" />` : ""}
                ${logos.logo_maranhao ? `<img src="${logos.logo_maranhao}" class="logo-gov" />` : `<img src="/images/logo-20gov.png" class="logo-gov" />`}
                ${logos.logo_sus ? `<img src="${logos.logo_sus}" class="logo-sus" />` : ""}
              </div>
              <div class="doc-title">
                <h1>Exames</h1>
                <p>HTO Caxias</p>
                <p style="font-size: 7pt; margin-top: 2px; color: #000000; font-weight: 800;">VIA PACIENTE</p>
              </div>
            </div>

            <div class="section">
              <div class="section-title">Dados do Paciente</div>
              <div class="data-grid">
                <div class="data-item full-width">
                  <span class="data-label">Paciente</span>
                  <span class="data-value">${mainAppt.patient_name || '--'}</span>
                </div>
                <div class="data-item">
                  <span class="data-label">CPF</span>
                  <span class="data-value">${mainAppt.cpf || '--'}</span>
                </div>
                <div class="data-item">
                  <span class="data-label">Cartão SUS</span>
                  <span class="data-value">${mainAppt.sus || '--'}</span>
                </div>
              </div>
            </div>

            <div class="section" style="flex: 1; min-height: 0;">
              <div class="section-title">Informações dos Exames</div>
              <div class="data-grid" style="grid-template-columns: 1fr 1fr; gap: 2mm 4mm; align-content: start;">
                ${examsToPrint.map((a: any) => `
                  <div class="data-item" style="border-left: 3px solid #000000; padding-left: 2mm; margin-bottom: 2mm;">
                    <span class="data-label" style="font-size: 10pt; line-height: 1.2;">${a.exam_time || ''} — ${a.procedure_name || ''}</span>
                    <span class="data-value" style="font-size: 12pt; color: #000000;">${a.exam_type || 'PADRÃO'}</span>
                  </div>
                `).join('')}
                <div class="data-item full-width" style="display: grid; grid-template-columns: 1fr 1fr; gap: 3mm; margin-top: 2mm; padding-top: 2mm; border-top: 2px solid #000000;">
                  <div class="data-item">
                    <span class="data-label">Status Geral</span>
                    <span class="data-value" style="color: #000000; font-size: 12pt;">AGENDADOS</span>
                  </div>
                  <div class="data-item">
                    <span class="data-label">Data</span>
                    <span class="data-value" style="font-size: 12pt;">${examDateStr}</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="guidelines">
              <h3>Orientações</h3>
              <ul>
                <li>Chegar com <strong>20 min</strong> de antecedência.</li>
                <li>Documento com foto e Cartão SUS obrigatórios.</li>
                ${needsFasting ? `
                  <li><strong>JEJUM:</strong> 04 a 06 horas (água permitida).</li>
                  <li>Trazer exames anteriores da região.</li>
                ` : '<li>Não é necessário preparo especial.</li>'}
              </ul>
            </div>

            <div class="footer">
              <div class="footer-info">
                <strong>HTO Caxias</strong> — Serviço de Excelência<br/>
                Impresso em ${new Date().toLocaleString('pt-BR')}<br/>
                <span style="font-size: 5.5pt; color: #000000; margin-top: 1mm; display: block;">Desenvolvido por Guilherme Santos — Avero Agency</span>
              </div>
              <div style="text-align: right;">
                <div style="margin-bottom: 4mm; font-size: 9pt; font-weight: bold; text-transform: uppercase; color: #000000;">
                  Data de Recebimento do Exame: ______/___________________/___________
                </div>
                <div class="signature">
                  Carimbo e Visto
                </div>
              </div>
            </div>
          </div>
        </div>
      </body></html>`

      printWindow.document.open()
      printWindow.document.write(content)
      printWindow.document.close()

      setTimeout(() => {
        if (printWindow.closed) return
        printWindow.print()
      }, 1500)
    } catch (err: any) {
      console.error("Erro na geração:", err)
      printWindow.document.open()
      printWindow.document.write(`
        <div style="padding: 20px; font-family: sans-serif; color: red;">
          <h2>Erro Crítico</h2>
          <p>${err?.message || "Erro de renderização"}</p>
        </div>
      `)
      printWindow.document.close()
    }
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 relative">
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">

        {/* FORM SIDE */}
        <div className="xl:col-span-8 flex flex-col gap-6">
          <div className="bg-white rounded-[2rem] p-8 lg:p-10 shadow-sm border border-slate-100 relative overflow-hidden group">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold font-space uppercase tracking-tight text-slate-800 flex items-center gap-4">
                <div className="p-3 bg-teal-50 text-teal-600 rounded-xl shadow-sm border border-teal-100">
                  <CalendarDays className="h-6 w-6" />
                </div>
                Novo Agendamento
              </h2>
              <Button onClick={() => setIsManagerOpen(true)} variant="ghost" className="bg-slate-50 hover:bg-slate-100 text-slate-500 border border-slate-200 font-bold uppercase text-[10px] tracking-wider gap-2 rounded-xl">
                <Settings2 className="h-4 w-4" /> Ajustes Oficiais
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-6 gap-5">

                {/* Paciente Section */}
                <div className="md:col-span-6 space-y-1 relative" ref={dropdownRef}>
                  <Label className="uppercase text-[9px] font-bold tracking-wider text-slate-500 ml-2">Nome Completo do Paciente</Label>
                  <div className="relative group">
                    <Input
                      required
                      autoComplete="off"
                      placeholder="BUSCAR OU DIGITAR NOME..."
                      value={formData.patient_name}
                      onChange={e => handleNameInput(e.target.value)}
                      className="h-14 pl-12 bg-white border-slate-200 rounded-xl text-xs font-bold uppercase text-slate-700 shadow-sm focus:border-teal-400 focus:ring-1 focus:ring-teal-100 outline-none transition-all"
                    />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-teal-500" />
                  </div>
                  {showDropdown && (
                    <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden animate-in fade-in zoom-in-95">
                      <div className="max-h-60 overflow-y-auto divide-y divide-slate-100">
                        {searchResults.length > 0 ? (
                          searchResults.map(p => (
                            <button key={p.id} type="button" onClick={() => handleSelectPatient(p)} className="w-full text-left px-5 py-3 flex items-center justify-between hover:bg-slate-50 group transition-all text-slate-700">
                              <div>
                                <p className="font-bold uppercase text-[11px] tracking-tight group-hover:text-teal-600">{p.full_name || p.paciente}</p>
                                <p className="text-[9px] text-slate-500 font-bold mt-0.5">CPF: {maskCPF(p.cpf || "")} {p.municipio ? `• ${p.municipio}` : ''}</p>
                              </div>
                              <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-teal-500" />
                            </button>
                          ))
                        ) : (
                          <div className="p-5 text-center text-[10px] font-bold uppercase text-slate-500">Nenhum cadastro encontrado. <span className="text-teal-600">Deseja cadastrar como novo?</span></div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="md:col-span-2 space-y-1">
                  <Label className="uppercase text-[9px] font-bold tracking-wider text-slate-500 ml-2">CPF</Label>
                  <div className="relative">
                    <Input value={formData.cpf} onChange={e => setFormData(p => ({ ...p, cpf: maskCPF(e.target.value) }))} className="h-12 pl-10 bg-white border-slate-200 rounded-xl text-xs font-bold text-slate-700 text-center shadow-sm focus:border-teal-400 outline-none transition-colors" placeholder="000.000.000-00" />
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  </div>
                </div>

                <div className="md:col-span-2 space-y-1">
                  <Label className="uppercase text-[9px] font-bold tracking-wider text-slate-500 ml-2">Cartão SUS</Label>
                  <div className="relative">
                    <Input value={formData.sus} onChange={e => setFormData(p => ({ ...p, sus: e.target.value }))} className="h-12 pl-10 bg-white border-slate-200 rounded-xl text-xs font-bold text-slate-700 text-center shadow-sm focus:border-teal-400 outline-none transition-colors" placeholder="000 0000 0000 0000" />
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  </div>
                </div>

                <div className="md:col-span-2 space-y-1">
                  <Label className="uppercase text-[9px] font-bold tracking-wider text-slate-500 ml-2">Chave SISREG</Label>
                  <div className="relative">
                    <Input value={formData.chave_sisreg} onChange={e => setFormData(p => ({ ...p, chave_sisreg: e.target.value }))} className="h-12 pl-10 bg-white border-slate-200 rounded-xl text-xs font-bold text-slate-700 text-center shadow-sm focus:border-purple-400 outline-none transition-colors" placeholder="APENAS NÚMEROS" />
                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  </div>
                </div>

                <div className="md:col-span-3 space-y-1">
                  <Label className="uppercase text-[9px] font-bold tracking-wider text-slate-500 ml-2">Estado</Label>
                  <Input value={formData.estado} disabled className="h-12 bg-slate-50 border-slate-200 rounded-xl text-xs font-bold text-slate-400 text-center cursor-not-allowed" />
                </div>

                <div className="md:col-span-3 space-y-1">
                  <Label className="uppercase text-[9px] font-bold tracking-wider text-slate-500 ml-2">Município</Label>
                  <Input value={formData.municipio} onChange={e => setFormData(p => ({ ...p, municipio: e.target.value.toUpperCase() }))} className="h-12 bg-white border-slate-200 rounded-xl text-xs font-bold text-slate-700 uppercase text-center shadow-sm focus:border-teal-400 outline-none transition-colors" placeholder="EX: IMPERATRIZ" />
                </div>

                {/* Exames List - NEW INLINE WORKFLOW */}
                <div className="md:col-span-6 pt-6 space-y-8">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-50">
                    <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider flex items-center gap-2">
                      <Plus className="h-4 w-4 text-teal-500" /> Detalhes dos Procedimentos
                    </h3>
                  </div>

                  {exams.map((exam, idx) => (
                    <div key={exam.id} className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-500">
                      {/* Row Header: Procedure Selection & Inline Details if Selected */}
                      <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 shadow-sm">
                        <div className="flex flex-wrap items-end gap-4">
                          <div className="flex-1 min-w-[240px] space-y-1">
                            <Label className="uppercase text-[9px] font-bold tracking-wider text-slate-500 ml-2">Procedimento {idx + 1}</Label>
                            <div className="relative group">
                              <select 
                                value={exam.procedure_name || ""} 
                                onChange={e => {
                                  const val = e.target.value
                                  updateExam(exam.id, 'procedure_name', val)
                                  updateExam(exam.id, 'isSlotSelected', false) // Reset selection if procedure changes
                                  setSelectedProcedureForVagas(val)
                                  setActiveExamId(exam.id)
                                }}
                                className="w-full h-12 bg-white border border-slate-200 px-4 rounded-xl text-[10px] font-bold text-slate-700 uppercase outline-none focus:border-teal-400 shadow-sm transition-all"
                              >
                                <option value="">SELECIONE UM PROCEDIMENTO...</option>
                                {dynamicProcedures.map(p => <option key={p} value={p}>{p}</option>)}
                              </select>
                              {exams.length > 1 && (
                                <button type="button" onClick={() => removeExam(exam.id)} className="absolute -right-2 -top-2 h-6 w-6 bg-white text-rose-400 hover:text-rose-600 rounded-full shadow-sm border border-slate-100 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          </div>

                          {exam.isSlotSelected && (
                            <>
                              <div className="flex-1 min-w-[180px] space-y-1 animate-in zoom-in-95 duration-300">
                                <SearchableAdder
                                  label="Especificação"
                                  placeholder="Selecione..."
                                  value={exam.exam_type}
                                  options={dynamicTypes[exam.procedure_name] || []}
                                  onSelect={(v: string) => updateExam(exam.id, 'exam_type', v)}
                                  canAdd={!!exam.procedure_name}
                                  onAddNew={(v: string) => handleAddNewType(exam.procedure_name, v)}
                                />
                              </div>
                              <div className="w-[130px] space-y-1 animate-in zoom-in-95 duration-300">
                                <Label className="uppercase text-[9px] font-bold tracking-wider text-slate-500 ml-2">Data</Label>
                                <Input type="date" value={exam.exam_date} onChange={e => updateExam(exam.id, 'exam_date', e.target.value)} className="h-12 bg-white border-slate-200 rounded-xl text-[10px] font-bold text-slate-700 text-center shadow-sm focus:border-teal-400 outline-none transition-colors" />
                              </div>
                              <div className="w-[100px] space-y-1 animate-in zoom-in-95 duration-300">
                                <Label className="uppercase text-[9px] font-bold tracking-wider text-slate-500 ml-2">Horário</Label>
                                <Input type="time" value={exam.exam_time} onChange={e => updateExam(exam.id, 'exam_time', e.target.value)} className="h-12 bg-white border-slate-200 rounded-xl text-[10px] font-bold text-slate-700 text-center shadow-sm focus:border-teal-400 outline-none transition-colors" />
                              </div>
                            </>
                          )}

                          {/* Pagination always visible if procedure selected */}
                          {exam.procedure_name && (
                            <div className="flex items-center gap-2 pt-4">
                              <Button type="button" onClick={() => setCurrentVagasMonth(subMonths(currentVagasMonth, 1))} variant="ghost" className="h-10 w-10 p-0 rounded-xl bg-white border border-slate-200 shadow-sm">
                                <ChevronRight className="h-4 w-4 rotate-180 text-slate-400" />
                              </Button>
                              <div className="text-[9px] font-black uppercase text-slate-600 bg-white border border-slate-200 px-4 h-10 flex items-center rounded-xl shadow-sm min-w-[120px] justify-center">
                                {format(currentVagasMonth, 'MMM yyyy', { locale: ptBR })}
                              </div>
                              <Button type="button" onClick={() => setCurrentVagasMonth(addMonths(currentVagasMonth, 1))} variant="ghost" className="h-10 w-10 p-0 rounded-xl bg-white border border-slate-200 shadow-sm">
                                <ChevronRight className="h-4 w-4 text-slate-400" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Slot Table - Only if procedure selected but slot NOT confirmed */}
                      {!exam.isSlotSelected && exam.procedure_name && (
                        <div className="space-y-3 animate-in fade-in slide-in-from-top-4 duration-500 pl-4 border-l-4 border-teal-500/20">
                          <div className="flex items-center justify-between px-2">
                            <Label className="text-[10px] font-black uppercase text-teal-600 tracking-widest flex items-center gap-2">
                              <CalendarDays className="h-3 w-3" /> Vagas: {exam.procedure_name}
                            </Label>
                            {isLoadingSlots && <Loader2 className="h-4 w-4 animate-spin text-teal-500" />}
                          </div>
                          
                          <div className="bg-white border border-slate-200 rounded-2xl shadow-md overflow-hidden ring-4 ring-slate-50">
                            <div className="max-h-[400px] overflow-y-auto">
                              <table className="w-full text-left border-collapse">
                                <thead className="bg-teal-600 text-white sticky top-0 z-10">
                                  <tr>
                                    <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider">Data / Dia</th>
                                    <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-right">Saldo</th>
                                    <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-center">Ação</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {slotsWithBalances.length === 0 ? (
                                    <tr>
                                      <td colSpan={3} className="px-6 py-12 text-center text-[10px] font-bold text-slate-400 uppercase italic">
                                        Nenhuma vaga configurada para este período.
                                      </td>
                                    </tr>
                                  ) : (
                                    slotsWithBalances.map((s, idx) => (
                                      <tr key={idx} className={`hover:bg-teal-50/30 transition-colors ${s.balance <= 0 ? 'bg-rose-50' : ''}`}>
                                        <td className="px-6 py-4">
                                          <div className="flex flex-col">
                                            <span className={`text-[10px] font-black uppercase ${s.balance <= 0 ? 'text-rose-600' : 'text-slate-700'}`}>
                                              {format(s.date, "dd.MM.yyyy — EEE", { locale: ptBR })}
                                            </span>
                                            <span className={`text-[8px] font-bold ${s.balance <= 0 ? 'text-rose-400 animate-pulse' : 'text-slate-400'}`}>
                                              {s.balance <= 0 ? 'INDISPONÍVEL' : 'DISPONÍVEL'}
                                            </span>
                                          </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black ${s.balance > 0 ? 'bg-teal-50 text-teal-600 border border-teal-100' : 'bg-rose-600 text-white shadow-sm'}`}>
                                            {s.balance <= 0 ? 'ESGOTADO' : `${s.balance} VAGAS`}
                                          </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                          <Button 
                                            type="button" 
                                            disabled={s.balance <= 0}
                                            onClick={() => {
                                              updateExam(exam.id, 'exam_date', s.dateStr)
                                              updateExam(exam.id, 'isSlotSelected', true)
                                            }}
                                            className={`h-9 px-6 text-[10px] font-black uppercase rounded-xl shadow-sm transition-all ${s.balance > 0 ? 'bg-teal-500 hover:bg-teal-600 text-white hover:scale-105 active:scale-95' : 'bg-slate-100 text-slate-400'}`}
                                          >
                                            Selecionar
                                          </Button>
                                        </td>
                                      </tr>
                                    ))
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  <Button 
                    type="button" 
                    onClick={addExam} 
                    className="w-full h-12 border border-dashed border-slate-300 hover:border-teal-400 text-slate-500 hover:text-teal-600 bg-slate-50 hover:bg-teal-50 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all gap-2"
                  >
                    <PlusCircle className="h-4 w-4" /> Adicionar Outro Exame
                  </Button>
                </div>
              </div>

              <div className="flex justify-end pt-6 border-t border-slate-100">
                <Button type="submit" disabled={isSubmitting} className="h-14 px-10 bg-teal-500 hover:bg-teal-600 text-white rounded-xl font-bold uppercase tracking-wider text-xs shadow-sm gap-2 group">
                  {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5 group-hover:scale-110 transition-transform" />}
                  Confirmar Agendamento
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* HOLO MODELS SIDE */}
        <div className="xl:col-span-4 flex flex-col gap-6">
          <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm flex flex-col items-center sticky top-8 overflow-hidden hover:shadow-md transition-shadow">
            <div className="absolute top-0 right-0 w-20 h-20 bg-teal-50 blur-[40px] rounded-full" />
            <HumanModel procedure={exams[0]?.procedure_name || ""} />
            <div className="mt-8 p-5 bg-slate-50 border border-slate-100 rounded-2xl w-full text-center">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider leading-relaxed">
                Análise estrutural para <span className="text-teal-600 font-black">{exams[0]?.procedure_name || "NÃO SELECIONADO"}</span>. Sistema de validação integrado.
              </p>
            </div>
          </div>

          {/* LISTA DE AGENDADOS - RELOCATED TO SIDEBAR */}
          <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm flex flex-col gap-6">
            <div className="flex flex-col gap-4">
              <h3 className="text-lg font-bold font-space text-slate-800 uppercase tracking-tight flex items-center gap-3">
                <div className="p-2 bg-blue-50 text-blue-500 rounded-xl border border-blue-100 shadow-sm">
                  <ClipboardList className="h-4 w-4" />
                </div>
                Agenda Diária
              </h3>
              
              <div className="flex flex-col gap-3">
                <div className="bg-slate-50 border border-slate-200 p-2 px-4 rounded-xl flex flex-col">
                  <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider leading-none mb-1">Data Filtro</span>
                  <input type="date" value={selectedAgendadoDate} onChange={e => setSelectedAgendadoDate(e.target.value)} className="bg-transparent border-none text-[10px] font-bold text-slate-700 outline-none p-0 uppercase" />
                </div>
                <div className="relative group">
                  <Input value={appointmentSearch} onChange={e => setAppointmentSearch(e.target.value)} className="bg-white border-slate-200 rounded-xl h-10 w-full pl-9 text-[10px] font-bold uppercase text-slate-700 shadow-sm focus:border-teal-400 outline-none transition-colors" placeholder="LOCALIZAR..." />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 group-focus-within:text-teal-500" />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4 max-h-[1200px] overflow-y-auto pr-1 no-scrollbar">
              {groupedAppointments.length === 0 ? (
                <div className="py-10 text-center opacity-70">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Nenhum agendamento</p>
                </div>
              ) : (
                groupedAppointments.map(group => (
                  <div key={group.id} className="bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl p-4 transition-colors group">
                    <div className="flex items-start justify-between mb-3">
                      <div className="h-8 w-8 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center font-bold text-teal-600 text-xs shadow-sm group-hover:bg-teal-500 group-hover:text-white transition-colors">
                        {group.patient_name.charAt(0)}
                      </div>
                      <span className="text-[8px] font-bold bg-cyan-50 text-cyan-600 border border-cyan-100 px-2 py-0.5 rounded-md uppercase tracking-wider">
                        {group.all_procedures.length > 1 ? `${group.all_procedures.length} EX` : '1 EX'}
                      </span>
                    </div>
                    <div className="space-y-3">
                      <p className="text-[11px] font-bold text-slate-800 uppercase tracking-tight truncate" title={group.patient_name}>{group.patient_name}</p>

                      <div className="flex flex-col gap-1.5 max-h-32 overflow-y-auto pr-1">
                        {group.all_procedures.map((p: any) => (
                          <div key={p.id} className="flex flex-col gap-0.5 border-l-2 border-teal-400 pl-2">
                            <p className="text-[9px] font-bold text-teal-600 uppercase tracking-wider leading-none">{p.procedure_name}</p>
                            <p className="text-[8px] font-bold text-slate-500 uppercase leading-none">{p.exam_time}</p>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                        <div className="flex items-center gap-1 text-slate-500 font-bold text-[9px]">
                          <Clock className="h-3 w-3 text-orange-400" /> {group.exam_time}
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            size="icon" variant="ghost"
                            onClick={() => printAppointment(group)}
                            className="h-7 w-7 rounded-lg text-slate-400 hover:bg-teal-50 hover:text-teal-600 transition-colors"
                          >
                            <Printer className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon" variant="ghost"
                            onClick={() => {
                              if (group.all_procedures.length > 1) {
                                if (confirm(`Deseja cancelar TODOS os exames de ${group.patient_name}?`)) {
                                  group.all_procedures.forEach((p: any) => cancelAppointment(p.id, group.patient_name))
                                }
                              } else {
                                cancelAppointment(group.id, group.patient_name)
                              }
                            }}
                            className="h-7 w-7 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>



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

      <ExamManagerModal isOpen={isManagerOpen} onOpenChange={setIsManagerOpen} onUpdate={loadConfig} />
    </div>
  )
}
