"use client"

import { useMemo } from "react"
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, Beaker, PieChart as PieChartIcon, FileText } from "lucide-react"

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const fullName = payload[0]?.payload?.name || label
    return (
      <div className="bg-[#161B22]/90 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl p-4 ring-1 ring-white/10">
        <p className="font-black text-white text-[10px] font-space uppercase tracking-[0.2em] mb-3 opacity-60">{fullName}</p>
        <div className="space-y-2">
          {payload.map((p: any, i: number) => (
            <div key={i} className="flex justify-between items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: p.color || p.payload.fill, color: p.color || p.payload.fill }} />
                <span className="text-[#7E8C9A] text-[9px] font-black uppercase tracking-wider">{p.name || p.dataKey}</span>
              </div>
              <span className="text-white text-base font-black font-space">{p.value}</span>
            </div>
          ))}
        </div>
        {payload.length > 1 && (
          <div className="mt-3 pt-3 border-t border-white/5 flex justify-between items-center">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FF6B35]">Total Bruto</span>
            <span className="text-white text-lg font-black font-space">{payload.reduce((acc: number, p: any) => acc + p.value, 0)}</span>
          </div>
        )}
      </div>
    )
  }
  return null
}

export function ExamsCharts({ records, slots, onFilterChange }: { records: any[], slots?: any[], onFilterChange?: (type: string, val: string | null) => void }) {
  const chartData = useMemo(() => {
    let totalPresentes = 0
    let totalFaltas = 0
    let totalAgendados = 0

    const examBreakdown: Record<string, { name: string, presentes: number, faltas: number }> = {}
    const monthlyBreakdown: Record<string, { month: string, presentes: number, faltas: number }> = {}

    records.forEach(r => {
      const isPresent = r.status === 'presente'
      const isFalta = r.status === 'falta'
      const isAgendado = r.status === 'agendado'

      if (isPresent) totalPresentes++
      if (isFalta) totalFaltas++
      if (isAgendado) totalAgendados++

      if (!examBreakdown[r.procedure_name]) {
        examBreakdown[r.procedure_name] = { name: r.procedure_name, presentes: 0, faltas: 0 }
      }
      if (isPresent) examBreakdown[r.procedure_name].presentes++
      if (isFalta) examBreakdown[r.procedure_name].faltas++

      const month = r.exam_date?.substring(0, 7)
      if (month) {
        if (!monthlyBreakdown[month]) {
          monthlyBreakdown[month] = { month, presentes: 0, faltas: 0 }
        }
        if (isPresent) monthlyBreakdown[month].presentes++
        if (isFalta) monthlyBreakdown[month].faltas++
      }
    })

    const globalPie = [
      { name: "Presentes", value: totalPresentes, fill: "#00FF88" },
      { name: "Faltas", value: totalFaltas, fill: "#FF1493" }
    ]

    const examData = Object.values(examBreakdown).sort((a, b) => (b.presentes + b.faltas) - (a.presentes + a.faltas))
    const monthlyData = Object.values(monthlyBreakdown).sort((a, b) => a.month.localeCompare(b.month))

    const occupancyData = slots ? Object.entries(
      slots.reduce((acc: any, s: any) => {
        if (!acc[s.procedure_name]) acc[s.procedure_name] = 0
        acc[s.procedure_name] += s.total_slots
        return acc
      }, {})
    ).map(([name, total]: [string, any]) => {
      const used = records.filter(r => r.procedure_name === name).length
      const rate = total > 0 ? (used / total) * 100 : 0
      return { name, total, used, rate: Math.min(rate, 100).toFixed(0) }
    }).sort((a: any, b: any) => b.used - a.used).slice(0, 5) : []

    return { globalPie, examData, monthlyData, occupancyData }
  }, [records, slots])

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
        {/* Distribuição Geral */}
        <div className="card-csgo rounded-[2.5rem] overflow-hidden group">
          <div className="py-4 px-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
            <h3 className="flex items-center gap-3 text-xs font-black font-space uppercase tracking-[0.2em] text-white">
              <PieChartIcon className="h-4 w-4 text-[#00D9FF]" />
              Mix de Atendimento
            </h3>
            <div className="px-3 py-1 rounded-full bg-[#00D9FF]/10 text-[#00D9FF] text-[9px] font-black uppercase tracking-widest border border-[#00D9FF]/20">
              Real-Time
            </div>
          </div>
          <div className="p-8">
            <div className="h-[240px] w-full flex flex-col items-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <defs>
                    <linearGradient id="grad-presente" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00FF88" stopOpacity={1} />
                      <stop offset="100%" stopColor="#00CC6A" stopOpacity={1} />
                    </linearGradient>
                    <linearGradient id="grad-falta" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FF1493" stopOpacity={1} />
                      <stop offset="100%" stopColor="#C71585" stopOpacity={1} />
                    </linearGradient>
                  </defs>
                  <Pie 
                    data={chartData.globalPie} 
                    cx="50%" 
                    cy="50%" 
                    innerRadius={70} 
                    outerRadius={95} 
                    paddingAngle={8} 
                    dataKey="value" 
                    stroke="none"
                    animationDuration={1500}
                  >
                    {chartData.globalPie.map((entry: any, index: number) => (
                      <Cell 
                        key={index} 
                        fill={index === 0 ? "url(#grad-presente)" : "url(#grad-falta)"} 
                        onClick={() => onFilterChange?.('status', entry.name.toLowerCase())} 
                        className="hover:opacity-80 outline-none cursor-pointer filter hover:drop-shadow-[0_0_12px_rgba(255,255,255,0.2)]" 
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-4">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#7E8C9A]">Total</span>
                <span className="text-4xl font-black font-space text-white leading-none mt-1 shadow-sm">
                  {chartData.globalPie.reduce((acc: number, curr: any) => acc + curr.value, 0)}
                </span>
              </div>
              
              <div className="flex justify-center gap-8 mt-4">
                {chartData.globalPie.map((entry: any, index: number) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.fill }} />
                    <div className="text-left leading-none">
                      <p className="text-[8px] font-black text-[#7E8C9A] uppercase tracking-[0.1em]">{entry.name}</p>
                      <p className="text-sm font-black text-white font-space mt-0.5">{entry.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Volume por Exame */}
        <div className="card-csgo rounded-[2.5rem] overflow-hidden group">
          <div className="py-4 px-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
            <h3 className="flex items-center gap-3 text-xs font-black font-space uppercase tracking-[0.2em] text-white">
              <FileText className="h-4 w-4 text-[#FF1493]" />
              Ranking de Demanda
            </h3>
            <div className="flex items-center gap-1.5">
               <div className="h-1.5 w-1.5 rounded-full bg-[#FF1493] animate-pulse" />
               <span className="text-[9px] font-black text-[#7E8C9A] uppercase tracking-widest">Procedimentos</span>
            </div>
          </div>
          <div className="p-8">
            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.examData} layout="vertical" margin={{ left: -20 }} barSize={10}>
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={100} 
                    tick={{ fontSize: 9, fontWeight: 900, fill: "#7E8C9A", fontFamily: 'var(--font-space)' }} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <Tooltip cursor={{ fill: 'rgba(255,255,255,0.03)', radius: 8 }} content={<CustomTooltip />} />
                  <Bar dataKey="presentes" name="Atendidos" stackId="a" fill="#00FF88" radius={[0, 0, 0, 0]} className="cursor-pointer" />
                  <Bar dataKey="faltas" name="Faltas" stackId="a" fill="#FF1493" radius={[0, 8, 8, 0]} className="cursor-pointer" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                <p className="text-[8px] font-black text-[#7E8C9A] uppercase tracking-wider mb-1">Top Procedimento</p>
                <p className="text-[11px] font-black text-white truncate font-space uppercase">
                  {chartData.examData[0]?.name || "N/A"}
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                <p className="text-[8px] font-black text-[#7E8C9A] uppercase tracking-wider mb-1">Total de Tipos</p>
                <p className="text-[11px] font-black text-[#FF6B35] font-space uppercase">
                  {chartData.examData.length} VARIAÇÕES
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Seção Inferior: Timeline e Ocupação */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6 pb-4">
        {/* Histórico Operacional */}
        <div className="lg:col-span-7 card-csgo rounded-[2.5rem] overflow-hidden">
          <div className="py-4 px-8 border-b border-white/5 flex items-center justify-between">
            <h3 className="flex items-center gap-3 text-xs font-black font-space uppercase tracking-[0.2em] text-white">
              <Activity className="h-4 w-4 text-[#FF6B35]" />
              Performance Temporal
            </h3>
          </div>
          <div className="p-8">
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.monthlyData} barSize={24} margin={{ top: 10 }}>
                  <XAxis dataKey="month" tick={{ fontSize: 9, fill: "#7E8C9A", fontWeight: 900 }} tickLine={false} axisLine={false} dy={10} />
                  <YAxis hide />
                  <Tooltip cursor={{ fill: 'rgba(255,255,255,0.03)', radius: 8 }} content={<CustomTooltip />} />
                  <Bar dataKey="presentes" name="Sucesso" stackId="a" fill="#00FF88" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="faltas" name="Omissão" stackId="a" fill="#FF1493" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Ocupação Real */}
        <div className="lg:col-span-5 card-csgo rounded-[2.5rem] overflow-hidden flex flex-col">
          <div className="py-4 px-8 border-b border-white/5 flex items-center justify-between">
            <h3 className="flex items-center gap-3 text-xs font-black font-space uppercase tracking-[0.2em] text-white">
              <Beaker className="h-4 w-4 text-[#00FF88]" />
              Efficiency Slots
            </h3>
          </div>
          <div className="p-8 flex-1 space-y-5">
             {chartData.occupancyData.length === 0 ? (
               <div className="h-full flex items-center justify-center text-[10px] font-black uppercase text-white/10 tracking-[0.3em]">No Config Found</div>
             ) : chartData.occupancyData.map((d: any) => (
               <div key={d.name} className="space-y-2">
                  <div className="flex justify-between items-end">
                     <div>
                        <p className="text-[8px] font-black text-[#7E8C9A] uppercase tracking-wider mb-0.5">{d.name}</p>
                        <p className="text-sm font-black text-white font-space leading-none uppercase">{d.used} OF {d.total}</p>
                     </div>
                     <span className="text-sm font-black font-space text-[#00FF88] px-2 py-1 bg-[#00FF88]/10 rounded-lg">{d.rate}%</span>
                  </div>
                  <div className="h-2 w-full bg-white/[0.03] rounded-full overflow-hidden border border-white/5 relative">
                     <div 
                       className="h-full bg-gradient-to-r from-[#00FF88] to-[#00D9FF] transition-all duration-1000 shadow-[0_0_10px_rgba(0,255,136,0.3)]" 
                       style={{ width: `${d.rate}%` }} 
                     />
                  </div>
               </div>
             ))}
          </div>
        </div>
      </div>
    </>
  )
}
