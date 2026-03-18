"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import { createBrowserClient } from "@supabase/ssr"
import {
  Search, User, Phone, MapPin, Calendar, Clock, FileText, Activity,
  Stethoscope, Syringe, FlaskConical, ChevronRight, X, Loader2,
  Heart, UserCircle2, Home, Hash, ArrowLeft, History
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { searchMasterPatients, type MasterPatient } from "@/lib/patient-search"
import { cn } from "@/lib/utils"

function getSupabase() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}

interface PatientHistory {
  internacoes: any[]
  exames: any[]
  triagens: any[]
  consultas: any[]
}

export default function PacientesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [results, setResults] = useState<MasterPatient[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selected, setSelected] = useState<MasterPatient | null>(null)
  const [history, setHistory] = useState<PatientHistory | null>(null)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [debounceId, setDebounceId] = useState<NodeJS.Timeout | null>(null)

  const handleSearch = useCallback((val: string) => {
    setSearchTerm(val)
    if (debounceId) clearTimeout(debounceId)
    
    if (val.trim().length < 2) {
      setResults([])
      setIsSearching(false)
      return
    }

    const timer = setTimeout(async () => {
      setIsSearching(true)
      try {
        const res = await searchMasterPatients(val)
        setResults(res)
      } finally {
        setIsSearching(false)
      }
    }, 400)
    setDebounceId(timer)
  }, [debounceId])

  const loadHistory = async (patient: MasterPatient) => {
    setSelected(patient)
    setLoadingHistory(true)
    setHistory(null)
    const supabase = getSupabase()

    try {
      const [internacoes, exames, triagens, consultas] = await Promise.all([
        patient.cpf
          ? supabase.from("patients").select("*").eq("cpf", patient.cpf).order("created_at", { ascending: false })
          : supabase.from("patients").select("*").ilike("paciente", `%${patient.full_name}%`).limit(20),
        patient.cpf
          ? supabase.from("exam_appointments").select("*").eq("cpf", patient.cpf).order("exam_date", { ascending: false })
          : supabase.from("exam_appointments").select("*").ilike("patient_name", `%${patient.full_name}%`).limit(20),
        patient.cpf
          ? supabase.from("surgery_triage").select("*").eq("cpf", patient.cpf).order("created_at", { ascending: false })
          : supabase.from("surgery_triage").select("*").ilike("patient_name", `%${patient.full_name}%`).limit(10),
        patient.cpf
          ? supabase.from("consultations").select("*").eq("cpf", patient.cpf).order("created_at", { ascending: false })
          : supabase.from("consultations").select("*").ilike("patient_name", `%${patient.full_name}%`).limit(10),
      ])

      setHistory({
        internacoes: internacoes.data || [],
        exames: exames.data || [],
        triagens: triagens.data || [],
        consultas: consultas.data || [],
      })
    } finally {
      setLoadingHistory(false)
    }
  }

  const totalAtendimentos = useMemo(() => {
    if (!history) return 0
    return history.internacoes.length + history.exames.length + history.triagens.length + history.consultas.length
  }, [history])

  const originMap: Record<string, { label: string; color: string; badge: string }> = {
    internacao: { label: "Internação", color: "bg-blue-500", badge: "bg-blue-100 text-blue-700" },
    exames: { label: "Exames", color: "bg-amber-500", badge: "bg-amber-100 text-amber-700" },
    triagem: { label: "Triagem", color: "bg-purple-500", badge: "bg-purple-100 text-purple-700" },
    consulta: { label: "Consulta", color: "bg-emerald-500", badge: "bg-emerald-100 text-emerald-700" },
    manual: { label: "Manual", color: "bg-slate-500", badge: "bg-slate-100 text-slate-600" },
  }

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col gap-6 p-2">
      {/* Page Header */}
      <div className="flex items-center gap-5 px-6">
        <div className="p-4 rounded-[2rem] bg-indigo-600/10 text-indigo-600 shadow-sm border border-indigo-600/10">
          <UserCircle2 className="h-8 w-8" />
        </div>
        <div>
          <h1 className="text-4xl font-black gradient-text tracking-tight uppercase">Dossiê do Paciente</h1>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] ml-1 opacity-70">Cadastro Unificado • Histórico Multidisciplinar</p>
        </div>
      </div>

      <div className="flex-1 flex gap-8 min-h-0 relative overflow-hidden">
        {/* Left Column: Search Panel */}
        <div className={cn(
          "w-full lg:w-[400px] flex flex-col gap-6 transition-all duration-500 ease-out",
          selected ? "lg:flex hidden" : "flex"
        )}>
          <div className="bg-white rounded-[3rem] p-8 shadow-2xl shadow-indigo-500/5 border border-slate-100 flex flex-col gap-6 min-h-0">
            <div className="space-y-4">
              <div className="flex items-center gap-3 ml-2">
                <Search className="h-4 w-4 text-indigo-500" />
                <span className="font-black uppercase text-[10px] tracking-widest text-slate-400">Localizar Cadastro</span>
              </div>
              <div className="relative group">
                <Input
                  placeholder="NOME OU CPF..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="h-16 pl-14 rounded-[1.5rem] bg-slate-50 border-none font-black text-sm uppercase shadow-inner group-focus-within:bg-white group-focus-within:ring-4 group-focus-within:ring-indigo-500/10 transition-all"
                />
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-indigo-500 transition-all" />
                {isSearching && <Loader2 className="absolute right-6 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin text-indigo-500" />}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-3 custom-scrollbar">
              {results.length > 0 ? (
                results.map((p) => {
                  const origin = originMap[p.origem_cadastro || "manual"]
                  const isPatientSelected = selected?.id === p.id
                  return (
                    <button
                      key={p.id}
                      onClick={() => loadHistory(p)}
                      className={cn(
                        "w-full p-5 rounded-[2rem] border-2 transition-all duration-300 text-left group relative overflow-hidden",
                        isPatientSelected 
                          ? "bg-indigo-600 border-indigo-600 shadow-xl shadow-indigo-600/20 translate-x-2" 
                          : "bg-white border-transparent hover:border-indigo-100 hover:bg-indigo-50/30"
                      )}
                    >
                      <div className="flex items-center gap-4 relative z-10">
                        <div className={cn(
                          "h-12 w-12 rounded-2xl flex items-center justify-center font-black text-lg transition-colors",
                          isPatientSelected ? "bg-white/20 text-white" : "bg-indigo-50 text-indigo-600"
                        )}>
                          {p.full_name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <p className={cn(
                            "font-black uppercase text-sm leading-tight transition-colors",
                            isPatientSelected ? "text-white" : "text-slate-800"
                          )}>
                            {p.full_name}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            {p.cpf && (
                              <p className={cn(
                                "text-[9px] font-bold opacity-60",
                                isPatientSelected ? "text-indigo-100" : "text-slate-400"
                              )}>
                                CPF: {p.cpf}
                              </p>
                            )}
                            <div className={cn(
                              "h-1 w-1 rounded-full",
                              isPatientSelected ? "bg-white/30" : "bg-slate-200"
                            )} />
                            <span className={cn(
                              "text-[8px] font-black uppercase px-2 py-0.5 rounded-lg",
                              isPatientSelected ? "bg-white/20 text-white" : origin.badge
                            )}>
                              {origin.label}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className={cn(
                          "h-5 w-5 transition-all",
                          isPatientSelected ? "text-white scale-125" : "text-slate-200 group-hover:text-indigo-300"
                        )} />
                      </div>
                    </button>
                  )
                })
              ) : searchTerm.length >= 2 && !isSearching ? (
                <div className="py-20 text-center">
                  <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <User className="h-8 w-8 text-slate-200" />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nenhum resultado</p>
                </div>
              ) : !searchTerm && (
                <div className="py-20 text-center opacity-30">
                  <Search className="h-16 w-16 mx-auto mb-4 stroke-[1px]" />
                  <p className="text-[10px] font-black uppercase tracking-widest">Busque para iniciar</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Dossier Details */}
        <div className="flex-1 min-w-0 transition-all duration-500 h-full">
          {selected ? (
            <div className="h-full flex flex-col gap-6 animate-in slide-in-from-right-8 duration-500">
              {/* Patient Header & Info Card */}
              <div className="bg-white rounded-[3.5rem] p-10 shadow-2xl shadow-indigo-500/5 border border-slate-100 relative overflow-hidden shrink-0">
                {/* Visual Background Decoration */}
                <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full -ml-24 -mb-24 blur-3xl pointer-events-none" />

                <div className="flex flex-col xl:flex-row gap-10 relative z-10">
                  {/* Left part: Avatar + Name + Badges */}
                  <div className="flex gap-8 flex-1">
                    <div className="h-24 w-24 rounded-[2rem] bg-indigo-600 shadow-xl shadow-indigo-600/40 flex items-center justify-center font-black text-4xl text-white shrink-0">
                      {selected.full_name.charAt(0)}
                    </div>
                    <div className="space-y-4 py-2">
                       <h2 className="text-3xl font-black font-space uppercase tracking-tight text-slate-800 leading-none">
                        {selected.full_name}
                       </h2>
                       <div className="flex flex-wrap gap-2 pt-1">
                         {selected.cpf && <InfoBadge icon={<Hash />} label="CPF" value={selected.cpf} color="bg-slate-100 text-slate-600" />}
                         {selected.sus && <InfoBadge icon={<Activity />} label="SUS" value={selected.sus} color="bg-slate-100 text-slate-600" />}
                         {selected.data_nascimento && <InfoBadge icon={<Calendar />} label="DN" value={selected.data_nascimento} color="bg-slate-100 text-slate-600" />}
                         {selected.tipagem_sanguinea && <InfoBadge icon={<Heart />} label="SANGUE" value={selected.tipagem_sanguinea} color="bg-red-50 text-red-600" />}
                         {selected.origem_cadastro && <InfoBadge icon={<History />} label="ORIGEM" value={originMap[selected.origem_cadastro]?.label || "—"} color="bg-indigo-50 text-indigo-600" />}
                       </div>
                    </div>
                  </div>

                  {/* Right part: Stats or Counter */}
                  {!loadingHistory && history && (
                    <div className="flex gap-4 xl:self-center">
                      <div className="bg-indigo-600 rounded-[2rem] px-10 py-6 text-white shadow-xl shadow-indigo-600/30 text-center min-w-[160px]">
                        <p className="text-4xl font-black font-space">{totalAtendimentos}</p>
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-80 mt-1">Total Passagens</p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => { setSelected(null); setHistory(null) }}
                        className="h-12 w-12 rounded-2xl hover:bg-slate-50 lg:hidden flex"
                      >
                        <ArrowLeft className="h-6 w-6 text-slate-400" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Secondary Info Row */}
                {!loadingHistory && (
                  <div className="mt-10 pt-8 border-t border-slate-50 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    <InfoBox label="Telefone" value={selected.telefone} icon={<Phone className="h-4 w-4 text-indigo-500" />} />
                    <InfoBox label="Localização" value={[selected.municipio, selected.estado].filter(Boolean).join(" / ")} icon={<MapPin className="h-4 w-4 text-indigo-500" />} />
                    <InfoBox label="Filiação" value={selected.nome_mae || selected.nome_pai} icon={<User className="h-4 w-4 text-indigo-500" />} />
                    <InfoBox label="Prontuário" value={selected.prontuario || "—"} icon={<FileText className="h-4 w-4 text-indigo-500" />} />
                  </div>
                )}
              </div>

              {/* History Timeline Container */}
              <div className="flex-1 bg-white rounded-[4rem] p-10 shadow-2xl shadow-indigo-500/5 border border-slate-100 min-h-0 flex flex-col gap-8">
                <div className="flex items-center gap-4 px-2">
                  <div className="h-2 w-12 bg-indigo-600 rounded-full" />
                  <h3 className="text-xl font-black uppercase tracking-tight text-slate-800 font-space">Linha do Tempo de Atendimentos</h3>
                </div>

                <div className="flex-1 overflow-y-auto pr-4 -mr-4 space-y-12 custom-scrollbar">
                  {loadingHistory ? (
                    <div className="flex flex-col items-center justify-center h-full py-20 gap-6">
                      <div className="relative">
                        <Loader2 className="h-16 w-16 animate-spin text-indigo-600 opacity-20" />
                        <Loader2 className="h-16 w-16 animate-spin text-indigo-600 absolute top-0 left-0" style={{ animationDirection: 'reverse', animationDuration: '3s' }} />
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-[0.5em] text-indigo-600 animate-pulse">Cruzando Dados...</p>
                    </div>
                  ) : history && (
                    <>
                      {/* Section: Internações */}
                      <TimelineSection 
                        title="Internações" 
                        icon={<Stethoscope />} 
                        count={history.internacoes.length} 
                        color="indigo" 
                        data={history.internacoes}
                        renderItem={(p, i) => (
                          <TimelineItem key={i}>
                            <div className="flex flex-1 flex-col gap-3">
                              <div className="flex flex-wrap gap-3 items-center">
                                <span className="font-black text-slate-800 text-sm">{p.data}</span>
                                <Badge variant="secondary" className="bg-indigo-50 text-indigo-600 font-black text-[9px] rounded-lg border-none">{p.horario}</Badge>
                                {p.leito && <span className="text-[10px] font-black uppercase text-slate-400">Leito: <span className="text-slate-700">{p.leito}</span></span>}
                              </div>
                              <p className="font-black text-slate-600 text-[11px] uppercase tracking-wide">
                                {p.procedimento || "NÃO INFORMADO"} • <span className="opacity-70">{p.medico || "S/ MÉDICO"}</span>
                              </p>
                              <div className="flex items-center gap-3">
                                <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-[8px] font-black uppercase text-slate-500">{p.destino || "HTO"}</span>
                                {p.prontuario && <span className="text-[8px] font-mono font-black text-indigo-500">#{p.prontuario}</span>}
                              </div>
                            </div>
                            <div className="text-right flex flex-col gap-1 items-end">
                              <p className="text-[9px] font-black uppercase text-slate-400">Recepcionista</p>
                              <p className="text-[10px] font-black text-slate-700 uppercase">{p.recepcionista || "SISTEMA"}</p>
                            </div>
                          </TimelineItem>
                        )}
                      />

                      {/* Section: Exames */}
                      <TimelineSection 
                        title="Exames & Procedimentos" 
                        icon={<FlaskConical />} 
                        count={history.exames.length} 
                        color="amber" 
                        data={history.exames}
                        renderItem={(e, i) => (
                          <TimelineItem key={i}>
                            <div className="flex flex-1 flex-col gap-3">
                              <div className="flex flex-wrap gap-3 items-center">
                                <span className="font-black text-slate-800 text-sm whitespace-nowrap">
                                  {format(parseISO(e.exam_date), 'dd/MM/yyyy')}
                                </span>
                                <Badge variant="secondary" className="bg-amber-50 text-amber-700 font-black text-[9px] rounded-lg border-none">{e.exam_time}</Badge>
                                <span className={cn(
                                  "text-[8px] font-black uppercase px-2 py-0.5 rounded-lg",
                                  e.status === 'presente' ? "bg-emerald-100 text-emerald-700" : 
                                  e.status === 'falta' ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
                                )}>
                                  {e.status}
                                </span>
                              </div>
                              <p className="font-black text-slate-600 text-[11px] uppercase tracking-wide">{e.procedure_name}</p>
                              <div className="flex items-center gap-4">
                                <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1">
                                  <FlaskConical className="h-3 w-3" /> {e.exam_type}
                                </span>
                                {e.chave_sisreg && (
                                  <span className="text-[9px] font-black text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100 uppercase">
                                    SISREG: {e.chave_sisreg}
                                  </span>
                                )}
                              </div>
                            </div>
                          </TimelineItem>
                        )}
                      />

                      {/* Section: Triagem */}
                      <TimelineSection 
                        title="Triagem Cirúrgica" 
                        icon={<Syringe />} 
                        count={history.triagens.length} 
                        color="purple" 
                        data={history.triagens}
                        renderItem={(t, i) => (
                          <TimelineItem key={i}>
                            <div className="flex flex-1 flex-col gap-3">
                              <div className="flex items-center gap-4">
                                <span className="font-black text-slate-800 text-sm">
                                  {t.data_triage ? format(parseISO(t.data_triage), 'dd/MM/yyyy', { locale: ptBR }) : p.data}
                                </span>
                                <span className={cn(
                                  "text-[8px] font-black uppercase px-2 py-0.5 rounded-lg",
                                  t.is_launched ? "bg-emerald-100 text-emerald-700" : "bg-purple-100 text-purple-700"
                                )}>
                                  {t.is_launched ? "LANÇADO" : "EM TRIAGEM"}
                                </span>
                              </div>
                              <p className="font-black text-slate-600 text-[11px] uppercase tracking-wide">
                                {t.nir_data?.procedimento || "CIRURGIA GERAL"}
                              </p>
                              <div className="flex items-center gap-4 text-[9px] font-bold text-slate-400">
                                <span>Cirurgião: {t.nir_data?.cirurgiao || "—"}</span>
                                <span>Origem: {t.nir_data?.procedencia || "—"}</span>
                              </div>
                            </div>
                          </TimelineItem>
                        )}
                      />

                      {/* Section: Consultas */}
                      <TimelineSection 
                        title="Consultas Ambulatoriais" 
                        icon={<Activity />} 
                        count={history.consultas.length} 
                        color="emerald" 
                        data={history.consultas}
                        renderItem={(c, i) => (
                          <TimelineItem key={i}>
                            <div className="flex flex-1 flex-col gap-2">
                               <div className="flex items-center gap-4">
                                <span className="font-black text-slate-800 text-sm uppercase">{c.date}</span>
                                <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 font-black text-[9px] rounded-lg border-none">{c.time || "S/ HORA"}</Badge>
                                <span className="text-[8px] font-black text-emerald-600 uppercase bg-emerald-100/50 px-2 py-0.5 rounded-full">{c.status}</span>
                              </div>
                              <p className="font-black text-[10px] text-slate-500 uppercase tracking-widest mt-1">Rec: {c.receptionist_name || "SISTEMA"}</p>
                            </div>
                          </TimelineItem>
                        )}
                      />

                      {totalAtendimentos === 0 && (
                        <div className="flex flex-col items-center justify-center py-32 opacity-20">
                          <History className="h-20 w-20 mb-4 stroke-[1px]" />
                          <p className="text-xl font-black uppercase tracking-[0.2em]">Sem registro histórico</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center gap-8 bg-slate-50/50 border border-dashed border-slate-200 rounded-[4rem]">
              <div className="relative">
                <div className="absolute inset-0 bg-indigo-500 blur-[100px] opacity-10 animate-pulse" />
                <div className="h-40 w-40 rounded-[3rem] bg-white shadow-2xl flex items-center justify-center relative z-10">
                  <UserCircle2 className="h-20 w-20 text-slate-100" />
                </div>
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-black font-space text-slate-300 uppercase tracking-tight">Selecione um Paciente</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-loose">
                  Use a busca lateral para localizar o registro<br/>e visualizar o dossiê completo.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Helper Components
function InfoBadge({ icon, label, value, color }: any) {
  return (
    <div className={cn("px-4 py-2 rounded-2xl flex items-center gap-2 shadow-sm border border-black/5", color)}>
      <span className="opacity-50 h-3 w-3">{icon}</span>
      <span className="text-[9px] font-black uppercase tracking-tight">
        {label}: <span className="tracking-normal font-bold ml-1">{value}</span>
      </span>
    </div>
  )
}

function InfoBox({ label, value, icon }: any) {
  return (
    <div className="space-y-2 group">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 group-hover:text-indigo-500 transition-colors">{label}</span>
      </div>
      <p className="text-sm font-black text-slate-700 uppercase leading-snug break-words">
        {value || "—"}
      </p>
    </div>
  )
}

function TimelineSection({ title, icon, count, color, data, renderItem }: any) {
  if (data.length === 0) return null

  const borderColors: any = {
    indigo: "border-indigo-100 hover:border-indigo-200",
    amber: "border-amber-100 hover:border-amber-200",
    purple: "border-purple-100 hover:border-purple-200",
    emerald: "border-emerald-100 hover:border-emerald-200",
  }

  const bgColors: any = {
    indigo: "bg-indigo-50 text-indigo-600",
    amber: "bg-amber-50 text-amber-600",
    purple: "bg-purple-50 text-purple-600",
    emerald: "bg-emerald-50 text-emerald-600",
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className={cn("p-2.5 rounded-xl shadow-sm", bgColors[color])}>
          {icon && <div className="h-5 w-5">{icon}</div>}
        </div>
        <h4 className="text-lg font-black uppercase tracking-tight text-slate-800">{title}</h4>
        <span className={cn("px-3 py-1 rounded-full text-[10px] font-black", bgColors[color])}>
          {count} Ocorrência(s)
        </span>
      </div>
      <div className="space-y-4 ml-6 pl-8 border-l-2 border-slate-50 relative">
        {data.map((item: any, i: number) => renderItem(item, i))}
      </div>
    </div>
  )
}

function TimelineItem({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative group/item">
      {/* Connector Point */}
      <div className="absolute -left-[41px] top-6 w-4 h-4 rounded-full bg-white border-4 border-indigo-600 group-hover/item:scale-125 transition-transform z-10 shadow-sm" />
      
      <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 hover:border-indigo-100 transition-all duration-300 flex items-start gap-6 group-hover/item:-translate-y-1">
        {children}
      </div>
    </div>
  )
}
