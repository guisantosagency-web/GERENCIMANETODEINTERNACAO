"use client"

import { useState, useEffect, useMemo } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { 
  Users, CheckCircle2, Clock, AlertCircle, Loader2, 
  MapPin, Search, ChevronRight, Activity, X, Plus, 
  CheckSquare, Printer, CreditCard, Trash
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { format, parseISO, differenceInYears } from "date-fns"
import { searchMasterPatients, upsertMasterPatient } from "@/lib/patient-search"

const estados = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"
]

function SearchableSelect({ label, options, value, onChange, icon: Icon, disabled }: any) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const filtered = options.filter((o: string) => o.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="space-y-2 relative">
      <Label className="uppercase text-[9px] font-black tracking-widest text-[#7E8C9A] ml-2">{label}</Label>
      <div 
        onClick={() => !disabled && setOpen(!open)}
        className={`h-14 bg-[#161B22] border border-white/5 rounded-2xl flex items-center px-6 cursor-pointer shadow-xl ${disabled ? 'opacity-30 cursor-not-allowed' : 'hover:border-[#00D9FF]/30 transition-all'}`}
      >
        {Icon && <Icon className="h-4 w-4 text-[#7E8C9A] mr-3" />}
        <span className={`text-xs font-black uppercase flex-1 ${value ? 'text-white' : 'text-[#7E8C9A]'}`}>{value || "SELECIONAR..."}</span>
        <ChevronRight className={`h-4 w-4 text-[#7E8C9A] transition-transform ${open ? 'rotate-90 text-[#00D9FF]' : ''}`} />
      </div>

      {open && (
        <div className="absolute z-50 mt-2 w-full bg-[#1A1F26] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
          <div className="p-3 border-b border-white/5">
             <input className="w-full bg-[#0F1419] border-none rounded-xl py-2 px-4 text-[10px] font-black uppercase text-white focus:ring-0" placeholder="BUSCAR..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.map((o: string) => (
              <button key={o} onClick={() => { onChange(o); setOpen(false); }} className="w-full text-left px-5 py-3 text-[10px] font-black uppercase text-[#7E8C9A] hover:bg-[#00D9FF]/10 hover:text-[#00D9FF] transition-colors">{o}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function ChegadaTab() {
  const [loading, setLoading] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [appointments, setAppointments] = useState<any[]>([])
  const [selectedAppt, setSelectedAppt] = useState<any>(null)
  const [confirmedIds, setConfirmedIds] = useState<string[]>([])
  const [origins, setOrigins] = useState<any[]>([])
  const [municipios, setMunicipios] = useState<string[]>([])
  const [user, setUser] = useState<any>(null)
  const [dynamicProcedures, setDynamicProcedures] = useState<string[]>([])
  const [dynamicTypes, setDynamicTypes] = useState<Record<string, string[]>>({})
  const [isEditingReception, setIsEditingReception] = useState(false)
  const [slotInfo, setSlotInfo] = useState<any>(null)
  const [isCheckingSlots, setIsCheckingSlots] = useState(false)

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

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    loadData()
    loadUser()
  }, [])

  async function loadUser() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setUser({ ...user, ...profile })
    }
  }

  async function loadData() {
    try {
      setLoading(true)
      const { data: appts } = await supabase
        .from("exam_appointments")
        .select("*")
        .eq("status", "agendado")
        .eq("exam_date", new Date().toISOString().split('T')[0])
        .order("exam_time")

      // Agrupar por paciente + hora
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

      const { data: oData } = await supabase.from("exam_origins").select("*").order("name")
      setOrigins(oData || [])

      const { data: pData } = await supabase.from("exam_procedures_list").select("name")
      const { data: tData } = await supabase.from("exam_types_list").select("name, procedure_name")
      setDynamicProcedures((pData || []).map(p => p.name))
      const typeMap = (tData || []).reduce((acc: any, curr: any) => {
        if (!acc[curr.procedure_name]) acc[curr.procedure_name] = []
        acc[curr.procedure_name].push(curr.name)
        return acc
      }, {})
      setDynamicTypes(typeMap)

    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (formData.state === "MA") {
      setMunicipios(["IMPERATRIZ", "AÇAILÂNDIA", "DAVINÓPOLIS", "GOVERNADOR EDISON LOBÃO", "JOÃO LISBOA"])
    } else {
      setMunicipios([])
    }
  }, [formData.state])

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
      is_encaixe: appt.is_encaixe || false
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      let finalOriginId = formData.origin_id
      if (finalOriginId === "NOVO") {
        const { data: newO, error: oErr } = await supabase.from("exam_origins").insert([{ name: formData.new_origin_name.toUpperCase() }]).select().single()
        if (oErr) throw oErr
        finalOriginId = newO.id
      }

      const cleanCPF = formData.cpf.replace(/\D/g, "")

      // Atualizar appointments
      await supabase
        .from("exam_appointments")
        .update({
          status: 'presente',
          arrival_time: new Date().toISOString(),
          origin_id: finalOriginId,
          priority: formData.priority,
          chave_sisreg: formData.clave_sisreg,
          birth_date: formData.birth_date
        })
        .in("id", confirmedIds)

      // Se houver exames não confirmados, cancelar ou manter como agendado? 
      // Para simplificar, vamos considerar que os confirmados entram na fila.

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

  const calculatedAge = formData.birth_date ? differenceInYears(new Date(), parseISO(formData.birth_date)) : "--"

  if (loading) return <div className="h-96 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[#00D9FF]" /></div>

  return (
    <div className="h-full min-h-[800px] flex flex-row-reverse gap-8 animate-in fade-in duration-500 overflow-hidden relative">
      
      {/* FORM RIGHT SIDE */}
      <div className={`transition-all duration-700 ease-out h-full ${selectedAppt ? 'w-[550px] opacity-100 translate-x-0' : 'w-0 opacity-0 translate-x-full'}`}>
        <div className="glass-premium rounded-[2.5rem] h-full flex flex-col overflow-hidden border border-white/5 shadow-2xl">
           <div className="p-8 bg-[#00FF88] text-[#0F1419] relative">
              <div className="flex items-center justify-between mb-4">
                 <div className="h-10 w-10 flex items-center justify-center bg-black/10 rounded-xl"><CheckSquare className="h-6 w-6" /></div>
                 <Button variant="ghost" size="icon" onClick={() => setSelectedAppt(null)} className="h-10 w-10 text-black/50 hover:bg-black/5 rounded-full"><X className="h-6 w-6" /></Button>
              </div>
              <h3 className="text-2xl font-black font-space uppercase tracking-tight">Protocolo de Entrada</h3>
              <p className="text-[10px] font-black opacity-50 uppercase tracking-widest mt-1">Paciente: {selectedAppt?.patient_name}</p>
           </div>

           <div className="flex-1 overflow-y-auto p-10 custom-scrollbar space-y-10">
              <form id="arrival-form" onSubmit={handleSubmit} className="space-y-10">
                 <div className="space-y-4">
                    <Label className="uppercase text-[9px] font-black tracking-widest text-[#7E8C9A] ml-2">Exames Confirmados</Label>
                    <div className="grid grid-cols-1 gap-3">
                       {(selectedAppt?.raw_appointments || []).map((exam: any) => {
                          const isConfirmed = confirmedIds.includes(exam.id)
                          return (
                            <button 
                              key={exam.id} 
                              type="button"
                              onClick={() => setConfirmedIds(prev => prev.includes(exam.id) ? prev.filter(i => i !== exam.id) : [...prev, exam.id])}
                              className={`flex items-center justify-between p-5 rounded-2xl border-2 transition-all ${isConfirmed ? 'bg-[#00FF88]/5 border-[#00FF88] shadow-lg' : 'bg-white/5 border-transparent opacity-40 hover:opacity-100'}`}
                            >
                               <div className="flex flex-col items-start">
                                  <span className="text-xs font-black text-white uppercase">{exam.procedure_name}</span>
                                  <span className="text-[9px] font-bold text-[#7E8C9A] uppercase">{exam.exam_type}</span>
                               </div>
                               <div className={`h-6 w-6 rounded-full flex items-center justify-center border-2 ${isConfirmed ? 'bg-[#00FF88] border-[#00FF88] text-[#0F1419]' : 'border-[#7E8C9A] text-transparent'}`}>
                                  {isConfirmed && <CheckSquare className="h-3 w-3" />}
                               </div>
                            </button>
                          )
                       })}
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <Label className="uppercase text-[9px] font-black tracking-widest text-[#7E8C9A] ml-2">Nascimento</Label>
                       <Input type="date" value={formData.birth_date} onChange={e => setFormData(p => ({ ...p, birth_date: e.target.value }))} className="h-14 bg-[#161B22] border-white/5 rounded-2xl text-xs font-black text-white" />
                    </div>
                    <div className="space-y-2">
                       <Label className="uppercase text-[9px] font-black tracking-widest text-[#7E8C9A] ml-2">Idade</Label>
                       <div className="h-14 bg-white/5 rounded-2xl flex items-center justify-center font-black text-[#7E8C9A] uppercase text-xs">{calculatedAge} anos</div>
                    </div>
                 </div>

                 <div className="space-y-2">
                    <Label className="uppercase text-[9px] font-black tracking-widest text-[#7E8C9A] ml-2">Chave SISREG</Label>
                    <Input value={formData.clave_sisreg} onChange={e => setFormData(p => ({ ...p, clave_sisreg: e.target.value }))} className="h-14 bg-[#161B22] border-white/5 rounded-2xl text-xs font-black text-white" placeholder="APENAS NÚMEROS..." />
                 </div>

                 <div className="space-y-2">
                    <Label className="uppercase text-[9px] font-black tracking-widest text-[#7E8C9A] ml-2">Prioridade</Label>
                    <select value={formData.priority} onChange={e => setFormData(p => ({ ...p, priority: e.target.value }))} className="w-full h-14 bg-[#161B22] border-none rounded-2xl px-6 font-black uppercase text-xs text-white shadow-xl">
                       <option value="Sem Prioridade">NORMAL</option>
                       <option value="Idoso (60+)">IDOSO 60+</option>
                       <option value="Gestante">GESTANTE</option>
                       <option value="Prioritário">PRIORITÁRIO</option>
                    </select>
                 </div>

                 <div className="space-y-2">
                    <Label className="uppercase text-[9px] font-black tracking-widest text-[#7E8C9A] ml-2">Unidade de Origem</Label>
                    <select value={formData.origin_id} onChange={e => setFormData(p => ({ ...p, origin_id: e.target.value }))} className="w-full h-14 bg-[#161B22] border-none rounded-2xl px-6 font-black uppercase text-xs text-white shadow-xl">
                       <option value="">SELECIONAR...</option>
                       {origins.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                       <option value="NOVO">+ CADASTRAR NOVA</option>
                    </select>
                 </div>

                 {formData.origin_id === "NOVO" && (
                   <Input placeholder="NOME DA UNIDADE..." value={formData.new_origin_name} onChange={e => setFormData(p => ({ ...p, new_origin_name: e.target.value.toUpperCase() }))} className="h-14 bg-[#00FF88]/5 border-[#00FF88]/20 rounded-2xl text-xs font-black text-white" />
                 )}
              </form>
           </div>

           <div className="p-10 border-t border-white/5 bg-black/20">
              <Button form="arrival-form" type="submit" disabled={isLoading} className="w-full h-16 bg-[#00FF88] hover:bg-[#00D9FF] text-[#0F1419] rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs transition-all shadow-2xl">
                 {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Confirmar Recebimento"}
              </Button>
           </div>
        </div>
      </div>

      {/* LIST SIDE */}
      <div className="flex-1 space-y-10 group overflow-y-auto pr-4 custom-scrollbar">
         <div className="flex items-center justify-between mb-8">
            <h2 className="text-4xl font-black font-space text-white uppercase tracking-tight flex items-center gap-5">
               <div className="p-4 bg-white/5 border border-white/10 rounded-3xl shadow-2xl"><Users className="h-8 w-8 text-[#00FF88]" /></div>
               Pacientes Agendados
            </h2>
            <div className="flex items-center gap-4">
               <div className="h-14 px-8 bg-[#161B22] rounded-[2rem] flex items-center gap-4 border border-white/5">
                  <span className="text-[10px] font-black text-[#7E8C9A] uppercase tracking-widest">Saldo do Dia:</span>
                  <span className="text-xl font-black text-white">{appointments.length}</span>
               </div>
            </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {appointments.length === 0 ? (
               <div className="col-span-full py-32 text-center opacity-30">
                  <div className="p-10 border-2 border-dashed border-[#7E8C9A] rounded-full inline-block mb-6"><Clock className="h-12 w-12 text-[#7E8C9A]" /></div>
                  <p className="text-xs font-black uppercase tracking-[0.5em] text-[#7E8C9A]">Nenhum agendamento pendente para hoje</p>
               </div>
            ) : (
               appointments.map(appt => (
                  <div key={`${appt.patient_name}-${appt.exam_time}`} onClick={() => handleSelectAppt(appt)} className={`glass-premium rounded-[2.5rem] p-8 border border-white/5 cursor-pointer group transition-all hover:scale-[1.02] hover:shadow-2xl hover:border-[#00FF88]/30 ${selectedAppt?.id === appt.id ? 'bg-[#00FF88]/5 border-[#00FF88]' : ''}`}>
                     <div className="flex items-center gap-6">
                        <div className="h-16 w-16 rounded-[1.5rem] bg-[#1D232A] flex items-center justify-center font-black text-xl text-[#7E8C9A] group-hover:bg-[#00FF88] group-hover:text-[#0F1419] transition-all shadow-xl">
                           {appt.patient_name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                           <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] font-black text-[#00FF88] uppercase tracking-widest">{appt.exam_time}</span>
                              <ChevronRight className="h-4 w-4 text-[#7E8C9A] opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0" />
                           </div>
                           <h4 className="text-lg font-black text-white uppercase tracking-tight truncate">{appt.patient_name}</h4>
                           <p className="text-[9px] font-bold text-[#7E8C9A] uppercase mt-1">
                              {appt.raw_appointments.length > 1 ? `${appt.raw_appointments.length} PROCEDIMENTOS` : appt.procedure_name}
                           </p>
                        </div>
                     </div>
                  </div>
               ))
            )}
         </div>
      </div>

    </div>
  )
}
