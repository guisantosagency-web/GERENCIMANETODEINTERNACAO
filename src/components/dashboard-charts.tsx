"use client"

import { memo, useMemo } from "react"
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
import { Activity, MapPin, Bed, Home, Baby, Inbox } from "lucide-react"
import { cn } from "@/lib/utils"

const COLORS = [
  "#7c3aed", "#3b82f6", "#10b981", "#f59e0b", "#ef4444",
  "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16", "#f43f5e",
]

const GRADIENTS = [
  { id: "grad1", color1: "#7c3aed", color2: "#4f46e5" },
  { id: "grad2", color1: "#3b82f6", color2: "#2563eb" },
  { id: "grad3", color1: "#10b981", color2: "#059669" },
  { id: "grad4", color1: "#f59e0b", color2: "#d97706" },
  { id: "grad5", color1: "#ef4444", color2: "#dc2626" },
  { id: "grad6", color1: "#ec4899", color2: "#db2777" },
]

const CustomTooltip = memo(({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const fullName = payload[0]?.payload?.fullName || label
    return (
      <div className="bg-card/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-4 ring-1 ring-white/20">
        <p className="font-black text-foreground text-sm font-space uppercase tracking-tight">{fullName}</p>
        <div className="flex items-center gap-2 mt-2">
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          <p className="text-primary font-black text-3xl tracking-tighter">{payload[0].value}</p>
        </div>
        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1 opacity-70">Internações Confirmadas</p>
      </div>
    )
  }
  return null
})
CustomTooltip.displayName = "CustomTooltip"

interface DashboardChartsProps {
  chartData: any
  selectedProcedencia: string | null
  setSelectedProcedencia: (v: string | null) => void
  selectedCity: string | null
  setSelectedCity: (v: string | null) => void
}

export function DashboardCharts({
  chartData,
  selectedProcedencia,
  setSelectedProcedencia,
  selectedCity,
  setSelectedCity
}: DashboardChartsProps) {
  
  // Adaptable height calculation
  const procHeight = useMemo(() => Math.max(350, (chartData.procedencias?.length || 0) * 55 + 100), [chartData.procedencias])
  const cityHeight = useMemo(() => Math.max(350, (chartData.cities?.length || 0) * 55 + 100), [chartData.cities])

  const EmptyState = ({ message }: { message: string }) => (
    <div className="h-full w-full flex flex-col items-center justify-center space-y-4 opacity-40 py-20">
      <div className="p-6 rounded-full bg-muted/20">
        <Inbox className="h-12 w-12 text-muted-foreground" />
      </div>
      <p className="font-space font-bold uppercase tracking-widest text-xs text-center">{message}</p>
    </div>
  )

  return (
    <>
      <svg width="0" height="0" className="absolute">
        <defs>
          {GRADIENTS.map((g) => (
            <linearGradient key={g.id} id={g.id} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={g.color1} />
              <stop offset="100%" stopColor={g.color2} />
            </linearGradient>
          ))}
        </defs>
      </svg>

      {/* Main Charts Area */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 pt-4">
        <Card className="glass-card !bg-card/40 border-none rounded-[2.5rem] overflow-hidden group transition-all duration-500 hover:shadow-2xl hover:bg-card/50">
          <CardHeader className="pb-4 border-b border-border/10">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-4 text-2xl font-black font-space uppercase tracking-tight">
                <div className="p-3 rounded-2xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500 shadow-indicator">
                  <Activity className="h-7 w-7" />
                </div>
                Procedência
              </CardTitle>
              {selectedProcedencia && (
                <button 
                  onClick={() => setSelectedProcedencia(null)}
                  className="text-[10px] font-black uppercase tracking-widest bg-primary/20 text-primary px-3 py-1 rounded-full hover:bg-primary hover:text-white transition-all"
                >
                  Limpar Filtro
                </button>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div style={{ height: procHeight }} className="w-full transition-all duration-500">
              {chartData.procedencias?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={chartData.procedencias} 
                    layout="vertical" 
                    margin={{ left: 20, right: 80, top: 20, bottom: 20 }}
                  >
                    <XAxis type="number" hide />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      width={120} 
                      tick={{ fontSize: 11, fontWeight: 900, fill: "hsl(var(--foreground))", fontFamily: 'var(--font-space)' }} 
                      axisLine={false} 
                      tickLine={false} 
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)', radius: 10 }} />
                    <Bar 
                      dataKey="count" 
                      radius={[0, 15, 15, 0]} 
                      barSize={28}
                      onClick={(data) => setSelectedProcedencia(selectedProcedencia === data.fullName ? null : data.fullName)}
                      className="cursor-pointer"
                    >
                      {chartData.procedencias.map((entry: any, index: number) => (
                        <Cell 
                          key={index} 
                          fill={`url(#grad${(index % 6) + 1})`} 
                          opacity={selectedProcedencia && selectedProcedencia !== entry.fullName ? 0.2 : 1}
                          className="transition-all duration-300 hover:brightness-125"
                        />
                      ))}
                      <LabelList 
                        dataKey="count" 
                        position="right" 
                        offset={15} 
                        style={{ fill: "hsl(var(--foreground))", fontWeight: 950, fontSize: 16, fontFamily: 'var(--font-space)' }} 
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState message="Nenhuma procedência encontrada" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card !bg-card/40 border-none rounded-[2.5rem] overflow-hidden group transition-all duration-500 hover:shadow-2xl hover:bg-card/50">
          <CardHeader className="pb-4 border-b border-border/10">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-4 text-2xl font-black font-space uppercase tracking-tight">
                <div className="p-3 rounded-2xl bg-secondary/10 text-secondary group-hover:bg-secondary group-hover:text-secondary-foreground transition-all duration-500 shadow-indicator">
                  <MapPin className="h-7 w-7" />
                </div>
                Cidades de Origem
              </CardTitle>
              {selectedCity && (
                <button 
                  onClick={() => setSelectedCity(null)}
                  className="text-[10px] font-black uppercase tracking-widest bg-secondary/20 text-secondary px-3 py-1 rounded-full hover:bg-secondary hover:text-white transition-all"
                >
                  Limpar Filtro
                </button>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div style={{ height: cityHeight }} className="w-full transition-all duration-500">
              {chartData.cities?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={chartData.cities} 
                    layout="vertical" 
                    margin={{ left: 20, right: 80, top: 20, bottom: 20 }}
                  >
                    <XAxis type="number" hide />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      width={120} 
                      tick={{ fontSize: 11, fontWeight: 900, fill: "hsl(var(--foreground))", fontFamily: 'var(--font-space)' }} 
                      axisLine={false} 
                      tickLine={false} 
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)', radius: 10 }} />
                    <Bar 
                      dataKey="count" 
                      radius={[0, 15, 15, 0]} 
                      barSize={28}
                      onClick={(data) => setSelectedCity(selectedCity === data.fullName ? null : data.fullName)}
                      className="cursor-pointer"
                    >
                      {chartData.cities.map((entry: any, index: number) => (
                        <Cell 
                          key={index} 
                          fill={`url(#grad${((index + 2) % 6) + 1})`} 
                          opacity={selectedCity && selectedCity !== entry.fullName ? 0.2 : 1}
                          className="transition-all duration-300 hover:brightness-125"
                        />
                      ))}
                      <LabelList 
                        dataKey="count" 
                        position="right" 
                        offset={15} 
                        style={{ fill: "hsl(var(--foreground))", fontWeight: 950, fontSize: 16, fontFamily: 'var(--font-space)' }} 
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState message="Nenhuma cidade encontrada" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Distribution Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        {[
          { title: "Destino", data: chartData.destinos, icon: Bed, color: "text-red-500", bg: "bg-red-500/10" },
          { title: "Origem Casa", data: chartData.origens, icon: Home, color: "text-emerald-500", bg: "bg-emerald-500/10" },
          { title: "Faixa Etária", data: chartData.idades, icon: Baby, color: "text-amber-500", bg: "bg-amber-500/10" },
        ].map((item, i) => (
          <Card key={i} className="glass-card !bg-card/40 border-none rounded-[2.5rem] overflow-hidden group transition-all duration-500 hover:bg-card/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl font-black font-space flex items-center gap-3 uppercase tracking-tight">
                <div className={cn("p-2.5 rounded-2xl shrink-0 transition-all duration-500", item.bg, item.color)}>
                  <item.icon className="h-5 w-5" />
                </div>
                {item.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="h-[380px] flex flex-col items-center">
                <ResponsiveContainer width="100%" height="75%">
                  <PieChart>
                    <Pie 
                      data={item.data} 
                      cx="50%" 
                      cy="50%" 
                      innerRadius={70} 
                      outerRadius={100} 
                      paddingAngle={5} 
                      dataKey="value" 
                      stroke="none"
                      animationBegin={0}
                      animationDuration={1500}
                    >
                      {item.data.map((entry: any, index: number) => (
                        <Cell key={index} fill={entry.fill} className="hover:opacity-80 transition-all duration-300 outline-none" />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36} 
                      content={(props: any) => {
                        const { payload } = props;
                        return (
                          <div className="flex flex-wrap justify-center gap-3 mt-8">
                            {payload.map((entry: any, index: number) => (
                              <div key={index} className="flex items-center gap-2 bg-background/40 backdrop-blur-md px-3 py-2 rounded-2xl border border-white/5 shadow-premium group/item transition-all hover:scale-105">
                                <div className="w-2.5 h-2.5 rounded-full shadow-indicator" style={{ backgroundColor: entry.color }} />
                                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest whitespace-nowrap">
                                  {entry.value}: <span className="text-foreground ml-1 font-black">{item.data[index].value}</span>
                                </span>
                              </div>
                            ))}
                          </div>
                        );
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                
                {item.data.every((d: any) => d.value === 0) && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <p className="font-space font-black text-[10px] uppercase tracking-[0.2em] opacity-30">Sem Dados</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  )
}
