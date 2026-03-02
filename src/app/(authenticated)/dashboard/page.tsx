"use client"

import { useState, useMemo, useEffect } from "react"
import dynamic from "next/dynamic"
import { useAuth } from "@/lib/auth-context"
import { StatCard } from "@/components/stat-card"
import { FilterButtons } from "@/components/filter-buttons"
import { Users, Bed, Activity, MapPin, Baby, Home, Calendar } from "lucide-react"

// Import the new client-only charts component with dynamic to avoid SSR issues
const DashboardCharts = dynamic(() => import("@/components/dashboard-charts").then(m => m.DashboardCharts), { 
  ssr: false,
  loading: () => <div className="h-[600px] w-full flex items-center justify-center animate-pulse bg-card/20 rounded-[2.5rem]">Carregando gráficos...</div>
})

const MONTH_MAP: Record<string, string> = {
  Janeiro: "01", Fevereiro: "02", Março: "03", Abril: "04", Maio: "05", Junho: "06",
  Julho: "07", Agosto: "08", Setembro: "09", Outubro: "10", Novembro: "11", Dezembro: "12",
}

export default function DashboardPage() {
  const { patients } = useAuth()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const [selectedCity, setSelectedCity] = useState<string | null>(null)
  const [selectedDestination, setSelectedDestination] = useState<string | null>(null)
  const [selectedProcedencia, setSelectedProcedencia] = useState<string | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null)
  const [selectedYear, setSelectedYear] = useState<string | null>(null)

  const { cities, destinations, procedencias } = useMemo(() => {
    const c = new Set<string>()
    const d = new Set<string>()
    const p = new Set<string>()
    patients.forEach(pat => {
      if (pat.cidadeOrigem) c.add(pat.cidadeOrigem)
      if (pat.destino) d.add(pat.destino)
      if (pat.procedencia) p.add(pat.procedencia)
    })
    return {
      cities: Array.from(c).sort(),
      destinations: Array.from(d).sort(),
      procedencias: Array.from(p).sort()
    }
  }, [patients])

  const months = Object.keys(MONTH_MAP)
  const years = ["2024", "2025", "2026"]

  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      if (selectedCity && p.cidadeOrigem !== selectedCity) return false
      if (selectedDestination && p.destino !== selectedDestination) return false
      if (selectedProcedencia && p.procedencia !== selectedProcedencia) return false
      
      const dataParts = p.data.includes(".") ? p.data.split(".") : p.data.split("/")
      
      if (selectedMonth) {
        const monthNum = MONTH_MAP[selectedMonth]
        const dataMonth = dataParts[1]?.padStart(2, "0")
        if (dataMonth !== monthNum) return false
      }
      
      if (selectedYear) {
        const dataYear = dataParts[2]?.length === 2 ? `20${dataParts[2]}` : dataParts[2]
        if (dataYear !== selectedYear) return false
      }
      return true
    })
  }, [patients, selectedCity, selectedDestination, selectedProcedencia, selectedMonth, selectedYear])

  const stats = useMemo(() => {
    const cityStats: Record<string, number> = {}
    const dateStats: Record<string, number> = {}
    const procedenciaStats: Record<string, number> = {}
    let utiCount = 0
    let childrenCount = 0
    let residenciaCount = 0

    filteredPatients.forEach((p) => {
      const city = (p.cidadeOrigem || "NÃO INFORMADO").trim().toUpperCase()
      cityStats[city] = (cityStats[city] || 0) + 1

      const proc = (p.procedencia || "NÃO INFORMADO").trim().toUpperCase()
      procedenciaStats[proc] = (procedenciaStats[proc] || 0) + 1

      dateStats[p.data] = (dateStats[p.data] || 0) + 1

      const leito = (p.leito || "").toUpperCase()
      const destino = (p.destino || "").toUpperCase()
      if (leito.includes("UTI") || destino.includes("UTI")) utiCount++

      const idade = parseInt(String(p.idade).replace(/\D/g, "")) || 0
      if (idade >= 0 && idade <= 13) childrenCount++

      if (p.isResidencia === true || proc.includes("RESID") || proc === "CASA" || proc === "DOMICILIO") residenciaCount++
    })

    return {
      total: filteredPatients.length,
      utiCount,
      childrenCount,
      residenciaCount,
      cityStats,
      dateStats,
      procedenciaStats,
    }
  }, [filteredPatients])

  const chartData = useMemo(() => {
    const mapToChart = (stats: Record<string, number>, limit = 10) => 
      Object.entries(stats)
        .map(([name, count]) => ({
          name: name.length > 20 ? name.substring(0, 20) + "..." : name,
          fullName: name,
          count,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit)

    return {
      cities: mapToChart(stats.cityStats, 10),
      procedencias: mapToChart(stats.procedenciaStats, 10),
      destinos: [
        { name: "UTI", value: stats.utiCount, fill: "#ef4444" },
        { name: "Enfermaria", value: stats.total - stats.utiCount, fill: "#7c3aed" },
      ],
      origens: [
        { name: "Residência", value: stats.residenciaCount, fill: "#10b981" },
        { name: "Outros", value: stats.total - stats.residenciaCount, fill: "#3b82f6" },
      ],
      idades: [
        { name: "Crianças (0-13)", value: stats.childrenCount, fill: "#f59e0b" },
        { name: "Adultos (14+)", value: stats.total - stats.childrenCount, fill: "#8b5cf6" },
      ]
    }
  }, [stats])

  if (!mounted) return null

  return (
    <div className="space-y-8 pb-24">
      {/* Hero Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            Sistema Live v2026
          </div>
          <h1 className="text-5xl lg:text-6xl font-black font-space tracking-tight gradient-text">Dashboard</h1>
          <p className="text-muted-foreground font-medium text-lg max-w-xl">Inteligência de dados e monitoramento em tempo real do HTO Caxias.</p>
        </div>
        
        <div className="flex items-center gap-4 bg-card/40 backdrop-blur-xl border border-border/20 p-2 rounded-3xl shadow-premium">
          <div className="flex flex-col items-end px-4">
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Data Atual</span>
            <span className="font-bold text-foreground">{new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</span>
          </div>
          <div className="h-10 w-[1px] bg-border/20" />
          <div className="p-3 rounded-2xl bg-primary shadow-indicator">
            <Calendar className="h-6 w-6 text-primary-foreground" />
          </div>
        </div>
      </div>

      {/* STICKY HEADER CONTAINER */}
      <div className="sticky top-0 z-40 -mx-4 px-4 py-4 bg-background/40 backdrop-blur-xl border-b border-border/10">
        <div className="max-w-7xl mx-auto space-y-4">
          {/* Filter Bar */}
          <div className="p-4 rounded-[2.5rem] glass-card shadow-premium overflow-hidden relative border border-white/10">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-secondary to-primary opacity-50" />
            <FilterButtons
              cities={cities}
              destinations={destinations}
              procedencias={procedencias}
              months={months}
              years={years}
              selectedCity={selectedCity}
              selectedDestination={selectedDestination}
              selectedProcedencia={selectedProcedencia}
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
              onCityChange={setSelectedCity}
              onDestinationChange={setSelectedDestination}
              onProcedenciaChange={setSelectedProcedencia}
              onMonthChange={setSelectedMonth}
              onYearChange={setSelectedYear}
            />
          </div>

          {/* Sticky Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
            <StatCard title="Total" value={stats.total} subtitle="Pacientes" icon={Users} variant="primary" className="!rounded-[1.5rem]" />
            <StatCard title="UTI" value={stats.utiCount} subtitle={`${stats.total > 0 ? ((stats.utiCount / stats.total) * 100).toFixed(1) : 0}%`} icon={Bed} variant="secondary" className="!rounded-[1.5rem]" />
            <StatCard title="Crianças" value={stats.childrenCount} subtitle="Pediátrico" icon={Baby} variant="accent" className="!rounded-[1.5rem]" />
            <StatCard title="Casa" value={stats.residenciaCount} subtitle="Direto" icon={Home} variant="warning" className="!rounded-[1.5rem]" />
            <StatCard title="Fluxo" value={Object.keys(stats.dateStats).length} subtitle="Dias" icon={Activity} variant="primary" className="!rounded-[1.5rem]" />
            <StatCard title="Região" value={Object.keys(stats.cityStats).length} subtitle="Cidades" icon={MapPin} variant="secondary" className="!rounded-[1.5rem]" />
          </div>
        </div>
      </div>

      <DashboardCharts 
        chartData={chartData}
        selectedProcedencia={selectedProcedencia}
        setSelectedProcedencia={setSelectedProcedencia}
        selectedCity={selectedCity}
        setSelectedCity={setSelectedCity}
      />
    </div>
  )
}
