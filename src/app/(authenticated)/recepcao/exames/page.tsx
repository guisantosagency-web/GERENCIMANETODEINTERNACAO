"use client"

import { useState } from "react"
import { CalendarDays, List, Play, CheckCircle2, ChevronRight, BarChart2 } from "lucide-react"
import ExamesDashboardTab from "./dashboard-tab"
import VagasTab from "./vagas-tab"
import AgendamentoTab from "./agendamento-tab"
import ChegadaTab from "./chegada-tab"
import FilaTab from "./fila-tab"
import HistoricoTab from "./historico-tab"
import ResultadosTab from "./resultados-tab"
import { useAuth } from "@/lib/auth-context"

export default function ExamesHubPage() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const { user } = useAuth()

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: BarChart2, adminOnly: false },
    { id: "vagas", label: "Config. Vagas", icon: CheckCircle2, adminOnly: true },
    { id: "agendamento", label: "Agendamentos", icon: CalendarDays, adminOnly: false },
    { id: "chegada", label: "Recepção / Chegada", icon: List, adminOnly: false },
    { id: "fila", label: "Fila de Atendimento", icon: Play, adminOnly: false },
    { id: "resultados", label: "Entrega de Resultados", icon: CheckCircle2, adminOnly: false },
    { id: "historico", label: "Historico", icon: List, adminOnly: false },
  ]

  const visibleTabs = tabs.filter(t => !t.adminOnly || user?.role === "admin")

  return (
    <div className="space-y-8 pb-24">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-500 border border-purple-500/20 text-[10px] font-black uppercase tracking-widest">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
            </span>
            Módulo Recepção
          </div>
          <h1 className="text-5xl lg:text-6xl font-black font-space tracking-tight gradient-text">Gestão de Exames</h1>
          <p className="text-muted-foreground font-medium text-lg max-w-xl">Fluxo completo de vagas, agendamentos, recepção e fila.</p>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {visibleTabs.map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 rounded-full font-bold text-sm tracking-wide transition-all whitespace-nowrap border ${isActive ? 'bg-purple-600 border-purple-500 text-white shadow-premium scale-105' : 'bg-card/50 border-white/5 text-muted-foreground hover:bg-card hover:text-foreground'}`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      <div className="pt-2 animate-in fade-in zoom-in-95 duration-500">
        {activeTab === "dashboard" && <ExamesDashboardTab />}
        {activeTab === "vagas" && <VagasTab />}
        {activeTab === "agendamento" && <AgendamentoTab />}
        { activeTab === "chegada" && <ChegadaTab />}
        { activeTab === "fila" && <FilaTab />}
        { activeTab === "resultados" && <ResultadosTab />}
        { activeTab === "historico" && <HistoricoTab />}
      </div>
    </div>
  )
}
