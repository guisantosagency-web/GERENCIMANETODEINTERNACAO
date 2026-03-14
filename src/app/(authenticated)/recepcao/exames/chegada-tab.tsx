"use client"
import { useState, useEffect, useMemo } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { List, CheckSquare, Clock, MapPin, Key, AlertTriangle, User, Loader2, Save, Users, Trash, Search, ChevronDown, X, ArrowLeft, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { differenceInYears, parseISO, format } from "date-fns"
import { useAuth } from "@/lib/auth-context"

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
  const [origins, setOrigins] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [estados, setEstados] = useState<IbgeEstado[]>([])
  const [municipios, setMunicipios] = useState<IbgeMunicipio[]>([])

  const [selectedAppt, setSelectedAppt] = useState<any>(null)
  
  const [formData, setFormData] = useState({
    origin_id: "",
    new_origin_name: "",
    birth_date: "",
    state: "MA",
    city: "São Luís",
    access_key: "",
    priority: "Sem Prioridade",
    receptionist_name: ""
  })
  
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

  const loadData = async () => {
    setIsLoading(true)
    try {
      const { data: orgData } = await supabase.from("exam_origins").select("*").order("name")
      if (orgData) setOrigins(orgData)

      const { data: appData } = await supabase.from("exam_appointments").select("*").eq("status", "agendado").order("exam_date").order("exam_time")
      if (appData) setAppointments(appData)
    } finally {
       setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSelectAppt = (appt: any) => {
    setSelectedAppt(appt)
    setFormData({
      origin_id: origins[0]?.id || "",
      new_origin_name: "",
      birth_date: "",
      state: "MA",
      city: "São Luís",
      access_key: "",
      priority: "Sem Prioridade",
      receptionist_name: user?.name || ""
    })
  }

  const handleDeleteOrigin = async (e: any, id: string) => {
     e.preventDefault()
     if (confirm("Remover esta origem?")) {
        await supabase.from("exam_origins").delete().eq("id", id)
        loadData()
     }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      let finalOriginId = formData.origin_id

      if (formData.origin_id === "NOVO" && formData.new_origin_name.trim() !== "") {
        const { data, error } = await supabase.from("exam_origins").insert([{ name: formData.new_origin_name.toUpperCase() }]).select().single()
        if (error) throw error
        finalOriginId = data.id
      }

      const { error } = await supabase.from("exam_appointments").update({
        status: "aguardando",
        arrival_time: new Date().toISOString(),
        origin_id: finalOriginId,
        birth_date: formData.birth_date,
        state: formData.state,
        city: formData.city,
        access_key: formData.access_key,
        priority: formData.priority,
        receptionist_name: formData.receptionist_name
      }).eq("id", selectedAppt.id)

      if (error) throw error

      await supabase.from("patients").upsert({
        paciente: selectedAppt.patient_name,
        cpf: selectedAppt.cpf,
        sus: selectedAppt.sus,
        data_nascimento: formData.birth_date,
        cidade_origem: formData.city,
        estado: formData.state,
        updated_at: new Date().toISOString()
      }, { onConflict: "cpf" })

      setSelectedAppt(null)
      loadData()
      alert("Entrada registrada com sucesso!")
    } catch (err) {
      console.error(err)
      alert("Erro ao confirmar chegada.")
    }
  }

  const calculatedAge = formData.birth_date ? differenceInYears(new Date(), parseISO(formData.birth_date)) : "--"

  return (
    <div className="h-full min-h-[800px] flex flex-row-reverse gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-hidden relative">
      
      {/* RIGHT PANEL: ARRIVAL FORM (PULLS FROM RIGHT TO LEFT) */}
      <div className={`transition-all duration-700 ease-out h-full ${selectedAppt ? 'w-[550px] opacity-100 translate-x-0' : 'w-0 opacity-0 translate-x-full overflow-hidden'}`}>
         <div className="glass-card bg-white border-none rounded-[3.5rem] h-full shadow-2xl flex flex-col overflow-hidden border-2 border-emerald-500/10">
            <div className="p-8 border-b bg-emerald-600 text-white relative">
               <div className="flex items-center justify-between mb-2">
                 <div className="h-10 w-10 flex items-center justify-center bg-white/20 rounded-xl"><CheckSquare className="h-6 w-6" /></div>
                 <Button variant="ghost" size="icon" onClick={() => setSelectedAppt(null)} className="h-10 w-10 text-white hover:bg-white/10 rounded-full"><X className="h-6 w-6" /></Button>
               </div>
               <h3 className="text-2xl font-black font-space uppercase tracking-tight">Protocolo de Entrada</h3>
               <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest mt-1">Paciente: {selectedAppt?.patient_name}</p>
            </div>

            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
               <form id="arrival-form" onSubmit={handleSubmit} className="space-y-8 pb-10">
                  <div className="space-y-6">
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

                    <SearchableSelect label="Estado (UF)" options={estados} value={formData.state} onChange={(val: string) => setFormData(p => ({ ...p, state: val, city: "" }))} icon={MapPin} />
                    <SearchableSelect label="Cidade" options={municipios} value={formData.city} onChange={(val: string) => setFormData(p => ({ ...p, city: val }))} icon={Search} disabled={!formData.state} />

                    <div className="space-y-2">
                       <Label className="uppercase text-[10px] font-black tracking-widest text-slate-400 ml-2">Chave de Protocolo</Label>
                       <div className="relative">
                          <Input required type="number" placeholder="DIGITE A CHAVE..." value={formData.access_key} onChange={e => setFormData(p => ({ ...p, access_key: e.target.value }))} className="h-14 pl-12 font-black text-center tracking-widest bg-slate-50 border-none rounded-2xl shadow-inner" />
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
               <Button form="arrival-form" type="submit" className="w-full h-16 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-emerald-500/20 gap-4 transition-all active:scale-95 group">
                  <Send className="h-6 w-6 group-hover:translate-x-1 transition-transform" /> Confirmar Chegada
               </Button>
            </div>
         </div>
      </div>

      {/* RIGHT PANEL: WAIT LIST */}
      <div className={`flex-1 transition-all duration-700 ${selectedAppt ? 'translate-x-0' : '-translate-x-0'}`}>
         <div className="glass-card !bg-white/40 border-none rounded-[3.5rem] p-8 lg:p-10 shadow-sm h-full flex flex-col relative overflow-hidden">
            <div className="flex items-center justify-between mb-10">
               <div>
                  <h2 className="text-3xl font-black font-space uppercase tracking-tight flex items-center gap-4 text-slate-800">
                    <div className="p-4 bg-emerald-600 text-white rounded-[1.5rem] shadow-xl shadow-emerald-500/10"><Users className="h-7 w-7" /></div>
                    Fila de Triagem / Recepção
                  </h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-3 ml-20">Controle Dinâmico de Pacientes Aguardando</p>
               </div>
               
               <div className="px-5 py-3 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                  <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{appointments.length} AGUARDANDO</span>
               </div>
            </div>

            {isLoading ? (
               <div className="flex-1 flex flex-col items-center justify-center gap-4 text-slate-400">
                  <Loader2 className="h-12 w-12 animate-spin text-emerald-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest animate-pulse">Consultando Banco...</span>
               </div>
            ) : appointments.length === 0 ? (
               <div className="flex-1 flex flex-col items-center justify-center opacity-30 text-slate-400">
                  <Clock className="h-32 w-32 mb-8 stroke-[1px]" />
                  <p className="text-2xl font-black font-space uppercase tracking-widest">Nenhum Registro para Recepção</p>
               </div>
            ) : (
               <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-10">
                  <div className="grid grid-cols-1 gap-4">
                     {appointments.map(a => (
                        <div key={a.id} className={`p-6 rounded-[2rem] transition-all duration-500 border-2 flex items-center justify-between group ${selectedAppt?.id === a.id ? 'bg-emerald-50 border-emerald-500 shadow-xl' : 'bg-white border-slate-100 hover:border-emerald-200 hover:shadow-lg'}`}>
                           <div className="flex items-center gap-6">
                              <div className={`h-16 w-16 rounded-[1.5rem] flex items-center justify-center font-black text-2xl transition-all duration-500 ${selectedAppt?.id === a.id ? 'bg-emerald-600 text-white scale-110 rotate-3' : 'bg-slate-50 text-slate-400 group-hover:bg-emerald-100 group-hover:text-emerald-600 group-hover:-rotate-3'}`}>
                                 {a.patient_name.charAt(0)}
                              </div>
                              <div className="space-y-1">
                                 <h4 className="font-black text-lg text-slate-800 uppercase tracking-tight">{a.patient_name}</h4>
                                 <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                    <span className="flex items-center gap-1.5"><Clock className="h-3 w-3 text-emerald-500" /> {a.exam_time} • {format(new Date(a.exam_date + 'T00:00:00'), 'dd/MM/yyyy')}</span>
                                    <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md font-black">{a.procedure_name}</span>
                                 </div>
                              </div>
                           </div>

                           <div className="flex items-center gap-4">
                              <div className="hidden md:flex flex-col items-end mr-4">
                                 <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Doc. Identificação</span>
                                 <span className="text-xs font-black text-slate-500 tabular-nums lowercase">{a.cpf ? 'cpf: ' + a.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4") : 'sus: ' + a.sus}</span>
                              </div>
                              
                              <Button 
                                 onClick={() => handleSelectAppt(a)} 
                                 className={`h-14 px-8 rounded-2xl gap-3 font-black uppercase text-xs tracking-widest transition-all ${selectedAppt?.id === a.id ? 'bg-emerald-700 text-white shadow-none' : 'bg-emerald-600 text-white shadow-xl shadow-emerald-500/10 hover:shadow-emerald-500/30'}`}
                              >
                                 {selectedAppt?.id === a.id ? <ChevronRight className="h-5 w-5 animate-bounce-horizontal" /> : <CheckSquare className="h-5 w-5" />}
                                 {selectedAppt?.id === a.id ? "Editando..." : "Registrar Entrada"}
                              </Button>

                              {user?.role === "admin" && (
                                <Button 
                                   variant="ghost" 
                                   size="icon" 
                                   onClick={async () => {
                                      if(confirm("Excluir agendamento permanentemente?")) {
                                        await supabase.from("exam_appointments").delete().eq("id", a.id)
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
