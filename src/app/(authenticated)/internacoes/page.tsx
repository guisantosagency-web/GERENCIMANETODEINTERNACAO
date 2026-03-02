"use client"

import { useState, useMemo, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import type { Patient } from "@/lib/data"
import { PatientTable } from "@/components/patient-table"
import { EditPatientModal } from "@/components/edit-patient-modal"
import { AddPatientModal } from "@/components/add-patient-modal"
import { FilterButtons } from "@/components/filter-buttons"
import { ExportPDFModal } from "@/components/export-pdf-modal"
import { ExportCSVModal } from "@/components/export-csv-modal"
import { ImportCSVModal } from "@/components/import-csv-modal"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, Baby, Activity, Building2, Home, Search, Calendar, Filter } from "lucide-react"
import { cn } from "@/lib/utils"

export default function InternacoesPage() {
  const { patients, updatePatient, addPatient } = useAuth()
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [saveResult, setSaveResult] = useState<{ success: boolean; message: string } | null>(null)
  const [search, setSearch] = useState("")

  const [selectedCity, setSelectedCity] = useState<string | null>(null)
  const [selectedDestination, setSelectedDestination] = useState<string | null>(null)
  const [selectedProcedencia, setSelectedProcedencia] = useState<string | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null)
  const [selectedYear, setSelectedYear] = useState<string | null>(null)

  // Initialize filters with current month and year
  useEffect(() => {
    const now = new Date()
    const monthNames = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ]
    setSelectedMonth(monthNames[now.getMonth()])
    setSelectedYear(now.getFullYear().toString())
  }, [])

  const handleShowAll = () => {
    setSelectedCity(null)
    setSelectedDestination(null)
    setSelectedProcedencia(null)
    setSelectedMonth(null)
    setSelectedYear(null)
    setSearch("")
  }

  const cities = useMemo(() => {
    return [...new Set(patients.map((p) => p.cidadeOrigem).filter(Boolean))].sort()
  }, [patients])

  const destinations = useMemo(() => {
    return [...new Set(patients.map((p) => p.destino).filter(Boolean))].sort()
  }, [patients])

  const procedencias = useMemo(() => {
    return [...new Set(patients.map((p) => p.procedencia).filter(Boolean))].sort()
  }, [patients])

  const months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]
  const years = ["2024", "2025", "2026"]

  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      if (selectedCity && p.cidadeOrigem !== selectedCity) return false
      if (selectedDestination && p.destino !== selectedDestination) return false
      if (selectedProcedencia && p.procedencia !== selectedProcedencia) return false
      
      const dataParts = p.data.includes(".") ? p.data.split(".") : p.data.split("/")
      
      if (selectedMonth) {
        const monthMap: Record<string, string> = {
          Janeiro: "01", Fevereiro: "02", Março: "03", Abril: "04", Maio: "05", Junho: "06",
          Julho: "07", Agosto: "08", Setembro: "09", Outubro: "10", Novembro: "11", Dezembro: "12",
        }
        const monthNum = monthMap[selectedMonth]
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
    const childrenCount = filteredPatients.filter((p) => {
      const age = Number.parseInt(String(p.idade).replace(/\D/g, "")) || 0
      return age >= 0 && age <= 13
    }).length

    const utiCount = filteredPatients.filter((p) => (p.leito || "").toUpperCase().includes("UTI") || (p.destino || "").toUpperCase().includes("UTI")).length
    const citiesCount = new Set(filteredPatients.map((p) => p.cidadeOrigem).filter(Boolean)).size
    const residenciaCount = filteredPatients.filter((p) => p.isResidencia || (p.procedencia || "").toUpperCase().includes("RESID") || (p.procedencia || "").toUpperCase() === "CASA").length

    return { childrenCount, utiCount, citiesCount, residenciaCount, total: filteredPatients.length }
  }, [filteredPatients])

  const handleEdit = (patient: Patient) => {
    setEditingPatient(patient)
    setIsEditModalOpen(true)
  }

  const handleSave = async (updatedPatient: Patient) => {
    return await updatePatient(updatedPatient)
  }

  const handleAddPatient = async (newPatient: Omit<Patient, "id">) => {
    return await addPatient(newPatient)
  }

  return (
    <div className="space-y-8 pb-24">
      {/* Hero Section */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/20">
            <Activity className="h-3 w-3" />
            Fluxo de Pacientes
          </div>
          <h1 className="text-5xl lg:text-6xl font-black font-space tracking-tight gradient-text">Internações</h1>
          <p className="text-muted-foreground font-medium text-lg max-w-xl">Gestão operacional e monitoramento hospitalar centralizado.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <ImportCSVModal />
          <ExportPDFModal patients={patients} />
          <ExportCSVModal
            patients={filteredPatients}
            selectedCity={selectedCity}
            selectedDestination={selectedDestination}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
          />
          <div className="h-10 w-[1px] bg-border/20 mx-2 hidden lg:block" />
          <AddPatientModal onAdd={handleAddPatient} nextOrdem={patients.length + 1} />
        </div>
      </div>

      {/* STICKY HEADER CONTAINER */}
      <div className="sticky top-0 z-40 -mx-4 px-4 py-4 bg-background/40 backdrop-blur-xl border-b border-border/10">
        <div className="max-w-7xl mx-auto space-y-4">
            {/* Filter & Search Bar */}
                  <div className="p-4 rounded-[2.5rem] glass-card shadow-premium overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-secondary to-primary opacity-50" />
                    
                      <div className="flex flex-col gap-4 w-full">
                        <div className="flex flex-row items-center justify-between gap-4 w-full">
                          <div className="flex items-center gap-3 flex-1 min-w-0 overflow-x-auto scrollbar-none py-1">
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

                          <div className="flex items-center gap-3 shrink-0">
                            <Button 
                              onClick={handleShowAll}
                              variant="outline"
                              className="h-12 px-5 rounded-xl border-dashed border-primary/40 hover:border-primary hover:bg-primary/5 text-primary font-bold transition-all active:scale-95 whitespace-nowrap text-xs"
                            >
                              MOSTRAR TUDO
                            </Button>
                            
                            <div className="flex items-center gap-3 bg-background/40 px-4 h-12 rounded-xl border border-border/10">
                              <Users className="h-4 w-4 text-primary shrink-0" />
                              <div className="flex flex-col">
                                <span className="text-lg font-black font-space leading-none">{filteredPatients.length}</span>
                                <span className="text-[6px] font-black text-muted-foreground uppercase tracking-widest whitespace-nowrap">Filtrados</span>
                              </div>
                            </div>
                          </div>
                        </div>

                          <div className="relative group w-full">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input
                              placeholder="Buscar..."
                              value={search}
                              onChange={(e) => setSearch(e.target.value)}
                              className="pl-14 h-12 shadow-sm rounded-xl border-none bg-background/50 focus:bg-background transition-all font-bold text-sm w-full"
                            />
                          </div>
                      </div>
                  </div>

              {/* Sticky Stats */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {[
                  { title: "Total", value: stats.total, icon: Users, variant: "primary" },
                  { title: "Crianças", value: stats.childrenCount, icon: Baby, variant: "accent" },
                  { title: "UTI", value: stats.utiCount, icon: Activity, variant: "secondary" },
                  { title: "Cidades", value: stats.citiesCount, icon: Building2, variant: "primary" },
                  { title: "Casa", value: stats.residenciaCount, icon: Home, variant: "warning" },
                ].map((stat, i) => (
                  <div key={i} className="group p-4 rounded-2xl bg-card/40 backdrop-blur-sm border border-border/20 shadow-sm flex items-center gap-3 transition-all hover:bg-card/60 hover:scale-[1.01]">
                    <div className={cn("p-2.5 rounded-xl shrink-0 shadow-indicator", 
                      stat.variant === "primary" && "bg-primary/10 text-primary",
                      stat.variant === "secondary" && "bg-blue-500/10 text-blue-500",
                      stat.variant === "accent" && "bg-pink-500/10 text-pink-500",
                      stat.variant === "warning" && "bg-amber-500/10 text-amber-500",
                    )}>
                      <stat.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-2xl font-black font-space tracking-tight text-foreground">{stat.value}</p>
                      <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest leading-none">{stat.title}</p>
                    </div>
                  </div>
                ))}
              </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="animate-in slide-in-from-bottom-8 duration-1000">
        <PatientTable patients={filteredPatients} onEdit={handleEdit} showActions={true} search={search} />
      </div>

      <EditPatientModal
        patient={editingPatient}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setEditingPatient(null)
          setSaveResult(null)
        }}
        onSave={handleSave}
        saveResult={saveResult}
      />
    </div>
  )
}
