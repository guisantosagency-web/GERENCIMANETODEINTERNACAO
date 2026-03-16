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
  CheckCircle2, 
  XCircle, 
  Users, 
  Calendar,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  FileText
} from "lucide-react"

export default function DashboardTab() {
  const supabase = useMemo(() => createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!), [])
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any[]>([])
  
  const [filter, setFilter] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    day: new Date().getDate()
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
      const yearMatch = d.getFullYear() === filter.year
      const monthMatch = (d.getMonth() + 1) === filter.month
      const dayMatch = d.getDate() === filter.day
      return yearMatch && monthMatch && dayMatch
    })

    const total = filtered.length
    const launched = filtered.filter(r => r.is_launched).length
    const pending = total - launched
    const rate = total > 0 ? (launched / total) * 100 : 0

    return { total, launched, pending, rate }
  }, [data, filter])

  const chartData = [
    { name: "Lançados", value: stats.launched, color: "#10b981" },
    { name: "Não Lançados", value: stats.pending, color: "#ef4444" }
  ]

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Time Filters */}
      <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100 flex flex-wrap items-center justify-center gap-8">
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-black uppercase text-slate-400">Dia</span>
          <select 
            value={filter.day}
            onChange={e => setFilter(p => ({ ...p, day: parseInt(e.target.value) }))}
            className="h-14 bg-slate-50 px-6 rounded-2xl font-black text-slate-700 focus:outline-none border-none"
          >
            {Array.from({ length: 31 }, (_, i) => i + 1).map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-black uppercase text-slate-400">Mês</span>
          <select 
            value={filter.month}
            onChange={e => setFilter(p => ({ ...p, month: parseInt(e.target.value) }))}
            className="h-14 bg-slate-50 px-6 rounded-2xl font-black text-slate-700 focus:outline-none border-none"
          >
            {["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"].map((m, i) => (
              <option key={i} value={i + 1}>{m}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-black uppercase text-slate-400">Ano</span>
          <select 
            value={filter.year}
            onChange={e => setFilter(p => ({ ...p, year: parseInt(e.target.value) }))}
            className="h-14 bg-slate-50 px-6 rounded-2xl font-black text-slate-700 focus:outline-none border-none"
          >
            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={<Users className="h-6 w-6" />}
          label="Total de Atendimentos"
          value={stats.total}
          color="blue"
        />
        <StatCard 
          icon={<CheckCircle2 className="h-6 w-6" />}
          label="Lançados"
          value={stats.launched}
          color="emerald"
        />
        <StatCard 
          icon={<XCircle className="h-6 w-6" />}
          label="Não Lançados"
          value={stats.pending}
          color="red"
        />
        <StatCard 
          icon={<TrendingUp className="h-6 w-6" />}
          label="Taxa de Eficiência"
          value={`${stats.rate.toFixed(1)}%`}
          color="indigo"
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
    </div>
  )
}

function StatCard({ icon, label, value, color }: any) {
  const colors: any = {
    blue: "bg-blue-500 text-blue-500 bg-blue-50 border-blue-100",
    emerald: "bg-emerald-500 text-emerald-500 bg-emerald-50 border-emerald-100",
    red: "bg-red-500 text-red-500 bg-red-50 border-red-100",
    indigo: "bg-indigo-500 text-indigo-500 bg-indigo-50 border-indigo-100"
  }

  return (
    <div className={`p-8 rounded-[3rem] border transition-all hover:scale-[1.02] ${colors[color].split(' ')[2]} ${colors[color].split(' ')[3]}`}>
      <div className="flex items-center gap-5">
        <div className={`p-4 rounded-2xl text-white ${colors[color].split(' ')[0]}`}>
          {icon}
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 opacity-60 mb-1">{label}</p>
          <p className="text-3xl font-black font-space text-slate-800 tracking-tight">{value}</p>
        </div>
      </div>
    </div>
  )
}
