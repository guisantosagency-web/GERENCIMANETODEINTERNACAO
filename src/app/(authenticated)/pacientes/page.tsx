"use client"

import { useState, useMemo, useCallback } from "react"
import { createBrowserClient } from "@supabase/ssr"
import {
  Search, User, Phone, MapPin, Calendar, Clock, FileText, Activity,
  Stethoscope, Syringe, FlaskConical, ChevronRight, X, Loader2,
  Heart, Badge as BadgeIcon, Hash, UserCircle2, Home
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { searchMasterPatients, type MasterPatient } from "@/lib/patient-search"

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
  const [debounce, setDebounce] = useState<ReturnType<typeof setTimeout> | null>(null)

  const handleSearch = useCallback(async (val: string) => {
    setSearchTerm(val)
    if (debounce) clearTimeout(debounce)
    if (val.trim().length < 2) { setResults([]); return }
    const t = setTimeout(async () => {
      setIsSearching(true)
      const res = await searchMasterPatients(val)
      setResults(res)
      setIsSearching(false)
    }, 350)
    setDebounce(t)
  }, [debounce])

  const loadHistory = async (patient: MasterPatient) => {
    setSelected(patient)
    setLoadingHistory(true)
    setHistory(null)
    const supabase = getSupabase()

    const [internacoes, exames, triagens, consultas] = await Promise.all([
      // Match by CPF or name in patients table
      patient.cpf
        ? supabase.from("patients").select("*").eq("cpf", patient.cpf).order("created_at", { ascending: false })
        : supabase.from("patients").select("*").ilike("paciente", `%${patient.full_name}%`).limit(20),
      // Exames
      patient.cpf
        ? supabase.from("exam_appointments").select("*").eq("cpf", patient.cpf).order("exam_date", { ascending: false })
        : supabase.from("exam_appointments").select("*").ilike("patient_name", `%${patient.full_name}%`).limit(20),
      // Triagem
      patient.cpf
        ? supabase.from("surgery_triage").select("*").eq("cpf", patient.cpf).order("created_at", { ascending: false })
        : supabase.from("surgery_triage").select("*").ilike("patient_name", `%${patient.full_name}%`).limit(10),
      // Consultas
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
    setLoadingHistory(false)
  }

  const totalAtendimentos = useMemo(() => {
    if (!history) return 0
    return history.internacoes.length + history.exames.length + history.triagens.length + history.consultas.length
  }, [history])

  const originMap: Record<string, { label: string; color: string }> = {
    internacao: { label: "Internação", color: "bg-blue-100 text-blue-700" },
    exames: { label: "Exames", color: "bg-amber-100 text-amber-700" },
    triagem: { label: "Triagem", color: "bg-purple-100 text-purple-700" },
    consulta: { label: "Consulta", color: "bg-emerald-100 text-emerald-700" },
    manual: { label: "Manual", color: "bg-slate-100 text-slate-600" },
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* HEADER */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-primary/10">
            <UserCircle2 className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1 className="text-4xl font-bold font-space tracking-tight gradient-text">Dossiê de Pacientes</h1>
            <p className="text-muted-foreground font-medium text-sm">
              Cadastro unificado — histórico completo de todos os módulos
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* SEARCH PANEL */}
        <div className={`lg:col-span-${selected ? '4' : '12'} space-y-6 transition-all duration-500`}>
          <div className="glass-card bg-white/60 backdrop-blur-xl border-none rounded-[2.5rem] p-8 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-primary/10">
                <Search className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="font-black text-xl font-space tracking-tight text-slate-800">Buscar Paciente</h2>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Por nome, CPF ou SUS</p>
              </div>
            </div>

            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Digite o nome, CPF ou cartão SUS..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-11 h-13 rounded-2xl border-slate-200 bg-white text-sm font-bold focus:ring-primary/20"
              />
              {isSearching && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                </div>
              )}
            </div>

            {/* RESULTS */}
            {results.length > 0 && (
              <div className="mt-4 space-y-2 animate-in slide-in-from-top-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{results.length} resultado(s)</p>
                {results.map((p) => {
                  const origin = originMap[p.origem_cadastro || "manual"]
                  return (
                    <button
                      key={p.id}
                      onClick={() => loadHistory(p)}
                      className={`w-full flex items-center justify-between p-4 rounded-2xl border border-slate-100 transition-all text-left group hover:bg-primary/5 hover:border-primary/20 ${selected?.id === p.id ? 'bg-primary/5 border-primary/20 shadow-md' : 'bg-white'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center font-black text-primary text-lg">
                          {p.full_name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-800 uppercase leading-tight">{p.full_name}</p>
                          <p className="text-[9px] font-bold text-slate-400 flex items-center gap-1.5 mt-0.5">
                            {p.cpf || "Sem CPF"}
                            <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-black ${origin.color}`}>{origin.label}</span>
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-primary transition-colors" />
                    </button>
                  )
                })}
              </div>
            )}

            {searchTerm.length >= 2 && !isSearching && results.length === 0 && (
              <div className="mt-8 text-center opacity-30">
                <User className="h-12 w-12 mx-auto mb-3" />
                <p className="font-black uppercase tracking-widest text-sm">Nenhum paciente encontrado</p>
              </div>
            )}

            {!searchTerm && (
              <div className="mt-8 text-center opacity-20">
                <Search className="h-16 w-16 mx-auto mb-4 stroke-[1px]" />
                <p className="font-black uppercase tracking-widest text-sm">Digite para buscar</p>
              </div>
            )}
          </div>
        </div>

        {/* DOSSIER PANEL */}
        {selected && (
          <div className="lg:col-span-8 space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            {/* Patient Header Card */}
            <div className="glass-card bg-gradient-to-br from-primary to-secondary rounded-[2.5rem] p-8 text-white shadow-2xl shadow-primary/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20" />
              <button
                onClick={() => { setSelected(null); setHistory(null) }}
                className="absolute top-6 right-6 p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="flex items-start gap-6 relative z-10">
                <div className="h-20 w-20 rounded-[1.5rem] bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-4xl uppercase shadow-inner flex-shrink-0">
                  {selected.full_name.charAt(0)}
                </div>
                <div className="flex-1">
                  <h2 className="text-3xl font-black font-space uppercase tracking-tight mb-1">{selected.full_name}</h2>
                  <div className="flex flex-wrap gap-3 mt-3">
                    {selected.cpf && (
                      <span className="bg-white/15 backdrop-blur-md px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest">
                        CPF: {selected.cpf}
                      </span>
                    )}
                    {selected.sus && (
                      <span className="bg-white/15 backdrop-blur-md px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest">
                        SUS: {selected.sus}
                      </span>
                    )}
                    {selected.data_nascimento && (
                      <span className="bg-white/15 backdrop-blur-md px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest">
                        DN: {selected.data_nascimento}
                      </span>
                    )}
                    {selected.tipagem_sanguinea && (
                      <span className="bg-red-500/40 backdrop-blur-md px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                        <Heart className="h-3 w-3" /> {selected.tipagem_sanguinea}
                      </span>
                    )}
                  </div>
                </div>
                {!loadingHistory && history && (
                  <div className="text-center bg-white/15 backdrop-blur-md rounded-2xl px-6 py-4 flex-shrink-0">
                    <p className="text-4xl font-black font-space">{totalAtendimentos}</p>
                    <p className="text-[9px] font-black uppercase tracking-widest opacity-80 mt-1">Atendimentos</p>
                  </div>
                )}
              </div>
            </div>

            {loadingHistory ? (
              <div className="h-64 flex flex-col items-center justify-center gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60">Carregando Histórico...</p>
              </div>
            ) : history && (
              <>
                {/* Info Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { icon: Phone, label: "Telefone", value: selected.telefone },
                    { icon: MapPin, label: "Município", value: [selected.municipio, selected.estado].filter(Boolean).join(" / ") },
                    { icon: Home, label: "Endereço", value: selected.endereco },
                    { icon: User, label: "Mãe", value: selected.nome_mae },
                    { icon: User, label: "Pai", value: selected.nome_pai },
                    { icon: Heart, label: "Tipo Sanguíneo", value: selected.tipagem_sanguinea },
                  ].filter(i => i.value).map((item, idx) => (
                    <div key={idx} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1 flex items-center gap-1.5">
                        <item.icon className="h-3 w-3" /> {item.label}
                      </p>
                      <p className="font-bold text-slate-700 text-sm uppercase">{item.value}</p>
                    </div>
                  ))}
                </div>

                {/* History Modules */}
                {/* INTERNAÇÕES */}
                {history.internacoes.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-blue-100"><Stethoscope className="h-4 w-4 text-blue-600" /></div>
                      <h3 className="font-black text-xl font-space text-slate-800 uppercase tracking-tight">Internações</h3>
                      <span className="bg-blue-100 text-blue-700 text-[10px] font-black px-2.5 py-1 rounded-full">{history.internacoes.length}</span>
                    </div>
                    <div className="space-y-2">
                      {history.internacoes.map((p, i) => (
                        <div key={i} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-start gap-4">
                          <div className="h-2 w-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                          <div className="flex-1">
                            <div className="flex flex-wrap gap-3 items-center">
                              <span className="font-black text-slate-700 text-sm uppercase">{p.data}</span>
                              <span className="text-[10px] text-slate-400 font-bold uppercase">{p.horario}</span>
                              {p.leito && <span className="bg-blue-50 text-blue-700 text-[10px] font-black px-2 py-0.5 rounded-lg">Leito: {p.leito}</span>}
                              {p.destino && <span className="bg-slate-100 text-slate-600 text-[10px] font-black px-2 py-0.5 rounded-lg uppercase">{p.destino}</span>}
                            </div>
                            <p className="text-xs text-slate-500 font-bold mt-1 uppercase">{p.procedimento || "—"} • {p.medico || "—"}</p>
                            <p className="text-[10px] text-slate-400 font-bold mt-0.5 uppercase">Rec: {p.recepcionista || "—"}</p>
                          </div>
                          {p.prontuario && (
                            <span className="text-[9px] font-black text-primary bg-primary/5 px-2 py-1 rounded-lg font-mono flex-shrink-0">#{p.prontuario}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* EXAMES */}
                {history.exames.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-amber-100"><FlaskConical className="h-4 w-4 text-amber-600" /></div>
                      <h3 className="font-black text-xl font-space text-slate-800 uppercase tracking-tight">Exames</h3>
                      <span className="bg-amber-100 text-amber-700 text-[10px] font-black px-2.5 py-1 rounded-full">{history.exames.length}</span>
                    </div>
                    <div className="space-y-2">
                      {history.exames.map((e, i) => (
                        <div key={i} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-start gap-4">
                          <div className={`h-2 w-2 rounded-full mt-2 flex-shrink-0 ${e.status === 'presente' ? 'bg-emerald-500' : e.status === 'falta' ? 'bg-red-500' : 'bg-blue-400'}`} />
                          <div className="flex-1">
                            <div className="flex flex-wrap gap-2 items-center">
                              <span className="font-black text-slate-700 text-sm uppercase">{format(parseISO(e.exam_date), 'dd/MM/yyyy')}</span>
                              <span className="text-[10px] text-slate-400 font-bold">{e.exam_time}</span>
                              <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${e.status === 'presente' ? 'bg-emerald-100 text-emerald-700' : e.status === 'falta' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                                {e.status}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 font-black mt-1 uppercase">{e.procedure_name}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">{e.exam_type}</p>
                            {e.chave_sisreg && <p className="text-[9px] text-purple-600 font-black mt-0.5">SISREG: {e.chave_sisreg}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TRIAGEM */}
                {history.triagens.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-purple-100"><Syringe className="h-4 w-4 text-purple-600" /></div>
                      <h3 className="font-black text-xl font-space text-slate-800 uppercase tracking-tight">Triagem Cirúrgica</h3>
                      <span className="bg-purple-100 text-purple-700 text-[10px] font-black px-2.5 py-1 rounded-full">{history.triagens.length}</span>
                    </div>
                    <div className="space-y-2">
                      {history.triagens.map((t, i) => (
                        <div key={i} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-black text-slate-700 text-sm">
                                Triagem em {t.data_triage ? format(parseISO(t.data_triage), 'dd/MM/yyyy', { locale: ptBR }) : '—'}
                              </p>
                              <p className="text-[10px] text-slate-400 font-bold mt-0.5 uppercase">
                                {t.nir_data?.procedimento || "Procedimento não informado"} • {t.recepcionista || "—"}
                              </p>
                            </div>
                            <span className={`text-[9px] font-black px-2.5 py-1 rounded-full ${t.is_launched ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                              {t.is_launched ? 'Lançado' : 'Pendente'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* CONSULTAS */}
                {history.consultas.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-emerald-100"><Activity className="h-4 w-4 text-emerald-600" /></div>
                      <h3 className="font-black text-xl font-space text-slate-800 uppercase tracking-tight">Consultas</h3>
                      <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black px-2.5 py-1 rounded-full">{history.consultas.length}</span>
                    </div>
                    <div className="space-y-2">
                      {history.consultas.map((c, i) => (
                        <div key={i} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                          <p className="font-black text-slate-700 text-sm uppercase">{c.date} {c.time && `• ${c.time}`}</p>
                          <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase">{c.status} • {c.receptionist_name || "—"}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {totalAtendimentos === 0 && (
                  <div className="bg-white rounded-[2rem] p-12 text-center border border-slate-100 shadow-sm opacity-40">
                    <FileText className="h-16 w-16 mx-auto mb-4 stroke-[1px]" />
                    <p className="font-black uppercase tracking-widest">Nenhum histórico encontrado</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
