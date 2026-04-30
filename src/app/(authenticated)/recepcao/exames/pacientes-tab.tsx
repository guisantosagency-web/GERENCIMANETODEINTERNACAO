"use client"
import { useState, useEffect, useMemo, useRef } from "react"
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
import { Sheet, SheetContent } from "@/components/ui/sheet"


export default function PacientesTab() {
  const [patients, setPatients] = useState<any[]>([])
  const [examAppointments, setExamAppointments] = useState<any[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState<any>(null)
  const [isSaving, setIsSaving] = useState(false)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const { user } = useAuth()
  const supabase = useMemo(() => createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!), [])

  const loadData = async (search?: string) => {
    setIsLoading(true)
    try {
      // 1. Contagem total (opcional para feedback visual)
      const { count } = await supabase
        .from("master_patients")
        .select("*", { count: 'exact', head: true })
      
      if (count !== null) setTotalCount(count)

      // 2. Carregar apenas 20 pacientes com filtro opcional
      let query = supabase.from("master_patients").select("*").order("full_name").limit(20)

      if (search && search.trim().length > 0) {
        const s = search.trim()
        query = query.or(`full_name.ilike.%${s}%,cpf.ilike.%${s}%,sus.ilike.%${s}%`)
      }

      const { data: mPatients, error: pError } = await query

      if (pError) throw pError

      // 3. Carregar agendamentos apenas dos pacientes exibidos para identificar SISREG
      // Isso é muito mais eficiente do que carregar a tabela inteira
      if (mPatients && mPatients.length > 0) {
        const patientSus = mPatients.map(p => p.sus).filter(Boolean)
        const patientCpfs = mPatients.map(p => p.cpf).filter(Boolean)

        let apptQuery = supabase
          .from("exam_appointments")
          .select("sus, cpf, chave_sisreg")
          .not("chave_sisreg", "is", null)
        
        // Só faz o filtro se houver CPFs ou SUS
        if (patientSus.length > 0 || patientCpfs.length > 0) {
          const filterParts = []
          if (patientSus.length > 0) filterParts.push(`sus.in.(${patientSus.map(s => `"${s}"`).join(',')})`)
          if (patientCpfs.length > 0) filterParts.push(`cpf.in.(${patientCpfs.map(c => `"${c}"`).join(',')})`)
          apptQuery = apptQuery.or(filterParts.join(','))
          
          const { data: appointments } = await apptQuery
          setExamAppointments(appointments || [])
        } else {
          setExamAppointments([])
        }
      } else {
        setExamAppointments([])
      }

      setPatients(mPatients || [])
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  // Efeito para busca debounced
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    
    searchTimeoutRef.current = setTimeout(() => {
      loadData(searchTerm)
    }, 400)

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    }
  }, [searchTerm])

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

  const filteredPatients = patients // Agora o filtro é feito no servidor

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
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  {searchTerm ? `Resultados da busca • ${patients.length} encontrados` : `Base Sincronizada • ${totalCount} Registros (Mostrando 20)`}
                </p>
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

      {/* SHEET DE EDIÇÃO — desliza da direita */}
      <Sheet open={isEditing} onOpenChange={setIsEditing}>
        <SheetContent side="right" className="w-[480px] sm:max-w-[520px] p-0 border-l border-slate-200 bg-slate-50 flex flex-col shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="p-6 bg-teal-500 text-white shrink-0">
            <div className="flex items-center justify-between mb-3">
              <div className="h-9 w-9 bg-white/20 rounded-xl flex items-center justify-center">
                <UserCircle className="h-5 w-5" />
              </div>
              <button onClick={() => setIsEditing(false)} className="h-9 w-9 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <h3 className="text-xl font-bold uppercase tracking-tight">Configuração Dossiê</h3>
            <p className="text-teal-100 text-[10px] font-bold uppercase tracking-wider mt-0.5 truncate">{selectedPatient?.full_name}</p>
          </div>

          {/* Form */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            <div className="space-y-1">
              <Label className="uppercase text-[9px] font-bold tracking-wider text-slate-500 ml-1">Nome Completo do Paciente</Label>
              <div className="relative">
                <Input
                  value={selectedPatient?.full_name || ""}
                  onChange={e => setSelectedPatient({ ...selectedPatient, full_name: e.target.value.toUpperCase() })}
                  className="h-11 bg-white border-slate-200 rounded-xl text-xs font-bold text-slate-700 uppercase focus:border-teal-400 outline-none pr-10"
                />
                <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="uppercase text-[9px] font-bold tracking-wider text-slate-500 ml-1">CPF</Label>
                <Input
                  value={selectedPatient?.cpf || ""}
                  onChange={e => setSelectedPatient({ ...selectedPatient, cpf: e.target.value })}
                  className="h-11 bg-white border-slate-200 rounded-xl text-xs font-bold text-slate-700 text-center focus:border-teal-400 outline-none"
                  placeholder="000.000.000-00"
                />
              </div>
              <div className="space-y-1">
                <Label className="uppercase text-[9px] font-bold tracking-wider text-slate-500 ml-1">Cartão SUS</Label>
                <Input
                  value={selectedPatient?.sus || ""}
                  onChange={e => setSelectedPatient({ ...selectedPatient, sus: e.target.value })}
                  className="h-11 bg-white border-slate-200 rounded-xl text-xs font-bold text-slate-700 text-center focus:border-teal-400 outline-none"
                  placeholder="000 0000 0000 0000"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="uppercase text-[9px] font-bold tracking-wider text-slate-500 ml-1">Data de Nascimento</Label>
              <Input
                type="date"
                value={selectedPatient?.data_nascimento || ""}
                onChange={e => setSelectedPatient({ ...selectedPatient, data_nascimento: e.target.value })}
                className="h-11 bg-white border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:border-teal-400 outline-none"
              />
            </div>

            <div className="space-y-1">
              <Label className="uppercase text-[9px] font-bold tracking-wider text-slate-500 ml-1">Município de Residência</Label>
              <Input
                value={selectedPatient?.municipio || ""}
                onChange={e => setSelectedPatient({ ...selectedPatient, municipio: e.target.value.toUpperCase() })}
                placeholder="EX: IMPERATRIZ"
                className="h-11 bg-white border-slate-200 rounded-xl text-xs font-bold text-slate-700 uppercase focus:border-teal-400 outline-none"
              />
            </div>

            <div className="p-4 bg-slate-100 rounded-xl border border-slate-200">
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-1">ID Sistema Core</p>
              <p className="text-[10px] font-bold text-slate-600 truncate">{selectedPatient?.id}</p>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-slate-100 bg-white shrink-0 flex gap-3">
            <Button
              variant="outline"
              onClick={() => setIsEditing(false)}
              className="flex-1 h-11 rounded-xl font-bold uppercase text-[10px] tracking-wider text-slate-500 border-slate-200 hover:bg-slate-50"
            >
              Descartar
            </Button>
            <Button
              onClick={savePatient}
              disabled={isSaving}
              className="flex-1 h-11 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-bold uppercase text-[10px] tracking-wider shadow-sm"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4 mr-1.5" />Salvar Dossiê</>}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
