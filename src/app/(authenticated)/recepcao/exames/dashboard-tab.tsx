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
  loading: () => <div className="h-[300px] w-full flex items-center justify-center animate-pulse bg-[#161B22] border border-white/5 rounded-[3rem]">Carregando gráficos estratégicos...</div>
})

const MONTHS_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
]

function LiquidCard({ title, value, label, icon: Icon, gradient, trend, trendValue, sparkline, total }: any) {
  const isPositive = parseFloat(trendValue) >= 0
  
  return (
    <div className={`card-csgo group relative overflow-hidden rounded-[2.5rem] p-6 text-white shadow-2xl transition-all duration-700 hover:scale-[1.05] h-[160px] border border-white/5`}>
      {/* Immersive Glow Overlay */}
      <div className={`absolute inset-0 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity duration-700 ${gradient}`} />
      
      <div className="relative z-10 flex flex-col h-full justify-between">
        <div className="flex items-center justify-between">
          <div className="rounded-[1.2rem] bg-[#161B22] p-3 border border-white/10 shadow-2xl group-hover:border-[#00D9FF]/30 transition-all">
            <Icon className="h-5 w-5 text-white/80 group-hover:text-[#00D9FF]" />
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[9px] font-black uppercase tracking-[0.4em] text-[#7E8C9A] mb-1">{title}</span>
            {trendValue && (
              <span className={`text-[10px] font-black flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/20 ${isPositive ? 'text-[#00FF88]' : 'text-[#FF1493]'}`}>
                {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {trendValue}%
              </span>
            )}
          </div>
        </div>
        
        <div className="flex items-end justify-between px-1">
          <div>
            <div className="flex items-baseline gap-2">
               <h4 className="text-4xl font-black font-space tracking-tighter leading-none">{value}</h4>
               {trend && <span className="text-[10px] font-black text-[#00D9FF] lowercase opacity-50 tracking-widest">{trend}</span>}
            </div>
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#7E8C9A] mt-2 line-clamp-1">{label}</p>
          </div>
          
          {sparkline && (
            <div className="h-10 w-20 opacity-30 group-hover:opacity-100 transition-all duration-700">
               <svg viewBox="0 0 100 30" className="h-full w-full overflow-visible">
                  <path 
                    d={`M ${sparkline.map((v: number, i: number) => `${i * 16},${30 - (v * 1)}`).join(' L ')}`} 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="4" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    className="text-[#00D9FF]"
                  />
               </svg>
            </div>
          )}
        </div>

        <div className="h-1.5 w-full bg-[#161B22] rounded-full overflow-hidden mt-3 border border-white/5">
           <div className={`h-full bg-gradient-to-r from-[#00D9FF] to-[#0088FF] rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(0,217,255,0.5)]`} style={{ width: total > 0 ? `${(value/total)*100}%` : '0%' }} />
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
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-1000 relative pb-32">
      
      {/* HUD DASHBOARD COMMANDS */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        <LiquidCard 
          title="Presence Logic"
          value={stats.presentes}
          label="Pacientes Confirmados"
          icon={CheckCircle2}
          gradient="bg-[#00FF88]"
          trend={`${stats.rate}%`}
          trendValue={stats.trendValue}
          sparkline={stats.sparkline}
          total={stats.concluded}
        />
        <LiquidCard 
          title="Absence Audit"
          value={stats.faltas}
          label="Faltas Registradas"
          icon={CalendarX2}
          gradient="bg-[#FF1493]"
          trend={`${stats.absenteeRate}%`}
          trendValue={(-parseFloat(stats.trendValue) * 0.5).toFixed(0)}
          sparkline={stats.sparkline.map(v => v * 0.2)}
          total={stats.concluded}
        />
        <LiquidCard 
          title="Active Queue"
          value={stats.agendados}
          label="Aguardando Atendimento"
          icon={Clock3}
          gradient="bg-[#00D9FF]"
          total={stats.total}
        />
        <LiquidCard 
          title="Terminal Total"
          value={stats.total}
          label="Carga Total do Período"
          icon={BarChart3}
          gradient="bg-[#FF6B35]"
          total={stats.total}
        />
      </div>

      <div className="card-csgo rounded-[4rem] p-10 lg:p-14 shadow-2xl relative overflow-hidden backdrop-blur-3xl">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#00D9FF] to-transparent" />
        
        {/* FILTERS COMMAND CENTER */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-12 mb-14">
          <div className="flex items-center gap-8">
            <div className="relative group">
              <div className="absolute inset-0 bg-[#00D9FF] blur-2xl opacity-20" />
              <div className="p-6 bg-gradient-to-br from-[#00D9FF] to-[#0088FF] text-white rounded-[2rem] shadow-2xl relative border border-white/20">
                <Target className="h-10 w-10" />
              </div>
            </div>
            <div>
              <h2 className="text-5xl font-black font-space uppercase tracking-tight text-white leading-tight">Data Terminal</h2>
              <div className="flex items-center gap-3 mt-3">
                <div className="h-2 w-2 rounded-full bg-[#00FF88] animate-pulse" />
                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-[#7E8C9A]">Filtros Estratégicos Ativos</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 bg-[#161B22] p-5 rounded-[2.5rem] border border-white/5 shadow-2xl overflow-x-auto no-scrollbar">
             <div className="space-y-1.5 flex flex-col items-center">
                <Label className="text-[8px] font-black tracking-[0.3em] uppercase text-[#7E8C9A]">Cycle Year</Label>
                <select value={selectedYear || ""} onChange={e => setSelectedYear(e.target.value)} className="h-12 bg-white/5 border-none rounded-xl text-[11px] font-black text-white px-6 focus:ring-2 focus:ring-[#00D9FF]/20">
                  <option value="">ALL YEARS</option>
                  {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
             </div>
             <div className="h-12 w-px bg-white/5 mx-2" />
             <div className="space-y-1.5 flex flex-col items-center">
                <Label className="text-[8px] font-black tracking-[0.3em] uppercase text-[#7E8C9A]">Operation Month</Label>
                <select value={selectedMonth || ""} onChange={e => setSelectedMonth(e.target.value)} className="h-12 bg-white/5 border-none rounded-xl text-[11px] font-black text-white px-6 focus:ring-2 focus:ring-[#00D9FF]/20">
                   <option value="">ALL MONTHS</option>
                   {MONTHS_NAMES.map((m, i) => <option key={i} value={i+1}>{m.toUpperCase()}</option>)}
                </select>
             </div>
             <div className="h-12 w-px bg-white/5 mx-2" />
             <div className="space-y-1.5 flex flex-col items-center">
                <Label className="text-[8px] font-black tracking-[0.3em] uppercase text-[#7E8C9A]">Specific Day</Label>
                <select value={selectedDay || ""} onChange={e => setSelectedDay(e.target.value)} className="h-12 bg-white/5 border-none rounded-xl text-[11px] font-black text-white px-6 focus:ring-2 focus:ring-[#00D9FF]/20 text-center w-24">
                   <option value="">---</option>
                   {Array.from({length: 31}, (_, i) => <option key={i} value={i+1}>{i+1}</option>)}
                </select>
             </div>
             <Button onClick={() => { setSelectedDay(null); setSelectedMonth(null); setSelectedYear(null); setSelectedProcedure(""); setSelectedStatus(""); setSelectedMunicipio(""); }} variant="ghost" className="h-12 w-12 rounded-xl text-[#FF1493] hover:bg-[#FF1493] hover:text-white transition-all ml-2">
                <CalendarX2 className="h-5 w-5" />
             </Button>
          </div>
        </div>

        {/* ANALYTICS ENGINE */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
           <div className="lg:col-span-8 space-y-10">
              <div className="bg-[#161B22]/50 rounded-[3rem] p-10 border border-white/5 shadow-2xl relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-12 opacity-[0.02] group-hover:scale-125 transition-transform duration-1000">
                    <Activity className="h-64 w-64 text-white" />
                 </div>
                 <div className="flex items-center justify-between mb-10 relative z-10">
                    <h3 className="text-2xl font-black font-space uppercase tracking-widest text-[#00D9FF] flex items-center gap-4">
                       <TrendingUp className="h-6 w-6" /> Performance Map
                    </h3>
                    <div className="flex items-center gap-6">
                       <span className="flex items-center gap-2 text-[9px] font-black text-[#00FF88] uppercase tracking-[0.2em]"><div className="h-2 w-2 rounded-full bg-[#00FF88]" /> Confirmados</span>
                       <span className="flex items-center gap-2 text-[9px] font-black text-[#FF1493] uppercase tracking-[0.2em]"><div className="h-2 w-2 rounded-full bg-[#FF1493]" /> Absenteísmo</span>
                    </div>
                 </div>
                 <ExamsCharts records={filteredRecords} slots={occupancy} onFilterChange={(t, v) => t === 'procedure' ? setSelectedProcedure(v) : setSelectedStatus(v)} />
              </div>
           </div>

           <div className="lg:col-span-4 space-y-8">
              <div className="bg-[#161B22]/50 rounded-[3rem] p-8 border border-white/5 shadow-2xl">
                 <h3 className="text-[11px] font-black uppercase tracking-[0.5em] text-[#7E8C9A] mb-8 flex items-center gap-4 px-2">
                    <Zap className="h-4 w-4 text-[#FF6B35]" /> Core Procedures
                 </h3>
                 <div className="space-y-4">
                    {stats.procedureTops.slice(0, 5).map(([name, count], idx) => (
                       <div key={idx} className="group p-5 rounded-2xl bg-[#0F1419] border border-white/[0.03] hover:border-[#00D9FF]/40 transition-all duration-500 flex items-center justify-between relative overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.01] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                          <div className="flex items-center gap-4 relative z-10">
                             <div className="h-10 w-10 flex items-center justify-center bg-white/5 rounded-xl text-[10px] font-black text-white group-hover:bg-[#00D9FF] group-hover:text-[#0F1419] transition-all">
                                {idx + 1}
                             </div>
                             <p className="text-[10px] font-black text-white uppercase tracking-tight group-hover:text-[#00D9FF] transition-colors">{name}</p>
                          </div>
                          <span className="text-lg font-black font-space text-white/50 relative z-10 group-hover:text-white transition-colors">{count}</span>
                       </div>
                    ))}
                 </div>
              </div>

              <div className="bg-[#161B22]/50 rounded-[3rem] p-8 border border-white/5 shadow-2xl relative overflow-hidden">
                 <div className="absolute bottom-0 right-0 p-8 opacity-[0.03]">
                    <BarChart3 className="h-40 w-40 text-white" />
                 </div>
                 <h3 className="text-[11px] font-black uppercase tracking-[0.5em] text-[#7E8C9A] mb-8 px-2 flex items-center gap-4">
                    <Clock3 className="h-4 w-4 text-[#00FF88]" /> Today Analysis
                 </h3>
                 <div className="grid grid-cols-2 gap-4 relative z-10">
                    <div className="p-5 rounded-2xl bg-[#0F1419]/80 border border-white/5 text-center">
                       <p className="text-[8px] font-black text-[#7E8C9A] uppercase tracking-widest mb-1">Queue Size</p>
                       <p className="text-3xl font-black text-white font-space">{stats.todayAgendados}</p>
                    </div>
                    <div className="p-5 rounded-2xl bg-[#0F1419]/80 border border-white/5 text-center">
                       <p className="text-[8px] font-black text-[#00FF88] uppercase tracking-widest mb-1">Pass Rate</p>
                       <p className="text-3xl font-black text-white font-space">{stats.todayPresentes}</p>
                    </div>
                 </div>
                 <div className="mt-4 p-6 rounded-2xl bg-[#0F1419]/80 border border-white/5 group hover:border-[#FF6B35]/40 transition-all">
                    <div className="flex justify-between items-center mb-3">
                       <span className="text-[9px] font-black text-[#7E8C9A] uppercase tracking-widest">Total Operation Volume</span>
                       <span className="text-xl font-black font-space text-white">{stats.todayTotal}</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                       <div className="h-full bg-[#FF6B35] rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(255,107,53,0.4)]" style={{ width: stats.total > 0 ? `${(stats.todayTotal / stats.total) * 100}%` : '0%' }} />
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  )
}
