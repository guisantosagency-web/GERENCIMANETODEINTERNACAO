"use client"

import { useState, useMemo, useEffect } from "react"
import dynamic from "next/dynamic"
import { createBrowserClient } from "@supabase/ssr"
import { StatCard } from "@/components/stat-card"
import { Activity, CalendarDays, BarChart3, Plus, Search, Calendar, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { format, parseISO } from "date-fns"
import { formatInTimeZone } from "date-fns-tz"
import { ptBR } from "date-fns/locale"
import { DailyExamsModal } from "@/components/daily-exams-modal"

const ExamsCharts = dynamic(() => import("@/components/exams-charts").then(m => m.ExamsCharts), { 
  ssr: false,
  loading: () => <div className="h-[400px] w-full flex items-center justify-center animate-pulse bg-card/20 rounded-[2.5rem]">Carregando gráficos...</div>
})

interface TopFilterButtonsProps {
  months: string[]
  years: string[]
  selectedMonth: string | null
  selectedYear: string | null
  onMonthChange: (v: string | null) => void
  onYearChange: (v: string | null) => void
}

const MONTHS_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
]

function ExamsFilterButtons({
  months,
  years,
  selectedMonth,
  selectedYear,
  onMonthChange,
  onYearChange,
}: TopFilterButtonsProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
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
  ultrassom: number
  ecocardiograma: number
  tomografia: number
  tomografia_contraste: number
}

export default function ExamesPage() {
  const [mounted, setMounted] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [records, setRecords] = useState<DailyExamRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)

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
      
      if (selectedYear && year !== selectedYear) return false
      if (selectedMonth && month !== selectedMonth) return false
      
      return true
    })
  }, [records, selectedMonth, selectedYear])

  const stats = useMemo(() => {
    let ultrassom = 0
    let ecocardiograma = 0
    let tomografia = 0
    let tomografiaContraste = 0

    filteredRecords.forEach(r => {
      ultrassom += (r.ultrassom || 0)
      ecocardiograma += (r.ecocardiograma || 0)
      tomografia += (r.tomografia || 0)
      tomografiaContraste += (r.tomografia_contraste || 0)
    })

    return {
      ultrassom,
      ecocardiograma,
      tomografia,
      tomografiaContraste,
      total: ultrassom + ecocardiograma + tomografia + tomografiaContraste,
      diasRegistrados: filteredRecords.length
    }
  }, [filteredRecords])

  if (!mounted) return null

  return (
    <div className="space-y-8 pb-24">
      {/* Hero Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-500 border border-purple-500/20 text-[10px] font-black uppercase tracking-widest">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
            </span>
            Módulo Recepção
          </div>
          <h1 className="text-5xl lg:text-6xl font-black font-space tracking-tight gradient-text">Exames</h1>
          <p className="text-muted-foreground font-medium text-lg max-w-xl">Acompanhamento e registro quantitativo de exames realizados.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <Button 
            onClick={() => setIsModalOpen(true)}
            className="rounded-full shadow-premium gap-2 pl-4 pr-6 bg-gradient-to-r from-purple-600 to-primary hover:from-purple-500 hover:to-primary/80 transition-all font-bold group"
          >
            <div className="p-1 rounded-full bg-white/20 group-hover:rotate-90 transition-transform">
              <Plus className="h-4 w-4" />
            </div>
            Registrar Hoje
          </Button>
        </div>
      </div>

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
                months={availableMonths}
                years={availableYears}
                selectedMonth={selectedMonth}
                selectedYear={selectedYear}
                onMonthChange={setSelectedMonth}
                onYearChange={setSelectedYear}
             />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
            <StatCard title="Total Realizado" value={stats.total} subtitle="Exames" icon={BarChart3} variant="primary" className="!rounded-[1.5rem]" />
            <StatCard title="Ultrassom" value={stats.ultrassom} subtitle="Registros" icon={Activity} variant="secondary" className="!rounded-[1.5rem]" />
            <StatCard title="Ecocardiograma" value={stats.ecocardiograma} subtitle="Registros" icon={Activity} variant="accent" className="!rounded-[1.5rem]" />
            <StatCard title="Tomografia" value={stats.tomografia} subtitle="S/ Contraste" icon={Activity} variant="warning" className="!rounded-[1.5rem]" />
            <StatCard title="Tomo c/ Contraste" value={stats.tomografiaContraste} subtitle="e Angiotomografia" icon={Activity} variant="primary" className="!rounded-[1.5rem]" />
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
        <ExamsCharts records={filteredRecords} />
      )}

      {isModalOpen && (
        <DailyExamsModal 
          isOpen={isModalOpen} 
          setIsOpen={setIsModalOpen} 
          onSuccess={loadData}
          existingRecord={records.find(r => r.date === format(new Date(), 'yyyy-MM-dd'))}
        />
      )}
    </div>
  )
}
