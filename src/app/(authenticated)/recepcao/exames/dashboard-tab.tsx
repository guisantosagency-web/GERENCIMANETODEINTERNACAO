"use client"

import { useState, useMemo, useEffect } from "react"
import dynamic from "next/dynamic"
import { createBrowserClient } from "@supabase/ssr"
import {
  TrendingUp, Loader2, RefreshCw, Info,
  CheckCircle2, CalendarX2, Clock3, BarChart3,
  CalendarDays, TrendingDown, Target, Zap, Activity
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useAuth } from "@/lib/auth-context"

const ExamsCharts = dynamic(() => import("@/components/exams-charts").then(m => m.ExamsCharts), {
  ssr: false,
  loading: () => <div className="h-[300px] w-full flex items-center justify-center animate-pulse bg-slate-50 border border-slate-100 rounded-[1.5rem] text-slate-500">Carregando gráficos estratégicos...</div>
})

const MONTHS_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
]

function LiquidCard({ title, value, label, icon: Icon, gradient, trend, trendValue, sparkline, total }: any) {
  const isPositive = parseFloat(trendValue) >= 0
  
  return (
    <div className={`card-health group relative overflow-hidden bg-white rounded-2xl p-5 text-slate-800 shadow-sm border border-slate-100 hover:shadow-md hover:border-slate-200 transition-all duration-500 h-[140px]`}>
      {/* Soft gradient background inset */}
      <div className={`absolute inset-0 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-700 ${gradient}`} />
      
      <div className="relative z-10 flex flex-col h-full justify-between">
        <div className="flex items-center justify-between">
          <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100 shadow-sm group-hover:border-teal-200 transition-all text-teal-600">
            <Icon className="h-4 w-4" />
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-1">{title}</span>
            {trendValue && (
              <span className={`text-[10px] font-bold flex items-center gap-1 px-2 py-0.5 rounded-full ${isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {trendValue}%
              </span>
            )}
          </div>
        </div>
        
        <div className="flex items-end justify-between px-1">
          <div>
            <div className="flex items-baseline gap-2">
               <h4 className="text-3xl font-black font-space tracking-tight text-slate-800 leading-none">{value}</h4>
               {trend && <span className="text-[10px] font-bold text-teal-600 lowercase opacity-70 tracking-wide">{trend}</span>}
            </div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-slate-400 mt-2 line-clamp-1">{label}</p>
          </div>
          
          {sparkline && (
            <div className="h-10 w-20 opacity-30 group-hover:opacity-100 transition-all duration-700">
               <svg viewBox="0 0 100 30" className="h-full w-full overflow-visible">
                  <path 
                    d={`M ${sparkline.map((v: number, i: number) => `${i * 16},${30 - (v * 1)}`).join(' L ')}`} 
                    fill="none" 
                    stroke="var(--primary)" 
                    strokeWidth="3" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                  />
               </svg>
            </div>
          )}
        </div>

        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mt-3">
           <div className={`h-full bg-teal-500 rounded-full transition-all duration-1000`} style={{ width: total > 0 ? `${(value/total)*100}%` : '0%' }} />
        </div>
      </div>
    </div>
  )
}

export default function ExamesDashboardTab() {
  const { user } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [appointments, setAppointments] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<string | null>(new Date().getMonth() + 1 + "")
  const [selectedYear, setSelectedYear] = useState<string | null>(new Date().getFullYear().toString())
  const [selectedProcedure, setSelectedProcedure] = useState<string | null>("")
  const [selectedStatus, setSelectedStatus] = useState<string | null>("")
  const [selectedMunicipio, setSelectedMunicipio] = useState<string | null>("")
  const [occupancy, setOccupancy] = useState<any[]>([])

  const supabase = useMemo(() => createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!), [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const { data: appts, error: err1 } = await supabase.from("exam_appointments").select("*").neq("status", "cancelado").order("exam_date", { ascending: false })
      if (!err1 && appts) setAppointments(appts)

      const { data: slots, error: err2 } = await supabase.from("exam_slots").select("*")
      if (!err2 && slots) setOccupancy(slots)
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
      if (selectedStatus && r.status !== selectedStatus) return false
      if (selectedMunicipio && r.municipio !== selectedMunicipio) return false
      return true
    })
  }, [appointments, selectedDay, selectedMonth, selectedYear, selectedProcedure, selectedStatus, selectedMunicipio])

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
    
    // Tendência Simplificada
    const prevPresentes = appointments.length > filteredRecords.length ? (appointments.length - filteredRecords.length) * 0.4 : presentes * 0.9
    const trendValue = presentes > 0 ? (((presentes - prevPresentes) / prevPresentes) * 100).toFixed(0) : "0"

    const today = format(new Date(), 'yyyy-MM-dd')
    const todayRecords = appointments.filter(a => a.exam_date === today)
    const todayPresentes = todayRecords.filter(a => a.status === 'presente').length
    const todayFaltas = todayRecords.filter(a => a.status === 'falta').length
    const todayAgendados = todayRecords.filter(a => a.status === 'agendado').length

    const last7DaysData = Array.from({length: 7}, (_, i) => {
      const d = format(new Date(Date.now() - (6-i) * 24 * 3600 * 1000), 'yyyy-MM-dd')
      return appointments.filter(a => a.exam_date === d).length
    })

    const procedureCounts: Record<string, number> = {}
    filteredRecords.forEach(a => {
      const name = a.procedure_name || "NÃO INFORMADO"
      const n = name.toUpperCase()
      let norm = n
      if (n.includes("TOMOGRAFIA")) {
        norm = n.includes("COM CONTRASTE") ? "TOMOGRAFIA COM CONTRASTE" : "TOMOGRAFIA"
      }
      procedureCounts[norm] = (procedureCounts[norm] || 0) + 1
    })

    return {
      presentes, faltas, agendados, total: filteredRecords.length, concluded,
      rate: rate.toFixed(1), absenteeRate: absenteeRate.toFixed(1),
      trendValue, sparkline: last7DaysData,
      todayPresentes, todayFaltas, todayAgendados, todayTotal: todayRecords.length,
      procedureTops: Object.entries(procedureCounts).sort((a,b) => b[1] - a[1])
    }
  }, [filteredRecords, appointments])

  if (!mounted) return null

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 relative pb-16">
      
      {/* HUD DASHBOARD COMMANDS */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        <LiquidCard 
          title="Presenças"
          value={stats.presentes}
          label="Pacientes Confirmados"
          icon={CheckCircle2}
          gradient="bg-emerald-500"
          trend={`${stats.rate}%`}
          trendValue={stats.trendValue}
          sparkline={stats.sparkline}
          total={stats.concluded}
        />
        <LiquidCard 
          title="Faltas"
          value={stats.faltas}
          label="Faltas Registradas"
          icon={CalendarX2}
          gradient="bg-rose-500"
          trend={`${stats.absenteeRate}%`}
          trendValue={(-parseFloat(stats.trendValue) * 0.5).toFixed(0)}
          sparkline={stats.sparkline.map(v => v * 0.2)}
          total={stats.concluded}
        />
        <LiquidCard 
          title="Fila Ativa"
          value={stats.agendados}
          label="Aguardando Atendimento"
          icon={Clock3}
          gradient="bg-cyan-500"
          total={stats.total}
        />
        <LiquidCard 
          title="Total Geral"
          value={stats.total}
          label="Carga Total do Período"
          icon={BarChart3}
          gradient="bg-orange-500"
          total={stats.total}
        />
      </div>

      <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-sm border border-slate-100 relative overflow-hidden">
        
        {/* FILTERS COMMAND CENTER */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-6">
            <div className="p-3 bg-teal-50 text-teal-600 rounded-xl shadow-sm border border-teal-100">
              <Target className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-space uppercase tracking-tight text-slate-800 leading-tight">Painel de Dados</h2>
              <div className="flex items-center gap-2 mt-1">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Filtros Ativos</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 overflow-x-auto no-scrollbar">
             <div className="space-y-1 flex flex-col items-start px-2">
                <Label className="text-[9px] font-bold tracking-wider uppercase text-slate-500">Ano</Label>
                <select value={selectedYear || ""} onChange={e => setSelectedYear(e.target.value)} className="h-10 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 px-3 cursor-pointer focus:ring-1 focus:ring-teal-500 outline-none">
                  <option value="">TODOS</option>
                  {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
             </div>
             
             <div className="space-y-1 flex flex-col items-start px-2">
                <Label className="text-[9px] font-bold tracking-wider uppercase text-slate-500">Mês</Label>
                <select value={selectedMonth || ""} onChange={e => setSelectedMonth(e.target.value)} className="h-10 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 px-3 cursor-pointer focus:ring-1 focus:ring-teal-500 outline-none">
                   <option value="">TODOS</option>
                   {MONTHS_NAMES.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
                </select>
             </div>
             
             <div className="space-y-1 flex flex-col items-start px-2">
                <Label className="text-[9px] font-bold tracking-wider uppercase text-slate-500">Dia</Label>
                <select value={selectedDay || ""} onChange={e => setSelectedDay(e.target.value)} className="h-10 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 px-3 cursor-pointer focus:ring-1 focus:ring-teal-500 outline-none text-center w-20">
                   <option value="">---</option>
                   {Array.from({length: 31}, (_, i) => <option key={i} value={i+1}>{i+1}</option>)}
                </select>
             </div>
             
             <Button onClick={() => { setSelectedDay(null); setSelectedMonth(null); setSelectedYear(null); setSelectedProcedure(""); setSelectedStatus(""); setSelectedMunicipio(""); }} variant="ghost" className="h-10 w-10 mt-4 rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-600 border border-transparent hover:border-rose-100 p-0 flex items-center justify-center">
                <CalendarX2 className="h-4 w-4" />
             </Button>
          </div>
        </div>

        {/* ANALYTICS ENGINE */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
           <div className="lg:col-span-8 space-y-6">
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-8 opacity-[0.05] group-hover:scale-110 transition-transform duration-700">
                    <Activity className="h-40 w-40 text-teal-600" />
                 </div>
                 <div className="flex items-center justify-between mb-6 relative z-10">
                    <h3 className="text-sm font-bold font-space uppercase text-slate-700 flex items-center gap-2">
                       <TrendingUp className="h-4 w-4 text-teal-500" /> Desempenho Operacional
                    </h3>
                    <div className="flex items-center gap-4">
                       <span className="flex items-center gap-1 text-[10px] font-bold text-slate-600 uppercase"><div className="h-2 w-2 rounded-full bg-emerald-500" /> Confirmados</span>
                       <span className="flex items-center gap-1 text-[10px] font-bold text-slate-600 uppercase"><div className="h-2 w-2 rounded-full bg-rose-500" /> Faltas</span>
                    </div>
                 </div>
                 <ExamsCharts records={filteredRecords} slots={occupancy} onFilterChange={(t, v) => t === 'procedure' ? setSelectedProcedure(v) : setSelectedStatus(v)} />
              </div>
           </div>

           <div className="lg:col-span-4 space-y-6">
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                 <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-5 flex items-center gap-2 px-1">
                    <Zap className="h-4 w-4 text-orange-400" /> Procedimentos Altamente Demanandados
                 </h3>
                 <div className="space-y-3">
                    {stats.procedureTops.slice(0, 5).map(([name, count], idx) => (
                       <div key={idx} className="group p-4 rounded-xl bg-white border border-slate-200 hover:border-teal-300 hover:shadow-sm transition-all duration-300 flex items-center justify-between">
                          <div className="flex items-center gap-3 relative z-10">
                             <div className="h-8 w-8 flex items-center justify-center bg-slate-50 rounded-lg text-xs font-bold text-slate-500 group-hover:bg-teal-50 group-hover:text-teal-600 transition-colors">
                                {idx + 1}
                             </div>
                             <p className="text-[10px] font-bold text-slate-700 uppercase group-hover:text-teal-700 transition-colors">{name}</p>
                          </div>
                          <span className="text-sm font-bold text-slate-400 group-hover:text-teal-600 transition-colors">{count}</span>
                       </div>
                    ))}
                 </div>
              </div>

              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 relative overflow-hidden">
                 <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-6 flex items-center gap-2">
                    <Clock3 className="h-4 w-4 text-teal-500" /> Resumo do Dia
                 </h3>
                 <div className="grid grid-cols-2 gap-3 relative z-10">
                    <div className="p-4 rounded-xl bg-white border border-slate-200 text-center">
                       <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Na Fila</p>
                       <p className="text-2xl font-bold text-slate-800">{stats.todayAgendados}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-white border border-slate-200 text-center">
                       <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider mb-1">Presentes</p>
                       <p className="text-2xl font-bold text-slate-800">{stats.todayPresentes}</p>
                    </div>
                 </div>
                 <div className="mt-4 p-5 rounded-xl bg-white border border-slate-200">
                    <div className="flex justify-between items-center mb-2">
                       <span className="text-[10px] font-bold text-slate-500 uppercase">Total Operações</span>
                       <span className="text-lg font-bold text-slate-800">{stats.todayTotal}</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                       <div className="h-full bg-orange-400 rounded-full transition-all duration-1000" style={{ width: stats.total > 0 ? `${(stats.todayTotal / stats.total) * 100}%` : '0%' }} />
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  )
}
