"use client"

import { useState, useMemo, useEffect } from "react"
import dynamic from "next/dynamic"
import { createBrowserClient } from "@supabase/ssr"
import { StatCard } from "@/components/stat-card"
import { Activity, CalendarDays, BarChart3, Search, Calendar, Edit2, Trash2, CalendarX2, Users, Download, Filter, TrendingUp, Info, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { format, parseISO } from "date-fns"
import { useAuth } from "@/lib/auth-context"

const ExamsCharts = dynamic(() => import("@/components/exams-charts").then(m => m.ExamsCharts), { 
  ssr: false,
  loading: () => <div className="h-[400px] w-full flex items-center justify-center animate-pulse bg-card/20 rounded-[2.5rem]">Carregando gráficos...</div>
})

interface TopFilterButtonsProps {
  days: string[]
  months: string[]
  years: string[]
  selectedDay: string | null
  selectedMonth: string | null
  selectedYear: string | null
  onDayChange: (v: string | null) => void
  onMonthChange: (v: string | null) => void
  onYearChange: (v: string | null) => void
}

const MONTHS_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
]

function ExamsFilterButtons({
  days,
  months,
  years,
  selectedDay,
  selectedMonth,
  selectedYear,
  onDayChange,
  onMonthChange,
  onYearChange,
}: TopFilterButtonsProps) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      {/* Dia Filter */}
      <div className="relative group/filter flex flex-col gap-1.5">
        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Dia</Label>
        <div className="relative">
          <select
            value={selectedDay || ""}
            onChange={(e) => onDayChange(e.target.value || null)}
            className="appearance-none bg-white border border-slate-100 hover:border-blue-200 px-4 py-3 pl-10 pr-10 rounded-2xl text-xs font-black shadow-sm transition-all focus:outline-none focus:ring-4 focus:ring-blue-500/10 cursor-pointer w-40 uppercase"
          >
            <option value="">Todos</option>
            {days.map((d) => <option key={d} value={d.padStart(2, '0')}>{d.padStart(2, '0')}</option>)}
          </select>
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-500 transition-colors" />
        </div>
      </div>

      {/* Mês Filter */}
      <div className="relative group/filter flex flex-col gap-1.5">
        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Mês</Label>
        <div className="relative">
          <select
            value={selectedMonth || ""}
            onChange={(e) => onMonthChange(e.target.value || null)}
            className="appearance-none bg-white border border-slate-100 hover:border-blue-200 px-4 py-3 pl-10 pr-10 rounded-2xl text-xs font-black shadow-sm transition-all focus:outline-none focus:ring-4 focus:ring-blue-500/10 cursor-pointer w-48 uppercase"
          >
            <option value="">Todos</option>
            {months.map((m) => <option key={m} value={m}>{MONTHS_NAMES[parseInt(m) - 1]}</option>)}
          </select>
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-500 transition-colors" />
        </div>
      </div>

      {/* Ano Filter */}
      <div className="relative group/filter flex flex-col gap-1.5">
        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Ano</Label>
        <div className="relative">
          <select
            value={selectedYear || ""}
            onChange={(e) => onYearChange(e.target.value || null)}
            className="appearance-none bg-white border border-slate-100 hover:border-blue-200 px-4 py-3 pl-10 pr-10 rounded-2xl text-xs font-black shadow-sm transition-all focus:outline-none focus:ring-4 focus:ring-blue-500/10 cursor-pointer w-32 uppercase"
          >
            <option value="">Todos</option>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-purple-500 transition-colors" />
        </div>
      </div>
    </div>
  )
}

export type DailyExamRecord = {
  id: string
  date: string
  exame: string
  presentes: number
  faltas: number
}

export default function ExamesDashboardTab() {
  const [mounted, setMounted] = useState(false)
  const [records, setRecords] = useState<DailyExamRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<string | null>(new Date().getMonth() + 1 + "")
  const [selectedYear, setSelectedYear] = useState<string | null>(new Date().getFullYear().toString())

  const supabase = useMemo(
    () => createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!),
    [],
  )

  const loadData = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.from("daily_exams").select("*").order('date', { ascending: false })
      if (!error && data) {
        setRecords(data)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    setMounted(true)
    loadData()
  }, [])

  const availableDays = useMemo(() => Array.from({ length: 31 }, (_, i) => (i + 1).toString()), [])
  const availableMonths = useMemo(() => Array.from({ length: 12 }, (_, i) => (i + 1).toString()), [])
  const availableYears = useMemo(() => {
    const years = new Set<string>()
    records.forEach(r => years.add(r.date.substring(0, 4)))
    const currentYear = new Date().getFullYear().toString()
    years.add(currentYear)
    return Array.from(years).sort().reverse()
  }, [records])

  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const year = r.date.substring(0, 4)
      const month = parseInt(r.date.substring(5, 7)).toString()
      const day = r.date.substring(8, 10)
      
      if (selectedYear && year !== selectedYear) return false
      if (selectedMonth && month !== selectedMonth) return false
      if (selectedDay && day !== selectedDay.padStart(2, '0')) return false
      
      return true
    })
  }, [records, selectedDay, selectedMonth, selectedYear])

  const stats = useMemo(() => {
    let presentes = 0
    let faltas = 0

    filteredRecords.forEach(r => {
      presentes += (r.presentes || 0)
      faltas += (r.faltas || 0)
    })

    const total = presentes + faltas
    const rate = total > 0 ? ((presentes / total) * 100).toFixed(1) : "0"

    return {
      presentes,
      faltas,
      total,
      rate
    }
  }, [filteredRecords])

  if (!mounted) return null

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-700">
      
      {/* PREMIUM HEADER CONTROLS */}
      <div className="glass-card !bg-white/40 border-none rounded-[3rem] p-8 lg:p-10 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -mr-20 -mt-20" />
        
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 relative z-10">
          <div>
             <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg">
                   <TrendingUp className="h-6 w-6" />
                </div>
                <h2 className="text-3xl font-black font-space uppercase tracking-tight text-slate-800">Indicadores de Desempenho</h2>
             </div>
             <p className="text-slate-400 font-bold ml-16 flex items-center gap-2 uppercase text-[10px] tracking-widest">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Dados em Tempo Real • {MONTHS_NAMES[parseInt(selectedMonth || "1") - 1]} / {selectedYear}
             </p>
          </div>

          <ExamsFilterButtons
            days={availableDays}
            months={availableMonths}
            years={availableYears}
            selectedDay={selectedDay}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            onDayChange={setSelectedDay}
            onMonthChange={setSelectedMonth}
            onYearChange={setSelectedYear}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-10">
           <StatCard title="Volume Total" value={stats.total} subtitle="Procedimentos Realizados" icon={BarChart3} variant="primary" className="!rounded-[2rem] shadow-premium h-full border-none bg-white/80" />
           <StatCard title="Presença Confirmada" value={stats.presentes} subtitle="Pacientes Atendidos" icon={Users} variant="accent" className="!rounded-[2rem] shadow-premium h-full border-none bg-white/80" />
           <StatCard title="Faltas / Ausências" value={stats.faltas} subtitle="Pacientes Não Compareceram" icon={CalendarX2} variant="warning" className="!rounded-[2rem] shadow-premium h-full border-none bg-white/80" />
           
           <div className="glass-card bg-emerald-600 rounded-[2.5rem] p-6 text-white shadow-emerald-500/20 shadow-2xl flex flex-col justify-between group transition-all hover:scale-[1.02]">
              <div className="flex justify-between items-start">
                 <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                    <Activity className="h-6 w-6" />
                 </div>
                 <div className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Eficiência</div>
              </div>
              <div>
                <div className="text-4xl font-black font-space mb-1 group-hover:scale-110 transition-transform origin-left">{stats.rate}%</div>
                <div className="text-[10px] font-black uppercase tracking-widest opacity-80">Taxa de Conversão</div>
              </div>
              <div className="mt-3 w-full bg-white/20 h-1.5 rounded-full overflow-hidden">
                 <div className="bg-white h-full transition-all duration-1000" style={{ width: `${stats.rate}%` }} />
              </div>
           </div>
        </div>
      </div>

      {isLoading ? (
        <div className="h-[400px] w-full flex flex-col items-center justify-center gap-4 bg-white/20 backdrop-blur-md rounded-[3rem] border-2 border-dashed border-white/40">
           <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
           <p className="font-black text-xs uppercase tracking-[0.3em] text-blue-500/60">Sincronizando BI Dashboard...</p>
        </div>
      ) : records.length === 0 ? (
        <div className="h-80 flex flex-col items-center justify-center opacity-30 text-slate-400">
           <BarChart3 className="h-20 w-20 mb-6 stroke-[1px]" />
           <p className="text-xl font-black font-space tracking-widest uppercase">Base de Dados Vazia para este Filtro</p>
        </div>
      ) : (
        <div className="space-y-8 pb-10">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            {/* Visual Analytics */}
            <div className="xl:col-span-8 flex flex-col gap-8">
               <ExamsCharts records={filteredRecords} />
            </div>

            {/* Detailed Table Side-bar inspired by Anexo 2 */}
            <div className="xl:col-span-4">
               <div className="glass-card bg-white border-none rounded-[3rem] p-8 shadow-2xl h-full flex flex-col">
                  <div className="flex items-center justify-between mb-8">
                     <h3 className="text-lg font-black font-space uppercase tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-slate-100 rounded-xl"><Info className="h-5 w-5 text-slate-500" /></div>
                        Logs de Realização
                     </h3>
                     <Button variant="ghost" size="icon" className="rounded-xl bg-slate-50 text-slate-400 hover:text-blue-500 transition-all">
                        <Download className="h-4 w-4" />
                     </Button>
                  </div>

                  <div className="flex-1 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar space-y-4">
                     {filteredRecords.map(r => (
                       <div key={r.id} className="p-5 bg-slate-50 hover:bg-slate-100/80 border border-slate-100 rounded-[2rem] transition-all group relative overflow-hidden">
                          <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                             <AdminDeleteButton recordId={r.id} onLoad={loadData} supabase={supabase} />
                          </div>
                          <div className="flex justify-between items-start mb-3">
                             <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">{format(parseISO(r.date), 'dd MMM yyyy')}</div>
                          </div>
                          <h4 className="font-black text-slate-800 text-sm uppercase tracking-tight mb-4 flex items-center gap-2">
                             <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                             {r.exame}
                          </h4>
                          <div className="flex items-center gap-4">
                             <div className="flex-1 bg-white p-3 rounded-2xl shadow-sm border border-slate-50">
                                <div className="text-[9px] font-black uppercase text-emerald-500 mb-0.5 tracking-tighter">Presentes</div>
                                <div className="text-xl font-black font-space text-slate-700 leading-none">{r.presentes}</div>
                             </div>
                             <div className="flex-1 bg-white p-3 rounded-2xl shadow-sm border border-slate-50">
                                <div className="text-[9px] font-black uppercase text-red-500 mb-0.5 tracking-tighter">Faltas</div>
                                <div className="text-xl font-black font-space text-slate-700 leading-none">{r.faltas}</div>
                             </div>
                          </div>
                       </div>
                     ))}
                  </div>

                  <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between opacity-50">
                     <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total de Registros na Fila</div>
                     <div className="text-sm font-black text-slate-700">{filteredRecords.length}</div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function AdminDeleteButton({ recordId, onLoad, supabase }: { recordId: string, onLoad: () => void, supabase: any }) {
  const { user } = useAuth()
  if (user?.role !== "admin") return null

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      className="h-8 w-8 text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
      onClick={async () => {
        if (confirm("Deseja realmente excluir este registro de estatística?")) {
           const { error } = await supabase.from("daily_exams").delete().eq("id", recordId)
           if (error) alert("Erro ao excluir")
           else onLoad()
        }
      }}
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  )
}
