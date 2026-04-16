"use client"

import { useEffect, useMemo } from "react"
import { CalendarDays, List, Play, CheckCircle2, ChevronRight, BarChart2, Globe } from "lucide-react"
import ExamesDashboardTab from "./dashboard-tab"
import VagasTab from "./vagas-tab"
import AgendamentoTab from "./agendamento-tab"
import ChegadaTab from "./chegada-tab"
import FilaTab from "./fila-tab"
import HistoricoTab from "./historico-tab"
import SisregTab from "./sisreg-tab"
import PacientesTab from "./pacientes-tab"
import { useAuth } from "@/lib/auth-context"
import { useTabContext } from "@/lib/tab-context"

export default function ExamesHubPage() {
  const { user } = useAuth()
  const { activeTab, setActiveTab, setTabs, setModuleName } = useTabContext()

  const tabs = useMemo(() => [
    { id: "dashboard", label: "Dashboard", icon: BarChart2, adminOnly: false },
    { id: "pacientes", label: "Pacientes", icon: List, adminOnly: false },
    { id: "vagas", label: "Config. Vagas", icon: CheckCircle2, adminOnly: false },
    { id: "sisreg", label: "Pacientes SISREG", icon: Globe, adminOnly: false },
    { id: "agendamento", label: "Agendamentos", icon: CalendarDays, adminOnly: false },
    { id: "chegada", label: "Recepção / Chegada", icon: List, adminOnly: false },
    { id: "fila", label: "Fila de Atendimento", icon: Play, adminOnly: false },
    { id: "historico", label: "Historico", icon: List, adminOnly: false },
  ], [])

  const visibleTabs = useMemo(() => tabs.filter(t => !t.adminOnly || user?.role === "admin"), [tabs, user])

  useEffect(() => {
    setModuleName("Gestão de Exames")
    setTabs(visibleTabs)
    if (!activeTab || !visibleTabs.find(t => t.id === activeTab)) {
      setActiveTab("dashboard")
    }

    return () => {
      setTabs([])
      setModuleName("")
    }
  }, [visibleTabs, setTabs, setModuleName, setActiveTab, activeTab])

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Compact Header */}
      <div className="flex items-center gap-3">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00FF88] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00FF88]"></span>
        </span>
        <p className="text-xs font-bold text-[#7E8C9A] uppercase tracking-widest">Painel operacional em tempo real</p>
      </div>

      <div className="pt-2">
        {activeTab === "dashboard" && <ExamesDashboardTab />}
        {activeTab === "pacientes" && <PacientesTab />}
        {activeTab === "vagas" && <VagasTab />}
        {activeTab === "sisreg" && <SisregTab />}
        {activeTab === "agendamento" && <AgendamentoTab />}
        { activeTab === "chegada" && <ChegadaTab />}
        { activeTab === "fila" && <FilaTab />}
        { activeTab === "historico" && <HistoricoTab />}
      </div>
    </div>
  )
}

