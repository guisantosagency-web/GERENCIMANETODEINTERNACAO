"use client"

import { useState, useEffect } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis } from "recharts"
import { Users, Activity, FileHeart, Stethoscope, Droplet, ThermometerSun, BrainCircuit } from "lucide-react"

function getSupabase() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}

export default function DashboardAdmissaoTab() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const supabase = getSupabase()
      const { data: admissions, error } = await supabase.from('nursing_admissions').select('*').order('created_at', { ascending: false })
      if (!error && admissions) {
        setData(admissions)
      }
      setLoading(false)
    }
    fetchData()
  }, [])

  // Calc Indicators
  const totalAdmissoes = data.length
  
  const comJejum = data.filter(d => d.jejum_status === 'sim').length
  
  const statsComorbidades = [
    { name: "Hipertensão", value: data.filter(d => d.comorbidades?.hipertensao?.checked === 'sim').length, color: "#ef4444" }, // red
    { name: "Diabetes", value: data.filter(d => d.comorbidades?.diabetes?.checked === 'sim').length, color: "#f59e0b" }, // amber
    { name: "Cardiopata", value: data.filter(d => d.comorbidades?.cardiopata?.checked === 'sim').length, color: "#3b82f6" }, // blue
    { name: "Resp. Crônica", value: data.filter(d => d.comorbidades?.doenca_respiratoria?.checked === 'sim').length, color: "#8b5cf6" }, // purple
  ].sort((a,b) => b.value - a.value)

  const statsHabitos = [
    { name: "Tabagistas", value: data.filter(d => d.habitos_vida?.tabagista?.checked === 'sim').length, color: "#64748b" },
    { name: "Etilistas", value: data.filter(d => d.habitos_vida?.etilista?.checked === 'sim').length, color: "#d97706" },
  ]

  const totalComorbidades = statsComorbidades.reduce((acc, curr) => acc + curr.value, 0)
  const pieData = statsComorbidades.filter(s => s.value > 0).map(s => ({ ...s, name: s.name }))

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard 
          title="Total de Admissões"
          value={totalAdmissoes}
          subtitle="Registros até o momento"
          icon={<Users className="h-6 w-6 text-emerald-500" />}
          gradient="from-emerald-500/20 to-emerald-500/5"
          textColor="text-emerald-700"
        />
        <KPICard 
          title="Pacientes em Jejum"
          value={comJejum}
          subtitle={totalAdmissoes > 0 ? `${Math.round((comJejum / totalAdmissoes) * 100)}% do total` : "0%"}
          icon={<Droplet className="h-6 w-6 text-blue-500" />}
          gradient="from-blue-500/20 to-blue-500/5"
          textColor="text-blue-700"
        />
        <KPICard 
          title="Comorbidades Identificadas"
          value={totalComorbidades}
          subtitle="Riscos mapeados"
          icon={<Activity className="h-6 w-6 text-red-500" />}
          gradient="from-red-500/20 to-red-500/5"
          textColor="text-red-700"
        />
        <KPICard 
          title="Tabagistas/Etilistas"
          value={statsHabitos.reduce((acc, curr) => acc + curr.value, 0)}
          subtitle="Hábitos de risco"
          icon={<BrainCircuit className="h-6 w-6 text-amber-500" />}
          gradient="from-amber-500/20 to-amber-500/5"
          textColor="text-amber-700"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Comorbidities Bar Chart */}
        <Card className="rounded-[2.5rem] border-slate-100 shadow-xl overflow-hidden glass-card">
          <CardHeader className="bg-slate-50/50 border-b border-border/10 pb-6">
            <CardTitle className="flex items-center gap-3 font-space text-xl">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                <FileHeart className="h-5 w-5" />
              </div>
              Top Comorbidades
            </CardTitle>
            <CardDescription className="font-bold uppercase tracking-widest text-[10px] ml-12">Principais problemas de saúde informados</CardDescription>
          </CardHeader>
          <CardContent className="pt-8 h-[350px]">
            {totalComorbidades > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statsComorbidades} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 700 }} />
                  <RechartsTooltip cursor={{fill: 'rgba(0,0,0,0.02)'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontWeight: 'bold'}} />
                  <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={32}>
                    {statsComorbidades.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
             <EmptyState icon={<FileHeart />} message="Dados insuficientes" />
            )}
          </CardContent>
        </Card>

        {/* Habits Pie Chart */}
        <Card className="rounded-[2.5rem] border-slate-100 shadow-xl overflow-hidden glass-card">
          <CardHeader className="bg-slate-50/50 border-b border-border/10 pb-6">
            <CardTitle className="flex items-center gap-3 font-space text-xl">
              <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-500">
                <ThermometerSun className="h-5 w-5" />
              </div>
              Hábitos de Vida
            </CardTitle>
            <CardDescription className="font-bold uppercase tracking-widest text-[10px] ml-12">Proporção de riscos declarados</CardDescription>
          </CardHeader>
          <CardContent className="pt-8 h-[350px]">
            {statsHabitos.some(s => s.value > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statsHabitos}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={110}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {statsHabitos.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontWeight: 'bold'}} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState icon={<BrainCircuit />} message="Dados insuficientes" />
            )}
            
            {/* Custom Legend */}
            <div className="flex justify-center gap-6 mt-4">
              {statsHabitos.map((entry, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">{entry.name} ({entry.value})</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  )
}

function KPICard({ title, value, subtitle, icon, gradient, textColor }: any) {
  return (
    <div className={`p-8 rounded-[2.5rem] bg-gradient-to-br border border-white/40 shadow-xl relative overflow-hidden group ${gradient}`}>
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/40 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none group-hover:scale-110 transition-transform duration-700" />
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div className={`p-3 rounded-2xl bg-white/60 backdrop-blur-md shadow-sm border border-white/50 ${textColor}`}>
            {icon}
          </div>
        </div>
        <p className="text-[11px] font-black uppercase tracking-widest text-slate-600/70 mb-1">{title}</p>
        <h3 className={`text-5xl font-black font-space tracking-tight mb-2 ${textColor}`}>{value}</h3>
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{subtitle}</p>
      </div>
    </div>
  )
}

function EmptyState({ icon, message }: { icon: any, message: string }) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4 opacity-50">
      <div className="h-16 w-16 mb-2">
        {icon}
      </div>
      <p className="font-black uppercase tracking-widest text-sm">{message}</p>
    </div>
  )
}
