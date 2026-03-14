"use client"
import { useState, useEffect, useMemo } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { List, CheckSquare, Clock, MapPin, Key, AlertTriangle, User, Loader2, Save, Users, Trash, Search, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { differenceInYears, parseISO, format } from "date-fns"
import { useAuth } from "@/lib/auth-context"

type IbgeEstado = { id: number, sigla: string, nome: string }
type IbgeMunicipio = { id: number, nome: string }

// Reusable Searchable Select Component
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
      <Label className="uppercase text-[10px] font-black tracking-widest text-muted-foreground ml-2">{label}</Label>
      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full flex items-center justify-between bg-white border border-slate-200 px-4 h-14 rounded-2xl text-sm font-bold shadow-sm transition-all focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed ${isOpen ? 'ring-2 ring-emerald-500 border-emerald-500' : ''}`}
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

  // Localidades
  const [estados, setEstados] = useState<IbgeEstado[]>([])
  const [municipios, setMunicipios] = useState<IbgeMunicipio[]>([])

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedAppt, setSelectedAppt] = useState<any>(null)
  
  const [formData, setFormData] = useState({
    origin_id: "",
    new_origin_name: "",
    birth_date: "",
    state: "",
    city: "",
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

  const handleOpenModal = (appt: any) => {
    setSelectedAppt(appt)
    setFormData({
      origin_id: origins[0]?.id || "",
      new_origin_name: "",
      birth_date: "",
      state: "MA",
      city: "São Luís",
      access_key: "",
      priority: "Sem Prioridade",
      receptionist_name: user?.name || "Recepcionista Logado"
    })
    setIsModalOpen(true)
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
        telefone: "", 
        updated_at: new Date().toISOString()
      }, { onConflict: "cpf" })

      setIsModalOpen(false)
      loadData()
    } catch (err: any) {
      console.error(err)
      alert("Erro ao confirmar chegada.")
    }
  }

  const calculatedAge = formData.birth_date ? differenceInYears(new Date(), parseISO(formData.birth_date)) : "--"

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="glass-card !bg-card/40 border-none rounded-[3rem] p-6 lg:p-8 shadow-sm relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/5 rounded-full blur-3xl animate-pulse" />
        
        <h2 className="text-3xl font-black font-space uppercase tracking-tight mb-10 flex items-center gap-4">
          <div className="p-4 bg-emerald-600 text-white rounded-2xl shadow-lg shadow-emerald-500/20"><List className="h-7 w-7" /></div>
          Pacientes em Espera de Recepção
        </h2>

        {isLoading ? (
           <div className="h-80 flex flex-col items-center justify-center gap-4">
             <div className="relative">
                <Loader2 className="h-12 w-12 animate-spin text-emerald-600" />
                <div className="absolute inset-0 bg-emerald-600/10 rounded-full blur-xl" />
             </div>
             <p className="font-bold text-slate-400 animate-pulse tracking-[0.3em] text-[10px] uppercase">Sincronizando Banco de Dados...</p>
           </div>
        ) : appointments.length === 0 ? (
           <div className="h-80 flex flex-col items-center justify-center opacity-30 text-slate-400">
             <Clock className="h-20 w-20 mb-6 stroke-[1.5px]" />
             <p className="text-xl font-black font-space tracking-widest uppercase">Sem Fila de Chegada no Momento</p>
           </div>
        ) : (
           <div className="overflow-x-auto rounded-[2.5rem] border border-slate-100 bg-white shadow-soft p-1">
             <table className="w-full text-left text-sm whitespace-nowrap">
               <thead className="bg-slate-50/50 font-black uppercase tracking-widest text-[10px] text-slate-400">
                 <tr>
                   <th className="p-6">Data / Hora</th>
                   <th className="p-6">Paciente</th>
                   <th className="p-6">Documento Principal</th>
                   <th className="p-6">Procedimento Central</th>
                   <th className="p-6 text-right">Controle</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                 {appointments.map(a => (
                   <tr key={a.id} className="hover:bg-slate-50/80 transition-all duration-300 group">
                     <td className="p-6">
                       <div className="flex flex-col">
                         <span className="font-black text-slate-800 text-base">{format(new Date(a.exam_date + 'T00:00:00'), 'dd/MM')}</span>
                         <span className="text-emerald-600 font-bold text-xs bg-emerald-50 px-2 py-0.5 rounded-lg w-fit mt-1">{a.exam_time}</span>
                       </div>
                     </td>
                     <td className="p-6">
                        <div className="flex items-center gap-4">
                           <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center font-black text-slate-400 group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-colors">
                              {a.patient_name.charAt(0)}
                           </div>
                           <span className="font-black uppercase text-slate-800 text-base tracking-tight">{a.patient_name}</span>
                        </div>
                     </td>
                     <td className="p-6 font-bold text-slate-500 tabular-nums">
                        {a.cpf ? a.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4") : a.sus}
                     </td>
                     <td className="p-6">
                        <div className="flex flex-col">
                          <span className="text-blue-600 font-black tracking-tight">{a.procedure_name}</span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">{a.exam_type}</span>
                        </div>
                     </td>
                     <td className="p-6 text-right flex items-center justify-end gap-3">
                       <Button onClick={() => handleOpenModal(a)} className="h-12 px-6 rounded-2xl shadow-premium-hover gap-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-xs tracking-widest transition-all">
                         <CheckSquare className="h-5 w-5" /> Registrar Entrada
                       </Button>

                       {user?.role === "admin" && (
                         <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={async () => {
                               if(confirm("Deseja realmente excluir este agendamento?")) {
                                 await supabase.from("exam_appointments").delete().eq("id", a.id)
                                 loadData()
                               }
                            }}
                            className="h-12 w-12 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-2xl transition-all"
                         >
                           <Trash className="h-5 w-5" />
                         </Button>
                       )}
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl bg-white border-none shadow-[0_50px_100px_-20px_rgba(0,0,0,0.25)] rounded-[3rem] p-0 overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-emerald-600 via-emerald-400 to-emerald-600" />
          
          <div className="p-8 lg:p-12">
            <DialogHeader className="mb-10">
              <div className="flex items-center gap-6">
                 <div className="p-5 bg-emerald-50 text-emerald-600 rounded-[2rem] shadow-inner"><CheckSquare className="h-8 w-8" /></div>
                 <div>
                    <DialogTitle className="text-3xl font-black font-space uppercase tracking-tight text-slate-900">
                       Formulário de Entrada
                    </DialogTitle>
                    <DialogDescription className="font-bold text-slate-400 mt-1 uppercase text-xs tracking-widest">
                       Protocolo de Recepção para <span className="text-emerald-600">{selectedAppt?.patient_name}</span>
                    </DialogDescription>
                 </div>
              </div>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10">
                
                <div className="space-y-3 relative group lg:col-span-2">
                  <Label className="uppercase text-[10px] font-black tracking-widest text-muted-foreground ml-2 group-hover:text-emerald-500 transition-colors">Origem do Encaminhamento <span className="text-emerald-500">*</span></Label>
                  <div className="flex gap-3">
                     <div className="relative flex-1">
                        <select required value={formData.origin_id} onChange={e => setFormData(p => ({ ...p, origin_id: e.target.value }))} className="w-full appearance-none bg-slate-50 border-white/40 border-2 px-12 h-14 rounded-2xl text-sm font-bold shadow-soft focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all cursor-pointer">
                           {origins.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                           <option value="NOVO" className="font-black text-emerald-500">+ CADASTRAR NOVA ORIGEM</option>
                        </select>
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-emerald-500" />
                     </div>
                     {formData.origin_id && formData.origin_id !== "NOVO" && user?.role === "admin" && (
                        <Button type="button" variant="ghost" size="icon" className="h-14 w-14 rounded-2xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm" onClick={(e) => handleDeleteOrigin(e, formData.origin_id)}>
                           <Trash className="h-5 w-5" />
                        </Button>
                     )}
                  </div>
                </div>

                {formData.origin_id === "NOVO" && (
                  <div className="space-y-3 relative animate-in slide-in-from-left-4 duration-500">
                    <Label className="uppercase text-[10px] font-black tracking-widest text-emerald-600 ml-2">Nova Unidade / Origem</Label>
                    <Input required placeholder="Ex: SECRETARIA DE SAÚDE" value={formData.new_origin_name} onChange={e => setFormData(p => ({ ...p, new_origin_name: e.target.value }))} className="h-14 font-bold uppercase bg-white border-2 border-emerald-100 rounded-2xl shadow-indicator" />
                  </div>
                )}

                <div className="space-y-3 relative group">
                  <Label className="uppercase text-[10px] font-black tracking-widest text-muted-foreground ml-2">Data de Nascimento <span className="text-red-500">*</span></Label>
                  <div className="flex items-center gap-3">
                     <Input type="date" required value={formData.birth_date} onChange={e => setFormData(p => ({ ...p, birth_date: e.target.value }))} className="flex-1 h-14 font-bold bg-slate-50 border-none rounded-2xl text-center shadow-soft" />
                     <div className="h-14 px-4 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-xs font-space shrink-0 shadow-sm">
                        {calculatedAge} ANOS
                     </div>
                  </div>
                </div>

                <SearchableSelect 
                  label="Estado de Residência" 
                  placeholder="Selecione UF..." 
                  options={estados} 
                  value={formData.state} 
                  onChange={(val: string) => setFormData(p => ({ ...p, state: val, city: "" }))} 
                  icon={MapPin}
                />

                <SearchableSelect 
                  label="Município de Origem" 
                  placeholder="Buscar Cidade..." 
                  options={municipios} 
                  value={formData.city} 
                  onChange={(val: string) => setFormData(p => ({ ...p, city: val }))} 
                  disabled={!formData.state}
                  icon={Search}
                />

                <div className="space-y-3 relative">
                  <Label className="uppercase text-[10px] font-black tracking-widest text-muted-foreground ml-2">Chave / Protocolo <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <Input required type="number" placeholder="Somente Números" value={formData.access_key} onChange={e => setFormData(p => ({ ...p, access_key: e.target.value }))} className="h-14 font-bold text-center tracking-widest bg-slate-50 border-none rounded-2xl shadow-soft" />
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-amber-500" />
                  </div>
                </div>

                <div className="space-y-3 relative lg:col-span-2">
                  <Label className="uppercase text-[10px] font-black tracking-widest text-red-500 ml-4 flex items-center gap-2 font-space"><AlertTriangle className="h-4 w-4"/> Classificação de Prioridade</Label>
                  <div className="relative">
                    <select value={formData.priority} onChange={e => setFormData(p => ({ ...p, priority: e.target.value }))} className="w-full appearance-none bg-red-50/30 border-2 border-red-100 px-6 h-16 rounded-[1.5rem] text-sm font-black shadow-sm focus:outline-none focus:ring-4 focus:ring-red-500/10 text-red-600 uppercase transition-all cursor-pointer">
                       <option value="Sem Prioridade">ATENDIMENTO NORMAL (Sem Prioridade)</option>
                       <option value="Idoso (+60)">Idoso (+60)</option>
                       <option value="Gestante / Lactante">Gestante / Lactante</option>
                       <option value="PcD">Pessoa com Deficiência (PcD)</option>
                       <option value="Autismo (TEA)">Autismo (TEA)</option>
                       <option value="Criança de Colo">Criança de Colo</option>
                    </select>
                    <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 h-6 w-6 text-red-400" />
                  </div>
                </div>
                
                <div className="space-y-3 relative lg:col-span-1">
                  <Label className="uppercase text-[10px] font-black tracking-widest text-muted-foreground ml-2 flex items-center gap-2"><Users className="h-3 w-3" /> Responsável</Label>
                  <Input required readOnly value={formData.receptionist_name} className="h-14 font-black uppercase bg-slate-100 border-none rounded-2xl shadow-inner text-slate-400 text-xs px-6 cursor-not-allowed" />
                </div>

              </div>
              
              <DialogFooter className="pt-8 border-t border-slate-50 flex gap-4">
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="rounded-2xl px-10 h-16 font-bold text-slate-400 hover:bg-slate-50">Fechar</Button>
                <Button type="submit" className="rounded-2xl px-12 h-16 bg-gradient-to-r from-emerald-700 to-emerald-600 text-white font-black uppercase tracking-widest text-sm shadow-xl shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:opacity-90 transition-all active:scale-95 gap-4">
                  <Save className="h-6 w-6" /> Liberar para Fila de Exame
                </Button>
              </DialogFooter>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
