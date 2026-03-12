"use client"

import { useMemo, useState } from "react"
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
  LabelList,
  Legend,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, Beaker, Zap, FileText } from "lucide-react"
import { cn } from "@/lib/utils"

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const fullName = payload[0]?.payload?.name || label
    return (
      <div className="bg-card/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-4 ring-1 ring-white/20">
        <p className="font-black text-foreground text-sm font-space uppercase tracking-tight">{fullName}</p>
        <div className="flex items-center gap-2 mt-2">
          <div className="h-2 w-2 rounded-full bg-purple-500 animate-pulse" />
          <p className="text-purple-500 font-black text-3xl tracking-tighter">{payload[0].value}</p>
        </div>
        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1 opacity-70">Quantidade Total</p>
      </div>
    )
  }
  return null
}

export function ExamsCharts({ records }: { records: any[] }) {
  const chartData = useMemo(() => {
    let ultrassom = 0
    let ecocardiograma = 0
    let tomografia = 0
    let tomografiaContraste = 0

    const monthlyBreakdown: Record<string, { month: string, ultrassom: number, ecocardiograma: number, tomografia: number, tomografiaContraste: number }> = {}

    records.forEach(r => {
      ultrassom += (r.ultrassom || 0)
      ecocardiograma += (r.ecocardiograma || 0)
      tomografia += (r.tomografia || 0)
      tomografiaContraste += (r.tomografia_contraste || 0)

      const month = r.date.substring(0, 7)
      if (!monthlyBreakdown[month]) {
        monthlyBreakdown[month] = { month, ultrassom: 0, ecocardiograma: 0, tomografia: 0, tomografiaContraste: 0 }
      }
      monthlyBreakdown[month].ultrassom += (r.ultrassom || 0)
      monthlyBreakdown[month].ecocardiograma += (r.ecocardiograma || 0)
      monthlyBreakdown[month].tomografia += (r.tomografia || 0)
      monthlyBreakdown[month].tomografiaContraste += (r.tomografia_contraste || 0)
    })

    const totalTypes = [
      { name: "Ultrassom", value: ultrassom, fill: "#3b82f6" },
      { name: "Ecocardiograma", value: ecocardiograma, fill: "#10b981" },
      { name: "Tomografia s/ Contraste", value: tomografia, fill: "#f59e0b" },
      { name: "Tomo c/ Angio", value: tomografiaContraste, fill: "#8b5cf6" }
    ]

    const monthlyData = Object.values(monthlyBreakdown).sort((a, b) => a.month.localeCompare(b.month))

    return { totalTypes, monthlyData }
  }, [records])

  return (
    <>
      {/* Gráfico Geral de Tipos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
        <Card className="glass-card !bg-card/40 border-none rounded-[2.5rem] overflow-hidden group transition-all duration-500 hover:shadow-2xl hover:bg-card/50">
          <CardHeader className="pb-4 border-b border-border/10">
            <CardTitle className="flex items-center gap-4 text-2xl font-black font-space uppercase tracking-tight">
              <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-500 group-hover:bg-purple-500 group-hover:text-white transition-all duration-500 shadow-indicator">
                <FileText className="h-7 w-7" />
              </div>
              Tipos de Exames
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[350px] w-full transition-all duration-500 flex flex-col items-center">
              <ResponsiveContainer width="100%" height="80%">
                <PieChart>
                  <Pie 
                    data={chartData.totalTypes} 
                    cx="50%" 
                    cy="50%" 
                    innerRadius={80} 
                    outerRadius={120} 
                    paddingAngle={5} 
                    dataKey="value" 
                    stroke="none"
                    animationBegin={0}
                    animationDuration={1500}
                  >
                    {chartData.totalTypes.map((entry: any, index: number) => (
                      <Cell key={index} fill={entry.fill} className="hover:opacity-80 outline-none" />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    content={(props: any) => {
                      const { payload } = props;
                      return (
                        <div className="flex flex-wrap justify-center gap-3 mt-4">
                          {payload.map((entry: any, index: number) => (
                            <div key={index} className="flex items-center gap-2 bg-background/40 backdrop-blur-md px-3 py-2 rounded-2xl border border-white/5 shadow-sm group/item">
                              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest whitespace-nowrap">
                                {entry.value}: <span className="text-foreground ml-1 font-black">{chartData.totalTypes[index].value}</span>
                              </span>
                            </div>
                          ))}
                        </div>
                      );
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              
              {chartData.totalTypes.every((d: any) => d.value === 0) && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <p className="font-space font-black text-[10px] uppercase tracking-[0.2em] opacity-30">Sem Dados</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Histórico Mensal */}
        <Card className="glass-card !bg-card/40 border-none rounded-[2.5rem] overflow-hidden group transition-all duration-500 hover:shadow-2xl hover:bg-card/50">
          <CardHeader className="pb-4 border-b border-border/10">
            <CardTitle className="flex items-center gap-4 text-2xl font-black font-space uppercase tracking-tight">
              <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all duration-500 shadow-indicator">
                <Activity className="h-7 w-7" />
              </div>
              Histórico Mensal
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[350px] w-full transition-all duration-500 flex flex-col">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.monthlyData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                  <YAxis hide />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.05)', radius: 10 }}
                    content={({ active, payload, label }: any) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-card/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-4 ring-1 ring-white/20">
                            <p className="font-black text-foreground text-sm font-space uppercase tracking-tight mb-2">{label}</p>
                            {payload.map((p: any, i: number) => (
                              <div key={i} className="flex justify-between items-center gap-4 text-xs font-bold mb-1">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                                  <span className="text-muted-foreground uppercase">{p.name}</span>
                                </div>
                                <span className="text-foreground">{p.value}</span>
                              </div>
                            ))}
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Bar dataKey="ultrassom" name="Ultrassom" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="ecocardiograma" name="Ecocardiograma" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="tomografia" name="Tomografia s/ Constraste" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="tomografiaContraste" name="Tomo c/ Angio" stackId="a" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
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
      </div>
    </>
  )
}
