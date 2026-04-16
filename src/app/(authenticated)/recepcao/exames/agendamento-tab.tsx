"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { 
  CalendarDays, Search, User, CreditCard, ClipboardList, 
  Trash2, Plus, Clock, FileText, Settings2, 
  CheckCircle2, AlertCircle, Loader2, ChevronRight, Printer, Activity, MapPin
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { format, parseISO } from "date-fns"
import { searchMasterPatients, upsertMasterPatient } from "@/lib/patient-search"
import dynamic from "next/dynamic"

// Modal dinâmico
const ExamManagerModal = dynamic(() => import("./exam-manager-modal"), { ssr: false })

const FALLBACK_PROCEDURES = ["RAIO X", "TOMOGRAFIA", "ULTRASSONOGRAFIA", "MAMOGRAFIA", "ELETROCARDIOGRAMA"]
const FALLBACK_TYPES: Record<string, string[]> = {
  "TOMOGRAFIA": ["SEM CONTRASTE", "COM CONTRASTE", "ANGIOTOMOGRAFIA"],
  "RAIO X": ["TÓRAX", "ABDOMEN", "BRAÇO", "PERNA", "COLUNA"],
  "ULTRASSONOGRAFIA": ["ABDOMEN TOTAL", "ARTICULAÇÃO", "MAMAS", "TIREOIDE"],
}

function SearchableAdder({ label, placeholder, value, onSelect, onAddNew, options, canAdd, icon: Icon }: any) {
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
      <Label className="uppercase text-[9px] font-black tracking-widest text-[#7E8C9A] ml-4">{label}</Label>
      <div 
        onClick={() => setOpen(!open)}
        className="h-14 bg-[#161B22] border border-white/5 rounded-2xl flex items-center px-6 cursor-pointer group hover:border-[#FF6B35]/30 transition-all shadow-xl"
      >
        <span className={`text-xs font-black uppercase flex-1 ${value ? 'text-white' : 'text-[#7E8C9A]'}`}>{value || placeholder}</span>
        <ChevronRight className={`h-4 w-4 text-[#7E8C9A] transition-transform ${open ? 'rotate-90 text-[#FF6B35]' : ''}`} />
      </div>

      {open && (
        <div className="absolute z-50 mt-2 w-full bg-[#1A1F26] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
          <div className="p-3 border-b border-white/5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#7E8C9A]" />
              <input 
                className="w-full bg-[#0F1419] border-none rounded-xl py-2 pl-9 text-[10px] font-black uppercase text-white focus:ring-0" 
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
                className="w-full text-left px-5 py-3 text-[10px] font-black uppercase text-[#7E8C9A] hover:bg-[#FF6B35]/10 hover:text-[#FF6B35] transition-colors"
              >
                {o}
              </button>
            ))}
            {search && !options.includes(search.toUpperCase()) && canAdd && (
              <button 
                onClick={() => { onAddNew(search.toUpperCase()); onSelect(search.toUpperCase()); setOpen(false); }}
                className="w-full text-left px-5 py-3 text-[10px] font-black uppercase text-[#00FF88] bg-[#00FF88]/5 hover:bg-[#00FF88]/10"
              >
                + CADASTRAR "{search.toUpperCase()}"
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function HumanModel({ procedure }: { procedure: string }) {
  const p = procedure.toUpperCase()
  const isHead = p.includes("CRÂNIO") || p.includes("FACE")
  const isTorax = p.includes("TÓRAX") || p.includes("CORAÇÃO")
  const isAbdomen = p.includes("ABDOMEN") || p.includes("PELVE") || p.includes("RINS")
  const isLimbs = p.includes("BRAÇO") || p.includes("PERNA") || p.includes("MÃO") || p.includes("PÉ")
  const isLaboratorial = p.includes("SANGUE") || p.includes("LABORATORIAL")

  return (
    <div className="relative w-full aspect-[3/4] max-h-[500px] flex items-center justify-center p-8 group">
      <div className="absolute inset-0 bg-[#FF6B35]/5 rounded-full blur-3xl group-hover:bg-[#FF6B35]/10 transition-all duration-1000" />
      
      <div className="relative z-10 w-full h-full flex items-center justify-center">
        {/* Esqueleto Holográfico */}
        <svg viewBox="0 0 200 500" className="w-[80%] h-full">
          <defs>
            <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#252B33" />
              <stop offset="100%" stopColor="#161B22" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          <g filter="url(#glow)">
            {/* Cabeça */}
            <circle cx="100" cy="50" r="30" 
              className={`transition-all duration-500 ${isHead ? 'fill-[#FF6B35]/80' : isLaboratorial ? 'fill-[#FF6B35]/20' : 'fill-[url(#bodyGradient)]'}`} 
            />
            {/* Tronco */}
            <path d="M70 90 L130 90 L140 250 L60 250 Z" 
              className={`transition-all duration-500 ${isTorax || isAbdomen ? 'fill-[#FF6B35]/60' : isLaboratorial ? 'fill-[#FF6B35]/20' : 'fill-[url(#bodyGradient)]'}`} 
            />
            {/* Braços */}
            <path d="M60 100 L20 250 L40 255 L70 110 Z" className="fill-[#161B22]" />
            <path d="M140 100 L180 250 L160 255 L130 110 Z" className="fill-[#161B22]" />
            {/* Pernas */}
            <path d="M70 260 L60 480 L90 480 L100 280 Z" className="fill-[#161B22]" />
            <path d="M130 260 L140 480 L110 480 L100 280 Z" className="fill-[#161B22]" />
          </g>

          {/* Animação de Scan */}
          <line x1="0" y1="0" x2="200" y2="0" stroke="#FF6B35" strokeWidth="2" className="animate-scan" />
        </svg>
      </div>

      <div className="absolute top-8 left-8">
        <div className="bg-[#161B22]/80 backdrop-blur-2xl p-4 border border-white/5 rounded-3xl shadow-2xl flex items-center gap-4">
          <div className="relative">
            <div className={`w-3 h-3 rounded-full ${procedure ? 'bg-[#FF6B35]' : 'bg-white/10'}`} />
            <div className={`absolute inset-0 rounded-full animate-ping ${procedure ? 'bg-[#FF6B35]/50' : 'bg-white/5'}`} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#7E8C9A] leading-none mb-1">Status Holo-Scan</p>
            <p className="text-sm font-black text-white uppercase tracking-tight">{procedure || "Ocioso"}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AgendamentoTab() {
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
  const [procedurePatients, setProcedurePatients] = useState<Record<string, any[]>>({})

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
    exam_time: format(new Date(), 'HH:mm'),
    procedure_name: "",
    exam_type: ""
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
    
    // Set initial exam procedure if empty
    if (exams[0] && !exams[0].procedure_name && pData && pData.length > 0) {
      const pName = pData[0].name
      setExams([{
        ...exams[0],
        procedure_name: pName,
        exam_type: typeMap[pName]?.[0] || ""
      }])
    }
  }

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
      const results = await searchMasterPatients(val)
      setSearchResults(results)
    } catch (e) { }
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
    setExams(prev => [...prev, {
      id: Math.random().toString(36).substr(2, 9),
      exam_date: format(new Date(), 'yyyy-MM-dd'),
      exam_time: format(new Date(), 'HH:mm'),
      procedure_name: dynamicProcedures[0] || "",
      exam_type: dynamicTypes[dynamicProcedures[0]]?.[0] || ""
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
      const cleanCPF = formData.cpf.replace(/\D/g, "")
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
      
      alert("Agendamento realizado!")
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
      alert("Erro ao agendar")
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

  const filteredAppointments = useMemo(() => {
    if (!appointmentSearch) return dateAppointments
    return dateAppointments.filter(a => a.patient_name.toLowerCase().includes(appointmentSearch.toLowerCase()))
  }, [dateAppointments, appointmentSearch])

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 relative">
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
        
        {/* FORM SIDE */}
        <div className="xl:col-span-8 flex flex-col gap-8">
          <div className="glass-premium rounded-[3rem] p-10 shadow-2xl relative overflow-hidden group border border-white/5">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#FF6B35] via-[#00D9FF] to-[#00FF88]" />
            
            <div className="flex items-center justify-between mb-12">
              <h2 className="text-3xl font-black font-space uppercase tracking-tight text-white flex items-center gap-4">
                <div className="p-4 bg-[#FF6B35] text-white rounded-2xl shadow-lg shadow-[#FF6B35]/20">
                  <CalendarDays className="h-6 w-6" />
                </div>
                Novo Agendamento
              </h2>
              {isAdmin && (
                <Button onClick={() => setIsManagerOpen(true)} className="bg-white/5 hover:bg-white/10 text-[#7E8C9A] border-none font-black uppercase text-[10px] tracking-widest gap-2">
                  <Settings2 className="h-4 w-4" /> Config
                </Button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
                
                {/* Paciente Section */}
                <div className="md:col-span-6 space-y-2 relative" ref={dropdownRef}>
                  <Label className="uppercase text-[9px] font-black tracking-widest text-[#7E8C9A] ml-4">Nome do Paciente</Label>
                  <div className="relative group">
                    <Input 
                      required 
                      autoComplete="off" 
                      placeholder="BUSCAR OU DIGITAR NOME..." 
                      value={formData.patient_name} 
                      onChange={e => handleNameInput(e.target.value)}
                      className="h-16 pl-14 bg-[#161B22] border-white/5 rounded-2xl text-sm font-black uppercase text-white shadow-xl focus:border-[#FF6B35]/50 transition-all"
                    />
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-[#7E8C9A] group-focus-within:text-[#FF6B35]" />
                  </div>
                  {showDropdown && (
                    <div className="absolute z-50 mt-2 w-full bg-[#1A1F26] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
                      <div className="max-h-60 overflow-y-auto">
                        {searchResults.length > 0 ? (
                          searchResults.map(p => (
                            <button key={p.id} type="button" onClick={() => handleSelectPatient(p)} className="w-full text-left px-6 py-4 flex items-center justify-between hover:bg-[#FF6B35]/10 group transition-all">
                              <div>
                                <p className="font-black text-white uppercase text-xs tracking-tight group-hover:text-[#FF6B35]">{p.full_name || p.paciente}</p>
                                <p className="text-[9px] text-[#7E8C9A] font-bold mt-1">CPF: {maskCPF(p.cpf || "")} {p.municipio ? `• ${p.municipio}` : ''}</p>
                              </div>
                              <ChevronRight className="h-4 w-4 text-[#7E8C9A] group-hover:text-[#FF6B35]" />
                            </button>
                          ))
                        ) : (
                          <div className="p-6 text-center text-[10px] font-black uppercase text-[#7E8C9A]">Nenhum cadastro encontrado. <span className="text-white">Deseja cadastrar como novo?</span></div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="md:col-span-2 space-y-2">
                  <Label className="uppercase text-[9px] font-black tracking-widest text-[#7E8C9A] ml-4">Cpf</Label>
                  <div className="relative">
                    <Input value={formData.cpf} onChange={e => setFormData(p => ({ ...p, cpf: maskCPF(e.target.value) }))} className="h-14 pl-12 bg-[#161B22] border-white/5 rounded-2xl text-xs font-black text-white text-center shadow-xl focus:border-[#FF6B35]/50" placeholder="000.000.000-00" />
                    <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7E8C9A]" />
                  </div>
                </div>

                <div className="md:col-span-2 space-y-2">
                  <Label className="uppercase text-[9px] font-black tracking-widest text-[#7E8C9A] ml-4">Cartão Sus</Label>
                  <div className="relative">
                    <Input value={formData.sus} onChange={e => setFormData(p => ({ ...p, sus: e.target.value }))} className="h-14 pl-12 bg-[#161B22] border-white/5 rounded-2xl text-xs font-black text-white text-center shadow-xl focus:border-[#FF6B35]/50" placeholder="000 0000 0000 0000" />
                    <Users className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7E8C9A]" />
                  </div>
                </div>

                <div className="md:col-span-2 space-y-2">
                  <Label className="uppercase text-[9px] font-black tracking-widest text-[#7E8C9A] ml-4">Chave Sisreg</Label>
                  <div className="relative">
                    <Input value={formData.chave_sisreg} onChange={e => setFormData(p => ({ ...p, chave_sisreg: e.target.value }))} className="h-14 pl-12 bg-[#161B22] border-white/5 rounded-2xl text-xs font-black text-white text-center shadow-xl focus:border-[#FF6B35]/50" placeholder="APENAS NÚMEROS" />
                    <FileText className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7E8C9A]" />
                  </div>
                </div>

                <div className="md:col-span-3 space-y-2">
                   <Label className="uppercase text-[9px] font-black tracking-widest text-[#7E8C9A] ml-4">Maranhão (Estado)</Label>
                   <Input value={formData.estado} disabled className="h-14 bg-[#161B22]/50 border-white/5 rounded-2xl text-xs font-black text-white/50 text-center" />
                </div>

                <div className="md:col-span-3 space-y-2">
                   <Label className="uppercase text-[9px] font-black tracking-widest text-[#7E8C9A] ml-4">Município</Label>
                   <Input value={formData.municipio} onChange={e => setFormData(p => ({ ...p, municipio: e.target.value.toUpperCase() }))} className="h-14 bg-[#161B22] border-white/5 rounded-2xl text-xs font-black text-white text-center shadow-xl focus:border-[#FF6B35]/50" placeholder="EX: IMPERATRIZ" />
                </div>

                {/* Exames List */}
                <div className="md:col-span-6 pt-6 space-y-6">
                  <div className="flex items-center justify-between px-2">
                    <h3 className="text-sm font-black uppercase text-white tracking-[0.2em] font-space flex items-center gap-3">
                      <Plus className="h-4 w-4 text-[#00FF88]" /> Procedimentos
                    </h3>
                  </div>

                  <div className="space-y-4">
                    {exams.map((exam, idx) => (
                      <div key={exam.id} className="bg-[#161B22]/40 border border-white/5 rounded-3xl p-6 relative group/item hover:bg-[#161B22]">
                        <button type="button" onClick={() => removeExam(exam.id)} className="absolute -top-2 -right-2 h-8 w-8 bg-black/20 text-[#7E8C9A] hover:bg-red-500 hover:text-white rounded-full flex items-center justify-center transition-all opacity-0 group-hover/item:opacity-100 shadow-xl border border-white/5">
                          <Trash2 className="h-4 w-4" />
                        </button>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                          <div className="md:col-span-1">
                            <SearchableAdder 
                              label="Procedimento"
                              placeholder="Selecione..."
                              value={exam.procedure_name}
                              options={dynamicProcedures}
                              onSelect={(v: string) => updateExam(exam.id, 'procedure_name', v)}
                            />
                          </div>
                          <div className="md:col-span-1">
                            <SearchableAdder 
                              label="Especificação"
                              placeholder="Selecione..."
                              value={exam.exam_type}
                              options={dynamicTypes[exam.procedure_name] || []}
                              onSelect={(v: string) => updateExam(exam.id, 'exam_type', v)}
                            />
                          </div>
                          <div className="md:col-span-1 space-y-2">
                            <Label className="uppercase text-[9px] font-black tracking-widest text-[#7E8C9A] ml-4">Data</Label>
                            <Input type="date" value={exam.exam_date} onChange={e => updateExam(exam.id, 'exam_date', e.target.value)} className="h-14 bg-[#161B22] border-white/5 rounded-2xl text-xs font-black text-white text-center" />
                          </div>
                          <div className="md:col-span-1 space-y-2">
                            <Label className="uppercase text-[9px] font-black tracking-widest text-[#7E8C9A] ml-4">Hora</Label>
                            <Input type="time" value={exam.exam_time} onChange={e => updateExam(exam.id, 'exam_time', e.target.value)} className="h-14 bg-[#161B22] border-white/5 rounded-2xl text-xs font-black text-white text-center" />
                          </div>
                        </div>
                      </div>
                    ))}
                    <Button type="button" onClick={addExam} className="w-full h-14 border-dashed border-white/10 hover:border-[#FF6B35]/40 text-[#7E8C9A] hover:text-[#FF6B35] bg-white/[0.02] hover:bg-[#FF6B35]/5 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] transition-all">
                      + ADICIONAR OUTRO EXAME
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-8">
                <Button type="submit" disabled={isSubmitting} className="h-16 px-12 bg-[#FF6B35] hover:bg-[#FF8C00] text-white rounded-3xl font-black uppercase tracking-[0.2em] text-sm shadow-2xl shadow-[#FF6B35]/20 gap-3 group">
                  {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
                  Confirmar Agendamento
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* HOLO MODELS SIDE */}
        <div className="xl:col-span-4 flex flex-col gap-10">
           <div className="glass-premium rounded-[3rem] p-10 border border-white/5 shadow-2xl flex flex-col items-center sticky top-8 overflow-hidden">
             <div className="absolute top-0 right-0 w-20 h-20 bg-[#FF6B35]/10 blur-[50px] rounded-full" />
             <HumanModel procedure={exams[0]?.procedure_name || ""} />
             <div className="mt-8 p-6 bg-[#161B22]/50 border border-white/5 rounded-3xl w-full text-center">
               <p className="text-[10px] font-bold text-[#7E8C9A] uppercase tracking-widest leading-relaxed">
                 Sistema de visualização para o procedimento <span className="text-[#FF6B35] font-black">{exams[0]?.procedure_name || "NÃO SELECIONADO"}</span>. Verifique orientações no espelho de consulta.
               </p>
             </div>
           </div>
        </div>
      </div>

      {/* LISTA DE AGENDADOS */}
      <div className="glass-premium rounded-[3rem] p-10 border border-white/5 shadow-2xl mt-12 bg-[#0F1419]/40">
         <div className="flex items-center justify-between mb-10 pb-6 border-b border-white/5">
            <h3 className="text-2xl font-black font-space text-white uppercase tracking-tight flex items-center gap-4">
               <div className="p-3 bg-[#00D9FF] text-white rounded-2xl shadow-lg shadow-[#00D9FF]/20">
                 <ClipboardList className="h-6 w-6" />
               </div>
               Agenda Diária
            </h3>
            <div className="flex items-center gap-4">
              <div className="bg-[#161B22] border border-white/5 p-2 px-6 rounded-2xl flex flex-col">
                <span className="text-[8px] font-black text-[#7E8C9A] uppercase tracking-widest leading-none mb-1">Visualizando</span>
                <input type="date" value={selectedAgendadoDate} onChange={e => setSelectedAgendadoDate(e.target.value)} className="bg-transparent border-none text-[11px] font-black text-white focus:ring-0 p-0 uppercase" />
              </div>
              <div className="relative group">
                <Input value={appointmentSearch} onChange={e => setAppointmentSearch(e.target.value)} className="bg-[#161B22] border-white/5 rounded-2xl h-12 w-64 pl-10 text-[10px] font-black uppercase text-white shadow-xl focus:border-[#00D9FF]/50" placeholder="BUSCAR NA LISTA..." />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7E8C9A] group-focus-within:text-[#00D9FF]" />
              </div>
            </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
           {filteredAppointments.length === 0 ? (
             <div className="col-span-full py-20 text-center opacity-30">
               <div className="inline-block p-8 border-2 border-dashed border-[#7E8C9A] rounded-full mb-4"><CalendarDays className="h-10 w-10 text-[#7E8C9A]" /></div>
               <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#7E8C9A]">Nenhum agendamento para esta data</p>
             </div>
           ) : (
             filteredAppointments.map(appt => (
               <div key={appt.id} className="bg-[#161B22]/40 hover:bg-[#161B22] border border-white/5 rounded-3xl p-6 transition-all group hover:scale-[1.02] hover:shadow-2xl">
                 <div className="flex items-start justify-between mb-4">
                    <div className="h-12 w-12 rounded-2xl bg-[#1D232A] flex items-center justify-center font-black text-[#7E8C9A] text-lg shadow-xl group-hover:bg-[#FF6B35] group-hover:text-white transition-all">
                      {appt.patient_name.charAt(0)}
                    </div>
                    <span className="text-[8px] font-black bg-[#00FF88]/10 text-[#00FF88] px-3 py-1 rounded-full uppercase tracking-[0.2em]">{appt.status}</span>
                 </div>
                 <div className="space-y-4">
                   <p className="text-xs font-black text-white uppercase tracking-tight truncate">{appt.patient_name}</p>
                   <div className="flex flex-col gap-1">
                      <p className="text-[9px] font-black text-[#00D9FF] uppercase tracking-widest">{appt.procedure_name}</p>
                      <p className="text-[8px] font-bold text-[#7E8C9A] uppercase">{appt.exam_type}</p>
                   </div>
                   <div className="flex items-center justify-between pt-4 border-t border-white/5">
                      <div className="flex items-center gap-2 text-[#7E8C9A] font-black text-[9px]">
                        <Clock className="h-3.5 w-3.5" /> {appt.exam_time}
                      </div>
                      <Button size="icon" variant="ghost" className="h-10 w-10 rounded-xl text-[#7E8C9A] hover:bg-[#FF6B35]/10 hover:text-[#FF6B35]"><Printer className="h-4 w-4" /></Button>
                   </div>
                 </div>
               </div>
             ))
           )}
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
