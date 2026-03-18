"use client"

import { useState, useMemo, useEffect } from "react"
import dynamic from "next/dynamic"
import { createBrowserClient } from "@supabase/ssr"
import { StatCard } from "@/components/stat-card"
import { Activity, CalendarDays, BarChart3, Search, Calendar, Edit2, Trash2, CalendarX2, Users, Download, Filter, TrendingUp, Info, Loader2, MapPin, Layers } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { format, parseISO } from "date-fns"
import { useAuth } from "@/lib/auth-context"

const ExamsCharts = dynamic(() => import("@/components/exams-charts").then(m => m.ExamsCharts), { 
  ssr: false,
  loading: () => <div className="h-[400px] w-full flex items-center justify-center animate-pulse bg-card/20 rounded-[2.5rem]">Carregando gráficos...</div>
})

const MONTHS_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
]

export default function ExamesDashboardTab() {
  const { user } = useAuth()
  const [mounted, setMounted] = useState(false)
  
  // Raw data from exam_appointments
  const [appointments, setAppointments] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Filters State
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
      
      if (!error && data) {
        setAppointments(data)
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

  // Options Extractions
  const availableYears = useMemo(() => Array.from(new Set([new Date().getFullYear().toString(), ...appointments.map(a => a.exam_date.substring(0, 4))])).sort().reverse(), [appointments])
  const availableProcedures = useMemo(() => Array.from(new Set(appointments.map(a => a.procedure_name).filter(Boolean))).sort(), [appointments])
  const availableExamTypes = useMemo(() => Array.from(new Set(appointments.map(a => a.exam_type).filter(Boolean))).sort(), [appointments])
  const availableMunicipios = useMemo(() => Array.from(new Set(appointments.map(a => a.municipio).filter(Boolean))).sort(), [appointments])
  const availableEstados = useMemo(() => Array.from(new Set(appointments.map(a => a.estado).filter(Boolean))).sort(), [appointments])

  // Filtered Records List
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

  // Stats Logic
  const stats = useMemo(() => {
    let presentes = 0
    let faltas = 0
    let agendados = 0

    filteredRecords.forEach(a => {
      if (a.status === 'presente') presentes++
      if (a.status === 'falta') faltas++
      if (a.status === 'agendado') agendados++
    })

    const total = presentes + faltas // Eficiência baseada nos que já tem desfecho
    const rate = total > 0 ? ((presentes / total) * 100).toFixed(1) : "0"
    const absenteeRate = total > 0 ? ((faltas / total) * 100).toFixed(1) : "0"

    return { presentes, faltas, agendados, total, rate, absenteeRate }
  }, [filteredRecords])

  if (!mounted) return null

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-700">
      
      {/* PREMIUM HEADER CONTROLS */}
      <div className="glass-card !bg-white/40 border-none rounded-[3rem] p-8 lg:p-10 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -mr-20 -mt-20" />
        
        <div className="flex flex-col gap-8 relative z-10">
          <div>
             <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg">
                   <TrendingUp className="h-6 w-6" />
                </div>
                <h2 className="text-3xl font-black font-space uppercase tracking-tight text-slate-800">Indicadores de Desempenho</h2>
             </div>
             <p className="text-slate-400 font-bold ml-16 flex items-center gap-2 uppercase text-[10px] tracking-widest">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Dados Dinâmicos de Agendamentos e Exames
             </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-4">
             <div className="flex flex-col gap-1.5">
               <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-2">Ano</Label>
               <select value={selectedYear || ""} onChange={(e) => setSelectedYear(e.target.value || null)} className="h-10 bg-white border border-slate-100 rounded-xl text-xs font-black shadow-sm focus:ring-4 focus:ring-blue-500/10 px-3 uppercase">
                 <option value="">Todos</option>
                 {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
               </select>
             </div>
             <div className="flex flex-col gap-1.5">
               <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-2">Mês</Label>
               <select value={selectedMonth || ""} onChange={(e) => setSelectedMonth(e.target.value || null)} className="h-10 bg-white border border-slate-100 rounded-xl text-xs font-black shadow-sm focus:ring-4 focus:ring-blue-500/10 px-3 uppercase">
                 <option value="">Todos</option>
                 {MONTHS_NAMES.map((m, i) => <option key={i} value={(i+1).toString()}>{m}</option>)}
               </select>
             </div>
             <div className="flex flex-col gap-1.5">
               <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-2">Dia</Label>
               <select value={selectedDay || ""} onChange={(e) => setSelectedDay(e.target.value || null)} className="h-10 bg-white border border-slate-100 rounded-xl text-xs font-black shadow-sm focus:ring-4 focus:ring-blue-500/10 px-3 uppercase">
                 <option value="">Todos</option>
                 {Array.from({length: 31}, (_,i) => <option key={i} value={(i+1).toString().padStart(2, '0')}>{(i+1).toString().padStart(2, '0')}</option>)}
               </select>
             </div>
             <div className="flex flex-col gap-1.5">
               <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-2">Status</Label>
               <select value={selectedStatus || ""} onChange={(e) => setSelectedStatus(e.target.value)} className="h-10 bg-white border border-slate-100 rounded-xl text-xs font-black shadow-sm focus:ring-4 focus:ring-blue-500/10 px-3 uppercase">
                 <option value="">Todos</option>
                 <option value="agendado">Agendado</option>
                 <option value="presente">Presente</option>
                 <option value="falta">Falta</option>
               </select>
             </div>
             <div className="flex flex-col gap-1.5 xl:col-span-2">
               <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-2">Procedimento</Label>
               <select value={selectedProcedure || ""} onChange={(e) => setSelectedProcedure(e.target.value)} className="h-10 bg-white border border-slate-100 rounded-xl text-xs font-black shadow-sm focus:ring-4 focus:ring-blue-500/10 px-3 uppercase">
                 <option value="">Todos</option>
                 {availableProcedures.map(p => <option key={p} value={p}>{p}</option>)}
               </select>
             </div>
             <div className="flex flex-col gap-1.5 xl:col-span-2">
               <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-2">Município</Label>
               <select value={selectedMunicipio || ""} onChange={(e) => setSelectedMunicipio(e.target.value)} className="h-10 bg-white border border-slate-100 rounded-xl text-xs font-black shadow-sm focus:ring-4 focus:ring-blue-500/10 px-3 uppercase">
                 <option value="">Todos</option>
                 {availableMunicipios.map(m => <option key={m} value={m}>{m}</option>)}
               </select>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 mt-10">
           <div className="lg:col-span-2">
             <StatCard title="Agendados Pendentes" value={stats.agendados} subtitle="Aguardando Confirmação" icon={CalendarDays} variant="primary" className="!rounded-[2rem] shadow-premium h-full border-none bg-white/80" />
           </div>
           <div className="lg:col-span-2">
             <StatCard title="Presença Confirmada" value={stats.presentes} subtitle="Pacientes Atendidos" icon={Users} variant="accent" className="!rounded-[2rem] shadow-premium h-full border-none bg-white/80" />
           </div>
           <div className="lg:col-span-2">
             <StatCard title="Faltas / Ausências" value={stats.faltas} subtitle="Pacientes Não Compareceram" icon={CalendarX2} variant="warning" className="!rounded-[2rem] shadow-premium h-full border-none bg-white/80" />
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* EFICIÊNCIA CARD */}
        <div className="glass-card bg-emerald-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-emerald-500/10 flex flex-col justify-between group transition-all hover:scale-[1.01]">
          <div className="flex justify-between items-start">
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                <Activity className="h-6 w-6" />
              </div>
              <div className="text-xs font-black uppercase tracking-[0.2em] opacity-80">Eficiência Positiva</div>
          </div>
          <div className="mt-8">
            <div className="text-6xl font-black font-space mb-2 group-hover:translate-x-2 transition-transform">{stats.rate}%</div>
            <div className="text-xs font-black uppercase tracking-widest opacity-80">Taxa de Conversão de Presença</div>
          </div>
        </div>

        {/* ABSENTEÍSMO CARD */}
        <div className="glass-card bg-rose-500 rounded-[2.5rem] p-8 text-white shadow-xl shadow-rose-500/10 flex flex-col justify-between group transition-all hover:scale-[1.01]">
          <div className="flex justify-between items-start">
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div className="text-xs font-black uppercase tracking-[0.2em] opacity-80">Absenteísmo</div>
          </div>
          <div className="mt-8">
            <div className="text-6xl font-black font-space mb-2 group-hover:translate-x-2 transition-transform">{stats.absenteeRate}%</div>
            <div className="text-xs font-black uppercase tracking-widest opacity-80">Taxa de Faltas</div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="h-[400px] w-full flex flex-col items-center justify-center gap-4 bg-white/20 backdrop-blur-md rounded-[3rem] border-2 border-dashed border-white/40">
           <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
           <p className="font-black text-xs uppercase tracking-[0.3em] text-blue-500/60">Sincronizando BI Dashboard...</p>
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="h-80 flex flex-col items-center justify-center opacity-30 text-slate-400">
           <BarChart3 className="h-20 w-20 mb-6 stroke-[1px]" />
           <p className="text-xl font-black font-space tracking-widest uppercase">Base de Dados Vazia para este Filtro</p>
        </div>
      ) : (
        <div className="space-y-8 pb-10">
           {/* Active Filters Pills */}
           {(selectedStatus || selectedProcedure || selectedMunicipio || selectedExamType) && (
             <div className="flex flex-wrap items-center gap-2 px-1">
               <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Filtros ativos:</span>
               {selectedStatus && (
                 <button onClick={() => setSelectedStatus("")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-black uppercase tracking-widest hover:bg-rose-200 transition-all">
                   Status: {selectedStatus} <span className="ml-1 opacity-70">✕</span>
                 </button>
               )}
               {selectedProcedure && (
                 <button onClick={() => setSelectedProcedure("")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-black uppercase tracking-widest hover:bg-blue-200 transition-all">
                   Proc: {selectedProcedure} <span className="ml-1 opacity-70">✕</span>
                 </button>
               )}
               {selectedExamType && (
                 <button onClick={() => setSelectedExamType("")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-100 text-purple-700 text-[10px] font-black uppercase tracking-widest hover:bg-purple-200 transition-all">
                   Tipo: {selectedExamType} <span className="ml-1 opacity-70">✕</span>
                 </button>
               )}
               {selectedMunicipio && (
                 <button onClick={() => setSelectedMunicipio("")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-200 transition-all">
                   Município: {selectedMunicipio} <span className="ml-1 opacity-70">✕</span>
                 </button>
               )}
               <button onClick={() => { setSelectedStatus(""); setSelectedProcedure(""); setSelectedExamType(""); setSelectedMunicipio(""); setSelectedEstado("") }} className="px-3 py-1.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all">
                 Limpar Filtros
               </button>
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

// Emulate missing icon
function AlertCircle({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="8" x2="12" y2="12"></line>
      <line x1="12" y1="16" x2="12.01" y2="16"></line>
    </svg>
  )
}
