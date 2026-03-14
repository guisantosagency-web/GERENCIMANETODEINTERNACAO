"use client"
import { useState, useRef, useMemo, useEffect } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { CalendarDays, Save, Printer, User, CreditCard, Clock, Activity, FileText, AlertCircle, Heart, Search, ClipboardList } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
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

// Visual Human Model Helper
const HumanModel = ({ procedure }: { procedure: string }) => {
  const isHead = procedure === "Tomografia"
  const isChest = procedure === "Ecocardiograma" || procedure === "Eletrocardiograma" || (procedure === "Raio X")
  const isAbdomen = procedure === "Ultrassom"
  const isLimbs = procedure === "Raio X" || procedure === "Ultrassom" // Simplified logic

  return (
    <div className="relative w-full h-[400px] flex items-center justify-center bg-gradient-to-b from-blue-50/50 to-white rounded-[3rem] border border-blue-100/50 shadow-inner overflow-hidden group">
      {/* 3D-like Glow Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_70%)]" />
      
      <svg viewBox="0 0 200 500" className="h-[90%] w-auto drop-shadow-2xl transition-all duration-700">
        {/* Head */}
        <circle cx="100" cy="50" r="30" className={`transition-all duration-500 ${isHead ? 'fill-blue-500 drop-shadow-[0_0_15px_rgba(59,130,246,0.8)] scale-110 origin-center' : 'fill-slate-200'}`} />
        {/* Neck */}
        <rect x="90" y="75" width="20" height="20" className="fill-slate-200" />
        {/* Torso */}
        <path d="M60 95 L140 95 Q150 250 140 300 L60 300 Q50 250 60 95 Z" className={`transition-all duration-500 ${isChest ? 'fill-blue-400 drop-shadow-[0_0_15px_rgba(96,165,250,0.8)]' : isAbdomen ? 'fill-blue-300 transition-none' : 'fill-slate-200'}`} />
        {/* Heart specific highlight */}
        {(procedure === "Ecocardiograma" || procedure === "Eletrocardiograma") && (
          <path d="M100 130 Q110 120 120 130 T100 160 T80 130 Q90 120 100 130" className="fill-red-500 animate-pulse drop-shadow-[0_0_10px_rgba(239,44,44,0.8)]" />
        )}
        {/* Arms */}
        <path d="M60 95 L30 250 L50 255 L70 110 Z" className={`transition-all duration-500 ${isLimbs ? 'fill-blue-200 shadow-xl' : 'fill-slate-200'}`} />
        <path d="M140 95 L170 250 L150 255 L130 110 Z" className={`transition-all duration-500 ${isLimbs ? 'fill-blue-200 shadow-xl' : 'fill-slate-200'}`} />
        {/* Legs */}
        <path d="M65 300 L50 480 L80 480 L90 300 Z" className={`transition-all duration-500 ${isLimbs ? 'fill-blue-200 shadow-xl' : 'fill-slate-200'}`} />
        <path d="M135 300 L150 480 L120 480 L110 300 Z" className={`transition-all duration-500 ${isLimbs ? 'fill-blue-200 shadow-xl' : 'fill-slate-200'}`} />
      </svg>

      {/* Dynamic Data Overlay */}
      <div className="absolute top-6 right-6 p-4 glass-card border-none bg-white/60 backdrop-blur-md rounded-2xl shadow-sm animate-in fade-in zoom-in duration-500">
         <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-1">Área Selecionada</p>
         <p className="text-sm font-black text-slate-800 uppercase leading-tight">{procedure}</p>
      </div>
    </div>
  )
}

export default function AgendamentoTab() {
  const { logos } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [slotInfo, setSlotInfo] = useState<{ total: number; occupied: number } | null>(null)
  const [isCheckingSlots, setIsCheckingSlots] = useState(false)
  
  const [formData, setFormData] = useState({
    patient_name: "",
    cpf: "",
    sus: "",
    exam_date: format(new Date(), 'yyyy-MM-dd'),
    exam_time: format(new Date(), 'HH:mm'),
    procedure_name: PROCEDURES[0],
    exam_type: EXAM_TYPES_BY_PROCEDURE[PROCEDURES[0]][0] || "",
  })

  const [lastSaved, setLastSaved] = useState<any>(null)
  const supabase = useMemo(() => createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!), [])

  // CPF Mask
  const maskCPF = (v: string) => {
    v = v.replace(/\D/g, "")
    if (v.length > 11) v = v.substring(0, 11)
    return v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
  }

  // Handle Patient Auto-fill
  const handlePatientSearch = async (nameOrCpf: string, field: 'name' | 'cpf') => {
    if (nameOrCpf.length < 3) return

    const query = supabase.from("patients").select("*")
    if (field === 'cpf') {
      const cleanCpf = nameOrCpf.replace(/\D/g, "")
      query.eq("cpf", cleanCpf)
    } else {
      query.ilike("paciente", `%${nameOrCpf}%`)
    }

    const { data } = await query.limit(1).maybeSingle()

    if (data) {
      setFormData(prev => ({
        ...prev,
        patient_name: data.paciente,
        cpf: maskCPF(data.cpf || ""),
        sus: data.sus || "",
      }))
    }
  }

  // Check slots whenever date or procedure changes
  useEffect(() => {
    const checkSlots = async () => {
      if (formData.procedure_name === "Raio X") {
        setSlotInfo(null)
        return
      }

      setIsCheckingSlots(true)
      try {
        const { data: slotData } = await supabase
          .from("exam_slots")
          .select("total_slots")
          .eq("exam_date", formData.exam_date)
          .eq("procedure_name", formData.procedure_name)
          .maybeSingle()

        const { count } = await supabase
          .from("exam_appointments")
          .select("*", { count: 'exact', head: true })
          .eq("exam_date", formData.exam_date)
          .eq("procedure_name", formData.procedure_name)
          .neq("status", "cancelado")

        setSlotInfo({
          total: slotData?.total_slots || 0,
          occupied: count || 0
        })
      } catch (e) {
        console.error(e)
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
        alert("ERRO: Não há vagas registradas para este procedimento nesta data.")
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
      alert("Agendamento salvo com sucesso!")
      
      setFormData(prev => ({
        ...prev,
        patient_name: "",
        cpf: "",
        sus: "",
      }))
      
      if (slotInfo) {
        setSlotInfo(prev => prev ? ({ ...prev, occupied: prev.occupied + 1 }) : null)
      }
    } catch (err: any) {
      console.error(err)
      alert("Erro ao salvar agendamento.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePrint = () => window.print()

  const hasSlots = formData.procedure_name === "Raio X" || (slotInfo && slotInfo.total > 0 && slotInfo.occupied < slotInfo.total)
  const noSlotsAtAll = formData.procedure_name !== "Raio X" && slotInfo && slotInfo.total === 0

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="print:hidden max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Form Section */}
          <div className="lg:col-span-12 xl:col-span-8 flex flex-col gap-6">
            <div className="glass-card !bg-card/40 border-none rounded-[3rem] p-8 lg:p-10 shadow-xl relative overflow-hidden">
               {/* Premium Gradient Bar */}
               <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-400 opacity-60" />
               
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                 <div>
                   <h2 className="text-3xl font-black font-space uppercase tracking-tight flex items-center gap-4">
                      <div className="p-4 bg-blue-600 text-white rounded-[1.5rem] shadow-lg shadow-blue-500/20">
                         <CalendarDays className="h-7 w-7" />
                      </div>
                      Agendamento de Procedimento
                   </h2>
                   <p className="text-muted-foreground font-bold mt-2 ml-20 uppercase text-xs tracking-[0.2em]">Registro Central de Exames</p>
                 </div>

                 {formData.procedure_name !== "Raio X" && (
                   <div className={`px-6 py-4 rounded-[1.5rem] border flex items-center gap-4 shadow-sm transition-all ${noSlotsAtAll ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-blue-50/50 border-blue-100 text-blue-700'}`}>
                     {isCheckingSlots ? (
                       <div className="h-5 w-5 border-3 border-t-transparent border-blue-600 rounded-full animate-spin" />
                     ) : (
                       <AlertCircle className={`h-6 w-6 ${noSlotsAtAll ? 'text-red-500' : 'text-blue-600'}`} />
                     )}
                     <div>
                       <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Status de Vagas</p>
                       <p className="text-lg font-black font-space">
                         {noSlotsAtAll ? "ESGOTADO" : `${slotInfo?.occupied || 0} / ${slotInfo?.total || 0}`}
                       </p>
                     </div>
                   </div>
                 )}
               </div>

               <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-1 bg-muted/5 rounded-[2.5rem]">
                     <div className="space-y-3 md:col-span-2 relative group">
                        <Label className="uppercase text-[10px] font-black tracking-widest text-muted-foreground ml-4 group-hover:text-blue-500 transition-colors">Nome Completo do Paciente</Label>
                        <div className="relative">
                          <Input 
                            required 
                            placeholder="DIGITE PARA BUSCAR OU CADASTRAR..." 
                            value={formData.patient_name} 
                            onChange={e => {
                              setFormData(prev => ({ ...prev, patient_name: e.target.value }))
                              handlePatientSearch(e.target.value, 'name')
                            }} 
                            className="pl-14 h-16 text-xl font-bold bg-white/70 backdrop-blur-sm border-white/40 ring-offset-background focus-visible:ring-blue-500 rounded-[1.5rem] shadow-sm uppercase placeholder:text-slate-300 transition-all hover:bg-white" 
                          />
                          <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-400 group-hover:text-blue-500 transition-colors" />
                        </div>
                     </div>

                     <div className="space-y-3 relative group">
                        <Label className="uppercase text-[10px] font-black tracking-widest text-muted-foreground ml-4">CPF (Obrigatório p/ busca)</Label>
                        <div className="relative">
                          <Input 
                            required 
                            placeholder="000.000.000-00" 
                            value={formData.cpf} 
                            onChange={e => {
                              const masked = maskCPF(e.target.value)
                              setFormData(prev => ({ ...prev, cpf: masked }))
                              handlePatientSearch(masked, 'cpf')
                            }} 
                            className="pl-14 h-16 font-bold text-center text-lg bg-white/70 border-white/40 rounded-[1.5rem] tracking-widest" 
                          />
                          <CreditCard className="absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 text-blue-500" />
                        </div>
                     </div>

                     <div className="space-y-3 relative group">
                        <Label className="uppercase text-[10px] font-black tracking-widest text-muted-foreground ml-4">Cartão SUS</Label>
                        <div className="relative">
                          <Input 
                            required 
                            placeholder="000 0000 0000 0000" 
                            value={formData.sus} 
                            onChange={e => setFormData(prev => ({ ...prev, sus: e.target.value }))} 
                            className="pl-14 h-16 font-bold text-center text-lg bg-white/70 border-white/40 rounded-[1.5rem] tracking-widest" 
                          />
                          <ClipboardList className="absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 text-blue-400" />
                        </div>
                     </div>

                     <div className="space-y-3 relative group">
                        <Label className="uppercase text-[10px] font-black tracking-widest text-muted-foreground ml-4">Data da Realização</Label>
                        <div className="relative">
                          <Input required type="date" value={formData.exam_date} onChange={e => setFormData(prev => ({ ...prev, exam_date: e.target.value }))} className="pl-14 h-16 font-bold bg-white/70 border-white/40 rounded-[1.5rem] text-center" />
                          <CalendarDays className="absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 text-amber-500" />
                        </div>
                     </div>

                     <div className="space-y-3 relative group">
                        <Label className="uppercase text-[10px] font-black tracking-widest text-muted-foreground ml-4">Horário Agendado</Label>
                        <div className="relative">
                          <Input required type="time" value={formData.exam_time} onChange={e => setFormData(prev => ({ ...prev, exam_time: e.target.value }))} className="pl-14 h-16 font-black text-2xl text-center tracking-widest bg-white/70 border-white/40 rounded-[1.5rem]" />
                          <Clock className="absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 text-amber-500 shadow-sm" />
                        </div>
                     </div>

                     <div className="space-y-3 relative group">
                        <Label className="uppercase text-[10px] font-black tracking-widest text-muted-foreground ml-4">Procedimento</Label>
                        <div className="relative">
                          <select value={formData.procedure_name} onChange={e => handleProcedureChange(e.target.value)} className="w-full appearance-none h-16 bg-white/70 border border-white/40 px-4 pl-14 rounded-[1.5rem] text-sm font-bold shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer uppercase">
                             {PROCEDURES.map(p => <option key={p} value={p}>{p}</option>)}
                          </select>
                          <Activity className="absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 text-blue-500" />
                        </div>
                     </div>

                     <div className="space-y-3 relative group">
                        <Label className="uppercase text-[10px] font-black tracking-widest text-muted-foreground ml-4">Tipo de Exame Específico</Label>
                        <div className="relative">
                          <select value={formData.exam_type} onChange={e => setFormData(prev => ({ ...prev, exam_type: e.target.value }))} className="w-full appearance-none h-16 bg-white/70 border border-white/40 px-4 pl-14 rounded-[1.5rem] text-sm font-bold shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer uppercase">
                             {EXAM_TYPES_BY_PROCEDURE[formData.procedure_name]?.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                          <FileText className="absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 text-blue-500" />
                        </div>
                     </div>

                     <div className="md:col-span-2 pt-6 flex gap-6">
                       <Button type="submit" disabled={isSubmitting || !hasSlots || isCheckingSlots} className={`flex-1 rounded-[1.5rem] text-white font-black h-16 text-lg tracking-widest uppercase shadow-2xl transition-all active:scale-95 ${hasSlots ? 'bg-gradient-to-r from-blue-700 to-indigo-600 hover:shadow-blue-500/40 hover:opacity-90' : 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'}`}>
                         {isSubmitting ? "Processando..." : !hasSlots && !isCheckingSlots ? "BLOQUEADO" : <><Save className="mr-3 h-6 w-6" /> Confirmar Agendamento</>}
                       </Button>
                       
                       {lastSaved && (
                         <Button type="button" onClick={handlePrint} variant="outline" className="px-8 rounded-[1.5rem] border-blue-200 border-2 text-blue-700 hover:bg-blue-50 font-black h-16 text-lg uppercase transition-all shadow-sm">
                           <Printer className="mr-3 h-6 w-6" /> Ficha
                         </Button>
                       )}
                     </div>
                  </div>
               </form>
            </div>
          </div>

          {/* Side Visualization Section (Human Model) */}
          <div className="hidden xl:block xl:col-span-4 space-y-6">
             <div className="glass-card !bg-card/40 border-none rounded-[3rem] p-6 shadow-xl h-full flex flex-col items-center justify-between min-h-[600px]">
                <div className="text-center mb-8">
                   <h3 className="font-black font-space text-lg uppercase tracking-widest text-slate-700">Mapeador de Exame</h3>
                   <div className="mt-2 h-1 w-20 bg-blue-500 mx-auto rounded-full opacity-50" />
                </div>
                
                <HumanModel procedure={formData.procedure_name} />
                
                <div className="mt-8 p-6 bg-blue-50/50 rounded-[2rem] border border-blue-100/50 w-full">
                   <div className="flex items-start gap-4">
                      <div className="p-3 bg-white rounded-2xl shadow-sm text-blue-600">
                         <Heart className="h-6 w-6" />
                      </div>
                      <div>
                         <p className="font-black text-xs uppercase tracking-wider text-slate-500">Dica Clínica</p>
                         <p className="text-sm font-bold text-slate-700 mt-1 leading-relaxed">
                            O exame de <span className="text-blue-600">{formData.procedure_name}</span> requer atenção às orientações de preparo informadas na ficha impressa.
                         </p>
                      </div>
                   </div>
                </div>
             </div>
          </div>

        </div>
      </div>

      {/* PRINT SECTION */}
      {lastSaved && (
        <div className="hidden print:block w-[14.8cm] h-[21cm] bg-white text-black p-8 mx-auto font-sans relative border">
            <div className="flex justify-between items-center mb-6 h-16">
                {logos.logo_hto && <img src={logos.logo_hto} alt="HTO" className="h-full object-contain" />}
                {logos.logo_instituto && <img src={logos.logo_instituto} alt="Instituto" className="h-[80%] object-contain" />}
                {logos.logo_maranhao && <img src={logos.logo_maranhao} alt="MA" className="h-[80%] object-contain" />}
            </div>

            <h1 className="text-xl font-black text-center mb-8 uppercase tracking-widest border-b-2 border-black pb-2">
                Agendamento de Exame
            </h1>

            <div className="space-y-4 text-base">
                <div className="flex border-b border-black border-dashed pb-1">
                    <span className="font-bold w-32">PACIENTE:</span>
                    <span className="flex-1 uppercase font-bold text-lg">{lastSaved.patient_name}</span>
                </div>
                <div className="flex border-b border-black border-dashed pb-1">
                    <span className="font-bold w-32">DATA DE NASC.:</span>
                    <span className="flex-1">_________________________</span>
                </div>
                <div className="flex border-b border-black border-dashed pb-1">
                    <span className="font-bold w-32">CPF:</span>
                    <span className="flex-1 font-bold tracking-widest">{maskCPF(lastSaved.cpf || "")}</span>
                </div>
                <div className="flex border-b border-black border-dashed pb-1">
                    <span className="font-bold w-32">CARTÃO SUS:</span>
                    <span className="flex-1 font-bold">{lastSaved.sus || "--"}</span>
                </div>
                <div className="flex border-b border-black border-dashed pb-1 mt-6">
                    <span className="font-bold w-[200px]">DATA DE REALIZAÇÃO:</span>
                    <span className="flex-1 font-bold text-xl">{format(new Date(lastSaved.exam_date + 'T00:00:00'), 'dd/MM/yyyy')}</span>
                </div>
            </div>

            <table className="w-full mt-8 border-collapse border border-black text-center table-fixed">
               <thead>
                 <tr>
                   <th className="border border-black p-2 bg-gray-100 uppercase text-sm w-[40%]">Exame</th>
                   <th className="border border-black p-2 bg-gray-100 uppercase text-sm w-[40%]">Tipo</th>
                   <th className="border border-black p-2 bg-gray-100 uppercase text-sm w-[20%]">Horário</th>
                 </tr>
               </thead>
               <tbody>
                 <tr>
                   <td className="border border-black p-4 font-bold uppercase">{lastSaved.procedure_name}</td>
                   <td className="border border-black p-4 font-bold uppercase">{lastSaved.exam_type}</td>
                   <td className="border border-black p-4 font-black text-xl">{lastSaved.exam_time}</td>
                 </tr>
               </tbody>
            </table>

            <div className="mt-8 flex gap-2">
               <span className="font-bold">DATA PARA RECEBER:</span>
               <span className="flex-1 border-b border-black"></span>
            </div>

            <div className="mt-12 space-y-4">
               <h2 className="font-bold text-lg uppercase mb-4">Orientações ao Paciente:</h2>
               <ul className="list-disc pl-6 space-y-2 font-bold opacity-90">
                  {lastSaved.procedure_name === "Tomografia" ? (
                    <>
                       <li>PACIENTE EM JEJUM DE 6 HORAS</li>
                       <li>TRAZER EXAMES DE UREIA E CREATININA RECENTE</li>
                       <li>NÃO FAZER USO DE METFORMINA OU HIPOGLICEMINANTE NO DIA DO EXAME</li>
                       <li>TRAZER SOLICITAÇÃO DO EXAME</li>
                       <li>DOCUMENTO (SUS E CPF) COM FOTO</li>
                    </>
                  ) : (
                    <>
                       <li>TRAZER REQUISIÇÃO DO EXAME</li>
                       <li>DOCUMENTO (SUS E CPF) COM FOTO</li>
                    </>
                  )}
               </ul>
            </div>
            
            <div className="absolute bottom-8 right-8 text-[8px] opacity-30 font-bold uppercase">
               Gerado em {format(new Date(), 'dd/MM/yyyy HH:mm')}
            </div>
        </div>
      )}
    </div>
  )
}
