"use client"

import { useState, useMemo, useEffect } from "react"
import dynamic from "next/dynamic"
import { createBrowserClient } from "@supabase/ssr"
import { StatCard } from "@/components/stat-card"
import {
  Activity, CalendarDays, BarChart3, CalendarX2, Users,
  TrendingUp, Loader2, AlertCircle, TrendingDown,
  CheckCircle2, Clock3, RefreshCw, Info
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { format, parseISO, startOfToday, subDays, isSameDay } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useAuth } from "@/lib/auth-context"

const ExamsCharts = dynamic(() => import("@/components/exams-charts").then(m => m.ExamsCharts), {
  ssr: false,
  loading: () => <div className="h-[400px] w-full flex items-center justify-center animate-pulse bg-card/20 rounded-[2.5rem]">Carregando gráficos...</div>
})

const MONTHS_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
]

function MiniTrendBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
  return (
    <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden mt-3">
      <div
        className={`h-full rounded-full transition-all duration-1000 ease-out ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

export default function ExamesDashboardTab() {
  const { user } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [appointments, setAppointments] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Filters
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<string | null>(new Date().getMonth() + 1 + "")
  const [selectedYear, setSelectedYear] = useState<string | null>(new Date().getFullYear().toString())
  const [selectedProcedure, setSelectedProcedure] = useState<string | null>("")
  const [selectedExamType, setSelectedExamType] = useState<string | null>("")
  const [selectedStatus, setSelectedStatus] = useState<string | null>("")
  const [selectedMunicipio, setSelectedMunicipio] = useState<string | null>("")
  const [selectedEstado, setSelectedEstado] = useState<string | null>("")

  const supabase = useMemo(
    () => createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!),
    [],
  )

  const loadData = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("exam_appointments")
        .select("*")
        .neq("status", "cancelado")
        .order("exam_date", { ascending: false })
      if (!error && data) setAppointments(data)
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { setMounted(true); loadData() }, [])

  const availableYears = useMemo(() => Array.from(new Set([new Date().getFullYear().toString(), ...appointments.map(a => a.exam_date.substring(0, 4))])).sort().reverse(), [appointments])
  const availableProcedures = useMemo(() => Array.from(new Set(appointments.map(a => a.procedure_name).filter(Boolean))).sort(), [appointments])
  const availableMunicipios = useMemo(() => Array.from(new Set(appointments.map(a => a.municipio).filter(Boolean))).sort(), [appointments])

  const filteredRecords = useMemo(() => {
    return appointments.filter(r => {
      const year = r.exam_date?.substring(0, 4)
      const month = r.exam_date ? parseInt(r.exam_date.substring(5, 7)).toString() : ""
      const day = r.exam_date?.substring(8, 10)
      if (selectedYear && year !== selectedYear) return false
      if (selectedMonth && month !== selectedMonth) return false
      if (selectedDay && day !== selectedDay.padStart(2, '0')) return false
      if (selectedProcedure && r.procedure_name !== selectedProcedure) return false
      if (selectedExamType && r.exam_type !== selectedExamType) return false
      if (selectedStatus && r.status !== selectedStatus) return false
      if (selectedMunicipio && r.municipio !== selectedMunicipio) return false
      if (selectedEstado && r.estado !== selectedEstado) return false
      return true
    })
  }, [appointments, selectedDay, selectedMonth, selectedYear, selectedProcedure, selectedExamType, selectedStatus, selectedMunicipio, selectedEstado])

  const stats = useMemo(() => {
    let presentes = 0, faltas = 0, agendados = 0
    filteredRecords.forEach(a => {
      if (a.status === 'presente') presentes++
      if (a.status === 'falta') faltas++
      if (a.status === 'agendado') agendados++
    })
    const concluded = presentes + faltas
    const rate = concluded > 0 ? ((presentes / concluded) * 100) : 0
    const absenteeRate = concluded > 0 ? ((faltas / concluded) * 100) : 0
    const total = filteredRecords.length

    // Today stats
    const today = format(new Date(), 'yyyy-MM-dd')
    const todayRecords = appointments.filter(a => a.exam_date === today)
    const todayPresentes = todayRecords.filter(a => a.status === 'presente').length
    const todayFaltas = todayRecords.filter(a => a.status === 'falta').length
    const todayAgendados = todayRecords.filter(a => a.status === 'agendado').length

    // Top procedure
    const procMap: Record<string, number> = {}
    filteredRecords.forEach(r => { if (r.procedure_name) procMap[r.procedure_name] = (procMap[r.procedure_name] || 0) + 1 })
    const topProc = Object.entries(procMap).sort((a, b) => b[1] - a[1])[0]

    return {
      presentes, faltas, agendados, total, concluded,
      rate: rate.toFixed(1), absenteeRate: absenteeRate.toFixed(1),
      todayPresentes, todayFaltas, todayAgendados, todayTotal: todayRecords.length,
      topProc: topProc ? { name: topProc[0], count: topProc[1] } : null,
    }
  }, [filteredRecords, appointments])

  const activeFiltersCount = [selectedStatus, selectedProcedure, selectedMunicipio, selectedExamType, selectedDay].filter(Boolean).length

  if (!mounted) return null

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-700">

      {/* ===== FILTER HEADER ===== */}
      <div className="glass-card !bg-white/40 border-none rounded-[3rem] p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl -mr-24 -mt-24 pointer-events-none" />
        <div className="flex flex-col gap-6 relative z-10">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-3xl font-black font-space uppercase tracking-tight text-slate-800">Indicadores de Desempenho</h2>
                <p className="text-slate-400 font-bold flex items-center gap-2 uppercase text-[10px] tracking-widest mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Dados em Tempo Real · {format(new Date(), "MMMM / yyyy", { locale: ptBR })}
                  {!isLoading && (
                    <button onClick={loadData} className="ml-2 text-primary hover:text-primary/80 transition-colors">
                      <RefreshCw className="h-3 w-3" />
                    </button>
                  )}
                </p>
              </div>
            </div>
            {activeFiltersCount > 0 && (
              <button
                onClick={() => { setSelectedStatus(""); setSelectedProcedure(""); setSelectedExamType(""); setSelectedMunicipio(""); setSelectedEstado(""); setSelectedDay(null) }}
                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-rose-50 text-rose-600 px-4 py-2 rounded-xl hover:bg-rose-100 transition-all"
              >
                Limpar {activeFiltersCount} filtro(s)
              </button>
            )}
          </div>

          {/* Filters Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
            {[
              { label: "Ano", value: selectedYear, onChange: (v: string) => setSelectedYear(v || null), opts: availableYears.map(y => ({ v: y, l: y })) },
              { label: "Mês", value: selectedMonth, onChange: (v: string) => setSelectedMonth(v || null), opts: MONTHS_NAMES.map((m, i) => ({ v: (i+1).toString(), l: m })) },
              { label: "Dia", value: selectedDay, onChange: (v: string) => setSelectedDay(v || null), opts: Array.from({length: 31}, (_, i) => ({ v: (i+1).toString().padStart(2, '0'), l: (i+1).toString().padStart(2, '0') })) },
              { label: "Status", value: selectedStatus, onChange: (v: string) => setSelectedStatus(v), opts: [{ v: "agendado", l: "Agendado" }, { v: "presente", l: "Presente" }, { v: "falta", l: "Falta" }] },
            ].map(f => (
              <div key={f.label} className="flex flex-col gap-1.5">
                <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-2">{f.label}</Label>
                <select
                  value={f.value || ""}
                  onChange={e => f.onChange(e.target.value)}
                  className={`h-10 border rounded-xl text-xs font-black shadow-sm focus:ring-4 focus:ring-blue-500/10 px-3 uppercase appearance-none cursor-pointer transition-all ${f.value ? 'bg-primary/5 border-primary/30 text-primary' : 'bg-white border-slate-100 text-slate-700'}`}
                >
                  <option value="">Todos</option>
                  {f.opts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                </select>
              </div>
            ))}
            <div className="flex flex-col gap-1.5 xl:col-span-2">
              <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-2">Procedimento</Label>
              <select value={selectedProcedure || ""} onChange={e => setSelectedProcedure(e.target.value)} className={`h-10 border rounded-xl text-xs font-black shadow-sm focus:ring-4 focus:ring-blue-500/10 px-3 uppercase appearance-none cursor-pointer transition-all ${selectedProcedure ? 'bg-primary/5 border-primary/30 text-primary' : 'bg-white border-slate-100 text-slate-700'}`}>
                <option value="">Todos</option>
                {availableProcedures.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5 xl:col-span-2">
              <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-2">Município</Label>
              <select value={selectedMunicipio || ""} onChange={e => setSelectedMunicipio(e.target.value)} className={`h-10 border rounded-xl text-xs font-black shadow-sm focus:ring-4 focus:ring-blue-500/10 px-3 uppercase appearance-none cursor-pointer transition-all ${selectedMunicipio ? 'bg-primary/5 border-primary/30 text-primary' : 'bg-white border-slate-100 text-slate-700'}`}>
                <option value="">Todos</option>
                {availableMunicipios.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* ===== KPI CARDS ===== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Volume Total */}
        <div className="group glass-card bg-gradient-to-br from-blue-600 to-blue-700 rounded-[2rem] p-6 text-white shadow-xl shadow-blue-500/20 flex flex-col gap-4 transition-all hover:scale-[1.02] hover:shadow-blue-500/30">
          <div className="flex justify-between items-start">
            <div className="p-2.5 bg-white/15 rounded-xl backdrop-blur-md">
              <BarChart3 className="h-5 w-5" />
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest opacity-70 bg-white/10 px-2.5 py-1 rounded-full">Total</span>
          </div>
          <div>
            <p className="text-5xl font-black font-space leading-none">{stats.total}</p>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mt-2">Procedimentos Realizados</p>
          </div>
          <MiniTrendBar value={stats.total} max={Math.max(stats.total, 1)} color="bg-white/40" />
        </div>

        {/* Presença */}
        <div className="group glass-card bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-[2rem] p-6 text-white shadow-xl shadow-emerald-500/20 flex flex-col gap-4 transition-all hover:scale-[1.02] hover:shadow-emerald-500/30">
          <div className="flex justify-between items-start">
            <div className="p-2.5 bg-white/15 rounded-xl backdrop-blur-md">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest opacity-70 bg-white/10 px-2.5 py-1 rounded-full">Presença</span>
          </div>
          <div>
            <p className="text-5xl font-black font-space leading-none">{stats.presentes}</p>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mt-2">Pacientes Atendidos</p>
          </div>
          <MiniTrendBar value={stats.presentes} max={Math.max(stats.concluded, 1)} color="bg-white/40" />
        </div>

        {/* Faltas */}
        <div className="group glass-card bg-gradient-to-br from-rose-500 to-rose-600 rounded-[2rem] p-6 text-white shadow-xl shadow-rose-500/20 flex flex-col gap-4 transition-all hover:scale-[1.02] hover:shadow-rose-500/30">
          <div className="flex justify-between items-start">
            <div className="p-2.5 bg-white/15 rounded-xl backdrop-blur-md">
              <CalendarX2 className="h-5 w-5" />
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest opacity-70 bg-white/10 px-2.5 py-1 rounded-full">Faltas</span>
          </div>
          <div>
            <p className="text-5xl font-black font-space leading-none">{stats.faltas}</p>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mt-2">Não Compareceram</p>
          </div>
          <MiniTrendBar value={stats.faltas} max={Math.max(stats.concluded, 1)} color="bg-white/40" />
        </div>

        {/* Aguardando */}
        <div className="group glass-card bg-gradient-to-br from-amber-500 to-orange-500 rounded-[2rem] p-6 text-white shadow-xl shadow-amber-500/20 flex flex-col gap-4 transition-all hover:scale-[1.02] hover:shadow-amber-500/30">
          <div className="flex justify-between items-start">
            <div className="p-2.5 bg-white/15 rounded-xl backdrop-blur-md">
              <Clock3 className="h-5 w-5" />
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest opacity-70 bg-white/10 px-2.5 py-1 rounded-full">Pendente</span>
          </div>
          <div>
            <p className="text-5xl font-black font-space leading-none">{stats.agendados}</p>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mt-2">Aguardando Confirmação</p>
          </div>
          <MiniTrendBar value={stats.agendados} max={Math.max(stats.total, 1)} color="bg-white/40" />
        </div>
      </div>

      {/* ===== TAXA + HOJE ===== */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Taxa de Conversão */}
        <div className="md:col-span-4 glass-card bg-white rounded-[2rem] p-7 border border-slate-100 shadow-lg flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Eficiência</p>
              <h3 className="text-lg font-black font-space text-slate-800 uppercase">Taxa de Presença</h3>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-50">
              <TrendingUp className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-6xl font-black font-space text-emerald-600">{stats.rate}</span>
            <span className="text-2xl font-black text-emerald-400 mb-1">%</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
              <span className="text-emerald-600">Presentes</span>
              <span className="text-slate-500">{stats.presentes} / {stats.concluded}</span>
            </div>
            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-1000" style={{ width: `${stats.rate}%` }} />
            </div>
          </div>
        </div>

        {/* Taxa de Absenteísmo */}
        <div className="md:col-span-4 glass-card bg-white rounded-[2rem] p-7 border border-slate-100 shadow-lg flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Indicador Negativo</p>
              <h3 className="text-lg font-black font-space text-slate-800 uppercase">Absenteísmo</h3>
            </div>
            <div className="p-3 rounded-2xl bg-rose-50">
              <TrendingDown className="h-6 w-6 text-rose-500" />
            </div>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-6xl font-black font-space text-rose-500">{stats.absenteeRate}</span>
            <span className="text-2xl font-black text-rose-300 mb-1">%</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
              <span className="text-rose-500">Faltas</span>
              <span className="text-slate-500">{stats.faltas} / {stats.concluded}</span>
            </div>
            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-rose-400 to-rose-600 rounded-full transition-all duration-1000" style={{ width: `${stats.absenteeRate}%` }} />
            </div>
          </div>
        </div>

        {/* Hoje */}
        <div className="md:col-span-4 glass-card bg-gradient-to-br from-slate-800 to-slate-900 rounded-[2rem] p-7 text-white shadow-lg flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest opacity-50">Hoje</p>
              <h3 className="text-lg font-black font-space uppercase">
                {format(new Date(), "dd 'de' MMMM", { locale: ptBR })}
              </h3>
            </div>
            <div className="p-3 rounded-2xl bg-white/10">
              <CalendarDays className="h-6 w-6" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Agendados", value: stats.todayAgendados, color: "bg-blue-500/20 text-blue-300" },
              { label: "Presentes", value: stats.todayPresentes, color: "bg-emerald-500/20 text-emerald-300" },
              { label: "Faltas", value: stats.todayFaltas, color: "bg-rose-500/20 text-rose-300" },
            ].map(s => (
              <div key={s.label} className={`rounded-xl p-3 text-center ${s.color}`}>
                <p className="text-2xl font-black font-space">{s.value}</p>
                <p className="text-[8px] font-black uppercase tracking-widest opacity-80 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
          {stats.topProc && (
            <div className="pt-3 border-t border-white/10">
              <p className="text-[9px] font-black uppercase tracking-widest opacity-50">Mais Frequente (período)</p>
              <p className="text-sm font-black uppercase mt-1">{stats.topProc.name} <span className="opacity-50">({stats.topProc.count}x)</span></p>
            </div>
          )}
        </div>
      </div>

      {/* ===== CHARTS ===== */}
      {isLoading ? (
        <div className="h-[400px] w-full flex flex-col items-center justify-center gap-4 bg-white/20 backdrop-blur-md rounded-[3rem] border-2 border-dashed border-white/40">
          <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
          <p className="font-black text-xs uppercase tracking-[0.3em] text-blue-500/60">Sincronizando Dashboard...</p>
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="h-80 flex flex-col items-center justify-center opacity-30 text-slate-400">
          <BarChart3 className="h-20 w-20 mb-6 stroke-[1px]" />
          <p className="text-xl font-black font-space tracking-widest uppercase">Base Vazia para este Filtro</p>
        </div>
      ) : (
        <div className="space-y-8 pb-10">
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap items-center gap-2 px-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5"><Info className="h-3 w-3" /> Filtros ativos:</span>
              {selectedStatus && <button onClick={() => setSelectedStatus("")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-black uppercase tracking-widest hover:bg-rose-200 transition-all">Status: {selectedStatus} <span>✕</span></button>}
              {selectedProcedure && <button onClick={() => setSelectedProcedure("")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-black uppercase tracking-widest hover:bg-blue-200 transition-all">Proc: {selectedProcedure} <span>✕</span></button>}
              {selectedMunicipio && <button onClick={() => setSelectedMunicipio("")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-200 transition-all">Município: {selectedMunicipio} <span>✕</span></button>}
              {selectedDay && <button onClick={() => setSelectedDay(null)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-black uppercase tracking-widest hover:bg-amber-200 transition-all">Dia: {selectedDay} <span>✕</span></button>}
            </div>
          )}
          <ExamsCharts
            records={filteredRecords}
            onFilterChange={(type, val) => {
              if (type === 'status') setSelectedStatus(prev => prev === val ? "" : (val || ""))
              if (type === 'procedure') setSelectedProcedure(prev => prev === val ? "" : (val || ""))
              if (type === 'month') setSelectedMonth(prev => prev === val ? null : val)
            }}
          />
        </div>
      )}
    </div>
  )
}
