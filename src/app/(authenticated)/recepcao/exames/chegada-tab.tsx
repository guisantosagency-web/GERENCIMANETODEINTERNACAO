"use client"
import { useState, useEffect, useMemo } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { List, CheckSquare, Clock, MapPin, Key, AlertTriangle, User, Loader2, Save, Users, Trash } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { differenceInYears, parseISO, format } from "date-fns"
import { useAuth } from "@/lib/auth-context"

type IbgeEstado = { id: number, sigla: string, nome: string }
type IbgeMunicipio = { id: number, nome: string }

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
      // Load Origins
      const { data: orgData } = await supabase.from("exam_origins").select("*").order("name")
      if (orgData) setOrigins(orgData)

      // Load Agendados
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

      // Create new origin if selected "NOVO"
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

      // UPSERT PACIENTE PERSISTENTE
      // Salva ou atualiza os dados do paciente para uso futuro
      await supabase.from("patients").upsert({
        paciente: selectedAppt.patient_name,
        cpf: selectedAppt.cpf,
        sus: selectedAppt.sus,
        data_nascimento: formData.birth_date,
        cidade_origem: formData.city,
        estado: formData.state,
        telefone: "", // Caso queira coletar no futuro
        updated_at: new Date().toISOString()
      }, { onConflict: "cpf" }) // Ou SUS se CPF for vazio, mas aqui vamos usar CPF como chave principal se existir

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
      <div className="glass-card !bg-card/40 border-none rounded-[2.5rem] p-6 lg:p-8 shadow-sm">
        <h2 className="text-2xl font-black font-space uppercase tracking-tight mb-8 flex items-center gap-3">
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl"><List className="h-6 w-6" /></div>
          Pacientes Agendados
        </h2>

        {isLoading ? (
           <div className="h-64 flex items-center justify-center">
             <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
           </div>
        ) : appointments.length === 0 ? (
           <div className="h-64 flex flex-col items-center justify-center opacity-40">
             <List className="h-12 w-12 mb-4" />
             <p className="font-space font-bold tracking-widest uppercase">Nenhum agendamento pendente.</p>
           </div>
        ) : (
           <div className="overflow-x-auto rounded-3xl border border-white/5 bg-background/30 backdrop-blur-md">
             <table className="w-full text-left text-sm whitespace-nowrap">
               <thead className="bg-muted/50 font-bold uppercase tracking-wider text-xs border-b border-border/10">
                 <tr>
                   <th className="p-4 px-6">Data / Hora</th>
                   <th className="p-4">Paciente</th>
                   <th className="p-4">Documento</th>
                   <th className="p-4">Procedimento / Tipo</th>
                   <th className="p-4 font-black text-right pr-6">Ações</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-border/5">
                 {appointments.map(a => (
                   <tr key={a.id} className="hover:bg-muted/30 transition-colors group">
                     <td className="p-4 px-6 text-muted-foreground font-bold">
                       {format(new Date(a.exam_date + 'T00:00:00'), 'dd/MM')} <span className="text-emerald-500 ml-2">{a.exam_time}</span>
                     </td>
                     <td className="p-4 font-black uppercase text-foreground">{a.patient_name}</td>
                     <td className="p-4 font-bold text-muted-foreground">{a.cpf || a.sus}</td>
                     <td className="p-4 font-bold">
                       <span className="text-primary">{a.procedure_name}</span>
                       <span className="text-[10px] ml-2 px-2 py-0.5 rounded-full bg-border text-foreground">{a.exam_type}</span>
                     </td>
                     <td className="p-4 text-right pr-6 flex items-center justify-end gap-2">
                       <Button onClick={() => handleOpenModal(a)} className="rounded-xl shadow-premium gap-2 bg-gradient-to-r from-emerald-600 to-emerald-400 hover:opacity-90 transition-all font-bold">
                         <CheckSquare className="h-4 w-4" /> Registrar Chegada
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
                            className="text-red-500 hover:bg-red-500/10 rounded-xl"
                         >
                           <Trash className="h-4 w-4" />
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
        <DialogContent className="max-w-2xl bg-card/95 backdrop-blur-3xl border-white/10 shadow-premium">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-2xl font-black font-space uppercase tracking-tight">
               <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl"><CheckSquare className="h-6 w-6" /></div>
               Completar Dados de Chegada
            </DialogTitle>
            <DialogDescription className="font-bold text-muted-foreground">
               Paciente: <span className="text-emerald-500 uppercase">{selectedAppt?.patient_name}</span>
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div className="space-y-2 relative">
                <Label className="uppercase text-xs font-black tracking-widest text-muted-foreground flex justify-between">
                  <span>Origem <span className="text-red-500">*</span></span>
                </Label>
                <div className="flex gap-2">
                   <select required value={formData.origin_id} onChange={e => setFormData(p => ({ ...p, origin_id: e.target.value }))} className="flex-1 appearance-none bg-background border border-border px-4 pl-10 h-12 rounded-xl text-sm font-bold shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer">
                      {origins.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                      <option value="NOVO" className="font-black text-emerald-500">+ CADASTRAR NOVA ORIGEM</option>
                   </select>
                   <MapPin className="absolute left-3 top-9 h-4 w-4 text-emerald-500" />
                   {formData.origin_id && formData.origin_id !== "NOVO" && (
                      <Button type="button" variant="destructive" size="icon" className="h-12 w-12 rounded-xl" onClick={(e) => handleDeleteOrigin(e, formData.origin_id)}>
                         <Trash className="h-4 w-4" />
                      </Button>
                   )}
                </div>
              </div>

              {formData.origin_id === "NOVO" && (
                <div className="space-y-2 relative animate-in zoom-in-95 duration-300">
                  <Label className="uppercase text-xs font-black tracking-widest text-emerald-500">Nome da Nova Origem</Label>
                  <Input required placeholder="Ex: SECRETARIA SAÚDE" value={formData.new_origin_name} onChange={e => setFormData(p => ({ ...p, new_origin_name: e.target.value }))} className="h-12 font-bold uppercase bg-background shadow-inner" />
                </div>
              )}

              <div className="space-y-2 relative">
                <Label className="uppercase text-xs font-black tracking-widest text-muted-foreground">Data Nasc. <span className="text-red-500">*</span></Label>
                <div className="flex items-center gap-3">
                   <Input type="date" required value={formData.birth_date} onChange={e => setFormData(p => ({ ...p, birth_date: e.target.value }))} className="flex-1 h-12 font-bold bg-background shadow-inner text-center" />
                   <div className="h-12 w-24 rounded-xl bg-muted/50 border border-white/5 flex items-center justify-center font-black text-emerald-500 font-space shadow-indicator shrink-0">
                      {calculatedAge} anos
                   </div>
                </div>
              </div>

              <div className="space-y-2 relative">
                <Label className="uppercase text-xs font-black tracking-widest text-muted-foreground">Estado (UF) <span className="text-red-500">*</span></Label>
                <select required value={formData.state} onChange={e => setFormData(p => ({ ...p, state: e.target.value, city: "" }))} className="w-full appearance-none bg-background border border-border px-4 h-12 rounded-xl text-sm font-bold shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                   <option value="">Selecione...</option>
                   {estados.map(e => <option key={e.sigla} value={e.sigla}>{e.nome}</option>)}
                </select>
              </div>

              <div className="space-y-2 relative">
                <Label className="uppercase text-xs font-black tracking-widest text-muted-foreground">Município de Origem <span className="text-red-500">*</span></Label>
                <select required disabled={!formData.state} value={formData.city} onChange={e => setFormData(p => ({ ...p, city: e.target.value }))} className="w-full appearance-none bg-background border border-border px-4 h-12 rounded-xl text-sm font-bold shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50">
                   <option value="">Selecione Município</option>
                   {municipios.map(m => <option key={m.id} value={m.nome}>{m.nome}</option>)}
                </select>
              </div>

              <div className="space-y-2 relative">
                <Label className="uppercase text-xs font-black tracking-widest text-muted-foreground">Chave de Autorização <span className="text-red-500">*</span></Label>
                <Input required type="number" placeholder="Somente Números" value={formData.access_key} onChange={e => setFormData(p => ({ ...p, access_key: e.target.value }))} className="h-12 font-bold text-center tracking-widest bg-background shadow-inner" />
              </div>

              <div className="space-y-2 relative md:col-span-2 bg-gradient-to-r from-red-500/10 to-transparent p-4 rounded-3xl border border-red-500/20">
                <Label className="uppercase text-xs font-black tracking-widest text-red-500 mb-2 block flex items-center gap-2"><AlertTriangle className="h-4 w-4"/> Atendimento Prioritário</Label>
                <select value={formData.priority} onChange={e => setFormData(p => ({ ...p, priority: e.target.value }))} className="w-full appearance-none bg-background border border-border px-4 h-12 rounded-xl text-sm font-bold shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 text-red-500 uppercase">
                   <option value="Sem Prioridade">Sem Prioridade</option>
                   <option value="Idoso (+60)">Idoso (+60)</option>
                   <option value="Gestante / Lactante">Gestante / Lactante</option>
                   <option value="PcD">Pessoa com Deficiência (PcD)</option>
                   <option value="Autismo (TEA)">Autismo (TEA)</option>
                   <option value="Criança de Colo">Criança de Colo</option>
                </select>
              </div>
              
              <div className="space-y-2 relative md:col-span-2">
                <Label className="uppercase text-xs font-black tracking-widest text-muted-foreground flex items-center gap-2"><Users className="h-4 w-4" /> Recepcionista Responsável</Label>
                <Input required readOnly value={formData.receptionist_name} className="h-12 font-bold uppercase bg-background shadow-inner opacity-60 cursor-not-allowed" />
              </div>

            </div>
            
            <DialogFooter className="pt-4 border-t border-border/10">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="rounded-xl px-6 h-14">Cancelar</Button>
              <Button type="submit" className="rounded-xl px-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold tracking-wide gap-2 h-14">
                <Save className="h-5 w-5" /> Enviar p/ Fila de Espera
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
