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
      <div className="bg-card/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-4 ring-1 ring-white/20">
        <p className="font-black text-foreground text-sm font-space uppercase tracking-tight mb-2">{fullName}</p>
        {payload.map((p: any, i: number) => (
          <div key={i} className="flex justify-between items-center gap-4 text-xs font-bold mb-1">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color || p.payload.fill }} />
              <span className="text-muted-foreground uppercase">{p.name || p.dataKey}</span>
            </div>
            <span className="text-foreground text-lg">{p.value}</span>
          </div>
        ))}
        {payload.length > 1 && (
          <div className="mt-2 pt-2 border-t border-white/10 flex justify-between items-center text-xs font-black uppercase tracking-widest text-primary">
            <span>Total</span>
            <span>{payload.reduce((acc: number, p: any) => acc + p.value, 0)}</span>
          </div>
        )}
      </div>
    )
  }
  return null
}

export function ExamsCharts({ records, onFilterChange }: { records: any[], onFilterChange?: (type: string, val: string | null) => void }) {
  const chartData = useMemo(() => {
    let totalPresentes = 0
    let totalFaltas = 0

    const examBreakdown: Record<string, { name: string, presentes: number, faltas: number }> = {}
    const monthlyBreakdown: Record<string, { month: string, presentes: number, faltas: number }> = {}

    records.forEach(r => {
      // records are raw exam_appointments
      const isPresent = r.status === 'presente'
      const isFalta = r.status === 'falta'

      if (isPresent) totalPresentes++
      if (isFalta) totalFaltas++

      // Exam Breakdown
      if (!examBreakdown[r.procedure_name]) {
        examBreakdown[r.procedure_name] = { name: r.procedure_name, presentes: 0, faltas: 0 }
      }
      if (isPresent) examBreakdown[r.procedure_name].presentes++
      if (isFalta) examBreakdown[r.procedure_name].faltas++

      // Monthly Breakdown
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
      { name: "Presentes", value: totalPresentes, fill: "#10b981" },
      { name: "Faltas", value: totalFaltas, fill: "#ef4444" }
    ]

    const examData = Object.values(examBreakdown).sort((a, b) => (b.presentes + b.faltas) - (a.presentes + a.faltas))
    const monthlyData = Object.values(monthlyBreakdown).sort((a, b) => a.month.localeCompare(b.month))

    return { globalPie, examData, monthlyData }
  }, [records])

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
        {/* Distribuição Geral : Presentes x Faltas */}
        <Card className="glass-card !bg-card/40 border-none rounded-[2rem] overflow-hidden group transition-all duration-500 hover:shadow-xl hover:bg-card/50">
          <CardHeader className="py-3 px-6 border-b border-border/10">
            <CardTitle className="flex items-center gap-3 text-lg font-black font-space uppercase tracking-tight">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 group-hover:bg-amber-500 group-hover:text-white transition-all duration-500">
                <PieChartIcon className="h-5 w-5" />
              </div>
              Proporção Geral
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 px-4">
            <div className="h-[230px] w-full flex flex-col items-center">
              <ResponsiveContainer width="100%" height="85%">
                <PieChart>
                  <Pie 
                    data={chartData.globalPie} 
                    cx="50%" 
                    cy="50%" 
                    innerRadius={60} 
                    outerRadius={85} 
                    paddingAngle={5} 
                    dataKey="value" 
                    stroke="none"
                    animationBegin={0}
                    animationDuration={1500}
                  >
                    {chartData.globalPie.map((entry: any, index: number) => (
                      <Cell key={index} fill={entry.fill} onClick={() => onFilterChange?.('status', entry.name.toLowerCase())} className="hover:opacity-80 outline-none cursor-pointer" />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    verticalAlign="bottom" 
                    height={30} 
                    content={(props: any) => {
                      const { payload } = props;
                      return (
                        <div className="flex flex-wrap justify-center gap-2 mt-2">
                          {payload.map((entry: any, index: number) => (
                            <div key={index} className="flex items-center gap-1.5 bg-background/40 backdrop-blur-md px-2 py-1 rounded-xl border border-white/5 shadow-sm group/item">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                              <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest whitespace-nowrap">
                                {entry.value}: <span className="text-foreground ml-1 font-black">{chartData.globalPie[index].value}</span>
                              </span>
                            </div>
                          ))}
                        </div>
                      );
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              
              {chartData.globalPie.every((d: any) => d.value === 0) && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <p className="font-space font-black text-[10px] uppercase tracking-[0.2em] opacity-30">Sem Dados</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Totais por Tipo de Exame */}
        <Card className="glass-card !bg-card/40 border-none rounded-[2rem] overflow-hidden group transition-all duration-500 hover:shadow-xl hover:bg-card/50">
          <CardHeader className="py-3 px-6 border-b border-border/10">
            <CardTitle className="flex items-center gap-3 text-lg font-black font-space uppercase tracking-tight">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500 group-hover:bg-purple-500 group-hover:text-white transition-all duration-500">
                <FileText className="h-5 w-5" />
              </div>
              Volume por Exame
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 px-4">
            <div className="h-[230px] w-full transition-all duration-500 flex flex-col">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.examData} layout="vertical" margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={100} 
                    tick={{ fontSize: 9, fontWeight: 900, fill: "hsl(var(--foreground))", fontFamily: 'var(--font-space)' }} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)', radius: 10 }} content={<CustomTooltip />} />
                  <Bar dataKey="presentes" name="Presentes" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} onClick={(data) => onFilterChange?.('procedure', data.name)} className="cursor-pointer" />
                  <Bar dataKey="faltas" name="Faltas" stackId="a" fill="#ef4444" radius={[0, 10, 10, 0]} onClick={(data) => onFilterChange?.('procedure', data.name)} className="cursor-pointer" />
                </BarChart>
              </ResponsiveContainer>
              {chartData.examData.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <p className="font-space font-black text-[10px] uppercase tracking-[0.2em] opacity-30">Nenhum registro encontrado</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Histórico Mensal */}
      <Card className="glass-card !bg-card/40 border-none rounded-[2rem] overflow-hidden group transition-all duration-500 hover:shadow-xl hover:bg-card/50 mt-6">
        <CardHeader className="py-3 px-6 border-b border-border/10">
          <CardTitle className="flex items-center gap-3 text-lg font-black font-space uppercase tracking-tight">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all duration-500">
              <Activity className="h-5 w-5" />
            </div>
            Histórico Mensal
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 px-4">
          <div className="h-[200px] w-full transition-all duration-500 flex flex-col">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.monthlyData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                <YAxis hide />
                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)', radius: 10 }} content={<CustomTooltip />} />
                <Bar dataKey="presentes" name="Presentes" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} onClick={(data) => onFilterChange?.('month', data.month.substring(5,7))} className="cursor-pointer" />
                <Bar dataKey="faltas" name="Faltas" stackId="a" fill="#ef4444" radius={[6, 6, 0, 0]} onClick={(data) => onFilterChange?.('month', data.month.substring(5,7))} className="cursor-pointer" />
              </BarChart>
            </ResponsiveContainer>
            {chartData.monthlyData.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <p className="font-space font-black text-[10px] uppercase tracking-[0.2em] opacity-30">Nenhum histórico</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  )
}
