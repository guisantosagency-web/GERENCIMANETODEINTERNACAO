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
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header-like title area (Reduced since we have the Top Header) */}
      <div className="flex flex-col gap-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF6B35]/10 text-[#FF6B35] border border-[#FF6B35]/20 text-[10px] font-black uppercase tracking-[0.2em] w-fit">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF6B35] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF6B35]"></span>
          </span>
          Terminal de Controle
        </div>
        <div className="space-y-1">
           <h1 className="text-4xl lg:text-5xl font-black font-space tracking-tight text-white uppercase">
              Fluxo de <span className="text-[#FF6B35]">Atendimento</span>
           </h1>
           <p className="text-[#7E8C9A] font-bold text-sm max-w-xl uppercase tracking-wider opacity-60">Operação em tempo real de agendamentos e recepção.</p>
        </div>
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

