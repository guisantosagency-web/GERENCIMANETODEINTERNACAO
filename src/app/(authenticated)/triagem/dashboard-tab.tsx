"use client"

import { useState, useEffect, useMemo } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts"
import { 
  ChevronRight,
  TrendingUp,
  FileText,
  FlaskConical,
  Activity,
  ClipboardCheck,
  Stethoscope,
  Microscope,
  Scissors,
  Users,
  CheckCircle2,
  XCircle,
  Cog
} from "lucide-react"

export default function DashboardTab() {
  const supabase = useMemo(() => createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!), [])
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any[]>([])
  
  const [filter, setFilter] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    day: new Date().getDate(),
    period: 'day' as 'day' | 'month' | 'year'
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    const { data: records, error } = await supabase.from("surgery_triage").select("*")
    if (!error) setData(records || [])
    setLoading(false)
  }

  // Filtered indicators
  const stats = useMemo(() => {
    const filtered = data.filter(r => {
      const d = new Date(r.created_at)
      if (filter.period === 'day') {
        return d.getFullYear() === filter.year && (d.getMonth() + 1) === filter.month && d.getDate() === filter.day
      } else if (filter.period === 'month') {
        return d.getFullYear() === filter.year && (d.getMonth() + 1) === filter.month
      }
      return d.getFullYear() === filter.year
    })

    const total = filtered.length
    const launched = filtered.filter(r => r.is_launched).length
    const pending = total - launched
    const rate = total > 0 ? (launched / total) * 100 : 0

    // Count exams from checklist_data
    const examCounts: Record<string, number> = {}
    filtered.forEach(r => {
      if (r.checklist_data) {
        Object.entries(r.checklist_data).forEach(([key, val]: [string, any]) => {
          if (val && val.sim) {
            examCounts[key] = (examCounts[key] || 0) + 1
          }
        })
      }
    })

    return { total, launched, pending, rate, examCounts }
  }, [data, filter])

  const chartData = [
    { name: "Lançados", value: stats.launched, color: "#10b981" },
    { name: "Não Lançados", value: stats.pending, color: "#ef4444" }
  ]

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-20">
      {/* Time Filters - Premium Center Control */}
      <div className="flex flex-col items-center gap-6">
        <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
           {['day', 'month', 'year'].map((p) => (
             <button
               key={p}
               onClick={() => setFilter(prev => ({ ...prev, period: p as any }))}
               className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter.period === p ? 'bg-white text-emerald-600 shadow-premium' : 'text-slate-400 hover:text-slate-600'}`}
             >
               {p === 'day' ? 'Visão Diária' : p === 'month' ? 'Visão Mensal' : 'Visão Anual'}
             </button>
           ))}
        </div>

        <div className="bg-white/80 backdrop-blur-2xl p-6 rounded-[3rem] shadow-[0_32px_64px_-15px_rgba(0,0,0,0.08)] border border-white/40 flex flex-wrap items-center justify-center gap-8">
          {(filter.period === 'day') && (
            <div className="flex items-center gap-4 group">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.15em] group-hover:text-emerald-500 transition-colors">Dia</span>
              <select 
                value={filter.day}
                onChange={e => setFilter(p => ({ ...p, day: parseInt(e.target.value) }))}
                className="h-12 bg-slate-50 border border-slate-100 px-6 rounded-2xl font-black text-slate-700 hover:bg-white hover:border-emerald-200 transition-all cursor-pointer outline-none"
              >
                {Array.from({ length: 31 }, (_, i) => i + 1).map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          )}
          {(filter.period === 'day' || filter.period === 'month') && (
            <div className="flex items-center gap-4 group">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.15em] group-hover:text-emerald-500 transition-colors">Mês</span>
              <select 
                value={filter.month}
                onChange={e => setFilter(p => ({ ...p, month: parseInt(e.target.value) }))}
                className="h-12 bg-slate-50 border border-slate-100 px-6 rounded-2xl font-black text-slate-700 hover:bg-white hover:border-emerald-200 transition-all cursor-pointer outline-none"
              >
                {["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"].map((m, i) => (
                  <option key={i} value={i + 1}>{m}</option>
                ))}
              </select>
            </div>
          )}
          <div className="flex items-center gap-4 group">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.15em] group-hover:text-emerald-500 transition-colors">Ano</span>
            <select 
              value={filter.year}
              onChange={e => setFilter(p => ({ ...p, year: parseInt(e.target.value) }))}
              className="h-12 bg-slate-50 border border-slate-100 px-6 rounded-2xl font-black text-slate-700 hover:bg-white hover:border-emerald-200 transition-all cursor-pointer outline-none"
            >
              {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Stats Grid - Glassmorphism & Depth */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <StatCard 
          icon={<Users className="h-7 w-7" />}
          label="Total Triagens"
          value={stats.total}
          color="blue"
          sublabel="Volume total captado"
        />
        <StatCard 
          icon={<CheckCircle2 className="h-7 w-7" />}
          label="Lançados"
          value={stats.launched}
          color="emerald"
          sublabel="Processados com sucesso"
        />
        <StatCard 
          icon={<XCircle className="h-7 w-7" />}
          label="Pendentes"
          value={stats.pending}
          color="red"
          sublabel="Aguardando lançamento"
        />
        <StatCard 
          icon={<TrendingUp className="h-7 w-7" />}
          label="Eficiência"
          value={`${stats.rate.toFixed(1)}%`}
          color="indigo"
          sublabel="Taxa de conversão digital"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-12 xl:col-span-7 bg-white p-10 rounded-[3.5rem] shadow-xl border border-slate-100">
          <h3 className="text-xl font-black font-space uppercase tracking-tight text-slate-800 mb-8 flex items-center gap-4">
            <TrendingUp className="h-6 w-6 text-emerald-500" /> Distribuição Diária
          </h3>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }} textAnchor="middle" />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: 'black' }}
                />
                <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            </div>
        </div>

        <div className="lg:col-span-12 xl:col-span-5 bg-white p-10 rounded-[3.5rem] shadow-xl border border-slate-100 flex flex-col items-center justify-center">
          <h3 className="text-xl font-black font-space uppercase tracking-tight text-slate-800 mb-8 self-start flex items-center gap-4">
            <FileText className="h-6 w-6 text-emerald-500" /> Proporção de Status
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-8 mt-4">
            {chartData.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="h-4 w-4 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Volume de Exames Section - ADDRESSES USER REQUEST */}
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <div className="h-1 w-12 bg-emerald-500 rounded-full" />
          <h3 className="text-xl font-black font-space uppercase tracking-tight text-slate-800">Monitoramento de Exames</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <ExamStatBox icon={<Microscope className="h-5 w-5" />} label="Laboratório" value={stats.examCounts.lab || 0} color="emerald" />
          <ExamStatBox icon={<FlaskConical className="h-5 w-5" />} label="Radiografia" value={stats.examCounts.rx || 0} color="blue" />
          <ExamStatBox icon={<Activity className="h-5 w-5" />} label="Risco Cirúrgico" value={stats.examCounts.risco || 0} color="amber" />
          <ExamStatBox icon={<FileText className="h-5 w-5" />} label="Tomografia" value={stats.examCounts.tomografia || 0} color="indigo" />
          <ExamStatBox icon={<ClipboardCheck className="h-5 w-5" />} label="Hemocomponentes" value={stats.examCounts.hemo || 0} color="rose" />
          <ExamStatBox icon={<Cog className="h-5 w-5" />} label="OPME" value={stats.examCounts.opme || 0} color="slate" />
          <ExamStatBox icon={<Scissors className="h-5 w-5" />} label="Diabetes" value={stats.examCounts.diabetes || 0} color="orange" />
          <ExamStatBox icon={<Activity className="h-5 w-5" />} label="Hipertensão" value={stats.examCounts.hipertensao || 0} color="red" />
        </div>
      </div>
    </div>
  )
}

function ExamStatBox({ icon, label, value, color }: any) {
  const colors: any = {
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
    rose: "bg-rose-50 text-rose-600 border-rose-100",
    slate: "bg-slate-50 text-slate-600 border-slate-100",
    orange: "bg-orange-50 text-orange-600 border-orange-100",
    red: "bg-red-50 text-red-600 border-red-100",
  }

  return (
    <div className={`p-6 rounded-[2rem] border ${colors[color]} flex items-center justify-between group hover:scale-[1.02] transition-transform duration-300 bg-white shadow-sm`}>
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-xl ${colors[color].split(' ')[0]} shadow-sm`}>
          {icon}
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest opacity-80">{label}</span>
      </div>
      <span className="text-2xl font-black font-space">{value}</span>
    </div>
  )
}

function StatCard({ icon, label, value, color, sublabel }: any) {
  const configs: any = {
    blue: {
      bg: "bg-blue-500",
      accent: "bg-blue-50/50",
      border: "border-blue-100",
      text: "text-blue-600",
      shadow: "shadow-blue-500/20"
    },
    emerald: {
      bg: "bg-emerald-500",
      accent: "bg-emerald-50/50",
      border: "border-emerald-100",
      text: "text-emerald-600",
      shadow: "shadow-emerald-500/20"
    },
    red: {
      bg: "bg-red-500",
      accent: "bg-red-50/50",
      border: "border-red-100",
      text: "text-red-600",
      shadow: "shadow-red-500/20"
    },
    indigo: {
      bg: "bg-indigo-500",
      accent: "bg-indigo-50/50",
      border: "border-indigo-100",
      text: "text-indigo-600",
      shadow: "shadow-indigo-500/20"
    }
  }

  const { bg, accent, border, text, shadow } = configs[color]

  return (
    <div className={`p-10 rounded-[4rem] border ${border} ${accent} backdrop-blur-md transition-all duration-500 hover:scale-[1.03] hover:shadow-2xl hover:shadow-${color}-500/10 group overflow-hidden relative`}>
      <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/40 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
      <div className="flex flex-col gap-6 relative z-10">
        <div className={`p-4 rounded-3xl text-white ${bg} w-fit shadow-lg ${shadow} group-hover:rotate-[10deg] transition-transform duration-500`}>
          {icon}
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 opacity-80 mb-2">{label}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-4xl font-black font-space text-slate-800 tracking-tight">{value}</p>
          </div>
          <p className="text-[9px] font-bold text-slate-400 uppercase mt-3 tracking-wider italic">{sublabel}</p>
        </div>
      </div>
    </div>
  )
}
