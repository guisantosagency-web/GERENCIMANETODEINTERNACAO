"use client"

import { useState, useMemo, useEffect } from "react"
import dynamic from "next/dynamic"
import { createBrowserClient } from "@supabase/ssr"
import { StatCard } from "@/components/stat-card"
import { Activity, CalendarDays, BarChart3, Search, Calendar, Edit2, Trash2, CalendarX2, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
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
    <div className="flex flex-wrap items-center gap-3">
      {/* Dia Filter */}
      <div className="relative group/filter">
        <select
          value={selectedDay || ""}
          onChange={(e) => onDayChange(e.target.value || null)}
          className="appearance-none bg-accent/30 hover:bg-accent border border-white/5 px-4 py-2 pl-10 pr-10 rounded-xl text-sm font-bold shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary backdrop-blur-md cursor-pointer"
        >
          <option value="">Todos os Dias</option>
          {days.map((d) => <option key={d} value={d.padStart(2, '0')}>{d.padStart(2, '0')}</option>)}
        </select>
        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-hover/filter:text-primary transition-colors" />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground opacity-50 text-[10px] hidden sm:block">▼</div>
      </div>

      {/* Mês Filter */}
      <div className="relative group/filter">
        <select
          value={selectedMonth || ""}
          onChange={(e) => onMonthChange(e.target.value || null)}
          className="appearance-none bg-accent/30 hover:bg-accent border border-white/5 px-4 py-2 pl-10 pr-10 rounded-xl text-sm font-bold shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary backdrop-blur-md cursor-pointer"
        >
          <option value="">Todos os Meses</option>
          {months.map((m) => <option key={m} value={m}>{MONTHS_NAMES[parseInt(m) - 1]}</option>)}
        </select>
        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-hover/filter:text-primary transition-colors" />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground opacity-50 text-[10px] hidden sm:block">▼</div>
      </div>

      {/* Ano Filter */}
      <div className="relative group/filter">
        <select
          value={selectedYear || ""}
          onChange={(e) => onYearChange(e.target.value || null)}
          className="appearance-none bg-accent/30 hover:bg-accent border border-white/5 px-4 py-2 pl-10 pr-10 rounded-xl text-sm font-bold shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary backdrop-blur-md cursor-pointer"
        >
          <option value="">Todos os Anos</option>
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-hover/filter:text-primary transition-colors" />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground opacity-50 text-[10px] hidden sm:block">▼</div>
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

    return {
      presentes,
      faltas,
      total: presentes + faltas,
    }
  }, [filteredRecords])

  if (!mounted) return null

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      {/* STICKY HEADER CONTAINER */}
      <div className="sticky top-0 z-40 -mx-4 px-4 py-4 bg-background/40 backdrop-blur-xl border-b border-border/10">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="p-4 rounded-[2.5rem] glass-card shadow-premium relative border border-white/10 flex flex-col sm:flex-row gap-4 justify-between items-center z-10">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-primary to-purple-500 opacity-50" />
             <div className="flex items-center gap-2 px-2 text-sm font-bold uppercase tracking-widest text-muted-foreground">
               <Search className="h-4 w-4" />
               Filtros
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard title="Total Geral Escalonado" value={stats.total} subtitle="Exames (Presentes + Faltas)" icon={BarChart3} variant="primary" className="!rounded-[1.5rem]" />
            <StatCard title="Total Presentes" value={stats.presentes} subtitle="Pacientes Atendidos" icon={Users} variant="accent" className="!rounded-[1.5rem]" />
            <StatCard title="Total Faltas" value={stats.faltas} subtitle="Pacientes Ausentes" icon={CalendarX2} variant="warning" className="!rounded-[1.5rem]" />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="h-[400px] w-full flex items-center justify-center animate-pulse bg-card/20 rounded-[2.5rem] mt-8">
          Carregando dados...
        </div>
      ) : records.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center opacity-40">
           <BarChart3 className="h-12 w-12 mb-4" />
           <p className="font-space font-bold tracking-widest uppercase">Nenhum registro encontrado.</p>
        </div>
      ) : (
        <div className="space-y-6 pb-20">
          <ExamsCharts records={filteredRecords} />
          
          <div className="glass-card !bg-card/40 border-none rounded-[2rem] p-6 shadow-sm overflow-hidden">
             <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-black font-space uppercase tracking-tight flex items-center gap-2">
                   <Activity className="h-5 w-5 text-primary" />
                   Detalhamento de Registros
                </h3>
             </div>

             <div className="overflow-x-auto">
               <table className="w-full text-left text-xs uppercase font-bold tracking-widest whitespace-nowrap">
                 <thead className="bg-muted/50 text-muted-foreground border-b border-border/10">
                   <tr>
                     <th className="p-3">Data</th>
                     <th className="p-3">Procedimento</th>
                     <th className="p-3 text-center">Presentes</th>
                     <th className="p-3 text-center">Faltas</th>
                     <th className="p-3 text-right">Ações</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-border/5">
                   {filteredRecords.map(r => (
                     <tr key={r.id} className="hover:bg-muted/20 transition-colors group">
                       <td className="p-3">{format(parseISO(r.date), 'dd/MM/yyyy')}</td>
                       <td className="p-3 font-black text-primary">{r.exame}</td>
                       <td className="p-3 text-center">
                          <span className="bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded-lg">{r.presentes}</span>
                       </td>
                       <td className="p-3 text-center">
                          <span className="bg-red-500/10 text-red-500 px-2 py-1 rounded-lg">{r.faltas}</span>
                       </td>
                       <td className="p-3 text-right">
                          {/* Somente Admin deleta */}
                          {/* Note: In this context, we need the user from useAuth */}
                          <AdminDeleteButton recordId={r.id} onLoad={loadData} supabase={supabase} />
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
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
      className="h-8 w-8 text-red-500 hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
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
