"use client"

import { useState, useMemo, useEffect } from "react"
import dynamic from "next/dynamic"
import { createBrowserClient } from "@supabase/ssr"
import {
  TrendingUp, Loader2, RefreshCw, 
  CheckCircle2, CalendarX2, BarChart3,
  CalendarDays, TrendingDown, Target, Activity, Users, Clock
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useAuth } from "@/lib/auth-context"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"


function DashboardCard({ title, value, label, icon: Icon, colorClass, percentage, secondaryText }: any) {
  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between h-[160px] relative overflow-hidden group hover:shadow-md transition-all duration-500">
      <div className={`absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity ${colorClass}`}>
         <Icon className="h-24 w-24 -mr-4 -mt-4 rotate-12" />
      </div>

      <div className="flex items-center justify-between relative z-10">
        <div className={`p-3 rounded-2xl ${colorClass.replace('text-', 'bg-').replace('-600', '-50')} ${colorClass}`}>
          <Icon className="h-5 w-5" />
        </div>
        {percentage !== undefined && (
          <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${colorClass.replace('text-', 'bg-').replace('-600', '-50')} ${colorClass}`}>
            {percentage}%
          </span>
        )}
      </div>

      <div className="mt-4 relative z-10">
        <h4 className="text-3xl font-black font-space tracking-tighter text-slate-800 leading-none">{value}</h4>
        <div className="flex items-baseline gap-2 mt-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{title}</p>
          {secondaryText && <span className="text-[9px] font-bold text-slate-300">/ {secondaryText}</span>}
        </div>
      </div>
      
      <div className="mt-4 h-1 w-full bg-slate-50 rounded-full overflow-hidden">
        <div className={`h-full ${colorClass.replace('text-', 'bg-')} transition-all duration-1000`} style={{ width: '100%' }} />
      </div>
    </div>
  )
}

const MONTHS_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
]

export default function ExamesDashboardTab() {
  const { user } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [appointments, setAppointments] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<string | null>(new Date().getMonth() + 1 + "")
  const [selectedYear, setSelectedYear] = useState<string | null>(new Date().getFullYear().toString())

  const supabase = useMemo(() => createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!), [])

  // Modals state
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [selectedProcDetails, setSelectedProcDetails] = useState<{name: string, count: number, subDetails: {detailName: string, count: number}[]} | null>(null)

  const loadData = async (year?: string | null, month?: string | null) => {
    setIsLoading(true)
    try {
      let query = supabase.from("exam_appointments").select("*").neq("status", "cancelado")
      
      if (year && !month) {
        const start = `${year}-01-01`
        const end = `${year}-12-31`
        query = query.gte("exam_date", start).lte("exam_date", end)
      } else if (year && month) {
        // Obter primeiro e último dia do mês selecionado
        const date = new Date(parseInt(year), parseInt(month) - 1, 1)
        const start = format(date, 'yyyy-MM-dd')
        const end = format(new Date(parseInt(year), parseInt(month), 0), 'yyyy-MM-dd')
        query = query.gte("exam_date", start).lte("exam_date", end)
      } else {
        // Default: ano atual
        const currentYear = new Date().getFullYear().toString()
        query = query.gte("exam_date", `${currentYear}-01-01`).lte("exam_date", `${currentYear}-12-31`)
      }

      const { data: appts, error: err1 } = await query
      if (!err1 && appts) setAppointments(appts)
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { 
    setMounted(true)
    loadData(selectedYear, selectedMonth)
  }, [selectedYear, selectedMonth])

  const availableYears = useMemo(() => {
    const currentYear = new Date().getFullYear()
    const years = new Set([currentYear.toString()])
    appointments.forEach(a => {
      if (a.exam_date) years.add(a.exam_date.substring(0, 4))
    })
    // Adiciona os últimos 3 anos por garantia
    years.add((currentYear - 1).toString())
    years.add((currentYear - 2).toString())
    return Array.from(years).sort().reverse()
  }, [appointments])

  const daysInMonth = useMemo(() => {
    if (!selectedMonth || !selectedYear) return []
    const days = new Date(parseInt(selectedYear), parseInt(selectedMonth), 0).getDate()
    return Array.from({length: days}, (_, i) => (i + 1).toString())
  }, [selectedMonth, selectedYear])

  const filteredRecords = useMemo(() => {
    // Como agora já buscamos filtrado por ano/mês no banco,
    // aqui só precisamos filtrar por dia se estiver selecionado
    if (!selectedDay) return appointments
    
    return appointments.filter(r => {
      const day = r.exam_date?.substring(8, 10)
      return day === selectedDay.padStart(2, '0')
    })
  }, [appointments, selectedDay])

  const stats = useMemo(() => {
    const total = filteredRecords.length
    const uniquePatients = new Set(filteredRecords.map(r => r.patient_name)).size
    const faltas = filteredRecords.filter(r => r.status === 'falta').length
    const presenceStatuses = ['presente', 'realizando', 'finalizado']
    const presencas = filteredRecords.filter(r => presenceStatuses.includes(r.status)).length
    
    const concludedCount = presencas + faltas
    const absRate = concludedCount > 0 ? ((faltas / concludedCount) * 100).toFixed(1) : "0.0"

    // Today specific - Filtrar dos dados já carregados para evitar nova busca
    const todayStr = format(new Date(), 'yyyy-MM-dd')
    const todayRecs = appointments.filter(a => a.exam_date === todayStr)
    const inQueue = todayRecs.filter(a => a.status === 'presente').length
    const finishedToday = todayRecs.filter(a => a.status === 'finalizado').length
    const totalToday = todayRecs.length

    // Procedimentos agrupados com lógica de Tomografia
    const procMap: Record<string, any[]> = {}
    
    filteredRecords.forEach(r => {
      let pName = (r.procedure_name || "NÃO INFORMADO").toUpperCase()
      const pType = (r.exam_type || "").toUpperCase()
      
      if (pName.includes("TOMOGRAFIA") || pName.includes("ANGIO") || pType.includes("TOMOGRAFIA") || pType.includes("ANGIO")) {
         if (pName.includes("COM CONTRASTE") || pType.includes("COM CONTRASTE") || pName.includes("ANGIO") || pType.includes("ANGIO")) {
           pName = "TOMOGRAFIA COM CONTRASTE"
         } else {
           pName = "TOMOGRAFIA SEM CONTRASTE"
         }
      }
      
      if (!procMap[pName]) procMap[pName] = []
      procMap[pName].push(r)
    })
    
    const procedures = Object.entries(procMap)
      .map(([name, records]) => {
         const originalMap: Record<string, number> = {}
         records.forEach(r => {
            const statusStr = r.status === 'cancelado' ? ' (CANCELADO)' : ''
            const typeStr = r.exam_type && String(r.exam_type).trim().length > 0 ? ` [${r.exam_type}]` : ''
            const label = `${r.procedure_name || "NÃO INFORMADO"}${typeStr}${statusStr}`.toUpperCase()
            originalMap[label] = (originalMap[label] || 0) + 1
         })
         const subDetails = Object.entries(originalMap).map(([detailName, count]) => ({ detailName, count })).sort((a,b) => b.count - a.count)
         return { name, count: records.length, subDetails }
      })
      .sort((a, b) => b.count - a.count)

    return {
      total,
      uniquePatients,
      faltas,
      presencas,
      absRate,
      inQueue,
      finishedToday,
      totalToday,
      procedures
    }
  }, [filteredRecords, appointments])


  if (!mounted) return null
  if (isLoading) return <div className="h-96 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-teal-500" /></div>

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 relative pb-20">
      
      {/* FILTERS HUD */}
      <div className="bg-white rounded-[2rem] p-6 lg:p-8 shadow-sm border border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
           <div className="p-4 bg-teal-50 text-teal-600 rounded-2xl shadow-sm border border-teal-100">
             <Target className="h-6 w-6" />
           </div>
           <div>
             <h2 className="text-xl font-bold font-space uppercase tracking-tight text-slate-800 leading-tight">Painel de Performance</h2>
             <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1 flex items-center gap-2">
               <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
               Filtros Dinâmicos Ativos
             </p>
           </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-100">
          <div className="flex flex-col px-2">
             <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1">Ano</span>
             <select 
               value={selectedYear || ""} 
               onChange={e => { setSelectedYear(e.target.value); setSelectedDay(null) }}
               className="h-9 bg-white border border-slate-200 rounded-xl text-[10px] font-bold text-slate-700 px-3 cursor-pointer outline-none focus:ring-1 focus:ring-teal-400 transition-all uppercase"
             >
               {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
             </select>
          </div>
          
          <div className="flex flex-col px-2">
             <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1">Mês</span>
             <select 
               value={selectedMonth || ""} 
               onChange={e => { setSelectedMonth(e.target.value); setSelectedDay(null) }}
               className="h-9 bg-white border border-slate-200 rounded-xl text-[10px] font-bold text-slate-700 px-3 cursor-pointer outline-none focus:ring-1 focus:ring-teal-400 transition-all uppercase"
             >
               <option value="">TODOS OS MESES</option>
               {MONTHS_NAMES.map((m, i) => <option key={m} value={i + 1 + ""}>{m.toUpperCase()}</option>)}
             </select>
          </div>

          <div className="flex flex-col px-2">
             <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1">Dia</span>
             <select 
               value={selectedDay || ""} 
               onChange={e => setSelectedDay(e.target.value)}
               className="h-9 bg-white border border-slate-200 rounded-xl text-[10px] font-bold text-slate-700 px-3 cursor-pointer outline-none focus:ring-1 focus:ring-teal-400 transition-all uppercase"
             >
               <option value="">FILTRO DIA</option>
               {daysInMonth.map(d => <option key={d} value={d}>{d.padStart(2, '0')}</option>)}
             </select>
          </div>

          <Button 
            variant="ghost" 
            onClick={() => { setSelectedDay(null); setSelectedMonth(null); setSelectedYear(new Date().getFullYear().toString()); }}
            className="h-9 w-9 p-0 hover:bg-slate-200 text-slate-400 rounded-xl"
            title="Resetar Filtros"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-6">
        <DashboardCard 
          title="Procedimentos"
          value={stats.total}
          label="Total de Exames"
          icon={Activity}
          colorClass="text-teal-600"
        />
        <DashboardCard 
          title="Pacientes"
          value={stats.uniquePatients}
          label="Pessoas Atendidas"
          icon={Users}
          colorClass="text-blue-600"
        />
        <DashboardCard 
          title="Presenças"
          value={stats.presencas}
          label="Confirmados"
          icon={CheckCircle2}
          colorClass="text-emerald-600"
        />
        <DashboardCard 
          title="Faltas"
          value={stats.faltas}
          label="Não Compareceram"
          icon={CalendarX2}
          colorClass="text-rose-600"
        />
        <DashboardCard 
          title="Absenteísmo"
          value={`${stats.absRate}%`}
          label="Taxa de Faltas"
          icon={BarChart3}
          colorClass="text-amber-600"
          percentage={parseFloat(stats.absRate)}
        />
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* RESUMO DO DIA */}
        <div className="w-full space-y-8">
           <div className="bg-white rounded-[2.5rem] p-8 lg:p-10 shadow-sm border border-slate-100 flex flex-col h-full">
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-4">
                   <div className="h-10 w-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center border border-orange-100 shadow-sm">
                      <Clock className="h-5 w-5" />
                   </div>
                   <div>
                      <h3 className="text-xl font-bold font-space uppercase tracking-tight text-slate-800 leading-tight">Resumo do Dia</h3>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">{format(new Date(), "dd 'de' MMMM", { locale: ptBR })}</p>
                   </div>
                </div>
                <div className="text-right hidden md:block">
                   <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">Eficiência Geral</span>
                   <span className="text-xl font-black text-teal-600">{stats.totalToday > 0 ? ((stats.finishedToday / stats.totalToday) * 100).toFixed(0) : 0}%</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1">
                 <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 group hover:border-teal-200 transition-all flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                       <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Na Fila</span>
                       <div className="h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
                    </div>
                    <div className="flex items-baseline gap-2 mt-auto">
                       <h4 className="text-4xl font-black font-space tracking-tighter text-slate-800">{stats.inQueue}</h4>
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Aguardando</span>
                    </div>
                 </div>

                 <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 group hover:border-emerald-200 transition-all flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                       <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Presentes</span>
                       <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    </div>
                    <div className="flex items-baseline gap-2 mt-auto">
                       <h4 className="text-4xl font-black font-space tracking-tighter text-slate-800">{stats.finishedToday}</h4>
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Finalizados</span>
                    </div>
                 </div>

                 <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 group hover:border-blue-200 transition-all flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                       <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Total Operações</span>
                       <Activity className="h-4 w-4 text-blue-500" />
                    </div>
                    <div className="flex items-baseline gap-2 mt-auto">
                       <h4 className="text-4xl font-black font-space tracking-tighter text-slate-800">{stats.totalToday}</h4>
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Agendamentos</span>
                    </div>
                 </div>
              </div>
              
              <div className="mt-8 md:hidden">
                 <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-teal-500 rounded-full transition-all duration-1000" 
                      style={{ width: stats.totalToday > 0 ? `${(stats.finishedToday / stats.totalToday) * 100}%` : '0%' }} 
                    />
                 </div>
              </div>
           </div>
        </div>

        {/* PROCEDIMENTOS */}
        <div className="w-full">
           <div className="bg-white rounded-[2.5rem] p-8 lg:p-10 shadow-sm border border-slate-100">
              <div className="flex items-center gap-4 mb-8">
                 <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center border border-indigo-100 shadow-sm">
                    <Target className="h-5 w-5" />
                 </div>
                 <div>
                    <h3 className="text-xl font-bold font-space uppercase tracking-tight text-slate-800 leading-tight">Procedimentos</h3>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">Quantitativo no período selecionado</p>
                 </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-5">
                 {stats.procedures.length > 0 ? (
                   stats.procedures.map(p => (
                     <div 
                       key={p.name} 
                       onClick={() => { setSelectedProcDetails(p); setIsDetailsOpen(true); }}
                       className="p-5 bg-slate-50 rounded-3xl border border-slate-100 group hover:border-indigo-300 hover:shadow-md border-b-[3px] hover:border-b-indigo-500 cursor-pointer transition-all flex flex-col justify-between min-h-[140px]"
                     >
                        <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-6 leading-relaxed line-clamp-2">{p.name}</span>
                        <div className="flex items-baseline gap-2 mt-auto">
                           <h4 className="text-3xl font-black font-space tracking-tighter text-slate-800">{p.count}</h4>
                           <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest group-hover:text-indigo-400 transition-colors">exames</span>
                        </div>
                     </div>
                   ))
                 ) : (
                   <div className="col-span-full py-10 text-center opacity-70">
                     <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Nenhum exame encontrado no filtro.</p>
                   </div>
                 )}
              </div>
           </div>
        </div>
      </div>

      {/* Modal de Detalhes dos Procedimentos */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-[600px] bg-white border-slate-200 p-0 overflow-hidden rounded-[2rem]">
          <div className="p-6 bg-indigo-50 border-b border-indigo-100 flex items-center gap-4">
             <div className="h-12 w-12 bg-white text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm">
                <Target className="h-6 w-6" />
             </div>
             <div>
               <DialogTitle className="text-xl font-bold font-space uppercase tracking-tight text-slate-800">
                 {selectedProcDetails?.name}
               </DialogTitle>
               <p className="text-xs font-bold text-slate-500 uppercase mt-1">
                 Total no Período: <span className="text-indigo-600 font-black">{selectedProcDetails?.count}</span> exames
               </p>
             </div>
          </div>
          <div className="p-6 max-h-[60vh] overflow-y-auto">
             {selectedProcDetails?.subDetails.map((sub, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl mb-3 last:mb-0 hover:border-indigo-200 transition-all">
                   <span className="text-xs font-bold text-slate-700 uppercase leading-snug max-w-[80%]">
                     {sub.detailName}
                   </span>
                   <div className="h-8 min-w-[32px] px-3 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-xs font-black text-slate-800 shadow-sm">
                     {sub.count}
                   </div>
                </div>
             ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

