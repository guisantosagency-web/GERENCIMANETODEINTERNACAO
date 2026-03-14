"use client"
import { useState, useRef, useMemo, useEffect } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { CalendarDays, Save, Printer, Activity, FileText, AlertCircle, Heart, Search, ClipboardList, Loader2, UserPlus, ChevronRight, CreditCard, Clock, FileDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { format } from "date-fns"
import { useAuth } from "@/lib/auth-context"

const PROCEDURES = [
  "Tomografia",
  "Ultrassom",
  "Ecocardiograma",
  "Raio X",
  "Laboratório",
  "Eletrocardiograma"
]

const EXAM_TYPES_BY_PROCEDURE: Record<string, string[]> = {
  "Tomografia": ["Tomografia com Contraste", "Angiotomografia", "Tomografia sem Contraste"],
  "Ultrassom": ["Ultrassom Abdominal", "Ultrassom Pélvico", "Ultrassom Articulações", "Outros"],
  "Ecocardiograma": ["Transtorácico", "Transesofágico"],
  "Raio X": ["Tórax", "Membros", "Coluna", "Bacia"],
  "Laboratório": ["Sangue", "Urina", "Fezes"],
  "Eletrocardiograma": ["Padrão"]
}

// PREMIUM 3D HUMAN MODEL
const HumanModel = ({ procedure }: { procedure: string }) => {
  const isHead = procedure === "Tomografia"
  const isChest = procedure === "Ecocardiograma" || procedure === "Eletrocardiograma" || procedure === "Raio X"
  const isAbdomen = procedure === "Ultrassom"
  const isLimbs = procedure === "Raio X" || procedure === "Ultrassom"

  return (
    <div className="relative w-full h-[450px] flex items-center justify-center bg-gradient-to-b from-slate-50 to-white rounded-[3rem] border border-slate-200/50 shadow-inner overflow-hidden group [perspective:1000px]">
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
      <div className="relative transition-all duration-1000 ease-out group-hover:[transform:rotateY(15deg)] transform-gpu h-full w-full flex items-center justify-center">
        <svg viewBox="0 0 200 500" className="h-[90%] w-auto filter drop-shadow-[0_20px_40px_rgba(0,0,0,0.1)] transition-all duration-700">
          <defs>
            <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          <g className={`transition-all duration-700 ${isHead ? 'scale-110 origin-center' : ''}`}>
             <circle cx="100" cy="60" r="35" className={`transition-all duration-500 ${isHead ? 'fill-blue-500' : 'fill-slate-200'}`} style={{ filter: isHead ? 'url(#neonGlow)' : 'none' }} />
             {isHead && <circle cx="100" cy="60" r="15" className="fill-white/30 animate-pulse" />}
          </g>
          <path d="M65 110 L135 110 Q145 250 135 320 L65 320 Q55 250 65 110 Z" className={`transition-all duration-500 ${isChest ? 'fill-blue-400' : isAbdomen ? 'fill-blue-300' : 'fill-slate-200'}`} style={{ filter: (isChest || isAbdomen) ? 'url(#neonGlow)' : 'none' }} />
          {(procedure === "Ecocardiograma" || procedure === "Eletrocardiograma") && (
            <g transform="translate(105, 160) scale(0.6)">
               <path d="M0 -30 Q20 -50 40 -30 T0 30 T-40 -30 Q-20 -50 0 -30" fill="#ef4444" className="animate-ping opacity-20" />
               <path d="M0 -30 Q20 -50 40 -30 T0 30 T-40 -30 Q-20 -50 0 -30" fill="#ef4444" className="animate-bounce" />
            </g>
          )}
          <g className="transition-all duration-500">
             <path d="M65 110 L35 270 L55 275 L75 120 Z" className={`transition-all duration-500 ${isLimbs ? 'fill-blue-200' : 'fill-slate-200'}`} />
             <path d="M135 110 L165 270 L145 275 L125 120 Z" className={`transition-all duration-500 ${isLimbs ? 'fill-blue-200' : 'fill-slate-200'}`} />
             <path d="M70 320 L55 480 L85 480 L95 320 Z" className={`transition-all duration-500 ${isLimbs ? 'fill-blue-200' : 'fill-slate-200'}`} />
             <path d="M130 320 L145 480 L115 480 L105 320 Z" className={`transition-all duration-500 ${isLimbs ? 'fill-blue-200' : 'fill-slate-200'}`} />
          </g>
        </svg>
      </div>
      <div className="absolute top-8 left-8 flex flex-col gap-2">
         <div className="bg-white/80 backdrop-blur-xl p-3 border border-slate-100 rounded-2xl shadow-xl">
            <div className="flex items-center gap-2 mb-1">
               <div className={`w-2 h-2 rounded-full animate-pulse ${procedure ? 'bg-blue-500' : 'bg-slate-300'}`} />
               <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Scanner Ativo</span>
            </div>
            <p className="text-sm font-black text-slate-800 uppercase tracking-tight">{procedure || "Selecione Exame"}</p>
         </div>
      </div>
    </div>
  )
}

export default function AgendamentoTab() {
  const { logos } = useAuth()
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [slotInfo, setSlotInfo] = useState<{ total: number; occupied: number } | null>(null)
  const [isCheckingSlots, setIsCheckingSlots] = useState(false)
  
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [dateAppointments, setDateAppointments] = useState<any[]>([])
  const [lastSaved, setLastSaved] = useState<any>(null)

  const [formData, setFormData] = useState({
    patient_name: "",
    cpf: "",
    sus: "",
    exam_date: format(new Date(), 'yyyy-MM-dd'),
    exam_time: format(new Date(), 'HH:mm'),
    procedure_name: PROCEDURES[0],
    exam_type: EXAM_TYPES_BY_PROCEDURE[PROCEDURES[0]][0] || "",
  })

  const supabase = useMemo(() => createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!), [])

  const loadDateAppointments = async () => {
    const { data } = await supabase
      .from("exam_appointments")
      .select("*")
      .eq("exam_date", formData.exam_date)
      .neq("status", "cancelado")
      .order("exam_time")
    setDateAppointments(data || [])
  }

  useEffect(() => {
    loadDateAppointments()
  }, [formData.exam_date])

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
      const { data } = await supabase.from("patients").select("*").ilike("paciente", `%${val}%`).limit(5)
      setSearchResults(data || [])
    } catch(e) {}
  }

  const handleSelectPatient = (patient: any) => {
    setFormData(prev => ({
      ...prev,
      patient_name: patient.paciente,
      cpf: maskCPF(patient.cpf || ""),
      sus: patient.sus || "",
    }))
    setShowDropdown(false)
  }

  useEffect(() => {
    const checkSlots = async () => {
      if (formData.procedure_name === "Raio X") {
        setSlotInfo(null)
        return
      }
      setIsCheckingSlots(true)
      try {
        const { data: slotData } = await supabase.from("exam_slots").select("total_slots").eq("exam_date", formData.exam_date).eq("procedure_name", formData.procedure_name).maybeSingle()
        const { count } = await supabase.from("exam_appointments").select("*", { count: 'exact', head: true }).eq("exam_date", formData.exam_date).eq("procedure_name", formData.procedure_name).neq("status", "cancelado")
        setSlotInfo({ total: slotData?.total_slots || 0, occupied: count || 0 })
      } finally {
        setIsCheckingSlots(false)
      }
    }
    checkSlots()
  }, [formData.exam_date, formData.procedure_name, supabase])

  const handleProcedureChange = (newProc: string) => {
    setFormData(prev => ({
      ...prev,
      procedure_name: newProc,
      exam_type: EXAM_TYPES_BY_PROCEDURE[newProc]?.[0] || ""
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.procedure_name !== "Raio X") {
      if (!slotInfo || slotInfo.total === 0) {
        alert("ERRO: Não há vagas registradas para esta data.")
        return
      }
      if (slotInfo.occupied >= slotInfo.total) {
        alert("ERRO: Limite de vagas atingido.")
        return
      }
    }
    setIsSubmitting(true)
    try {
      const { data, error } = await supabase.from("exam_appointments").insert([{
        patient_name: formData.patient_name.toUpperCase(),
        cpf: formData.cpf.replace(/\D/g, ""),
        sus: formData.sus,
        exam_date: formData.exam_date,
        exam_time: formData.exam_time,
        procedure_name: formData.procedure_name,
        exam_type: formData.exam_type,
        status: 'agendado'
      }]).select().single()
      if (error) throw error
      setLastSaved(data)
      loadDateAppointments()
      alert("Agendamento salvo!")
      setFormData(prev => ({ ...prev, patient_name: "", cpf: "", sus: "" }))
      if (slotInfo) setSlotInfo(p => p ? ({ ...p, occupied: p.occupied + 1 }) : null)
    } catch (err) {
      console.error(err)
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
          <div class="info-row"><span class="label">Paciente:</span> <span class="value">${data.patient_name}</span></div>
          <div class="info-row"><span class="label">CPF:</span> <span class="value">${maskCPF(data.cpf || "")}</span></div>
          <div class="info-row"><span class="label">Cartão SUS:</span> <span class="value">${data.sus || "--"}</span></div>
          <div class="info-row" style="margin-top: 5mm; font-size: 13pt;"><span class="label">Data Exame:</span> <span class="value" style="font-weight: 900;">${format(new Date(data.exam_date + 'T00:00:00'), 'dd/MM/yyyy')} às ${data.exam_time}</span></div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Procedimento Central</th>
              <th>Especificação do Exame</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${data.procedure_name}</td>
              <td>${data.exam_type}</td>
            </tr>
          </tbody>
        </table>
        <div class="instructions">
          <h2>Orientações Importantes:</h2>
          <ul>
            ${data.procedure_name === "Tomografia" ? `
              <li>PACIENTE EM JEJUM DE 6 HORAS</li>
              <li>TRAZER EXAMES DE UREIA E CREATININA RECENTE (MÁXIMO 30 DIAS)</li>
              <li>NÃO FAZER USO DE METFORMINA NO DIA DO EXAME</li>
              <li>TRAZER SOLICITAÇÃO MÉDICA E DOCUMENTOS ORIGINAIS</li>
            ` : `
              <li>TRAZER REQUISIÇÃO DO EXAME</li>
              <li>DOCUMENTO COM FOTO (RG/CPF) E CARTÃO DO SUS</li>
              <li>CHEGAR COM 20 MINUTOS DE ANTECEDÊNCIA</li>
            `}
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

  const hasSlots = formData.procedure_name === "Raio X" || (slotInfo && slotInfo.total > 0 && slotInfo.occupied < slotInfo.total)
  const noSlotsAtAll = formData.procedure_name !== "Raio X" && slotInfo && slotInfo.total === 0

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
                 {formData.procedure_name !== "Raio X" && (
                   <div className={`px-8 py-5 rounded-[2rem] border-2 flex items-center gap-5 shadow-inner ${noSlotsAtAll ? 'bg-red-50 border-red-100 text-red-600' : 'bg-blue-50/50 border-blue-100 text-blue-700'}`}>
                     {isCheckingSlots ? <Loader2 className="h-6 w-6 animate-spin" /> : <AlertCircle className="h-7 w-7" />}
                     <div className="text-right">
                       <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Vagas</p>
                       <p className="text-2xl font-black font-space">{noSlotsAtAll ? "LOTADO" : `${slotInfo?.occupied || 0} / ${slotInfo?.total || 0}`}</p>
                     </div>
                   </div>
                 )}
               </div>

               <form onSubmit={handleSubmit} className="space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10">
                     <div className="space-y-3 md:col-span-2 relative" ref={dropdownRef}>
                        <Label className="uppercase text-[10px] font-black tracking-widest text-slate-400 ml-5">Nome do Paciente</Label>
                        <div className="relative">
                          <Input required autoComplete="off" placeholder="BUSCAR OU DIGITAR NOME..." value={formData.patient_name} onChange={e => handleNameInput(e.target.value)} onFocus={() => formData.patient_name.length >=3 && setShowDropdown(true)} className="pl-16 h-20 text-xl font-black bg-slate-50 border-none rounded-[2rem] shadow-inner uppercase" />
                          <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-7 w-7 text-slate-300" />
                        </div>
                        {showDropdown && (
                          <div className="absolute z-50 mt-3 w-full bg-white/95 backdrop-blur-xl border border-slate-100 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
                             <div className="max-h-[300px] overflow-y-auto">
                                {searchResults.length > 0 ? (
                                   searchResults.map(p => (
                                     <button key={p.id} type="button" onClick={() => handleSelectPatient(p)} className="w-full text-left px-8 py-4 flex items-center justify-between hover:bg-blue-50 transition-colors">
                                        <div>
                                          <p className="font-black text-slate-800 uppercase text-sm">{p.paciente}</p>
                                          <p className="text-[10px] text-slate-400 uppercase">CPF: {maskCPF(p.cpf || "")}</p>
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
                        <Input required placeholder="000.000.000-00" value={formData.cpf} onChange={e => setFormData(p => ({ ...p, cpf: maskCPF(e.target.value) }))} className="pl-16 h-16 font-bold text-center text-lg bg-slate-50 border-none rounded-[1.5rem]" />
                        <CreditCard className="absolute left-6 bottom-[1.2rem] h-6 w-6 text-blue-500" />
                     </div>
                     <div className="space-y-3 relative">
                        <Label className="uppercase text-[10px] font-black tracking-widest text-slate-400 ml-5">SUS</Label>
                        <Input required placeholder="000 0000 0000 0000" value={formData.sus} onChange={e => setFormData(prev => ({ ...prev, sus: e.target.value }))} className="pl-16 h-16 font-bold text-center text-lg bg-slate-50 border-none rounded-[1.5rem]" />
                        <ClipboardList className="absolute left-6 bottom-[1.2rem] h-6 w-6 text-emerald-500" />
                     </div>
                     <div className="space-y-3 relative">
                        <Label className="uppercase text-[10px] font-black tracking-widest text-slate-400 ml-5">Data</Label>
                        <Input required type="date" value={formData.exam_date} onChange={e => setFormData(p => ({ ...p, exam_date: e.target.value }))} className="pl-16 h-16 font-bold bg-slate-50 border-none rounded-[1.5rem] text-center" />
                        <CalendarDays className="absolute left-6 bottom-[1.2rem] h-6 w-6 text-amber-500" />
                     </div>
                     <div className="space-y-3 relative">
                        <Label className="uppercase text-[10px] font-black tracking-widest text-slate-400 ml-5">Hora</Label>
                        <Input required type="time" value={formData.exam_time} onChange={e => setFormData(p => ({ ...p, exam_time: e.target.value }))} className="pl-16 h-16 font-black text-2xl text-center bg-slate-50 border-none rounded-[1.5rem]" />
                        <Clock className="absolute left-6 bottom-[1.2rem] h-6 w-6 text-amber-500" />
                     </div>
                     <div className="space-y-3 relative group">
                        <Label className="uppercase text-[10px] font-black tracking-widest text-slate-400 ml-5">Procedimento Central</Label>
                        <div className="relative">
                          <select value={formData.procedure_name} onChange={e => handleProcedureChange(e.target.value)} className="w-full appearance-none h-16 bg-slate-50 border-none px-6 pl-16 rounded-[1.5rem] text-sm font-black shadow-inner focus:outline-none focus:ring-4 focus:ring-blue-500/10 cursor-pointer uppercase transition-all">
                             {PROCEDURES.map(p => <option key={p} value={p}>{p}</option>)}
                          </select>
                          <Activity className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-blue-600" />
                        </div>
                     </div>
                     <div className="space-y-3 relative group">
                        <Label className="uppercase text-[10px] font-black tracking-widest text-slate-400 ml-5">Especificação do Exame</Label>
                        <div className="relative">
                          <select value={formData.exam_type} onChange={e => setFormData(prev => ({ ...prev, exam_type: e.target.value }))} className="w-full appearance-none h-16 bg-slate-50 border-none px-6 pl-16 rounded-[1.5rem] text-sm font-black shadow-inner focus:outline-none focus:ring-4 focus:ring-blue-500/10 cursor-pointer uppercase transition-all">
                             {EXAM_TYPES_BY_PROCEDURE[formData.procedure_name]?.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                          <FileText className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-blue-600" />
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
          <div className="hidden xl:block xl:col-span-4 self-stretch">
             <div className="glass-card bg-white border-none rounded-[4rem] p-8 shadow-2xl h-full flex flex-col items-center justify-between sticky top-8">
                <HumanModel procedure={formData.procedure_name} />
                <div className="mt-8 p-8 bg-slate-50 rounded-[3rem] w-full">
                   <p className="text-sm font-bold text-slate-600 leading-relaxed uppercase">
                      Zona diagnosticada para <span className="text-blue-600 font-extrabold">{formData.procedure_name}</span>. Verifique orientações no PDF.
                   </p>
                </div>
             </div>
          </div>
        </div>

        {/* LISTA DE AGENDADOS NA DATA */}
        <div className="mt-12 glass-card !bg-white/40 border-none rounded-[3.5rem] p-8 lg:p-12 shadow-2xl relative overflow-hidden">
           <div className="flex items-center justify-between mb-8">
              <div>
                 <h3 className="text-2xl font-black font-space uppercase tracking-tight text-slate-800 flex items-center gap-4">
                   <div className="p-3 bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-500/20"><ClipboardList className="h-6 w-6" /></div>
                   Agendados para {format(new Date(formData.exam_date + 'T00:00:00'), 'dd/MM/yyyy')}
                 </h3>
              </div>
              <div className="bg-white px-6 py-3 rounded-2xl border border-slate-100 shadow-sm text-xs font-black text-slate-500 uppercase">{dateAppointments.length} PACIENTES</div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {dateAppointments.length === 0 ? (
                 <div className="col-span-full py-10 text-center text-slate-400 font-bold italic opacity-50 uppercase text-xs tracking-widest">Nenhum agendamento para esta data</div>
              ) : (
                 dateAppointments.map(appt => (
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
    </div>
  )
}
