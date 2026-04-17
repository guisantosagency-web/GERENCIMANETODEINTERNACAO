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
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000 relative pb-32">
      {/* HEADER COMMAND SECTION */}
      <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-sm border border-slate-100 relative overflow-hidden">
        <div className="flex flex-col xl:grid xl:grid-cols-12 items-center gap-10">
          <div className="xl:col-span-4 flex items-center gap-6 w-full">
            <div className="p-4 bg-teal-50 text-teal-600 rounded-xl shadow-sm border border-teal-100">
              <Users className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-space uppercase tracking-tight text-slate-800 leading-tight">Base de Pacientes</h1>
              <div className="flex items-center gap-2 mt-1">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Sincronização Ativa • {patients.length} Registros</p>
              </div>
            </div>
          </div>

          <div className="xl:col-span-8 flex flex-col md:flex-row items-stretch md:items-center gap-4 w-full justify-end">
            <div className="relative group min-w-[300px] flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-teal-500 transition-colors" />
              <Input
                placeholder="PROCURAR POR NOME, CPF OU CARTÃO SUS..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="h-12 pl-12 pr-4 bg-slate-50 border-slate-200 rounded-xl text-xs font-semibold uppercase text-slate-700 placeholder:text-slate-400 transition-all focus:border-teal-400 shadow-sm w-full outline-none"
              />
            </div>
            <Button 
              onClick={loadData} 
              disabled={isLoading}
              className="h-12 px-8 rounded-xl bg-teal-50 text-teal-600 border border-teal-200 hover:bg-teal-500 hover:text-white transition-all duration-300 font-bold uppercase text-[11px] tracking-wider gap-3 shadow-none focus:ring-0"
            >
              <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
              ATUALIZAR
            </Button>
          </div>
        </div>
      </div>

      {/* PATIENTS DATA GRID */}
      <div className="space-y-4">
        {isLoading && patients.length === 0 ? (
          <div className="py-40 flex flex-col items-center justify-center gap-6">
            <Loader2 className="h-12 w-12 text-teal-500 animate-spin" />
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 animate-pulse">Consultando Master Patients...</p>
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="py-40 bg-white rounded-3xl flex flex-col items-center justify-center text-center opacity-80 border border-slate-100 shadow-sm">
            <div className="w-24 h-24 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mb-6 overflow-hidden relative">
               <Search className="h-10 w-10 text-slate-300 relative z-10" />
            </div>
            <h3 className="text-xl font-bold font-space uppercase tracking-wider text-slate-500">Nenhum Resultado</h3>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-3 max-w-sm">Refine seus parâmetros de busca no terminal.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredPatients.map((p) => {
              const isSisreg = sisregMap[p.sus] || (p.cpf && sisregMap[p.cpf])
              return (
                <div key={p.id} className="card-health p-5 lg:p-6 bg-white rounded-2xl relative group border border-slate-200 hover:border-teal-300 transition-all duration-300 overflow-hidden shadow-sm hover:shadow-md">
                   <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:opacity-[0.04] group-hover:scale-110 transition-all text-slate-800 pointer-events-none">
                      <UserCircle className="h-40 w-40" />
                   </div>

                   <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                      <div className="flex items-center gap-6">
                         <div className={`h-14 w-14 rounded-xl flex flex-col items-center justify-center shadow-sm transition-all border shrink-0 ${isSisreg ? 'bg-teal-50 text-teal-600 border-teal-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                            {isSisreg ? <Globe className="h-5 w-5 mb-0.5" /> : <User className="h-5 w-5 mb-0.5" />}
                            <span className="text-[7px] font-bold tracking-widest uppercase">{isSisreg ? 'SISREG' : 'LOCAL'}</span>
                         </div>
                         
                         <div className="space-y-2">
                            <h4 className="text-sm font-bold text-slate-800 uppercase tracking-tight group-hover:text-teal-600 transition-colors leading-tight">{p.full_name}</h4>
                            <div className="flex flex-wrap items-center gap-4">
                               <div className="flex items-center gap-2">
                                  <CalendarDays className="h-3 w-3 text-emerald-500" />
                                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider leading-none">
                                    {p.data_nascimento ? format(new Date(p.data_nascimento + 'T00:00:00'), 'dd/MM/yyyy') : "NASC. NÃO IDENTIFICADO"}
                                  </span>
                               </div>
                               <div className="flex items-center gap-2">
                                  <MapPin className="h-3 w-3 text-orange-400" />
                                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider leading-none">
                                    {p.municipio || "SÃO LUÍS"} • {p.estado || "MA"}
                                  </span>
                               </div>
                            </div>
                         </div>
                      </div>

                      <div className="flex flex-col md:flex-row items-center gap-6 lg:gap-12 shrink-0">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full md:w-auto">
                            <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg transition-all group-hover:border-teal-200 w-[200px]">
                               <CreditCard className="h-4 w-4 text-teal-500 shrink-0" />
                               <div className="flex flex-col">
                                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">CPF</span>
                                  <span className="text-[10px] font-bold text-slate-700 tracking-wider truncate">{p.cpf || "--- . --- . --- - --"}</span>
                               </div>
                            </div>
                            <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg transition-all group-hover:border-emerald-200 w-[200px]">
                               <ClipboardList className="h-4 w-4 text-emerald-500 shrink-0" />
                               <div className="flex flex-col">
                                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Cartão SUS</span>
                                  <span className="text-[10px] font-bold text-slate-700 tracking-wider truncate">{p.sus || "--- ---- ---- ----"}</span>
                               </div>
                            </div>
                         </div>

                         <div className="flex items-center gap-2">
                            <Button
                              onClick={() => handleEdit(p)}
                              className="h-10 w-10 text-slate-500 bg-white border border-slate-200 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 transition-all duration-300 shadow-sm p-0 flex items-center justify-center rounded-lg"
                              title="Editar Paciente"
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button
                              onClick={() => handleDelete(p.id, p.full_name)}
                              className="h-10 w-10 text-slate-500 bg-white border border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all duration-300 shadow-sm p-0 flex items-center justify-center rounded-lg"
                              title="Excluir Paciente"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                         </div>
                      </div>
                   </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* MODAL DE EDIÇÃO LIGHT */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-3xl p-0 border-none bg-transparent shadow-none">
          <div className="bg-white rounded-3xl p-8 lg:p-10 border border-slate-100 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300">
            
            <DialogHeader className="mb-10">
              <div className="flex items-center gap-6">
                <div className="p-4 bg-teal-50 text-teal-600 rounded-2xl border border-teal-100 shadow-sm">
                  <UserCircle className="h-8 w-8" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-bold font-space uppercase tracking-tight text-slate-800 leading-tight">Configuração Dossiê</DialogTitle>
                  <DialogDescription className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">ID Sistema Core: {selectedPatient?.id}</DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mb-10">
              <div className="md:col-span-2 space-y-2">
                <Label className="uppercase text-[9px] font-bold tracking-wider text-slate-500 ml-2">Nome Completo do Paciente</Label>
                <div className="relative group">
                  <Input 
                    value={selectedPatient?.full_name} 
                    onChange={e => setSelectedPatient({ ...selectedPatient, full_name: e.target.value.toUpperCase() })}
                    className="h-12 pl-4 bg-slate-50 border-slate-200 rounded-xl text-xs font-bold text-slate-700 uppercase focus:border-teal-400 transition-all outline-none"
                  />
                  <User className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-teal-500" />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="uppercase text-[9px] font-bold tracking-wider text-slate-500 ml-2">Documento CPF</Label>
                <Input 
                  value={selectedPatient?.cpf} 
                  onChange={e => setSelectedPatient({ ...selectedPatient, cpf: e.target.value })}
                  className="h-12 px-4 bg-slate-50 border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:border-teal-400 transition-all outline-none"
                />
              </div>

              <div className="space-y-2">
                <Label className="uppercase text-[9px] font-bold tracking-wider text-slate-500 ml-2">Cartão Nacional SUS</Label>
                <Input 
                  value={selectedPatient?.sus} 
                  onChange={e => setSelectedPatient({ ...selectedPatient, sus: e.target.value })}
                  className="h-12 px-4 bg-slate-50 border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:border-teal-400 transition-all outline-none"
                />
              </div>

              <div className="space-y-2">
                <Label className="uppercase text-[9px] font-bold tracking-wider text-slate-500 ml-2">Data de Nascimento</Label>
                <Input 
                  type="date"
                  value={selectedPatient?.data_nascimento} 
                  onChange={e => setSelectedPatient({ ...selectedPatient, data_nascimento: e.target.value })}
                  className="h-12 px-4 bg-slate-50 border-slate-200 rounded-xl text-xs font-bold text-slate-700 uppercase focus:border-teal-400 transition-all outline-none"
                />
              </div>

              <div className="space-y-2">
                <Label className="uppercase text-[9px] font-bold tracking-wider text-slate-500 ml-2">Município de Residência</Label>
                <Input 
                  value={selectedPatient?.municipio} 
                  onChange={e => setSelectedPatient({ ...selectedPatient, municipio: e.target.value.toUpperCase() })}
                  className="h-12 px-4 bg-slate-50 border-slate-200 rounded-xl text-xs font-bold text-slate-700 uppercase focus:border-teal-400 transition-all outline-none"
                />
              </div>
            </div>

            <DialogFooter className="pt-6 border-t border-slate-100 flex items-center justify-between w-full">
               <Button 
                 variant="ghost" 
                 onClick={() => setIsEditing(false)}
                 className="h-12 px-6 rounded-xl font-bold uppercase text-[10px] tracking-wider text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-all"
               >
                 Descartar Alterações
               </Button>
               
               <Button 
                 onClick={savePatient} 
                 disabled={isSaving}
                 className="h-12 px-8 rounded-xl bg-teal-500 text-white font-bold uppercase tracking-wider text-[11px] shadow-sm hover:bg-teal-600 transition-all duration-300"
               >
                 {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                   <>
                     <Save className="h-4 w-4 mr-2" />
                     Salvar Dossiê
                   </>
                 )}
               </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
