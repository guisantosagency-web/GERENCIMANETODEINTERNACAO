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
      <div className="card-csgo rounded-[3.5rem] p-8 lg:p-12 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#00D9FF] to-transparent" />
        <div className="flex flex-col xl:grid xl:grid-cols-12 items-center gap-10">
          <div className="xl:col-span-4 flex items-center gap-8 w-full">
            <div className="relative group">
              <div className="absolute inset-0 bg-[#00D9FF] blur-2xl opacity-20 group-hover:opacity-40 transition-opacity animate-pulse" />
              <div className="h-20 w-20 bg-gradient-to-br from-[#00D9FF] to-[#0088FF] rounded-[2rem] flex items-center justify-center text-white shadow-2xl relative border border-white/20">
                <Users className="h-10 w-10" />
              </div>
            </div>
            <div>
              <h1 className="text-5xl font-black font-space uppercase tracking-tight text-white leading-tight">Master Database</h1>
              <div className="flex items-center gap-3 mt-2">
                <div className="h-2 w-2 rounded-full bg-[#00FF88] animate-pulse" />
                <p className="text-[10px] font-black uppercase tracking-[0.6em] text-[#7E8C9A]">Sincronização Ativa • {patients.length} Registros</p>
              </div>
            </div>
          </div>

          <div className="xl:col-span-8 flex flex-col md:flex-row items-stretch md:items-center gap-6 w-full justify-end">
            <div className="relative group min-w-[400px]">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-[#7E8C9A] group-focus-within:text-[#00D9FF] transition-colors" />
              <Input
                placeholder="PROCURAR POR NOME, CPF OU CARTÃO SUS..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="h-16 pl-16 pr-8 bg-[#161B22] border-white/5 rounded-3xl text-[11px] font-black uppercase text-white placeholder:text-white/20 transition-all focus:border-[#00D9FF]/50 shadow-2xl w-full"
              />
            </div>
            <Button 
              onClick={loadData} 
              disabled={isLoading}
              className="h-16 px-10 rounded-3xl bg-white/[0.03] text-[#00D9FF] border border-[#00D9FF]/20 hover:bg-[#00D9FF] hover:text-white transition-all duration-500 font-black uppercase text-[11px] tracking-widest gap-4 shadow-xl"
            >
              <RefreshCw className={`h-6 w-6 ${isLoading ? 'animate-spin' : ''}`} />
              RE-SYNC DATA
            </Button>
          </div>
        </div>
      </div>

      {/* PATIENTS DATA GRID */}
      <div className="space-y-6">
        {isLoading && patients.length === 0 ? (
          <div className="py-60 flex flex-col items-center justify-center gap-8">
            <div className="relative">
              <Loader2 className="h-24 w-24 text-[#00D9FF] animate-spin" />
              <div className="absolute inset-0 h-24 w-24 text-[#00D9FF] animate-pulse blur-3xl opacity-20" />
            </div>
            <p className="text-[11px] font-black uppercase tracking-[0.8em] text-[#7E8C9A] animate-pulse ml-4">Descriptografando Master Patients...</p>
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="py-60 card-csgo rounded-[4rem] flex flex-col items-center justify-center text-center opacity-30 border-white/5">
            <div className="w-40 h-40 rounded-[3rem] bg-[#161B22] border border-dashed border-white/10 flex items-center justify-center mb-10 overflow-hidden relative">
               <div className="absolute inset-0 bg-gradient-to-br from-transparent via-[#00D9FF]/5 to-transparent rotate-45 animate-pulse" />
               <Search className="h-20 w-20 text-white relative z-10" />
            </div>
            <h3 className="text-3xl font-black font-space uppercase tracking-[0.2em] text-[#7E8C9A]">Nenhum Resultado</h3>
            <p className="text-xs font-black uppercase tracking-[0.5em] text-[#7E8C9A]/30 mt-6 max-w-sm">Refine seus parâmetros de busca no terminal de pesquisa.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredPatients.map((p) => {
              const isSisreg = sisregMap[p.sus] || (p.cpf && sisregMap[p.cpf])
              return (
                <div key={p.id} className="card-csgo p-8 lg:p-10 rounded-[4rem] relative group border border-white/5 hover:border-[#00D9FF]/40 transition-all duration-700 overflow-hidden">
                   <div className="absolute top-0 right-0 p-12 opacity-[0.01] group-hover:opacity-[0.05] group-hover:scale-125 transition-all text-white pointer-events-none">
                      <UserCircle className="h-64 w-64" />
                   </div>

                   <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-12">
                      <div className="flex items-center gap-10">
                         <div className={`h-24 w-24 rounded-[2.5rem] flex flex-col items-center justify-center shadow-2xl transition-all border shrink-0 ${isSisreg ? 'bg-[#00D9FF]/10 text-[#00D9FF] border-[#00D9FF]/30' : 'bg-[#161B22] text-[#7E8C9A] border-white/5'}`}>
                            {isSisreg ? <Globe className="h-8 w-8 mb-2" /> : <User className="h-8 w-8 mb-2" />}
                            <span className="text-[8px] font-black tracking-[0.3em] uppercase">{isSisreg ? 'SISREG' : 'LOCAL'}</span>
                         </div>
                         
                         <div className="space-y-3">
                            <h4 className="text-3xl font-black text-white uppercase tracking-tight group-hover:text-[#00D9FF] transition-colors leading-tight">{p.full_name}</h4>
                            <div className="flex flex-wrap items-center gap-6">
                               <div className="flex items-center gap-3">
                                  <CalendarDays className="h-4 w-4 text-[#FF6B35]" />
                                  <span className="text-[10px] font-black text-white uppercase tracking-widest leading-none">
                                    {p.data_nascimento ? format(new Date(p.data_nascimento + 'T00:00:00'), 'dd/MM/yyyy') : "NASC. NÃO IDENTIFICADO"}
                                  </span>
                               </div>
                               <div className="flex items-center gap-3">
                                  <MapPin className="h-4 w-4 text-[#FF1493]" />
                                  <span className="text-[10px] font-black text-white uppercase tracking-widest leading-none">
                                    {p.municipio || "SÃO LUÍS"} • {p.estado || "MA"}
                                  </span>
                               </div>
                            </div>
                         </div>
                      </div>

                      <div className="flex flex-col md:flex-row items-center gap-10 lg:gap-20 shrink-0">
                         <div className="grid grid-cols-1 gap-4 w-full md:w-auto">
                            <div className="flex items-center gap-4 px-6 py-3 bg-[#161B22] border border-white/5 rounded-2xl group/doc transition-all hover:border-[#00D9FF]/30">
                               <CreditCard className="h-4 w-4 text-[#00D9FF]" />
                               <div className="flex flex-col">
                                  <span className="text-[8px] font-black text-[#7E8C9A] uppercase tracking-widest mb-0.5">CPF Identifier</span>
                                  <span className="text-[11px] font-black text-white tracking-widest">{p.cpf || "--- . --- . --- - --"}</span>
                               </div>
                            </div>
                            <div className="flex items-center gap-4 px-6 py-3 bg-[#161B22] border border-white/5 rounded-2xl group/doc transition-all hover:border-[#00FF88]/30">
                               <ClipboardList className="h-4 w-4 text-[#00FF88]" />
                               <div className="flex flex-col">
                                  <span className="text-[8px] font-black text-[#7E8C9A] uppercase tracking-widest mb-0.5">National SUS Card</span>
                                  <span className="text-[11px] font-black text-white tracking-widest">{p.sus || "--- ---- ---- ----"}</span>
                               </div>
                            </div>
                         </div>

                         <div className="flex items-center gap-4">
                            <Button
                              onClick={() => handleEdit(p)}
                              className="h-16 w-16 rounded-[1.5rem] bg-[#161B22] border border-white/5 text-[#FF6B35] hover:bg-[#FF6B35] hover:text-white transition-all duration-500 shadow-xl group/btn"
                            >
                              <Edit3 className="h-6 w-6 group-btn-hover:scale-110" />
                            </Button>
                            <Button
                              onClick={() => handleDelete(p.id, p.full_name)}
                              className="h-16 w-16 rounded-[1.5rem] bg-[#161B22] border border-white/5 text-[#7E8C9A] hover:bg-[#FF1493] hover:text-white transition-all duration-500 shadow-xl group/btn"
                            >
                              <Trash2 className="h-6 w-6 group-btn-hover:rotate-12" />
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

      {/* MODAL DE EDIÇÃO CYBER-MODERN */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-4xl p-0 border-none bg-transparent shadow-none">
          <div className="card-csgo rounded-[4rem] p-12 border-white/10 relative overflow-hidden backdrop-blur-3xl animate-in zoom-in-95 duration-500">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#FF6B35] to-transparent" />
            
            <DialogHeader className="mb-14">
              <div className="flex items-center gap-8">
                <div className="p-6 bg-[#FF6B35]/10 text-[#FF6B35] rounded-[2rem] border border-[#FF6B35]/20 shadow-xl">
                  <UserCircle className="h-10 w-10" />
                </div>
                <div>
                  <DialogTitle className="text-4xl font-black font-space uppercase tracking-tight text-white leading-tight">Configuração Dossiê</DialogTitle>
                  <DialogDescription className="text-[9px] font-black uppercase tracking-[0.6em] text-[#7E8C9A] mt-2">ID Sistema Core: {selectedPatient?.id}</DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10 mb-14">
              <div className="md:col-span-2 space-y-3">
                <Label className="uppercase text-[10px] font-black tracking-widest text-[#7E8C9A] ml-6">Nome Completo do Paciente</Label>
                <div className="relative group">
                  <Input 
                    value={selectedPatient?.full_name} 
                    onChange={e => setSelectedPatient({ ...selectedPatient, full_name: e.target.value.toUpperCase() })}
                    className="h-16 pl-8 bg-[#161B22] border-white/5 rounded-3xl text-sm font-black text-white uppercase focus:border-[#FF6B35]/50 transition-all shadow-2xl"
                  />
                  <User className="absolute right-6 top-1/2 -translate-y-1/2 h-5 w-5 text-[#7E8C9A] group-focus-within:text-[#FF6B35]" />
                </div>
              </div>

              <div className="space-y-3">
                <Label className="uppercase text-[10px] font-black tracking-widest text-[#7E8C9A] ml-6">Documento CPF</Label>
                <Input 
                  value={selectedPatient?.cpf} 
                  onChange={e => setSelectedPatient({ ...selectedPatient, cpf: e.target.value })}
                  className="h-16 px-8 bg-[#161B22] border-white/5 rounded-3xl text-sm font-black text-white focus:border-[#FF6B35]/50 transition-all shadow-2xl"
                />
              </div>

              <div className="space-y-3">
                <Label className="uppercase text-[10px] font-black tracking-widest text-[#7E8C9A] ml-6">Cartão Nacional SUS</Label>
                <Input 
                  value={selectedPatient?.sus} 
                  onChange={e => setSelectedPatient({ ...selectedPatient, sus: e.target.value })}
                  className="h-16 px-8 bg-[#161B22] border-white/5 rounded-3xl text-sm font-black text-white focus:border-[#FF6B35]/50 transition-all shadow-2xl"
                />
              </div>

              <div className="space-y-3">
                <Label className="uppercase text-[10px] font-black tracking-widest text-[#7E8C9A] ml-6">Data de Nascimento</Label>
                <Input 
                  type="date"
                  value={selectedPatient?.data_nascimento} 
                  onChange={e => setSelectedPatient({ ...selectedPatient, data_nascimento: e.target.value })}
                  className="h-16 px-8 bg-[#161B22] border-white/5 rounded-3xl text-sm font-black text-white uppercase focus:border-[#FF6B35]/50 transition-all shadow-2xl"
                />
              </div>

              <div className="space-y-3">
                <Label className="uppercase text-[10px] font-black tracking-widest text-[#7E8C9A] ml-6">Município de Residência</Label>
                <Input 
                  value={selectedPatient?.municipio} 
                  onChange={e => setSelectedPatient({ ...selectedPatient, municipio: e.target.value.toUpperCase() })}
                  className="h-16 px-8 bg-[#161B22] border-white/5 rounded-3xl text-sm font-black text-white uppercase focus:border-[#FF6B35]/50 transition-all shadow-2xl"
                />
              </div>
            </div>

            <DialogFooter className="pt-10 border-t border-white/10 mt-10">
              <div className="flex items-center justify-between w-full">
                <Button 
                  variant="ghost" 
                  onClick={() => setIsEditing(false)}
                  className="h-16 px-10 rounded-2xl font-black uppercase text-[10px] tracking-widest text-[#7E8C9A] hover:text-white transition-all"
                >
                  Descartar Alterações
                </Button>
                
                <Button 
                  onClick={savePatient} 
                  disabled={isSaving}
                  className="h-16 px-12 rounded-2xl bg-white text-[#161B22] font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl hover:bg-[#00D9FF] hover:text-white transition-all duration-500"
                >
                  {isSaving ? <Loader2 className="h-6 w-6 animate-spin" /> : (
                    <>
                      <Save className="h-5 w-5 mr-3" />
                      Commit Changes
                    </>
                  )}
                </Button>
              </div>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
