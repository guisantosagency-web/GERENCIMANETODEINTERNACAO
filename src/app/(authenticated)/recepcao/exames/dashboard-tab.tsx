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
  loading: () => <div className="h-[300px] w-full flex items-center justify-center animate-pulse bg-slate-50 rounded-[2rem]">Carregando gráficos...</div>
})

const MONTHS_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
]

function LiquidCard({ title, value, label, icon: Icon, gradient, trend, total }: any) {
  const percentage = total > 0 ? ((value / total) * 100).toFixed(0) : 0
  
  return (
    <div className={`group relative overflow-hidden rounded-2xl p-4 text-white shadow-lg transition-all duration-500 hover:scale-[1.02] hover:shadow-xl ${gradient} h-[130px]`}>
      {/* Liquid Overlay Effect - Scaled down */}
      <div className="absolute -right-2 -top-2 h-24 w-24 rounded-full bg-white/10 blur-2xl transition-all duration-700 group-hover:scale-125 hover:bg-white/20" />
      
      <div className="relative z-10 flex flex-col h-full justify-between">
        <div className="flex items-center justify-between">
          <div className="rounded-lg bg-white/20 p-2 backdrop-blur-md border border-white/20 shadow-inner">
            <Icon className="h-4 w-4" />
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[8px] font-black uppercase tracking-[0.2em] bg-black/10 px-2 py-0.5 rounded-full backdrop-blur-sm border border-white/5">{title}</span>
            {total > 0 && <span className="text-[10px] font-black mt-1 text-white/60">{percentage}% do total</span>}
          </div>
        </div>
        
        <div className="mt-2">
          <div className="flex items-baseline gap-1">
             <h4 className="text-3xl font-black font-space tracking-tight">{value}</h4>
             {trend && <span className="text-[10px] font-bold bg-white/20 px-1.5 py-0.5 rounded-md backdrop-blur-sm ml-1">{trend}</span>}
          </div>
          <p className="text-[9px] font-bold uppercase tracking-widest opacity-80 mt-0.5 line-clamp-1">{label}</p>
        </div>

        {/* Improved Mini Progress Bar */}
        <div className="mt-auto h-1 w-full bg-black/10 rounded-full overflow-hidden">
           <div className="h-full bg-white/50 rounded-full" style={{ width: total > 0 ? `${(value/total)*100}%` : '0%' }} />
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

  // Filters
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<string | null>(new Date().getMonth() + 1 + "")
  const [selectedYear, setSelectedYear] = useState<string | null>(new Date().getFullYear().toString())
  const [selectedProcedure, setSelectedProcedure] = useState<string | null>("")
  const [selectedStatus, setSelectedStatus] = useState<string | null>("")
  const [selectedMunicipio, setSelectedMunicipio] = useState<string | null>("")

  const supabase = useMemo(() => createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!), [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.from("exam_appointments").select("*").neq("status", "cancelado").order("exam_date", { ascending: false })
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
    
    const today = format(new Date(), 'yyyy-MM-dd')
    const todayRecords = appointments.filter(a => a.exam_date === today)
    const todayPresentes = todayRecords.filter(a => a.status === 'presente').length
    const todayFaltas = todayRecords.filter(a => a.status === 'falta').length
    const todayAgendados = todayRecords.filter(a => a.status === 'agendado').length

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
      todayPresentes, todayFaltas, todayAgendados, todayTotal: todayRecords.length,
      procedureTops: Object.entries(procedureCounts).sort((a,b) => b[1] - a[1])
    }
  }, [filteredRecords, appointments])

  if (!mounted) return null

  return (
    <div className="space-y-6 pb-10 animate-in fade-in duration-700 max-w-[1600px] mx-auto">
      
      {/* HEADER & FILTERS - COMPACT VERSION */}
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 rounded-[2.5rem] blur-xl" />
        <div className="glass-card bg-white/70 backdrop-blur-xl border border-white/40 rounded-[2.5rem] p-6 shadow-sm relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            
            {/* Title Section */}
            <div className="lg:col-span-4 flex items-center gap-4">
              <div className="relative">
                 <div className="absolute inset-0 bg-blue-500 blur-lg opacity-20 animate-pulse" />
                 <div className="h-12 w-12 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg relative">
                    <Target className="h-6 w-6" />
                 </div>
              </div>
              <div>
                <h2 className="text-xl font-black font-space uppercase tracking-tight text-slate-800">Analytics Exames</h2>
                <div className="flex items-center gap-2 mt-0.5">
                   <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                   <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Tempo Real · {format(new Date(), "MMMM / yyyy", { locale: ptBR })}</p>
                </div>
              </div>
            </div>

            {/* Compact Filters Row */}
            <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                { label: "Ano", value: selectedYear, onChange: setSelectedYear, opts: availableYears.map(y => ({ v: y, l: y })) },
                { label: "Mês", value: selectedMonth, onChange: setSelectedMonth, opts: MONTHS_NAMES.map((m, i) => ({ v: (i+1).toString(), l: m })) },
                { label: "Dia", value: selectedDay, onChange: setSelectedDay, opts: Array.from({length: 31}, (_, i) => ({ v: (i+1).toString().padStart(2, '0'), l: (i+1).toString().padStart(2, '0') })) },
                { label: "Status", value: selectedStatus, onChange: setSelectedStatus, opts: [{ v: "agendado", l: "Agendado" }, { v: "presente", l: "Presente" }, { v: "falta", l: "Falta" }] },
              ].map(f => (
                <div key={f.label} className="relative">
                  <select
                    value={f.value || ""}
                    onChange={e => f.onChange(e.target.value || null)}
                    className="w-full h-10 pl-3 pr-8 bg-slate-50 border-none rounded-xl text-[10px] font-black uppercase tracking-wider text-slate-600 appearance-none cursor-pointer focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner"
                  >
                    <option value="">{f.label}: Todos</option>
                    {f.opts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                  </select>
                  <RefreshCw className="absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-300 pointer-events-none" />
                </div>
              ))}
              <div className="relative md:col-span-1">
                <Button 
                  variant="ghost" 
                  onClick={loadData} 
                  disabled={isLoading}
                  className="w-full h-10 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 font-black text-[10px] uppercase tracking-widest gap-2"
                >
                  {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                  Atualizar
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI GRID - FLUID & GLASS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <LiquidCard 
          title="Volume" 
          value={stats.total} 
          label="Total de Procedimentos" 
          icon={BarChart3} 
          gradient="bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 shadow-blue-500/25"
          total={stats.total}
        />
        <LiquidCard 
          title="Atendimento" 
          value={stats.presentes} 
          label="Pacientes Presentes" 
          icon={CheckCircle2} 
          gradient="bg-gradient-to-br from-emerald-500 via-emerald-400 to-teal-500 shadow-emerald-500/25"
          trend={`${stats.rate}%`}
          total={stats.total}
        />
        <LiquidCard 
          title="Absenteísmo" 
          value={stats.faltas} 
          label="Pacientes Faltosos" 
          icon={CalendarX2} 
          gradient="bg-gradient-to-br from-rose-500 via-rose-400 to-pink-500 shadow-rose-500/25"
          trend={`${stats.absenteeRate}%`}
          total={stats.total}
        />
        <LiquidCard 
          title="Fila" 
          value={stats.agendados} 
          label="Aguardando Atendimento" 
          icon={Clock3} 
          gradient="bg-gradient-to-br from-amber-500 via-orange-400 to-orange-500 shadow-amber-500/25"
          total={stats.total}
        />
      </div>

      {/* DASHBOARD MIDDLE SECTION */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        
        {/* EFFICIENCY & TRENDS */}
        <div className="xl:col-span-4 grid grid-cols-1 gap-4">
           {/* Compact Efficiency Card */}
            <div className="glass-card bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:shadow-md transition-all flex items-center justify-between gap-4 h-[110px]">
              <div className="space-y-0.5">
                 <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Eficiência Geral</p>
                 <h4 className="text-[10px] font-black text-slate-700 uppercase">Taxa de Presença</h4>
                 <div className="flex items-center gap-2 mt-2">
                    <span className="text-2xl font-black font-space text-emerald-600">{stats.rate}%</span>
                    <div className="h-6 w-[1px] bg-slate-100 rounded-full" />
                    <div className="text-[8px] font-bold text-slate-400 leading-none">
                       {stats.presentes} ATENDIMENTOS<br/>REALIZADOS
                    </div>
                 </div>
              </div>
              <div className="relative h-14 w-14 flex items-center justify-center">
                 <svg className="h-full w-full -rotate-90">
                    <circle cx="28" cy="28" r="24" className="fill-none stroke-slate-100 stroke-[4]" />
                    <circle 
                      cx="28" cy="28" r="24" 
                      className="fill-none stroke-emerald-500 stroke-[5] transition-all duration-1000 ease-out" 
                      strokeDasharray={`${2 * Math.PI * 24}`}
                      strokeDashoffset={`${2 * Math.PI * 24 * (1 - parseFloat(stats.rate) / 100)}`}
                      strokeLinecap="round"
                    />
                 </svg>
                 <Zap className="absolute h-4 w-4 text-emerald-500 opacity-20" />
              </div>
           </div>

           <div className="glass-card bg-slate-900 border-none rounded-2xl p-4 text-white shadow-xl shadow-slate-900/10 flex flex-col justify-between overflow-hidden relative group h-[110px]">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500 opacity-10 blur-2xl rounded-full" />
              <div className="flex items-center justify-between relative z-10">
                 <div>
                    <p className="text-[8px] font-black uppercase tracking-widest text-white/40">Hoje · {format(new Date(), "dd 'de' MMM", { locale: ptBR })}</p>
                    <h4 className="text-[10px] font-black uppercase mt-0.5">Status do Dia</h4>
                 </div>
                 <CalendarDays className="h-4 w-4 text-blue-400" />
              </div>
 
              <div className="grid grid-cols-3 gap-2 mt-2 relative z-10">
                 {[
                    { l: "Agend", v: stats.todayAgendados, c: "bg-blue-500/10 text-blue-400" },
                    { l: "Presens", v: stats.todayPresentes, c: "bg-emerald-500/10 text-emerald-400" },
                    { l: "Faltas", v: stats.todayFaltas, c: "bg-rose-500/10 text-rose-400" }
                 ].map(s => (
                    <div key={s.l} className={`${s.c} rounded-xl p-1.5 text-center border border-white/5`}>
                       <span className="text-lg font-black font-space leading-none">{s.v}</span>
                       <p className="text-[7px] font-bold uppercase tracking-widest opacity-60 mt-0.5 leading-none">{s.l}</p>
                    </div>
                 ))}
              </div>
           </div>

           {/* New Procedure Summary Card */}
           <div className="glass-card bg-white border border-slate-100 rounded-[2rem] p-4 shadow-sm overflow-hidden flex flex-col relative group h-[180px]">
             <div className="flex items-center justify-between mb-3">
                <div>
                   <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Distribuição</p>
                   <h4 className="text-[10px] font-black uppercase text-slate-700">Por Procedimento</h4>
                </div>
                <Activity className="h-3 w-3 text-purple-500" />
             </div>
             
             <div className="flex-1 space-y-1.5 overflow-y-auto custom-scrollbar pr-1">
                {stats.procedureTops.length === 0 ? (
                  <p className="text-[9px] font-bold text-slate-300 uppercase text-center py-4">Sem registros...</p>
                ) : stats.procedureTops.map(([name, qty]) => (
                  <div key={name} className="flex items-center justify-between p-2 bg-slate-50/50 rounded-xl border border-slate-50 hover:border-purple-100 transition-colors">
                    <span className="text-[8px] font-black text-slate-600 uppercase truncate max-w-[130px]">{name}</span>
                    <span className="px-2 py-0.5 bg-white border border-slate-100 rounded text-[10px] font-black text-purple-600 shadow-sm">{qty}</span>
                  </div>
                ))}
             </div>
           </div>
        </div>

        {/* CHARTS SECTION - EXPANDED */}
        <div className="xl:col-span-8 glass-card bg-white/40 backdrop-blur-md rounded-[2.5rem] p-6 border border-white/50 shadow-sm min-h-[400px]">
           <ExamsCharts 
             records={filteredRecords}
             onFilterChange={(type, val) => {
               if (type === 'status') setSelectedStatus(prev => prev === val ? "" : (val || ""))
               if (type === 'month') setSelectedMonth(prev => prev === val ? null : val)
             }}
           />
        </div>
      </div>

      {/* DETAIL FILTERS BAR */}
      <div className="flex flex-wrap items-center gap-3 px-2">
         <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
            <Info className="h-3 w-3" /> Detalhar por:
         </div>
         
         <div className="flex items-center gap-2">
            <select value={selectedProcedure || ""} onChange={e => setSelectedProcedure(e.target.value)} className="h-8 bg-white border border-slate-200 rounded-full px-4 text-[9px] font-black uppercase tracking-widest text-slate-500 cursor-pointer shadow-sm focus:ring-0">
               <option value="">Todos os Procedimentos</option>
               {availableProcedures.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <select value={selectedMunicipio || ""} onChange={e => setSelectedMunicipio(e.target.value)} className="h-8 bg-white border border-slate-200 rounded-full px-4 text-[9px] font-black uppercase tracking-widest text-slate-500 cursor-pointer shadow-sm focus:ring-0">
               <option value="">Todos os Municípios</option>
               {availableMunicipios.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
         </div>

         {(selectedProcedure || selectedMunicipio || selectedStatus || selectedDay) && (
            <button 
              onClick={() => { setSelectedProcedure(""); setSelectedMunicipio(""); setSelectedStatus(""); setSelectedDay(null) }}
              className="text-[9px] font-black uppercase text-rose-500 hover:text-rose-600 transition-colors ml-2"
            >
               Limpar Filtros ✕
            </button>
         )}
      </div>

    </div>
  )
}
