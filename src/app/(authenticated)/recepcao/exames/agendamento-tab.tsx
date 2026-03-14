"use client"
import { useState, useRef, useMemo, useEffect } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { CalendarDays, Save, Printer, User, CreditCard, Clock, Activity, FileText, AlertCircle } from "lucide-react"
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

  // Check slots whenever date or procedure changes
  useEffect(() => {
    const checkSlots = async () => {
      if (formData.procedure_name === "Raio X") {
        setSlotInfo(null)
        return
      }

      setIsCheckingSlots(true)
      try {
        // 1. Get total slots for this date/proc
        const { data: slotData } = await supabase
          .from("exam_slots")
          .select("total_slots")
          .eq("exam_date", formData.exam_date)
          .eq("procedure_name", formData.procedure_name)
          .maybeSingle()

        // 2. Get current appointments for this date/proc
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

    // Restriction check
    if (formData.procedure_name !== "Raio X") {
      if (!slotInfo || slotInfo.total === 0) {
        alert("ERRO: Não há vagas registradas para este procedimento nesta data. Por favor, solicite ao admin o registro das vagas.")
        return
      }
      if (slotInfo.occupied >= slotInfo.total) {
        alert("ERRO: Limite de vagas atingido para este procedimento nesta data.")
        return
      }
    }

    setIsSubmitting(true)
    try {
      const { data, error } = await supabase.from("exam_appointments").insert([{
        patient_name: formData.patient_name.toUpperCase(),
        cpf: formData.cpf,
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
      
      // Refresh slot info
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

  const handlePrint = () => {
    window.print()
  }

  const hasSlots = formData.procedure_name === "Raio X" || (slotInfo && slotInfo.total > 0 && slotInfo.occupied < slotInfo.total)
  const noSlotsAtAll = formData.procedure_name !== "Raio X" && slotInfo && slotInfo.total === 0

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="print:hidden">
        <div className="glass-card !bg-card/40 border-none rounded-[2.5rem] p-8 max-w-5xl mx-auto shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <h2 className="text-2xl font-black font-space uppercase tracking-tight flex items-center gap-3">
               <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl"><CalendarDays className="h-6 w-6" /></div>
               Novo Agendamento
            </h2>

            {formData.procedure_name !== "Raio X" && (
              <div className={`p-4 rounded-2xl border flex items-center gap-3 transition-all ${noSlotsAtAll ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-blue-500/5 border-blue-500/10 text-primary'}`}>
                {isCheckingSlots ? (
                  <div className="h-4 w-4 border-2 border-t-transparent border-primary rounded-full animate-spin" />
                ) : (
                  <AlertCircle className="h-5 w-5" />
                )}
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Disponibilidade</p>
                  <p className="text-sm font-bold">
                    {noSlotsAtAll ? "BLOQUEADO: Sem vagas" : `${slotInfo?.occupied || 0} / ${slotInfo?.total || 0} vagas ocupadas`}
                  </p>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-muted/20 border border-white/5 rounded-3xl">
                <div className="space-y-2 md:col-span-2 relative">
                   <Label className="uppercase text-xs font-black tracking-widest text-muted-foreground">Nome do Paciente</Label>
                   <div className="relative">
                     <Input required placeholder="Nome completo" value={formData.patient_name} onChange={e => setFormData(prev => ({ ...prev, patient_name: e.target.value }))} className="pl-10 h-14 text-lg font-bold bg-background focus:ring-blue-500 rounded-2xl" />
                     <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-500" />
                   </div>
                </div>

                <div className="space-y-2 relative">
                   <Label className="uppercase text-xs font-black tracking-widest text-muted-foreground">CPF / SUS</Label>
                   <div className="relative">
                     <Input required placeholder="Documento" value={formData.cpf} onChange={e => setFormData(prev => ({ ...prev, cpf: e.target.value }))} className="pl-10 h-14 font-bold bg-background rounded-2xl" />
                     <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-500" />
                   </div>
                </div>

                <div className="space-y-2 relative">
                   <Label className="uppercase text-xs font-black tracking-widest text-muted-foreground">Data da Realização</Label>
                   <div className="relative">
                     <Input required type="date" value={formData.exam_date} onChange={e => setFormData(prev => ({ ...prev, exam_date: e.target.value }))} className="pl-10 h-14 font-bold bg-background rounded-2xl md:text-lg text-center" />
                     <CalendarDays className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-amber-500" />
                   </div>
                </div>

                <div className="space-y-2 relative">
                   <Label className="uppercase text-xs font-black tracking-widest text-muted-foreground">Procedimento</Label>
                   <div className="relative group/select">
                     <select value={formData.procedure_name} onChange={e => handleProcedureChange(e.target.value)} className="w-full appearance-none h-14 bg-background border border-border px-4 pl-10 rounded-2xl text-sm font-bold shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
                        {PROCEDURES.map(p => <option key={p} value={p}>{p}</option>)}
                     </select>
                     <Activity className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-500" />
                   </div>
                </div>

                <div className="space-y-2 relative">
                   <Label className="uppercase text-xs font-black tracking-widest text-muted-foreground">Tipo de Exame</Label>
                   <div className="relative group/select">
                     <select value={formData.exam_type} onChange={e => setFormData(prev => ({ ...prev, exam_type: e.target.value }))} className="w-full appearance-none h-14 bg-background border border-border px-4 pl-10 rounded-2xl text-sm font-bold shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
                        {EXAM_TYPES_BY_PROCEDURE[formData.procedure_name]?.map(t => <option key={t} value={t}>{t}</option>)}
                     </select>
                     <FileText className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-500" />
                   </div>
                </div>

                <div className="space-y-2 relative">
                   <Label className="uppercase text-xs font-black tracking-widest text-muted-foreground">Horário Agendado</Label>
                   <div className="relative">
                     <Input required type="time" value={formData.exam_time} onChange={e => setFormData(prev => ({ ...prev, exam_time: e.target.value }))} className="pl-10 h-14 font-bold text-xl text-center tracking-widest bg-background rounded-2xl" />
                     <Clock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-amber-500" />
                   </div>
                </div>

                <div className="md:col-span-2 pt-4 flex gap-4">
                  <Button type="submit" disabled={isSubmitting || !hasSlots || isCheckingSlots} className={`flex-1 rounded-2xl text-white font-bold h-14 text-lg ${hasSlots ? 'bg-blue-600 hover:bg-blue-700' : 'bg-muted text-muted-foreground cursor-not-allowed'}`}>
                    {isSubmitting ? "Salvando..." : !hasSlots && !isCheckingSlots ? "Sem Vagas Disponíveis" : <><Save className="mr-2 h-5 w-5" /> Salvar Agendamento</>}
                  </Button>
                  
                  {lastSaved && (
                    <Button type="button" onClick={handlePrint} variant="outline" className="flex-1 rounded-2xl border-blue-500/50 text-blue-600 hover:bg-blue-50 font-bold h-14 text-lg shadow-sm">
                      <Printer className="mr-2 h-5 w-5" /> Imprimir Ficha
                    </Button>
                  )}
                </div>
             </div>
          </form>
        </div>
      </div>

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
                    <span className="font-bold w-32">SUS/CPF:</span>
                    <span className="flex-1 font-bold">{lastSaved.cpf || lastSaved.sus}</span>
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
