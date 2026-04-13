"use client"
import { useState, useEffect, useMemo } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { 
  Users, Search, Edit3, Trash2, RefreshCw, Loader2, 
  UserCircle, CreditCard, ClipboardList, MapPin, 
  CalendarDays, Globe, User, Save, X
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth-context"
import { format } from "date-fns"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"

export default function PacientesTab() {
  const [patients, setPatients] = useState<any[]>([])
  const [examAppointments, setExamAppointments] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState<any>(null)
  const [isSaving, setIsSaving] = useState(false)

  const { user } = useAuth()
  const supabase = useMemo(() => createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!), [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      // 1. Carregar todos os pacientes do cadastro mestre
      const { data: mPatients, error: pError } = await supabase
        .from("master_patients")
        .select("*")
        .order("full_name")
      
      if (pError) throw pError

      // 2. Carregar agendamentos de exames para identificar quem é SISREG
      const { data: appointments, error: aError } = await supabase
        .from("exam_appointments")
        .select("sus, cpf, chave_sisreg")
      
      if (aError) throw aError

      setPatients(mPatients || [])
      setExamAppointments(appointments || [])
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const sisregMap = useMemo(() => {
    const map: Record<string, boolean> = {}
    examAppointments.forEach(a => {
      if (a.chave_sisreg) {
        if (a.sus) map[a.sus] = true
        if (a.cpf) map[a.cpf] = true
      }
    })
    return map
  }, [examAppointments])

  const filteredPatients = useMemo(() => {
    if (!searchTerm) return patients
    const s = searchTerm.toUpperCase()
    return patients.filter(p => 
      p.full_name?.toUpperCase().includes(s) || 
      p.cpf?.includes(s) || 
      p.sus?.includes(s)
    )
  }, [patients, searchTerm])

  const handleEdit = (patient: any) => {
    setSelectedPatient({ ...patient })
    setIsEditing(true)
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Deseja realmente excluir o paciente ${name}? Esta ação não pode ser desfeita e removerá o vínculo em outros módulos.`)) return
    
    setIsLoading(true)
    try {
      const { error } = await supabase.from("master_patients").delete().eq("id", id)
      if (error) throw error
      alert("Paciente removido com sucesso.")
      loadData()
    } catch (e: any) {
      alert(`Erro ao excluir: ${e.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const savePatient = async () => {
    if (!selectedPatient) return
    setIsSaving(true)
    try {
      const oldPatient = patients.find(p => p.id === selectedPatient.id)
      
      // 1. Atualizar no Master Patients
      const { error: pError } = await supabase
        .from("master_patients")
        .update({
          full_name: selectedPatient.full_name.toUpperCase(),
          cpf: selectedPatient.cpf || null,
          sus: selectedPatient.sus || null,
          data_nascimento: selectedPatient.data_nascimento || null,
          estado: selectedPatient.estado || "MA",
          municipio: selectedPatient.municipio || null,
          ultima_atualizacao_em: new Date().toISOString()
        })
        .eq("id", selectedPatient.id)

      if (pError) throw pError

      // 2. Sincronizar com Exam Appointments (Onde o paciente estiver presente)
      // O usuário solicitou: "alterando esses dados, todos os dados onde ele esta presente ou sendo mostrado, também é alterado"
      const updateData: any = {
        patient_name: selectedPatient.full_name.toUpperCase(),
        cpf: selectedPatient.cpf || null,
        sus: selectedPatient.sus || null,
        municipio: selectedPatient.municipio || null,
        estado: selectedPatient.estado || "MA"
      }

      // Atualiza agendamentos de exames usando CPF ou SUS antigo para localizar
      const { error: aError } = await supabase
        .from("exam_appointments")
        .update(updateData)
        .or(`cpf.eq.${oldPatient.cpf || 'none'},sus.eq.${oldPatient.sus || 'none'}`)

      if (aError) console.error("Erro ao sincronizar agendamentos:", aError)

      alert("Paciente e registros vinculados atualizados com sucesso!")
      setIsEditing(false)
      loadData()
    } catch (e: any) {
      alert(`Erro ao salvar: ${e.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6 pb-10 animate-in fade-in duration-500 max-w-[1600px] mx-auto">
      
      {/* HEADER SECTION */}
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-cyan-600/5 rounded-[2.5rem] blur-xl" />
        <div className="glass-card bg-white/70 backdrop-blur-xl border border-white/40 rounded-[2.5rem] p-8 shadow-sm relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500 blur-lg opacity-20 animate-pulse" />
                <div className="h-16 w-16 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-3xl flex items-center justify-center text-white shadow-xl relative">
                  <Users className="h-8 w-8" />
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-black font-space uppercase tracking-tight text-slate-800">Cadastro de Pacientes</h1>
                <div className="flex items-center gap-3 mt-1.5">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Gerenciamento Unificado de Exames</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <div className="relative group/search min-w-[300px]">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-hover/search:text-blue-500 transition-colors" />
                <Input 
                  placeholder="BUSCAR NOME, CPF OU SUS..." 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="h-14 pl-14 pr-6 bg-white border-slate-200 rounded-2xl text-sm font-bold shadow-sm focus:ring-blue-500/20 transition-all uppercase"
                />
              </div>
              <Button onClick={loadData} variant="ghost" className="h-14 px-8 rounded-2xl bg-slate-50 text-slate-600 hover:bg-white hover:text-blue-600 border border-slate-100 font-black text-xs uppercase tracking-widest gap-3">
                <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
                Sincronizar
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* PATIENTS TABLE */}
      <div className="glass-card bg-white/40 border-none rounded-[3rem] p-4 lg:p-8 shadow-sm">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-separate border-spacing-y-3">
            <thead>
              <tr className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                <th className="px-8 py-4">Status</th>
                <th className="px-8 py-4">Paciente</th>
                <th className="px-8 py-4">Documentação</th>
                <th className="px-8 py-4">Localização</th>
                <th className="px-8 py-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && patients.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-32 text-center text-slate-400 font-bold uppercase tracking-widest animate-pulse">
                    <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4" />
                    Carregando Pacientes...
                  </td>
                </tr>
              ) : filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-32 text-center text-slate-400 font-bold uppercase tracking-widest opacity-50">
                    <Search className="h-16 w-16 mx-auto mb-4 opacity-10" />
                    Nenhum paciente encontrado
                  </td>
                </tr>
              ) : filteredPatients.map((p) => {
                const isSisreg = sisregMap[p.sus] || (p.cpf && sisregMap[p.cpf])
                return (
                  <tr key={p.id} className="bg-white group rounded-[2rem] shadow-sm hover:shadow-md transition-all border border-transparent hover:border-blue-100">
                    <td className="px-8 py-6 rounded-l-[2rem]">
                      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border font-black text-[9px] uppercase tracking-widest ${isSisreg ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                        {isSisreg ? <Globe className="h-3 w-3" /> : <User className="h-3 w-3" />}
                        {isSisreg ? "SISREG" : "MANUAL"}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="space-y-1">
                        <p className="font-black text-slate-800 uppercase tracking-tight">{p.full_name}</p>
                        <div className="flex items-center gap-3 text-[10px] text-slate-400 font-bold uppercase">
                          <CalendarDays className="h-3 w-3" />
                          {p.data_nascimento ? format(new Date(p.data_nascimento + 'T00:00:00'), 'dd/MM/yyyy') : "NASC. NÃO INF."}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-600">
                           <CreditCard className="h-3.5 w-3.5 text-blue-500" />
                           CPF: {p.cpf || "---"}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-600">
                           <ClipboardList className="h-3.5 w-3.5 text-emerald-500" />
                           SUS: {p.sus || "---"}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-wide">
                        <MapPin className="h-3.5 w-3.5 text-rose-400" />
                        {p.municipio || "São Luís"} / {p.estado || "MA"}
                      </div>
                    </td>
                    <td className="px-8 py-6 rounded-r-[2rem]">
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          onClick={() => handleEdit(p)}
                          variant="ghost" 
                          className="h-11 w-11 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm shadow-blue-500/10"
                        >
                          <Edit3 className="h-4.5 w-4.5" />
                        </Button>
                        <Button 
                          onClick={() => handleDelete(p.id, p.full_name)}
                          variant="ghost" 
                          className="h-11 w-11 rounded-xl bg-slate-50 text-slate-400 hover:bg-red-500 hover:text-white transition-all border border-slate-100/50"
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* EDIT MODAL */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-2xl rounded-[3rem] p-8 border-none bg-white shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-3xl font-black font-space uppercase tracking-tight text-slate-800 flex items-center gap-4">
               <div className="p-4 bg-blue-100 text-blue-600 rounded-2xl">
                  <UserCircle className="h-7 w-7" />
               </div>
               Editar Paciente
            </DialogTitle>
            <DialogDescription className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-2 ml-1">
              Atualize as informações cadastrais do paciente
            </DialogDescription>
          </DialogHeader>

          {selectedPatient && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6">
              <div className="md:col-span-2 space-y-2">
                <Label className="uppercase text-[9px] font-black tracking-widest text-slate-400 ml-4">Nome Completo</Label>
                <Input 
                  value={selectedPatient.full_name} 
                  onChange={e => setSelectedPatient({...selectedPatient, full_name: e.target.value})}
                  className="h-14 bg-slate-50 border-none rounded-2xl text-sm font-black uppercase px-6"
                />
              </div>

              <div className="space-y-2">
                <Label className="uppercase text-[9px] font-black tracking-widest text-slate-400 ml-4">CPF</Label>
                <Input 
                  value={selectedPatient.cpf || ""} 
                  onChange={e => setSelectedPatient({...selectedPatient, cpf: e.target.value})}
                  className="h-14 bg-slate-50 border-none rounded-2xl text-sm font-black text-center px-6"
                />
              </div>

              <div className="space-y-2">
                <Label className="uppercase text-[9px] font-black tracking-widest text-slate-400 ml-4">Cartão SUS</Label>
                <Input 
                  value={selectedPatient.sus || ""} 
                  onChange={e => setSelectedPatient({...selectedPatient, sus: e.target.value})}
                  className="h-14 bg-slate-50 border-none rounded-2xl text-sm font-black text-center px-6"
                />
              </div>

              <div className="space-y-2">
                <Label className="uppercase text-[9px] font-black tracking-widest text-slate-400 ml-4">Data de Nascimento</Label>
                <Input 
                  type="date"
                  value={selectedPatient.data_nascimento || ""} 
                  onChange={e => setSelectedPatient({...selectedPatient, data_nascimento: e.target.value})}
                  className="h-14 bg-slate-50 border-none rounded-2xl text-sm font-black px-6"
                />
              </div>

              <div className="space-y-2">
                <Label className="uppercase text-[9px] font-black tracking-widest text-slate-400 ml-4">Município</Label>
                <Input 
                  value={selectedPatient.municipio || ""} 
                  onChange={e => setSelectedPatient({...selectedPatient, municipio: e.target.value})}
                  className="h-14 bg-slate-50 border-none rounded-2xl text-sm font-black uppercase px-6"
                />
              </div>

              <div className="space-y-2">
                <Label className="uppercase text-[9px] font-black tracking-widest text-slate-400 ml-4">Estado (UF)</Label>
                <Input 
                  maxLength={2}
                  value={selectedPatient.estado || ""} 
                  onChange={e => setSelectedPatient({...selectedPatient, estado: e.target.value.toUpperCase()})}
                  className="h-14 bg-slate-50 border-none rounded-2xl text-sm font-black text-center px-6"
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-4">
             <Button 
               variant="ghost" 
               onClick={() => setIsEditing(false)}
               className="h-14 px-10 rounded-[1.5rem] bg-slate-50 text-slate-500 font-black uppercase text-[10px] tracking-widest border border-slate-100"
             >
                Cancelar
             </Button>
             <Button 
               onClick={savePatient}
               disabled={isSaving}
               className="h-14 px-10 rounded-[1.5rem] bg-blue-600 hover:bg-black text-white font-black uppercase text-[10px] tracking-widest gap-2"
             >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Salvar Alterações
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
