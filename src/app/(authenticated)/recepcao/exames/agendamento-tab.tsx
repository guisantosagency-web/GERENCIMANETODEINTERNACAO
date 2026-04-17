"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { 
  CalendarDays, Search, User, Users, CreditCard, ClipboardList, 
  Trash2, Plus, Clock, FileText, Settings2, 
  CheckCircle2, AlertCircle, Loader2, ChevronRight, Printer, Activity, MapPin
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { format, parseISO } from "date-fns"
import { searchMasterPatients, upsertMasterPatient } from "@/lib/patient-search"
import { ExamManagerModal } from "@/components/exam-manager-modal"


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
              <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/>
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

  const printAppointment = (appt: any) => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    // Busca todos os exames do mesmo paciente na mesma data para agrupar no comprovante
    const patientAppts = dateAppointments.filter(a => 
      a.patient_name === appt.patient_name && 
      a.exam_date === appt.exam_date &&
      a.status !== 'cancelado'
    ).sort((a, b) => (a.exam_time || "").localeCompare(b.exam_time || ""))

    const needsFasting = patientAppts.some(a => {
      const p = (a.procedure_name || "").toUpperCase()
      return p.includes("TOMOGRAFIA") || p.includes("ULTRASSONOGRAFIA") || p.includes("USG") || p.includes("ANGIOTOMOGRAFIA")
    })

    const content = `
      <!DOCTYPE html><html><head>
        <title>Comprovação de Agendamento</title>
        <style>
          @page { size: A4 landscape; margin: 0; }
          body { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.4; margin: 0; padding: 0; background: #fff; }
          
          .a4-landscape { display: flex; width: 297mm; height: 210mm; overflow: hidden; }
          .receipt-copy { width: 50%; height: 100%; padding: 10mm; position: relative; box-sizing: border-box; display: flex; flex-direction: column; }
          .divider { width: 0; border-left: 1px dashed #cbd5e1; height: 100%; position: relative; }
          .divider::after { content: '✂️'; position: absolute; top: 10mm; left: -8px; font-size: 12pt; background: white; padding: 2px; }

          /* Header */
          .header { display: flex; align-items: flex-start; justify-content: space-between; border-bottom: 2px solid #14b8a6; padding-bottom: 4mm; margin-bottom: 6mm; }
          .logo-box { display: flex; flex-direction: column; gap: 2mm; align-items: flex-start; }
          .logo-hospital { height: 10mm; }
          .logo-gov { height: 8mm; opacity: 0.8; }
          .doc-title { text-align: right; }
          .doc-title h1 { margin: 0; font-size: 11pt; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px; }
          .doc-title p { margin: 1mm 0 0 0; font-size: 7pt; color: #64748b; font-weight: bold; text-transform: uppercase; }

          /* Sections */
          .section { margin-bottom: 5mm; }
          .section-title { font-size: 7.5pt; font-weight: 800; color: #14b8a6; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 2mm; display: flex; align-items: center; gap: 2mm; border-left: 3px solid #14b8a6; padding-left: 2mm; }
          
          /* Data Grid */
          .data-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 3mm; background: #f8fafc; padding: 3mm; border-radius: 8px; border: 1px solid #f1f5f9; }
          .data-item { display: flex; flex-direction: column; }
          .data-label { font-size: 6.5pt; font-weight: bold; color: #94a3b8; text-transform: uppercase; margin-bottom: 0.5mm; }
          .data-value { font-size: 9pt; font-weight: 700; color: #1e293b; overflow: hidden; text-overflow: ellipsis; }
          .full-width { grid-column: span 2; }

          /* Guidelines Box */
          .guidelines { padding: 4mm; background: #f0fdfa; border-radius: 12px; border: 1px solid #ccfbf1; margin-top: auto; }
          .guidelines h3 { margin: 0 0 2mm 0; font-size: 8pt; text-transform: uppercase; color: #0d9488; }
          .guidelines ul { margin: 0; padding-left: 4mm; font-size: 8.5pt; color: #334155; }
          .guidelines li { margin-bottom: 1mm; }

          /* Footer */
          .footer { margin-top: 5mm; font-size: 7pt; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 3mm; display: flex; justify-content: space-between; align-items: flex-end; }
          .signature { border-top: 1px solid #cbd5e1; width: 45mm; text-align: center; padding-top: 1mm; font-size: 6.5pt; color: #64748b; font-weight: bold; text-transform: uppercase; }
          
          .watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 40pt; font-weight: 900; color: #f1f5f9; z-index: -1; text-transform: uppercase; opacity: 0.4; pointer-events: none; }
        </style>
      </head><body>
        <div class="a4-landscape">
          ${[1, 2].map(copyNum => `
            <div class="receipt-copy">
              <div class="watermark">COPIA ${copyNum}</div>
              
              <div class="header">
                <div class="logo-box">
                  <img src="/images/hto-20nova.png" class="logo-hospital" onerror="this.style.display='none'">
                  <img src="/images/logo-20gov.png" class="logo-gov" onerror="this.style.display='none'">
                </div>
                <div class="doc-title">
                  <h1>Confirmando Agendamento</h1>
                  <p>Serviço de Apoio Diagnóstico e Terapêutico</p>
                  <p style="font-size: 6pt; margin-top: 2px;">Via ${copyNum === 1 ? 'do Paciente' : 'Interna / Médica'}</p>
                </div>
              </div>

              <div class="section">
                <div class="section-title">Dados do Paciente</div>
                <div class="data-grid">
                  <div class="data-item full-width">
                    <span class="data-label">Paciente</span>
                    <span class="data-value">${appt.patient_name}</span>
                  </div>
                  <div class="data-item">
                    <span class="data-label">CPF</span>
                    <span class="data-value">${appt.cpf || '--'}</span>
                  </div>
                  <div class="data-item">
                    <span class="data-label">Cartão SUS</span>
                    <span class="data-value">${appt.sus || '--'}</span>
                  </div>
                </div>
              </div>

              <div class="section">
                <div class="section-title">Informações dos Exames</div>
                <div class="data-grid" style="grid-template-columns: 1fr;">
                  ${patientAppts.map(a => `
                    <div class="data-item" style="border-bottom: 1px solid #f1f5f9; padding-bottom: 2mm; margin-bottom: 2mm;">
                      <span class="data-label">${a.exam_time} — ${a.procedure_name}</span>
                      <span class="data-value" style="font-size: 8.5pt; color: #334155;">${a.exam_type || 'PROCEDIMENTO PADRÃO'}</span>
                    </div>
                  `).join('')}
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 3mm; margin-top: 1mm;">
                    <div class="data-item">
                      <span class="data-label">Status Geral</span>
                      <span class="data-value" style="color: #059669; font-size: 8pt;">AGENDADOS</span>
                    </div>
                    <div class="data-item">
                      <span class="data-label">Data</span>
                      <span class="data-value" style="font-size: 8pt;">${appt.exam_date ? new Date(appt.exam_date+'T00:00:00').toLocaleDateString('pt-BR') : '--'}</span>
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
                  <strong>HTO Caxias</strong><br/>
                  Impresso em ${new Date().toLocaleString('pt-BR')}
                </div>
                <div class="signature">
                  Carimbo e Visto
                </div>
              </div>
            </div>
            ${copyNum === 1 ? '<div class="divider"></div>' : ''}
          `).join('')}
        </div>
      </body></html>`
    printWindow.document.write(content)
    printWindow.document.close()
    
    // Aguarda um tempo para garantir que os logos carreguem antes de abrir o diálogo de impressão
    setTimeout(() => {
      printWindow.print()
    }, 1500)
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
              {isAdmin && (
                <Button onClick={() => setIsManagerOpen(true)} variant="ghost" className="bg-slate-50 hover:bg-slate-100 text-slate-500 border border-slate-200 font-bold uppercase text-[10px] tracking-wider gap-2 rounded-xl">
                  <Settings2 className="h-4 w-4" /> Ajustes Oficiais
                </Button>
              )}
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

                {/* Exames List */}
                <div className="md:col-span-6 pt-6 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-50">
                    <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider flex items-center gap-2">
                      <Plus className="h-4 w-4 text-teal-500" /> Detalhes dos Procedimentos
                    </h3>
                  </div>

                  <div className="space-y-4">
                    {exams.map((exam, idx) => (
                      <div key={exam.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 relative group/item hover:border-teal-200 transition-colors">
                        <button type="button" onClick={() => removeExam(exam.id)} className="absolute -top-3 -right-2 h-7 w-7 bg-white text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded-full flex items-center justify-center transition-all opacity-0 group-hover/item:opacity-100 shadow-sm border border-slate-200 hover:border-rose-200">
                          <Trash2 className="h-3 w-3" />
                        </button>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                          <div className="md:col-span-1 space-y-1">
                            <Label className="uppercase text-[9px] font-bold tracking-wider text-slate-500 ml-2">Data</Label>
                            <Input type="date" value={exam.exam_date} onChange={e => updateExam(exam.id, 'exam_date', e.target.value)} className="h-12 bg-white border-slate-200 rounded-xl text-xs font-bold text-slate-700 text-center shadow-sm focus:border-teal-400 outline-none transition-colors" />
                          </div>
                          <div className="md:col-span-1 space-y-1">
                            <Label className="uppercase text-[9px] font-bold tracking-wider text-slate-500 ml-2">Hora</Label>
                            <Input type="time" value={exam.exam_time} onChange={e => updateExam(exam.id, 'exam_time', e.target.value)} className="h-12 bg-white border-slate-200 rounded-xl text-xs font-bold text-slate-700 text-center shadow-sm focus:border-teal-400 outline-none transition-colors" />
                          </div>
                        </div>
                      </div>
                    ))}
                    <Button type="button" onClick={addExam} className="w-full h-12 border border-dashed border-slate-300 hover:border-teal-400 text-slate-500 hover:text-teal-600 bg-slate-50 hover:bg-teal-50 rounded-xl font-bold uppercase text-[10px] tracking-wider transition-all">
                      + ADICIONAR OUTRO EXAME
                    </Button>
                  </div>
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
        </div>
      </div>

      {/* LISTA DE AGENDADOS */}
      <div className="bg-white rounded-[2rem] p-8 lg:p-10 border border-slate-100 shadow-sm mt-8">
         <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-6 border-b border-slate-100 gap-6">
            <h3 className="text-xl font-bold font-space text-slate-800 uppercase tracking-tight flex items-center gap-3">
               <div className="p-2.5 bg-blue-50 text-blue-500 rounded-xl border border-blue-100 shadow-sm">
                 <ClipboardList className="h-5 w-5" />
               </div>
               Agenda Diária
            </h3>
            <div className="flex flex-wrap items-center gap-4">
              <div className="bg-slate-50 border border-slate-200 p-2 px-5 rounded-xl flex flex-col min-w-[140px]">
                <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider leading-none mb-1">Data Filtro</span>
                <input type="date" value={selectedAgendadoDate} onChange={e => setSelectedAgendadoDate(e.target.value)} className="bg-transparent border-none text-[11px] font-bold text-slate-700 outline-none p-0 uppercase" />
              </div>
              <div className="relative group flex-1 min-w-[200px]">
                <Input value={appointmentSearch} onChange={e => setAppointmentSearch(e.target.value)} className="bg-white border-slate-200 rounded-xl h-12 w-full pl-10 text-[10px] font-bold uppercase text-slate-700 shadow-sm focus:border-teal-400 outline-none transition-colors" placeholder="LOCALIZAR PACIENTE..." />
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-teal-500" />
              </div>
            </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
           {filteredAppointments.length === 0 ? (
             <div className="col-span-full py-16 text-center opacity-70">
               <div className="inline-flex p-6 bg-slate-50 border border-slate-200 rounded-2xl mb-4"><CalendarDays className="h-8 w-8 text-slate-400" /></div>
               <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Nenhum agendamento para esta data</p>
             </div>
           ) : (
             filteredAppointments.map(appt => (
               <div key={appt.id} className="bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl p-5 transition-colors group">
                 <div className="flex items-start justify-between mb-4">
                    <div className="h-10 w-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center font-bold text-teal-600 text-sm shadow-sm group-hover:bg-teal-500 group-hover:text-white transition-colors">
                      {appt.patient_name.charAt(0)}
                    </div>
                    <span className="text-[8px] font-bold bg-cyan-50 text-cyan-600 border border-cyan-100 px-2.5 py-1 rounded-md uppercase tracking-wider">{appt.status}</span>
                 </div>
                 <div className="space-y-3">
                   <p className="text-xs font-bold text-slate-800 uppercase tracking-tight truncate" title={appt.patient_name}>{appt.patient_name}</p>
                   <div className="flex flex-col gap-0.5">
                      <p className="text-[9px] font-bold text-teal-600 uppercase tracking-wider">{appt.procedure_name}</p>
                      <p className="text-[8px] font-bold text-slate-500 uppercase">{appt.exam_type}</p>
                   </div>
                   <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      <div className="flex items-center gap-1.5 text-slate-500 font-bold text-[9px]">
                        <Clock className="h-3.5 w-3.5 text-orange-400" /> {appt.exam_time}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon" variant="ghost"
                          onClick={() => printAppointment(appt)}
                          title="Imprimir comprovante"
                          className="h-7 w-7 rounded-lg text-slate-400 hover:bg-teal-50 hover:text-teal-600 transition-colors"
                        >
                          <Printer className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon" variant="ghost"
                          onClick={() => cancelAppointment(appt.id, appt.patient_name)}
                          title="Cancelar agendamento"
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
