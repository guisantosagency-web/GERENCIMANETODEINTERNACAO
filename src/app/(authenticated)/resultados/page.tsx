"use client"
import ResultadosTab from "../recepcao/exames/resultados-tab"
import { PackageCheck } from "lucide-react"

export default function ResultadosPage() {
  return (
    <div className="space-y-8 pb-24">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-black uppercase tracking-widest">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Módulo Resultados
          </div>
          <h1 className="text-5xl lg:text-5xl font-black font-space tracking-tight gradient-text">Entrega de Exames</h1>
          <p className="text-muted-foreground font-medium text-lg max-w-xl">Controle centralizado de entrega de resultados para Pacientes.</p>
        </div>
      </div>

      <ResultadosTab />
    </div>
  )
}
